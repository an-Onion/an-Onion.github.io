# Spinbutton Pattern 详解：构建无障碍数字输入控件

Spinbutton（旋转按钮，也称为 **Number Input**、**Stepper**、**Numeric Spinner** 或 **Counter**）是一种输入控件，用于在预定义范围内选择离散数值。本文基于 [W3C WAI-ARIA Spinbutton Pattern][0] 规范，详解如何构建无障碍的数字输入组件。

## 一、Spinbutton 的定义与核心概念

### 1.1 什么是 Spinbutton

Spinbutton 是一种**受限的数字输入控件**，具有以下特征：

- 值被限制在**一组或一个范围内的离散值**
- 通常包含三个组件：
  - **文本输入框**：显示当前值，通常是唯一可聚焦的组件
  - **增加按钮**：用于增加数值
  - **减少按钮**：用于减少数值
- 支持**直接编辑**和**按钮调整**两种方式
- 支持**小步长**和**大步长**调整

### 1.2 核心术语

| 术语                | 说明                       |
| ------------------- | -------------------------- |
| **Text Field**      | 显示当前值的文本输入框     |
| **Increase Button** | 增加数值的按钮             |
| **Decrease Button** | 减少数值的按钮             |
| **Small Step**      | 小步长调整（如按 1 增减）  |
| **Large Step**      | 大步长调整（如按 10 增减） |
| **Valid Value**     | 允许范围内的有效值         |

```plain
┌─────────────────────────────────────────────────────────────┐
│                      Spinbutton Container                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  ┌─────────────────┐  ┌──────┐  ┌──────┐            │    │
│  │  │                 │  │  ▲   │  │  ▼   │            │    │
│  │  │   Value: 30     │  │  +   │  │  -   │            │    │
│  │  │                 │  │      │  │      │            │    │
│  │  └─────────────────┘  └──────┘  └──────┘            │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  role="spinbutton"                          │    │    │
│  │  │  aria-valuenow="30"                         │    │    │
│  │  │  aria-valuemin="0"                          │    │    │
│  │  │  aria-valuemax="100"                        │    │    │
│  │  │  aria-label="Quantity"                      │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Keyboard: ↑↓ (±1) | Page Up/Down (±10) | Home/End (Min/Max)│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 典型应用场景

- **数量选择器**：购物车商品数量、酒店预订人数
- **时间选择器**：小时、分钟选择
- **日期选择器**：日、月、年选择
- **数值调节**：音量控制、亮度调节
- **评分输入**：1-5 星评分

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

Spinbutton 使用 [`role="spinbutton"`][2] 标记。

```html
<input
  type="text"
  role="spinbutton"
  aria-label="数量"
  aria-valuenow="1"
  aria-valuemin="0"
  aria-valuemax="10"
  value="1" />
```

### 2.2 必需属性

| 属性                                        | 说明               | 示例值 |
| ------------------------------------------- | ------------------ | ------ |
| [`role="spinbutton"`][2]                    | 标记为旋转按钮角色 | -      |
| [`aria-valuenow`][3]                        | 当前值             | "1"    |
| [`aria-valuemin`][4]                        | 最小值（如果有）   | "0"    |
| [`aria-valuemax`][5]                        | 最大值（如果有）   | "10"   |
| [`aria-label`][6] 或 [`aria-labelledby`][6] | 可访问标签         | "数量" |

### 2.3 可选属性

| 属性                  | 说明             | 示例值           |
| --------------------- | ---------------- | ---------------- |
| [`aria-valuetext`][7] | 用户友好的值描述 | "Monday"         |
| [`aria-invalid`][8]   | 值是否无效       | "true" / "false" |

### 2.4 属性详解

#### aria-valuetext

当 [`aria-valuenow`][3] 的值不够友好时，使用 [`aria-valuetext`][7] 提供更易理解的描述：

```html
<!-- 星期选择器：数值 1 显示为 "Monday" -->
<input
  type="text"
  role="spinbutton"
  aria-label="星期"
  aria-valuenow="1"
  aria-valuemin="1"
  aria-valuemax="7"
  aria-valuetext="Monday"
  value="Monday" />
```

#### aria-invalid

当值超出允许范围时，设置 [`aria-invalid="true"`][8]：

```html
<input
  type="text"
  role="spinbutton"
  aria-label="数量"
  aria-valuenow="15"
  aria-valuemin="0"
  aria-valuemax="10"
  aria-invalid="true"
  value="15" />
