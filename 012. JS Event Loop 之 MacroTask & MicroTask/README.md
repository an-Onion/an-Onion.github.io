# JS Event Loop 之 MacroTask & MicroTask

## 前言

本来想复习一下 javascript 事件循环(Event Loop)的，但是发现太巨大了。最近工作也有些忙，所以还是删繁就简，集中精力写某一个知识点比较现实。这次讲讲 Event Loop 里的 MacroTask（宏任务）和 MicroTask（微任务）。

## Task Queue

MacroTask 和 MicroTask 主要有如下若干种方法：

* macrotasks: setTimeout, setInterval, setImmediate, requestAnimationFrame, I/O, UI rendering
  
* microtasks: process.nextTick, Promises, Object.observe, MutationObserver

JS 开发人员应该对这些方法都不会太陌生——都是些常见的异步操作。但这些方法在执行时有什么区别呢？通俗来说，macrotasks 和 microtasks 最大的区别在它们会被放置在不同的任务调度队列中。我在网上盗了一张图，如下所示：

![Task Queue][1]

每一次事件循环中，主进程都会先执行一个 macroTask 任务，这个任务就来自于所谓的 MacroTask Queue 队列；当该 macroTask 执行完后，Event loop 会立马调用 microTask 队列的任务，直到消费完**所有的**microtask，再继续下一个事件循环。

> 管中窥豹，microTask 调用优先级较高于 macroTask.

## DEMO

OK，仅仅看一张图似乎过于抽象，还是用 code 来解释一下：

```javascript
console.log('main start');

setTimeout(() => {
    console.log('setTimeout');
    process.nextTick(() => console.log('process.nextTick 3'));
}, 0);

process.nextTick(() => {
    console.log('process.nextTick 1');
    process.nextTick(() => console.log('process.nextTick 2'));
});

console.log('main end');
```

我们上面提到过`process.nextTick`是 microTask，`setTimeout`是 macroTask，我这里嵌套了宏任务和微任务，看看它们的执行顺序是怎么样的：

```bash
1   main start
2   main end
3   process.nextTick 1
4   process.nextTick 2
5   setTimeout
6   process.nextTick 3
```

大致流程如下所示：

1. 先运行主程序（事实上主程序本身就是一个 macroTask），主程序把`setTimeout`和`process.nextTick`分别放入 MacroTask Queue 和 MicroTask Queue
   
2. 主程序结束，这时候我们看到了第一二条的打印结果**main start**、**main end**
   
3. 如上面所提到的，每一个 macroTask 结束后会开始消费 microTask。这时的 MicroTask Queue 里有一个`process.nextTick`，然后发现它本身也调用了一个`process.nextTick`，所以继续把这个内层的任务加入 MicroTask Queue。
   
4. 线程消费掉所有 MicroTask Queue 里的任务（这时只有两个任务），我们得到了第三四条结果**process.nextTick 1**和**process.nextTick 2**

5. 当 MicroTask Queue 清空后，Event Loop 进入下一个循环：执行 MacroTask Queue 的`setTimeout`任务，然后得到了第五条输出**setTimeout**，之后它还会把又一个`process.nextTick`放入 MicroTask Queue

6. 继续如 4 所示过程，Event Loop 在 Current MacroTask 执行完成后消费 MicroTask Queue，这时候我们有了最后一条输出**process.nextTick 3**

![Task Invocation][2]

上面的代码看着可能有点绕，但是弄清楚原理后还是能理解的。
当然现实中，Event Loop 的任务调度会很复杂，比如：

* 主程序里同时调用多个 setTimeout，谁先执行是不确定的。

* Node.js 文档里称“setImmediate 指定的回调函数，总是排在 setTimeout 前面”，所以应该是有多个 Task Queue 的

* 浏览器的话，处理了 macroTask 和 microTask 之后，会进行一次 Update the rendering，具体细节还很多

## 后话

学习语言的底层实现有时候是一件很无聊的事，类似于“孔乙己中,茴香豆的‘茴’字有几种写法”。说实在，现实开发中很少人能用到。不过，假如你并不满足于 CURD 工程师的话，最好还是能了解一下这类知识。至少在某些场合里也有了一定的“谈资”。互勉！

[1]: https://upload-images.jianshu.io/upload_images/14368237-da841b8c2d5af5aa.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[2]: https://upload-images.jianshu.io/upload_images/14368237-7f830747fc7f5358.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240