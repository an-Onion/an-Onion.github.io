# 一文搞懂 script 标签

前端开发应该都知道 HTML 中 `<script>` 标签的作用——引入 JS 代码，不过由于脚手架和打包工具的普及，我想很少有人再亲手写 `<script>` 了。本期就借机写一下这个快被遗忘了的 `<script>` 教程，看看大家是否真的掌握了这个元素。

## 基本功能

废话不多说了，直入正题。`<script>` 引入 JS 的方式主要有三种：内联、外置，以及动态引入。

### 内联

直接将 JS 代码写到 script 标签内：

```html
<html>
  <head>
    <script>
      console.log("Hello");
    </script>
  </head>
</html>
```

### 外置脚本

即通过 `src` 属性引入外部 URL 或 JS 文件：

```html
<html>
  <body>
    <script src="http://www.example.com/example.js"></script>
    <!-- 只有加载完并执行完 example.js 后，才开始加载 0.js -->
    <script src="./js/0.js"></script>
  </body>
</html>
```

script 标签可以放置在 html 任意位置，head、body，甚至是 div 里。它们——无论是内联还是外置——的执行顺序基本上（async 和 defer 除外）秉承由上至下串行执行的原则。浏览器首次加载 script 期间，还会阻塞 HTML 页面解析；尤其是外置引入 JS，需要经历网络传输、解析和执行，有时候会导致浏览器白屏。所以谈到首屏渲染的时候，我们往往会建议将 script 标签放到 `<body>` 元素的最下方——先呈现页面再执行 JS。

```html
<html>
  <head>
    <script>
      var x = "onion";
      console.log(document.head); // <head>...</head>
      console.log(document.body); // null
    </script>
  </head>
  <body>
    <script>
      console.log(x); // onion
      console.log(document.head); // <head>...</head>
      console.log(document.body); // <body>...</body>
    </script>
  </body>
</html>
```

此外，在 script 执行期间，它可以获取到所有出现在它上方的 JS 全局变量和 DOM 元素；这导致在一些垃圾代码里，全局元素经常无缘无故被其他代码块污染了。

### 动态引入

我们也可以在 JS 代码里动态添加 script 标签。方法很简单，就是追加一个 script 元素：

```javascript
var myScript = document.createElement("script");
myScript.textContent = 'alert("✋")';
document.head.appendChild(myScript);
```

还有，通过 innerHTML 方式其实也能添加 script 标签，只是该标签下的 JS 不会运行——很有趣的冷知识。

```javascript
document.head.innerHTML += '<script>alert("✋")';
```

## 加载（async & defer）

上文提到为了加快首屏渲染，我们通过把 script 标签放到 `<body>` 底部加快首屏渲染速度。现代浏览器还可以使用其他的手段，比如 defer（延迟加载）和 async（异步加载）

### defer

defer 是 script 里的一个布尔属性，设计目的是将该脚本的执行放到文档完成解析后、DOMContentLoaded（约等于 jQuery.ready）事件前。举个例子，下方的 example.js 文件虽然放在了 head 里，但是它有 defer 属性，不会阻塞下方的 `<body>` 解析。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <scrip defer src="http://www.example.com/example.js"></scrip>
  </head>

  <body>
    <!-- content -->
  </body>
</html>
```

此外，当存在多个 defer 脚本时，html5 标准要求按出现顺序执行脚本；但在现实中，浏览器厂商并不那么遵循标准：defer 脚本不一定顺序执行，甚至不一定会排在 DOMContentLoaded 事件前。因此通常的建议是：最好只含一个延迟脚本。

### async

async 也是 script 标签里的一个属性，该属性也能够消除部分 JS 阻塞。当加上 async 属性后，script 脚本的网络请求便可以并行于 HTML 页面解析发生；并尽快解析和执行该 JS 脚本。也许你会有疑问，async 和 defer 似乎差不多呀，那它们的区别到底是什么？一图胜千言：

![async vs. defer][1]

## 模块化

### type

先说一个叫 `type` 的属性，该属性原本是用来指定 script 脚本的 MIME 类型，默认值是 `text/javascript`，其他值还有诸如：`text/ecmascript`、`application/ecmascript`、`application/javascript` 等等。不过，现代浏览器很多都不再鸟这些值了；而是把 type 用来支持 es6 的模块功能：

```html
<!-- index.html -->
<scrip type="module">
  import { sayHi } from "./hello.js"; document.body.innerHTML = sayHi("Onion");
