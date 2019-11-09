# Worst Practice in Error Handling

今天来复习一下 Javascript 的错误处理，顺便理一下自己开发中每天在书写的错误。

## Overview

我们先来回忆一下 JS 常见的 Error Handling

### Callback

回调是 JS 在很长一段时间里捕获异步错误的唯一方式。看个例子，回忆一下回调地狱年代的代码：定义一个异步函数`cbFunc`，传入`callback`函数，在运行 1000ms 后捕获`oops`这个 Error。

```javascript
function cbFunc(callback) {
  setTimeout(() => {
    callback(new Error('oops'));
  }, 1000);
  // happy path if any
  //callback(null, data)
}
```

回调极不直观，我刚入坑 JS 的时候，被它折磨过很久。上述代码中，cbFunc 的参数 callback 其实是个**函数**（没有 FP 经验的小朋友可能会转不过来）。callback 的第一个参数是 Error 类型的对象，第二个参数才是正确处理后的数据；而且在 JS 异步机制下，它的执行与 caller 不在一个 tick 里（how to say，不会阻塞 caller，只会在未来的某个时间执行）。

```javascript
const cb = function callback(err, data) {
  if (err) {
    console.error(err.message);
  } else {
    // happy path and deal with data
  }
}

cbFunc(cb); // oops
```

有没发现？callback 的错误捕获其实很 naive，靠的是判断第一个参数是否为 null😅。

* 失败：callback(new Error())
* 成功：callback(null, data)

在没有类型定义的开发中，这种参数形式其实随意，各种前端报错；因此在刚开始的时间里，JS 只能作为 web 响应的辅助手段。

### Promise

Promise 的正式出现要到 es6！很那想象，这么多年来，我们调用三方 JS 库时，出错处理主要靠自觉？！

```javascript
function asyncFunc() {

  const executor = (resolve, reject) => {
     setTimeout(() => {
       reject(new Error('oops'))
     }, 1000);
     // happy path
     // resolve(data)
  }

  return new Promise(executor);
}
```

Promise 构造参数`executor`依旧难以理解，它本身是函数，两个参数（`resolve`、`reject`）也还是函数。Promise 将执行时的错误抛给`reject`函数，而成功执行的结果则传给`resolve`函数。

虽然看起来有点复杂，但是我们终于可以在肉眼层面判断出`asyncFunc`会把执行成功的结果放在`then`里，失败的结果放在`catch`里。

```javascript
asyncFunc()
 .then((data) => {
    // happy path
 })
 .catch((err) => {
    console.error(err.message)
 });

console.log('Hello');
```

不过 promise 依旧是异步方法，`catch`代码块的执行会晚于`asyncFunc()`的执行上下文。上述代码里，`Hello`打印将早于`err.message`。换句话说，错误处理只能发生在未来某个不确定的时间，`asyncFunc()`正下方的代码块依旧无法及时应对即将发生的错误。

### async-await

async-await 其实就是 promise 和生成器的语法糖，跟随它们出现了一个新的语法 try-catch——JS 错误处理终于跟上了主流开发语言的节奏：

* try 里是成功执行的代码块
* catch 里是错误处理

而且 async-await 最大的改变是，我们终于可以在一个看似同步的过程中处理错误了。举个例子，如下代码中，`console.log('Hello');` 一定晚于`try-catch`代码块执行。相比于 promise 这是巨大的进步。

```javascript
try {
  await asyncFunc();
  // happy path
} catch (err) {
  console.error(err.message);
}

console.log('Hello');
```

当然，async-await 语法在某些场景下依旧会有许多让人困惑的地方。如下是两个很经典的例子：例 1 能捕获 asyncFunc 的错误，而例 2 不能。原因在于 async-await 本质是 promise 语法糖，`return asyncFunc()`是不会执行 promise 对象内的`executor`方法（见上文 asyncFunc 定义），真正执行要等到`await`或是调用`.then`方法。例 1 执行了`asyncFunc`内部的异步调用，`reject`吃下的错误会在`catch`里抛出；而例 2 仅仅给调用者返回来一个待执行的 promise 对象，`reject`还没开始吃`new Error('oops')`。

```javascript
// Example 1
try {
  return await asyncFunc();
} catch (err) {
  // Any promise rejection while calling asyncFunc() will reach here, because of using `await`
}

// Example 2
try {
  return asyncFunc();
} catch (err) {
  // No promise rejection will reach here because the promise is returned to the caller instead of resolving it here.
}
```

