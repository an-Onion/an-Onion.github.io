# Accordion Pattern 详解：构建垂直堆叠的展开收起组件

Accordion（手风琴）是一种常见的交互组件，由垂直堆叠的可交互标题组成，每个标题包含一个内容部分的标题、摘要或缩略图。本文基于 [W3C WAI-ARIA Accordion Pattern][0] 规范，详解如何构建无障碍的 Accordion 组件。

## 一、Accordion 的定义与核心概念

Accordion 是一组垂直堆叠的交互式标题，每个标题都包含一个内容部分的标题、摘要或缩略图。标题作为控件，允许用户显示或隐藏其关联的内容部分。

Accordion 常用于在单个页面上呈现多个内容部分时减少滚动需求。

### 1.1 核心术语

- **Accordion Header（手风琴标题）**：内容部分的标签或缩略图，同时作为显示（在某些实现中也包括隐藏）内容部分的控件
- **Accordion Panel（手风琴面板）**：与手风琴标题关联的内容部分

在某些 Accordion 中，手风琴标题旁边始终可见额外的元素。例如，每个手风琴标题可能伴随一个菜单按钮，用于提供适用于该部分的操作访问。

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

每个手风琴标题的内容包含在具有 [`role="button"`][2] 的元素中。

### 2.2 标题层级

每个手风琴标题按钮包装在具有 [`role="heading"`][3] 的元素中，并设置适合页面信息架构的 [`aria-level`][4] 值：

- 如果原生宿主语言具有隐式标题和 aria-level 的元素（如 HTML 标题标签），可以使用原生宿主语言元素
- 按钮元素是标题元素内部的唯一元素

```html
<!-- 手风琴标题 -->
<h3>
  <button
    aria-expanded="true"
    aria-controls="panel-1"
    id="accordion-header-1">
    第一部分标题
  </button>
</h3>

<!-- 手风琴面板 -->
<div
  id="panel-1"
  role="region"
  aria-labelledby="accordion-header-1">
  <p>第一部分的内容...</p>
</div>
```

### 2.3 状态属性

- [`aria-expanded`][5]：如果与手风琴标题关联的面板可见，设置为 `true`；如果面板不可见，设置为 `false`
- [`aria-controls`][6]：设置为包含手风琴面板内容的元素的 ID
- [`aria-disabled`][7]：如果与手风琴标题关联的面板可见，且手风琴不允许折叠该面板，则设置为 `true`

### 2.4 区域角色（可选）

每个作为面板内容容器的元素可以具有 [`role="region"`][8] 和 [`aria-labelledby`][9]，其值引用控制面板显示的按钮：

- 避免在会创建过多地标区域的情况下使用 region 角色，例如在可以同时展开超过约 6 个面板的手风琴中
- 当面板包含标题元素或嵌套手风琴时，region 角色对屏幕阅读器用户感知结构特别有帮助

```html
<!-- 手风琴标题按钮 -->
<h3>
  <button
    aria-expanded="true"
    aria-controls="panel-1"
    id="header-1">
    面板标题
  </button>
</h3>

<!-- 手风琴面板内容 -->
<div
  role="region"
  aria-labelledby="header-1"
  id="panel-1">
  <p>面板内容...</p>
</div>
```

## 三、键盘交互规范

### 3.1 基本键盘操作

| 按键           | 功能                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Enter 或 Space | 当焦点位于折叠面板的手风琴标题上时，展开关联面板。如果实现只允许一个面板展开，且另一个面板已展开，则折叠该面板 |
| Tab            | 将焦点移动到下一个可聚焦元素；手风琴中的所有可聚焦元素都包含在页面 Tab 序列中                                  |
| Shift + Tab    | 将焦点移动到上一个可聚焦元素；手风琴中的所有可聚焦元素都包含在页面 Tab 序列中                                  |

### 3.2 可选键盘操作

| 按键       | 功能                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Down Arrow | 如果焦点在手风琴标题上，将焦点移动到下一个手风琴标题。如果焦点在最后一个手风琴标题上，要么不执行任何操作，要么将焦点移动到第一个手风琴标题 |
| Up Arrow   | 如果焦点在手风琴标题上，将焦点移动到上一个手风琴标题。如果焦点在第一个手风琴标题上，要么不执行任何操作，要么将焦点移动到最后一个手风琴标题 |
| Home       | 当焦点在手风琴标题上时，将焦点移动到第一个手风琴标题                                                                                       |
| End        | 当焦点在手风琴标题上时，将焦点移动到最后一个手风琴标题                                                                                     |

## 四、实现方式

### 4.1 基础结构

