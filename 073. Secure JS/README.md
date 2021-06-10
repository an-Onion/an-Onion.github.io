# JS 安全策略 101

这期介绍一些 JS 技术栈中常用到的安全策略；由于本文是 101 文章，所以内容不难，都是老生常谈的策略，没听说过的朋友们得加把劲了。

## 依赖审计

依赖审计其实就是利用 npm 或是 yarn 自带的一个 audit 命令检测 node_module 里存在的一些具有安全隐患的依赖项。我习惯用`yarn audit`, 所以给大家放了张自己博客的 yarn 审计结果。这里显示：一个叫 trim 的包太老了，有很高的安全风险。

![yarn audit][0]

有风险的依赖应该尽快解决。有些开发人员会因为“客户环境一年才更新一次，所以不心急”这种 naive 的理由忽视安全审计，这是违背开发常识的行为——依赖问题一旦堆积将很难修复。

跳回正题，生产环境中我们不大可能频繁使用手工 audit 的方式，通常的做法是：在 CI 中加入`yarn audit` 这一步；如果识别到漏洞，立马告警——发消息到工作群里，并更新相关依赖项。

如果大家使用 github 开发的话，它提供了一个叫 Dependabot 的机器人，：该机器人会帮你自动检测依赖并报告风险；一定设置后，它还能自动提交 PR 修复相关漏洞。

![dependabot][1]

## 启动次要版本和补丁更新

上文提到依靠 CI 来提醒我们更新依赖，这相对来说比较被动；很多三方库会频繁地通过升级次要版本或是打补丁的形式来快速修复一些安全隐患，`yarn audit` 很难及时追踪这类安全报告；我们最好在开发的阶段就主动跟进这类修复，及早规避一些没必要的风险。上面说得有玄乎了，实操上就是经常 `yarn upgrade` 一下。

这里科普一个小知识，依赖的版本规则：

| 状态                       | 开发阶段 | 规则                         | 示例  |
| -------------------------- | -------- | ---------------------------- | ----- |
| 首次发布                   | 新产品   | 从 1.0.0 开始                | 1.0.0 |
| 向后兼容的错误修复         | 补丁发布 | 增加第三位数字               | 1.0.1 |
| 向后兼容的新功能           | 次要版本 | 增加中间数字并将最后一位置零 | 1.1.0 |
| 不须要具备向后兼容性的更改 | 主要版本 | 增加第一位数字并将后两位置零 | 2.0.0 |

上表可知，主版本更新影响向后兼容，兹事体大，所以通常的升级策略是：只开启次要版本或是补丁更新，这样 `yarn upgrade` 时不会触碰到兼容问题。那如何指定依赖项的更新类型呢？在 package.json 依赖项的版本前加 `^` 或是 `~` 号就行了。例如，我们指定 `1.0.4` 版本可升级范围：

- 只升级补丁版本：`1.0` 或 `1.0.x` 或 `~1.0.4`
- 升级次要及补丁版本：`1` 或 `1.x` 或 `^1.0.4`
- 主版本可升级：`*` 或 `x`

例子：

```json
"dependencies": {
  "my_dep": "^1.0.4",
  "another_dep": "~2.2.0"
},
```

## Integrity & nonce 检测

关于 Integrity, 我在[《一文搞懂 script 标签》][2]提到过，就是利用一个 hash 值来校验加载的 JS 文件是否完整。如下标签中， integrity 作用就是告诉浏览器：在加载引 `react.production.min.js` 时，使用 sha256 算法计算该文件的摘要签名；之后将该签名与预设的 integrity 值作比较，如果不一致就不执行该资源。它的主要功能就是防止托管在 CDN 上的资源被篡改。

```html
<script
  src="https://unpkg.com/react@17/umd/react.production.min.js"
  integrity="sha384-7Er69WnAl0+tY5MWEvnQzWHeDFjgHSnlQfDDeWUvv8qlRXtzaF/pNo18Q2aoZNiO"
  crossorigin="anonymous"
></script>
```

同理，nonce 也是一个预设的值，与 http 头里的 CSP 做校验，防止那些被串改过的 script 标签执行脚本。

```html
<script nonce="nonce-EfNBf03nceIOAn39fn389h3sdfa" src="./hello.js"></script>
```

## Trusted Types

上面提到了 nonce 与 CSP；不得不说，CSP 是每一个前端开发必须熟知的知识点，我之前也写过 101 文章——[《Content Security Policy 101》][3]，大家有兴趣的话可以看一看。这里再补充一个现在主流浏览器都支持的新特性——Trusted Types。它事实上就是一条 CSP 规则：

```bash
Content-Security-Policy: require-trusted-types-for 'script'
```

主要功能是限制使用一些有风险的手段操作 Web API。比如，开启 Trusted Types 后，直接修改 html 的方式就会抛出异常：

```javascript
el.innerHTML = "<img src=x onerror=alert(1)>"; // This throws an exception.
```

而所谓受信任的操作手段就是：只允许浏览器厂商提供的 trustedTypes 相关的 API 来操作 Web 页面。如下案例中，通过使用 trustedTypes，让开发人员有意识地把 inner html 中的 tag 标签——`<` 和 `>`——替换为特殊符号（`&lt` 和 `&gt`）以防止 XSS 注入。

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

## 启用 strict 模式

我们再看 JS 本身的安全策略。现代 JS 开发基本都会强制开启严格模式——`use strict`。一则是 JS 有些语法设计得过于粗糙，不适合生产使用；二则严格模式下一些不安全的操作方法会在运行阶段抛出异常，比如：

- 修改 global 对象
- `this` 指向全局
- 使用 `eval` 这种存在注入危险的方法
- 使用转义字符
- 变量重名或删除变量

## 压缩和混淆

除此之外，前端页面还不可避免地会暴露 JS 文件，有些黑客会试图通过了解你的代码去发起攻击（虽然很多垃圾代码我们自己都看不懂）；因此使代码难以阅读可以有效地减少这类风险。通常的做法就是使用 webpack 这类构件工具压缩以及混淆源代码；压缩后的代码还能带来额外的好处——提升加载速度。当然，某些特别敏感的源代码最好还是使用后端渲染的技术，以避免直接暴露给客户端。

## lint 代码

常见的 lint 工具都提供了静态分析的功能；除了提供统一格式、提高代码质量这种基础功能外，它还能提醒开发人员一些易犯的错误。从某种意义上来说也能减少一些安全风险（个人觉得垃圾代码才是最大的风险）。开发阶段最常用的就是 eslint 了；到了 CI 阶段，还会用到 SonarCloud 这种工具，它绘制出一个报表，显示代码“臭味”以及一些可能的安全漏洞。

![SonarCloud][4]

## 小结

本文列举了几个前端开发中最最常见的网络安全措施。这些手段都比较基础，但是最基础的往往也是最有效的；毕竟这些措施经过多年验证，确实能防范绝大多数的安全漏洞。作为 101 文章，事实上也够了。当然，更深层次的“网络安全”技术就变成了一个非常专业的领域问题；知识点与我们通常的“网络开发”大相径庭；本文就不具体展开了，有兴趣的朋友可以自己深入了解一下，这也是一份非常抢手的工作。

[0]: ./img/audit.png
[1]: ./img/github-bot.png
[2]: ../060.%20script%20tag%20101
[3]: ../055.%20CSP%20101
[4]: ./img/SonarCloud.png
