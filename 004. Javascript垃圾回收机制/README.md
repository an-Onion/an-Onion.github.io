# Javascript 垃圾回收机制

## 简介

JS 自带一套内存管理引擎，负责创建对象、销毁对象，以及垃圾回收。这期探讨一下垃圾回收机制。垃圾回收机制主要是由一个叫垃圾收集器（garbage collector，简称 GC）的后台进程负责监控、清理对象，并及时回收空闲内存。

## 可达性（Reachability）

GC 的最主要职责是监控数据的**可达性（reachability）**；哪些数据是所谓的**可达的**呢？

1. 所有显示调用，被称为`根`，包括
   * 全局对象
   * 正被调用的函数的局部变量和参数
   * 相关嵌套函数里的变量和参数
   * 其他（引擎内部调用的一些变量）
  
2. 所有从根引用或引用链访问的对象
   
举个简单的例子
```javascript
let user = {
    name: 'Onion'
}
```
这里全局变量 user 指向内存里的对象`{name: 'Onion'}`，我们称其为引用。这时对象 Onion（以下均以名字简称）是所谓**可达的**。

![user reference][1]

将 user 置为 null 后，引用丢失，Onion 对象就变成不可达了。最终 GC 会将它从内存中清除。

```javascript
user = null
```

![unreachable][2]

再举一个复杂一点的例子：

```javascript
function marry(man, woman) {
  woman.husband = man;
  man.wife = woman;

  return {
    father: man,
    mother: woman,
  }
}

let family = marry({
  name: "Onion"
}, {
  name: "Garlic"
});

```

如图，现阶段所有对象都是可达的。

![family reachable][3]

现在我们删除一些对 Onion 的引用

```javascript
delete family.father
delete family.mother.husband
```

如图，尽管 Onion 还有对 Garlic 的引用，但是它本身已不可达，所以很快就会被 GC 发现并回收。

![onion clean][4]

## 回收算法

最基本的垃圾回收算法被称为**标记清除法（mark-and-sweep）**。有这么几步：

1. GC 标记所有`根`的变量
   
    ![mark root][5]

2. 访问所有变量的引用，并标记它们
   
    ![mark reference][6]

3. 标记所有引用链上的对象，已标记的对象不再被访问
 
   ![mark reference chain][7]

4. 最后删除所有未被标记的对象（**注**：并非未被引用的对象，如图右）

   ![sweep unreachable][8]

现代的 GC 引擎自然比这个复杂得多，很多优化手段早已被用到各大厂家中，比如 V8 的分代回收（Generational collection）、增量回收（Incremental collection）、空闲时回收（Idle-time collection）等等。不过，这些手段已超出了本文的范畴，不再深入探讨。

## 内存泄漏

> 内存泄漏指申请的内存一直得不到释放，GC 回收不了。一般在项目中就是，你创建的对象一直保存在内存中，**可达**但你把它的引用地址搞丢了结果没法操作它，而 GC 又不会回收这块内存。内存泄漏的危害就是堆积耗尽系统所有内存。

常见的有这么几种泄漏方式：

1. 意外的全局变量
    
    ```javascript
    function foo() {
        bar = "等价于创建global变量window.bar";
    }
    ```

2. 忘记清空计时器
    
    ```javascript
    let someResource = {...};
    setInterval(function cb() {
        let node = document.getElementById('Node');
        if(node) {
            // 若不清空计时器，node和someResource将长期驻留内存
            node.innerHTML = JSON.stringify(someResource);
        }
    }, 1000);
    ```
3. 闭包里的循环引用
    
    ```javascript

    function assignHandler(){
        let element = $('id');
        let id = elment.id; // 引用element变量id
    
        element.onclick = function(){
            alert(id); // 引用assignHandler变量id
        };
    }
    ```
4. 其他

    在 ie 等老旧浏览器里还有许多匪夷所思的内存泄漏，比如自动类型装箱转换，一些不经意的 DOM 操作，甚至闭包本身就会泄漏；这类泄漏需要专人特别关注，这里不再一一赘述了。

## 小结

今天简单接受了一下 Javascript 的 GC 机制，由于功力有限我只能浅尝则止。不过还是有几点概念性的总结：
1. GC 机制是自动完成的，但我们可以强制启动它，或是关闭它。
2. 只要是**可达的**，对象就会常驻内存，所以需要特别注意内存泄漏问题
3. 引用与**可达的**是不一样的，有些引用链可能根本无法在内存中驻留


[1]: https://upload-images.jianshu.io/upload_images/14368237-aade79d5e025a3fb.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[2]: https://upload-images.jianshu.io/upload_images/14368237-c47af8c5c7040b9c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[3]: https://upload-images.jianshu.io/upload_images/14368237-9a402c45a49a0e9e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[4]: https://upload-images.jianshu.io/upload_images/14368237-0134bf8bc155668b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[5]: https://upload-images.jianshu.io/upload_images/14368237-bb91536d428941bb.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[6]: https://upload-images.jianshu.io/upload_images/14368237-0941bf74f36208e2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[7]: https://upload-images.jianshu.io/upload_images/14368237-d3ee9f46e32b8c87.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[8]: https://upload-images.jianshu.io/upload_images/14368237-b6ee76b87b30c250.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240

