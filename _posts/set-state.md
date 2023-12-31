---
title: setState Might Be Synchronous
categories: React
date: 2017-10-23
---

之前一直知道React中`setState`是一个异步的操作，如果我们再一个函数内有两个`setState`,那么他们会合并，只执行最后一个`setState`,例如：
``` js
handleClick = () => {
    console.log(this.state.count); // assume it is 0
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 1 });
}
```
两个`setState`都是异步的，第一个`setState`不会修改`this.state.count`,然后我们得到的结果是`this.state.count === 1`.Right?

但是有一种情况，当`setState`在React生命周期之外被调用的时候，例如：JavaScript原声的DOM listener(通过addEventListener添加)、setTimeout、setInterval、requestAnimationFrame以及ajax callbacks.这是因为React大部分时间都处于闲置状态，当调用`setState`的时候，React首先会检查是否有批量更新更在进行，如果有那就添加到批量更新中，如果没有，React就会继续执行更新.

看一下下面的这个例子，当我们点击页面的时候，我们最直接的想法是，state将会从0变成1，但是实际上，它是从0变成了2.
``` js
import React from "react";
import { render } from "react-dom";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  handleClick = () => {
    console.log(this.state.count);
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 1 });
    console.log(this.state.count);
  };

  componentDidMount() {
    document.documentElement.addEventListener("click", this.handleClick);
  }

  componentWillUnmount() {
    document.documentElement.removeEventListener("click", this.handleClick);
  }

  render() {
    return (
      <div>
        Click on anywhere. The current state is {this.state.count}{" "}
      </div>
    );
  }
}

render(<App />, document.getElementById("root"));
```

在大部分情况下，同步的`setState`也不是什么坏事，很多的初学者对异步的`setState`感到非常的困惑，不过如果你想在React生命周期之外也能够合并`setState`，可以使用`react-dom`中一个隐藏的API，`unstable_batchedUpdates`,这个api又一个`unstable`(不稳定)的前缀，不过现在还是可以使用的，以后在升级的时候，注意这个问题就好了。
``` js
import { unstable_batchedUpdates} from 'react-dom'

unstable_batchedUpdates(() => {
    this.setState({count: this.state.count + 1});
    this.setState({count: this.state.count + 1});
});
```
