# Alert Dialog Pattern 详解：构建无障碍中断式对话框

Alert Dialog 是 Web 无障碍交互的重要组件。本文详解其 WAI-ARIA 实现要点，涵盖角色声明、键盘交互、最佳实践，助你打造中断式对话框，让关键信息触达每位用户。

## 一、Alert Dialog 的定义与核心功能

Alert Dialog（警告对话框）是一种模态对话框，它会中断用户的工作流程以传达重要信息并获取响应。与普通的 Alert 通知不同，Alert Dialog 需要用户明确与之交互后才能继续其他操作。这种设计适用于需要用户立即关注和做出决定的场景。

在实际应用中，Alert Dialog 广泛应用于各种需要用户确认或紧急通知的场景。例如，删除操作前的确认提示、表单提交失败的错误确认、离开页面时的未保存更改提醒等。这些场景都需要用户明确响应才能继续操作，因此 Alert Dialog 成为最佳选择。

## 二、Alert Dialog 的特性与注意事项

Alert Dialog 组件具有几个重要的特性，这些特性决定了它的适用场景和实现方式。首先，Alert Dialog 会获取键盘焦点，确保用户的注意力集中在对话框上。其次，Alert Dialog 通常会阻止用户与页面的其他部分交互，直到用户关闭对话框。这种模态特性确保了用户必须处理重要信息才能继续操作。

Alert Dialog 组件的设计还需要考虑几个关键因素。首先，Alert Dialog 应该始终包含一个明确的关闭方式，如确认按钮或取消按钮。其次，对话框应该有一个清晰的标题，通过 `aria-labelledby` 或 `aria-label` 关联。另外，对话框的内容应该通过 `aria-describedby` 关联，以便屏幕阅读器能够正确读取完整信息。这些属性的正确使用对于无障碍体验至关重要。

## 三、WAI-ARIA 角色、状态和属性

正确使用 WAI-ARIA 属性是构建无障碍 Alert Dialog 组件的技术基础。Alert Dialog 组件的 ARIA 要求包含多个属性的配合使用。

`role="alertdialog"` 是 Alert Dialog 组件的必需属性，它向辅助技术表明这个元素是一个警告对话框。这个属性使浏览器和辅助技术能够将 Alert Dialog 与其他类型的对话框区分开来，从而提供特殊的处理方式，如播放系统提示音。

`aria-labelledby` 或 `aria-label` 用于标识对话框的标题。如果对话框有可见的标题标签，应该使用 `aria-labelledby` 引用该标题元素；如果没有可见标题，则使用 `aria-label` 提供标签。

`aria-describedby` 用于引用包含警告消息的元素。这确保屏幕阅读器能够朗读完整的对话框内容，包括详细的说明和操作提示。

```html
<!-- Alert Dialog 基本结构 -->
<div
  role="alertdialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc">
  <h2 id="dialog-title">确认删除</h2>
  <p id="dialog-desc">您确定要删除这个文件吗？此操作无法撤销。</p>
  <button>确认删除</button>
  <button>取消</button>
</div>
```

值得注意的是，Alert Dialog 与普通 Dialog 的主要区别在于 Alert Dialog 用于紧急或重要信息，并且通常包含确认/取消按钮。用户无法忽略 Alert Dialog，必须做出响应才能继续操作。

## 四、键盘交互规范

Alert Dialog 的键盘交互遵循模态对话框的交互模式。用户可以通过多种方式与 Alert Dialog 进行交互。

`Enter` 或 `Space` 用于激活默认按钮，通常是对话框中的主要操作按钮。`Tab` 键用于在对话框内的焦点元素之间切换，焦点会循环停留在对话框内部。`Escape` 键通常用于关闭对话框，相当于点击取消按钮。

```javascript
// ESC 键关闭对话框示例
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && dialog.open) {
    dialog.close();
  }
});
```

焦点管理是 Alert Dialog 的关键部分。当对话框打开时，焦点应该立即移动到对话框内部或默认按钮上。当对话框关闭时，焦点应该返回到打开对话框的元素。这种焦点管理确保了键盘用户能够保持其工作上下文。

