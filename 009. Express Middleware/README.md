# Express Middleware

## 简述

今天讲一下 Express 相关知识。Express 是 NodeJS 里最出名的一个 web 框架（没有之一）。它以**极轻量级**闻名于世，如果高度总结 Express 方法的话，它仅仅就两部分组成：路由（routing）和中间件（middleware）。今天就简单介绍一下 middleware 的使用方法。

## Express 方法

如下所示，是 express 方法定义和一个简单的示例：
```javascript
app.METHOD(ROUTING, MIDDLEWARE1, MIDDLEWARE2, ...);
```

`app.METHOD()`方法的第一个参数是 api 的路径（路由），之后的不定参就是一串 middleware 方法。

```javascript
cosnt express = require('express');
let app = express();

app.get('/routing', //路由
    function middleware1(req, res, next) { //中间件1
        console.log('Be invoked firstly.')
        next();
    },
    function middleware2(req, res,next) { //中间件2
        res.send('Hello world!');
        next(); //won't work.
    },
    function middleware3(req, res,next) {
        console.log('Not be invoked!');
    }
)
```

如上所示，当 express 获取 api 请求后，依次运行 middleware1，middleware2，middleware3……这里 middleware1 打印完一串字符后，调用`next()`方法，express 会接着往下运行 middleware2；middleware2 直接向 response 发送了*Hello world!*，然后整个请求就结束了，尽管后面还有`next()`方法，但也不会再调用 middleware3 了。

* ![How middleware works][1]

至此，Express 框架的大体使用方式就讲解完了。（，不知道该讲啥了……）

## Use middleware

除了一般的`post`，`get`等方法，`app.use`也可以用到 middleware。

```javascript
let logger = (req, res, next) => {
    console.log('LOGGED');
    next();
}

app.use(logger);

app.get('/api', (req, res) => {
    res.send('Hello world!');
})
```

Middleware 是按顺序加载的，如上所示：`app.use(logger)`在`app.get()`之前，所以每次 app 接受到请求后，都会先打印一个**LOGGED**，再返回 Hello world。这里，假如`app.use(logger)`出现在`app.get()`之后，那就不会打印**LOGGED**，因为`app.get()`直接返回了消息，并没有调用`next()`。

## 3rd Party

现实开发中我们还会用到很多 express 的三方库，主要原理都是 use 各种自定义的 middleware。

* [expressjs/compression][2]: 用来压缩所有返回的数据，可选 deflate 或 gzip。

    ```javascript
    // compress responses
    app.use(compression())
    ```

* [expressjs/body-parser][3]: 解析 body 里的 data 数据
    ```javascript
    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }))

    // parse application/json
    app.use(bodyParser.json())
    ```

我自己开发的时候也经常用到自定义的 middleware。上一期写的[Log with Async Hooks][4]就是通过 middleware 加到 web 应用里的：只需在所有`app.METHOD`调用前获取请求头里的 tenant 信息，随后所有的 log 里就有 tenant 了。一个简单的 MT web service 就成型了。

```javascript
app.use((req, res, next) => {
    let asyncId = async_hooks.executionAsyncId();
    contex.set(asyncId, req.headers.tenant)
    next();
});

```

## 小结

Express 常年保持 Node 后端框架 No.1 的地位，下图是 2018 年的趋势分布。预计数年内这个趋势不会有太大的变化。我经历过 Java Spring 的开发，记得刚入职的时候被 Spring 各种配置恶心许久，至今心有余悸；现在能得闲做 express 开发，真是太庆幸了。（希望不要拉仇恨）
* ![2018 Javascript Back-end Frameworks][0]

[0]: https://upload-images.jianshu.io/upload_images/14368237-7e6380633c0bb2f3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[1]: https://upload-images.jianshu.io/upload_images/14368237-73f01ea9de15ab27.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[2]: https://github.com/expressjs/compression
[3]: https://github.com/expressjs/body-parser
[4]: https://www.jianshu.com/p/11fdd3508b10
