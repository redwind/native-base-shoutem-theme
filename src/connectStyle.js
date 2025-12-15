import React from 'react';
import PropTypes from 'prop-types';
import hoistStatics from 'hoist-non-react-statics';
import * as _ from 'lodash';
import normalizeStyle from './StyleNormalizer/normalizeStyle';
import { StyleSheet } from "react-native";

import Theme, { ThemeShape } from "./Theme";
import { resolveComponentStyle } from "./resolveComponentStyle";
import { ThemeContext } from "./StyleProvider";

let themeCache = {};

/**
 * Parent path context for providing parent path to child components.
 */
export const ParentPathContext = React.createContext(null);

/**
 * clear theme cache
 * @export
 */
export function clearThemeCache() {
  themeCache = {};
}

/**
 * Formats and throws an error when connecting component style with the theme.
 *
 * @param errorMessage The error message.
 * @param componentDisplayName The name of the component that is being connected.
 */
function throwConnectStyleError(errorMessage, componentDisplayName) {
  throw Error(
    `${errorMessage} - when connecting ${componentDisplayName} component to style.`
  );
}

/**
 * Returns the theme object from the provided context value,
 * or an empty theme if the context doesn't contain a theme.
 *
 * @param theme The theme from ThemeContext.
 * @returns {Theme} The Theme object.
 */
function getTheme(theme) {
  // Fallback to a default theme if the component isn't
  // rendered in a StyleProvider.
  return theme || Theme.getDefaultTheme();
}

/**
 * Matches any style properties that represent component style variants.
 * Those styles can be applied to the component by using the styleName
 * prop. All style variant property names must start with a single '.'
 * character, e.g., '.variant'.
 *
 * @param propertyName The style property name.
 * @returns {boolean} True if the style property represents a component variant, false otherwise.
 */
function isStyleVariant(propertyName) {
  return /^\./.test(propertyName);
}

/**
 * Matches any style properties that represent style rules that target the
 * component children. Those styles can have two formats, they can either
 * target the components by component name ('shoutem.ui.Text'), or by component
 * name and variant ('shoutem.ui.Text.line-through'). Beside specifying the
 * component name, those styles can also target any component by using the
 * '*' wildcard ('*', or '*.line-through'). The rule to identify those styles is
 * that they have to contain a '.' character in their name or be a '*'.
 *
 * @param propertyName The style property name.
 * @returns {boolean} True if the style property represents a child style, false otherwise.
 */
function isChildStyle(propertyName) {
  return /(^[^\.].*\.)|^\*$/.test(propertyName);
}

function getConcreteStyle(style) {
  return _.pickBy(style, (value, key) => {
    return !isStyleVariant(key) && !isChildStyle(key);
  });
}

/**
 * Resolves the final component style by using the theme style, if available and
 * merging it with the style provided directly through the style prop, and style
 * variants applied through the styleName prop.
 *
 * @param componentStyleName The component name that will be used
 * to target this component in style rules.
 * @param componentStyle The default component style.
 * @param mapPropsToStyleNames Pure function to customize styleNames depending on props.
 * @param options The additional connectStyle options
 * @param options.virtual The default value of the virtual prop
 * @param options.withRef Create component ref with addedProps; if true, ref name is wrappedInstance
 * @returns {StyledComponent} The new component that will handle
 * the styling of the wrapped component.
 */
