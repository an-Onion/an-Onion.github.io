# CSP(Content Security Policy) 101

这期科普网络安全里的一个小知识：Content Security Policy（内容安全策略）。

## 前言

我们都应该听说过[XSS][0]（跨站脚本攻击）；它可能是最常见、危害最大的网络安全漏斗。大约十年前吧，W3C 网络应用安全工作组为防御 XSS、点击劫持等代码注入攻击，推荐 CSP 成为计算机安全标准，以阻止恶意内容在受信网页环境中执行；之后几乎所有的现代浏览器都支持了这一策略。

XSS 可以通过本站点`<script>`脚本、内联 JS 代码、外部导入资源等等方式进行注入攻击。CSP 根据这一特性，启用白名单策略，过滤所有执行过程中加载的资源。效果就是：打开浏览器控制台还可以看到如下字样：

> Refused to load the script 'http://xxxxx' because it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-eval' 'unsafe-inline'

## CSP

如下所示，CSP 本质上就是一个很长的字符串，利用 `;` 隔开了各个策略：

```bash
Content-Security-Policy: style-src 'unsafe-inline' 'self'; script-src blob: 'unsafe-inline' 'self';
```

每个策略又是一组通过 `空格` 隔开的字符串，第一个字符串表示限制**指令**（如 `script-src`），之后的字符串就是限制的**选项值**（如`'self'`、`https://fonts.googleapis.com`）。

### 限制指令

常见的限制指令（directive）有：

|    指令     |              限制资源              |
| :---------: | :--------------------------------: |
| script-src  |   外部资源、内联脚本、eval 函数    |
|  style-src  |              css 文件              |
|  media-src  | video，audio，以及关联的 text 文本 |
|   img-src   |                图像                |
|  frame-src  |               iframe               |
| default-src |        所有上述指令的默认值        |

### 选项值

限制选项可细分为三类：

1. 关键字（需加单引号）：

   - `'self'`：匹配所有同源资源
   - `'none'`：阻止所有该指令下列举的资源

2. 常用资源：

   - url 或是带通配符的 url，如：`https://*.unpkg.com`
   - 协议名（有冒号）：如：`https:`、`blob:`

3. `script-src`的特殊值（都需要加引号）：

   - `'unsafe-eval'`：允许 eval 方法
   - `'unsafe-inline'`：允许内联的`<script>`脚本执行
   - `'nonce-<base64>'`：`<script>`带有特定的 nonce 值才能执行
   - `'<hash-algorithm>-<base64>'`：`<script>`脚本的 hash 值为特定值时才能执行

## 例子

上文列出了最常用的 CSP 指令，看完可能还在云里雾里，我再用几个具体的例子解释一下：

### 例 1

只允许本站的 js 脚本：

```bash
Content-Security-Policy: script-src 'self';
```

### 例 2

允许本站和来自 `unpkg.com` 的脚本，以及所有图片：

```bash
Content-Security-Policy: script-src 'self' *.unpkg.com; img-src *;
```

### 例 3

阻止所有 iframe 窗口；并允许其他所有本站资源：

```bash
Content-Security-Policy: frame-src 'none';default-src 'self';
```

### 例 4

执行特定 nonce 的内联脚本：

```bash
Content-Security-Policy: script-src 'nonce-EfNBf03nceIOAn39fn389h3sdfa' 'self';
```

只有在`<script>`标签内带有特定 nonce 值的脚本方能执行：

```html
<script nonce="nonce-EfNBf03nceIOAn39fn389h3sdfa" src="./hello.js" />
```

nonce 比较常用的场景有：

1. 设置为 token 值，只有获取了特定 token，才有权限加载特定资源
2. webpack 可以在入口文件设置`__webpack_nonce__`变量，为每个唯一的页面视图生成和提供一个唯一的基于 hash 的 nonce 值

### 例 5

Hash 值相符的脚本才能执行：

```bash
Content-Security-Policy: script-src 'sha256-qznLcsROx4GACP2dm0UCKCzCG+HiZ1guq6ZZDob/Tng='
```

这里说明一下 `alert('Hello, world.');` 这个**字符串**的 `sha256` 值为 `sha256-qznLcsROx4GACP2dm0UCKCzCG+HiZ1guq6ZZDob/Tng=`，所以只有如下代码能执行：

```html
<script>
  alert("Hello, world.");
</script>
```

Hash 值在前端开发中也可配在 webpack 里，有[csp-html-webpack-plugin][1]这种插件会自动在 meta 和 script 里生成 hash 值，以控制不同版本的脚本文件。

## 使用方法

上面列举了一些常用的配置场景，忘了提 CSP 到底怎么使用了。有两种方法可以启用 CSP 策略：

1. 在服务器返回的 HTTP header 里加上`Content-Security-Policy`字段，以 express 为例：

   ```javascript
   app.use((req, res, next) => {
     const csp = "default-src 'self';";
     res.append("Content-Security-Policy", csp);
     next();
   });
   ```

2. html 里加上 `<meta>` 标签，这个现在基本可以用 webpack 来完成了：

   ```html
   // index.html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self';" />
   ```

## 小结

CSP 是过滤 XSS 攻击最常用的手段，我们相关从业人员都应该懂得这些基本用法。但是 CSP 也只是最基本的防御手段，只要控制了一台列入了白名单的可信主机，基本 CSP 就凉凉了。所以，网络安全需要更多的防护手段综合治理，任重道远呀。

[0]: https://www.jianshu.com/p/8f0f2ceb8ff5
[1]: https://github.com/slackhq/csp-html-webpack-plugin
