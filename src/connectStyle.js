import React from 'react';
import PropTypes from 'prop-types';
import hoistStatics from 'hoist-non-react-statics';
import * as _ from 'lodash';
import normalizeStyle from './StyleNormalizer/normalizeStyle';
import { StyleSheet } from "react-native";

import Theme from "./Theme";
import { resolveComponentStyle } from "./resolveComponentStyle";
import { ThemeContext } from "./StyleProvider";

let themeCache = {};

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
 * Returns the theme object from the provided theme value,
 * or an empty theme if the theme value is null.
 *
 * @param themeValue The theme value from ThemeContext (can be null).
 * @returns {Theme} The Theme object.
 */
function getTheme(themeValue) {
  // Fallback to a default theme if the component isn't
  // rendered in a StyleProvider.
  return themeValue || Theme.getDefaultTheme();
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
      static contextType = ThemeContext;

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

      constructor(props, context) {
        super(props, context);
        const styleNames = this.getStyleNames(props);
        const style = props.style;
        const theme = context;

        const finalStyle = this.getFinalStyle(
          props,
          theme,
          style,
          styleNames
        );

        this.setWrappedInstance = this.setWrappedInstance.bind(this);
        this.resolveConnectedComponentStyle = this.resolveConnectedComponentStyle.bind(
          this
        );
        this.state = {
          style: finalStyle,
          // AddedProps are additional WrappedComponent props
          // Usually they are set trough alternative ways,
          // such as theme style, or trough options
          addedProps: this.resolveAddedProps(),
          styleNames
        };
      }

      getFinalStyle(props, theme, style, styleNames) {
        const resolvedStyle = this.resolveStyle(theme, props, styleNames);
        themeCache[componentStyleName] = resolvedStyle;

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

      UNSAFE_componentWillReceiveProps(nextProps) {
        const styleNames = this.getStyleNames(nextProps);
        const style = nextProps.style;
        const theme = this.context;
        
        if (this.shouldRebuildStyle(nextProps, theme, styleNames)) {
          const finalStyle = this.getFinalStyle(
            nextProps,
            theme,
            style,
            styleNames
          );

          this.setState({
            style: finalStyle,
            styleNames
          });
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
        return (
          mapPropsToStyleNames &&
          this.props !== nextProps &&
          // Even though props did change here,
          // it doesn't necessary means changed props are those which affect styleName
          !_.isEqual(this.state.styleNames, styleNames)
        );
      }

      shouldRebuildStyle(nextProps, theme, styleNames) {
        return (
          nextProps.style !== this.props.style ||
          nextProps.styleName !== this.props.styleName ||
          theme !== this.context ||
          this.hasStyleNameChanged(nextProps, styleNames)
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

      resolveStyle(theme, props, styleNames) {
        const themeObj = getTheme(theme);
        const themeStyle = themeObj.createComponentStyle(
          componentStyleName,
          componentStyle
        );

        const parentStyle = resolveComponentStyle(
          componentStyleName,
          styleNames,
          themeStyle,
          {}
        );

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
        const theme = this.context;
        return this.resolveStyle(theme, props, styleNames)
          .componentStyle;
      }

      render() {
        // console.log('themeCache', themeCache);

        // if(componentStyleName == 'NativeBase.Text') {
        //   console.log(this.state.style);
        //   console.log(themeCache);
        // }

        const { addedProps, style } = this.state;
        return (
          <WrappedComponent
            {...this.props}
            {...addedProps}
            style={style}
            ref={this.setWrappedInstance}
          />
        );
      }
    }

    return hoistStatics(StyledComponent, WrappedComponent);
  };
};
