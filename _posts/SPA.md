---
title: SPA 实现原理
categories: React
date: 2017-08-21
---
### 基础概念
单页面应用的核心是在不刷新当前页面的情况下，来实现页面URL和页面内容的变化，那么我们需要关注的要点也就在于怎么修改URL和页面的内容
#### 浏览器history
HTML5引入了`history.pushState()`和`history.replaceState()`方法，它们分别可以添加和修改历史记录条目。这些方法通常与`window.onpopstate`配合使用。

相同之处是两个 API 都会操作浏览器的历史记录，而不会引起页面的刷新。

这两个 API 都接收三个参数，分别是

* 状态对象(state object) — 一个JavaScript对象，与用`pushState()`方法创建的新历史记录条目关联。无论何时用户导航到新创建的状态，`popstate`事件都会被触发，并且事件对象的state属性都包含历史记录条目的状态对象的拷贝。

* 标题(title) — FireFox浏览器目前会忽略该参数，虽然以后可能会用上。考虑到未来可能会对该方法进行修改，传一个空字符串会比较安全。或者，你也可以传入一个简短的标题，标明将要进入的状态。

* 地址(URL) — 新的历史记录条目的地址。浏览器不会在调用`pushState()`方法后加载该地址，但之后，可能会试图加载，例如用户重启浏览器。新的URL不一定是绝对路径；如果是相对路径，它将以当前URL为基准；传入的URL与当前URL应该是同源的，否则，`pushState()`会抛出异常。该参数是可选的；不指定的话则为文档当前URL。

`history.replaceState()`的使用与`history.pushState()`非常相似，区别在于`pushState`会增加一条新的历史记录，而`replaceState`则会替换当前的历史记录。注意这并不会阻止其在全局浏览器历史记录中创建一个新的历史记录项。

`replaceState()`的使用场景在于为了响应用户操作，你想要更新状态对象state或者当前历史记录的URL。

#### popstate
`window.onpopstate`是popstate事件在window对象上的事件处理程序。

每当处于激活状态的历史记录条目发生变化时,`popstate`事件就会在对应window对象上触发。如果当前处于激活状态的历史记录条目是由`history.pushState()`方法创建,或者由`history.replaceState()`方法修改过的, 则`popstate`事件对象的`state`属性包含了这个历史记录条目的`state`对象的一个拷贝。

调用`history.pushState()`或者`history.replaceState()`不会触发`popstate`事件. `popstate`事件只会在浏览器某些行为下触发, 比如`点击后退、前进按钮`(或者在JavaScript中调用`history.back()`、`history.forward()`、`history.go()`方法)。

#### hash
`location.hash`的值是`url`中#后面的内容
比如`https://www.google.com/#abc`的`hash`值为`abc`
hash发生变化的url都会被浏览器记录下来，所以浏览器的前进后退都可以用
特点：
* 改变url的同时，不刷新页面，hash是用来指导浏览器行为的，对服务端是无用的，所以不会包括在http请求中，所以可以随意刷新
* 浏览器提供了`onhashchange`事件来监听hash的变化

#### history模式的问题
虽然丢掉了`#`，也不怕浏览器的前进和后退，但是页面怕刷新，会把请求发送到服务器，但如果没有对应的资源，就会`404`找不到相关资源。

而hash则没有这个问题，因为浏览器请求不带它玩。

### hash router的实现
hashrouter实现的关键点就在于每一次hash值的每次的变化都会触发`onhashchange`事件的调用；下面看一下hashRouter的简单实现：
``` html
<body>
    <div id="app">
        <ul>
            <li><a href="#/">home</a></li>
            <li><a href="#/about">about</a></li>
            <li><a href="#/topics">topics</a></li>
        </ul>
        <div id="content"></div>
    </div>
    <script>
        class Router {
            constructor() {
                this.routes = {};
                this.currentUrl = '';
            }
            // routes 用来存放不同路由对应的回调函数
            route(path, callback) {
                this.routes[path] = callback || function () { };
            }
            updateView() {
                this.currentUrl = location.hash.slice(1) || '/';
                // 如果存在该路径，则执行该路径对应的回调函数
                this.routes[this.currentUrl] && this.routes[this.currentUrl]();
            }
            // init 用来初始化路由，在 load 事件发生后刷新页面，
            // 并且绑定 hashchange 事件，当 hash 值改变时触发对应回调函数
            init() {
                window.addEventListener('load', this.updateView.bind(this), false);
                window.addEventListener('hashchange', this.updateView.bind(this), false);
            }
        }

        const router = new Router();
        router.init();
        router.route('/', function () {
            document.getElementById('content').innerHTML = 'Home';
        });
        router.route('/about', function () {
            document.getElementById('content').innerHTML = 'About';
        });
        router.route('/topics', function () {
            document.getElementById('content').innerHTML = 'Topics';
        });
    </script>
</body>
```
### history router的实现
hash 的改变可以触发`onhashchange`事件，而`history`的改变并不会触发任何事件，这让我们无法直接去监听`history`的改变从而做出相应的改变。

