# Radio Pattern 详解：构建无障碍单选按钮组件

单选按钮（Radio Button）是表单中用于从一组互斥选项中选择单个项目的控件。本文基于 [W3C WAI-ARIA Radio Pattern][0] 规范，详解如何构建无障碍的单选按钮组件。

## 一、Radio 的定义与核心概念

单选按钮允许用户从一组相关但互斥的选项中选择**一个且仅一个**选项。当用户选择一个选项时，同组中之前被选中的选项会自动取消选中。

### 1.1 核心特性

- **互斥性**：同一组内只能有一个选项被选中
- **预设选中**：通常有一个选项默认被选中
- **分组依赖**：通过相同的 `name` 属性（HTML）或 `aria-label`（ARIA）进行分组

### 1.2 与 Checkbox 的区别

| 特性     | Radio            | Checkbox     |
| -------- | ---------------- | ------------ |
| 选择数量 | 单选             | 可多选       |
| 互斥性   | 同组互斥         | 独立         |
| 默认状态 | 通常预设一个选中 | 可全部未选中 |
| 键盘导航 | 方向键切换       | Tab 切换     |

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

单选按钮具有 [`role="radio"`][2]。

### 2.2 状态属性

- [`aria-checked="true"`][3]：单选按钮被选中
- [`aria-checked="false"`][3]：单选按钮未被选中

### 2.3 分组属性

单选按钮必须分组，以便辅助技术理解它们之间的关系：

- 使用 [`role="radiogroup"`][4] 包裹一组单选按钮
- 使用 [`aria-labelledby`][5] 引用组标签的 ID
- 或使用 [`aria-label`][5] 直接设置组的标签

```html
<div
  role="radiogroup"
  aria-labelledby="group-label">
  <h3 id="group-label">选择支付方式</h3>
  <div
    role="radio"
    aria-checked="true"
    tabindex="0">
    信用卡
  </div>
  <div
    role="radio"
    aria-checked="false"
    tabindex="-1">
    支付宝
  </div>
  <div
    role="radio"
    aria-checked="false"
    tabindex="-1">
    微信支付
  </div>
</div>
```

### 2.4 可访问标签

每个单选按钮的可访问标签可以通过以下方式提供：

- **可见文本内容**：直接包含在具有 `role="radio"` 的元素内的文本
- **`aria-labelledby`**：引用包含标签文本的元素的 ID
- **`aria-label`**：直接在单选按钮元素上设置标签文本

### 2.5 描述属性

如果包含额外的描述性静态文本，使用 [`aria-describedby`][6]：

```html
<div
  role="radio"
  aria-checked="false"
  aria-describedby="option-desc">
  高级会员
</div>
<p id="option-desc">包含所有高级功能，每月 99 元</p>
```

## 三、键盘交互规范

### 3.1 基本键盘操作

当单选按钮获得焦点时：

| 按键  | 功能                                                                                 |
| ----- | ------------------------------------------------------------------------------------ |
| Space | 如果焦点在未选中的单选按钮上，选中该按钮（取消选中同组其他按钮）                     |
| Tab   | 将焦点移动到组内的选中单选按钮；如果组内没有选中按钮，将焦点移动到组内第一个单选按钮 |

### 3.2 方向键导航（可选但推荐）

| 按键                     | 功能                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Down Arrow / Right Arrow | 将焦点移动到下一个单选按钮，并选中它；如果焦点在最后一个按钮上，将焦点移动到第一个按钮 |
| Up Arrow / Left Arrow    | 将焦点移动到上一个单选按钮，并选中它；如果焦点在第一个按钮上，将焦点移动到最后一个按钮 |

## 四、实现方式

### 4.1 原生 HTML 实现（推荐）

原生 HTML `<input type="radio">` 提供完整的无障碍支持：

```html
<fieldset>
  <legend>选择性别</legend>
  <label>
    <input
      type="radio"
      name="gender"
      value="male"
      checked />
    男
  </label>
  <label>
    <input
      type="radio"
      name="gender"
      value="female" />
    女
  </label>
  <label>
    <input
      type="radio"
      name="gender"
      value="other" />
    其他
  </label>
</fieldset>
```

### 4.2 ARIA 实现（自定义样式）

