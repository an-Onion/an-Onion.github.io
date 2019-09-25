这段时间出于大产品集成，我们尝试实现了系统认证从 jwt 到 SAML 的改造，以完成跨域免密登陆的功能。组里的小朋友单枪匹马完成了新功能，这里还是要夸赞一番的。今天借此机会谈谈 SAML2.0 的原理，并简单介绍一下单点登陆。

## Token

首先我们从 Token 讲起。Token 一般翻译成令牌或是凭证，指**访问资源时用的凭据**。现代应用一般都是秉承前后端分离的原则，当前端向后端请求 API 时，需要有一个 token 来证明其合法性。这个 token 一般是通过用户名/密码获取的；Token 既可以是后端赋予的，也可以来自后端信任的第三方服务器。这里提到的 SAML 就是所谓的由三方服务提供得到的凭据。

此外，携带 token 的方式也不一而足，可以通过 HTTP Header，或是 URL 参数，或是其他自定义的映射方式。通常 token 是有期限，过期了需要再次请求 token，最常见的方式自然是重新登录；当然也有些设计会将 token 更细分为**access token**和**refresh token**，**access token**用于资源请求，**refresh token**用于更新**access token**。这个不是本期的重点，就一笔带过了。

## SSO（Single sign-on）

介绍完 Token 知识，再说说单点登陆。通常公里内部会有非常多的工具平台供大家使用，比如邮箱、考勤、公告栏、日程等等。一般来说这些平台都是独立设计实现的，系统设计千差万别，但用户系统基本都是必备的。不过假如每个系统都独自实现一套具有登陆认证的用户体系，使用起来必然很不方便。所以比较现实的设计就是共用一套用户体系，只要用户在这一处登陆后就可以访问所有资源。这就是所谓的**单点登陆（SSO）**。

SSO 是所有这套用户共用系统的统称，具体设计现在比较常见的有：SAML2.0、OAuth2.0。优劣我不在这里比较了，反正我厂选择的正是 SAML2.0。

## SAML（Security Assertion Markup Language）

进入主题前，再提两个 SSO 的概念：

* IDP （Identity Provider）

    也有称作**Authorization Server**的，顾名思义，提供认证的服务器

* SP（Service Provider）

    也有的地方叫**Resource Server**——资源服务器。

SAML 翻译过来叫做**安全断言标记语言**，用来在安全域中交换身份，验证数据和授权数据；通俗来说，就是通过 Token 在 SP 和 IDP 之间传递用户信息和访问权限。下面是 SAML 的具体流程图，大家可以在图里体会一下 IDP 和 SP，这里*sp.com*是资源网站，*sso.com*是认证网站：

![SAML workflow][2]

具体细节各个公司在实现上会有细微的差别，但基本流程大致是相同的：

1. 浏览器（*sp.com*）发起首次资源请求

2. SP 根据请求来源，向 IDP 获取 SAML 的*descriptor*，这里会包含 credentials, loginURL 等等信息（注：这一步也可以省略，信息通常已存储在 SP 中）

3. SP 随后将 Browser 重定向到登录页面（*sso.com*），同时会携带一些表单信息，其中包括 SP 自身地址

4. 用户输入 ID/密码，并将表单发送给 IDP

5. IDP 验证成功后，再将浏览器重定向回*sp.com*，这里还会携带一个包含用户信息的 SAML Token（一个非常巨大的 XML）

6. 接着浏览器就会向 SP 发送`/assert`请求，将 SAML Token 送去后端验证

7. SP 就根据步骤 2 中拿到的*descriptor*，验证这次 token 合法性，并从中解密出用户信息以及过期时间。验证成功后，SP 再将资源返给浏览器，通常就是重定向到首页；这里稍微提一下，这次*重定向*一般会有如下几种方案：

    * HTTP Redirect：通常你会失败的。SAML Token 太过巨大，URL 长度有限，Chrome 或许还能做到，IE 就算了。

    * 返回 SP 自定义 token，将 SAML 放入 session

    * 再请求：就是在返回首页后再通过 JS 向后端发送一个 POST 请求获取 SAML token，再将它存入 localStorage

之后浏览器每次请求都会带上 token，一般就放在 headers.authorization 里；直到 token 过期，再循环上述步骤即可。

## SAML 缺陷

SAML 是很成熟的单点登录方案，但是**成熟**有时候也可以说成**陈旧**。

### NodeJS

我这里不是说 Node 不能用 SAML；而是说，主流的 saml 库太老了，多年不再维护，语法还处在 callback 回调地狱那个年代。我们刚开始还被 callback 恶心了许久，后来是自己封装[promisify][1]才兼容目前的`async-awit`语法的。

### SPA

现代很多 web app 都是前端渲染的 SPA 应用，我们自己的项目就是一个 Vuejs 的 SPA，但在 google 里几乎找不到靠谱的 vue+saml 的解决方案。

* SAML 设计的年代还是以**后端渲染**为主，各种后端重定向前端页面。但如今 spa 设计——也就是所谓的**前端渲染**，基本就是前后分离，主要由前端实现路由跳转。SAML 的后端 HTTP Redirect 会有跨域限制。

* 上面还提到过，SAML 本身过于巨大，不可能以 URL 的形式传递到前端。一般都是实现一套 session 机制，自行管理 token 过期时间；session 设计需要持久化，比简单的 cookie 验证要复杂得多。即便强行实现 api 附带 SAML token，每次请求还是无端增加了许许多多的负载。


### 手机 APP

如果 SAML 还需要支持手机 APP 单点登录，事情可能会更曲折。以 ISO 为例，SSO 还需要增加几个步骤，一般的设计有这么几种：

* 当手机应用需要 IDP 认证时，先跳到 Safari，完成登陆后再通过 HTTP POST 形式将 token 返回至 APP

* APP 内嵌`Webview`，通过`Webview`登陆并获取 token

* APP 自身提供 login 界面，但登陆认证的全过程实际上是由代理服务器完成的

无论如何，SAML2.0 毕竟是 2005 年的产物；十多年过去了，SAML 已不再适用于当今的许多跨平台场景了。

## 小结

虽然最后 diss 了一下 SAML，但 SAML 依旧是比较经典的系统设计课题，能体会一番还是挺有收获的。当然，大家更应该将 SAML 和现在比较常见的 Auth2.0，Open ID，JWT 等等技术一齐比较，这样才能在合适的时机选择合适的技术。

[1]: https://www.jianshu.com/p/b3092ef11321
[2]: ./img/saml.jpg