## 五、完整示例

以下是使用不同方式实现 Alert Dialog 组件的完整示例，展示了标准的 HTML 结构和 ARIA 属性应用。

### 5.1 删除确认对话框

```html
<template id="confirm-dialog-template">
  <div
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-message"
    class="dialog-overlay">
    <div
      class="dialog-content"
      role="document">
      <h2 id="dialog-title">⚠️ 确认删除</h2>
      <p id="dialog-message">您确定要删除这个文件吗？此操作无法撤销。</p>
      <div class="dialog-actions">
        <button
          class="btn btn-error"
          id="confirm-btn">
          删除
        </button>
        <button
          class="btn btn-ghost"
          id="cancel-btn">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<button
  id="delete-btn"
  class="btn btn-error">
  🗑️ 删除文件
</button>

<div id="dialog-container"></div>

<script>
  const dialogContainer = document.getElementById('dialog-container');
  const deleteBtn = document.getElementById('delete-btn');

  deleteBtn.addEventListener('click', function () {
    const template = document.getElementById('confirm-dialog-template');
    dialogContainer.appendChild(template.content.cloneNode(true));

    const dialog = dialogContainer.querySelector('[role="alertdialog"]');
    const confirmBtn = dialog.querySelector('#confirm-btn');
    const cancelBtn = dialog.querySelector('#cancel-btn');

    // 保存焦点元素
    const previousActiveElement = document.activeElement;

    // 打开对话框
    dialog.showModal();

    // 焦点管理：移动到确认按钮
    confirmBtn.focus();

    // 确认操作
    confirmBtn.addEventListener('click', function () {
      // 执行删除逻辑
      console.log('文件已删除');
      dialog.close();
      dialog.remove();
      previousActiveElement.focus();
    });

    // 取消操作
    cancelBtn.addEventListener('click', function () {
      dialog.close();
      dialog.remove();
      previousActiveElement.focus();
    });

    // ESC 键关闭
    dialog.addEventListener('cancel', function () {
      dialog.remove();
      previousActiveElement.focus();
    });
  });
</script>
```

### 5.2 表单验证错误对话框

```html
<template id="error-dialog-template">
  <div
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="error-title"
    aria-describedby="error-message">
    <h2 id="error-title">❌ 表单验证失败</h2>
    <p id="error-message">请确保所有必填字段都已填写，并且电子邮件格式正确。</p>
    <button
      id="retry-btn"
      class="btn btn-primary">
      重新填写
    </button>
  </div>
</template>
```

### 5.3 离开页面确认对话框

```html
<template id="unsaved-changes-template">
  <div
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="leave-title"
    aria-describedby="leave-message">
    <h2 id="leave-title">⚠️ 未保存的更改</h2>
    <p id="leave-message">您有未保存的更改，离开此页面将丢失这些更改。</p>
    <div class="dialog-actions">
      <button
        id="save-btn"
        class="btn btn-success">
        💾 保存
      </button>
      <button
        id="discard-btn"
        class="btn btn-error">
        丢弃更改
      </button>
      <button
        id="stay-btn"
        class="btn btn-ghost">
        留在此页面
      </button>
    </div>
  </div>
</template>

<script>
  // 监听页面离开事件
  window.addEventListener('beforeunload', function (e) {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
</script>
```

## 六、最佳实践

### 6.1 语义化结构与内容

Alert Dialog 组件应该使用语义化的 HTML 结构来构建内容。对话框应该包含清晰的标题、描述性消息和操作按钮。需要注意的是，对话框的内容应该保持简洁明了，避免包含过多复杂信息。

```html
<!-- 推荐：结构清晰的 Alert Dialog -->
<div
  role="alertdialog"
  aria-labelledby="title"
  aria-describedby="description">
  <h2 id="title">确认操作</h2>
  <p id="description">确定要执行此操作吗？</p>
  <div class="actions">
    <button>确定</button>
    <button>取消</button>
  </div>
</div>
```