export default (
  componentStyleName,
  componentStyle = {},
  mapPropsToStyleNames,
  options = {}
) => {
  function getComponentDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || "Component";
  }

  return function wrapWithStyledComponent(WrappedComponent) {
    const componentDisplayName = getComponentDisplayName(WrappedComponent);

    if (!_.isPlainObject(componentStyle)) {
      throwConnectStyleError(
        "Component style must be plain object",
        componentDisplayName
      );
    }

    if (!_.isString(componentStyleName)) {
      throwConnectStyleError(
        "Component Style Name must be string",
        componentDisplayName
      );
    }

    class StyledComponent extends React.Component {
      static propTypes = {
        // Element style that overrides any other style of the component
        style: PropTypes.oneOfType([
          PropTypes.object,
          PropTypes.number,
          PropTypes.array
        ]),
        // The style variant names to apply to this component,
        // multiple variants may be separated with a space character
        styleName: PropTypes.string,
        // Virtual elements will propagate the parent
        // style to their children, i.e., the children
        // will behave as they are placed directly below
        // the parent of a virtual element.
        virtual: PropTypes.bool
      };

      static defaultProps = {
        virtual: options.virtual
      };

      static displayName = `Styled(${componentDisplayName})`;
      static WrappedComponent = WrappedComponent;

      constructor(props) {
        super(props);
        this.setWrappedInstance = this.setWrappedInstance.bind(this);
        this.resolveConnectedComponentStyle = this.resolveConnectedComponentStyle.bind(
          this
        );
        this.state = {
          // AddedProps are additional WrappedComponent props
          // Usually they are set trough alternative ways,
          // such as theme style, or trough options
          addedProps: this.resolveAddedProps(),
        };
        this.lastTheme = null;
        this.lastParentPath = null;
        this.lastProps = null;
        this.cachedStyle = null;
      }

      getFinalStyle(props, theme, parentPath, style, styleNames) {
        let resolvedStyle = {};
        if (parentPath) {
          resolvedStyle = this.getOrSetStylesInCache(
            theme,
            parentPath,
            props,
            styleNames,
            [...parentPath, componentStyleName, ...styleNames]
          );
        } else {
          resolvedStyle = this.resolveStyle(theme, parentPath, props, styleNames);
          themeCache[componentStyleName] = resolvedStyle;
        }

        const concreteStyle = getConcreteStyle(_.merge({}, resolvedStyle));

        if (_.isArray(style)) {
          return [concreteStyle, ...style];
        }

        if (typeof style == "number" || typeof style == "object") {
          return [concreteStyle, style];
        }

        return concreteStyle;
      }

      getStyleNames(props) {
        const styleNamesArr = _.map(props, (value, key) => {
          if (typeof value !== "object" && value === true) {
            return "." + key;
          } else {
            return false;
          }
        });
        _.remove(styleNamesArr, (value, index) => {
          return value === false;
        });

        return styleNamesArr;
      }

      getParentPath(parentPath) {
        if (!parentPath) {
          return [componentStyleName];
        } else {
          return [
            ...parentPath,
            componentStyleName,
            ...this.getStyleNames(this.props)
          ];
        }
      }

      componentDidUpdate(prevProps) {
        // Clear cache if props changed significantly
        if (prevProps.style !== this.props.style || 
            prevProps.styleName !== this.props.styleName) {
          this.cachedStyle = null;
        }
      }

      setNativeProps(nativeProps) {
        if (this.wrappedInstance.setNativeProps) {
          this.wrappedInstance.setNativeProps(nativeProps);
        }
      }

      setWrappedInstance(component) {
        if (component && component._root) {
          this._root = component._root;
        } else {
          this._root = component;
        }
        this.wrappedInstance = this._root;
      }

      hasStyleNameChanged(nextProps, styleNames) {
        if (!mapPropsToStyleNames) {
          return false;
        }
        const prevStyleNames = this.lastProps ? this.getStyleNames(this.lastProps) : [];
        return (
          this.lastProps !== nextProps &&
          // Even though props did change here,
          // it doesn't necessary means changed props are those which affect styleName
          !_.isEqual(prevStyleNames, styleNames)
        );
      }

      shouldRebuildStyle(props, theme, parentPath, styleNames) {
        return (
          (this.lastProps && props.style !== this.lastProps.style) ||
          (this.lastProps && props.styleName !== this.lastProps.styleName) ||
          theme !== this.lastTheme ||
          !_.isEqual(parentPath, this.lastParentPath) ||
          this.hasStyleNameChanged(props, styleNames)
        );
      }

      resolveStyleNames(props) {
        const { styleName } = props;
        const styleNames = styleName ? styleName.split(/\s/g) : [];

        if (!mapPropsToStyleNames) {
          return styleNames;
        }

        // We only want to keep the unique style names
        return _.uniq(mapPropsToStyleNames(styleNames, props));
      }

      resolveAddedProps() {
        const addedProps = {};
        if (options.withRef) {
          addedProps.ref = "wrappedInstance";
        }
        return addedProps;
      }

      getOrSetStylesInCache(theme, parentPath, props, styleNames, path) {
        if (themeCache && themeCache[path.join(">")]) {
          // console.log('**************');

          return themeCache[path.join(">")];
        } else {
          const resolvedStyle = this.resolveStyle(theme, parentPath, props, styleNames);
          if (Object.keys(themeCache).length < 10000) {
            themeCache[path.join(">")] = resolvedStyle;
          }
          return resolvedStyle;
        }
      }

      resolveStyle(theme, parentPath, props, styleNames) {
        let parentStyle = {};

        const themeObj = getTheme(theme);
        const themeStyle = themeObj.createComponentStyle(
          componentStyleName,
          componentStyle
        );

        if (parentPath) {
          parentStyle = themeCache[parentPath.join(">")];
        } else {
          parentStyle = resolveComponentStyle(
            componentStyleName,
            styleNames,
            themeStyle,
            parentStyle
          );
        }

        return resolveComponentStyle(
          componentStyleName,
          styleNames,
          themeStyle,
          parentStyle
        );
      }

      /**
       * A helper function provided to child components that enables
       * them to resolve their style for any set of prop values.
       *
       * @param props The component props to use to resolve the style values.
       * @returns {*} The resolved component style.
       */
      resolveConnectedComponentStyle(props) {
        const styleNames = this.resolveStyleNames(props);
        return this.resolveStyle(this.lastTheme, this.lastParentPath, props, styleNames)
          .componentStyle;
      }

      render() {
        // console.log('themeCache', themeCache);

        // if(componentStyleName == 'NativeBase.Text') {
        //   console.log(this.state.style);
        //   console.log(themeCache);
        // }

        return (
          <ThemeContext.Consumer>
            {theme => (
              <ParentPathContext.Consumer>
                {parentPath => {
                  const styleNames = this.getStyleNames(this.props);
                  const style = this.props.style;
                  
                  // Compute style based on current context and props
                  let finalStyle;
                  if (this.cachedStyle && 
                      !this.shouldRebuildStyle(this.props, theme, parentPath, styleNames)) {
                    finalStyle = this.cachedStyle;
                  } else {
                    finalStyle = this.getFinalStyle(
                      this.props,
                      theme,
                      parentPath,
                      style,
                      styleNames
                    );
                    this.cachedStyle = finalStyle;
                    this.lastTheme = theme;
                    this.lastParentPath = parentPath;
                    this.lastProps = this.props;
                  }

                  const { addedProps } = this.state;
                  const currentParentPath = this.getParentPath(parentPath);

                  return (
                    <ParentPathContext.Provider value={currentParentPath}>
                      <WrappedComponent
                        {...this.props}
                        {...addedProps}
                        style={finalStyle}
                        ref={this.setWrappedInstance}
                      />
                    </ParentPathContext.Provider>
                  );
                }}
              </ParentPathContext.Consumer>
            )}
          </ThemeContext.Consumer>
        );
      }
    }

    return hoistStatics(StyledComponent, WrappedComponent);
  };
};
