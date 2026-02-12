# Dialog (Modal) Pattern 详解：构建无障碍模态对话框

模态对话框是 Web 应用中常见的交互组件，用于在不离开当前页面的情况下展示重要信息或获取用户输入。本文基于 [W3C WAI-ARIA Dialog Pattern][0] 规范，详解如何构建无障碍的模态对话框。

## 一、Dialog 的定义与核心功能

Dialog（对话框）是覆盖在主窗口或其他对话框之上的窗口。模态对话框会阻断用户与底层内容的交互，直到对话框关闭。底层内容通常会被视觉遮挡或变暗，以明确当前焦点在对话框内。

与 Alert Dialog 不同，普通 Dialog 适用于各种需要用户交互的场景，如表单填写、信息展示、设置配置等。它不强调紧急性，用户可以自主决定是否与之交互。

## 二、Dialog 的关键特性

模态对话框具有以下核心特性：

**焦点限制**：对话框包含独立的 Tab 序列，Tab 和 Shift+Tab 仅在对话框内循环，不会移出对话框外部。

**背景禁用**：对话框背后的内容处于 inert 状态，用户无法与之交互。尝试与背景交互通常会导致对话框关闭。

**层级管理**：对话框可以嵌套，新的对话框覆盖在旧对话框之上，形成层级结构。

## 三、WAI-ARIA 角色与属性

### 3.1 基本角色

`role="dialog"` 是对话框的基础角色，用于标识模态或非模态对话框元素。

`aria-modal="true"` 明确告知辅助技术这是一个模态对话框，背景内容当前不可用。

### 3.2 标签与描述

`aria-labelledby` 引用对话框标题元素，为对话框提供可访问名称。

`aria-describedby` 引用包含对话框主要内容的元素，帮助屏幕阅读器用户理解对话框目的。

```html
<dialog
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc">
  <h2 id="dialog-title">用户设置</h2>
  <p id="dialog-desc">请配置您的个人偏好设置。</p>
  <!-- 对话框内容 -->
</dialog>
```

## 四、键盘交互规范

### 4.1 焦点管理

**打开对话框时**：焦点应移动到对话框内的某个元素。通常移动到第一个可聚焦元素，但根据内容不同可能有不同策略：

- 内容包含复杂结构（列表、表格）时，可将焦点设置在内容的静态元素上，便于用户理解
- 内容较长时，将焦点设置在标题或顶部段落，避免内容滚动出视野
- 简单确认对话框，焦点可设置在主要操作按钮

**关闭对话框时**：焦点应返回到触发对话框的元素，除非该元素已不存在。

### 4.2 键盘操作

| 按键        | 功能                                                     |
| ----------- | -------------------------------------------------------- |
| Tab         | 移动到对话框内下一个可聚焦元素，到达末尾时循环到第一个   |
| Shift + Tab | 移动到对话框内上一个可聚焦元素，到达开头时循环到最后一个 |
| Escape      | 关闭对话框                                               |

```javascript
// 焦点管理示例
function openDialog(dialog, triggerElement) {
  dialog.triggerElement = triggerElement;
  dialog.showModal();

  // 将焦点设置到第一个可聚焦元素或标题
  const focusable = dialog.querySelector(
    'button, [href], input, select, textarea',
  );
  if (focusable) {
    focusable.focus();
  }
}

function closeDialog(dialog) {
  dialog.close();
  // 恢复焦点到触发元素
  if (dialog.triggerElement) {
    dialog.triggerElement.focus();
  }
}
```

## 五、实现方式

### 5.1 原生 dialog 元素

HTML5 `<dialog>` 元素是推荐实现方式，内置模态行为和无障碍支持：

- **自动焦点管理**：`showModal()` 自动将焦点移动到对话框内第一个可聚焦元素
- **内置 ESC 关闭**：用户按 ESC 键自动关闭对话框
- **自动模态背景**：自动创建背景遮罩，阻止与底层内容交互
- **焦点循环**：Tab 键在对话框内自动循环，不会移出对话框
- **内置 ARIA 属性**：浏览器自动处理 `aria-modal` 等属性
- **Top Layer 支持**：模态对话框显示在浏览器顶层，不受 `z-index` 限制

```html
<dialog
  id="settings-dialog"
  aria-labelledby="dialog-title">
  <div class="dialog-header">
    <h2 id="dialog-title">设置</h2>
    <button
      onclick="this.closest('dialog').close()"
      aria-label="关闭">
      ✕
    </button>
  </div>
  <div class="dialog-content">
    <label>
      用户名
      <input type="text" />
    </label>
  </div>
  <div class="dialog-footer">
    <button onclick="this.closest('dialog').close()">取消</button>
    <button onclick="saveSettings()">保存</button>
  </div>
</dialog>

<button onclick="document.getElementById('settings-dialog').showModal()">
  打开设置
</button>
```

### 5.2 div + ARIA 实现

需要手动处理焦点管理和背景交互。这种方式适用于需要自定义动画、复杂布局或旧浏览器兼容的场景：

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  class="modal-overlay">
  <div class="modal-content">
    <h2 id="dialog-title">确认操作</h2>
    <p>确定要执行此操作吗？</p>
    <button>取消</button>
    <button>确认</button>
  </div>
</div>
```

## 六、最佳实践

初始焦点策略和键盘交互的详细规范请参考 [4.1 焦点管理](#41-焦点管理)。在实际应用中，建议遵循以下策略：

- **信息展示**：焦点设置在标题或内容开头，便于屏幕阅读器顺序阅读
- **表单输入**：焦点设置在第一个输入框
- **确认操作**：焦点设置在主操作按钮或取消按钮（视风险而定）

### 6.1 关闭方式

提供多种关闭方式提升用户体验：

- ESC 键关闭（原生 dialog 自动支持）
- 关闭按钮
- 点击背景遮罩关闭（可选）
- 明确的取消/确认按钮

### 6.2 嵌套对话框

支持多层对话框嵌套，每层新对话框覆盖在上层：

```html
<dialog id="layer1">
  <button onclick="document.getElementById('layer2').showModal()">
    打开第二层
  </button>
</dialog>

<dialog id="layer2">
  <p>第二层对话框</p>
</dialog>
```

### 6.3 避免滥用

对话框会中断用户流程，应谨慎使用：

- 优先使用非模态方式展示非关键信息
- 避免对话框内再嵌套复杂导航
- 保持对话框内容简洁，避免过多滚动

## 七、Dialog 与 Alert Dialog 的区别

| 特性       | Dialog               | Alert Dialog         |
| ---------- | -------------------- | -------------------- |
| 用途       | 一般交互、表单、配置 | 紧急确认、警告、错误 |
| 紧急性     | 非紧急               | 紧急，需立即响应     |
| 关闭方式   | 多种方式             | 通常只有确认/取消    |
| 角色       | `role="dialog"`      | `role="alertdialog"` |
| 系统提示音 | 无                   | 可能有               |

## 八、总结

构建无障碍的模态对话框需要关注三个核心：正确的 ARIA 属性声明、合理的焦点管理、完整的键盘交互支持。原生 `<dialog>` 元素简化了实现，但开发者仍需理解无障碍原理，确保所有用户都能顺利使用。

遵循 [W3C Dialog Pattern][0] 规范，我们能够创建既美观又包容的对话框组件，为不同能力的用户提供一致的体验。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
[1]: https://github.com/an-Onion/an-Onion.github.io
