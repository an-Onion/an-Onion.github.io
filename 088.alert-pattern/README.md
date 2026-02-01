# Alert Pattern 详解：构建无障碍通知组件

Alert（警告通知）是一种无需用户干预即可展示重要信息的组件，它能够在不中断用户当前任务的前提下，吸引用户的注意力并传达关键消息。根据 [W3C WAI-ARIA Alert Pattern][0] 规范，正确实现的 Alert 组件不仅要能够及时通知用户重要信息，更要确保所有用户都能接收到这些通知，包括依赖屏幕阅读器的用户。本文将深入探讨 Alert Pattern 的核心概念、实现要点以及最佳实践。

## 一、Alert 的定义与核心功能

Alert 是一种展示简短、重要消息的组件，它以吸引用户注意力但不中断用户任务的方式呈现信息。Alert 的核心功能是在适当的时机向用户传达关键信息，这些信息可能是操作成功提示、错误警告、或者需要用户注意的事项，但都不会影响用户当前的正常工作流程。

在实际应用中，Alert 组件广泛应用于各种需要即时反馈的场景。例如，表单提交成功后的确认消息、系统错误的警告提示、库存不足的提醒通知、或者需要用户确认的重要信息等。一个设计良好的 Alert 组件能够在不影响用户体验的前提下，确保关键信息能够被用户及时感知和理解。

## 二、Alert 的特性与注意事项

Alert 组件具有几个重要的特性，这些特性决定了它的适用场景和实现方式。首先，动态渲染的 Alert 会被大多数屏幕阅读器自动朗读，这意味着当 Alert 被添加到页面时，屏幕阅读器会立即通知用户有新消息。其次，在某些操作系统中，Alert 甚至可能触发提示音，进一步确保用户能够感知到重要信息。然而，有一个重要的限制需要注意：屏幕阅读器不会朗读页面加载完成前就已存在的 Alert。

Alert 组件的设计还需要考虑几个关键因素。首先，Alert 不应影响键盘焦点，这是 Alert Pattern 的核心原则之一。如果需要中断用户工作流程并获取用户确认，应该使用 Alert Dialog Pattern 而不是普通的 Alert。其次，应避免设计自动消失的 Alert，因为消失过快可能导致用户无法完整阅读信息，这不符合 WCAG 2.0 的 2.2.3 成功标准。另外，Alert 的触发频率也需要谨慎控制，过于频繁的中断会影响视觉和认知障碍用户的可用性，使得满足 WCAG 2.0 的 2.2.4 成功标准变得困难。

## 三、WAI-ARIA 角色、状态和属性

正确使用 WAI-ARIA 属性是构建无障碍 Alert 组件的技术基础。Alert 组件的核心 ARIA 要求非常简单：必须将 [role][1] 属性设置为 alert。

role="alert" 是 Alert 组件的必需属性，它向辅助技术表明这个元素是一个警告通知。当这个属性被正确设置时，屏幕阅读器会在 Alert 被添加到 DOM 中时自动朗读其内容。这种自动通知的机制使得 Alert 成为传达即时信息的理想选择，而无需用户执行任何特定操作来触发通知。

```html
<!-- 基本 Alert 实现 -->
<div role="alert">您的会话将在 5 分钟后过期，请保存您的工作。</div>

<!-- 错误 Alert -->
<div
  role="alert"
  class="error-message">
  <span>❌</span> 提交失败：请检查表单中的必填字段。
</div>

<!-- 成功 Alert -->
<div
  role="alert"
  class="success-message"
  aria-live="polite">
  <span>✅</span> 您的更改已成功保存。
</div>
```

值得注意的是，虽然 role="alert" 是核心属性，但开发者有时还会结合 [aria-live][2] 属性来增强通知的语义。aria-live="polite" 表示通知会以不打断用户的方式被朗读，而 aria-live="assertive" 则表示通知会立即中断当前内容被朗读。对于 Alert Pattern 来说，role="alert" 本身已经包含了隐式的 aria-live="assertive" 语义，因此通常不需要额外添加 aria-live 属性。

## 四、键盘交互规范