### 6.2 焦点管理

正确的焦点管理对于键盘用户和无障碍体验至关重要。打开对话框时，焦点应该移动到对话框内部或默认按钮。关闭对话框时，焦点应该返回到触发对话框的元素。

```javascript
// 焦点管理最佳实践
function openDialog(dialog) {
  const previousFocus = document.activeElement;
  dialog.showModal();

  // 移动焦点到对话框内
  const focusableElements = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }

  // 保存关闭时的焦点元素
  dialog.dataset.previousFocus = previousFocus;
}

function closeDialog(dialog) {
  dialog.close();
  const previousFocus = document.querySelector(
    `[data-focus-id="${dialog.dataset.focusId}"]`,
  );
  if (previousFocus) {
    previousFocus.focus();
  }
  dialog.remove();
}
```

### 6.3 避免过度使用

Alert Dialog 会中断用户的工作流程，因此应该谨慎使用。只有在真正需要用户立即响应的情况下才使用 Alert Dialog。对于非紧急信息，应该考虑使用普通的 Alert 或 Toast 通知。

```html
<!-- 不推荐：过度使用 Alert Dialog -->
<div role="alertdialog">
  <h2>提示</h2>
  <p>您的设置已保存。</p>
  <button>确定</button>
</div>

<!-- 推荐：使用普通 Alert -->
<div role="alert">您的设置已保存。</div>
```

### 6.4 屏幕阅读器兼容性

确保 Alert Dialog 对屏幕阅读器用户友好。正确使用 `aria-labelledby`、`aria-describedby` 和 `aria-modal` 属性，使屏幕阅读器能够正确识别和朗读对话框内容。

```html
<!-- 屏幕阅读器友好的 Alert Dialog -->
<div
  role="alertdialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description">
  <h2 id="dialog-title">重要提醒</h2>
  <p id="dialog-description">
    您的会话将在 5 分钟后过期。
    <span aria-live="polite">请尽快保存您的工作。</span>
  </p>
  <button>继续使用</button>
  <button>退出</button>
</div>
```

## 七、Alert 与 Alert Dialog 的区别

理解 [Alert][0] 和 [Alert Dialog][1] 的区别对于正确选择通知组件至关重要。虽然两者都是用于传达重要信息，但它们服务于不同的目的和使用场景。

[Alert][0] 是一种被动通知组件，它不需要用户进行任何交互操作。Alert 会在不被中断用户工作流程的前提下自动通知用户重要信息。用户可以继续当前的工作，Alert 只是在视觉和听觉上提供通知。这种设计适用于不紧急、不需要用户立即响应的信息，例如操作成功确认、后台处理完成通知等。

[Alert Dialog][1] 则是一种需要用户主动响应的对话框组件。当用户需要做出决定或者提供确认时，应该使用 Alert Dialog。Alert Dialog 会中断用户的工作流程，获取键盘焦点，要求用户必须与之交互才能继续其他操作。这种设计适用于紧急警告、确认删除操作、放弃更改确认等需要用户明确响应的场景。

选择建议：如果信息需要用户立即响应并做出决定，使用 Alert Dialog；如果只是被动通知信息，使用 Alert。

## 八、总结

构建无障碍的 Alert Dialog 组件需要关注角色声明、焦点管理、键盘交互三个层面的细节。从 ARIA 属性角度，需要正确设置 `role="alertdialog"`、`aria-labelledby` 和 `aria-describedby`。从焦点管理角度，需要确保打开和关闭时焦点的正确移动。从用户体验角度，应该避免过度使用 Alert Dialog，只在真正需要用户响应时使用。

WAI-ARIA [Alert Dialog Pattern][1] 为我们提供了清晰的指导方针，遵循这些规范能够帮助我们创建更加包容和易用的 Web 应用。每一个正确实现的 Alert Dialog，都是提升用户体验和确保重要信息有效传达的重要一步。

文章同步于 an-Onion 的 [Github][2]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/alert/
[1]: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
[2]: https://github.com/an-Onion/an-Onion.github.io
