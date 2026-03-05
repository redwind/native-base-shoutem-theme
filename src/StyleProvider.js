import React, { Children } from 'react';
import PropTypes from 'prop-types';
import Theme from './Theme';
import { ThemeContext } from './StyleContext';

/**
 *  Provides a theme to child components through context.
 */
export default class StyleProvider extends React.Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
    style: PropTypes.object,
  };

  static defaultProps = {
    style: {},
  };

  constructor(props) {
    super(props);
    this.state = {
      theme: this.createTheme(props),
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.style !== this.props.style) {
      this.setState({
        theme: this.createTheme(this.props),
      });
    }
  }

  createTheme(props) {
    return new Theme(props.style);
  }

  render() {
    const { children } = this.props;
    return (
      <ThemeContext.Provider value={this.state.theme}>
        {Children.only(children)}
      </ThemeContext.Provider>
    );
  }
}
