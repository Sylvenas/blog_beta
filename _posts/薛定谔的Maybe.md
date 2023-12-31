---
title: 薛定谔的 Maybe - IO
categories: Monad
date: 2020-01-30
---

### 副作用
程序的可观察，而不是操作了一番然后睡觉去了

上篇文章中引入范畴学中`Functor`的概念，核心内容就是把一个值放入到一个`Box`中，然后不停的通过`map`函数来映射变换其中的值，而这就是一个最简单的`Identity Functor`,但是管他呢，我们还是叫它Box吧(多么简单形象)！

然后还举了个Either的例子，来说明Box理念在代码中实际用途，接下来介绍另外两个常用的`Box`:**`Maybe`**,**`IO`**

### Schrödinger's Maybe
![薛定谔的猫](./imgs/cat.jpeg)

> I call it my billion-dollar mistake. It was the invention of the null reference in 1965. -- Tony Hoare

在项目开发中无时不刻不在遇到`null`的问题,举个实际的例子，最近在做一个换肤的功能，需要根据用户的选择来动态的加载CSS主题样式，需要编写一个`getThemeForUser`函数，根据用户的之前的选择，从URL列表中中返回合适的URL，看个简单的代码描述：
``` js
const user = {
  id: 'hzxxxx',
  name: 'zhangsan',
  infos: {
    theme: 'red',
  },
};

const THEME_CSS_URLS = {
  'default': 'https://xxx.com/theme-default.css',
  'red': 'https://xxx.com/theme-red.css',
  'dark': 'https://xxx.com/theme-dark.css',
};

const getThemeForUser = user => {
    // TODO
}
```
在编写`getThemeForUser`函数之前，我们先考虑一下问题：
* 用户可能根本没有选择主题，而是使用的默认主题，`infos`对象中`theme`的value可能为null/undefined
* user本身也可能为null，用户还没有登陆
* 数据异常，给出的主题色，可能不在`THEME_CSS_URLS`中   

那么现在我们不得不处理很多个null/undefined,我们尝试编写第一个版本的`getThemeForUser`函数：
``` js
const getThemeForUser = user => {
  if (user == null) {        // 没有登录进来
    return THEME_CSS_URLS['default'];  // 返回默认主题
  }
  if (user.infos.theme && user.infos.theme != null) {
    if (THEME_CSS_URLS[user.infos.theme]) {   // 如果存在主题
      return THEME_CSS_URLS[user.infos.theme];
    } else {
      return THEME_CSS_URLS['default'];
    }
  }
  return THEME_CSS_URLS['default'];
};

const result = getThemeForUser(user);

console.log(result); // => 'https://xxx.com/theme-red.css'
```

> 类似这样的代码在前端项目中，随处可见；有人认为很多的if判断增强了JavaScript代码的健壮性，但是反过来说，也可以认为这是一段简单的代码，打上各种补丁之后，终于可以正常运转了(我不认为这是让代码更健壮的方案，反而更像是一段温室中的代码)

再举一个更普遍的例子：很多时候服务端接口文档，明确写了返回值为`Array`类型，但是没有值的时候，会直接给一个`null`而不是一个`empty Array`，这个时候客户端如果不做校验，直接作为`Array`类型来处理，`Uncaught TypeError`的错误是不可避免的；或者某个嵌套的JSON结构中，不知道哪一层就会出现`null`，我们总不能一直作出这样的判断吧`if(response && response.a && response.a.b ...)`!

为此经常这段代码简直就是**薛定谔的猫**，根据数据库数据的不同返回的结构完全不可预知，客户端只有在拿到数据的那一刻，才能确定下来！

现在我们面临的问题就是我们无法提前预知到底什么时候会出现`null/undefined`，如果出现的情况下，我们又该如何优雅而准确的处理`null/undefined`的问题！

为此薛定谔的Maybe出场的时候到了，来看一看另一个Box：**Maybe**
``` js
const Just = x => ({
  map: f => Just(f(x)),
  fold: (f, g) => f(x),
  getOrElse: () => x,
  inspect: () => `Maybe.Just(${x})`,
});

const Nothing = x => ({
  map: f => Nothing(x),
  fold: (f, g) => g(x),
  getOrElse: v => v,
  inspect: () => `Maybe.Nothing`,
});

const Maybe = x =>
  x != null ? Just(x) : Nothing();
```
Maybe的实现会把类型分为两类，一类是非空值，另一类是空值，所以经常会看到`Some(x)/None`或者`Just(x)/Nothing`这样的实现。

> Java8 和 scale中分别成为`Optional`和`Option`,他们将Just和Nothing称为Some和None,本质上并没有什么区别

一般来说Maybe会提供一个`getOrElse`函数，用来做出获取到值(Just)则给出正确的值，如果没有取到则提供一个默认值,Nothing会把传进来的otherValue作为回退方案。