```

**注意**：大多数实现会阻止输入无效值，但在某些场景下可能无法完全阻止。

## 三、键盘交互规范

### 3.1 基本键盘交互

| 按键                  | 功能               |
| --------------------- | ------------------ |
| **↑ Up Arrow**        | 增加数值（小步长） |
| **↓ Down Arrow**      | 减少数值（小步长） |
| **Home**              | 设置值为最小值     |
| **End**               | 设置值为最大值     |
| **Page Up**（可选）   | 增加数值（大步长） |
| **Page Down**（可选） | 减少数值（大步长） |

### 3.2 文本编辑键盘交互

如果文本框允许直接编辑，还支持以下标准单行文本编辑键：

- **可打印字符**：在文本框中输入字符
- **光标移动键**：左右箭头、Home、End
- **选择键**：Shift + 方向键
- **文本操作键**：复制、粘贴、删除等

**重要提示**：确保 JavaScript 不干扰浏览器提供的文本编辑功能。

### 3.3 焦点行为

- 操作过程中**焦点始终保持在文本框**
- 不需要将焦点移到增减按钮上

## 四、实现方式

### 4.1 基础 Spinbutton 结构

```html
<div class="spinbutton-container">
  <label for="quantity">数量</label>
  <div class="spinbutton-wrapper">
    <input
      type="text"
      id="quantity"
      class="spinbutton"
      role="spinbutton"
      aria-label="数量"
      aria-valuenow="1"
      aria-valuemin="0"
      aria-valuemax="10"
      value="1" />
    <div class="spinbutton-buttons">
      <button
        type="button"
        class="spinbutton-up"
        aria-label="增加"
        tabindex="-1">
        ▲
      </button>
      <button
        type="button"
        class="spinbutton-down"
        aria-label="减少"
        tabindex="-1">
        ▼
      </button>
    </div>
  </div>
</div>
```

### 4.2 JavaScript 实现

```javascript
class Spinbutton {
  constructor(element) {
    this.input = element;
    this.min = parseFloat(this.input.getAttribute('aria-valuemin')) || 0;
    this.max = parseFloat(this.input.getAttribute('aria-valuemax')) || 100;
    this.smallStep = 1;
    this.largeStep = 10;

    this.init();
  }

  init() {
    // 键盘事件
    this.input.addEventListener('keydown', this.handleKeyDown.bind(this));

    // 直接编辑
    this.input.addEventListener('change', this.handleChange.bind(this));
    this.input.addEventListener('blur', this.handleBlur.bind(this));

    // 按钮点击
    const container = this.input.closest('.spinbutton-wrapper');
    const upButton = container.querySelector('.spinbutton-up');
    const downButton = container.querySelector('.spinbutton-down');

    if (upButton) {
      upButton.addEventListener('click', () => this.increment(this.smallStep));
    }
    if (downButton) {
      downButton.addEventListener('click', () =>
        this.decrement(this.smallStep),
      );
    }
  }

  handleKeyDown(e) {
    const currentValue =
      parseFloat(this.input.getAttribute('aria-valuenow')) || 0;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.increment(this.smallStep);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.decrement(this.smallStep);
        break;
      case 'PageUp':
        e.preventDefault();
        this.increment(this.largeStep);
        break;
      case 'PageDown':
        e.preventDefault();
        this.decrement(this.largeStep);
        break;
      case 'Home':
        e.preventDefault();
        this.setValue(this.min);
        break;
      case 'End':
        e.preventDefault();
        this.setValue(this.max);
        break;
    }
  }

  handleChange() {
    const value = parseFloat(this.input.value);
    if (!isNaN(value)) {
      this.setValue(value);
    }
  }

  handleBlur() {
    // 失去焦点时验证并修正值
    const value = parseFloat(this.input.value);
    if (isNaN(value)) {
      this.setValue(this.min);
    } else {
      this.setValue(value);
    }
  }

  increment(step) {
    const currentValue =
      parseFloat(this.input.getAttribute('aria-valuenow')) || 0;
    this.setValue(currentValue + step);
  }

  decrement(step) {
    const currentValue =
      parseFloat(this.input.getAttribute('aria-valuenow')) || 0;
    this.setValue(currentValue - step);
  }

  setValue(value) {
    // 限制在范围内
    value = Math.max(this.min, Math.min(this.max, value));

    // 更新 ARIA 属性
    this.input.setAttribute('aria-valuenow', value);

    // 更新显示值
    this.input.value = value;

    // 更新有效性状态
    const isValid = value >= this.min && value <= this.max;
    this.input.setAttribute('aria-invalid', !isValid);
  }
}

