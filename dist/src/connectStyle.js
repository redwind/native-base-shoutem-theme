Object.defineProperty(exports,"__esModule",{value:true});var _extends=Object.assign||function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source){if(Object.prototype.hasOwnProperty.call(source,key)){target[key]=source[key];}}}return target;};var _slicedToArray=function(){function sliceIterator(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[typeof Symbol==='function'?Symbol.iterator:'@@iterator'](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"])_i["return"]();}finally{if(_d)throw _e;}}return _arr;}return function(arr,i){if(Array.isArray(arr)){return arr;}else if((typeof Symbol==='function'?Symbol.iterator:'@@iterator')in Object(arr)){return sliceIterator(arr,i);}else{throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();exports.












clearThemeCache=clearThemeCache;var _react=require('react');var _react2=_interopRequireDefault(_react);var _hoistNonReactStatics=require('hoist-non-react-statics');var _hoistNonReactStatics2=_interopRequireDefault(_hoistNonReactStatics);var _lodash=require('lodash');var _lodash2=_interopRequireDefault(_lodash);var _StyleContext=require('./StyleContext');var _Theme=require('./Theme');var _Theme2=_interopRequireDefault(_Theme);var _resolveComponentStyle=require('./resolveComponentStyle');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _toConsumableArray(arr){if(Array.isArray(arr)){for(var i=0,arr2=Array(arr.length);i<arr.length;i++){arr2[i]=arr[i];}return arr2;}else{return Array.from(arr);}}var themeCache={};function clearThemeCache(){
themeCache={};
}




function throwConnectStyleError(errorMessage,componentDisplayName){
throw Error(
errorMessage+' - when connecting '+componentDisplayName+' component to style.');

}

function isStyleVariant(propertyName){
return /^\./.test(propertyName);
}

function isChildStyle(propertyName){
return /(^[^\.].*\.)|^\*$/.test(propertyName);
}

function getConcreteStyle(style){
return _lodash2.default.pickBy(style,function(_value,key){
return!isStyleVariant(key)&&!isChildStyle(key);
});
}exports.default=















function(
componentStyleName)



{var componentStyle=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};var mapPropsToStyleNames=arguments[2];var options=arguments.length>3&&arguments[3]!==undefined?arguments[3]:{};
function getComponentDisplayName(WrappedComponent){
return WrappedComponent.displayName||WrappedComponent.name||'Component';
}

return function wrapWithStyledComponent(WrappedComponent){
var componentDisplayName=getComponentDisplayName(WrappedComponent);

if(!_lodash2.default.isPlainObject(componentStyle)){
throwConnectStyleError(
'Component style must be plain object',
componentDisplayName);

}

if(!_lodash2.default.isString(componentStyleName)){
throwConnectStyleError(
'Component Style Name must be string',
componentDisplayName);

}

function resolveStyleForComponent(theme,parentPath,styleNames){
var parentStyle={};
var themeStyle=theme.createComponentStyle(
componentStyleName,
componentStyle);


if(parentPath){
parentStyle=themeCache[parentPath.join('>')];
}else{
parentStyle=(0,_resolveComponentStyle.resolveComponentStyle)(
componentStyleName,
styleNames,
themeStyle,
parentStyle);

}

return(0,_resolveComponentStyle.resolveComponentStyle)(
componentStyleName,
styleNames,
themeStyle,
parentStyle);

}

function getOrSetStylesInCache(theme,parentPath,styleNames,path){
var cacheKey=path.join('>');
if(themeCache&&themeCache[cacheKey]){
return themeCache[cacheKey];
}
var resolvedStyle=resolveStyleForComponent(theme,parentPath,styleNames);
if(Object.keys(themeCache).length<10000){
themeCache[cacheKey]=resolvedStyle;
}
return resolvedStyle;
}

function computeFinalStyle(theme,parentPath,style,styleNames){
var resolvedStyle=void 0;
if(parentPath){
resolvedStyle=getOrSetStylesInCache(
theme,
parentPath,
styleNames,[].concat(_toConsumableArray(
parentPath),[componentStyleName],_toConsumableArray(styleNames)));

}else{
resolvedStyle=resolveStyleForComponent(theme,parentPath,styleNames);
themeCache[componentStyleName]=resolvedStyle;
}

var concreteStyle=getConcreteStyle(_lodash2.default.merge({},resolvedStyle));

if(_lodash2.default.isArray(style)){
return[concreteStyle].concat(_toConsumableArray(style));
}
if(typeof style==='number'||typeof style==='object'){
return[concreteStyle,style];
}
return concreteStyle;
}

function StyledComponent(props){
var contextTheme=(0,_react.useContext)(_StyleContext.ThemeContext);
var parentPath=(0,_react.useContext)(_StyleContext.ParentPathContext);

var theme=contextTheme||_Theme2.default.getDefaultTheme();
var wrappedInstanceRef=(0,_react.useRef)(null);


var booleanStyleNames=[];
for(var _iterator=Object.entries(props),_isArray=Array.isArray(_iterator),_i=0,_iterator=_isArray?_iterator:_iterator[typeof Symbol==='function'?Symbol.iterator:'@@iterator']();;){var _ref3;if(_isArray){if(_i>=_iterator.length)break;_ref3=_iterator[_i++];}else{_i=_iterator.next();if(_i.done)break;_ref3=_i.value;}var _ref=_ref3;var _ref2=_slicedToArray(_ref,2);var key=_ref2[0];var value=_ref2[1];
if(typeof value!=='object'&&value===true){
booleanStyleNames.push('.'+key);
}
}
var styleNamesKey=booleanStyleNames.join(',');


var parentPathKey=JSON.stringify(parentPath);

var finalStyle=(0,_react.useMemo)(
function(){return computeFinalStyle(theme,parentPath,props.style,booleanStyleNames);},

[props.style,props.styleName,theme,parentPathKey,styleNamesKey]);


var newParentPath=(0,_react.useMemo)(function(){
if(!parentPath){
return[componentStyleName];
}
return[].concat(_toConsumableArray(parentPath),[componentStyleName],booleanStyleNames);

},[parentPathKey,styleNamesKey]);

var setWrappedInstance=(0,_react.useCallback)(function(component){
if(component&&component._root){
wrappedInstanceRef.current=component._root;
}else{
wrappedInstanceRef.current=component;
}
},[]);

return(
_react2.default.createElement(_StyleContext.ParentPathContext.Provider,{value:newParentPath},
_react2.default.createElement(WrappedComponent,_extends({},
props,{
style:finalStyle,
ref:setWrappedInstance}))));



}

StyledComponent.displayName='Styled('+componentDisplayName+')';
StyledComponent.WrappedComponent=WrappedComponent;

return(0,_hoistNonReactStatics2.default)(StyledComponent,WrappedComponent);
};
};
//# sourceMappingURL=connectStyle.js.map