## Worst Practice

上文快速回顾了各个 JS 年代里捕获 Error 的方式。下面再谈谈开发中的出错经历。

### 没有处理未捕获的异常

开发实践中，即便你在代码外包了无数层 try-catch，你还是会遗漏掉一些特殊的错误。在 nodejs 中，这类遗漏的异常共两种，分别称作**uncaughtException**和**unhandledRejection**。Nodejs 程序最终会捕获这类异常，并在后台打印错误；但这个 log 并不能被我们自己的 logger 收集到。所以，生产环境应中应当主动监听到这类异常；甚至有些流派认为，发生这类异常就该直接杀死进程，并立即修复。方法很简单，如下：

```javascript
process.on('uncaughtException', (err) => {
  logger.fatal('an uncaught exception detected', err);
  process.exit(-1);
});

process.on('unhandledRejection', (err) => {
  logger.fatal('an unhandled rejection detected', err)
  process.exit(-1);
});
```

### 隐藏错误

隐藏错误，指的是 caller 无从得知错误是否发生。如下代码，catch 块里直接返回了空数组，调用栈上下游却无从得知缘由——users 本身为空还是连接错误了？这类错误的表象是数据不一致，但是排查起来却困难重重。

```javascript
// Bad example
function processUsers() {
    try {
        const body = await client.get('http://example.com/users');
        return body.users || [];
    } catch (err) {
       return []
    }
}
```

Best Practice 是：

* 至少得打个 error log
* 明确地为调用链下游传递错误信息：最简单的就是`throw(err)`；此外，在 express 我们通常会调用`next(err)`

### 过多的 try-catch

上文提到不该隐藏错误，但是过多的 throw Error 会让代码到处都是 try-catch 块，及其难看；而且到处都在处理错误也是一件很麻烦的事。我曾经的一篇[文章][0]里提到过如何减少 try-catch 块，有兴趣的小伙伴可以再回看一下。核心思想就是建立一个统一的 error handler 模块——专门处理事件异常。

```javascript
//error hanlder
if (err instanceof AuthenticationError) {
  return res.status(401).send('not authenticated');
}

if (err instanceof UnauthorizedError) {
  return res.status(403).send('forbidden');
}

// err omit...

// Generic error
return res.status(500).send('internal error occurred')
```

这就要求我们自定义错误类型。我想很多小朋友都没有实现过自定义的 Error 吧，这里做个演示。

```javascript
class UserServiceError extends Error {
  constructor(...args) {
    super(...args);
    this.code = 400;
    this.name = 'UserServiceError';
    this.stack = `${this.message}\n${new Error().stack}`;
  }
}
```

实现如上，就是继承原生的 Error，然后自定义 code，name，stack 等信息。使用如下：根据特定请求抛出相应的异常。

```javascript
app.use('user', async (req, res, next) => {
  try {
     const user = await getUserFromApi(req.headers.id);
     res.json(user);
  } catch (err) {
    next(new UserServiceError(err.message));
  }
})
```

### 未对日志分级

log 是生产线上排查错误的重要信息（有时候也是唯一信息来源）。很多小朋友只会用`console.log`这一种方式，事实上这样的日志意义不大：一旦出错我们很难在浩如烟海的日志中快速过滤出错误消息。合理的做法是：将 log 根据重要程度分成不同的级别，并在某些级别的日志出现时及时告警。以下五种分级是我们常用的一些日志分类方式：

* debug：非重要信息，在开发环境里 debug 的一些消息
* info： 比较重要的信息，用于追踪调用栈
* warn： 警告，虽不至于出错，但是已经是需要排查的问题了
* error：错误，需即刻注意的信息，用于排查 bug 发生的场景
* fatal：致命错误，会导致服务停运的信息，需要立即修复

开发时正确地归类 log 能帮助运维更高效地定位错误；及时告警甚至能避免一些重大的事故。

## 小结

That's it. 这期我们回顾了一下 JS 错误捕获方式，又列举了一些常见的误区。信息不多，就是归纳了一些我自己开发中就在书写的 Worst Practice。开发嘛，就是一个不断试错、纠正、总结的过程；记录一些小小的心得，希望与大家共同成长。

## 相关

[《Express Middleware (续)》][0]

[0]: https://www.jianshu.com/p/9a7792ae5f77

