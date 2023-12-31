---
title: NGINX 基础知识
categories: http
date: 2019-06-23
---

Nginx 是一个遵循主从架构的 Web 服务器，可以用作反向代理、负载均衡器、邮件代理和 HTTP 缓存。
哇！复杂的术语和混乱的定义，里面充斥着大量令人困惑的词语，对吧？不用担心，这篇文章可以帮大家先了解 Nginx 的基本架构和术语，然后我们将安装并创建 Nginx 配置。

Nginx 是一个神奇的 Web 服务器。

简单来说，Web 服务器就像个中间人。比如你想访问 dev.to，输入地址 `https://dev.to`，你的浏览器就会找出 `https://dev.to`的 Web 服务器地址，然后将其定向到后台服务器，后台服务器会把响应返回给客户端。

## 代理 vs 反向代理

Nginx 的基本功能是代理，所以现在就需要了解什么是代理和反向代理。

## Proxy

目前国内无法访问 google，但是我们有时说挂个代理，然后就能顺利访问，而这种代理模式就是正向代理。假如我们在香港有一台服务器，这台服务器是能访问 google 的，而国内无法直接访问谷歌，但是可以访问香港的服务器。每次我们请求香港服务器，香港服务器拿到我们请求以后，再去访问 google 服务器，google 服务器把响应返回给香港服务器，香港服务器再把响应返回给我们。这样我们就能顺利的访问 google 了。

但是如果过多的客户端使用代理，导致代理服务器频繁请求 google，而 google 可能认为代理服务器是爬虫，会做一些反扒机制，这样客户端就无法正常访问，所以有时候代理服务器会告诉 google 我是一台代理服务器。

好的，我们有一个或多个客户端、一个中间 Web 服务器 A（在这种情况下，我们称它为代理）和一个真正提供服务的服务器 B。这其中最主要的事情是**B 服务器不知道哪个客户端正在请求**。是不是有点困惑？让我用一张示意图来解释一下。

