# Vue2 双向绑定

## 前言

Vue 三要素：响应式、模版引擎和渲染。其中，响应式就是通过著名的双向绑定（Two-way data binding）实现的。今天我们就聊聊这个老掉牙的话题——Vue2 是如何实现双向绑定的。

## 数据劫持

我以前写过一篇[《Vue 计算属性简析》][1]，那里也提到过数据劫持。什么是数据劫持呢？说白了就是利用[Object.defineProperty()][2]来劫持对象属性的 setter 和 getter 操作，以期达到代理更复杂操作的目的。给个简单的例子——山寨 Vue，快速回顾一下数据劫持：

```javascript
class Vue {
    constructor({data}) {
        this.data = data();
        Object.keys(this.data).forEach( this.proxy.bind(this) );
    }

    proxy (key) {
        Object.defineProperty(this, key, {
            get () {
                return Reflect.get(this.data, key);
            },
            set (newVal) {
                Reflect.set(this.data, key, newVal)
            }
        })
    }
}

let vm = new Vue({
  data: () => ( {
    price: 5,
    quantity: 2,
  }),
});

console.log(Object.keys(vm)); // [ 'data' ]
console.log(vm.price, vm.quantity); // 5 2
```

如上所示，我们对 Vue 对象进行数据劫持，它本身并不拥有 price 或 quantity 域；但当调用`vm.price`和 `vm.quantity`的 setter 或 getter 方法时，会自动代理到`vm.data`里的 price 和 quantity 操作。现实开发中，我们也能在 vue 模版或方法里看到类似的调用。
```html
<div>{{this.price}}</div>
```
或是
```javascript
{
    data: () => ( {
        price: 5,
        quantity: 2,
    }),
    computed: {
        total () {
            return this.price * this.quantity;
        }
    }
}
```
道理是一样的，都是通过数据劫持来代理`data`域操作。

## 双向绑定

有了数据劫持的知识，我们进一步探索双向绑定的实现。

### 极简实现

上文我们通过 Vue 自身的数据劫持代理了私有域`data`。下面我写了一个极简版本的双向绑定示例。由于单一职责的设计原则，我又进一步劫持了`vm.data`。原因很简单：除了`data`， Vue 还会代理`methods`、`computed`等方法，这些方法实现差异巨大，不适合全部耦合在`Vue.proxy`里。这里的实现就是将`price`和 DOM 的`input`做双向绑定。


```javascript
let vm = new Vue({
  data: () => ( {
    price: 5,
  }),
});

Object.defineProperty(vm.data, 'price', {
  get: function() {
    return vm.data['price']
  },
  set: function(newVal) {
    vm.data['price'] = newVal;
    document.getElementById('input').value = newVal;
  }
});

document.getElementById('input')
        .addEventListener('keyup', function cb(e) {
            obj.text = e.target.value;
        })
```

很显然，代码耦合严重，违反了开发闭合原则——DOM 操作不应该放在`set`方法里面。更大的问题是：只能监听一个属性，比如某个 DOM 绑定了`this.price`和`this.quantity`这两个或呢？

```html
<span>total = {{price*quantity}}</span>
```

### 订阅发布

如何解决上述问题，我们最后还是需要使用设计模式——Vue 的实现使用了[订阅发布模式][2]。看这张图：

![two-way bind][4]

有些复杂，我们先拆解来看：

* Dep（订阅发布中心）：负责存储订阅者，并处理消息分发。

* Observer（观察者）：用于监听 data 属性变化，实现注册和消息通知

* Watcher（订阅者）：在 Dep 里注册自己的信息，当 Dep 分发消息后触发自身方法

* Viewer（显示）：DOM 更新（方便起见，后文将用`console.log`代替）

#### 山寨 Vue

先看一下我们山寨 Vue 的 demo:

```javascript
/* Step 1 */
let watcher = function () {
  const total = this.price * this.quantity;
  console.log(`total = ${total}`); // Viewer!!
};

/* Step 2 */
let vm = new Vue({
  data: () => ( {
    price: 5,
    quantity: 2,
  }),
});

/* Step 3 */
vm.$mount( watcher ); // total = 10

/* Step 4 */
vm.price = 100; // total = 200
vm.quantity = 100; // total = 10000
```

1. 定义了一个`watcher`函数，用于模拟 template 里的数据绑定: `<span>total = {{price*quantity}}</span>`。

2. 初始化 Vue 对象`vm`

