# 如何存储 JWT

JWT （Json Web Token）是我们常用到的鉴权手段：它定义了一种非常轻巧的规范，作为 JSON 对象在各方之间安全地传输信息。但是，大家在开发实践中是如何在存储 JWT 的呢？今天，我们就从 web 安全的角度分析一下，那种存储方式最可靠。

## LocalStorage

存储 token 最朴素的策略就是放在 LocalStorage 里了：

```javascript
localStorage.setItem("token", jwt);
```

LocalStorage 对所有 JS 脚本可达；发送 API 时，从中取出 JWT 放到 header 里，即完成了最简单的鉴权工作。

```javascript
const jwt = localStorage.getItem("token");

axios.post(
  url,
  {
    /*...data */
  },
  {
    headers: {
      Authorization: `Basic ${jwt}`,
    },
  }
);
```

这种策略优点很明确——易用性很高：

- LocalStorage 一般有 4~5M 的存储大小，JWT 搓搓有余
- 纯 JS 即可调用
- 跨域友好

相反，简单的东西缺点也很明显：JS 可以直接调用，等价于易受 XSS 攻击。React、Vue、jQuery 可以访问你的 localStorage；跨站点脚本也可以轻易地从 localStorage 中获取到 token 信息。除非你禁掉所有三方库，不然 XSS 无法避免。

## httpOnly Cookie

JS 可调意味着不安全，那有什么方式让 JS 访问不到呢？Cookie 就能办到！它有个标识叫 `httpOnly`，带上这个标识就意味着不再向客户端脚本暴露 cookie 了，也即 JS 不可达了。

```bash
Set-Cookie: name=Value; HttpOnly
```

前后端交互时，http 请求会自动带上 cookie，后端可以从 cookie 中提取去 JWT，并鉴权。这也省去了前端额外的 header 操作。

但是 cookie 自身的问题又变成了这个方案的缺点：

- cookie 大小一般只有 4K 左右，一个巨大的 JWT 会直接撑爆 cookie
- 在给跨域资源发送请求时，你的 JWT 又无法使用了

除此之外，虽然 Cookie 对 XSS 不大友好，但是对 CSRF（跨站请求伪造）防范能力较弱。比如，你登陆了某银行网站——`bank.com`，又不小心访问了一个恶意网站；该恶意网站有个表单会发送有害数据到你的银行网站。这时候，发送的恶意请求会携带正确的 cookie，并通过鉴权；后果就不堪设想了。

```html
<form action="bank.com/maliciousTransfer" method="POST">...</form>
```

所以，仅仅用 httpOnly 的 Cookie 还是不够；大家还需要使用其他组合策略：如表单内添加随机 token，或是启用浏览器的 SameSite 属性等等。

## 内存

有没有更安全的方法呢？把 JWT 放在客户端内存里！该方法通俗来说就是将 JWT 赋值给 JS 全局变量，或是 vuex、redux 里的某些属性。

- 只要起一个黑客想不到的变量名，你的 JWT 就不能被跨站点脚本轻易获取了
- 不会随着 cookie 隐藏在三方网站的请求里

但是，这个方案有个致命的缺陷：刷新页面后，JWT 会消失。这意味着客户每次点击刷新后就会跳到登录页面，用户体验极差！

## Auth 2.0

有什么方案改进“内存策略”呢？我们可以借鉴一下 Auth 2.0 的一些思想——`access token` + `refresh token` 的策略。

- 把 JWT 视为 access token 放在内存里，发送 api 时放到 header 的 Authorization 里
- 再为 JWT 配备一个 refresh token，并放在 httpOnly 的 Cookie 里；当 JWT 过期或消失时，通过 refresh token 重新获取 JWT

access token 和 refresh token 的组合既保证了 JWT 的安全，又避免了刷新后需要重新登录的囧镜。如下图所示，我们简单梳理一下整个过程：

1. 未登录状态时，向服务器发送请求
2. 页面被重定向到 Auth 服务上
3. 用户登录
4. 服务器返回 refresh token 和 access token，分别置于 http cookie 和 body 内
5. 用户回到资源服务器
6. 并获取相关资源信息
7. 客户端程序将 access token 放入内存中
8. 刷新页面
9. 发现 access token 消失，遂再次向 Auth 服务发起 access token 更新请求（refresh token 起作用了）
10. 返回新的 access token
11. 再次向服务器发出资源请求
12. 重新显示页面

![Auth 2.0][1]

该方法看似复杂，但是 Auth 供应商基本都提供了相应的 SDK；现实实现中其实代码量不大。

## 小结

本文介绍了存储 JWT 的一些安全策略。大家可以发现，很多策略都是相通的，合理的排列组合就能构造出最优的方案。我们平日里需要不断地增加知识的广度；因为在老破旧的知识体系内徘徊，你永远得不到成长。

[1]: ./img/auth2.drawio.png
