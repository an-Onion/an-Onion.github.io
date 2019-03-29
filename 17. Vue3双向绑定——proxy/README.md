# Vue3 双向绑定——Proxy

上一期我用一个山寨的Vue class演示了vue响应式开发中双向绑定的实现。小结留了个尾巴——vue3将会用新的方式实现双向绑定。这一期就来介绍一下新的实现方式——[Proxy][1]。

## 前情回顾

回忆一下vue2中响应式的实现：

```javascript
Object.keys(data).forEach((prop) => {
    const dep = new Dep();

    Object.defineProperty(data, prop, {
        get () {
            dep.depend();
            return Reflect.get(data, prop);
        },
        set (newVal) {
            Reflect.set(data, prop, newVal);
            dep.notify();
        }
    });
});
```

vue2利用[Object.defineProperty][2]来劫持data数据的getter和setter操作。这使得data在被访问或赋值时，动态更新绑定的template模块。不过，`Object.defineProperty`有一些天然的缺陷，而这些缺陷是es2015中Proxy可以解决的。我们下来慢慢介绍Proxy的解决之道。

## 代替循环遍历

在使用`Object.defineProperty`时，我们必须循环遍历所有的域值才能劫持每一个属性，说实在这个就是hack技术。

```javascript
Object.keys(data).forEach((prop) => { ... }
```

而Proxy的劫持手段则是官宣标准——直接监听data的所有域值。

```javascript
//data is our source object being observed
const observer = new Proxy(data, {
    get(obj, prop) { ... },
    set(obj, prop, newVal) { ... },
    deleteProperty() {
        //invoked when property from source data object is deleted
    }
})
```

Proxy构造函数的第一个参数是原始数据data；第二个参数是一个叫[handler][3]的处理器对象。Handler是一系列的代理方法集合，它的作用是拦截所有发生在data数据上的操作。这里的get()和set()是最常用的两个方法，分别代理*访问*和*赋值*两个操作。在Observer里，它们的作用是分别调用`dep.depend()`和`dep.notify()`实现订阅和发布。直接反映在Vue里的好处就是：我们不再需要使用`Vue.$set()`这类响应式操作了。除此之外，handler共有十三种劫持方式，比如`deleteProperty`就是用于劫持域删除。

## Proxy具体实现

尽管Proxy API还没Merge到Vue项目里，但是我们可以大概猜测一下它的实现。改写一下[上一版本的Observer][4]

```javascript
class Observer {

    static defineReactive(data) {

        let deps = new Map();

        function depReflect(prop, func) {
            if( !deps.has(prop) )
                deps.set(prop, new Dep());
            const dep = deps.get(prop);

            return func.call(dep);
        }

        return new Proxy(data, {
            get(obj, prop) {
                depReflect(prop, Dep.prototype.depend);
                return Reflect.get(obj, prop);
            },
            set(obj, prop, newVal) {
                Reflect.set(obj, prop, newVal);
                depReflect(prop, Dep.prototype.notify);
            }
        })
    }
}

```

* *Dep类*还是和以前一模一样。我写了一个Dep Map来存储data各个域的依赖。

* `depReflect(prop, func)`用于实现订阅发布功能。

* *get(obj, prop)*用于代理原始对象`data[prop]`的getter()，并调用Dep的`depend()`实现订阅者watcher注册。

* *set(obj, prop, newVal)*用于代理`data[prop]`的setter()，在域赋值时触发（如：`observer[prop] = newVal`）；并把消息发布给订阅者watcher。

![Observer Proxy][0]

## 升级改造

上一版本山寨VUE是这么构造的：

```javascript
class Vue {
    constructor({data}) {
        this.$data = data();
        new Observer(this.$data);
        Object.keys(this.$data).forEach( this.proxy.bind(this) );
    }
    // omit others
}
```

用Proxy改写后，稍微精简了一点，`this.$data`由Observer作为工厂创建。

```javascript
class Vue {
    constructor({data}) {
        this.$data = Observer.defineReactive(data());
        Object.keys(this.$data).forEach( this.proxy.bind(this) );
    }
    // omit others
}
```

再跑一次上期的测试：

```javascript
let watcher = function () {
  const total = this.price * this.quantity;
  console.log(`total = ${total}`)
};

vm.$mount( watcher );  // total = 10

vm.price = 100;     // total = 200
vm.quantity = 100; // total = 10000
```

输出依旧是`10 200 10000`，成功实现Proxy改造。

## `Object.defineProperty`的缺陷

那么问题来了，为什么需要Proxy改造`Object.defineProperty`呢？

原因在于`Object.defineProperty`有先天缺陷——无法监听数组变化。而[Vue文档][5]提到它能检测如下八种数组操作操作；但很有趣的是：`vm.items[0] = 1`这种操作是无法检测的。原因还是在于作者使用了hack的方式实现了这八种操作，而`vm.items[0] = 1`实在是hack不了了。

```javascript
push()
pop()
shift()
unshift()
splice()
sort()
reverse()
```

至于为什么当时非得使用`Object.defineProperty`而不是`Proxy`，原因还是浏览器兼容所限。至今IE也不支持Proxy，polyfill也无法抹平。即便作者在重写vue3的时候，还是为原始浏览器保留了`Object.defineProperty`的实现。


## Proxy优势

Proxy在ES2015规范中正式发布，它是浏览器底层实现的一种对象*拦截器*，原生支持JS数组操作（push、shift、splice等等）。

```javascript
const list = [1, 2];

const observer = new Proxy(list, {
  set: function(obj, prop, value, receiver) {
    console.log(`prop: ${prop} is changed!`);
    return Reflect.set(...arguments);
  },
});

observer.push(3);
observer[3] = 4;
```

上面这个例子的打印结果是：

```
prop: 2 is changed!
prop: length is changed!
prop: 3 is changed!
```

很显然，得利于浏览器原生支持，Proxy不需要各种hack技术就可以无压力监听数组变化；甚至有比hack更强大的功能——自动检测length。除此之外，Proxy还有多达[13种拦截方式][6]，包括`construct`、`deleteProperty`、`apply`等等操作；而且性能也远优于`Object.defineProperty`，这应该就是所谓的新标准红利吧。

## 小结

由于一些历史原因，vue只能使用`Object.defineProperty`实现双向绑定。这在当时是一种很前卫的设计，不过随着浏览器的不断迭代，这种技术在api和性能上愈发跟不上时代的步调。重写vue可以说是顺应历史潮流吧。

这是我写VUE源码设计的第三期，以后还会不定期更新。框架千变万化，但机理还是逃不过语言特性、数据结构和设计模式。我学习源码并没有什么功利的目的，想的还是拓展认知和巩固基础。当遇到特殊问题或是超过框架认知的需求时，其实最可靠的还是我们的基本功。

## 相关播客

* [山寨Vue双向绑定][7]

* [Vue计算属性简析][8]

[0]: ./img/Observer.png
[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
[3]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler
[4]: https://github.com/an-Onion/my-weekly/blob/master/16.%20Vue%E5%8F%8C%E5%90%91%E7%BB%91%E5%AE%9A%E7%AE%80%E6%9E%90/src/vue.js#L20
[5]: https://vuejs.org/v2/guide/list.html#Mutation-Methods
[6]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#Methods_of_the_handler_object
[7]: https://www.jianshu.com/p/c8186e9e027b
[8]: https://www.jianshu.com/p/8fb677e6e3f5