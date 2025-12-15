import React, { Children } from 'react';
import PropTypes from 'prop-types';
import Theme, { ThemeShape } from './Theme';
import normalizeStyle from './StyleNormalizer/normalizeStyle';

/**
 * Theme context for providing theme to child components.
 */
export const ThemeContext = React.createContext(null);

/**
 *  Provides a theme to child components trough context.
 */
export default class StyleProvider extends React.Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
    style: PropTypes.object,
  };

  static defaultProps = {
    style: {},
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      theme: this.createTheme(props),
      prevStyle: props.style,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.style !== prevState.prevStyle) {
      return {
        theme: new Theme(nextProps.style),
        prevStyle: nextProps.style,
      };
    }
    return null;
  }

  createTheme(props) {
    return new Theme(props.style);
  }

  render() {
    const { children } = this.props;
    const { theme } = this.state;

    return (
      <ThemeContext.Provider value={theme}>
        {Children.only(children)}
      </ThemeContext.Provider>
    );
  }
}