```html
<div
  role="radiogroup"
  aria-labelledby="payment-label">
  <h3 id="payment-label">选择支付方式</h3>

  <div
    role="radio"
    aria-checked="true"
    tabindex="0"
    onclick="selectRadio(this)"
    onkeydown="handleKeydown(event, this)">
    <span
      class="radio-icon"
      aria-hidden="true"></span>
    信用卡
  </div>

  <div
    role="radio"
    aria-checked="false"
    tabindex="-1"
    onclick="selectRadio(this)"
    onkeydown="handleKeydown(event, this)">
    <span
      class="radio-icon"
      aria-hidden="true"></span>
    支付宝
  </div>

  <div
    role="radio"
    aria-checked="false"
    tabindex="-1"
    onclick="selectRadio(this)"
    onkeydown="handleKeydown(event, this)">
    <span
      class="radio-icon"
      aria-hidden="true"></span>
    微信支付
  </div>
</div>

<script>
  function selectRadio(selectedRadio) {
    const radioGroup = selectedRadio.closest('[role="radiogroup"]');
    const radios = radioGroup.querySelectorAll('[role="radio"]');

    radios.forEach((radio) => {
      const isSelected = radio === selectedRadio;
      radio.setAttribute('aria-checked', isSelected);
      radio.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
  }

  function handleKeydown(event, radio) {
    const radioGroup = radio.closest('[role="radiogroup"]');
    const radios = Array.from(radioGroup.querySelectorAll('[role="radio"]'));
    const currentIndex = radios.indexOf(radio);

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % radios.length;
        radios[nextIndex].focus();
        selectRadio(radios[nextIndex]);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + radios.length) % radios.length;
        radios[prevIndex].focus();
        selectRadio(radios[prevIndex]);
        break;
      case ' ':
        event.preventDefault();
        selectRadio(radio);
        break;
    }
  }
</script>
```

### 4.3 水平布局的单选按钮组

```html
<fieldset class="radio-group-horizontal">
  <legend>选择评分</legend>
  <div class="radio-options">
    <label class="radio-label">
      <input
        type="radio"
        name="rating"
        value="1" />
      <span>1 星</span>
    </label>
    <label class="radio-label">
      <input
        type="radio"
        name="rating"
        value="2" />
      <span>2 星</span>
    </label>
    <label class="radio-label">
      <input
        type="radio"
        name="rating"
        value="3"
        checked />
      <span>3 星</span>
    </label>
    <label class="radio-label">
      <input
        type="radio"
        name="rating"
        value="4" />
      <span>4 星</span>
    </label>
    <label class="radio-label">
      <input
        type="radio"
        name="rating"
        value="5" />
      <span>5 星</span>
    </label>
  </div>
</fieldset>
```

### 4.4 带描述的选项

```html
<fieldset
  role="radiogroup"
  aria-labelledby="plan-label">
  <legend id="plan-label">选择套餐</legend>

  <label class="radio-card">
    <input
      type="radio"
      name="plan"
      value="basic"
      checked />
    <div class="radio-content">
      <strong>基础版</strong>
      <span class="price">¥29/月</span>
      <p class="description">适合个人用户，包含基础功能</p>
    </div>
  </label>

  <label class="radio-card">
    <input
      type="radio"
      name="plan"
      value="pro" />
    <div class="radio-content">
      <strong>专业版</strong>
      <span class="price">¥99/月</span>
      <p class="description">适合小型团队，包含高级功能</p>
    </div>
  </label>

  <label class="radio-card">
    <input
      type="radio"
      name="plan"
      value="enterprise" />
    <div class="radio-content">
      <strong>企业版</strong>
      <span class="price">¥299/月</span>
      <p class="description">适合大型企业，包含全部功能</p>
    </div>
  </label>
</fieldset>
```

## 五、常见应用场景

### 5.1 性别选择

```html
<fieldset>
  <legend>性别</legend>
  <label
    ><input
      type="radio"
      name="gender"
      value="male" />
    男</label
  >
  <label
    ><input
      type="radio"
      name="gender"
      value="female" />
    女</label
  >
  <label
    ><input
      type="radio"
      name="gender"
      value="other" />
    其他</label
  >
  <label
    ><input
      type="radio"
      name="gender"
      value="secret"
      checked />
    保密</label
  >
</fieldset>
```

### 5.2 支付方式选择

```html
<fieldset>
  <legend>选择支付方式</legend>
  <label class="payment-option">
    <input
      type="radio"
      name="payment"
      value="credit-card"
      checked />
    <img
      src="credit-card-icon.svg"
      alt="" />
    信用卡
  </label>
  <label class="payment-option">
    <input
      type="radio"
      name="payment"
      value="alipay" />
    <img
      src="alipay-icon.svg"
      alt="" />
    支付宝
  </label>
  <label class="payment-option">
    <input
      type="radio"
      name="payment"
      value="wechat" />
    <img
      src="wechat-icon.svg"
      alt="" />
    微信支付
  </label>
</fieldset>
```

