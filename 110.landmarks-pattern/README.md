# Landmarks Pattern 详解：页面地标区域的无障碍实现

Landmarks（地标）是一组用于标识页面主要区域的 ARIA 角色。本文基于 [W3C WAI-ARIA Landmarks Pattern][0] 及 [Landmark Regions Practice][1]，详解 8 种地标角色、HTML 原生元素映射与最佳实践。

## 一、Landmarks 的定义与核心概念

### 1.1 什么是 Landmarks

Landmarks 是 **8 个 ARIA 角色**的集合，用于标识页面的主要结构区域。每个地标角色让辅助技术用户感知到一段高级页面结构的起始和结束——这种结构在视觉上通常通过布局位置、间距、颜色或边框来传达。

例如，[`main`][2] 地标标识页面主要内容区域，[`navigation`][3] 地标标识导航链接区域。

Landmarks 的核心价值：

- **结构感知**：将视觉布局转化为程序化语义
- **键盘跳转**：屏幕阅读器提供在地标之间快速跳转的快捷键
- **跳转目标**：可作为“跳过导航”链接的目标
- **浏览器扩展**：浏览器扩展可利用地标增强键盘导航

### 1.2 核心术语

| 术语          | 说明                                       |
| ------------- | ------------------------------------------ |
| **Landmark**  | 标识页面主要区域的 ARIA 角色               |
| **Top-level** | 顶层地标，不应嵌套在其他地标内             |
| **Label**     | 地标的可访问名称，同角色多次出现时必须唯一 |

