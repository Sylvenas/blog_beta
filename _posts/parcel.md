---
title: Parcel简介
categories: bundlers
excerpt: Parcel是web应用打包工具，主要特点是无须任何配置和速度极快
date: 2018-01-29
---

Parcel是web应用打包工具，主要特点是无须任何配置(`当然是吹牛，对于复杂的应用还是需要一些简单的配置`)和速度极快，对于受够了`webpack`那些机器复杂的配置项的同学来说是一种解放！在也不想去看`webpack`的那一堆一堆的`loader`和`plugin`了。

对于`Parcel`的简单入门就不再做过多的描述，太简单了，到官网一看便知，下面主要说几种我们在开发中经常遇到的场景，以及配合`Parcel`的解决方案。

### 接口代理
在前端开发中，现在在开发阶段会自己mock后端接口的数据，当我们开发完成需要和后端连调的时候，就需要做一个接口代理，把我们的请求从mock的数据，转向真正的后端的接口，那就需要一个代理，这个代理如何做呢？
从`Parcel`的零配置，是不太还做到，我们可以换个思路自己做一个服务器，借用`http-proxy-middleware`来转发http请求，创建文件`dev.js`代码如下：
``` js
const proxy = require("http-proxy-middleware");
const Bundler = require("parcel-bundler");
const express = require("express");

let bundler = new Bundler("index.html");
let app = express();

app.use(
  "/api",
  proxy({
    target: "http://localhost:3000",
    changeOrigin: true
  })
);

app.use(bundler.middleware());

app.listen(1234);
```
`package.json`文件`scripts`中添加
``` bash
"start": "node dev.js",
```
以后启动项目就可以`npm start`来启动了，会自动帮我们启动一个开发服务器和接口代理。
### 代码路径简写
相信大家看到`../../../../../img/a.jpeg`这样的代码都是非常让人讨厌的，这路径谁也不想看，那么我们能不能用一个虚拟路径`img`来替`../../../../../img`呢，答案是肯定的，因为在我们把代码编译打包的时候，实际上是`babel`在做这个工作，那么我们用`babel-plugin-module-resolver`来帮我们做路径替换，我们首先要安装`babel-plugin-module-resolver`:
``` bash
yarn add babel-plugin-module-resolver --dev
``` 
然后添加配置`.babelrc`
``` babelrc
{
  "plugins": [
    [
      "module-resolver",
      {
        "root": ["./src"],
        "alias": {
          "img": "./src/imgs"
        }
      }
    ]
  ]
}
```
这样以后就可以用`img`来替换`../../../../../img/a.jpeg`这样的路径了。

### React代码切割
代码拆分这一段本不该写在这里的，但是遇到的人太多，类似的需求场景也很多，所以还是简单的写一下，我们可以借助`react-loadable`库来实现，首先安装，代码如下：
``` bash
yarn add react-loadable
```
``` js
import Loadable from "react-loadable";

import Loading from "../components/loading/loading";

const AsyncHome = Loadable({
  loader: () => import("../components/home/home"),
  loading: Loading,
  delay: 300 // 0.3 seconds
});
```
在使用中如果遇到了其他的常见需求场景，会继续补充。