Alert Pattern 的键盘交互具有特殊性。由于 Alert 是被动通知组件，不需要用户进行任何键盘交互来接收或处理通知。用户不需要通过键盘激活、聚焦或操作 Alert 元素，通知会自动被传达给用户。

这种设计遵循了 Alert Pattern 规范的核心原则：Alert 不应影响键盘焦点。规范明确指出，键盘交互不适用于 Alert 组件。这是因为 Alert 的设计目的是在不中断用户工作流程的前提下传达信息，如果用户需要与 Alert 进行交互（例如确认或关闭），那么应该使用 Alert Dialog Pattern。

## 五、完整示例

以下是使用不同方式实现 Alert 组件的完整示例，展示了标准的 HTML 结构和 ARIA 属性应用：

### 5.1 基本 Alert 通知

```html
<div role="alert">
  <p>系统将在今晚 10 点进行维护，届时服务将暂停 2 小时。</p>
</div>
```

### 5.2 错误状态 Alert

```html
<div
  role="alert"
  class="alert alert-error">
  <span>❌</span>
  <span>保存失败：无法连接到服务器，请检查您的网络连接。</span>
</div>
```

### 5.3 成功状态 Alert

```html
<div
  role="alert"
  class="alert alert-success">
  <span>✅</span>
  <span>订单已成功提交，订单号为 #12345。</span>
</div>
```

### 5.4 警告状态 Alert

```html
<div
  role="alert"
  class="alert alert-warning">
  <span>⚠️</span>
  <div>
    <h3>库存不足</h3>
    <p>您选择的商品仅剩 3 件，建议您尽快下单。</p>
  </div>
</div>
```

### 5.5 动态添加 Alert 示例

```html
<form
  id="contact-form"
  class="space-y-4">
  <div>
    <label for="email">电子邮件</label>
    <input
      type="email"
      id="email"
      name="email"
      required />
  </div>
  <button
    type="submit"
    class="btn btn-primary">
    提交
  </button>
</form>

<template id="alert-success-template">
  <div
    role="alert"
    class="alert alert-success">
    <span>✅</span>
    <span>表单提交成功！我们将在 24 小时内回复您。</span>
  </div>
</template>

<template id="alert-error-template">
  <div
    role="alert"
    class="alert alert-error">
    <span>❌</span>
    <span>请输入有效的电子邮件地址。</span>
  </div>
</template>

<div id="form-feedback"></div>

<script>
  document
    .getElementById('contact-form')
    .addEventListener('submit', function (e) {
      e.preventDefault();
      const feedback = document.getElementById('form-feedback');
      const email = document.getElementById('email').value;

      feedback.innerHTML = '';

      if (!email.includes('@')) {
        const template = document.getElementById('alert-error-template');
        feedback.appendChild(template.content.cloneNode(true));
      } else {
        const template = document.getElementById('alert-success-template');
        feedback.appendChild(template.content.cloneNode(true));
      }
    });
</script>
```

## 六、最佳实践

### 6.1 语义化结构与内容

Alert 组件应该使用语义化的 HTML 结构来构建内容。Alert 中可以包含段落、列表、链接等元素，以提供更丰富的信息。然而，需要注意的是，Alert 的内容应该保持简洁明了，避免包含过多复杂信息。如果需要展示更详细的信息，可以考虑提供链接引导用户查看更多内容。

```html
<!-- 推荐：简洁明了的 Alert -->
<div role="alert">
  <p>您的密码将在 7 天后过期。<a href="/settings/security">立即更改</a></p>
</div>

<!-- 推荐：包含多个相关信息的 Alert -->
<div role="alert">
  <p><strong>验证失败：</strong></p>
  <ul>
    <li>验证码已过期，请重新获取。</li>
    <li>请在 5 分钟内完成验证。</li>
  </ul>
</div>
```

### 6.2 视觉样式设计

Alert 组件的视觉样式应该能够清晰传达其重要性和类型。常见的做法是使用颜色编码来表示不同类型的 Alert：红色表示错误或危险，黄色或橙色表示警告，绿色表示成功，蓝色表示信息性通知。此外，Alert 应该有足够的视觉权重来吸引用户注意，但不应该过于突兀以至于干扰用户的工作流程。

