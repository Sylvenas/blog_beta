---
title: pub & sub
categories: Rxjs
date: 2017-10-16
---

发布订阅模式Pub/Sub,它的主要概念为`定义一对多的关系，当一件事发布时会同时通知所有的订阅者`，在JavaScript和Jquery非常容易看到该模式的使用，例如Jquery里的`on`,下面的代码就可以想象成，`$('.someThing')`为订阅者，订阅了click,如果click事件发生了。发布者就会执行`doSomething`方法。
``` javascript
$('.SomeThing').on('click', function doSomething() {
    //doSomething
});
```
该模式的优点在于`解偶合`，发布者与订阅者不需要知道对方的存在。  
在使用的时候，当一个对象改变时，需要同时改变其他对象，但却不知道实际有多少个对象时，就可以考虑使用`Pub/Sub模式`。   

### Pub/Sub 简单示例
``` javascript
var EventHub = {
    topics: {},

    subscribe: function (topic, handler) {
        if (!this.topics[topic]) {
            this.topics[topic] = [];
        }

        this.topics[topic].push(handler);
    },

    publish: function (topic, data) {

        if (!this.topics[topic] || this.topics[topic].length < 1)
            return;

        this.topics[topic].forEach(function (listener) {
            listener(data || {});
        });
    }
};
```
然后就可以使用了，首先订阅一个`Task`,并且当Task被触发时，会自动执行`task函数`。   
``` javascript
EventHub.subscribe('Task', function task(data) {
    console.log(data + 'by Task1');
});

EventHub.subscribe('Task', function task(data) {
    console.log(data + 'by Task2');
});
```
然后来触发`Task`。
``` javascript
EventHub.publish('Task', 'Hello pub and sub~');
```
执行结果为：
``` javascript
'Hello pub and sub ~ by Task1'
'Hello pub and sub ~ by Task2'
```
### Pub/Sub 不适合处理的类型
`Pub/Sub`不适合用于一次性事件，所谓一次性事件，是指执行一次任务但可能产生多重结果（例如成功事件和失败事件），做不同的处理，`Ajax`请求就是很常见的一次性事件。这种最好使用Promise来处理。