```html
<div class="accordion">
  <!-- 第一部分 -->
  <h3>
    <button
      aria-expanded="true"
      aria-controls="section1"
      id="accordion-header-1">
      第一部分标题
    </button>
  </h3>
  <div
    id="section1"
    role="region"
    aria-labelledby="accordion-header-1">
    <p>第一部分的内容...</p>
  </div>

  <!-- 第二部分 -->
  <h3>
    <button
      aria-expanded="false"
      aria-controls="section2"
      id="accordion-header-2">
      第二部分标题
    </button>
  </h3>
  <div
    id="section2"
    role="region"
    aria-labelledby="accordion-header-2"
    hidden>
    <p>第二部分的内容...</p>
  </div>
</div>
```

### 4.2 单展开模式

在单展开模式下，一次只能展开一个面板：

```html
<div
  class="accordion"
  data-accordion-single>
  <h3>
    <button
      aria-expanded="true"
      aria-controls="panel-1"
      aria-disabled="true">
      始终展开的面板
    </button>
  </h3>
  <div
    id="panel-1"
    role="region">
    <p>此面板无法折叠...</p>
  </div>

  <h3>
    <button
      aria-expanded="false"
      aria-controls="panel-2">
      可切换的面板
    </button>
  </h3>
  <div
    id="panel-2"
    role="region"
    hidden>
    <p>点击上方标题可展开此面板...</p>
  </div>
</div>
```

### 4.3 多展开模式

在多展开模式下，可以同时展开多个面板：

```html
<div
  class="accordion"
  data-accordion-multiple>
  <h3>
    <button
      aria-expanded="true"
      aria-controls="multi-1">
      第一个面板
    </button>
  </h3>
  <div
    id="multi-1"
    role="region">
    <p>第一个面板内容...</p>
  </div>

  <h3>
    <button
      aria-expanded="true"
      aria-controls="multi-2">
      第二个面板（也可同时展开）
    </button>
  </h3>
  <div
    id="multi-2"
    role="region">
    <p>第二个面板内容...</p>
  </div>
</div>
```

### 4.4 使用原生 HTML `<details>` + `name` 实现

HTML5.2 起，`<details>` 元素支持 `name` 属性，可以实现原生的单展开模式（Accordion 效果），无需 JavaScript：

```html
<details
  name="accordion-group"
  open>
  <summary>第一部分标题</summary>
  <p>第一部分的内容...</p>
</details>

<details name="accordion-group">
  <summary>第二部分标题</summary>
  <p>第二部分的内容...</p>
</details>

<details name="accordion-group">
  <summary>第三部分标题</summary>
  <p>第三部分的内容...</p>
</details>
```

#### 关键点说明

| 特性        | 说明                                                |
| ----------- | --------------------------------------------------- |
| `name` 属性 | 相同 `name` 值的 `<details>` 元素会互斥，实现单展开 |
| `open` 属性 | 指定默认展开的面板                                  |
| 浏览器支持  | Chrome 120+, Firefox, Safari 17.1+                  |

#### 增强版实现（添加 heading 结构）

> ⚠️ **注意**：`<details>` 元素的实现方式与 W3C Accordion Pattern 的 DOM 结构要求不完全一致。W3C 标准要求按钮元素必须是 heading 元素内部的唯一子元素（`<h3><button>...</button></h3>`），而 `<details>` 使用 `<summary>` 作为交互元素。

如果需要更好的无障碍支持，可以在 `<summary>` 内添加标题：

```html
<details
  name="accordion-group"
  open>
  <summary>
    <h3 style="display: inline; font-size: inherit;">第一部分标题</h3>
  </summary>
  <p>第一部分的内容...</p>
</details>
```

**重要提示**：这种结构虽然添加了 heading，但仍然是 **heading 在 summary 内部**，与 W3C 要求的 **button 在 heading 内部** 的结构相反。因此，这种方式：

- ✅ 提供了基本的标题层级信息
- ❌ 不完全符合 W3C Accordion Pattern 的 DOM 结构规范
- ❌ 可能不被某些屏幕阅读器正确识别为手风琴组件

#### 适用场景

**推荐使用 `<details name>`：**

- 简单的 FAQ 页面
- 不需要复杂样式的场景
- 追求原生、轻量实现
- 现代浏览器环境

**推荐使用 W3C 模式：**

- 需要多展开模式
- 需要箭头键导航
- 需要精确的标题层级（SEO/屏幕阅读器）
- 需要复杂的自定义样式

## 五、常见应用场景

### 5.1 表单分步填写

将长表单分成多个部分，用户逐步填写：

