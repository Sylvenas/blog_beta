---
title: FP12：Either:Left or Right
categories: functional
date: 2018-08-03
---
### Left or Right ?
![Left or Right](../images/leftOrRight.jpg)

说出来可能会让你震惊，`try/catch` 并不十分“纯”。当一个错误抛出的时候，我们没有收到返回值，反而是得到了一个警告！抛错的函数吐出一大堆的 0 和 1 作为盾和矛来攻击我们，简直就像是在反击输入值的入侵而进行的一场电子大作战。有了`Either`这个新朋友，我们就能以一种比向输入值宣战好得多的方式来处理错误，那就是返回一条非常礼貌的消息作为回应。我们来看一下：
``` js
class Either {
    constructor(value) {      // Either构造函数，接受一个异常或者合法的值
        this.$value = value;
    }
    static left(a) {
        return new Left(a)
    }
    static right(a) {
        return new Right(a)
    }
    static of(a) {
        return Either.right(a)
    }
    static fromNullable(val) {       // 若值非法则返回Left，否则返回Right
        return val != null ? Either.right(val) : Either.left(val)
    }
    get value() {
        return this.$value
    }
}

class Left extends Either {
    map() {     // Left不做任何操作
        return this
    }
    chain(fn) {   
        return this
    }
    filter(fn) {
        return this
    }
    getOrElse(other) {  // 尝试提取Right中的值，如果不存在则返回默认值
        return other
    }
    orElse(fn) {       // 将给定的函数应用于Left值，Right不做任何操作
        return fn(this.$value)
    }
    getOrElseThrow(a) {
        throw new Error(a)
    }
    fold(f, g) {
        return f(this.$value)
    }
    get value() {
        throw new TypeError('Can’t extract the value of a Left(a).')
    }
}

class Right extends Either {
    map(fn) {
        return Either.of(fn(this.$value))
    }
    getOrElse(other) {
        return this.$value
    }
    orElse() {
        return this
    }
    chain(fn) {
        return fn(this.$value)
    }
    getOrElseThrow() {
        return this.$value
    }
    filter(fn) {
        return Either.fromNullable(fn(this.$value) ? this.$value : null)
    }
    fold(f, g) {
        return g(this.$value)
    }
}
```
和`Maybe`略有不同，`Either`代表的是两个逻辑分离的Left和Right,他们永远不会同时出现：
* Left(a) --包含一个可能的错误消息或抛出的一场对象
* Right(b) --包含一个成功的值
`Either`通常操作右值，这意味着在容器上映射函数总是在Right(b)子类型上执行。类似于Maybe的Just分支

来看看它们是怎么运行的：
``` js
Either.Right("rain").map(function(str){ return "b"+str; });
// Right("brain")

Either.Left("rain").map(function(str){ return "b"+str; });
// Left("rain")

Either.Right({host: 'localhost', port: 80}).map(_.prop('host'));
// Right('localhost')

Either.Left("rolls eyes...").map(_.prop("host"));
// Left('rolls eyes...')
```
Left 就像是青春期少年那样无视我们要 map 它的请求。Right 的作用就像是一个 Container（也就是 Identity）。这里强大的地方在于，Left 有能力在它内部嵌入一个错误消息。

假设有一个可能会失败的函数，就拿根据生日计算年龄来说好了。的确，我们可以用 Maybe(null) 来表示失败并把程序引向另一个分支，但是这并没有告诉我们太多信息。很有可能我们想知道失败的原因是什么。用 Either 写一个这样的程序看看：

``` js
const moment = require('moment');

// getAge :: Date -> User -> Either(String, Number)
const getAge = curry((now, user) => {
  const birthDate = moment(user.birthDate, 'YYYY-MM-DD');

  return birthDate.isValid()
    ? Either.of(now.diff(birthDate, 'years'))
    : left('Birth date could not be parsed');
});

getAge(moment(), { birthDate: '2005-12-12' });
// Right(9)

getAge(moment(), { birthDate: 'July 4, 2001' });
// Left('Birth date could not be parsed')
```
这么一来，就像`Maybe(null)`，当返回一个`Left`的时候就直接让程序短路。跟`Maybe(null)`不同的是，现在我们对程序为何脱离原先轨道至少有了一点头绪。有一件事要注意，这里返回的是`Either(String, Number)`，意味着我们这个 `Either`左边的值是`String`，右边（也就是正确的值）的值是`Number`。

如果 birthdate 合法，这个程序就会把它神秘的命运打印在屏幕上让我们见证；如果不合法，我们就会收到一个有着清清楚楚的错误消息的 Left，尽管这个消息是稳稳当当地待在它的容器里的。这种行为就像，虽然我们在抛错，但是是以一种平静温和的方式抛错，而不是像一个小孩子那样，有什么不对劲就闹脾气大喊大叫。