// 初始化
const spinbuttons = document.querySelectorAll('[role="spinbutton"]');
spinbuttons.forEach((spinbutton) => new Spinbutton(spinbutton));
```

### 4.3 带 aria-valuetext 的示例

```javascript
class WeekdaySpinbutton extends Spinbutton {
  constructor(element) {
    super(element);
    this.weekdays = [
      '',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    this.smallStep = 1;
    this.largeStep = 1; // 星期没有大步长
  }

  setValue(value) {
    // 限制在范围内
    value = Math.max(this.min, Math.min(this.max, value));

    // 更新 ARIA 属性
    this.input.setAttribute('aria-valuenow', value);
    this.input.setAttribute('aria-valuetext', this.weekdays[value]);

    // 显示星期名称
    this.input.value = this.weekdays[value];
  }
}
```

## 五、最佳实践

### 5.1 提供清晰的标签

始终为 Spinbutton 提供描述性的标签：

```html
<!-- 好的示例 -->
<label for="adults">成人数量</label>
<input
  type="text"
  id="adults"
  role="spinbutton"
  aria-label="成人数量"
  ... />

<!-- 不好的示例 -->
<input
  type="text"
  role="spinbutton"
  ... />
```

### 5.2 设置合理的范围

根据实际场景设置最小值和最大值：

```html
<!-- 好的示例：酒店预订成人数量 -->
<input
  type="text"
  role="spinbutton"
  aria-label="成人数量"
  aria-valuemin="1"
  aria-valuemax="10"
  ... />

<!-- 不好的示例：没有限制 -->
<input
  type="text"
  role="spinbutton"
  ... />
```

### 5.3 使用 aria-valuetext 增强可读性

当数值不够直观时，使用 [`aria-valuetext`][7]：

```html
<!-- 好的示例：月份选择 -->
<input
  type="text"
  role="spinbutton"
  aria-label="月份"
  aria-valuenow="1"
  aria-valuemin="1"
  aria-valuemax="12"
  aria-valuetext="January"
  value="January" />
```

### 5.4 验证用户输入

阻止无效字符输入，或在失去焦点时修正值：

```javascript
// 阻止非数字输入
spinbutton.addEventListener('keypress', (e) => {
  if (!/\d/.test(e.key)) {
    e.preventDefault();
  }
});

// 失去焦点时验证
spinbutton.addEventListener('blur', () => {
  const value = parseInt(spinbutton.value);
  if (isNaN(value) || value < min || value > max) {
    // 修正为有效值
    setValue(Math.max(min, Math.min(max, value || min)));
  }
});
```

### 5.5 考虑移动端体验

在移动设备上，考虑使用数字键盘：

```html
<input
  type="number"
  inputmode="numeric"
  pattern="[0-9]*"
  role="spinbutton"
  ... />
```

### 5.6 提供视觉反馈

- 无效值时显示错误状态
- 焦点状态清晰可见
- 按钮悬停效果

```css
[role='spinbutton'][aria-invalid='true'] {
  border-color: #ef4444;
  background-color: #fef2f2;
}

[role='spinbutton']:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

## 六、常见错误

### 6.1 忘记设置 aria-valuenow

```html
<!-- 错误 -->
<input
  type="text"
  role="spinbutton"
  value="5" />

<!-- 正确 -->
<input
  type="text"
  role="spinbutton"
  aria-valuenow="5"
  value="5" />
```

### 6.2 按钮可聚焦

```html
<!-- 错误：按钮不应该可聚焦 -->
<button class="spinbutton-up">▲</button>

<!-- 正确：按钮设置 tabindex="-1" -->
<button
  class="spinbutton-up"
  tabindex="-1">
  ▲
</button>
```

### 6.3 忽略键盘交互

只实现按钮点击，不实现键盘支持（方向键、Home/End）。

### 6.4 不验证输入值

允许用户输入超出范围的值或无效字符。

## 七、Spinbutton vs 其他输入控件

### 7.1 Spinbutton vs Slider

| 特性         | Spinbutton       | Slider             |
| ------------ | ---------------- | ------------------ |
| **输入方式** | 键盘输入 + 按钮  | 拖拽滑块           |
| **适用场景** | 精确数值、离散值 | 连续范围、粗略选择 |
| **精度**     | 高               | 中等               |
| **典型用例** | 数量、时间       | 音量、亮度         |

### 7.2 Spinbutton vs 普通文本输入

| 特性         | Spinbutton       | 普通文本输入 |
| ------------ | ---------------- | ------------ |
| **值限制**   | 有最小/最大值    | 无限制       |
| **步长调整** | 支持             | 不支持       |
| **辅助技术** | 读出当前值和范围 | 只读出文本   |
| **典型用例** | 年龄、评分       | 姓名、地址   |

## 八、总结

构建无障碍的 Spinbutton 组件需要关注：

1. **正确的角色**：使用 `role="spinbutton"`
2. **必需的属性**：[`aria-valuenow`][3]、[ `aria-valuemin`][4]、[ `aria-valuemax`][5]、[ `aria-label`][6]
3. **可选属性**：[`aria-valuetext`][7]、[ `aria-invalid`][8]
4. **完整的键盘支持**：方向键调整、Page Up/Down 大步长、Home/End 快捷键
5. **直接编辑支持**：允许用户直接输入值
6. **输入验证**：阻止无效字符，修正超出范围的值
7. **清晰的标签**：帮助用户理解控件用途
8. **按钮不可聚焦**：只有文本框可聚焦

遵循 [W3C Spinbutton Pattern][0] 规范，我们能够创建既实用又无障碍的数字输入控件，为所有用户提供便捷的数值选择体验。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#spinbutton
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuenow
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuemin
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuemax
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
[7]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuetext
[8]: https://www.w3.org/TR/wai-aria-1.2/#aria-invalid
