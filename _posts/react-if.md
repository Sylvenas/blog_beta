---
title: react 条件渲染
categories: React
date: 2018-05-26
---

在react中通常我们需要根据各种不同的条件来渲染数据，例如最为常见的根据loading状态渲染loading动画组件还是渲染数据；

在项目中遇到的太多次上面的场景，故总结如下：

### 三元运算符
在JSX中，你可以使用`三元运算符`去处理条件渲染:
``` js
class Todo extends Component {
    constructor() {
        super();
        this.state = {
            todoList: [],
            loading: true
        }
    }
    render() {
        const { loading, todoList } = this.state;
        return (
            <div>
                {loading ? 'loading' : <TodoList list={todoList} />}
            </div>
        )
    }
}
```
可能存在的问题：如果有多个嵌套的`if`条件怎么处理？

### 辅助方法
这是一个有用的方法，但是当组件更大时，你需要在辅助方法和`render()`方法之间上下跳跃,并且能把判断逻辑封装到相应的辅助方法中
``` js
class Todo extends Component {
    constructor() {
        super();
        this.state = {
            todoList: [],
            loading: true
        }
    }
    renderTodos() {
        if (this.state.loading) {
            return 'loading'
        }
        return <TodoList list={todoList} />
    }
    render() {
        return (
            <div>
                {this.renderTodos()}
            </div>
        )
    }
}
```

### getter方法
如果你不喜欢在render方法中调用函数，可以使用对象的getter方法,可以使代码更优雅，getter方法更强大的地方在于可以把所有的判断条件抽取出来,组合成最终的结果
``` js
class Todo extends Component {
    constructor() {
        super();
        this.state = {
            todoList: [],
            loading: true
        }
    }
    get renderTodos() {
        if (this.state.loading) {
            return 'loading'
        }
        return <TodoList list={todoList} />
    }
    get canShowSomeComponent(){
        return (
            this.state.loading
            && this.ptops.test
            // .... 其他条件
        )
    }
    render() {
        return (
            <div>
                {this.renderTodos}
                {this.canShowSomeComponent && <SomeComponent />}
            </div>
        )
    }
}
```

### <Hideif/>
我们可以自己简单封装一个隐藏的<Hideif/>组件来实现我们的目标:
``` js
class Todo extends Component {
    constructor() {
        super();
        this.state = {
            todoList: [],
            loading: true
        }
    }
    render() {
        const { loading, todoList } = this.state;
        return (
            <div>
                <HideIf condition={loading}>
                    <TodoList list={todoList}/>
                </HideIf>
            </div>
        )
    }
}

const HideIf = (props) => {
    if (props.condition) {
        return 'loading';
    }
    return this.props.children; // children is what's inside <HideIf> element
}
```

### 其他方案
现在前端环境最大的好处之一就是你想要什么功能，否可以去github上去找找，关于react中处理条件渲染的库，比较优秀的有:
* [render-if](https://github.com/ajwhite/render-if)
* [react-only-if](https://github.com/MicheleBertoli/react-only-if)
* [jsx-control-statements](https://github.com/AlexGilleran/jsx-control-statements)