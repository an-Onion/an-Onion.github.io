# 简报《What’s new in Javascript》

这周看了[google IO上的一个视频][0]，讲JS的新feature。还是挺有意思的，所以这次就做个“简报”，列一下值得一看的新feature。

## Private Field

自从JS引进class语法糖以来，私有域的实现一直是个有争议的话题。我记得以前的面试题还喜欢考《私有域有几种实现方式？》——Symbol、WeakMap、Proxy等几种“奇技淫巧”。今年TC39正式将`#`作为标志符更新到Stage 3，虽然没有官宣，但是V8已经开始实验性地支持这个新特性了。

```javascript
class Counter {
    #counter = 0;
    get value() {
        return #counter;
    }
}

const c = new Counter();

c.value // 0
c.#counter; // Syntax Error
```

如上，`#counter`就是Counter类的私有域，外部调用时会报出语法错误。用惯了typescript的`private`，我看到`#`时还是觉得怪怪的。想尝鲜的朋友，可以安装最新版的Chrome或Node试验。相传私有方法，私有get和set很快也会被加入进来。


## Big Int

Big Int顾名思义大整数，我们来做个计算题`1234567890123456789 * 123`，看看js的计算结果：151851850485185200000。有点长，不看别的就看末尾数`0`，显然计算结果是错的。原因还是在JS数字精度丢失这一经典问题上，JS的安全精度在(-2^53, 2^53)，超出了安全范围就不准了。

```javascript
console.log(1234567890123456789 * 123) // 151851850485185200000
```

再看看新语法，末尾加个n，答案是`151851850485185185047n`，Bingo。

```javascript
console.log(1234567890123456789n * 123n) // 151851850485185185047n
```

## Array Flat & FlatMap

我个人是从java8才开始知道有flat的概念（嗯，就是这么后知）；这个概念来自函数式编程，如果要讲历史典故得追溯到上个世纪中叶了。

* 新版JS中，`flat()`被设计为高维数组一维化（*降维打击？？*）。

    ```javascript
    var newArray = arr.flat(depth)
    ```

    + 参数depth: 指定要提取嵌套数组的结构深度，默认值为 1。
    + 返回值： 一个包含将数组与子数组中所有元素的新数组。

    ```javascript
    const higherDimensionalArray = [ "a", ["b", "c"], ["d", ["e", "f"]]];
    higherDimensionalArray.flat( 2 );  // [ "a", "b", "c", "d", "e", "f" ]
    ```

* `flatMap`和`map`很像，不同之处是`flatMap`会对回调结果一维化：

    ```javascript

    const scattered =  [ "my favorite", "fruit is", "red bayberry" ];

    scattered.map( chunk => chunk.split(" ") ); // [["my", "favorite"], ["fruit", "is"], ["red", "bayberry"]]

    scattered.flatMap( chunk => chunk.split(" ") ); // ["my", "favorite", "fruit", "is", "red", "bayberry"]
    ```

## Object.fromEntries

`Object.fromEntries`是[Object.entries][1]反向函数：

```javascript

let obj = {k1: 'v1', k2: 'v2', k3: 'v3'};

let entries = Object.entries(obj); // [['k1','v1'],['k2','v2'],['k3','v3']]

Object.fromEntries(entries); // {k1: 'v1', k2: 'v2', k3: 'v3'}
```

虽然互为反向，但是`fromEntries`比`entries`晚出了三四年，也挺奇怪的一件事。

## Optional Catch Binding

允许开发者省略catch里的参数`e`，但好像也没什么重大意义（汗）

```javascript
try {
    throw new Error('some error');
} catch {
    console.log('no params for catch');
}
```

早期版本：

```javascript
try {
    throw new Error('some error');
} catch(e) {
    console.log(e); //  Error: "some error"
}
```

## WeakRef

在WeakRef前，ES6中就有两个Weak类了——WeakMap和WeakSet。我曾经写过一篇[《ES6之WeakMap》][3]，有兴趣的朋友可以看一下。我们回顾一下[JS垃圾回收机制][4]，它主要通过“引用标记”和“引用清除”两个方法实现内存回收。每当对象多一次引用则“引用数”加1，少一次则减一；当“引用数”为0时，启动垃圾回收。以WeakMap为例，它存储的对象都是弱引用，不会增加“引用数”，因此不会导致内存溢出。看两个例子:

```javascript
//map.js
function memoryUsage() {
    const used = process.memoryUsage().heapUsed;
    console.log( Math.round(used / 1024 / 1024) + 'M' );
}

memoryUsage(); // ≈ 4M

let arr = new Array(1024 * 1024);
const map = new Map();

map.set(arr, 1);
global.gc();
memoryUsage(); // ≈ 12M

arr = null;
global.gc();
memoryUsage(); // ≈ 12M
```

