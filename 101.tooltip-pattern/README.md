# Tooltip Pattern 详解：构建无障碍的提示信息组件

Tooltip（提示框，也称为 **Popover**、**Hint**、**Info Bubble** 或 **Help Text**）是一种弹出式信息组件，当元素获得键盘焦点或鼠标悬停时显示相关信息。本文基于 [W3C WAI-ARIA Tooltip Pattern][0] 规范，详解如何构建无障碍的 Tooltip 组件。

> **注意**：此设计模式仍在完善中，尚未获得任务组共识。进展和讨论记录在 [aria-practices][6] 仓库的 [issue 128][5] 中。

## 一、Tooltip 的定义与核心概念

### 1.1 什么是 Tooltip

Tooltip 是一种**弹出式信息组件**，具有以下特征：

- 在**触发元素获得焦点**或**鼠标悬停**时显示
- 通常有**短暂的延迟**后才会出现
- 按 **Escape** 键或鼠标移出时消失
- **不接收焦点**，焦点始终保持在触发元素上
- 如果悬停内容包含可聚焦元素，应使用非模态对话框（non-modal dialog）

### 1.2 核心术语

| 术语                  | 说明                      |
| --------------------- | ------------------------- |
| **Trigger Element**   | 触发 Tooltip 显示的元素   |
| **Tooltip Container** | 包含 Tooltip 内容的容器   |
| **Delay**             | 显示 Tooltip 前的延迟时间 |
| **Dismiss**           | 关闭 Tooltip 的行为       |

```plain
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  Trigger Element                            │    │    │
│  │  │  (button / link / icon)                     │    │    │
│  │  │                                             │    │    │
│  │  │  ┌─────────────────────────────────────┐    │    │    │
│  │  │  │  role="tooltip"                     │    │    │    │
│  │  │  │                                     │    │    │    │
│  │  │  │  Tooltip content appears here       │    │    │    │
│  │  │  │  when trigger is focused or hovered │    │    │    │
│  │  │  │                                     │    │    │    │
│  │  │  └─────────────────────────────────────┘    │    │    │
│  │  │         ↑                                   │    │    │
│  │  │         aria-describedby                    │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                     │    │
│  │  Keyboard: Escape to dismiss                        │    │
│  │  Focus: Stays on trigger element                    │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 典型应用场景

- **图标按钮说明**：解释图标按钮的功能
- **表单字段提示**：提供输入格式要求
- **缩写解释**：解释专业术语或缩写
- **额外信息**：提供补充说明而不占用界面空间
- **快捷键提示**：显示键盘快捷键

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

Tooltip 使用 [`role="tooltip"`][2] 标记。

```html
<button
  aria-describedby="tooltip-id"
  aria-label="保存">
  💾
</button>

<div
  id="tooltip-id"
  role="tooltip"
  class="tooltip">
  保存当前文档 (Ctrl+S)
</div>
```

### 2.2 必需属性

| 属性                    | 说明                 | 示例值       |
| ----------------------- | -------------------- | ------------ |
| [`role="tooltip"`][2]   | 标记为提示框角色     | -            |
| [`aria-describedby`][3] | 触发元素引用 Tooltip | "tooltip-id" |

### 2.3 属性详解

#### aria-describedby

触发元素通过 [`aria-describedby`][3] 属性引用 Tooltip 元素，让辅助技术知道该元素有额外的描述信息：

```html
<!-- 触发元素 -->
<button
  aria-describedby="save-tooltip"
  aria-label="保存">
  💾
</button>

<!-- Tooltip -->
<div
  id="save-tooltip"
  role="tooltip">
  保存当前文档 (Ctrl+S)
</div>
```

**重要提示**：

- [`aria-describedby`][3] 应该指向 Tooltip 的 `id`
- 即使 Tooltip 当前不可见，[`aria-describedby`][3] 也应该存在
- 辅助技术会在用户聚焦到触发元素时读出描述信息

## 三、键盘交互规范

### 3.1 基本键盘交互

| 按键       | 功能         |
| ---------- | ------------ |
| **Escape** | 关闭 Tooltip |

### 3.2 焦点行为

- **焦点始终保持在触发元素上**，Tooltip 不接收焦点
- 如果 Tooltip 在触发元素获得焦点时显示，则在元素失去焦点时关闭
- 如果 Tooltip 在鼠标悬停时显示，则在鼠标移出触发元素或 Tooltip 时关闭

### 3.3 显示与隐藏逻辑要点

实现 Tooltip 的显示与隐藏需要考虑以下要点：

- **延迟显示**：通常设置 500ms 延迟，避免鼠标快速划过时频繁触发
- **延迟隐藏**：通常设置 100ms 延迟，给用户足够时间将鼠标移到 Tooltip 上
- **焦点触发**：元素获得焦点时立即显示，失去焦点时隐藏
- **键盘关闭**：监听 Escape 键关闭 Tooltip
- **状态管理**：使用 `aria-hidden` 控制可见性，配合 CSS 类名切换

## 四、实现方式

### 4.1 基础 Tooltip 结构

```html
<!-- 触发元素 -->
<button
  class="tooltip-trigger"
  aria-describedby="save-tooltip"
  aria-label="保存">
  💾
