import React, { useContext, useCallback, useMemo, useRef } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import _ from 'lodash';
import { ThemeContext, ParentPathContext } from './StyleContext';
import Theme from './Theme';
import { resolveComponentStyle } from './resolveComponentStyle';

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
 */
function throwConnectStyleError(errorMessage, componentDisplayName) {
  throw Error(
    `${errorMessage} - when connecting ${componentDisplayName} component to style.`
  );
}

function isStyleVariant(propertyName) {
  return /^\./.test(propertyName);
}

function isChildStyle(propertyName) {
  return /(^[^\.].*\.)|^\*$/.test(propertyName);
}

function getConcreteStyle(style) {
  return _.pickBy(style, (_value, key) => {
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
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
  }

  return function wrapWithStyledComponent(WrappedComponent) {
    const componentDisplayName = getComponentDisplayName(WrappedComponent);

    if (!_.isPlainObject(componentStyle)) {
      throwConnectStyleError(
        'Component style must be plain object',
        componentDisplayName
      );
    }

    if (!_.isString(componentStyleName)) {
      throwConnectStyleError(
        'Component Style Name must be string',
        componentDisplayName
      );
    }

    function resolveStyleForComponent(theme, parentPath, styleNames) {
      let parentStyle = {};
      const themeStyle = theme.createComponentStyle(
        componentStyleName,
        componentStyle
      );

      if (parentPath) {
        parentStyle = themeCache[parentPath.join('>')];
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

    function getOrSetStylesInCache(theme, parentPath, styleNames, path) {
      const cacheKey = path.join('>');
      if (themeCache && themeCache[cacheKey]) {
        return themeCache[cacheKey];
      }
      const resolvedStyle = resolveStyleForComponent(theme, parentPath, styleNames);
      if (Object.keys(themeCache).length < 10000) {
        themeCache[cacheKey] = resolvedStyle;
      }
      return resolvedStyle;
    }

    function computeFinalStyle(theme, parentPath, style, styleNames) {
      let resolvedStyle;
      if (parentPath) {
        resolvedStyle = getOrSetStylesInCache(
          theme,
          parentPath,
          styleNames,
          [...parentPath, componentStyleName, ...styleNames]
        );
      } else {
        resolvedStyle = resolveStyleForComponent(theme, parentPath, styleNames);
        themeCache[componentStyleName] = resolvedStyle;
      }

      const concreteStyle = getConcreteStyle(_.merge({}, resolvedStyle));

      if (_.isArray(style)) {
        return [concreteStyle, ...style];
      }
      if (typeof style === 'number' || typeof style === 'object') {
        return [concreteStyle, style];
      }
      return concreteStyle;
    }

    function StyledComponent(props) {
      const contextTheme = useContext(ThemeContext);
      const parentPath = useContext(ParentPathContext);

      const theme = contextTheme || Theme.getDefaultTheme();
      const wrappedInstanceRef = useRef(null);

      // Compute style names from boolean props (e.g. primary={true} → '.primary')
      const booleanStyleNames = [];
      for (const [key, value] of Object.entries(props)) {
        if (typeof value !== 'object' && value === true) {
          booleanStyleNames.push('.' + key);
        }
      }
      const styleNamesKey = booleanStyleNames.join(',');

      // Stringify parentPath for stable deep-equality comparison in useMemo
      const parentPathKey = JSON.stringify(parentPath);

      const finalStyle = useMemo(
        () => computeFinalStyle(theme, parentPath, props.style, booleanStyleNames),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.style, props.styleName, theme, parentPathKey, styleNamesKey]
      );

      const newParentPath = useMemo(() => {
        if (!parentPath) {
          return [componentStyleName];
        }
        return [...parentPath, componentStyleName, ...booleanStyleNames];
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [parentPathKey, styleNamesKey]);

      const setWrappedInstance = useCallback((component) => {
        if (component && component._root) {
          wrappedInstanceRef.current = component._root;
        } else {
          wrappedInstanceRef.current = component;
        }
      }, []);

      return (
        <ParentPathContext.Provider value={newParentPath}>
          <WrappedComponent
            {...props}
            style={finalStyle}
            ref={setWrappedInstance}
          />
        </ParentPathContext.Provider>
      );
    }

    StyledComponent.displayName = `Styled(${componentDisplayName})`;
    StyledComponent.WrappedComponent = WrappedComponent;

    return hoistStatics(StyledComponent, WrappedComponent);
  };
};