换个思路
罗列出所有可能触发`history`改变的情况，并且将这些方式一一进行拦截，变相地监听`history`的改变

对于一个应用而言，url的改变(不包括hash值得改变)只能由下面三种情况引起：

* 点击浏览器的前进或后退按钮 => 可以监听`onpopstate`事件
* 点击`<a></a>`标签,我们可以阻止`a`标签的默认事件，然后使用自己的逻辑老处理相关的跳转
* 在JavaScript代码中触发`history.push(replace)State`函数

history路由跟上面的hash类似，区别在于`init`初始化函数，首先需要获取所有特殊的链接标签，然后监听点击事件，并阻止其默认事件，触发`history.pushState`以及更新相应的视图
``` html
<body>
    <div id="app">
        <ul>
            <li><a href="/">home</a></li>
            <li><a href="/about">about</a></li>
            <li><a href="/topics">topics</a></li>
        </ul>
        <div id="content"></div>
    </div>
    <script>
        class Router {
            constructor() {
                this.routes = {};
                this.currentUrl = '';
            }
            // routes 用来存放不同路由对应的回调函数
            route(path, callback) {
                this.routes[path] = callback || function () { };
            }
            updateView() {
                this.currentUrl = location.pathname || '/';
                // 如果存在该路径，则执行该路径对应的回调函数
                this.routes[this.currentUrl] && this.routes[this.currentUrl]();
            }
            // init 用来初始化路由，在 load 和 popstate 事件发生后刷新页面，
            // 并且劫持所有的a标签的点击事件
            init() {
                // 该函数对a标签进行监听，并阻止默认事件，触发更新
                this._bindLink();
                window.addEventListener('popstate', e => {
                    this.updateView(window.location.pathname);
                });
                window.addEventListener('load', () => this.updateView('/'), false);
            }
            _bindLink() {
                const allLink = document.querySelectorAll('a[href]');
                for (let i = 0, len = allLink.length; i < len; i++) {
                    const current = allLink[i];
                    current.addEventListener(
                        'click',
                        e => {
                            e.preventDefault();
                            const url = current.getAttribute('href');
                            history.pushState({}, null, url);
                            this.updateView(url);
                        },
                        false
                    );
                }
            }
        }

        const router = new Router();
        router.init();
        router.route('/', function () {
            document.getElementById('content').innerHTML = 'Home';
        });
        router.route('/about', function () {
            document.getElementById('content').innerHTML = 'About';
        });
        router.route('/topics', function () {
            document.getElementById('content').innerHTML = 'Topics';
        });
    </script>
</body>
```

### solution
有了上面的两个例子，在react中我们可以直接自己做出来一个`react-router`出来，`react-router`借助[`history`](https://github.com/ReactTraining/history)这个库，实现起来更简单，主要的思路就是
* `Router`组件用来作为所有的`Route`和`Link`组件的父容器，监听`popchange`事件，并使用`context`来向下层传递数据,这个组件的`render`方法会直接返回`this.props.children`,这也是`Router`只能接收一个组件作为children的原因，[查看详情](https://github.com/ReactTraining/react-router/issues/5706)
* `Route`组件内部计算当前的页面url是否和自身`props`传递的`path`是否匹配，以及处理props传递的`render`函数，`Route`就是一个根据各种情况的渲染组件
* `Link`组件劫持`a`标签的默认事件，使用`pushState`或者`replaceState`来修改当前的url,同时通过调用context传递的`popstate`事件来触发组件的重新渲染
基于上面两点，简单的Router,主要是看一下实现的思路

#### 自己简单实现react-router
[https://github.com/Sylvenas/x-router](https://github.com/Sylvenas/x-router)