```css
/* Alert 基础样式 */
[role='alert'] {
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

/* 错误状态 */
[role='alert'].alert-error {
  background-color: #fef2f2;
  border: 1px solid red;
  color: red;
}

/* 成功状态 */
[role='alert'].alert-success {
  background-color: #f0fdf4;
  border: 1px solid green;
  color: green;
}

/* 警告状态 */
[role='alert'].alert-warning {
  background-color: #fffbeb;
  border: 1px solid orange;
  color: orange;
}

/* 信息状态 */
[role='alert'].alert-info {
  background-color: #eff6ff;
  border: 1px solid blue;
  color: blue;
}
```

### 6.3 避免自动消失

应避免设计会自动消失的 Alert 组件。如果 Alert 在用户阅读之前就消失了，会导致信息传达不完整，特别是对于阅读速度较慢的用户或者需要更多时间理解信息的用户。如果业务场景确实需要 Alert 自动消失，应该提供足够长的显示时间（通常不少于 10 秒），并且确保用户有足够的时间阅读和理解信息。

```html
<!-- 不推荐：自动消失的 Alert -->
<div
  role="alert"
  class="alert autohide">
  保存成功！
</div>

<!-- 推荐：手动关闭的 Alert -->
<div
  role="alert"
  class="alert">
  <span>保存成功！</span>
  <button
    type="button"
    class="close-btn"
    aria-label="关闭">
    ×
  </button>
</div>
```

### 6.4 控制 Alert 频率

频繁触发的 Alert 会严重干扰用户体验，特别是对于有认知障碍的用户。每次 Alert 的出现都会打断用户的工作流程，过于频繁的中断会导致用户无法集中注意力完成任务。因此，在设计系统时应该谨慎控制 Alert 的触发频率，确保只有真正重要的信息才会触发通知。

```javascript
// 不推荐：每次输入都触发 Alert
input.addEventListener('input', function () {
  showAlert('正在保存...');
});

// 推荐：防抖处理，减少 Alert 频率
let saveTimeout;
input.addEventListener('input', function () {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    showAlert('自动保存完成');
  }, 1000);
});
```

## 七、Alert 与 Alert Dialog 的区别

理解 [Alert][0] 和 [Alert Dialog][4] 的区别对于正确选择通知组件至关重要。虽然两者都是用于传达重要信息，但它们服务于不同的目的和使用场景。

Alert 是一种被动通知组件，它不需要用户进行任何交互操作。Alert 会在不被中断用户工作流程的前提下自动通知用户重要信息。用户可以继续当前的工作，Alert 只是在视觉和听觉上提供通知。这种设计适用于不紧急、不需要用户立即响应的信息，例如操作成功确认、后台处理完成通知等。

[Alert Dialog][4] 则是一种需要用户主动响应的对话框组件。当用户需要做出决定或者提供确认时，应该使用 Alert Dialog。Alert Dialog 会中断用户的工作流程，获取键盘焦点，要求用户必须与之交互才能继续其他操作。这种设计适用于紧急警告、确认删除操作、放弃更改确认等需要用户明确响应的场景。

## 八、总结

构建无障碍的 Alert 组件需要关注角色声明、视觉样式和触发时机三个层面的细节。从 ARIA 属性角度，只需将 role 属性设置为 alert 即可满足基本要求。从视觉设计角度，应该使用明确的颜色编码和足够的视觉权重来传达不同类型的通知。从用户体验角度，应该避免自动消失的 Alert，并控制 Alert 的触发频率以避免过度干扰。

WAI-ARIA [Alert Pattern][0] 为我们提供了清晰的指导方针，遵循这些规范能够帮助我们创建更加包容和易用的 Web 应用。每一个正确实现的 Alert 组件，都是提升用户体验和确保信息有效传达的重要一步。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/alert/
[1]: https://www.w3.org/TR/wai-aria-1.2/#alert
[2]: https://www.w3.org/TR/wai-aria-1.2/#aria-live
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-atomic
[4]: https://www.w3.org/WAI/ARIA/apg/practices/alert-dialog/
