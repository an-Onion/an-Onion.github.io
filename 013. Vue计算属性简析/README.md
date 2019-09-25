# Vue 计算属性简析

## Vue Computed

Vue 开发人员必然使用过计算属性（Computed Properties）：你可以像绑定 data 属性一样在模板中绑定计算属性；计算属性一般依赖一个或多个 data 属性，并返回它们复杂逻辑下的状态；当这些依赖属性变更时，模版中绑定的计算属性也会随之更新。那问题来了，vue 是怎么实现这个机制的呢？
我看了一篇外文是讲解 computed 实现的，还挺有趣。源码太过复杂这里就不展开了，我想用一个简单的实例介绍一下它的工作原理。

```javascript
let gift = new Vue({
    data: {
        price: 0,
    },
    computed: {
        status () { 
            return price > 1024 ? 'Smile' : 'Cry';
        }
    }
})

```

## [Object.defineProperty][1]

首先回忆一下某 JS 原生 api——`Object.defineProperty(obj, prop, descriptor)`。

> 这个方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性， 并返回这个对象。

* obj：要在其上定义属性的对象
* prop：要定义或修改的属性的名称
* descriptor：将被定义或修改的属性描述符

示例如下：

```javascript
let obj = {};

Object.defineProperty(obj, 'val', {
    get () {
        return 1024;
    }
});

console.log(obj.val); // 1024
```

该方法允许精确添加或修改对象的属性。`get`是其中的一个描述符，它会给该属性提供 getter 的方法。当访问该属性时，该方法会被执行。在如上代码里，尽管`val`看着像`obj`的一个属性，但在调用时内部事实上运行的是一个 get 方法。

## data 属性

VUE 里有就一套构造函数，它可以将一个普通的对象构造为一个可观察的对象。VUE 利用的就是`Object.defineProperty`。以 data 属性为例，这些属性被调用或修改时，会触发的是一系列的 get 和 set 方法。这些对象被称为**Reactive Property**。下面写了一个简单的函数`defineReactive(obj, key, val)`来模拟构造 data **Reactive Property**的过程。

```javascript
function defineReactive(obj, key, val) {
    Object.defineProperty(obj, key, {
        get () {
            return val;
        },
        set (newVal) {
            val = newVal;
        }
    })
}
let gift = {};
defineReactive(gift, 'price', 250);

console.log(gift.price); // 250
gift.price = 1025;
console.log(gift.price); // 1025
```

## Computed 方法

接着我们再写一个`defineComputed(obj, key, computeFunc, updateCallback)`来模拟 computed 方法里的构造实现。

```javascript
function defineComputed (obj, key, computeFunc, updateCallback) {
    Object.defineProperty (obj, key, {
      get () {
        // call the compute function and return the value
        return computeFunc.call(obj);
      }
    })
}

defineComputed(
    gift, 
    'status', 
    function () {
        return this.price > 1024 ? 'Smile' : 'Cry';
    }
)

gift.price = 88;
console.log(gift.status) // Cry

gift.price = 1025;
console.log(gift.status) // Smile
```

嗯，很直白！当 price 变化后，status 的结果也随之变更。到此为止我们已经可以大体理解 data 数据和 computed 方法之间是如何关联的了。

## Update 发布

那如何实现改变 data 属性，自动更新模版中绑定的计算属性呢？
前面`defineComputed (obj, key, computeFunc, updateCallback)`留了一个参数`updateCallback`还未使用，我想用它来模拟一下自动更新模版这个操作。

这里先定义一个全局的中介者用于暂存 update 方法：

```javascript
let Mediator = { 
    target: null
};
```

我们补完一下`defineComputed`方法:

```javascript
function defineComputed (obj, key, computeFunc, updateCallback) {

    function update () {
        let val = computeFunc.call(obj);
        updateCallback.call(obj, val);
    }
    
    Mediator.target = update;
    // Register update functions into data Property's listeners
    computeFunc.call(obj);  
    Mediator.target = null; // Reset the target so that no more property adds this as listenser

    Object.defineProperty (obj, key, {
      get: function () {
        return computeFunc.call(obj);
      }
    })
}
```

上述代码的第十行`computeFunc.call(obj)`在这里的作用其实是注册监听，具体可见如下代码第六和第七行。理解起来也不难，`computeFunc.call(obj)`最终会调用如下 data 里关联的的`get`方法。这时中介者就起作用了，我们将 Mediator.target 引用的 update 方法存入 listeners。这样每次对 data 的相关 property 赋值时，都会触发这一系列关联的 update 方法了。

```javascript
function defineReactive(obj, key, val) {
    let listeners  = [];

    Object.defineProperty(obj, key, {
        get () {
            if( Mediator.target ) 
                listeners.push(Mediator.target);

            return val;
        },
        set (newVal) {
            val = newVal;
            listeners.forEach( (update) => update() );
        }
    })
}
```

回顾一下设计模式，这是很经典的订阅-发布模式。

## 复盘

最后我们再看一下方法调用。如下所示，通过修改 gift 的 price 就可以自动打印出 status 结果了。

```javascript
let gift = {};

defineReactive(gift, 'price', 0);

defineComputed(
    gift, 
    'status', 
    function computeFunc () {
       return this.price > 1024 ? 'Smile' : 'Cry';
    },
    function updateCB (val) {
        console.log(val);
    }
)

gift.price = 1314; // Smile
gift.price = 250; // Cry
```

我们再来复盘一下整个过程

1. 构造 data 属性为 Reactive Property （defineReactive）

2. 构造 computed 方法，并在相关联的 data Property 里注册 update 方法 （defineComputed）

3. 为 data 的 Property 赋值，并自动更新相关联的 update 方法

我把完整的代码贴到了最后，有兴趣的同学可以自己运行一下。

## 小结

VUE.js 已然成为业内最主流的框架之一，不得不说它的用户体验很友好、学习曲线也不高，几个月下来也可以把玩框架了。不过，使用框架最后很容易变成做填空题，技术增长也会遇到瓶颈；当遭遇框架之外的难题时便一筹莫展了。我自己也深陷瓶颈之中，希望能夯实一下基础知识，尽力突破这一层难关吧。共勉！


[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty