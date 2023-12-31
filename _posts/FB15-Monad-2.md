---
title: FP15：Monad-2
categories: functional
date: 2018-09-11
---

> “A monad is just a monoid in the category of endofunctors. What’s the problem?”

Monad是非常简单的，但是它的概念却有点让人云里雾里，尤其是网上查询资料博客的时候，一般会从范畴论开始讲解，这是正确的道路，不过可惜的是大部分的JavaScript开发人员，并不懂范畴论，范畴不仅仅是一种数学语言，也是一种哲学观点，范畴论也绝不是一两篇文章就能讲清楚的，这里我们不过多的去说明范畴论，而仅仅是谈论一下在计算机编程中的Monad的概念

Monad是一种组合函数的方法，除了返回值之外，还需要上下文，比如计算，if/else分支，IO等等。Monad可以类型提升，并且扁平化的映射`a -> M(b)`,使函数可组合，可以把类型a的数据映射成数据b的类型，并隐藏了实现的细节

>这里说的上下文不同于函数执行上下文，这里的上下文，仅仅是只数据的外部环境，或者是某种Wrapper、Box之类的概念，例如数组的仅仅是对数据的一种包裹，但是却可以提供很多的便捷的方法

* Function map:`a=>b`
* Functor map with context:`Functor(a) => Functor(b)`
* Monad flatten and map with context:`Monad(Monad(a)) => Monad(b)`

上面所说的：`map`，`flatten`,`context`又是什么意思呢？

* Map的意思是说，使用参数a调用一个函数，计算之后，函数返回值为b. Given some input, return some output.
* Context是组合Monad的计算细节，这里和Functor类似，我们可以直接调用`fmap`之类的方法，却无需关心实现的细节，这样我们就可以放心的在上下文环境中，完成从数据a,到数据b的映射，并返回处于同样上下文中的b，eg:`Array(a) => Array(b)`,`Observable(a) => Observable(b)`
* Type lift意味着将数据提升到上下文中,这样可以方便的使用上下文的方法，`a => Functor(a)`,Monad只不过是更强大的Functor，eg:字符串'abc','xyz'，把他们做个类型提升：`['abc','xyz']`,那么就可以方便快捷的，使用数据的map,filter等等方法了，借助Functor可以提升任何类型的数据
* Flatten是从上下文中取出数据`Functor(a) => a`,去除包装，取出果实，有可能一个值是被层层包装的，那么就是层层的去除包装来扁平化，类似于拨洋葱一样一层一层的去除外衣

Example:
``` js
const x = 20;             // Some data of type `a`
const f = n => n * 2;     // A function from `a` to `b`
const arr = Array.of(x);  // The type lift.
// JS has type lift sugar for arrays: [x]
// .map() applies the function f to the value x
// in the context of the array.
const result = arr.map(f); // [40]
```
在这个例子中，Array就是`context`,`x`是被包裹的值。

这个例子中没有包含，数组中的数组，但是使用concat扁平化数组，绝不陌生：
``` js
[].concat.apply([], [[1], [2, 3], [4]]); // [1, 2, 3, 4]
```
### You’re probably already using monads
函数组合创建数据流经的函数管道。您在管道的第一阶段输入了一些输入，并且一些数据从管道的最后一个阶段弹出，进行了转换。但要实现这一点，管道的每个阶段都必须期望前一阶段返回的数据类型。

编写简单的函数很容易，因为类型都很容易排列。只需将输出类型b的函数`g`与输入类型b的函数`f`匹配即可：
```
g: a => b
f: b => c
h = f(g(a)): a => c
```

如果是在`Functor`中进行组合或者连续调用，也非常简单，因为永远都是相同的Wrapper类型：
```
g: F(a) => F(b)
f: F(b) => F(c)
h = f(g(Fa)): F(a) => F(c)
```

但是如果你想组合的函数是`a => F(b)`,`b => F(c)`,这个时候就需要Monad了，使用`M`Functor替换一下`F`,让问题更清晰一些：
```
g: a => M(b)
f: b => M(c)
h = composeM(f, g): a => M(c)
```

Oops.这个时候发现类型对应不上，`f`函数的输入我们想要的是类型`b`,但是我们得到的却是类型`M(b)`,由于这中错位，在`composeM`中，我们需要从函数`g`的返回值`M(b)`中取出数据`b`。而这个过程正是`flaten`和`map`的过程
```
g: a => M(b) flattens to => b
f: b maps to => M(c)
h composeM(f, g):a flatten(M(b)) => b => map(b => M(c)) => M(c)
```
在上面中`M(b) => b`的展平，以及`b => M(c)`的映射，实在`a => M(c)`的`chain`中完成的，在更高层级`composeM`中的完成的，稍后会讲解`composeM`如何实现。

