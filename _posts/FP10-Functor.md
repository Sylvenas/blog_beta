---
title: FP10：Functor
categories: functional
date: 2018-07-26
---
### The Mighty Box
![functor->box](../images/functor-box.jpg)

我们已经知道如何书写函数式的程序了，即通过管道把数据在一系列纯函数间传递的程序。我们也知道了，这些程序就是声明式的行为规范。但是，控制流（control flow）、异常处理（error handling）、异步操作（asynchronous actions）和状态（state）呢？还有更棘手的作用（effects）呢？本章将对上述这些抽象概念赖以建立的基础作一番探究。

首先我们将创建一个容器（Box）。这个容器必须能够装载任意类型的值；否则的话，像只能装木薯布丁的密封塑料袋是没什么用的。这个容器将会是一个对象，但我们不会为它添加面向对象观念下的属性和方法。是的，我们将把它当作一个百宝箱——一个存放宝贵的数据的特殊盒子。

``` js
const Box = x => ({
    inspect: () => `Box(${x})`
})

Box.of = Box;
```

这是讲解函数式编程的第一个容器，我们贴心地把它命名为`Box`。我们完全使用函数式返回对象的方式，而不是ES6`Class`的方式，是因为这样就不用到处去写糟糕的`new`关键字了，非常省心。同时我们统一使用`Box.of`的方法来统一作为Box的入口，尽管现在看起来完全多此一举，是为了统一接口(实际上不能这么简单地看待`of`函数，但暂时先认为它是把值放到容器里的一种方式),并且我们通过重写`inspect`方法让我们方便的检查容器内的值。

我们来检验下这个崭新的盒子：
``` js
Box.of(3)
//=> Box(3)

Box.of("hotdogs")
//=> Box("hotdogs")

Box.of(Box.of({name: "yoda"}))
//=> Box(Box({name: "yoda" }))
```

在继续后面的内容之前，先澄清几点：

`Box`是个只有一个属性的对象。尽管容器可以有不止一个的属性，但大多数容器还是只有一个。我们很随意地把 `Box`的这个属性命名为`$value`。
* `$value` 不能是某个特定的类型，不然`Box`就对不起它这个名字了。
* 数据一旦存放到`Box`，就会一直待在那儿,不能通过别的方式修改这个值
* 如果把容器想象成玻璃罐的话，上面这三条陈述的理由就会比较清晰了。但是暂时，请先保持耐心。

### My First Functor
现在我们已经可以把一个数据用一个`Box`包装起来了,现在我们需要一种方法来让别的函数操作他
``` js
const Box = x => ({
    map: (f) => Box(f(x)),
    inspect: () => `Box(${x})`,
})
```
这个`map`跟数组那个著名的`map`一样，除了前者操作的是`Box(a)`而后者是`[a]`。它们的使用方式也几乎一致：
``` js
Box.of(2).map(two => two + 2); 
// Box(4)

Box.of('flamethrowers').map(s => s.toUpperCase()); 
// Box('FLAMETHROWERS')

Box.of('bombs').map(append(' away')).map(prop('length')); 
// Box(10)
```
为什么要使用这样一种方法？因为我们能够在不离开Box的情况下操作容器里面的值。这是非常了不起的一件事情。Box里的值传递给`map`函数之后，就可以任我们操作；操作结束后，为了防止意外再把它放回它所属的`Box`。这样做的结果是，我们能连续地调用 `map`，运行任何我们想运行的函数。甚至还可以改变值的类型，就像上面最后一个例子中那样。

等等，如果我们能一直调用`map`，那它不就是个组合（composition）么！这里边是有什么数学魔法在起作用？是`functor`。各位，这个数学魔法就是`functor`。

>functor是实现了`map`函数并遵守一些特定规则的容器类型。

没错，`functor`就是一个签了合约的接口。我们本来可以简单地把它称为`Mappable`，但这样就没有`fun`（注：指 functor 中包含 fun 这个单词，是一双关语）了，对吧？`functor`是范畴学里的概念，我们将在本章末尾详细探索与此相关的数学知识；暂时我们先用这个名字很奇怪的接口做一些不那么理论的、实用性的练习。

把值装进一个容器，而且只能使用`map`来处理它，这么做的理由到底是什么呢？如果我们换种方式来问，答案就很明显了：让容器自己去运用函数能给我们带来什么好处？

答案是抽象，对于函数运用的抽象。

当`map`一个函数的时候，我们请求容器来运行这个函数。不夸张地讲，这是一种十分强大的理念。

