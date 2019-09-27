# Express Middleware (续)

几个月前我写过一篇[Express Middleware][1]的介绍；最近又陆陆续续踩了点坑，所以决定再写一期，扩充一下 express 的知识点。

## middleware 函数的参数列表

我们经常为`app.use`添加各种 Middleware 函数（也有叫做 callback 函数，或是 handler 函数），但是你知道这个 Middleware 的参数列表吗？

```javascript
app.use(function middleware(req, res, next) {
  // middleware content
})
```

1. 当只有一个参数时 `(req) => {}`

    参数是 HTTP 发起的 request 事件，其中包含 url、method、header、query、params 等一系列请求信息

2. 当两个参数时 `(req, res) => {}`：

    第一个参数同上，第二个参数是服务器返回给请求方的 response 对象，包含各种状态码、头信息、返回的数据或文件、重定向的 URL 等等

3. 当三个参数时 `(req, res, next) => {}`，

    前两个同上，第三个 next 是后继 Middleware 函数的指向。

4. 当参数为四个时 `(err, req, res, next) => {}`,

    第一个参数变成了 Error（😅简直了），而后三个才与上面相同，不过这种 Middleware 只用于错误处理（后面再说）。

    题外话，还有一种四参数 middleware，是 express 4 新增的 methods——`param`，第四个参数代表 URL 里的某个 param。

    ```javascript
    app.param('id', function (req, res, next, id) {
      // ...
    })
    ```

## Code After next

再回忆一下这张图，当 middleware 调用 `next` 方法时，它会立即执行下一步的 middleware。

![middleware-next][2]

但是！这么简单的设计竟然也能有坑！看一下代码，它的打印结果`1 2 3 4`

```javascript
app.get('/', (req, res, next) => {
  console.log('1')
  next()
  console.log('4')
})

app.use((req, res) => {
  console.log('2')
  res.send('Hello')
  console.log('3')
})
```

大家有没有发现，代码的执行顺序很微妙。看一下`next()`，它后面的代码会在所有 middleware 结束后运行。`4`这一块代码的机制，我就踩过坑：

```javascript
app.get('/', (req, res, next) => {
  if( req.headers.active )
    next()
  res.send('Inactive!')
})

app.use((req, res) => {
  res.send('Hello')
})
```

以前写过这样的代码，运行时一直报错：`Cannot set headers after they are sent to the client`，排查了很久才发现是执行了`res.send('Inactive!')`的缘故。初写代码时，我还特地删了`else`，就是想让代码少一个大括号（自以为这样代码更精简😅）。现在想想还是太年轻了，不懂装懂。

解决方法很简单，用 `if-else` 的形式； 或是使用 `return next()`， 让代码直接跳出当前回调函数。

## next 的参数

next 函数是可以填参数的，但是这个参数信息很少有人提到（囧）。我也是偶然看到文档里零碎提过下面三种：

### next('route')

先看例子吧

```javascript
app.get('/user/:id', (req, res, next) => {
  // if the user ID is 0, skip to the next route
  if (req.params.id === '0') next('route')
  // otherwise pass the control to the next middleware function in this stack
  else next()
}, function (req, res, next) {
  res.send('Just next()')
})

app.use((req, res, next) => {
  res.send('Specially! next(route)')
})
```

这里的 `/user/:id` 是所谓的动态路由——包含参数，我们可以通过 `req.params.id` 获取用户 id。若路由为 `/user/0`，则返回 `Specially! next(route)`；其他 id，如 `/user/0`，则返回 `Just next()`。稍微解释一下，普通的 next 是先执行完本 method——如 use， get，post 等等——栈里的方法，再调用后续栈；而加了参数 `route` 的 next 会跳出该 method 所在栈，直接运行下一个栈的方法。

### next('router')

关键字从`route`变成了`router`，意思是一样的，只是这次是直接跳出所谓的**router**了。

```javascript
const router = express.Router()

// predicate the router with a check and bail out when needed
router.get('/:id', (req, res, next) => {
  if(req.params.id === '0') next('router')
  else next()
})

// middleware in the same router
router.use((req, res, next) => {
  res.send('hello, you\'re in the router!')
})

// send something to those fall through
app.use('/admin',
  router, // register router
  (req, res) => res.send('hello, 0!') // middleware after router
)
```

上面代码里的 `router` 是作为二级路由添加到 `/admin` 之后的，完整的路径是 `/admin/:id`。我们看一下运行结果，当路由为 `/admin/0` 时，会直接跳出该二级路由，并调用 router 之外的 middleware，最后返回 **hello, 0!**；而 id 非 0 时，如 `/admin/0`，则继续 router 内部的 middleware，最后返回**hello, you're in the router!**。