```plain
┌─────────────────────────────────────────────────────────────┐
│  banner                                                     │
│    Logo | Site Search | Login                               │
├─────────────────────────────────────────────────────────────┤
│  navigation (Site)            complementary (Related)       │
│    Home            |            Recent Posts                │
│    Blog            |            Tags                        │
│    About           |            Archive                     │
│    Contact         |                                        │
├─────────────────────────────────────────────────────────────┤
│  main                                                       │
│    Article Title                                            │
│    Article content...                                       │
│                                                             │
│    search (Site Search)                                     │
│    [ Search... ]  [ Go ]                                    │
├─────────────────────────────────────────────────────────────┤
│  contentinfo                                                │
│    Copyright | Privacy | Accessibility Statement            │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 八种地标角色概览

| 角色                 | HTML 元素 | 说明                         | 顶层 |
| -------------------- | --------- | ---------------------------- | ---- |
| [`banner`][4]        | `header`  | 站点级头部（Logo、搜索）     | 是   |
| [`main`][2]          | `main`    | 页面主内容                   | 是   |
| [`navigation`][3]    | `nav`     | 导航链接组                   | -    |
| [`search`][5]        | `search`  | 搜索功能区域                 | -    |
| [`complementary`][6] | `aside`   | 补充内容（侧边栏）           | 是   |
| [`form`][7]          | `form`    | 表单区域（非搜索、非主内容） | -    |
| [`region`][8]        | `section` | 可命名的独立内容区域         | -    |
| [`contentinfo`][9]   | `footer`  | 站点级页脚（版权、声明）     | 是   |

### 1.4 HTML 元素 vs ARIA 角色

许多 HTML 元素**自动创建**地标区域，无需额外添加 ARIA 角色：

| HTML 元素                      | 隐含地标角色    |
| ------------------------------ | --------------- |
| `header`（上下文为 `body` 时） | `banner`        |
| `footer`（上下文为 `body` 时） | `contentinfo`   |
| `main`                         | `main`          |
| `nav`                          | `navigation`    |
| `aside`                        | `complementary` |
| `search`                       | `search`        |
| `form`（有可访问名称时）       | `form`          |
| `section`（有可访问名称时）    | `region`        |

**推荐**：优先使用 HTML 原生元素，只有在元素无法使用或需要覆盖隐含角色时才添加 ARIA `role` 属性。

### 1.5 典型应用场景

- **博客页面**：`banner`（头部导航）+ `main`（正文）+ `complementary`（侧边栏）+ `contentinfo`（页脚）
- **搜索页面**：`search`（搜索框）+ `main`（搜索结果）+ `navigation`（分页）
- **仪表盘**：`main`（主面板）+ 多个 `region`（图表区域）+ `navigation`（侧边菜单）
- **文档站**：`banner`（站点头部）+ `navigation`（目录）+ `main`（文档内容）+ `complementary`（相关链接）

## 二、八种地标角色详解

### 2.1 Banner

标识站点级头部内容，通常包含 Logo、站点标识和站点搜索。

- 每个页面最多一个 `banner` 地标
- 应为顶层地标
- HTML `header` 元素在 `body` 上下文中自动创建 `banner`

> **注意**：`header` 作为 `article`、`aside`、`main`、`nav`、`section` 的子元素时，**不会**创建 `banner` 地标。

### 2.2 Main

标识页面的主要内容区域。

- 每个页面应有一个 `main` 地标
- 应为顶层地标
- HTML `main` 元素自动创建 `main` 地标

### 2.3 Navigation

标识导航链接组，用于站点或页面内容导航。

- 如果页面有多个 `navigation` 地标，每个必须提供唯一标签
- 如果两个 `navigation` 包含相同的链接集，应使用相同的标签
- HTML `nav` 元素自动创建 `navigation` 地标

### 2.4 Search

标识搜索功能区域。

- 当表单用于搜索功能时，应使用 `search` 而非 `form` 地标
- HTML `search` 元素自动创建 `search` 地标（较新的 HTML 元素）

### 2.5 Complementary

标识补充内容区域，设计为与主内容互补，但脱离主内容后仍有意义。

- 应为顶层地标
- 如果补充内容与主内容不相关，应使用更通用的 `region` 角色
- HTML `aside` 元素自动创建 `complementary` 地标

### 2.6 Form

标识表单区域，当没有其他命名的地标（如 `main` 或 `search`）更合适时使用。

- `form` 地标应有标签以帮助用户理解表单用途
- 标签应对所有用户可见（如 `h1`-`h6` 标题元素）
- HTML `form` 元素有可访问名称时自动创建 `form` 地标

> **注意**：不要用 `role="form"` 标识每个表单字段，它标识的是整个表单区域。

### 2.7 Region

标识包含重要内容的可感知区域，用户需要能够导航到该区域。

- `region` 地标**必须有标签**
- 可用于标识其他命名地标无法恰当描述的内容
- HTML `section` 元素有可访问名称时自动创建 `region` 地标

### 2.8 Contentinfo

标识站点级页脚信息，通常包含版权、隐私声明和无障碍声明链接。

- 每个页面最多一个 `contentinfo` 地标
- 应为顶层地标
- HTML `footer` 元素在 `body` 上下文中自动创建 `contentinfo`

> **注意**：`footer` 作为 `article`、`aside`、`main`、`nav`、`section` 的子元素时，**不会**创建 `contentinfo` 地标。

## 三、设计原则

### 3.1 第一步：识别逻辑结构

将页面拆分为可感知的内容区域——设计师通常通过对齐和间距来视觉化表达这些区域。区域可进一步拆分为逻辑子区域。

### 3.2 第二步：分配地标角色

根据每个区域的内容类型分配地标角色：

- `banner`、`main`、`complementary`、`contentinfo` 应为顶层地标
- 地标角色可以嵌套以表达父子关系
- 模态对话框内容**不需要**包裹在地标区域内——模态打开时地标无法提供额外价值，模态本身已提供名称和边界

### 3.3 第三步：为区域命名

- 如果同一地标角色在页面上出现多次，每个实例必须提供**唯一标签**
- 唯一的例外：多个实例的内容和用途完全相同（如表格上下两套相同的分页控件）
- 如果区域以标题元素开头，用 [`aria-labelledby`][10] 引用该标题作为标签
- 如果区域需要标签但没有标题，用 [`aria-label`][11] 提供
- **不要在标签中包含角色名**——`navigation` 地标标为“Site Navigation”会被读成“Site Navigation Navigation”，应简化为“Site”

## 四、实现方式

### 4.1 HTML 原生元素方式（推荐）

```html
<body>
  <header>
    <h1>My Site</h1>
    <search>
      <label for="q">Search</label>
      <input
        id="q"
        type="search" />
      <button>Go</button>
    </search>
  </header>

  <nav aria-label="Main">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/blog">Blog</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>

  <main>
    <article>
      <h2>Article Title</h2>
      <p>Article content...</p>
    </article>

    <aside aria-labelledby="related-heading">
      <h2 id="related-heading">Related Links</h2>
      <ul>
        <li><a href="/post/1">Previous Post</a></li>
        <li><a href="/post/2">Next Post</a></li>
      </ul>
    </aside>
  </main>

  <footer>
    <p>&copy; 2026 My Site. <a href="/privacy">Privacy</a></p>
  </footer>