![proxy](https://p5.music.126.net/obj/wo3DlcOGw6DClTvDisK1/8543146241/55e6/1631/c35a/451a4a3805baa4646e25b80b6331f415.png)

一般来说代理分为三种，即透明代理，匿名代理和高匿名代理。

- 透明代理，代理服务器暴露了客户端真实的信息。
- 匿名代理，隐藏了客户端信息，但是会声明自己是代理服务器。
- 高匿名代理，隐藏了客户端信息，也不会声明自己是代理服务器，目标服务器不知道是否使用了代理，更不知道客户端真实信息

### Reverse Proxy

例如淘宝，每天访问量很大，不可能只用单个服务器处理所有业务，于是出现了分布式部署。也就是通过部署多台服务器来解决访问人数限制的问题。

客户端请求 taobao.com，DNS 服务器把域名解析到 nginx 服务器上（简单的这么理解），nginx 服务器接收到之后，按照一定的规则(比如：轮询调度 Round-Robin)分发给了后端的业务处理服务器进行处理了。

反向请求的来源也就是客户端是明确的，但是请求的具体由哪台服务器处理并不明确，nginx 扮演的就是一个反向代理角色。

反向代理隐藏了具体处理业务的服务器信息。

![Reverse Proxy](https://p5.music.126.net/obj/wo3DlcOGw6DClTvDisK1/8543309473/ebbe/f458/593c/28fe58d5c83ee7cb2822fb0e362969da.png)

## 负载均衡

可恶，又是一个新词，但是这个词比较容易理解，因为它是“反向代理”本身的一个实际应用。

我们先说说基本的区别。在负载均衡中，必须要有两个或者更多的后台服务器；但在反向代理设置中，这不是必须的，它甚至可以只跟单台后台服务器一起使用。

让我们从幕后看一下，如果我们有大量来自客户端的请求，这个负载均衡器会检查每个后台服务器的状态并分配请求的负载，然后将响应更快地发送给客户端，目的就是保障每台服务器的会比较平均的处理请求，而不会是“旱的旱死，涝的涝死”，分担了服务器压力，避免了服务器崩溃的情况。

## NGINX 配置

### 代理静态资源

在这里，我们让 NGINX 监听 `5000` 端口，并指向 `/nginx-demo/` 文件夹下的静态资源。

此时我们通过 `curl -k http://localohost:5000` 就可以访问到 `/nginx-demo/` 下的静态文件，默认为 `/nginx-demo/index.html`

```config
  http {

     server {
       listen 5000;
       root /path/to/nginx-demo/;
      }

  }

  events {}
```

添加 `events {}` 是必须的，因为对于 NGINX 架构来讲，它通常被用来表示 `Worker` 的数量。

### Reverse Proxy

NGINX 反向代理主要通过 `proxy_pass` 来配置，将你项目的开发机地址填写到 `proxy_pass` 后面，正常的格式为 `proxy_pass URL` 即可

```nginx
server {
  listen 80;
  location / {
    proxy_pass http://10.10.10.10:20186;
  }
}
```

现在我们通过 `curl -k http://localhost/hello` 访问某个服务，NGINX 会把该请求转发到 `http://10.10.10.10:20186/hello` 然后拿到结果，然后返回。

同时多个服务我们可以通过反向代理合并到一个端口中，比如现在服务器上有 app1 处理部分请求，app2 处理另外一部分请求，同时我们知道 Node.js http server 端口号不能重叠，所以我们可以让 app1 server 监听 1000 端口，app2 监听 2000 端口，然后通过 NGINX 反向代理到同一个端口

```nginx
server {
  listen 80;
    location /app1/ {                            # 处理 http://localhost/app1/xxxx
      proxy_pass http://localhost:1000;
    }
    location /app2/ {                            # 处理 http://localhost/app2/xxxx
      proxy_pass http://localhost:2000;
    }
}
```

具体转发到 app1,还是 app2 是根据请求的 url 决定的。url 匹配规则可以采用正则表达式，全等，前缀，后缀等等，后面会继续讲解

### HTTPS

NGINX 同样可以简单的创建 https 服务，比如我们有内部 http 服务，通过反向代理的方式可以转换成“对外”的 HTTPS 服务，通过监听 443 端口以及指定 https 证书文件和私钥文件的地址(服务器上的绝对路径)，可以简单的创建 https 服务

```sh
curl -k https://sylvenas.xyz/a/xxx 转发到 http://localhost:1000

curl -k https://sylvenas.xyz/b/xxx 转发到 http://localhost:2000
```

```nginx
server {
  listen       443 ssl;
  server_name  sylvenas.xyz;

  ssl_certificate      /Users/sylvenas/Documents/feature/nginx/final.crt;
  ssl_certificate_key  /Users/sylvenas/Documents/feature/nginx/site.key;

  ssl_session_cache    shared:SSL:1m;
  ssl_session_timeout  5m;

  ssl_ciphers  HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers  on;

  location /a/ {
    proxy_pass http://localhost:1000;
  }
  location /b/ {
    proxy_pass http://localhost:2000;
  }
}
```

## location 匹配规则

语法规则很简单，一个 location 关键字，后面跟着可选的**修饰符**(=, ~, ~\*, ^~)，后面是要匹配的字符(uri)，花括号中是要执行的操作。

### 修饰符

= 表示精确匹配。只有请求的 url 路径与后面的字符串完全相等时，才会命中。
~ 表示该规则是使用正则定义的，区分大小写。
~\* 表示该规则是使用正则定义的，不区分大小写。
^~ 表示如果该符号后面的字符是最佳匹配，采用该规则，不再进行后续的查找。

### 匹配过程

对请求的 url 序列化。例如，对 `%xx` 等字符进行解码，去除 url 中多个相连的`/`，解析 url 中的`.`，`..`等。这一步是匹配的前置工作。

location 有两种表示形式，一种是使用前缀字符，一种是使用正则。如果是正则的话，前面有 `~` 或 `~\*` 修饰符。

> 正则也是前缀字符的一种，这里只是单独拿出来说罢了，就是为了区分正则和普通的前缀字符

具体的匹配过程如下：

- 首先先检查使用前缀字符定义的 location，选择最长匹配的项并记录下来。
- 如果找到了精确匹配的 location，也就是使用了 `=` 修饰符的 location，结束查找，使用它的配置。
- 然后按顺序查找使用正则定义的 location，如果匹配则停止查找，使用它定义的配置。
- 如果没有匹配的正则 location，则使用前面记录的最长匹配前缀字符 location。

基于以上的匹配过程，我们可以得到以下两点启示：

使用正则定义的 location 在配置文件中出现的顺序很重要。因为找到第一个匹配的正则后，查找就停止了，后面定义的正则就是再匹配也没有机会了。
使用精确匹配可以提高查找的速度。例如经常请求 `/` 的话，可以使用 `=` 来定义 location。

### 实例

假如我们有下面的一段配置文件：

```nginx
location = / {
    [ configuration A ]
}

location / {
    [ configuration B ]
}

location /user/ {
    [ configuration C ]
}

location ^~ /images/ {
    [ configuration D ]
}

location ~* \.(gif|jpg|jpeg)$ {
    [ configuration E ]
}
```

- 请求 `/` 精准匹配 A，不再往下查找。

- 请求 `/index.html` 匹配 B。首先查找匹配的前缀字符，找到最长匹配是配置 B，接着又按照顺序查找匹配的正则。结果没有找到，因此使用先前标记的最长匹配，即配置 B。

- 请求 `/user/index.html` 匹配 C。首先找到最长匹配 C，由于后面没有匹配的正则，所以使用最长匹配 C。

- 请求 `/user/1.jpg` 匹配 E。首先进行前缀字符的查找，找到最长匹配项 C，继续进行正则查找，找到匹配项 E。因此使用 E。

- 请求 `/images/1.jpg` 匹配 D。首先进行前缀字符的查找，找到最长匹配 D。但是，特殊的是它使用了 `^~` 修饰符，不再进行接下来的正则的匹配查找，因此使用 D。这里，如果没有前面的修饰符，其实最终的匹配是 E。大家可以想一想为什么。

- 请求 `/documents/about.html` 匹配 B。因为 B 表示任何以 `/` 开头的 URL 都匹配。在上面的配置中，只有 B 能满足，所以匹配 B。

## 负载均衡
NGINX 通过 `upstream` 模块实现负载均衡

``` nginx
worker_processes 1;
events {
    worker_connections 1024;
}
http {
    upstream firstdemo {
        server 39.106.145.33;
        server 47.93.6.93;
    }
    server {
        listen 8080;
        location / {
            proxy_pass http://firstdemo;
        }
    }
}
```

- worker_processes   
工作进程数，和CPU核数相同

- worker_connections   
每个进程允许的最大连接数

- upstream 模块   
负载均衡就靠它
语法格式：upstream name {}
里面写的两个server分别对应着不同的服务器

- server 模块   
实现反向代理
listen 监督端口号
location / {}访问根路径
proxy_pass http://firstdemo，代理到 firstdemo 里两个服务器上

#### ip_hash
当用户第一次访问到其中一台服务器后，下次再访问的时候就直接访问该台服务器就好了，不用总变化了。那么就发挥了 `ip_hash` 的威力了
``` nginx
upstream firstdemo {
    ip_hash;
    server 39.106.145.33;
    server 47.93.6.93;
}
```
`ip_hash` 它的作用是如果第一次访问该服务器后就记录，之后再访问都是该服务器了，这样比如第一次访问是服务器A，那之后再访问也会分配为服务器A访问了。

## 常用命令
- 启动
``` sh
sudo nginx
```

- 重启
``` sh
sudo nginx -s reopen 
```

- 重新加载Nginx配置文件，然后以优雅的方式重启Nginx
``` sh
nginx -s reload 
```

- 强制停止Nginx服务
``` sh
nginx -s stop 
```

- 优雅地停止Nginx服务（即处理完所有请求后再停止服务）
``` sh
nginx -s stop 
```

- 检测配置文件是否有语法错误，然后退出
``` sh
nginx -t  
```

- 杀死所有nginx进程
``` sh
killall nginx 
```