上述两个关键字`route`和`router`从设计上我很能理解，毕竟跳出内层嵌套是很常规的操作；但是如果能提供一种枚举方法来代替这两个 string 可能在操作上更具可行性。

### next(err)

`next(err)` 设计更早于前两者，当你给 next 传入 Error 类型的参数后，它会一路略过之后的 middleware，直到遇到离它最近的 Error handler。Express 会在代码结尾默认添加异常处理函数，操作包括：

1. 给请求方返回 500 状态码
2. 发送错误消息
3. 在控制台打印出错误栈

当然，我们也可以自定义 error handler——也就是我之前提到过的四参数 middleware。我们看一下示例：

```javascript
app.get('/error', (req, res, next) => {
  next(new Error('Error Router'))
})

app.use((req, res, next) => {
  res.send('Hello World!')
})

app.use((err, req, res, next) => {
  res.send(err.message);
})
```

当路由为`/error`时，它并不返回最近的 middleware 结果——`Hello World`，而是被之后的四参数 middl（Error handler）捕获，最后才发送`err.message`——`Error Router`。这个设计类似于函数式编程里的 Either 概念，只要是 error 就一路绿灯，直到碰到主动收集 error 的 function 为止。可以看得出，设计思想是共通的。

## async/await

`async/await`是 node 8 以后标志性的语法糖。当 express middleware 调用 DB 等异步操作时，async/awiat 是代替早前 callback 和 promise 方法最优雅的操作——我们只需要在函数前加一个 async 关键字。

```javascript
app.post('/testing', async (req, res, next) => {
  const users = await User.findAll()
})
```

但是，`async/await` 的异常处理极其很难看——需要包一层`try/catch`。

```javascript
app.post('/testing', async (req, res, next) => {
  try{
    const users = await Users.findAll()
  } catch(err) {
    next(err)
  }
})
```

上面提到了，express 的错误处理一般就是的`next(err)`。所以，当代码量上去后，你会发现代码里都是`try{...}.catche(e){ next(e) }`。有没有办法去掉这类模版代码呢？

### [await-to-js][3]

我第一个想到的是 await-to-js，它实现了一个`to`方法，大意如下：

```javascript
function to( promise ) {
  return promise
    .then(data => [null, data])
    .catch(e => [e, null])
}
```

调用后返回一个二元数组：判断 err 非 null 就可以处理异常了。

```javascript
app.post('/testing', async (req, res, next) => {
  const [err, users] = await to( User.findAll() )
  if( err ) next(err)
})
```

但上述方法只减少了代码行数，还得重复判断 err，能不能直接省了这个`next(err)`？

### [express-async-handler][4]

有个叫 express-async-handler 的库就是这么干的，我也写一下大体实现：

```javascript
function asyncHandler (fn) {
  return (req, res, next) => {
    const fnReturn = fn(req, res, next)
    return Promise.resolve(fnReturn).catch(next)
}
}
```

高阶函数实现，使用方法是在 middleware 外套一层 asyncHandler：

```javascript
app.post('/testing', asyncHandler(async (req, res, next) => {
  const users = await User.findAll()
}))
```

### [express-async-errors][5]

有没有套一层函数也不需要写的方式呢？后来我发现了这个库——express-async-errors，只要在头上加一个`require`就够了。

```javascript
const express = require('express')
require('express-async-errors')
const app = express()

app.post('/testing', async (req, res, next) => {
  const users = await User.findAll()
})
```

实现上也很简单，主要思想就是修改 Router 的原型链，给所有的 middleware 包一层上面的 asyncHandler 就行了。

```javascript
const originalParam = Router.prototype.constructor.param;
Router.prototype.constructor.param = function param(name, fn) {
  fn = asyncHandler(fn);
  return originalParam.call(this, name, fn);
};
```

## 小结

这次零散地罗列了几个 express 的小知识点，重点介绍了`next`函数的使用方式和常见的`error handler`。Express 是一个极轻量的框架，但雄踞 node 后端榜单数年，其周边工具更是浩如烟海。极简、开放的设计理念，是它的成功之道；我们在使用框架之余，也该应着重学习一下这样的思想理念。

## 相关文章

 [《Express Middleware》][6]



[1]: https://www.jianshu.com/p/dc17c4d414d1
[2]: ./img/middleware.png
[3]: https://github.com/scopsy/await-to-js
[4]: https://github.com/Abazhenov/express-async-handler
[5]: https://github.com/davidbanham/express-async-errors
[6]: https://www.jianshu.com/p/dc17c4d414d1