</scrip>
```

用法很简单，在 script 标签里指定 `type="module"`，当脚本使用 import 指令时，浏览器会自动请求并加载相关的 JS 文件。

```javascript
// hello.js
export function sayHi(user) {
  return `Hello, ${user}!`;
}
```

这里再提一下，module 的默认加载机制就是 defer，只不过下载过程中会顺道把 import 导入的文件也给下载了；如果和 async 属性一起使用，其加载方式就是 async 形式了，大同小异，就不再赘述了。

### nomodule

除此之外，我们常常会看到 module script 下方还会跟一个 nomodule 的 script：

```html
<scrip type="module" src="app.js"></scrip>
<scrip nomodule src="classic-bundle.js"></scrip>
```

这个功能主要是用来兼容一些老版本的浏览器：

- 支持 module 的浏览器，设定上就不会执行 nomodule 属性的 script 脚本，所以它只会跑上方的 app.js 脚本

- 而老破旧的浏览器不支持 `type="module"`，会跳过这个 script 标签；同时又由于它不认识 `nomodule` 属性，反倒会执行 nomodule script 里的 `classic-bundle.js` 文件了

一个小技巧就解决了浏览器兼容方面的问题。

## 安全机制

### integrity

该属性允许 script 标签提供一个 hash 值，用于检验加载的 JS 文件是否完整。比如，如下便签的 integrity 值就是告诉浏览器：使用 sha256 算法计算 JS 文件的摘要签名，然后对比 integrity 值，如果不一致就不执行该资源。它的主要功能就是防止托管在 CDN 上的资源被篡改。

```html
<scrip
  src="//code.jquery.com/jquery.js"
  integrity="sha256-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
></scrip>
```

### nonce

nonce 在我之前的文章——[《CSP 101》][2]——提到过：它是一个加密数字，需要配合 Content-Security-Policy 的 `script-src` 使用。举个例子，http 头的 CSP 属性如下：

```bash
Content-Security-Policy: script-src 'nonce-EfNBf03nceIOAn39fn389h3sdfa';
```

只有在 script 标签内带有相同 nonce 值的脚本才能执行：

```html
<script nonce="nonce-EfNBf03nceIOAn39fn389h3sdfa" src="./hello.js"></script>
```

### referrerPolicy

该属性主要和 HTTP 头里的 `Referer` 配合使用。有些服务器审查比较严格，需要知道请求的“引荐人”（Referrer）；客户请求 API 时，需要同时发送引荐人信息。最简单的使用方式就是给相关的 script 标签添加 `referrerPolicy` 属性：

```html
<scrip referrerpolicy="origin" src="./js/hello.js"></scrip>
```

如上代码中，hello.js 里的所有 api 请求都会在头信息里加上相应 URL 的域（origin）。`referrerPolicy` 的值很多，也很琐碎，有兴趣的朋友可以去[MDM 相关页面][3]查看。

_冷知识：HTTP 头的 `Referer` 有拼写错误，正确的写法是 Referrer；但是标准提案里写错了，结果大家就将错就错了_

### crossorigin

在 HTML5 中，`<script>` 与其他一些元素（`<audio>`、`<img>`、`<link>`、和 `<video>`）提供了对 CORS 的支持； 他们均有一个跨域属性——crossorigin——来配置元素获取数据的 CORS 请求。一旦启用 `crossorigin`，http 头里须包含 `Access-Control-Allow-Origin` 属性，若该属性不存在或是源不必配，则不能加载资源。

Crossorigin 的默认值是 `anonymous`（空值或是无效值都等于 `anonymous`），表示对跨域请求不设置凭据标志；相反，想要提供该凭证，就需要设置 `crossorigin="use-credentials"`。（_这里的凭据，指的就是 cookies、http 里的 auth，以及客户端的 SSL 证书_）

### onload & onerror

onload 和 onerror 算是两个隐藏属性吧，因为只能在动态引入时使用。顾名思义，onload 会指向成功加载时的事件，onerror 就是失败时触发的事件。用法也很简单，就是给这两个属性赋值某个事件函数。现实操作中常配合 `crossorigin` 使用，打印出三方源的一些错误信息。

```javascript
let script = document.createElement("script");

script.src = "http://www.example.com/example.js";
document.head.append(script);

script.onload = function () {
  alert("Success Loading");
};

script.onerror = function () {
  alert("Error Loading");
};
```

_扩展小知识：基本上所有包含 src 属性的 HTML 元素都有 onload 和 onerror 这两个隐藏属性，如： `<img>` 和 `<iframe>`_

## 其他

- language: 早年间用来指定脚本语言的属性，如 Javascript、JavaScript1.2、VBScript，不过现在已弃用

- charset：指定代码的字符集，如`charset="UTF-8"`，可惜也已经过时了

## 小结

`<script>` 一直是我的知识盲点，网上除了 MDM 这种艰涩难懂的标准文档外，竟然很难再找到相关的教程了。本文整理了我见到过的所有 script 属性，并加了一点小小的知识延伸，希望能给大家查漏补缺予以一定帮助。

[1]: ./img/async-defer.drawio.png
[2]: https://www.jianshu.com/p/3c4518046a81
[3]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/referrerPolicy
