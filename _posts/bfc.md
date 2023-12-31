---
title: BFC 块级格式化上下文
categories: CSS
date: 2016-08-21
---

在解释 BFC 是什么之前，需要先介绍 Box、Formatting Context的概念。

#### Box: CSS布局的基本单位
Box是CSS布局的对象和基本单位，直观点来说，就是一个页面是由很多个 Box 组成的。元素的类型和 display 属性，决定了这个Box的类型。 不同类型的Box，会参与不同的Formatting Context（一个决定如何渲染文档的容器），因此Box内的元素会以不同的方式渲染。让我们看看有哪些盒子：

block-level box:display 属性为 block, list-item, table 的元素，会生成 block-level box。并且参与 block fomatting context；

inline-level box:display 属性为 inline, inline-block, inline-table 的元素，会生成 inline-level box。并且参与 inline formatting context；

run-in box: css3 中才有， 这儿先不讲了。

#### Formatting context
Formatting context 是 W3C CSS2.1 规范中的一个概念。它是页面中的一块渲染区域，并且有一套渲染规则，它决定了其子元素将如何定位，以及和其他元素的关系和相互作用。最常见的 Formatting context 有 Block fomatting context (简称BFC)和 Inline formatting context (简称IFC)。

CSS2.1 中只有 BFC 和 IFC, CSS3 中还增加了 GFC (Grid formatting context) 和 FFC (Flex formatting context)。

#### BFC 定义
BFC(Block formatting context)直译为"块级格式化上下文"。它是一个独立的渲染区域，只有Block-level box参与， 它规定了内部的Block-level Box如何布局，并且与这个区域外部毫不相干。

#### BFC布局规则：
* 内部的Box会在垂直方向，一个接一个地放置。    
* Box垂直方向的距离由margin决定。属于同一个BFC的两个相邻Box的margin会发生重叠    
* 每个元素的margin box的左边， 与包含块border box的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此。  
* BFC的区域不会与float box重叠。    
* BFC就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此。     
* 计算BFC的高度时，浮动元素也参与计算    

#### BFC触发方法
* 根元素(html)
* float属性不为none
* position为absolute或fixed
* display为inline-block, table-cell, table-caption, flex, inline-flex
* overflow不为visible

#### BFC的典型用途

* 自适应两栏布局
``` html
<style>
    body {
        width: 300px;
        position: relative;
    }
    .aside {
        width: 100px;
        height: 150px;
        float: left;
        background: #f66;
    }
    .main {
        height: 200px;
        background: #fcc;
    }
</style>
<body>
        <div class="aside"></div>
        <div class="main"></div>
    </body>
```
根据BFC布局规则第3条：  
每个元素的margin box的左边， 与包含块border box的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此。
因此，虽然存在浮动的元素aslide，但main的左边依然会与包含块的左边相接触。

根据BFC布局规则第四条：
BFC的区域不会与float box重叠。
我们可以通过通过触发main生成BFC， 来实现自适应两栏布局。

``` css
.main {
    overflow:hidden;
}
```
如果要增加两列之间的间隔的话，有两种方法比较好：
1. 左侧浮动元素增加`margin-right:20px;`
2. 右侧BFC元素增加`padding-left:20px;`

* 清除内部浮动
``` html
<style>
    .par {
        border: 5px solid #fcc;
        width: 300px;
    }
 
    .child {
        border: 5px solid #f66;
        width:100px;
        height: 100px;
        float: left;
    }
</style>
<body>
    <div class="par">
        <div class="child"></div>
        <div class="child"></div>
    </div>
</body>
```
根据BFC布局规则第六条：
计算BFC的高度时，浮动元素也参与计算
为达到清除内部浮动，我们可以触发par生成BFC，那么par在计算高度时，par内部的浮动元素child也会参与计算。
``` css
.par {
    overflow: hidden;
}
```
* 防止垂直 margin 重叠
``` html
<style>
    p {
        color: #f55;
        background: #fcc;
        width: 200px;
        line-height: 100px;
        text-align:center;
        margin: 100px;
    }
</style>
<body>
        <p>Haha</p>
        <p>Hehe</p>
    </body>
```
两个p之间的距离为100px，发送了margin重叠。
根据BFC布局规则第二条：
Box垂直方向的距离由margin决定。属于同一个BFC的两个相邻Box的margin会发生重叠。
我们可以在p外面包裹一层容器，并触发该容器生成一个BFC。那么两个P便不属于同一个BFC，就不会发生margin重叠了。

``` html
<style>
    .wrap {
        overflow: hidden;
    }
    p {
        color: #f55;
        background: #fcc;
        width: 200px;
        line-height: 100px;
        text-align:center;
        margin: 100px;
    }
</style>
<body>
    <p>Haha</p>
    <div class="wrap">
        <p>Hehe</p>
    </div>
</body>
```