在这个例子中，我们根据 birthdate 的合法性来控制代码的逻辑分支，同时又让代码进行从右到左的直线运动，而不用爬过各种条件语句的大括号。通常，我们不会把 console.log 放到 zoltar 函数里，而是在调用 zoltar 的时候才 map 它，不过本例中，让你看看 Right 分支如何与 Left 不同也是很有帮助的。我们在 Right 分支的类型签名中使用 _ 表示一个应该忽略的值（在有些浏览器中，你必须要 console.log.bind(console) 才能把 console.log 当作一等公民使用）。

我想借此机会指出一件你可能没注意到的事：这个例子中，尽管 fortune 使用了 Either，它对每一个 functor 到底要干什么却是毫不知情的。前面例子中的 finishTransaction 也是一样。通俗点来讲，一个函数在调用的时候，如果被 map 包裹了，那么它就会从一个非 functor 函数转换为一个 functor 函数。我们把这个过程叫做 lift。一般情况下，普通函数更适合操作普通的数据类型而不是容器类型，在必要的时候再通过 lift 变为合适的容器去操作容器类型。这样做的好处是能得到更简单、重用性更高的函数，它们能够随需求而变，兼容任意 functor。

Either 并不仅仅只对合法性检查这种一般性的错误作用非凡，对一些更严重的、能够中断程序执行的错误比如文件丢失或者 socket 连接断开等，Either 同样效果显著。你可以试试把前面例子中的 Maybe 替换为 Either，看怎么得到更好的反馈。

>仅仅是把 Either 当作一个错误消息的容器使用，这样的介绍有失偏颇，它的能耐远不止于此。比如，它表示了逻辑或（也就是 ||）。再比如，它体现了范畴学里 coproduct 的概念，当然本书不会涉及这方面的知识，但值得你去深入了解，因为这个概念有很多特性值得利用。还比如，它是标准的 sum type（或者叫不交并集，disjoint union of sets），因为它含有的所有可能的值的总数就是它包含的那两种类型的总数

### try-catch
Either还可以用来包装try-catch，来让我们的程序更加的适合函数组合(普通的try/catch会导致程序出现另一个出口，无法进行多个分支的组合)：
``` js
const tryCatch = f => {
    try {
        return Right(f())
    } catch (e) {
        return Left(e)
    }
}
```
### Either Use Cases
``` js
const openSite = (current_user) => {
    if (current_user) {
        return renderpage(current_user)
    } else {
        return showLogin()
    }
}

const openSite1 = (current_user) => {
    fromNullable(current_user)
        .fold(showLogin, renderpage)
}
```

``` js
const getPrefs = user => {
    if (user.premium) {
        return loadPrefs(user.preferences)
    } else {
        return defaultPrefs
    }
}

const getPrefs1 = user =>
    (user.premium ? Right(user) : Left('not premium'))
        .map(u => u.preferences)
        .fold(() => defaultPrefs, prefs => loadPrefs(prefs))
```

``` js
const streetName = user => {
    const address = user.address
    if (address) {
        const street = address.street
        if (street) {
            return street.name
        }
    }
    return 'no street'
}

const streetName1 = user =>
    fromNullable(user.address)
        .chain(a => fromNullable(a.street))
        .chain(s => fromNullable(s.name))
        .fold(e => 'no street', n => n)
```

``` js
const concatUniq = (x, ys) => {
    const found = ys.filter(y => y === x)[0]
    return found ? ys : ys.concat(x)
}

const concatUniq1 = (x, ys) =>
    fromNullable(ys.filter(y => y === x)[0])
        .fold(() => ys.concat(x), y => ys)
```

``` js
const wrapExamples = example => {
    if (example.previewPath) {
        try {
            example.preview = fs.readFileSync(example.previewPath)
        } catch (e) { }
    }
    return example
}

const readFile = x => tryCatch(() => fs.readFileSync(x))

const wrapExample = example =>
    fromNullable(example.previewPath)
        .chain(readFile)
        .fold(() => example,
            preview => Object.assign({}, { preview }, example))
```

``` js
const parseDbUrl = cfg => {
    try {
        const c = JSON.parse(cfg)
        if (c.url) {
            return c.url.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
        }
    } catch (e) {
        return null
    }
}

const parseDbUrl = cfg =>
    tryCatch(() => JSON.parse(cfg))
        .chain(c => fromNullable(c.url))
        .fold(e => null,
            u => u.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/))
```