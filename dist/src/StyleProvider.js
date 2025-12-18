Object.defineProperty(exports,"__esModule",{value:true});exports.ThemeContext=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _react=require('react');var _react2=_interopRequireDefault(_react);
var _propTypes=require('prop-types');var _propTypes2=_interopRequireDefault(_propTypes);
var _Theme=require('./Theme');var _Theme2=_interopRequireDefault(_Theme);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}




var ThemeContext=exports.ThemeContext=_react2.default.createContext(null);var




StyleProvider=function(_React$Component){_inherits(StyleProvider,_React$Component);









function StyleProvider(props,context){_classCallCheck(this,StyleProvider);var _this=_possibleConstructorReturn(this,(StyleProvider.__proto__||Object.getPrototypeOf(StyleProvider)).call(this,
props,context));
_this.state={
theme:_this.createTheme(props),
prevStyle:props.style};return _this;

}_createClass(StyleProvider,[{key:'createTheme',value:function createTheme(











props){
return new _Theme2.default(props.style);
}},{key:'render',value:function render()

{var
children=this.props.children;var
theme=this.state.theme;

return(
_react2.default.createElement(ThemeContext.Provider,{value:theme},
_react.Children.only(children)));


}}],[{key:'getDerivedStateFromProps',value:function getDerivedStateFromProps(nextProps,prevState){if(nextProps.style!==prevState.prevStyle){return{theme:new _Theme2.default(nextProps.style),prevStyle:nextProps.style};}return null;}}]);return StyleProvider;}(_react2.default.Component);StyleProvider.propTypes={children:_propTypes2.default.element.isRequired,style:_propTypes2.default.object};StyleProvider.defaultProps={style:{}};exports.default=StyleProvider;
//# sourceMappingURL=StyleProvider.js.map