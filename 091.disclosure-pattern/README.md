# Disclosure (Show/Hide) Pattern 详解：构建无障碍展开收起

展开收起（Disclosure）是一种常见的交互组件，也被称为 Collapse（折叠），允许内容在折叠（隐藏）和展开（可见）状态之间切换。本文基于 [W3C WAI-ARIA Disclosure Pattern][0] 规范，详解如何构建无障碍的展开收起组件。

## 一、Disclosure 的定义与核心功能

Disclosure（展开收起）是一种控件，允许内容在折叠（隐藏）和展开（可见）状态之间切换。它包含两个基本元素：控制展开收起的按钮和其控制可见性的内容区域。

当内容被隐藏时，按钮通常设计为带有右指箭头或三角形的按钮，暗示激活按钮将显示更多内容。当内容可见时，箭头或三角形通常向下指向。

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

[`role="button"`][2] 用于标识控制展开收起的按钮元素。

### 2.2 状态属性

[`aria-expanded`][3] 属性表示内容的展开状态：

- 当内容可见时，按钮的 `aria-expanded` 设置为 `true`
- 当内容隐藏时，按钮的 `aria-expanded` 设置为 `false`

### 2.3 控制关系

对于手动实现的 Disclosure（例如使用按钮），可选地使用 [`aria-controls`][4] 属性来引用包含所有展开/收起内容的元素：

```html
<button
  role="button"
  aria-expanded="false"
  aria-controls="disclosure-content">
  展开更多信息
</button>

<div
  id="disclosure-content"
  class="hidden">
  <p>这里是被控制的展开内容...</p>
</div>
```

## 三、键盘交互规范

当展开收起控件获得焦点时：

| 按键  | 功能                             |
| ----- | -------------------------------- |
| Enter | 激活展开收起控件，切换内容可见性 |
| Space | 激活展开收起控件，切换内容可见性 |

## 四、实现方式

### 4.1 原生 details/summary 元素

HTML5 的 `<details>` 和 `<summary>` 元素是推荐的实现方式，内置无障碍支持：

- **自动状态管理**：浏览器自动处理展开/收起状态
- **内置键盘支持**：自动支持 Enter 和 Space 键
- **语义化标签**：提供原生的无障碍语义

```html
<details>
  <summary>点击展开/收起</summary>
  <p>这里是展开的内容...</p>
</details>
```

**注意**：当使用原生 `<details>` 和 `<summary>` 元素时，不需要添加 `aria-controls` 或 `role="button"`，因为浏览器会自动处理这些属性和语义。

### 4.2 按钮 + ARIA 实现

使用按钮和 ARIA 属性的手动实现方式（当不能使用原生 `<details>` 元素时）：

```html
<button
  role="button"
  aria-expanded="false"
  aria-controls="faq-content"
  onclick="toggleDisclosure('faq-content', this)">
  常见问题解答
</button>

<div
  id="faq-content"
  class="disclosure-content hidden">
  <p>FAQ 内容...</p>
</div>
```

## 五、常见应用场景

### 5.1 图片描述展开 (Image Description)

用于显示图片的详细描述信息：

```html
<details>
  <summary>查看图片描述</summary>
  <img
    src="image.jpg"
    alt="图片描述" />
  <p>这是对图片的详细描述...</p>
</details>
```

### 5.2 FAQ 展开收起 (Answers to Frequently Asked Questions)

用于常见问题解答的逐条展开：

```html
<details>
  <summary>问题一：如何注册账户？</summary>
  <p>回答：点击注册按钮...</p>
</details>

<details>
  <summary>问题二：如何重置密码？</summary>
  <p>回答：点击忘记密码...</p>
</details>
```

### 5.3 导航菜单展开 (Navigation Menu)

用于移动端导航菜单的展开收起：

```html
<nav>
  <details>
    <summary>菜单</summary>
    <ul>
      <li><a href="#home">首页</a></li>
      <li><a href="#about">关于我们</a></li>
      <li><a href="#contact">联系我们</a></li>
    </ul>
  </details>
</nav>
```

### 5.4 带顶级链接的导航菜单 (Navigation Menu with Top-Level Links)

在导航菜单中同时包含展开子项和直接链接：

```html
<nav>
  <details>
    <summary>产品</summary>
    <ul>
      <li><a href="#product-a">产品 A</a></li>
      <li><a href="#product-b">产品 B</a></li>
    </ul>
  </details>
  <a href="#services">服务</a>
  <a href="#about">关于我们</a>
</nav>
```

### 5.5 展开卡片 (Disclosure Card)

将展开收起功能集成到卡片组件中：

```html
<details class="card">
  <summary class="card-header">
    <h3>项目信息</h3>
  </summary>
  <div class="card-content">
    <p>这里是项目的详细信息...</p>
    <ul>
      <li>开始日期：2023年1月1日</li>
      <li>结束日期：2023年12月31日</li>
      <li>负责人：张三</li>
    </ul>
  </div>
</details>
```

## 六、最佳实践

### 6.1 语义化标记

优先使用原生的 `<details>` 和 `<summary>` 元素，它们提供完整的语义和无障碍支持。

### 6.2 组件命名

在实际开发中，Disclosure 模式可能以不同名称出现：

- **Collapse**：在许多 UI 库（如 Bootstrap、Ant Design、Element UI）中的常见名称
- **Accordion**：当多个 Disclosure 组件垂直堆叠时的特例
- **Expand/Collapse**：更直白的功能描述
- **Show/Hide**：强调内容可见性的变化

尽管名称不同，其核心行为和无障碍要求保持一致。

### 6.3 状态指示

使用视觉指示器（如箭头方向）来表明当前展开状态：

- 收起状态：右指箭头或向右三角形
- 展开状态：下指箭头或向下三角形

### 6.4 平滑过渡

添加 CSS 过渡效果提升用户体验：

```css
.disclosure-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.disclosure-content.expanded {
  max-height: 500px; /* 或适当的最大高度 */
}
```

### 6.5 可访问性考虑

- 确保按钮具有清晰的焦点指示
- 提供足够的点击区域（至少 44x44px）
- 为屏幕阅读器用户提供明确的状态反馈

## 七、与类似模式的区别

| 特性     | Disclosure   | Accordion          | Tabs             |
| -------- | ------------ | ------------------ | ---------------- |
| 内容组织 | 单个内容块   | 多个面板垂直排列   | 多个面板水平排列 |
| 展开方式 | 单击切换     | 单击展开，其他收起 | 单击切换标签     |
| 用途     | 详细信息展示 | FAQ、设置面板      | 页面内容分组     |

## 八、总结

构建无障碍的展开收起组件需要关注三个核心：正确的 ARIA 属性声明、合理的键盘交互支持、清晰的视觉状态指示。原生 `<details>` 和 `<summary>` 元素简化了实现，但开发者仍需理解无障碍原理，确保所有用户都能顺利使用。

遵循 [W3C Disclosure Pattern][0] 规范，我们能够创建既美观又包容的展开收起组件，为不同能力的用户提供一致的体验。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#button
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-expanded
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-controls
