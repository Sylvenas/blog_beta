---
title: Call Back
categories: Async
date: 2015-02-03
---

在JavaScript代码中，回调是编写和处理JavaScript程序异步逻辑的最常用的方式，甚至可以说回调是JavaScript中最基础的异步模式，回调函数作为异步的主力军，并且他们不辱使命的完成了自己的任务。

但是回调函数也不是没有缺点。

### 嵌套回调
考虑代码：
``` js
listen('click', function () {
  setTimeout(function () {
    ajax('http://some.url.com', function (response) {
      if (response === '1') {
        doSomething();
      } else {
        doOtherthing();
      }
    })
  }, 500)
})
```
我们很经常见到这样的代码，这里我们三个函数嵌套在一起构成链，其中每个函数代表异步序列(任务)中的一个步骤。

这种代码常常被称为回调地狱(callback hell),有时候也被称为毁灭金字塔(pyramid of doom,得名于嵌套锁紧的横向三角形)。

但实际上**回调地狱与嵌套和锁紧几乎没有什么关系**，它引起的问题要比这些严重的多。

### 链式回调
``` js
const btn = document.querySelector('button')
//监听按钮点击事件
btn.onclick = () => {
debounceFun()
}
//去抖动
const debounceFun = _.debounce(() => {
ajax()
}, 500)
//ajax 请求
const ajax = function () {
axios.get('https://easy-mock.com/mock/5b0525349ae34e7a89352191/example/mock')
    .then(data => {
    console.log("ajax返回成功");
    myData = data.data
    console.log(myData);
    })
    .catch(error => {
    console.log("ajax返回失败");
    })
}
```
我相信很多人都会通过这种链式回调的方式处理异步回调，因为可读性比嵌套回调要搞，但是维护的成本可能要高很多
上面的栗子，三个异步函数之间只有执行顺序上的关联，并没有数据上的关联，但是实际开发中的情况要比这个复杂,

### 回调函数参数校验
看个简单的例子：
``` js
let girlName = "裘千尺"

function hr(callBack) {
setTimeout(() => {
    girlName = "黄蓉"
    console.log('我是黄蓉');
    callBack(girlName)
}, 0);
}

function gj(love) {
console.log(`${girlName}你好，我是郭靖，认识一下吧，我喜欢${love}`);
}
hr(gj)
```
gj作为hr的回调函数，并且hr将自己的一个变量传递给gj，gj在hr的回调中执行，
仔细看这种写法并不严谨，
如果gj并不只是一个function类型会怎么样？
如果love的实参并不存在会怎么样？
况且这只是一个简单的栗子
所以回调函数中，参数的校验是很有必要的，回调函数链拉的越长，校验的条件就会越多，代码量就会越多，随之而来的问题就是可读性和可维护性就会降低。

### 安全性
但我们引用了第三方的插件或库的时候，有时候难免要出现异步回调的情况，一个栗子：
xx支付，当用户发起支付后，我们将自己的一个回调函数，传递给xx支付，xx支付比较耗时，执行完之后，理论上它会去执行我们传递给他的回调函数，是的理论上是这样的，我们把回调的执行权交给了第三方，隐患随之而来
第三方支付，多次调用我们的回调函数怎么办？
第三方支付，不调用我们的回调函数怎么办？
当我们把回调函数的执行权交给别人时，我们也要考虑各种场景可能会发生的问题
