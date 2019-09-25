# Log with Async Hooks

## Async Hooks

最近，开发组想实现一款规格化的 node log 工具，以便厂里 log 搜集工具监控管理器。我们需要定制化 log，并且必须包含上下文信息。但是 Node 是单线程应用，很难做到 Java 那样轻松地通过 session 获取上下文。（是的，厂里从来都没有做过 node 开发，各种方案都需要自己摸索。）有段时间开发只能通过参数形式传递上下文，但是这种方式很容易出错，并且 api 变得愈发复杂，作为一个企业级项目显然这不是长久之计。
某天，我偶然看到了一个黑科技叫`async_hooks`，是 node 8.2 以后推出的一个模块，它提供了一组有趣的 API 来跟踪 node js 异步操作。然后我就想到可以用这个 Hook 来实现我们的 log 工具。

## API

以下是摘自`async hooks`开发者文档里的部分 public API。`executionAsyncId`顾名思义返回的是当前异步资源的 ID，`triggerAsyncId`是调用者的 ID，`createHook`用于初始化 Hook 生命周期（init => before => after => destory）的工厂方法。

Node 对每一个函数提供了 async scope，我们分别可以通过`executionAsyncId()`和`triggerAsyncId()`获取当前和调用者 scope ID，按图索骥就可以获得整个调用链的 id 数组了，上下文也就不再是问题。

```javascript
// Return the ID of the current execution context
function executionAsyncId(){};

// Return the ID of the handle responsible for triggering the callback of the
// current execution scope to call.
function triggerAsyncId(){};

// Create a new AsyncHook instance. All of these callbacks are optional.
function createHook({ init, before, after, destroy }){};
```


一般来说我们初始化一个`async hooks`的方法如下所示。`init`、`before`、`after`和`destory`都是模版方法，简单起见，我只着重讲一下`init`方法。`init`第一个参数`asyncId`代表当前异步资源的 ID， `type`表示该资源的类型（PROMISE、TIMEOUT、TickObject 等等），`triggerAsyncId`是调用者的 asyncId，`resource`是该异步资源包含的一些信息。

```javascript
const asyncHook = require('async_hooks');

const hook = asyncHooks.createHook({
    init(asyncId, type, triggerAsyncId, resource) {
    },
    before(asyncId) {
    },
    after(asyncId) {
    },
    destroy(asyncId) {
    }
}).enable()
```

asyncHooks 模版会在异步方法被调用后自动触发，并按照该资源的各个生命周期依次执行。下文中，我只会用到`init`一个方法保存 context 信息。

## 上下文

Ok，有了 async Id，我们如何获取上下文信息呢？其实是很土的方法——全局 Map。

```javascript
const fs = require('fs')
const async_hooks = require('async_hooks')

const contex = new Map()

async_hooks.createHook({
  init (asyncId, type, triggerAsyncId) {
    let ctx = contex.get(triggerAsyncId)

    contex.set(asyncId, ctx)

    fs.writeSync(1, `{context: ${ctx}}`)
  },
  ...
}).enable()

```

这里我没有用`console.log()`打印，原因是`console.log()`本身就是一个异步操作，若是在`async hooks`跟踪它，会导致无限循环。所以用的是标准输出：`fs.writeSync(1, string)`。

## Demo

下面写一个完整的例子, 有点长。。。

```javascript
const fs = require('fs')
const async_hooks = require('async_hooks')

const contex = new Map()

const log = function (args) {
  const [trigger, asyncId] = [async_hooks.triggerAsyncId(), async_hooks.executionAsyncId()]
  const ctx = contex.get(asyncId)
  fs.writeSync(1, `{asyncId: ${asyncId}, trigger: ${trigger}, context: ${ctx} }: ${args}\n\n`)
}

async_hooks.createHook({
  init (asyncId, type, triggerAsyncId) {
    let ctx = contex.get(triggerAsyncId)
    contex.set(asyncId, ctx)
  },
}).enable()

function foo () {
  setTimeout( () => { log('in foo timeout') })
}

setTimeout( () => {
  contex.set(async_hooks.executionAsyncId(), 'Onion')
  log(`in global setTimeout A`)
  foo()
})

setTimeout( () => {
  contex.set(async_hooks.executionAsyncId(), 'Garlic')
  log(`in global setTimeout B`)
  foo()
} )
```

打印结果如下。这样就可以在非侵入条件下为 log 添加上下文信息了，是不是挺方便的？

```javascript
{asyncId: 6, trigger: 1, context: Onion }: in global setTimeout A

{asyncId: 8, trigger: 1, context: Garlic }: in global setTimeout B

{asyncId: 9, trigger: 6, context: Onion }: in foo timeout

{asyncId: 10, trigger: 8, context: Garlic }: in foo timeout
```

## 小结

今天介绍了一下 nodejs 里的`async hooks`库，并且自制了一个全链路、无侵入、乞丐版的 log 函数。当然市面上还有一些类似的库，比如 angular 的 zone.js，大家有兴趣可以尝试一下。据官方介绍，`async hooks`还处于试验阶段，预计 2019 可以推出正式版，届时 node 社区应该会大力推广这个有趣的 feature，敬请期待。
