---
title: 代理模式
categories: design pattern
excerpt: 多年以来，JavaScript中有一种奇怪的行为一直在被无耻地滥用，那就是`模仿类`。我们会仔细分析这种方法...
date: 2018-08-24
---
### 模仿类
多年以来，JavaScript中有一种奇怪的行为一直在被无耻地滥用，那就是`模仿类`。我们会仔细分析这种方法。
这种奇怪的“类似类”的行为利用了函数的一种特殊特性:所有的函数默认都会拥有一个名为`prototype`的公有并且不可枚举的属性，它会指向另一个对象:
``` js
function Foo() { // ...
}
Foo.prototype; // { }

var a = new Foo();

Object.getPrototypeOf( a ) === Foo.prototype; // true
```
这个对象通常被称为`Foo的原型`，因为我们通过名为`Foo.prototype`的属性引用来访问它。

调用`new Foo()`时会创建`a`，其中的一步就是给`a`一个内部的`[[Prototype]]`链接，关联到`Foo.prototype`指向的那个对象。
下面是`new`操作符的具体实现，也就是假如没有`new`操作符的时候，我们该怎么实现`new`呢？
``` js
function newObject(Constructor) {
    const obj = Object.create(Constructor.prototype);
    Constructor.apply(obj,[...arguments].slice(1));
    return obj;
}
```
在面向类的语言中，类可以被复制(或者说实例化)多次，就像用模具制作东西一样。之所以会这样是因为实例化(或者继承)一个类就意味着“把类的行为复制到物理对象中”，对于每一个新实例来说都会重复这个过程。
但是在JavaScript中，并没有类似的复制机制。你不能创建一个类的多个实例，只能创建多个对象，它们`[[Prototype]]`关联的是同一个对象。但是在默认情况下并不会进行复制， 因此这些对象之间并不会完全失去联系，它们是互相关联的。

`new Foo()`会生成一个新对象(我们称之为a)，这个新对象的内部链接`[[Prototype]]`关联的是`Foo.prototype`对象。

最后我们得到了两个对象，它们之间互相关联，就是这样。

我们并没有初始化一个类，实际上我们并没有从“类”中复制任何行为到一个对象中，只是让两个对象互相关联。

继承意味着复制操作，JavaScript(默认)并不会复制对象属性。

相反，JavaScript会在两个对象之间创建一个关联，这样一个对象就可以通过委托访问另一个对象的属性和函数。

`Object.create(..)` 是一个大英雄，现在是时候来弄明白为 什么了:
``` js
var foo = {
something: function() {
            console.log( "Tell me something good..." );
        }
};
var bar = Object.create( foo ); bar.something(); // Tell me something good...
```
`Object.create(..)` 会创建一个新对象(`bar`)并把它关联到我们指定的对象(`foo`)，这样 我们就可以充分发挥`[[Prototype]]`机制的威力(委托)并且避免不必要的麻烦(比如使用`new`的构造函数调用会生成`.prototype` 和`.constructor`引用)。

换句话说JavaScript中这个原型链机制的本质就是对象之间的关联关系，对象之间从未存在过“继承”这种东西