3. 将`watcher`函数挂载到`vm`里，`total`初始化成功

4. 分别修改`vm.price`和`vm.quantity`，`total`随之更新

山寨 Vue 的使用方法已经列在上面了，看一下类实现（`proxy`见第一部分）：

```javascript
class Vue {
    constructor({data}) {
        this.data = data();
        Object.keys(this.data).forEach( this.proxy.bind(this) );
        new Observer(this.data);
    }

    $mount(watcher) {
        Dep.target = watcher.bind(this);
        watcher.call(this);  // init and register
        Dep.target = null;
    }

    proxy (key) { ... }
}
```

#### Observer

从上到下，我们就先说 Observer 吧。

```javascript
class Observer {
    constructor (data) {
        Object.keys(data).forEach( Observer.defineReactive.bind(null, data) )
    }

    static defineReactive(obj, key) {
        let val = Reflect.get(obj, key);
        const dep = new Dep();

        Object.defineProperty(obj, key, {
            get () {
                dep.depend();
                return val;
            },
            set (newVal) {
                val = newVal;
                dep.notify();
            }
        })

    }
}
```

Vue 初始化后，将`this.data`交由`Observer.defineReactive`做数据劫持：

* getter：返回数值，但重点是往 Dep 里注册绑定的依赖——Watcher

* setter：在赋值后通知 Dep 分发消息至所有的订阅者——Watcher。

![Observer][5]

#### Dep

Dep 的实现有点小技巧，首先定义了一个静态变量`target`；当 vue 挂载 watcher 时，`target`指向该方法（后面会继续展开）。如上图所示，`depend`主要作用是将挂载了的 watcher 作为订阅者存储起来，并在`notfiy`调用时，触发这些订阅者。

```javascript
class Dep {
    constructor() {
        this.subscribers = [];
    }
    depend() {
        if( Dep.target && !this.subscribers.includes(Dep.target) ){
            this.subscribers.push(Dep.target);
        }
    }
    notify() {
        this.subscribers.forEach(sub => sub())
    }
}

Dep.target = null;
```

#### Watcher

再看一下订阅者 watcher：

```javascript
let watcher =  function () {
  const total = this.price * this.quantity;
  console.log(`total = ${total}`)
}

class Vue {
    ...
    $mount( watcher ) {
        Dep.target = watcher.bind(this);
        watcher.call(this);  // init and register
        Dep.target = null;
    }
}

vm.$mount(watcher);
```

这里重点还是在`$mount`函数。我们先将`Dep.target`指向`watcher`，然后运行`watcher.call(this)`初始化`total`。这时候 price 和 quantity 的 getter 被调用。我们知道这两个域的 getter 已经被 Observer 劫持了，并会触发`depend`方法。再来回看一下`depend`实现：

```javascript
depend() {
    if( Dep.target && !this.subscribers.includes(Dep.target) ){
        this.subscribers.push(Dep.target);
    }
}
```
这时候，watcher 就通过`Dep.target`添加到 subscribers 数组里了。至此，整个发布订阅模式被打通。

#### Publish

最后我们通过 vm 的 setter 方法，通知 Dep，并调用所有订阅者 watcher。

```javascript
vm.price = 100; // total = 200
vm.quantity = 100; // total = 10000

class Dep {
    ...
    notify() {
        this.subscribers.forEach(sub => sub())
    }
}
```

再来复盘一下数据流图：

![workflow][6]

1. Observer 劫持 Vue.data

2. Vue 挂载模版方法——watcher

3. 调用 watcher 并初始化 Viewer

4. 由于数据劫持，watcher 自动触发 Vue getter，并调取 Dep.depend

5. watcher 通过 Dep.target 成功订阅 Dep

6. 触发 Vue setter 操作，setter 将消息通知到 Dep

7. Dep 将消息发布至订阅者 watcher

8. Viewer 因 watcher 调用而更新

 ## 小结

 这期我们利用数据劫持和订阅发布模式实现了一个山寨版的 Vue，学习了 Vue2 双向绑定的设计思想。但是这个双向绑定还是存在一些漏洞的，尤雨溪也在今年宣布 Vue3 会重写双向绑定。至于新的实现又是什么，我们下次再聊。

[1]: https://www.jianshu.com/p/8fb677e6e3f5
[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
[3]: https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern
[4]: ./img/two-way-bind.png
[5]: ./img/Observer.png
[6]: ./img/workflow.png