</button>

<!-- Tooltip -->
<div
  id="save-tooltip"
  role="tooltip"
  class="tooltip"
  aria-hidden="true">
  保存当前文档 (Ctrl+S)
</div>
```

### 4.2 JavaScript 实现

```javascript
class Tooltip {
  constructor(triggerElement, tooltipElement) {
    this.trigger = triggerElement;
    this.tooltip = tooltipElement;
    this.showDelay = 500; // 延迟显示时间（毫秒）
    this.hideDelay = 100; // 延迟隐藏时间（毫秒）
    this.showTimeout = null;
    this.hideTimeout = null;

    this.init();
  }

  init() {
    // 鼠标事件
    this.trigger.addEventListener(
      'mouseenter',
      this.handleMouseEnter.bind(this),
    );
    this.trigger.addEventListener(
      'mouseleave',
      this.handleMouseLeave.bind(this),
    );

    // 焦点事件
    this.trigger.addEventListener('focus', this.handleFocus.bind(this));
    this.trigger.addEventListener('blur', this.handleBlur.bind(this));

    // 键盘事件
    this.trigger.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleMouseEnter() {
    this.clearHideTimeout();
    this.showTimeout = setTimeout(() => {
      this.show();
    }, this.showDelay);
  }

  handleMouseLeave() {
    this.clearShowTimeout();
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, this.hideDelay);
  }

  handleFocus() {
    this.show();
  }

  handleBlur() {
    this.hide();
  }

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.hide();
    }
  }

  show() {
    this.tooltip.classList.add('tooltip-visible');
    this.tooltip.setAttribute('aria-hidden', 'false');
  }

  hide() {
    this.tooltip.classList.remove('tooltip-visible');
    this.tooltip.setAttribute('aria-hidden', 'true');
  }

  clearShowTimeout() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  clearHideTimeout() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}
```

### 4.3 表单字段 Tooltip 示例

```html
<div class="form-field">
  <label for="email">邮箱地址</label>
  <input
    type="email"
    id="email"
    aria-describedby="email-tooltip"
    placeholder="example@domain.com" />
  <div
    id="email-tooltip"
    role="tooltip"
    class="tooltip"
    aria-hidden="true">
    请输入有效的邮箱地址，格式：username@domain.com
  </div>
</div>
```

```javascript
const emailInput = document.getElementById('email');
const emailTooltip = document.getElementById('email-tooltip');
new Tooltip(emailInput, emailTooltip);
```

## 五、最佳实践

### 5.1 提供清晰的描述

Tooltip 内容应该简洁明了，提供有用的信息：

```html
<!-- 好的示例：提供有用的信息 -->
<button
  aria-describedby="format-tooltip"
  aria-label="格式化">
  📝
</button>
<div
  id="format-tooltip"
  role="tooltip">
  格式化选中的文本 (Ctrl+B)
</div>

<!-- 不好的示例：信息冗余 -->
<button
  aria-describedby="bad-tooltip"
  aria-label="保存">
  💾
</button>
<div
  id="bad-tooltip"
  role="tooltip">
  点击此按钮可以保存您的文档
</div>
```

### 5.2 避免在 Tooltip 中包含可聚焦元素

如果 Tooltip 需要包含链接、按钮等可聚焦元素，应该使用非模态对话框（non-modal dialog）而不是 Tooltip：

```html
<!-- 错误：Tooltip 中包含可聚焦元素 -->
<div role="tooltip">更多信息请<a href="/help">查看帮助文档</a></div>

<!-- 正确：使用非模态对话框 -->
<div
  role="dialog"
  aria-modal="false"
  aria-labelledby="dialog-title">
  <h2 id="dialog-title">更多信息</h2>
  <p>更多信息请<a href="/help">查看帮助文档</a></p>
  <button>关闭</button>