</body>
```

### 4.2 ARIA 角色方式

当无法使用 HTML 原生元素时，用 `role` 属性覆盖：

```html
<div role="banner">
  <h1>My Site</h1>
</div>

<div
  role="navigation"
  aria-label="Main">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</div>

<div role="main">
  <article>...</article>
</div>

<div role="contentinfo">
  <p>&copy; 2026 My Site.</p>
</div>
```

### 4.3 命名方式

```html
<!-- 方式一：aria-labelledby 引用可见标题（推荐） -->
<nav aria-labelledby="main-nav-heading">
  <h2 id="main-nav-heading">Main Navigation</h2>
  <ul>
    ...
  </ul>
</nav>

<!-- 方式二：aria-label 提供不可见标签 -->
<nav aria-label="Footer">
  <ul>
    ...
  </ul>
</nav>

<!-- ❌ 错误：标签包含角色名 -->
<nav aria-label="Footer Navigation">
  <!-- 会被读成 "Footer Navigation Navigation" -->
</nav>
```

### 4.4 多实例命名

```html
<!-- 多个 navigation 必须唯一命名 -->
<nav aria-label="Main">
  <ul>
    ...
  </ul>
</nav>

<nav aria-label="Footer">
  <ul>
    ...
  </ul>
</nav>

<nav aria-label="Breadcrumbs">
  <ol>
    ...
  </ol>
</nav>
```

## 五、最佳实践与常见错误

### 5.1 所有内容必须在地标内

```html
<!-- ❌ 错误：内容游离在地标之外 -->
<body>
  <main>
    <p>主内容...</p>
  </main>
  <div>
    <p>这段内容不在任何地标内</p>
  </div>
</body>

<!-- ✅ 正确：所有内容包裹在地标内 -->
<body>
  <main>
    <p>主内容...</p>
    <section aria-labelledby="extra-heading">
      <h2 id="extra-heading">补充内容</h2>
      <p>这段内容在 region 地标内</p>
    </section>
  </main>
</body>
```

### 5.2 地标数量不超过 7 个

地标的价值随着数量增长而递减。经验法则：每页 **7 个或更少**的地标区域。如果超过，考虑用 `region` 合并相关内容，或重新评估页面结构。

### 5.3 重复角色未命名

```html
<!-- ❌ 错误：两个 navigation 无标签，屏幕阅读器无法区分 -->
<nav>
  <ul>
    ...
  </ul>
</nav>
<nav>
  <ul>
    ...
  </ul>
</nav>

<!-- ✅ 正确：每个 navigation 有唯一标签 -->
<nav aria-label="Main">
  <ul>
    ...
  </ul>
</nav>
<nav aria-label="Breadcrumbs">
  <ol>
    ...
  </ol>
</nav>
```

### 5.4 标签包含角色名

```html
<!-- ❌ 错误：标签含角色名 -->
<nav aria-label="Site Navigation">
  <!-- 读成 "Site Navigation Navigation" -->
</nav>
<aside aria-label="Complementary Section">
  <!-- 读成 "Complementary Section Complementary" -->
</aside>

<!-- ✅ 正确：标签不含角色名 -->
<nav aria-label="Site">
  <!-- 读成 "Site Navigation" -->
</nav>
<aside aria-label="Related Posts">
  <!-- 读成 "Related Posts Complementary" -->
</aside>
```

### 5.5 header/footer 上下文问题

```html
<!-- header/footer 在 body 直接子元素时创建地标 -->
<body>
  <header><!-- banner 地标 --></header>
  <main><!-- main 地标 --></main>
  <footer><!-- contentinfo 地标 --></footer>
</body>

