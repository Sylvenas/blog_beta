---
title: Photos Wall
categories: Design
excerpt: 常用小组件及样式收集
date: 2014-02-10
---

### 内凹圆角
常用的视觉难题内凹圆角：

<div style="text-align:center;margin-top:20px" align="center">
  <img style="height:200px;" src="../../images/inner-border.png" />
</div>   

``` html
<div class="main"></div>
```

``` css
.main {
  position: relative;
  width: 200px;
  height: 40px;
  margin: 0 5px;
  background:#252b33;
}

.main::before {
  position: absolute;
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: -5px;
  width: 5px;
  height: 40px;
  border-radius: 2px 0 0 2px;
  background: radial-gradient(10px at left,transparent 50%,#252b33 50%);
}
.main::after {
  position: absolute;
  content: "";
  display: block;
  position: absolute;
  top: 0;
  right: -5px;
  width: 5px;
  height: 40px;
  border-radius: 0 2px 2px 0;
  background: radial-gradient(10px at right,transparent 50%,#252b33 50%);
}
```

### File Upload Button
<div class="upload-btn-wrapper">
  <button class="btn">Upload a file</button>
  <input type="file" name="myfile" />
</div>

``` html
<div class="upload-btn-wrapper">
  <button class="btn">Upload a file</button>
  <input type="file" name="myfile" />
</div>
```
``` css
.upload-btn-wrapper {
  position: relative;
  overflow: hidden;
  display: inline-block;
}

.btn {
  border: 2px solid gray;
  color: gray;
  background-color: white;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 20px;
  font-weight: bold;
}

.upload-btn-wrapper input[type=file] {
  font-size: 100px;
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  cursor:pointer;
}
```

