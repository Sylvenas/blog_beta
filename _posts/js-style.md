---
title: 前端代码规范
categories: JavaScript
date: 2018-02-24
---

### 前端代码规范

#### 代码格式化
* Prettier
[Prettier](https://github.com/prettier/prettier) 支持多种语言，它的一大特点就是能够支持命令行、API 等多种形式调用，可以让团队保持代码风格一致。包括 React 在内的很多项目已经开始使用了。

Prettier支持列表如下：
* JavaScript,TypeScript,EcmaScript
* JSX
* CSS,SASS,LESS
* JSON
* GraphQL
查看完整的[格式化文档示例](https://www.slideshare.net/ReactLondon2017/javascript-code-formatting-with-prettier-by-christopher-chedeau)

Prettier使用方法：
* 1.编辑器中安装插件
  现在主流的编辑器都有相应的插件了
* 2.在git提交代码的时候自动格式化
  利用git的hooks机制，在commit时自动调用Pretter。这样子可以避免无法安装编辑器插件、安装了但是未提交代码前利用其格式化代码等各种情况的发生。
  具体操作时，还需要 [Huksy](https://www.npmjs.com/package/husky)、[lint-staged](https://www.npmjs.com/package/lint-staged)这两个工具。

EditorConfig：
[EditorConfig](https://github.com/editorconfig/)不是什么软件，而是一个名称为.editorconfig的自定义文件。该文件用来定义项目的编码规范，编辑器的行为会与.editorconfig 文件中定义的一致，并且其优先级比编辑器自身的设置要高
* 在项目根创建一个名为`.editorconfig` 的文件。该文件的内容定义该项目的编码规范。EditorConfig 支持的编码规范在后文会有详细的介绍。
* 安装与编辑器对应的 EditorConfig 插件。

其工作原理是：当你在编码时，EditorConfig 插件会去查找当前编辑文件的所在文件夹或其上级文件夹中是否有 .editorconfig 文件。如果有，则编辑器的行为会与 .editorconfig 文件中定义的一致，并且其优先级高于编辑器自身的设置。

#### ESLint
JavaScript 是一个动态的弱类型语言，在开发中比较容易出错。因为没有编译程序，为了寻找 JavaScript 代码错误通常需要在执行过程中不断调试。像 ESLint 这样的可以让程序员在编码的过程中发现问题而不是在执行的过程中。

[ESLint](http://eslint.cn/) 的初衷是为了让程序员可以创建自己的检测规则。ESLint 的所有规则都被设计成可插入的。ESLint 的默认规则与其他的插件并没有什么区别，规则本身和测试可以依赖于同样的模式。为了便于人们使用，ESLint 内置了一些规则，当然，你可以在使用过程中自定义规则。

运行 `eslint --init` 之后,`.eslintrc` 文件会在你的文件夹中自动创建。你可以在`.eslintrc` 文件中看到许多像这样的规则：
``` js
modules.exports = {
  "env": {
    "browser": true,
    "es6": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "semi":[
      "error",
      "always"
    ],
    "quotes":[
      "error",
      "single"
    ]
  }
}
```
`"env"`表示你的脚本将会运行在什么环境中或者采用何种模块化方案和使用的ES版本。

`"extends": "eslint:recommended"`,表示启用默认的ESLint中设置的[规则](http://eslint.cn/docs/rules),其中打✅的部分(默认的规则也可以自定义并关闭)。

`"semi"`和`"quotes"`是ESLint中的具体的[规则](http://eslint.cn/docs/rules),第一个值是错误级别，可以是`off/0`,`warn/1`,`error/2`分别表示关闭该规则，警告(不会影响代码运行),错误并停止代码运行。

**ESLint也可以在webpack中使用**    
* 安装ESLint的依赖
```
npm install  --save-dev eslint eslint-loader
```
* 在webpack.config.js添加loader(一定要在babel-loader之后使用eslint-loader,防止eslint检查之后的代码被babel转码之后，不合法),
``` js
module.exports = {
  // ...
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },
  // ...
}
```
* 在根目录下新建`.eslintrc`文件，并添加各种规则，即可

ESLint可以在很多种打包工具中使用，具体的文档请查看[官方文档](http://eslint.cn/docs/user-guide/integrations)

#### 前端代码
* [Airbnb JavaScript Style Guide(cn)](https://github.com/sivan/javascript-style-guide/blob/master/es5/README.md)
* [Airbnb(en)](https://github.com/airbnb/javascript)
* [google(eslint版本)](https://github.com/google/eslint-config-google)
* [腾讯](http://alloyteam.github.io/CodeGuide/)