`map`知道如何在上下文中应该函数值。它首先会打开该容器，然后把值通过函数映射为另外一个值，最后把结果值再次包裹到一个新的同类型的容器中。拥有这种函数的类型被称为**Functor**。

>从本质上来说，`Functor`只是一个可以将函数应用到包裹的值上，并将结果再包裹起来的数据结构。

map的一般定义为：
`map :: (a -> b) -> Box(a) -> Box(b)`
(先接收一个`a->b`的函数，然后再接收一个`Box(a)`)作为参数，最后返回一个`Box(b)`

毫无疑问这种链式的连续调用太眼熟了。其实绝大多数的开发人员一直在使用`Functor`却没有意识到而已。比如：`Array`的`map`和`filter`方法都是返回同样类型的`Functor`,因此可以不断的连续调用。

再看看另一个**Functor**：`compose`,这是一个从多个函数到一个函数的映射(也保持了类型的不变)。
`const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);`

**Functor**具有如下一些重要的约束：
* 必须是无副作用的。如果一个Functor`map(x => x)`之后得到的结果和映射之前完全相同的值，则可以认为该Functor是无副作用的。
``` js
const map = f => mappable => mappable.map(f)
const id = x => x

// identity
map(id) === id;
```

``` js
const idLaw1 = map(id);
const idLaw2 = id;

idLaw1(Box.of(2))   // Box(2)
idLaw2(Box.of(2))         // Box(2)
```

* 必须是可组合的。这个组合的意思时说`map`函数的组合，与分别`map`函数是一样的。比如下面两个表达式的效果是一样的。

`compose(map(f), map(g)) === map(compose(f, g))`

``` js
const two = Box.of(2)
const plus = R.curry((a,b) => a + b)
const plus3 = plus(3)
const plus5 = plus(5)

// 分别map
two.map(plus3).map(plus5).map(x => x)         // Box(10)
// 组合函数，然后map
two.map(compose(plus3, plus5)).map(x => x)    // Box(10)

const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x)
const map = f => mappable => mappable.map(f)
const concat = concatableX => concatableY => concatableY.concat(concatableX)

const compLaw1 = compose(map(concat(" world")), map(concat(" cruel")));
const compLaw2 = map(compose(concat(" world"), concat(" cruel")));

compLaw1(Box.of('Good Bye'))  //=> Box(Good Bye cruel world)
compLaw2(Box.of('Good Bye'))  //=> Box(Good Bye cruel world)
```
**Functor**的这些属性并不奇怪。遵守这些规则，可以免于抛出异常、篡改元素或者改变函数的行为。其实实际目的**只是创建一个上下文或者抽象**，以便可以安全的应用操作到值，而不是改变原来的值。这也是map可以将一个数组转换为另一个数组，而不是改变原数组的原因。而**Functor**就是这个概念的推广。

在范畴学中，Functor接受一个范畴的对象和态射（morphism），然后把它们映射（map）到另一个范畴里去。根据定义，这个新范畴一定会有一个单位元（identity），也一定能够组合态射；我们无须验证这一点，前面提到的定律保证这些东西会在映射后得到保留。

可能我们关于范畴的定义还是有点模糊。你可以把范畴想象成一个有着多个对象的网络，对象之间靠态射连接。那么 Functor 可以把一个范畴映射到另外一个，而且不会破坏原有的网络。如果一个对象`a`属于源范畴`C`，那么通过 Functor`F`把`a`映射到目标范畴`D`上之后，就可以使用 `F a` 来指代 `a` 对象（把这些字母拼起来是什么？！）。可能看图会更容易理解：

![catmap](../images/catmap.png)

用`map`包裹每一个函数，用`Functor`包裹每一个类型。这样就能保证每个普通的类型和函数都能在新环境下继续使用组合。从技术上讲，代码中的 Functor 实际上是把范畴映射到了一个包含类型和函数的子范畴（sub category）上，使得这些 Functor 成为了一种新的特殊的 endofunctor。但出于本书的目的，我们认为它就是一个不同的范畴。

可以用一张图来表示这种态射及其对象的映射：

![functormap](../images/functormap.png)

这张图除了能表示态射借助Functor`F`完成从一个范畴到另一个范畴的映射之外，我们发现它还符合交换律，也就是说，顺着箭头的方向往前，形成的每一个路径都指向同一个结果。不同的路径意味着不同的行为，但最终都会得到同一个数据类型。这种形式化给了我们原则性的方式去思考代码——无须分析和评估每一个单独的场景，只管可以大胆地应用公式即可。来看一个具体的例子。

也就是说对于一个值，无论是先通过`Functor.of`把它转换为一个`Functor`,然后再通过map映射为另一个Functor，和先通过map映射为另一个值，然后在用`Functor.of`转换为Functor的结果是一摸一样的。
