现在我们只要知道我们借助Monad完成更高级的函数组合，有很多的函数不是简单的从`a => b`的映射，有些函数需要处理副作用，例如(promise)、分支处理(Either)、异常处理(Maybe)。。。

举一个更实际的例子，如果我们要从一个异步的API中获取某个用户的信息，然后把这个信息，传递给另一个异步的API,来查询别的数据，这个时候我们怎么办呢？
```
getUserById(id) => Promise(User)
hasPermision(User) => Promise(Boolean)
```
首先写一些工具函数，帮助我们完成任务：
``` js
const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);
const trace = label => value => {
  console.log(`${ label }: ${ value }`);
  return value;
};
```
然后可以这样使用代码：
``` js
const label = 'API call composition';

// a => Promise(b)
const getUserById = id => id === 3 ?
    Promise.resolve({ name: 'Kurt', role: 'Author' }) :
    undefined

// b => Promise(c)
const hasPermission = ({ role }) => (
    Promise.resolve(role === 'Author')
);

// Try to compose them. Warning: this will fail.
const authUser = compose(hasPermission, getUserById);
// Oops! Always false!
authUser(3).then(trace(label));
```
当我们组合`getUserById`，`hasPermission`函数的时候，我们发现了一个大问题，`hasPermission`函数期望得到一个`User`对象作为参数，而`getUserById`函数的返回值却是`Promise(User)`，为了解决这个问题，我们需要使用`then`方法从`Promise(User)`中把`User`对象取出来,为此我们做一个定制版的`composePromises`函数：
``` js
const composeM = chainMethod => (...ms) => (
    ms.reduce((f, g) => x => g(x)[chainMethod](f))
);
const composePromises = composeM('then');
const label = 'API call composition';

// a => Promise(b)
const getUserById = id => id === 3 ?
    Promise.resolve({ name: 'Kurt', role: 'Author' }) :
    undefined

// b => Promise(c)
const hasPermission = ({ role }) => (
    Promise.resolve(role === 'Author')
);

// Compose the functions (this works!)
const authUser = composePromises(hasPermission, getUserById);
authUser(3).then(trace(label)); // true
```
Promise也是一种Monad。

#### What Monads are Made of
Monad遵循一个简单的对称，把一个值包装到context中，并且能够把值从context中取出来。

* **Lift/Unit**:把一个值包装到Monad的context中，`a => M(a)`
* **Flatten/Join**:把值从context中取出来，`M(a) => a`

Monad肯定也是一个Functor,那么很明显也有一个fmap方法：
* **Map**:从一个Functor映射到另一个Functor,`M(a) => M(b)`

合并`Flatten`和`Map`,这个就是`Chain`
* **FlatMap/Chain**: Flatten + map: `M(M(a)) => M(b)`

>在Promise中`.then`方法实际上就是Monad中的`FlatMap/Chain`方法

>Monad是一个抽象接口(类似于Java中的Interface)，定义了实现该接口必须定义的方法，而实现了Monad的具体类型被称为**Monadic**,Monadic才是根据方向，可以有不同的具体的实现,例如Promise，Array等等

#### 扩展应用
看一个具体的例子：
``` js
// The algebraic definition of function composition:
// (f ∘ g)(x) = f(g(x))
const compose = (f, g) => x => f(g(x));
const x = 20;    // The value
const arr = [x]; // The container
// Some functions to compose
const g = n => n + 1;
const f = n => n * 2;
// Proof that .map() accomplishes function composition.
// Chaining calls to map is function composition.
trace('map composes')([
    arr.map(g).map(f),
    arr.map(compose(f, g))
]);
// => [42], [42]
```
不仅仅是数组具有map方法，我们可以把任何包含`map`方法的Functor,都可以组合
``` js
const composeMap = (...ms) => ms.reduce((f, g) => x => g(x).map(f))
```
Promise的组合:
``` js
const label = 'Promise composition';
const g = n => Promise.resolve(n + 1);
const f = n => Promise.resolve(n * 2);
const h = composePromises(f, g);
h(20)
.then(trace(label))
// Promise composition: 42
```

其实规律非常简单，只要是这种结构的数据都可以自由的定义组合：
``` js
const composeM = method => (...ms) => (
  ms.reduce((f, g) => x => g(x)[method](f))
);

const composePromises = composeM('then');
const composeMap = composeM('map');
const composeFlatMap = composeM('flatMap');
```