</div>
```

### 5.3 设置合理的延迟时间

- **显示延迟**：通常 500ms，避免用户快速移动鼠标时频繁显示
- **隐藏延迟**：通常 100ms，给用户足够的时间将鼠标移到 Tooltip 上

### 5.4 确保 Tooltip 可访问

- 使用 [`aria-describedby`][3] 关联触发元素和 Tooltip
- 设置 [`aria-hidden`][4] 控制可见性
- 确保 Tooltip 内容被辅助技术读出

### 5.5 考虑移动端体验

在移动设备上，Tooltip 通常通过点击触发：

```javascript
// 检测触摸设备
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (isTouchDevice) {
  // 触摸设备：点击触发
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    tooltip.toggle();
  });
} else {
  // 桌面设备：悬停触发
  trigger.addEventListener('mouseenter', () => tooltip.show());
  trigger.addEventListener('mouseleave', () => tooltip.hide());
}
```

### 5.6 提供视觉反馈

- Tooltip 应该有明显的视觉样式（背景色、边框、阴影）
- 显示/隐藏应该有平滑的过渡动画
- 确保 Tooltip 不遮挡重要内容

## 六、常见错误

### 6.1 忘记设置 aria-describedby

```html
<!-- 错误 -->
<button>💾</button>
<div role="tooltip">保存文档</div>

<!-- 正确 -->
<button aria-describedby="save-tooltip">💾</button>
<div
  id="save-tooltip"
  role="tooltip">
  保存文档
</div>
```

### 6.2 Tooltip 接收焦点

```html
<!-- 错误：Tooltip 不应该可聚焦 -->
<div
  role="tooltip"
  tabindex="0">
  ...
</div>

<!-- 正确：Tooltip 不接收焦点 -->
<div role="tooltip">...</div>
```

### 6.3 使用 title 属性代替 Tooltip

```html
<!-- 错误：title 属性的可访问性支持不一致 -->
<button title="保存文档">💾</button>

<!-- 正确：使用 ARIA Tooltip -->
<button aria-describedby="save-tooltip">💾</button>
<div
  id="save-tooltip"
  role="tooltip">
  保存文档
</div>
```

### 6.4 Tooltip 内容过长

Tooltip 应该简洁，如果内容过长，考虑使用其他组件：

```html
<!-- 不好的示例：内容过长 -->
<div role="tooltip">这是一个非常长的说明文字，包含了大量的详细信息...</div>

<!-- 好的示例：简洁明了 -->
<div role="tooltip">保存文档 (Ctrl+S)</div>
```

## 七、Tooltip vs 其他组件

### 7.1 Tooltip vs Dialog

| 特性         | Tooltip     | Dialog             |
| ------------ | ----------- | ------------------ |
| **焦点**     | 不接收焦点  | 接收焦点           |
| **内容**     | 纯文本信息  | 可包含交互元素     |
| **触发方式** | 悬停/焦点   | 点击/特定操作      |
| **关闭方式** | Escape/移出 | 点击关闭按钮/遮罩  |
| **典型用例** | 简短说明    | 确认操作、表单填写 |

### 7.2 Tooltip vs Popover

| 特性           | Tooltip  | Popover        |
| -------------- | -------- | -------------- |
| **内容复杂度** | 简单文本 | 可包含丰富内容 |
| **交互性**     | 无交互   | 可包含交互元素 |
| **持久性**     | 临时显示 | 可持久显示     |
| **典型用例**   | 功能说明 | 详细信息展示   |

## 八、总结

构建无障碍的 Tooltip 组件需要关注：

1. **正确的角色**：使用 `role="tooltip"`
2. **关联属性**：触发元素使用 [`aria-describedby`][3] 引用 Tooltip
3. **焦点管理**：Tooltip 不接收焦点，焦点始终保持在触发元素
4. **键盘交互**：支持 Escape 键关闭
5. **显示逻辑**：合理的延迟显示和隐藏
6. **内容简洁**：提供有用的信息，避免冗余
7. **避免可聚焦元素**：Tooltip 中不包含链接、按钮等可聚焦元素
8. **位置计算**：确保 Tooltip 不超出视口边界

遵循 [W3C Tooltip Pattern][0] 规范，我们能够创建既实用又无障碍的提示信息组件，为所有用户提供清晰的辅助信息。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#tooltip
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-describedby
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-hidden
[5]: https://github.com/w3c/aria-practices/issues/128
[6]: https://github.com/w3c/aria-practices
