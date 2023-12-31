---
title: Node.js核心概念讲解
categories: Node.js
date: 2016-07-17
---

## Node.js架构
相信只要你是一名前端，或多或少都能说出一些你对 Node.js 的理解与看法。

我们先来看看浏览器与Node的一个对比，毕竟很多前端初学者可能还没有接触过Node，只是在浏览器里面跑项目。

![Node.js VS Chrome](https://p1.music.126.net/EEohndwWlmawXTRv6As9Ww==/109951164833954299.png)

左图是浏览器的一个简单架构，我们平时写的前端项目无非就是3个部分:

HTML跟CSS交给`WebKit`引擎去处理，经过一系列的转换处理，最终呈现到我们的屏幕上，之前有看过Chrome团队SteveKobes的一个分享，从最底层出发分析了浏览器的一个渲染过程，后面找时间再跟大家分享。

JavaScript交给`V8引擎`去处理，解析，关于引擎本文暂时不多讲。

再往下看到中间层，Chrome中的中间层能力是有限的，因为被限制在了浏览器中，比如我们想在浏览器中操作一些本地的文件，早些时候是很难的一件事情，不过随着HTML5的普及，已经可以实现部分功能了，但是跟Node中间层的能力比起来，还差很多。

我们把左图中的红色部分去掉，其实也就是一个简单的 Node 架构了，在 Node 中，我们可以随意的操控文件，甚至搭建各种服务，虽然 Node 不处理 UI 层，但是却与浏览器以相同的机制和原理运行，并且在中间层这里有着自己更加强大的功能。

> 顺着这个思路，我们再想想，如果我们把 WebKit 引擎也进行抽离，然后再加上 Node，是不是就可以脱离浏览器开发带有 UI 处理的 Node 项目了？想必你已经知道怪怪要说啥了，Electron 其实就是这样做的 ~ 

所以，简单直观的来讲 Node 就是脱离了浏览器的，但仍然基于 Chrome V8 引擎的一个 JavaScript 的运行环境。  

从官网的介绍中也可以看到，其 轻量、高效、事件驱动、非阻塞 I/O 是 Node 几个很重要的特性，接下来，我们将从 Node 的运行机制作为切入点，一步步带大家剖析 Node 单线程如何实现高并发，又是如何充分利用服务器资源的。 

上面的 Node 架构图比较简易，下面看看比较完整的，基础架构可以大致分为下面三层：

![Node.js架构图](https://p1.music.126.net/IaLqEsbRQL8ZhcyAr2wXsQ==/109951164834009707.png)

### 上层
这一层是Node.js标准库，其实简单理解就是JavaScript代码，可以在便携代码时直接调用相关API，Node.js提供了很多很强大的 API 供我们实现，具体可多在实践中去使用深入，举个很简单的例子，我们可以用 Node 写一个定时脚本，去检查口罩是否有货。

### 中层
Node bindings（由 c++ 实现），这一层说白了就是个媒人，牵线搭桥，让 JavaScript 小哥哥能够与下层的一堆小姐姐进行交往，Node 之所有这么强，这一层起了十分关键的作用。

### 下层

这一层是Node.js运行时的关键核心所在

- V8: 可以简单粗暴归纳为，目前业界最牛的 JavaScrpt 引擎。虽然有人尝试使用 V8 的替代品，比如 node-chakracore 项目 以及 spidernode 项目，但 Node.js 依然默认使用 V8 引擎。

- c-ares: 一个由 C 语言实现的异步 DNS 请求库

- http parser: OpenSSL、zlib 等，提供一些其他的基础能力

- libuv: 是一个高性能的，事件驱动的 I/O 库，并且提供了跨平台（如 Windows、Linux）的API。它强制使用异步的，事件驱动的编程风格，核心工作就是提供一个 event loop，还有基于 I/O 和其它事件通知的回调函数。并且还提供了一些核心工具，例如定时器，非阻塞的网络支持，异步文件系统访问，子进程等

### Node.js的调用的链路说明
假设我们需要打开一个本地 txt 的文件的内容，那代码可以写成这样：

``` js
const fs = require('fs')

fs.open('./hello.txt', 'w', function(err,content){
  // ...
})
```
`fs.open()`的作用是根据指定路径和参数去打开一个文件，返回一个文件描述符

我们进去 lib/fs.js ，看看底层源码：

``` js
async function open(path, flags, mode) {  
  mode = modeNum(mode, 0o666);  
  path = getPathFromURL(path);  
  validatePath(path);  
  validateUint32(mode, 'mode');  
  return new FileHandle(
    await binding.openFileHandle(
      pathModule.toNamespacedPath(path), 
      stringToFlags(flags), 
      mode, 
      kUsePromises)
  );
}
```
JavaScript 代码通过调用 C++ 核心模块进行下层操作，其调用过程可表示为:

![JS -> C++](https://p1.music.126.net/TXMjFBa8WEbILn7rpM2nfA==/109951164834044273.png)

从 JavaScript 调用 Node.js 标准库，再由标准库调用 C++ 模块，C++ 模块再通过 libuv 进行系统调用，这一流程即为 Node 中最为常见的调用方式。同时 libuv 还提供了 *UNIX 和 Windows 两个平台的实现，赋予了 Node.js 跨平台的能力。

## Node.js与单线程
所谓的 Node 单线程其实只是一个 JavaScript 主线程，那些耗时的异步操作还是线程池完成的，Node 将这些耗时的操作都扔到线程池去处理了，而 Node 自己只需要往返调度，并没有执行真正的 I/O 操作。

![Node.js与单线程](https://p1.music.126.net/nj7_WNaLiDK2THr6iD-bOg==/109951164834047884.png)

### 单线程与CPU密集
单线程带来了不需要在意状态同步问题的好处，同时也带了几个弱点

- 无法利用多核 CPU
- 出现错误会导致整个应用退出
- CPU 密集型任务会导致异步I/O失效

Node.js 中用来解决单线程中 CPU 密集任务的方法很粗暴，那就是直接开子进程，通过 child_process 将计算任务分发给子进程，再通过进程之间的事件消息来传递结果，也就是进程间通信。（Node 中是采用管道的方式进行通信的哦~）

此部分可以仔细阅读[专题文章](/blog/2018/10/22/node-process-stability.html)深入理解

## 事件驱动
由于JavaScript是单线程的，这使得它天生就是同步的。也是就是说JavaScript在运行中会逐行执行，直到程序结束。由于Node.js是基于JavaScript的，因此Node.js继承了这种单线程同步行为。不过某些功能需要等待另外一些耗时操作(比如读取文件，等待web响应)，而操作完成之前程序无法继续运行，这很很明显是不合理切不可接受的。

防止这种阻塞的解决方案就是事件驱动，事件驱动的实质就是通过`主循环` + `事件触发`的方式来运行程序。

事件循环的职责，就是不断得等待事件的发生，然后将这个事件的所有处理器，以它们订阅这个事件的时间顺序，依次执行。当这个事件的所有处理器都被执行完毕之后，事件循环就会开始继续等待下一个事件的触发，不断往复。

### 事件循环
Node 的事件循环采用了 libuv 的默认事件循环，相应代码可在 src/node.cc 中看到。

创建 Node 运行环境：
```  C++
Environment* env = CreateEnvironment(
  node_isolate,
  uv_default_loop(),
  context,
  argc,
  argv,
  exec_argc,
  exec_argv);
```
启动事件循环:
``` C++
bool more;
do {  
  more = uv_run(env->event_loop(), UV_RUN_ONCE);  
  if (more == false) {    
    EmitBeforeExit(env);    
    // Emit `beforeExit` if the loop became alive either after emitting    
    // event, or after running some callbacks.    
    more = uv_loop_alive(env->event_loop());    
    if (uv_run(env->event_loop(), UV_RUN_NOWAIT) != 0)      
    more = true;  
    }
  } while (more == true);
  code = EmitExit(env);
  RunAtExit(env);
```

more 用来标识是否进行下一轮循环。接下来 Node.js 会根据 more 的情况决定下一步操作

- 如果more为true，则继续运行下一轮loop。

- 如果more为false，说明已经没有等待处理的事件了，EmitBeforeExit(env); 触发进程的  beforeExit 事件，检查并处理相应的处理函数，完成后直接跳出循环。

最后触发 exit 事件，执行相应的回调函数，Node.js 运行结束，后面会进行一些资源释放操作。

![event loop](https://p1.music.126.net/-CJmC4_h96TNWO8TSH3raw==/109951164834093676.png)

### 观察者
每个事件循环中都会有观察者，判断是否有要处理的事件就是向这些观察者询问。在 Node.js 中，事件来源主要有网络请求，文件 I/O 等，这些事件都会对应不同的观察者。

### 请求对象
请求对象是 Node 发起调用到内核执行完成 I/O 操作的过渡过程中，产生的一种中间产物。例如，libuv 调用文件 I/O 时，就会立即返回 FSReqWrap 请求对象，JavaScript 传入的参数和当前的方法都被封装在这个请求对象中，同时这个对象也会被推送给内核等待执行。

### 事件驱动的优势
事件循环、观察者、请求对象、I/O 线程池共同构成了 Node 的事件驱动异步 I/O 模型。

Apache 采用每个请求启动一个线程的方式来处理请求，虽然线程比较轻量，但仍需要占用一定内存，当大并发请求来临时，内存占用会非常高，导致服务器缓慢。

Node.js 采用事件驱动的方式处理请求，无须为每个请求创建线程，可以省去很多线程创建、销毁和系统上下文切换的开销，即使在大并发条件下，也能提供良好的性能。Nginx 也和 Node 采用了相同的事件驱动模型，借助优异的性能，Nginx 也在逐渐取代 Apache 成为 Web 服务器的主流。










