# HTTP 安全头速览

书接上文——[《JS 安全策略》][0]，我们速览了一些 Web 开发中常见到的安全策略；本文继续展开，讲讲另一种 Web 防御策略——HTTP 安全标头（Security Header）。

## 概述

HTTP Headers 是客户端和服务器在 HTTP 传输过程中添加的附属信息。一个请求头由名称（不区分大小写）后跟一个冒号`:`，再跟一个具体的值（不带换行符）组成。常见的 Http 头有好多种，如：

- auth 类：Authorization，WWW-Authenticate，Proxy-Authenticate 等等
- cache 类：Age，Expires，Cache-Control 等等
- 条件请求类：If-Match，If-Modified-Since 等等

上面这些标头应该是耳熟能详了；不过，对于安全类的 HTTP 头，我问了周边的小伙伴，很多人都不熟悉；所以，这期就借机介绍几个非常实用的安全头，大家看看自己用过几个。

## Trusted Types （可信任类型）

我们从之前提过的可信任类型说起。Trusted Types 主要用于防御基于 DOM 的跨站点脚本攻击（DOM-based XSS）。

> DOM-based XSS: 一种将恶意数据传递给动态语言接收器的攻击手段；在 JS 语言中，最常被攻击的接收器就是： `eval()`和 `.innerHTML` 了。

Trusted Types 就是一种黑名单机制，限制那些有安全隐患的 Web API 被浏览器调用。除此之外，主流的浏览器厂商现在都提供了一个特殊的对象来代替上述 API，人称 `trustedTypes`。

启用 Trusted Types 的方法很简单，服务器返回的 HTTP 消息中带上如下安全头即可：

```html
Content-Security-Policy: require-trusted-types-for 'script'
```

启用后，如下代码——修改`.innerHTML`——就会直接抛出异常了。

```javascript
el.innerHTML = "<img src=x onerror=alert(1)>"; // This throws an exception.
```

至于替代手段，就是利用 `trustedTypes` 生成的字符串绕开检查罢了。下例中，通过使用 trustedTypes，让开发人员有意识地把 inner html 中的 tag 标签——`<` 和 `>`——替换为特殊符号（`&lt` 和 `&gt`）以防止 XSS 注入。

```javascript
const policy = trustedTypes.createPolicy("escapePolicy", {
  createHTML: (str) => {
    return str.replace(/\</g, "&lt;").replace(/>/g, "&gt;");
  },
});

// accepted operation
const escaped = policy.createHTML("<img src=x onerror=alert(1)>");
el.innerHTML = escaped; // '&lt;img src=x onerror=alert(1)&gt;'
```

## Content Security Policy（CSP）

CSP 我们讲过很多次，我们再快速过一遍。CSP 主要用于阻止跨站点脚本执行的一种安全策略。通常建议所有的 Web 应用都开启 CSP：

- 如果是服务端渲染的脚本，请至少启用 CSP 的 nonce 机制
- 如果是静态资源器托管的脚本，请至少启用 CSP 的 Integrity 机制

## X-Content-Type-Options

部分浏览器（如 IE < 8.0）会出现一种加 MIME 混淆的情况。举个通俗的例子，某些图片会包含一些合法的 HTML 标记（大家懂的），当那些浏览器加载这类图片时会执行里面的 HTML 脚本，引发所谓的基于 MIME 的脚本攻击。

但是，如果服务器响应标头里加上 `X-Content-Type-Options: nosniff`，这种攻击就可以避免了。因为此时的浏览器将强制要求加载的资源带上 MINE 类型描述——`Content-Type`，不然抛出异常，比如 IE 的异常如下：

```bash
SEC7112: Script from http://xxx.com was blocked due to mime type mismatch script.asp
```

而对于带有 MIME 类型的图片资源（如`image/jpeg`），浏览器将视作静态资源，就不会继续执行里面的脚本了。

## X-Frame-Options

X-Frame-Options 顾名思义，和 iframe 嵌入相关的安全头了。部分网站可能会将你的网页当作 iframe 嵌入，然后劫持你的用户操作；一些不明真相的用户会被劫持的反馈引向不安全的网站，或是泄露敏感信息。这就是经典的 Spectre-type attacks（幽灵漏洞攻击）。

假如你不打算别人嵌入你的网站，那就带一个安全头 `X-Frame-Options: DENY`，它的`<frame>`、`<iframe>`、`<embed>`和 `<object>` 就对你失效了。

## HTTP Strict Transport Security (HSTS)

HSTS 这个头也很容易理解：强制使用 HTTPS 传输。HTTP 是不加密的连接，容易被网络窃听者截取，开启`Strict-Transport-Security` 头后，浏览器将不再加载 HTTP 相关的资源的，取而代之的是 HTTPS 资源。

```bash
Strict-Transport-Security: max-age=31536000
```

## Cross-Origin（跨域）

还有一些常见的安全机制与跨域相关，我们快速过一下：

- Cross-Origin Resource Policy (CORP)

  浏览器的默认机制是同源策略，即不能加载跨域资源。但是，有些情况下我们想改变这种默认机制，这时就可以启用 CORP 了。CORP 只接受三个值：`same-origin`、`same-site` 和 `cross-origin`，顾名思义同源（默认）、同站点，以及接受跨域资源三种策略。

  ```bash
  Cross-Origin-Resource-Policy: same-origin
  ```

- Cross-Origin Resource Sharing (CORS)

  上面提到浏览器同源策略，开启同源后，我们可以通过添加白名单的形式应对一些特殊站点，这就是著名的 CORS 了。你只要把信任的网站加到安全头上，指定的跨域资源就允许加载了：

  ```bash
  Access-Control-Allow-Origin: https://example.com
  Access-Control-Allow-Credentials: true
  ```

- Cross-Origin Embedder Policy (COEP)

  COEP（跨源嵌入程序政策）通常与 CORP 和 CORS 结合使用，让嵌入你站点的资源（script 或 worker）也只能加载在 CORP 或是 CORS 配置后的跨域资源。启用方式如下：

  ```bash
  Cross-Origin-Embedder-Policy: require-corp
  ```

  COEP 的好处是开启跨域隔离，你可以通过 `if( self.crossOriginIsolated ) {...}` 来判断。隔离成功后，就可以使用浏览器默认禁止了的 `SharedArrayBuffer`、`performance.measureUserAgentSpecificMemory()`等一些 JS Self-Profiling API 了。

- Cross-Origin Opener Policy (COOP)

  COOP 主要应对的是用户隐私策略，一些网站通过 `window.open()` 或是 `target="_blank"` 的形式在浏览器新标签内打开其他网站；但是这种操作会被对方网站获取到溯源信息，造成用户隐私泄露或发起其他有害攻击。为了避免这种意外，我们通产会价格 COOP 头，防止用户隐私泄露：

  ```bash
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  ```

## 小结

本文列出了一些保护站点安全的 HTTP 标头。大家回去后也可以自我审查一下项目里有没有使用到这些头；如果没有的话，要尽快开启。这些都是久经考验的策略，开启后百利无一弊的。

[0]: ../073.%20Secure%20JS
