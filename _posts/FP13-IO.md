---
title: FP13：IO - keep code pure
categories: functional
date: 2018-08-08
---
### Old McDonald Had Effects...
在关于纯函数的的那一章（即第 3 章）里，有一个很奇怪的例子。这个例子中的函数会产生副作用，但是我们通过把它包裹在另一个函数里的方式把它变得看起来像一个纯函数。这里还有一个类似的例子：
``` js
//  getFromStorage :: String -> (_ -> String)
var getFromStorage = function(key) {
  return function() {
    return localStorage[key];
  }
}
```
要是我们没把`getFromStorage`包在另一个函数里，它的输出值就是不定的，会随外部环境变化而变化。有了这个结实的包裹函数（wrapper），同一个输入就总能返回同一个输出：一个从`localStorage`里取出某个特定的元素的函数。就这样（也许再高唱几句赞美圣母的赞歌）我们洗涤了心灵，一切都得到了宽恕。

然而，这并没有多大的用处，你说是不是。就像是你收藏的全新未拆封的玩偶，不能拿出来玩有什么意思。所以要是能有办法进到这个容器里面，拿到它藏在那儿的东西就好了...办法是有的，请看 IO：
``` js
const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x)

class IO {
    constructor(effect) {
        if (!_.isFunction(effect)) {
            throw new TypeError('IO Usage:function required')
        }
        this.effect = effect
    }
    static of(a) {
        return new IO(() => a)
    }
    static from(fn) {
        return new IO(fn)
    }
    map(fn) {
        return new IO(compose(fn, this.effect))
    }
    run() {
        return this.effect()
    }
}
```
`IO`跟之前的`functor`不同的地方在于，它的`$value`(在这里叫`effect`)总是一个函数。不过我们不把它当作一个函数——实现的细节我们最好先不管。这里发生的事情跟我们在`getFromStorage`那里看到的一模一样：`IO`把非纯执行动作（impure action）捕获到包裹函数里，目的是延迟执行这个非纯动作。就这一点而言，我们认为`IO`包含的是被包裹的执行动作的返回值，而不是包裹函数本身。这在`of`函数里很明显`IO(function(){ return x })` 仅仅是为了延迟执行，其实我们得到的是`IO(x)`。

> IO和Maybe、Either不太一样，它包装的是effect函数，而不是一个值。但是，一个函数完全可以看作一个等待计算的惰性的值，不是吗

来用用看：
``` js
// ioWindow :: IO Window
const ioWindow = new IO(() => window);

ioWindow.map(win => win.innerWidth);
// IO(1430)

ioWindow
  .map(prop('location'))
  .map(prop('href'))
  .map(split('/'));
// IO(() => ['http:', '', 'localhost:8000', 'blog', 'posts'])


// $ :: String -> IO [DOM]
const $ = selector => new IO(() => document.querySelectorAll(selector));

$('#myDiv').map(head).map(div => div.innerHTML);
// IO(() => 'I am some inner html')
```
这里，`io_window`是一个真正的`IO`，我们可以直接对它使用`map`。至于`$`，则是一个函数，调用后会返回一个`IO`。我把这里的返回值都写成了概念性的，这样就更加直观；不过实际的返回值是`{ effect: [Function] }`。当调用`IO`的 `map`的时候，我们把传进来的函数放在了`map`函数里的组合的最末端（也就是最左边），反过来这个函数就成为了新的`IO` 的新`effect`，并继续下去。传给`map`的函数并没有运行，我们只是把它们压到一个**运行栈**的最末端而已，一个函数紧挨着另一个函数，就像小心摆放的多米诺骨牌一样，让人不敢轻易推倒。这种情形很容易叫人联想起“四人帮”（《设计模式》一书作者）提出的命令模式（command pattern）或者队列（queue）。

好了，我们已经把野兽关进了笼子。但是，在某一时刻还是要把它放出来。因为对 IO 调用 map 已经积累了太多不纯的操作，最后再运行它无疑会打破平静。问题是在哪里，什么时候打开笼子的开关？而且有没有可能我们只运行 IO 却不让不纯的操作弄脏双手？答案是可以的，只要把责任推到调用者身上就行了。我们的纯代码，尽管阴险狡诈诡计多端，但是却始终保持一副清白无辜的模样，反而是实际运行 IO 并产生了作用的调用者，背了黑锅。来看一个具体的例子。

``` js
ioWindow
  .map(prop('location'))
  .map(prop('href'))
  .map(split('/'))
  .run()
```
在没有执行`run`函数之前，我们所有的代码都是`纯的`,我们最后让`run`函数来背黑锅。

IO 会成为一个忠诚的伴侣，帮助我们驯化那些狂野的非纯操作

>也可以说IO相当于一定程度上的lazy Box

### 总结
我们已经认识了几个不同的 functor，但它们的数量其实是无限的。有一些值得注意的可迭代数据类型（iterable data structure）我们没有介绍，像 tree、list、map 和 pair 等，以及所有你能说出来的。eventstream 和 observable 也都是 functor。

用多个 functor 参数调用一个函数怎么样呢？处理一个由不纯的或者异步的操作组成的有序序列怎么样呢？要应对这个什么都装在盒子里的世界，目前我们工具箱里的工具还不全。下一章，我们将直奔 monad 而去。