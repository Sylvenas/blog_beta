---
title: FP11：Schrödinger's Maybe
categories: functional
date: 2018-08-02
---
### Schrödinger's Maybe
![Schrödinger's Maybe](../images/cat.png)

说实话上一章讲解的`Box` functor挺无聊的，通常我们称它为`Identity`，与`id`函数的作用相同（这里也是有数学上的联系的，我们会在适当时候加以说明）。除此之外，还有另外一种 functor，那就是实现了 map 函数的类似容器的数据类型，这种 functor 在调用 map 的时候能够提供非常有用的行为。现在让我们来定义一个这样的 functor。

Maybe Monad侧重于有效整合null-判断逻辑。Maybe是一个包含两个具体子类型的空类型(标记类型)

* Just(value)  -- 表示值的容器
* Nothing() -- 表示要么没有值或者没有失败的附加信息，当然还可以应用函数到Nothing上

这些字类型实现了`Identity` Functor的全部属性和方法，并且附加了一些独特的行为。Maybe的实现如下：
``` js
class Maybe {                        // 容器类型(父类)
    static just(a) {
        return new Just(a)
    }
    static nothing() {
        return new Nothing()
    }

    static of(a) {     // 由一个可为空的类型创建Maybe(即构造函数)
        return a != null ? Maybe.just(a) : Maybe.nothing()
    }

    get isJust() {
        return false
    }
    get isNothing() {
        return false
    }
}
// Just 子类型用于处理存在的值
class Just extends Maybe {       
    constructor(val) {
        super()
        this.$value = val
    }
    map(fn) {
        return Maybe.of(fn(this.$value))  // 将映射函数作用于Just,变换其中的值，并存储回容器内
    }
    filter(fn) {
        Maybe.fromNullable(fn(this.$value) ? this.$value : null) // filter值
    }
    getOrElse() {    // Monad提供默认的一元操作符，用于从中获取其值
        return this.$value
    }
    get value() {
        return this.$value
    }
    get isJust() {
        return true
    }
    inspect(){
        return `Maybe.Just(${this.$value})`
    }
}
// Nothing子类型用于为无值的情况提供保护
class Nothing extends Maybe {
    map(fn) {
        return this
    }
    getOrElse(other) {   // 忽略值返回other
        return other
    }
    filter() {
        return this.$value
    }
    get value() {     // 任何试图直接从Nothing类型中取值的操作都会引发表征错误的信息
        throw new TypeError('Can’t extract the value of a nothing')
    }
    get isNothing() {
        return true
    }
    inspect(){
        return `Maybe.Nothing`
    }
}
``` 

`Maybe`看起来跟`Box`非常类似，但是有一点不同：`Maybe`会先检查自己的值是否为空，然后才调用传进来的函数。这样我们在使用`map`的时候就能避免恼人的空值了,因为再是空值的情况下，我们根本不会执行传递给map的映射函数，而是直接`return this`（注意这个实现出于教学目的做了简化）。

``` js
Maybe.of("Malkovich Malkovich").map(match(/a/ig));
//=> Maybe(['a', 'a'])

Maybe.of(null).map(match(/a/ig));
//=> Maybe(null)

Maybe.of({name: "Boris"}).map(_.prop("age")).map(add(10));
//=> Maybe(null)

Maybe.of({name: "Dinah", age: 14}).map(_.prop("age")).map(add(10));
//=> Maybe(24)
```
注意看，当传给`map`的值是`null`时，代码并没有爆出错误。这是因为每一次`Maybe`要调用函数的时候，都会先检查它自己的值是否为空。

这种点记法（dot notation syntax）已经足够函数式了，但是正如在第 1 部分指出的那样，我们更想保持一种 pointfree 的风格。碰巧的是，map 完全有能力以 curry 函数的方式来“代理”任何 functor：
``` js
// map :: Functor f => (a -> b) -> f a -> f b
const map = curry((f, anyFunctor) => anyFunctor.map(f));
```
这样我们就可以像平常一样使用组合，同时也能正常使用 `map` 了，非常振奋人心。`ramda`的`map`也是这样。后面的章节中，我们将在点记法更有教育意义的时候使用点记法，在方便使用`pointfree`模式的时候就用 `pointfree`。你注意到了么？我在类型标签中偷偷引入了一个额外的标记：`Functor f =>`。这个标记告诉我们`f`必须是一个`functor`。没什么复杂的，但我觉得有必要提一下。

### Use Cases
实际当中，`Maybe`最常用在那些可能会无法成功返回结果的函数中，例如：查询数据库、在集合中查找、从服务器返回数据等
``` js
// safeHead :: [a] -> Maybe(a)
const safeHead = xs => Maybe.of(xs[0]);

// streetName :: Object -> Maybe String
const streetName = compose(map(prop('street')), safeHead, prop('addresses'));

streetName({ addresses: [] });
// Nothing

streetName({ addresses: [{ street: 'Shady Ln.', number: 4201 }] });
// Just('Shady Ln.')
```
safeHead 与一般的 _.head 类似，但是增加了类型安全保证。引入 Maybe 会发生一件非常有意思的事情，那就是我们被迫要与狡猾的 null 打交道了。safeHead 函数能够诚实地预告它可能的失败——失败真没什么可耻的——然后返回一个 Maybe 来通知我们相关信息。实际上不仅仅是通知，因为毕竟我们想要的值深藏在 Maybe 对象中，而且只能通过 map 来操作它。本质上，这是一种由 safeHead 强制执行的空值检查。有了这种检查，我们才能在夜里安然入睡，因为我们知道最不受人待见的 null 不会突然出现。类似这样的 API 能够把一个像纸糊起来的、脆弱的应用升级为实实在在的、健壮的应用，这样的 API 保证了更加安全的软件。

有时候函数可以明确返回一个 Maybe(null) 来表明失败，例如：
``` js
// withdraw :: Number -> Account -> Maybe(Account)
const withdraw = curry((amount, { balance }) =>
  Maybe.of(balance >= amount ? { balance: balance - amount } : null));

// This function is hypothetical, not implemented here... nor anywhere else.
// updateLedger :: Account -> Account 
const updateLedger = account => account;

// remainingBalance :: Account -> String
const remainingBalance = ({ balance }) => `Your balance is $${balance}`;

// finishTransaction :: Account -> String
const finishTransaction = compose(remainingBalance, updateLedger);


// getTwenty :: Account -> Maybe(String)
const getTwenty = compose(map(finishTransaction), withdraw(20));

getTwenty({ balance: 200.00 }); 
// Just('Your balance is $180')

getTwenty({ balance: 10.00 });
// Nothing
```
要是钱不够，`withdraw`就会对我们嗤之以鼻然后返回一个`Maybe(null)`。`withdraw`也显示出了它的多变性，使得我们后续的操作只能用`map`来进行。这个例子与前面例子不同的地方在于，这里的`null`是有意的。我们不用`Maybe(String)`，而是用 `Maybe(null)`来发送失败的信号，这样程序在收到信号后就能立刻停止执行。这一点很重要：如果`withdraw`失败了，`map`就会切断后续代码的执行，因为它根本就不会运行传递给它的函数，即`finishTransaction`。

这正是预期的效果：如果取款失败，我们并不想更新或者显示账户余额。

### Releasing the Value
人们经常忽略的一个事实是：任何事物都有个最终尽头。那些会产生作用的函数，不管它们是发送 JSON 数据，还是在屏幕上打印东西，还是更改文件系统，还是别的什么，都要有一个结束。但是我们无法通过 return 把输出传递到外部世界，必须要运行这样或那样的函数才能传递出去。关于这一点，可以借用禅宗公案的口吻来叙述：“如果一个程序运行之后没有可观察到的作用，那它到底运行了没有？”。或者，运行之后达到自身的目的了没有？有可能它只是浪费了几个 CPU 周期然后就去睡觉了...

应用程序所做的工作就是获取、更改和保存数据直到不再需要它们，对数据做这些操作的函数有可能被 map 调用，这样的话数据就可以不用离开它温暖舒适的容器。讽刺的是，有一种常见的错误就是试图以各种方法删除 Maybe 里的值，好像这个不确定的值是魔鬼，删除它就能让它突然显形，然后一切罪恶都会得到宽恕似的（译者注：此处原文应该是源自圣经）。要知道，我们的值没有完成它的使命，很有可能是其他代码分支造成的。我们的代码，就像薛定谔的猫一样，在某个特定的时间点有两种状态，而且应该保持这种状况不变直到最后一个函数为止。这样，哪怕代码有很多逻辑性的分支，也能保证一种线性的工作流。

不过，对容器里的值来说，还是有个逃生口可以出去。也就是说，如果我们想返回一个自定义的值然后还能继续执行后面的代码的话，是可以做到的；要达到这一目的，可以借助一个帮助函数 maybe：

``` js
//  maybe :: b -> (a -> b) -> Maybe a -> b
var maybe = curry(function(x, f, m) {
  return m.isNothing() ? x : f(m.__value);
});

//  getTwenty :: Account -> String
var getTwenty = compose(
  maybe("You're broke!", finishTransaction), withdraw(20)
);


getTwenty({ balance: 200.00});
// "Your balance is $180.00"

getTwenty({ balance: 10.00});
// "You're broke!"
```
这样就可以要么返回一个静态值（与 finishTransaction 返回值的类型一致），要么继续愉快地在没有 Maybe 的情况下完成交易。maybe 使我们得以避免普通 map 那种命令式的 `if/else` 语句：`if(x !== null) { return f(x) }else{ return null }`。

引入 Maybe 可能会在初期造成一些不适。`Swift` 和 `Scala` 用户知道我在说什么，因为这两门语言的核心库里就有 Maybe 的概念，只不过伪装成 Option(al) 罢了。被迫在任何情况下都进行空值检查（甚至有些时候我们可以确定某个值不会为空），的确让大部分人头疼不已。然而随着时间推移，空值检查会成为第二本能，说不定你还会感激它提供的安全性呢。不管怎么说，空值检查大多数时候都能防止在代码逻辑上偷工减料，让我们脱离危险。

编写不安全的软件就像用蜡笔小心翼翼地画彩蛋，画完之后把它们扔到大街上一样（意思是彩蛋非常易于寻找。来源于复活节习俗，人们会藏起一些彩蛋让孩子寻找），或者像用三只小猪警告过的材料盖个养老院一样（来源于“三只小猪”童话故事）。Maybe 能够非常有效地帮助我们增加函数的安全性。

有一点我必须要提及，否则就太不负责任了，那就是 Maybe 的“真正”实现会把它分为两种类型：一种是非空值，另一种是空值。这种实现允许我们遵守 map 的 parametricity 特性，因此 null 和 undefined 能够依然被 map 调用，functor 里的值所需的那种普遍性条件也能得到满足。所以你会经常看到 Some(x) / None 或者 Just(x) / Nothing 这样的容器类型在做空值检查，而不是 Maybe。