下面看一下Maybe的基本用法：
``` js
const R = require('ramda');
const match = R.match;

Maybe('hello world').map(match(/o/ig));  // => Maybe.Just(o,o)
Maybe(null).map(match(/a/ig)  // => Maybe.Nothing
```
> 这里引入了[Ramda.js](https://github.com/ramda/ramda),提供了很多函数式风格的封装，避免了我们重复造轮子，但是他们一般不会提供函数式编程的核心的数学概念，比如：`Monad、functor、Foldable`
>
> 实现了[`Fantasy-Land`](https://github.com/fantasyland/fantasy-land)规范的库,比如[`ramda-fantasy`](https://github.com/ramda/ramda-fantasy),[`folktale`](https://github.com/origamitower/folktale)等,他们的实现比较工程化和严谨(适合正式的项目中引入)，但这里为了方便理解，我们选择继续扩展我们的**Box**,而不会引入这些类库

现在尝试用`Maybe`来重写一下`getThemeForUser`函数：
``` js
const R = require('ramda')
const path = R.path
const curry = R.curry

const getThemeForUser = user =>
  Maybe(user)
    .map(path(['infos', 'theme']))
    .fold(maybeGetTheme, maybeGetTheme)


const maybeGetTheme = curry(
  (urls, themeName) => Maybe(urls[themeName])
)(THEME_CSS_URLS)


const result = getThemeForUser(user).getOrElse(THEME_CSS_URLS.default);

console.log(result); // => https://xxx.com/theme-red.css
```

> `getThemeForUser`函数中最后为何使用`fold`而不是`map`呢？这是因为`maybeGetTheme`函数的入参是`themeName`,而`getThemeForUser`函数的返回值是`Maybe(themeName)`；
>
> 关于`fold`的两个一样的参数，在没有引入`chain`函数之前，我们暂时继续使用`flod`函数把`themeName`从`Maybe(themeName)`中释放出来,后面会和嵌套的`tryCatch`问题一起给出解决方案，现在先暂时放下这个问题
>
> 使用柯里化的`maybeGetTheme`函数，避免访问全局变量，并再次使用`Maybe`包装可能为空的数据，最后使用`getOrElse`取出Maybe中的值


Maybe和Either中的`fromNullable`看上去非常类似，至少从代码上来看是这样的，但是现在必须要说明一点的是：Either更过的时候会被用来处理逻辑分支以及异常恢复，而Maybe则用来处理空值检查比较多，在使用理念上不同。

一个常见的用法是`xxx.getOrElse(throw new Error('Fail'))`将结果是一个Nothing的Maybe转回一个异常，一般的经验法则则是在没有合理的方案能捕获异常时将其抛出；如果异常是一种可恢复的错误，使用Either会更加灵活

引入`Maybe`可能会造成一些不适，熟悉Scala的用户应该知道`Option`，或者Java中的`Optional`,是完全类似的概念；Scale中被迫在任何情况下都进行空值检查，的确让人头疼不已。随着时间的推移，空值检查会成为第二本能，说不定你还会感激它提供的安全性呢。不管怎么说，空值检查大多数时候都能防止在代码逻辑上偷工减料，让我们脱离危险。


### 甩锅侠IO

#### 保持纯与副作用

我们知道函数式编程的理念中，函数要保持“纯”的概念，即不能修改外部的变量，仅仅依赖于函数入参；也不能产生任何与以上可观察的副作用或输出，比如典型的读写操作。从代码编写者的角度来看，如果一段程序运行之后没有可观察到的作用，那他到底运行了没有？或者运行之后有没有实现代码的目的？有可能它只是浪费了几个CPU周期之后就去睡大觉了！！！

从JavaScript语言的诞生之初就不可避免地需要能够不断变化的，共享的，有状态的DOM互相作用；如果无法输入输出任何数据，那么数据库有什么用处呢？如果无法从网络请求信息，我们的页面又该如何展示？没有`side effect`我们几乎寸步难行。上述的任何一个操作，都会产生副作用，违反引用透明性，我们似乎陷入了两难的境地！

> 世間安得雙全法，不負如來不負卿

**如何在`keep pure`的前提下，又能妥善的处理`side effect`呢？**

答案是用数学的思维：**作弊**！

* **Dependency injection(依赖注入)**：把函数中不纯的部分，踢出去，作为参数传递进来
* **IO Functor/**:把产生`side effect`的部分包裹起来,带着这个保护壳参与运算，直到需要结果时再打开运行

#### Dependency injection

依赖注入式我们处理副作用的第一种方法，我们把代码中任何不纯的部分从函数中剔除，然后我们将他们作为传递进来，看一段代码：
``` js
const logSomething = something => {
  const dt = (new Date()).toISOString();
  console.log(`${dt}: ${something}`);
  return something;
}
```
`logSomething`函数有两个不纯的因素：首先创建了一个动态的Date,然后记录到console！因此不仅执行了IO,而且每一次执行的结果也都不一样。那么如何将这个函数变得pure呢？通过依赖注入我们可以把不纯的部分作为参数，所以现在函数应该被修改为接受三个参数的函数：
``` js
function logSomething(d, cnsl, something) {
  const dt = d.toISOString();
  return cnsl.log(`${dt}: ${something}`);
}
```
如此这般logSomething函数就可以做到相同的输入，对应相同的输出了：
``` js
const something = "idiot !"
const d = new Date();
logSomething(d, console, something)
```

看到这里，你可能会想，这简直蠢爆了！就像在假装无知的说：“我不知道调用cnsl对象上的log会执行IO,只是其他人把它传给了我！”

尽管如此，它并不是一个单纯的傻瓜，至少这种思想可以延伸出来一个思路： 
* **把不纯的部分剥离出来,让不纯的代码远离核心的logSomething函数**
* **缩小了不确定性的范围，目前看起来只有log函数不纯**
* **副作用集中管理，如果反复的缩小不确定的范围，我们甚至可以把不纯的代码推到代码的边缘，保证核心的pure和referential transparency**

缺点在于：
* 会导致方法签名过长，logSomething从一个参数变成了三个参数
* 传参的链路过长，可能导致多个函数在传递一长串的参数

#### IO Functor
现在我们来看看另外一种解决思路：IO Functor。在开始之前，我们先回顾一下JavaScript中的函数：由于函数的一等性和高阶性，JavaScript函数具有**值的行为**，也就是说，函数就是一个基于输入的切尚未求值的不可变的值，或者可以认为一个函数本身就是一个等待计算的惰性的值。

回想一下，我们前面一篇中说的，Box理念，既然函数只是**惰性的值**，我们何不把函数也包裹进Box中，等到需要的时候，在取出来！看代码：
``` js
const LazyBox = g => ({
	map: f => LazyBox(() => f(g())),
	fold: f => f(g())
})
```

> `map: f => LazyBox(() => f(g()))`，也可以使用`const compose = (...fns) => (...args) => fns.reduceRight((res, fn) => [fn.call(null, ...res)], args)[0]`和`map: f => LazyBox(compose(f, g))`的结合，并且更为合理;但是此处为了保持便于理解和代码简洁，没有采用

注意观察，我们没有调用fold函数，解封其中的值之前,map函数所做的一直都是在组合函数，函数并没有被实际的调用:
``` js
const nextChartFromNumberString = str =>
	LazyBox(() => str)
		.map(s => console.log('hahaha'))
		.map(r => parseInt(r))
		.map(i => i + 1)
		.map(i => String.fromCharCode(i))

const result = nextChartFromNumberString(' 64');

console.log(result)  // => { map: [Function: map], fold: [Function: fold] },
// 而并没有打印出'hahaha' 
```

> 这一特性有点类似递归，在未满足终止条件之前(没用调用fold之前)，递归调用会在栈中不断的堆叠，直到满足终止条件(调用fold函数)，才真正的开始计算
>
> 同样类似与递归，可能会出现Maximum call stack size exceeded的错误
>
> IO也和Rxjs中的`Observable`有很多相似之处，两者都是惰性的，在调用`subscribe`之前`Observable`也不会执行，在调用subscribe之后

再看一个读取文件的例子：
``` js
const readFile = (filename, enc) =>
	fs.readFileSync(filename, enc)


const content = LazyBox(() => readFile('config.json', 'utf-8'))
	.map(str => str.replace(/8/g, '6'))
	.fold(x => x)

console.log(content)  // => {"post":6666}
```

在没有调用fold函数之前，我们的代码都是纯的；flod函数就像打开潘多拉魔盒的双手；通过LazyBox我们把可能会弄脏双手的代码扔给了最后的fold，甩锅成功！

可以看到，我们这里使用的是同步的读取文件的例子，现在我们解决了`side effect`的问题，但是异步呢？异步该如何解决呢？不要着急，等我们介绍完了monad之后，会给出解决方案


> 看到这里，是不是想起来了React中的useEffect
>
> 诚然，副作用依然存在，并没有消除，但是可以通过类似的方式，让大部分的代码保持纯的特性，享受纯函数带来的引用透明的好处


### 关于Functor的定律
* 必须是无副作用的。若映射`identity`(`x => x`)函数可以获取上下文中相同的值，既可以证明Functor是无副作用的。
  `Box('hello world').map(identity) // => Box(hello world)`

* 必须是可组合的。这个属性的意思是多个map函数的组合，与分别map函数的结果是一样的

``` js
const R = require('ramda')
const reverse = R.reverse
const toUpper = R.toUpper
const compose = R.compose

Box('hello world')
    .map(reverse)
    .map(toUpper)  // => Box(DLROW OLLEH)

Box('hello world')
    .map(compose(toUpper, reverse))
```
### Summary
关于Functor的介绍暂时告一段落，我们已经介绍了几个常用的Functor:`Either`、`Maybe`、`IO`等等，但是其实根据应用场景的不同，我们可以创造出无数个Functor，比如：`tree`、`list`、`map`等等；

并且介绍了如果在保持pure的同时，处理side effect的两个方案：`Dependency injection`与`Lazy Function`

同时记住我们抛出的几个尚未解决的问题？
* 如何解决嵌套的try-catch
* 异步函数的组合
* chain函数又是什么

下面几节，将会解决这几个问题！