```html
<div class="accordion">
  <h3>
    <button
      aria-expanded="true"
      aria-controls="step-1">
      步骤 1：个人信息
    </button>
  </h3>
  <div
    id="step-1"
    role="region">
    <label>姓名 <input type="text" /></label>
    <label>邮箱 <input type="email" /></label>
  </div>

  <h3>
    <button
      aria-expanded="false"
      aria-controls="step-2">
      步骤 2：地址信息
    </button>
  </h3>
  <div
    id="step-2"
    role="region"
    hidden>
    <label>城市 <input type="text" /></label>
    <label>邮编 <input type="text" /></label>
  </div>
</div>
```

### 5.2 FAQ 页面

常见问题解答页面，每个问题作为一个可展开的部分：

```html
<div class="accordion">
  <h3>
    <button
      aria-expanded="false"
      aria-controls="faq-1">
      如何注册账户？
    </button>
  </h3>
  <div
    id="faq-1"
    role="region"
    hidden>
    <p>点击页面右上角的"注册"按钮，填写必要信息...</p>
  </div>

  <h3>
    <button
      aria-expanded="false"
      aria-controls="faq-2">
      如何重置密码？
    </button>
  </h3>
  <div
    id="faq-2"
    role="region"
    hidden>
    <p>点击登录页面的"忘记密码"链接...</p>
  </div>
</div>
```

### 5.3 设置面板

应用程序的设置页面，将相关设置分组：

```html
<div class="accordion">
  <h3>
    <button
      aria-expanded="true"
      aria-controls="settings-general">
      通用设置
    </button>
  </h3>
  <div
    id="settings-general"
    role="region">
    <label><input type="checkbox" /> 启用通知</label>
    <label><input type="checkbox" /> 自动保存</label>
  </div>

  <h3>
    <button
      aria-expanded="false"
      aria-controls="settings-privacy">
      隐私设置
    </button>
  </h3>
  <div
    id="settings-privacy"
    role="region"
    hidden>
    <label><input type="checkbox" /> 公开个人资料</label>
    <label><input type="checkbox" /> 允许搜索</label>
  </div>
</div>
```

## 六、最佳实践

### 6.1 语义化标记

- 使用适当的标题层级（h1-h6）包装手风琴标题按钮
- 为每个面板添加 `role="region"` 以增强结构感知（面板数量较少时）
- 确保按钮元素是标题元素内部的唯一元素

### 6.2 键盘导航

- 实现基本的 Enter/Space 和 Tab 导航
- 可选实现箭头键导航以提升用户体验
- 确保所有手风琴标题都包含在 Tab 序列中

### 6.3 视觉指示

- 使用清晰的视觉指示器表示展开/折叠状态
- 为当前聚焦的标题提供明显的焦点样式
- 考虑使用动画过渡提升用户体验

### 6.4 状态管理

- 明确区分单展开和多展开模式
- 在单展开模式中，考虑是否允许所有面板同时折叠
- 使用 `aria-disabled` 表示不允许折叠的面板

### 6.5 嵌套考虑

- 避免过深的嵌套层级
- 嵌套手风琴时，确保每个层级有清晰的视觉区分
- 考虑使用不同的标题层级表示嵌套关系

## 七、Accordion 与 Disclosure 的区别

| 特性     | Accordion                  | Disclosure         |
| -------- | -------------------------- | ------------------ |
| 内容组织 | 多个垂直堆叠的面板         | 单个内容块         |
| 展开模式 | 支持单展开或多展开         | 独立控制           |
| 标题结构 | 使用 heading + button 结构 | 简单按钮或 summary |
| 导航支持 | 支持箭头键导航             | 基本 Tab 导航      |
| 用途     | 表单分步、设置面板、FAQ    | 详细信息展示       |

## 八、总结

构建无障碍的 Accordion 组件需要关注三个核心：正确的语义化标记（heading + button 结构）、完整的键盘交互支持（包括可选的箭头键导航）、清晰的状态管理（aria-expanded、aria-controls、aria-disabled）。与简单的 Disclosure 不同，Accordion 强调多个面板的组织和管理，适用于更复杂的内容展示场景。

遵循 [W3C Accordion Pattern][0] 规范，我们能够创建既美观又包容的手风琴组件，为不同能力的用户提供一致的体验。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#button
[3]: https://www.w3.org/TR/wai-aria-1.2/#heading
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-level
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-expanded
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-controls
[7]: https://www.w3.org/TR/wai-aria-1.2/#aria-disabled
[8]: https://www.w3.org/TR/wai-aria-1.2/#region
[9]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