有人认为函数式编程只适用于枯燥无味的学术研究，而忽略了真实世界的问题，然而近年来发现，函数式编程可以把错误处理得比任何其他开发风格更为优雅。

软件开发中的许多问题都是由于数据不经意间的变成了`null`和`undefined`,出现了异常，失去了网络连接等情况造成的，我们的代码需要不断的校验这类问题，增加了代码的复杂性，这就需要花大量的时间来确保所有的异常都能正确的被捕获，并且在所有可能会出现`null`或者`undefined`的地方做检查，最后的结果是什么呢？--越来越长、不能扩展、推理起来又十分费劲的庞大而复杂的代码？

在许多情况下都会发生JavaScript的错误，特别是在与服务器通信的时候，或者在试图访问一个为`null/undefined`的对象的属性的时候，这个时候就需要开发者做好最坏的打算，在命令式的程序中，大多数的异常都是通过`try-catch`来实现的

### try-catch处理错误
try通常包裹住你认为不太安全的代码，一旦有异常发生，JavaScript会立即终止程序，并创建导致该问题的指令的函数跳用堆栈跟踪。有关错误的细节，如消息、行号、文件名，被填充到Error类型对象中，并传递到catch块，catch块就像程序的避风港，
``` js
const decode = url => { 
    try {
        const result = decodeURIComponent(url)
        return result
    } catch (uriError) { 
        throw uriError
    }
}
```
### 空值检查问题
另外一个和抛出异常一样烦人的错误是null返回值，虽然null返回值确保了函数的出口只有一个，但是也没有好到哪里去--给使用函数的用户带来需要null检查的负担。
``` js
if (student != null) {
    const school = student.school;
    if (school != null) {
        const schoolName = school.name;
        appendSchoolName(schoolName);
    }
}
```
### 函数式程序中的异常
命令式的JavaScript代码结构有很多缺陷，而且也会与函数式的设计有兼容性问题。会抛出异常的函数存在一下问题：
* 难以与其他函数组合或链接
* 违反了引用透明原则，因为抛出异常会导致函数调用出现另一个出口，所以不能确保单一的可预测的返回值
* 会引起副作用，因为异常会在函数调用之外对堆栈引发不可预料的影响
* 违反局域性的原则，因为用于恢复异常的代码和原始的函数调用渐行渐远，当发生错误的时候，函数会离开局部栈和环境
* 不能只关心函数的返回值，调用者需要负责声明catch块中的异常匹配类型来管理特定的异常
* 当有多个异常条件的时候会出现潜逃的异常处理块

>异常应该由一个地方抛出，而不是随处可见

上面的描述和代码可以看出，不管是使用try-catch还是null检查，都是被动的解决方式，若是机能轻松的处理错误，又不需要这些啰嗦的检查，该有多好？

### Functor
函数式以一种完全不同的方法应对软件系统的错误处理，其思想说起来也非常简单，就是创建一个安全的容器，来存放危险的代码,在函数式编程中，仍然会包裹这些危险的代码，但可以不用try-catch
#### Box包裹不安全的值
将值包裹起来是函数式编程的一个基本设计模式，因为这直接保证了值不会被人意的篡改，这又点像给值披铠甲，只能通过map操作来访问该容器中的值。实际上最常见的数组的map方法就是一个典型的例子，而所谓的数组，也不过就是值的容器。

其实不仅仅只有数组可以映射，理论上来说，任何数据类型都可以映射，map只不过是一个函数，由于其引用透明性，只要输入相同，map永远会返回相同的结果。

还可以认为map是可以使用lambda表达式变换容器内的值的途径！

下面说明一下，怎么包装一个数据，使之成为mapable(可map)的对象，这对学习什么是Functor很有帮助
``` js
class Wrapper {
    constructor(value) {
        this._value = value
    }

    map(fn) {
        return fn(this._value)
    }

    toString() {
        return `Wrapper (${this._value})`
    }
}
// wrap :: A -> Wrapper(A)
const wrap = val => new Wrapper(val)
```
要访问包裹内的对象，唯一的办法就是`map` `x => x`函数，虽然JavaScript允许用户通过`_value`属性来访问这个被包裹的属性值，但是一旦该值进入到容器中，我们就不应该继续直接获取或者修改该值了(就像一个虚拟的屏障)。

``` js
const wrapperValue = wrap('functional pro')
wrapperValue.map(x => x)   // -> functional pro
```

