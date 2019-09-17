# WeakMap

突发奇想，写一个ES6提供的原生数据结构——[WeakMap][1]。为什么要讲它呢？因为它看起来特别的废柴（汗）。

## WeakMap

相比于java和C++，Javascript util方法（或是说原生数据结构）简直是少而不精，WeakMap更是其中的“佼佼者”。我们来看一下它仅有的一些属性和方法：

* 属性

    Only One。就一个`WeakMap.prototype.constructor`用于创建实例，用法如下：
    ```javascript
    let wm = new WeakMap([[k1, v1], [k2, v2]]) // vm = {k1:v1, k2:v2}
    ```
    WeakMap初始化参数是一个Iterable的对象， 可以是二元数组或者其他可迭代的键值对的对象。每个键值对会被加到新的 WeakMap里。

    注意：WeakMap对Key有限制，它必须是Object（Symbol也不行）


* 方法

    WeakMap的方法也特别少，只有四个：`delete`、`get`、`has`、`set`。以前还有个`clear`，后来被弃用了。且不说java的Map一来就几十个方法；就ES6同时期提供的Map也有十个方法。

    可能乍一看，少几个API并不会有什么特别大的影响，毕竟有了最基本的增删改查功能。但是，当你想用下面这些操作时，你真的会很绝望。
    ```javascript
    wm.size // no such property

    wm.keys(); // no such function

    wm.forEach(...) // unable to be iterated
    ```

## Map v.s. WeakMap

OK，那WeakMap这么废柴，它存在的意义是什么呢？

看一个场景：

```javascript
var map = new Map();
var weakmap = new WeakMap();

(function IIFE(){
    var k1 = {x: 1};
    var k2 = {y: 2};

    map.set(k1, 'k1');
    weakmap.set(k2, 'k2');
})()

map.forEach((val, key) => console.log(key, val))
// Weakmap. forEach(...) ERROR!
```

我们思考一个很深（wu）层（liao）的问题，在运行完IIFE函数后，我们是否还需要在map里保存k1的对象呢？

答案应该是“不保存”：k1和k2的作用域在IIFE内，之后我们将无法获取这两个引用，再驻留map里只会产生副作用。但是IIFE之后，当遍历map时——`map.forEach(...)`，我们依旧能找到`{x: 1}`，而且除了调用clear方法，我们甚至无法删除这个对象；垃圾回收机制更无法对`{x: 1}`起作用，久而久之便是内存溢出。

具体原因还是得从Map api中深究。Map api共用了两个数组（一个存放key,一个存放value）。给Map set值时会同时将key和value添加到这两个数组的末尾。从而使得key和value的索引在两个数组中相对应。当从Map取值时，需要遍历所有的key，然后使用索引从存储值的数组中检索出相应的value。这个实现的缺点很大，首先是赋值和搜索的时间复杂度为`O(n)`；其次是可能导致内存溢出，因为数组会一直保存每个键值引用，即便是引用早已离开作用域，垃圾回收器也无法回收这些内存。那WeakMap呢？（虽然就它那几个api，引用不存在后，WeakMap确实也没啥可以操作了）。

看一下WeakMap的polyfill，管中窥豹。

```javascript
var WeakMap = function() {
    this.name = '__wm__' + uuid()
};

WeakMap.prototype = {
    set: function(key, value) {
        Object.defineProperty(key, this.name, {
            value: [key, value],
        });
        return this;
    },
    get: function(key) {
        var entry = key[this.name];
        return entry && (entry[0] === key ? entry[1] : undefined);
    },
    ...
};
```

很有意思，它并没有使用任何数组。`weakmap.set(key, val)`事实上是直接通过[Object.defineProperty][3]给这个`key`加了一个新属性——`this.name`，这就解释了为什么WeakMap的key必需是个Object了；同理，`weakmap.get(key)`是从`key`的该属性里获取了值对象。很有趣的设计。相比Map，WeakMap持有的只是每个键值对的“弱引用”，不会额外开内存保存键值引用。这意味着在没有其他引用存在时，垃圾回收器能正确处理`key`指向的内存块。正因为这个特殊的实现，WeakMap的key是不可枚举的，更不用说提供`keys()`、`forEach()`这类方法了。

## Usecase

说实在WeakMap使用场景也不多（汗），硬要找的话还是有以下几种：

### Cache

作缓存的话，一般是做全局Map，可以读取调用链上游的一些信息，好处就是调用链结束后随时可以回收内存。

```javascript
let wm = new WeakMap();

// API layer
router.post('/applicant', (req, res) => {
    let applicant = req.body;
    let tenant = req.header('tenant');
    vm.set(applicant, tenant);
    dao.save(applicant)
})

// DAO layer
class DAO {
    save( applicant ){
        let tenant = wm.get(applicant);
        DB.save( Object.assign(applicant, {primary-key: tenant}) );// tenant as Primary Key in DB
    }
}

```

### DOM listener

管理DOM listener时也可以用WeakMap

```javascript
const dom = {};
addListener(dom, () => console.log('hello'));
addListener(dom, () => console.log('world'));

triggerListeners(dom);
```

添加和触发监听器是很典型的订阅发布模式。实现时我们可以利用WeakMap保存listener，在DOM销毁后即可释放内存：

```javascript
const listeners = new WeakMap();

function addListener(obj, listener) {
    if (!listeners.has(obj)) {
        listeners.set(obj, new Set());
    }
    listeners.get(obj).add(listener);
}

function triggerListeners(obj) {
    const listeners = listeners.get(obj);
    if (listeners) {
        for (const listener of listeners) {
            listener();
        }
    }
}
```

### Private Data

Javascript class暂时还没设计私有方法和私有变量，WeakMap是可以作为实现OO封装的方式之一。

```javascript
const _counter = new WeakMap();
const _action = new WeakMap();

class Countdown {
    constructor(counter, action) {
        _counter.set(this, counter);
        _action.set(this, action);
    }
    dec() {
        let counter = _counter.get(this);
        if (counter < 1) return;
        counter--;
        _counter.set(this, counter);
        if (counter === 0) {
            _action.get(this)();
        }
    }
}
```

## 小结

今天科普了一个ES6的新feature——WeakMap。表面看起来挺废柴的feature，现实开发中也很少能用到（汗）；不过在内存敏感的场景下还是有一定用武之地的。虽然JS这类高级语言隐藏了很多内存管理的功能，但无论如何还是不能解决一些极端情况。这时候仍需开发人员自己注意一些内存细节。ECMAScript提出WeakMap（还有一个WeakSet）的概念，终于给了开发人员一种主动解决内存回收的方式。

## 相关播客
[《Javascript垃圾回收机制》][4]


[1]: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
[2]: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map
[3]: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
[4]: https://www.jianshu.com/p/c19038bab924