### 5.3 主题切换

```html
<fieldset class="theme-selector">
  <legend>选择主题</legend>
  <div class="theme-options">
    <label class="theme-option">
      <input
        type="radio"
        name="theme"
        value="light"
        checked />
      <span class="theme-preview light"></span>
      浅色
    </label>
    <label class="theme-option">
      <input
        type="radio"
        name="theme"
        value="dark" />
      <span class="theme-preview dark"></span>
      深色
    </label>
    <label class="theme-option">
      <input
        type="radio"
        name="theme"
        value="auto" />
      <span class="theme-preview auto"></span>
      跟随系统
    </label>
  </div>
</fieldset>
```

## 六、最佳实践

### 6.1 优先使用原生单选按钮

原生 HTML `<input type="radio">` 提供完整的无障碍支持，包括：

- 自动键盘交互（方向键导航）
- 自动互斥选择
- 屏幕阅读器自动播报状态
- 浏览器原生样式和焦点管理

### 6.2 始终设置默认选中

为避免用户忘记选择，通常应该预设一个默认选项：

```html
<!-- 推荐：预设默认选项 -->
<fieldset>
  <legend>选择语言</legend>
  <label
    ><input
      type="radio"
      name="language"
      value="zh"
      checked />
    中文</label
  >
  <label
    ><input
      type="radio"
      name="language"
      value="en" />
    English</label
  >
</fieldset>
```

### 6.3 使用 fieldset 和 legend 分组

始终使用 `<fieldset>` 和 `<legend>` 对单选按钮进行语义化分组：

```html
<fieldset>
  <legend>选择尺寸</legend>
  <label
    ><input
      type="radio"
      name="size"
      value="s" />
    S</label
  >
  <label
    ><input
      type="radio"
      name="size"
      value="m"
      checked />
    M</label
  >
  <label
    ><input
      type="radio"
      name="size"
      value="l" />
    L</label
  >
  <label
    ><input
      type="radio"
      name="size"
      value="xl" />
    XL</label
  >
</fieldset>
```

### 6.4 提供清晰的视觉指示

确保选中和未选中状态有清晰的视觉区别：

```css
/* 自定义单选按钮样式 */
input[type='radio'] {
  width: 20px;
  height: 20px;
  accent-color: #005a9c;
}

input[type='radio']:focus {
  outline: 2px solid #005a9c;
  outline-offset: 2px;
}
```

### 6.5 避免嵌套交互元素

不要在单选按钮标签内嵌套其他交互元素：

```html
<!-- 不推荐 -->
<label>
  <input
    type="radio"
    name="option"
    value="a" />
  选项 A <a href="/details">查看详情</a>
</label>

<!-- 推荐 -->
<div>
  <label>
    <input
      type="radio"
      name="option"
      value="a" />
    选项 A
  </label>
  <a href="/details">查看详情</a>
</div>
```

### 6.6 考虑移动端触摸区域

确保单选按钮有足够的触摸区域（至少 44x44px）：

```css
.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  min-height: 44px;
}
```

## 七、Radio 与 Select 的选择

| 场景             | 推荐组件 | 原因                   |
| ---------------- | -------- | ---------------------- |
| 选项少于 5 个    | Radio    | 所有选项可见，便于比较 |
| 选项多于 7 个    | Select   | 节省空间，避免认知负担 |
| 需要显示选项详情 | Radio    | 可以展示描述信息       |
| 空间受限         | Select   | 下拉菜单更紧凑         |
| 频繁切换         | Radio    | 减少点击次数           |

## 八、总结

构建无障碍的单选按钮组件需要关注三个核心：正确的语义化分组（`<fieldset>` 和 `<legend>`）、清晰的选中状态指示、以及良好的键盘导航支持（方向键切换）。与 Checkbox 不同，Radio 强调互斥选择，适用于需要从一组选项中精确选择单一项目的场景。

遵循 [W3C Radio Pattern][0] 规范，我们能够创建既美观又包容的单选按钮组件，为不同能力的用户提供一致的体验。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#radio
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-checked
[4]: https://www.w3.org/TR/wai-aria-1.2/#radiogroup
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-describedby
