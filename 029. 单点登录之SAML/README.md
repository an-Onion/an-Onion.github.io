这段时间出于大产品集成，我们尝试实现了系统认证从jwt到SAML的改造，以完成跨域免密登陆的功能。组里的小朋友单枪匹马完成了新功能，这里还是要夸赞一番的。今天借此机会谈谈SAML2.0的原理，并简单介绍一下单点登陆。

## Token

首先我们从Token讲起。Token一般翻译成令牌或是凭证，指**访问资源时用的凭据**。现代应用一般都是秉承前后端分离的原则，当前端向后端请求API时，需要有一个token来证明其合法性。这个token一般是通过用户名/密码获取的；Token既可以是后端赋予的，也可以来自后端信任的第三方服务器。这里提到的SAML就是所谓的由三方服务提供得到的凭据。

此外，携带token的方式也不一而足，可以通过HTTP Header，或是URL参数，或是其他自定义的映射方式。通常token是有期限，过期了需要再次请求token，最常见的方式自然是重新登录；当然也有些设计会将token更细分为**access token**和**refresh token**，**access token**用于资源请求，**refresh token**用于更新**access token**。这个不是本期的重点，就一笔带过了。

## SSO（Single sign-on）

介绍完Token知识，再说说单点登陆。通常公里内部会有非常多的工具平台供大家使用，比如邮箱、考勤、公告栏、日程等等。一般来说这些平台都是独立设计实现的，系统设计千差万别，但用户系统基本都是必备的。不过假如每个系统都独自实现一套具有登陆认证的用户体系，使用起来必然很不方便。所以比较现实的设计就是共用一套用户体系，只要用户在这一处登陆后就可以访问所有资源。这就是所谓的**单点登陆（SSO）**。

SSO是所有这套用户共用系统的统称，具体设计现在比较常见的有：SAML2.0、OAuth2.0。优劣我不在这里比较了，反正我厂选择的正是SAML2.0。

## SAML（Security Assertion Markup Language）

进入主题前，再提两个SSO的概念：

* IDP （Identity Provider）

    也有称作**Authorization Server**的，顾名思义，提供认证的服务器

* SP（Service Provider）

    也有的地方叫**Resource Server**——资源服务器。

SAML翻译过来叫做**安全断言标记语言**，用来在安全域中交换身份，验证数据和授权数据；通俗来说，就是通过Token在SP和IDP之间传递用户信息和访问权限。下面是SAML的具体流程图，大家可以在图里体会一下IDP和SP，这里*sp.com*是资源网站，*sso.com*是认证网站：

![SAML workflow][2]

具体细节各个公司在实现上会有细微的差别，但基本流程大致是相同的：

1. 浏览器（*sp.com*）发起首次资源请求

2. SP根据请求来源，向IDP获取SAML的*descriptor*，这里会包含credentials, loginURL等等信息（注：这一步也可以省略，信息通常已存储在SP中）

3. SP随后将Browser重定向到登录页面（*sso.com*），同时会携带一些表单信息，其中包括SP自身地址

4. 用户输入ID/密码，并将表单发送给IDP

5. IDP验证成功后，再将浏览器重定向回*sp.com*，这里还会携带一个包含用户信息的SAML Token（一个非常巨大的XML）

6. 接着浏览器就会向SP发送`/assert`请求，将SAML Token送去后端验证

7. SP就根据步骤2中拿到的*descriptor*，验证这次token合法性，并从中解密出用户信息以及过期时间。验证成功后，SP再将资源返给浏览器，通常就是重定向到首页；这里稍微提一下，这次*重定向*一般会有如下几种方案：

    * HTTP Redirect：通常你会失败的。SAML Token太过巨大，URL长度有限，Chrome或许还能做到，IE就算了。

    * 返回SP自定义token，将SAML放入session

    * 再请求：就是在返回首页后再通过JS向后端发送一个POST请求获取SAML token，再将它存入localStorage

之后浏览器每次请求都会带上token，一般就放在headers.authorization里；直到token过期，再循环上述步骤即可。

## SAML缺陷

SAML是很成熟的单点登录方案，但是**成熟**有时候也可以说成**陈旧**。

### NodeJS

我这里不是说Node不能用SAML；而是说，主流的saml库太老了，多年不再维护，语法还处在callback回调地狱那个年代。我们刚开始还被callback恶心了许久，后来是自己封装[promisify][1]才兼容目前的`async-awit`语法的。

### SPA

现代很多web app都是前端渲染的SPA应用，我们自己的项目就是一个Vuejs的SPA，但在google里几乎找不到靠谱的vue+saml的解决方案。

* SAML设计的年代还是以**后端渲染**为主，各种后端重定向前端页面。但如今spa设计——也就是所谓的**前端渲染**，基本就是前后分离，主要由前端实现路由跳转。SAML的后端HTTP Redirect会有跨域限制。

* 上面还提到过，SAML本身过于巨大，不可能以URL的形式传递到前端。一般都是实现一套session机制，自行管理token过期时间；session设计需要持久化，比简单的cookie验证要复杂得多。即便强行实现api附带SAML token，每次请求还是无端增加了许许多多的负载。


### 手机APP

如果SAML还需要支持手机APP单点登录，事情可能会更曲折。以ISO为例，SSO还需要增加几个步骤，一般的设计有这么几种：

* 当手机应用需要IDP认证时，先跳到Safari，完成登陆后再通过HTTP POST形式将token返回至APP

* APP内嵌`Webview`，通过`Webview`登陆并获取token

* APP自身提供login界面，但登陆认证的全过程实际上是由代理服务器完成的

无论如何，SAML2.0毕竟是2005年的产物；十多年过去了，SAML已不再适用于当今的许多跨平台场景了。

## 小结

虽然最后diss了一下SAML，但SAML依旧是比较经典的系统设计课题，能体会一番还是挺有收获的。当然，大家更应该将SAML和现在比较常见的Auth2.0，Open ID，JWT等等技术一齐比较，这样才能在合适的时机选择合适的技术。

[1]: https://www.jianshu.com/p/b3092ef11321
[2]: ./img/saml.jpg