```javascript
//weakmap.js
memoryUsage(); // ≈ 4M

let arr = new Array(1024 * 1024);
const map = new WeakMap();

map.set(arr, 1);
global.gc();
memoryUsage(); // ≈ 12M

arr = null;
global.gc();
memoryUsage(); // ≈ 4M
```

分别执行`node --expose-gc map.js`和`node --expose-gc weakmap.js`。可以很明显地看到区别：在`arr`被置为null后，Map并没有释放Array，而WeakMap释放了。原因正如上文所示：Map是强引用，arr清除后依旧保留了对`new Array(1024 * 1024)`的引用指向，而WeakMap并没有保留。

再回到WeakRef。WeakRef也是不增加“引用数”的。我们来看看[tc93][5]上的介绍:
* WeakRef通过传入Object直接构造`new WeakRef({})`
* 它有一个唯一的方法`deref`返回构造时传入的对象；若对象已被回收，则返回undefined

举个简单的例子，假如我们想对一个图片（一般来说是ArrayBuffer）做缓存，你很可能希望通过文件名去读取该缓存。直接使用Map很可能导致内存溢出，但是WeakMap也不合适——它的key只能是object。在这个场景里WeakRef是很好的折衷手段，只需要“虚化”map的value值：我们既不需要在内存中强引用巨大的ArrayBuffer，也可以使用string作为键值；当ArrayBuffer被垃圾回收后，Map里只有一个很小的空WeakRef指向。如下：我们将`getImage`中获得的ArrayBuffer虚引用后存入cache；正常情况下可以快速获得image引用，当外部作用域清除image的ArrayBuffer后，cache中就只能获取一个`undefined`的WeakRef了，我们不用过多担心内存泄漏了。

```javascript
function makeWeakCached(f) {
  const cache = new Map();
  return (key) => {
    const ref = cache.get(key);
    if (ref) {
      const cached = ref.deref();
      if (cached !== undefined) return cached;
    }

    const fresh = f(key);
    cache.set(key, new WeakRef(fresh));
    return fresh;
  };
}

var getImageCached = makeWeakCached(getImage);
```

## Promise

现代开发中，早已大量使用async/await语法糖了，很多新人可能并不是很了解Promise了。我们这种ES5过来的人，对Promise还是挺有印象的（被polyfill恶心过有数了）。尤其是`Promise.all()`和`Promise.race()`这种方法我现在还是经常使用的。这次又新增了`Promise.allSettled()`和`Promsie.any()`。这两个方法我很早就在《You don't know JS》里看到过，概念可能已经源远流长了。具体功能如可以从函数名猜出大概：allSettled与all相对，表明全部Promise执行完后再返回，不似all只要有一个错误直接reject；any和race相对，表明只要有一个Promise fulfilled就返回then，只有全部reject才抛异常。

## 其他

再快速过一下其他几个小更新

* Array.Sort

    以前V8实现数组排序是：10个元素以上是稳定排序，10以下是不稳定排序，现在改成全是稳定排序了

* String.trimStart() & String.trimEnd()

    顾名思义，丰富了一下`trim()`函数的使用场景

* Function.toString()

    Function也有toString方法了，可以打印函数源码，不受高编影响

* Symbol.description

    竟然没发现以前是无法打印Symbol value值的（汗）
    ```javascript
    var s = Symbol('Onion')
    console.log(s.description) // Onion
    ```

* Numeric Seperator

    数字分隔符支持，挺常见的需求
    ```javascript
    let a = 1_000_000
    let b = 1_019.42
    ```

其实我最想看到的是[Optional Chaining][2]，可惜还在Stage 1。

```javascript
var street = user && user.address && user.address.street;

var oc_streat = user?.address?.stree;
```

## 小结

最后再推一波[《What’s New in JavaScript》][0]油管视频。它还提到了其他很多有趣的新特性，有兴趣的朋友点进去看一下，英语也没啥难度。

金三银四过后，就是老同事们各奔东西了；当年一起写JS大前端的同僚，今天只剩我一人了。我倒不需要像管理层那样精算人力，只是回想起自己这几年工作经历——沧海桑田。眼看他起朱楼，眼看他宴宾客，眼看他。。。不可妄议了。人来人往，世间无不散之宴席，祝大家一切安好了。


## 相关博客

* [《ES6之WeakMap》][3]
* [Javascript垃圾回收机制][4]

[0]: https://www.youtube.com/watch?v=c0oy0vQKEZE
[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
[2]: https://github.com/tc39/proposal-optional-chaining
[3]: https://www.jianshu.com/p/8c4ffa77b346
[4]: https://www.jianshu.com/p/c19038bab924
[5]: https://github.com/tc39/proposal-weakrefs