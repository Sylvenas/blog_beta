---
title: react jsx
categories: React
date: 2018-09-11
---
当你在查看React的例子时候，可能已经见过JSX了。但React代码也可以用纯JS代码来编写：
``` js
const rootElement =
  React.createElement('div', {},
    React.createElement('h1', {style: {color: 'red'}}, 'The world is yours'),
    React.createElement('p', {}, 'Say hello to my little friend')
  )

ReactDOM.render(rootElement, document.getElementById('app'))
```

有些人不喜欢将整个标记代码编写为函数调用。这可能是为什么Facebook上的人想出了JSX - 一个`React.createElement(type, config, …children)的语法糖方法`。 这就是为什么我们可以重构上面的例子：

>这也就是render不能return两个元素(或组件)的原因，因为一个函数绝不可能有两个返回值

``` js
const RootElement = (
  <div>
    <h1 style={{color:'red'}}>The world is yours</h1>
    <p>Say hello to my little friend</p>
  </div>
);

ReactDOM.render(RootElement, document.getElementById('app'));
```
在构建过程中Babel会将标记转换为纯JS代码。

### React.createElement源码分析
[源代码GitHub地址](https://github.com/facebook/react/blob/master/packages/react/src/ReactElement.js)

首先看`createElement`函数,有三个参数，第一个是组件的类型，第二个是配置项(除了ref和key都会被添加到props属性上))，第三个是children
``` js
// type可以是react组件，也可以是span之类的标签字符串
export function createElement(type, config, children) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    // Remaining properties are added to a new props object
    // 把config传进去的对象的键值对添加到props中，注意剔除key和ref
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  // children 可能是1个或者多个元素
  // 如果是一个则直接把子元素赋值给children属性
  // 如果是多个元素，则先把元素转换为数组，然后赋值给children属性
  // 所以我们在使用this.props.children属性的时候，可能是一个对象，也可能一个数组，也可能是undefined
  // 绝不能当成一个数组直接使用
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  // Resolve default props
  // 把defaultProps添加到props中，注意检查时候已经包含对应的props了
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}

const ReactElement = function (type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner,
  };
  return element;
};
```
从上面的代码也能看出来实际上，`React.createElement`方法就是返回了一个普通的对象，这个对象上主要有`type`,`key`,`ref`,`props`这几个关键属性。

其中type为字符串的时候，表示为dom节点(JSX为小写开头)，type为函数那么就是自定义组件(JSX为大写开头)。

而我们经常使用组件的方法：`<Button>click me</Button>`,实际上就是一个对组件实例化的过程，也就是创建了一个对象用来表述这个组件。

这也就是React虚拟DOM的本质，即：用JavaScript对象来描述DOM结构和属性。

### JSX和HTML的区别
* 属性 - JSX不是一种语言，仅仅是`createElement`函数的语法糖，也就是需要转义成JavaScript,由于这一点，有些属性无法使用，需要用className来代替class,htmlFor来代替for,因为class和for是JavaScript关键字
* 样式 - 与HTML不同，样式属性期望传入Javascript对象，而不是CSS字符串，而且样式名的写法为驼峰式命名法
* 根元素 - JSX将会被转义为JavaScript函数，而一个函数不可能有两个返回值，因此有多个同级元素必须把他们包裹在一个父元素中，如果不想无谓的增加一个div元素，也可以使用`React.Fragment`来包裹起来
* 空格 - 看下面的代码：
``` html
<div>
  <span>foo</span>
  bar
  <span>bar</span>
</div>
```
如果是浏览器直接把上面的代码当成HTML来解析的话，会显示`foo bar bar`,注意其中是有空格的，而如果是在JSX中写这段代码，则会显示`foobarbar`没有将空格计算在内，如果要加入空格，除非在JSX中显式的插入空格：
``` js
<div>
  <span>foo</span>
  {' '}
  bar
  {' '}
  <span>bar</span>
</div>
```
* 布尔属性值 - 在JSX中如果某个属性没有赋值，则会默认认为该属性值为true,类似于HTML属性中的disabled，这也就意味着如果想把属性值设置为false，则需要显式的声明为false,这个地方通常会让人感到困惑，因为我们通常认为遗漏的属性值应该为false
* 展开属性 - 向子元素传递数据时，不要按引用方式传递整个JavaScript对象，而是要使用对象的基本类型值，以方便校验，这种做法很常见，并且引发的bug更少，写出的组件更稳健且不容易出错。
``` js
const foo = {id : 'bar'};
return <div {...foo} />
```

### solution
JSX违背了关注点分离的原则，然后事实情况是自从ajax流行以来，DOM高度依赖从JS中接收到的数据来展示信息，样式也同样存在同样的问题，CSS选择器完全遵循了DOM标记结构来选择元素，几乎不可能在不影响其他文件的前提下修改某个文件，而这就是耦合，大多数情况下所谓的关注点分离实质上是一种技术上的分离，本质上并没有分离，而是一种感觉分离的假象。

React尝试更进一步，将模板放到其所属位置，即与逻辑在一起，也就是React建议你编写小型代码块的方式来组织应用，而这就是组件化开发。

此外，React还建议将样式的逻辑也放在组件中，也就是`CSS in JS`，不过这个概念颇具争议，现在并没有大规模的推广开。

React的最终目标是将创建组件所用到的技术都封装起来，来实现组建内高内聚，组件间低耦合的开发方式。
