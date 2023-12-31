---
title: 常用小工具代码集合
categories: Design
excerpt: 常用小工具代码集合
date: 2015-04-21
---

### web front download file by url
最常见的场景为前端点击下载按钮，请求后端接口，后端返回一个uri,然后前端负责下载，方法如下
``` js
/**
 * 根据文件地址和文件名下载文件
 * @param {String} uri
 * @param {String} name
 */
function downloadURI(uri,name){
    var link = document.createElement('a');
    link.download = name;
    link.href = uri;

    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    link = null;
}
```

### 获取元素相对于浏览器的left&top的位置
``` js
/**
 * 获取元素相对于浏览器的left&top位置
 * @param {HTMLElement} node 
 * @returns {left:number,top:number}
 */
function getOffset(node) {
	const box = node.getBoundingClientRect();
	const docElem = document.documentElement;
	return {
		left: box.left + (window.pageXOffset || docElem.scrollLeft) -
			(docElem.clientLeft || document.body.clientLeft || 0),
		top: box.top + (window.pageYOffset || docElem.scrollTop) -
			(docElem.clientTop || document.body.clientTop || 0),
	};
}
```
### 判断元素是否在可是区域内
``` js
/**
 * @param {HTMLElement} el 
 * @returns {bool}
*/
function isElementInViewport (el) {
    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
```

### 前端异步打开新的网页
经常遇到需要用户点击按钮，然后请求数据，然后打开新标签页的情况，例如：文件预览，由于浏览器的安全限制，不能在异步(ajax)代码中做页面跳转,例如下面的代码：
``` js
 ajax('...').then(()=>{
    window.open('http://www.google.com')
 })
```
很明显浏览器会拦截新标签页的打开，那么该怎么解决这个问题呢？

* 异步之前先打开，然后重定向
``` js
const newPage = window.open('', '_blank')

ajax.get('...').then(res => {
    newPage.location.href = 'https://www.google.com'
})
```

* 动态创建a标签,只能在当前页打开
``` js{4}
axios.get('https://unpkg.com/axios/dist/axios.min.js').then(res => {
    var link = document.createElement('a');

    // link.setAttribute('target','_blank')
    link.href = 'http://www.baidu.com';

    link.click();
})
```
但是注意上面的第四行代码，如果加上`target='_blank'`属性的话，那么也会被浏览器拦截，所以这个方法有一定的缺陷

* 把异步请求改成同步，这个已经改变问题的主旨了不建议使用
``` js
const success = false;
ajax.get({
    async:false
    // ....
}).then(res => {
    success = true;
})

if(success){
    window.open('http://baidu.com')
}
```