其实还可以映射任何函数到该容器，比如打印日志，或者变换该值
``` js
wrapperValue.map(console.log) 
wrapperValue.map(x => x.toUpperCase()) // -> FUNCTIONAL PRO
```

如此以来，所有对值的操作都必须借助`Wrapper.map`"伸入"容器，从而使值得到一定的保护。

还有一种更高级的map -> `fmap`;
``` js
class Wrapper {
    // ....

    /**
     * Functor 函子
     * fmap首先会打开容器，然后把值通过函数映射到另外一个值；
     * 最后把结果值包裹到一个新的同类型容器中
     * fmap总会返回相同的类型，这样就可以链式的调用fmap
     * 完全类似于数组的map、filter、reduce方法
     * @param {Function} fn 
     */
    fmap(fn) {
        return wrap(fn(this._value))
    }
    // ....
}
```
`map`知道如何在上下文中应该函数值。它首先会打开该容器，然后把值通过函数映射为另外一个值，最后把结果值再次包裹到一个新的同类型的容器中。拥有这种函数的类型被称为**Functor**。

从本质上来说，`Functor`只是一个可以将函数应用到包裹的值上，并将结果再包裹起来的数据结构。

fmap的一般定义为：
`fmap :: (A -> B) -> Wrapper(A) -> Wrapper(B)`

看一个简单的例子：
``` js
const plus = R.curry((a,b) => a + b)
const plus3 = plus(3)
const plus10 = plus(10)
```
现在可以把数字2放到Wrapper中：
``` js
const two = wrap(2)
```
在调用`fmap`把`plus3`映射到容器上：
``` js
const five = two.fmap(plus3)  // -> Wrapper(5) 返回一个被包裹的 5
```
`fmap`返回同样类型的数据，因此可以链式的连续调用`fmap`，来转换值。
``` js
two.fmap(plus3).fmap(plus10) // -> Wrapper(5) 返回一个被包裹的 15
```
毫无疑问这种链式的连续调用太眼熟了。其实绝大多数的开发人员一直在使用`Functor`却没有意识到而已。比如：`Array`的`map`和`filter`方法都是返回同样类型的`Functor`,因此可以不断的连续调用。

再看看另一个**Functor**：`compose`,这是一个从多个函数到一个函数的映射(也保持了类型的不变)。
`const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);`

**Functor**具有如下一些重要的约束：
* 必须是无副作用的。如果一个Functor再映射之后，通过`x => x`函数取得和映射之前完全相同的值，则可以认为该Functor是无副作用的。

* 必须是可组合的。这个组合的意思时说`fmap`函数的组合，与分别`fmap`函数是一样的。比如下面两个表达式的效果是一样的。
``` js
// 分别fmap
two.fmap(plus3).fmap(plus5).map(x => x)        // Wrapper(10)
// 组合函数，然后fmap
two.fmap(compose(plus3, plus5)).map(x => x)    // Wrapper(10)
```

**Functor**的这些属性并不奇怪。遵守这些规则，可以免于抛出异常、篡改元素或者改变函数的行为。其实实际目的**只是创建一个上下文或者抽象**，以便可以安全的应用操作到值，而不是改变原来的值。这也是map可以将一个数组转换为另一个数组，而不是改变原数组的原因。而**Functor**就是这个概念的推广。

**Functor**并不需要知道如何处理null,例如Ramda中的`R.compose`再接收到一个为null的函数引用时，就会抛出异常，这完全是预期的行为，并不是设计上的缺陷

还有一个更为具体化的函数式数据类型**Monad**(单子),**Monad**可以简化代码中的错误处理，进而更流畅的进行函数组合。但是它跟**Functor**有什么关系呢？其实**Monad**就是**Functor**`伸入`的容器。

> 另一个比喻：Monad是一个宝盒(Wrapper)，而Functor就是深入到宝盒中的手(fmap)

不要因为听到**Monad**这样的术语，就灰心丧气。其实大多数的JavaScript开发人员都接触过**Monad**，那就是Jquery的代码。**Monad**只是给一些资源提供了一个安全的抽象，例如：一个简单的价值，一个DOM元素、事件、Ajax调用，这样就可以安全的处理其中包含的数据。比如：`Jquery`就可以看作DOM的Monad：
``` js
$('#some').fadeIn(3000).text('hello world')
```
这段代码之所以像Monad，是因为jQuery可以安全的将fadeIn和text行为应用到DOM上，如果`#some`没有找到，将方法应用到空的Jquery方法上，就像什么也没有发生一样，也不会抛出异常。Monad旨在安全的传送错误，这样整个应用才能有比较好的容错性。

>或者说Monad是为了更好的包装数据，同时提供了错误数据的处理方案