<!-- ❌ header/footer 嵌套在 article/section 内时不创建地标 -->
<article>
  <header><!-- 不是 banner 地标，只是语义化标签 --></header>
</article>
```

### 5.6 模态对话框不需要包裹地标

```html
<!-- ❌ 不必要：模态内容包裹在 region 内 -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dlg-title">
  <div
    role="region"
    aria-label="Dialog Content">
    <h2 id="dlg-title">Confirm</h2>
    <p>Are you sure?</p>
  </div>
</div>

<!-- ✅ 正确：模态本身就是容器，提供名称和边界 -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dlg-title">
  <h2 id="dlg-title">Confirm</h2>
  <p>Are you sure?</p>
</div>
```

### 5.7 form vs search 混用

```html
<!-- ❌ 错误：搜索表单用 form 地标 -->
<form
  role="form"
  aria-label="Search">
  <input type="search" />
  <button>Search</button>
</form>

<!-- ✅ 正确：搜索表单用 search 地标 -->
<search>
  <input type="search" />
  <button>Search</button>
</search>

<!-- ✅ 正确：非搜索表单用 form 地标 -->
<form aria-labelledby="contact-heading">
  <h2 id="contact-heading">Contact Us</h2>
  <!-- 表单字段 -->
</form>
```

## 六、Agentic 时代 Landmarks 的定位

> “无招胜有招。” —— 金庸《笑傲江湖》

风清扬向令狐冲传授独孤九剑时，点破的正是这五个字。Landmarks 也正如此理——没有复杂的键盘交互、没有状态管理，只有 8 个角色和几条规则。但它的价值在 Agentic 时代反而会提升：

1. **AI 生成 UI 需要结构化语义**——当 LLM 生成页面时，正确使用地标角色能确保生成的 UI 对所有用户可访问
2. **自动化测试的地标验证**——无障碍审计工具（如 axe-core）以地标作为页面结构完整性的基础检查项
3. **AI Agent 的页面导航**——浏览器自动化 Agent 可利用地标快速定位内容区域，而非依赖 CSS 选择器

越是花哨复杂的技术（CSS 选择器、视觉定位）越容易随样式重构而失效；Landmarks 这种返璞归真的结构化语义，反而是 AI Agent 与自动化工具最可靠的“锚点”。它不需要任何 JavaScript，是**成本最低、收益最高**的无障碍实践——只需用正确的 HTML 元素，就能让整个页面对辅助技术开放。

## 七、总结

构建无障碍的 Landmarks 需要关注：

1. **优先原生 HTML**：`header`、`main`、`nav`、`aside`、`search`、`footer`、`form`、`section` 自动创建地标。
2. **全量覆盖**：所有页面内容必须包裹在某个地标内，不遗漏任何可感知内容。
3. **控制在 7 个以内**：地标价值随数量递减，超过 7 个考虑合并或重构。
4. **唯一命名**：同角色多实例时必须提供唯一标签，优先用 `aria-labelledby` 引用可见标题。
5. **标签不含角色名**：`aria-label="Site"` 而非 `aria-label="Site Navigation"`。
6. **顶层原则**：`banner`、`main`、`complementary`、`contentinfo` 应为顶层地标，不嵌套在其他地标内。
7. **模态例外**：模态对话框内容不需要包裹地标，模态本身已提供容器语义。

遵循 [W3C Landmarks Pattern][0] 规范，用最小的成本实现最大的无障碍收益。

文章同步于 an-Onion 的 [Github][12]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
[1]: https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
[2]: https://www.w3.org/TR/wai-aria-1.2/#main
[3]: https://www.w3.org/TR/wai-aria-1.2/#navigation
[4]: https://www.w3.org/TR/wai-aria-1.2/#banner
[5]: https://www.w3.org/TR/wai-aria-1.2/#search
[6]: https://www.w3.org/TR/wai-aria-1.2/#complementary
[7]: https://www.w3.org/TR/wai-aria-1.2/#form
[8]: https://www.w3.org/TR/wai-aria-1.2/#region
[9]: https://www.w3.org/TR/wai-aria-1.2/#contentinfo
[10]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[11]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
[12]: https://github.com/an-Onion/an-Onion.github.io
