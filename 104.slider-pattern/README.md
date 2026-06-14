# Slider Pattern 详解：单滑块与多滑块的无障碍实现

Slider（滑块）是一种用于**在给定范围内选择值**的输入组件，通过滑块的滑块（thumb）位置来表示当前值和可选范围。本文基于 [W3C WAI-ARIA Slider Pattern][0] 和 [Slider Multi-Thumb Pattern][1] 规范，详解单滑块与多滑块组件的无障碍实现。

## 一、Slider 的定义与核心概念

### 1.1 什么是 Slider

Slider 是一种**范围选择控件**，具有以下特征：

- 通过滑块的**位置**表示当前值
- 通过滑块的**大小和范围**表示可选值范围
- 用户可以通过**拖拽、点击轨道或键盘**调整值
- 适用于音量控制、亮度调节、价格范围筛选等场景

### 1.2 核心术语

| 术语        | 说明                         |
| ----------- | ---------------------------- |
| **Track**   | 滑块的轨道，表示可选值范围   |
| **Thumb**   | 滑块的可拖拽部分，代表当前值 |
| **Value**   | 当前选中的值                 |
| **Min/Max** | 最小值和最大值               |

```plain
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  0                               100                │    │
│  │  ├───────────────────────────────┤                  │    │
│  │                  ↑                                  │    │
│  │               ┌─────┐                               │    │
│  │               │thumb│                               │    │
│  │               └─────┘                               │    │
│  │                                                     │    │
│  │  aria-valuenow: 50                                  │    │
│  │  aria-valuemin: 0                                   │    │
│  │  aria-valuemax: 100                                 │    │
│  │                                                     │    │
│  │  ← → ↑ ↓ : Adjust Value                             │    │
│  │  Home: Min Value  |  End: Max Value                 │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Slider 的两种模式

| 模式                      | 说明                 | 典型用例       |
| ------------------------- | -------------------- | -------------- |
| **单滑块（Slider）**      | 单个滑块选择一个值   | 音量控制、评分 |
| **多滑块（Multi-Thumb）** | 多个滑块选择一个范围 | 价格区间筛选   |

### 1.4 原生 HTML vs ARIA Slider

| 特性         | 原生 `<input type="range">` | ARIA `role="slider"`           |
| ------------ | --------------------------- | ------------------------------ |
| **可访问性** | 内置，无需额外 ARIA         | 需要手动添加 ARIA 属性         |
| **样式控制** | CSS 样式有限                | 完全自定义样式                 |
| **复杂性**   | 简单                        | 需要 JavaScript 管理           |
| **推荐度**   | **优先使用**                | 仅在样式需求超出原生能力时使用 |

**推荐**：优先使用原生 `<input type="range">`，只有在设计需求超出原生样式能力时才使用 ARIA Slider。

## 二、Slider Pattern（单滑块）

### 2.1 ARIA 角色与属性

#### 必需属性

| 属性                 | 说明         | 示例值 |
| -------------------- | ------------ | ------ |
| [`role="slider"`][2] | 标记滑块组件 | -      |
| [`aria-valuenow`][3] | 当前值       | 50     |
| [`aria-valuemin`][4] | 最小值       | 0      |
| [`aria-valuemax`][5] | 最大值       | 100    |

#### 可选属性

| 属性                    | 说明             | 示例值                           |
| ----------------------- | ---------------- | -------------------------------- |
| [`aria-valuetext`][6]   | 人类可读的值文本 | "中等"                           |
| [`aria-label`][7]       | 无障碍标签       | "音量"                           |
| [`aria-labelledby`][8]  | 引用标签元素     | "volume-label"                   |
| [`aria-orientation`][9] | 方向             | "horizontal"（默认）, "vertical" |
| [`aria-readonly`][10]   | 只读状态         | true/false                       |

### 2.2 键盘交互规范

| 按键                            | 功能                   |
| ------------------------------- | ---------------------- |
| **Right Arrow** / **Up Arrow**  | 增加一个步进值         |
| **Left Arrow** / **Down Arrow** | 减少一个步进值         |
| **Home**                        | 设置为最小值           |
| **End**                         | 设置为最大值           |
| **Page Up**（可选）             | 按大步进增加（如 10%） |
| **Page Down**（可选）           | 按大步进减少（如 10%） |

### 2.3 垂直 Slider 导航

```plain
┌─────────────────────────────────────┐
│                                     │
│         Max: 100                    │
│              │                      │
│              │                      │
│              │                      │
│              │                      │
│         ┌────┼────┐                 │
│         │   50    │                 │
│         └────┼────┘                 │
│              │                      │
│              │                      │
│              │                      │
│              │                      │
│         Min: 0                      │
│                                     │
│  aria-orientation: "vertical"       │
│                                     │
│  ↑: Increase  |  ↓: Decrease        │
│                                     │
└─────────────────────────────────────┘
```

## 三、Slider Multi-Thumb Pattern（多滑块）

### 3.1 什么是多滑块

多滑块是 **Slider Pattern 的扩展**，包含**两个或多个滑块**，通常用于选择**值范围**。

```plain
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  $0        $100      $200      $300      $400       │    │
│  │  ├──────────┼─────────────────┼──────────┤          │    │
│  │             ↑                 ↑                     │    │
│  │          ┌─────────┐     ┌─────────┐                │    │
│  │          │Min Thumb│     │Max Thumb│                │    │
│  │          └─────────┘     └─────────┘                │    │
│  │                                                     │    │
│  │  Range: $100 - $300                                 │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 核心特征

- 每个滑块设置**一组相关值中的一个**
- 在双滑块场景中，滑块**通常不允许相互穿过**
- 例如价格区间选择器：最小值滑块受最大值滑块限制，反之亦然
- Tab 顺序**保持不变**，不受滑块值和视觉位置影响

### 3.3 ARIA 角色与属性

多滑块使用与单滑块相同的属性，但需要**特别注意值范围的联动**：

| 属性                  | 说明         | 应用于                 |
| --------------------- | ------------ | ---------------------- |
| [`role="slider"`][2]  | 标记每个滑块 | 每个 thumb 元素        |
| [`aria-valuenow`][3]  | 当前值       | 每个 thumb             |
| [`aria-valuemin`][4]  | 最小值       | 每个 thumb（动态更新） |
| [`aria-valuemax`][5]  | 最大值       | 每个 thumb（动态更新） |
| [`aria-valuetext`][6] | 人类可读文本 | 每个 thumb             |
| [`aria-label`][7]     | 标签         | 每个 thumb             |

#### 值范围联动

当一个滑块的值依赖另一个滑块时，需要**动态更新** `aria-valuemin` 和 `aria-valuemax`：

```javascript
// 示例：价格区间滑块
// 最小值滑块的值不能超过最大值滑块的值
minThumb.setAttribute('aria-valuemax', maxThumbValue);
maxThumb.setAttribute('aria-valuemin', minThumbValue);
```

### 3.4 键盘交互规范

每个滑块具有与单滑块相同的键盘交互：

| 按键                            | 功能           |
| ------------------------------- | -------------- |
| **Right Arrow** / **Up Arrow**  | 增加一个步进值 |
| **Left Arrow** / **Down Arrow** | 减少一个步进值 |
| **Home**                        | 设置为最小值   |
| **End**                         | 设置为最大值   |
| **Page Up**（可选）             | 按大步进增加   |
| **Page Down**（可选）           | 按大步进减少   |

**Tab 顺序规则**：

- 每个滑块都在 Tab 序列中
- Tab 顺序保持不变，**不受滑块值和视觉位置影响**
- 例如：即使最小值滑块移动到右侧，其 Tab 顺序仍然在前

## 四、实现方式

### 4.1 基础 Slider 结构

```html
<div class="slider-container">
  <label for="volume-slider">音量</label>
  <div
    role="slider"
    id="volume-slider"
    class="slider"
    tabindex="0"
    aria-label="音量"
    aria-valuenow="50"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuetext="50%"></div>
</div>
```

### 4.2 JavaScript 实现

```javascript
class Slider {
  constructor(element) {
    this.slider = element;
    this.value = parseFloat(this.slider.getAttribute('aria-valuenow'));
    this.min = parseFloat(this.slider.getAttribute('aria-valuemin'));
    this.max = parseFloat(this.slider.getAttribute('aria-valuemax'));
    this.step = 1;

    this.init();
  }

  init() {
    this.slider.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.slider.addEventListener('mousedown', this.handleMouseDown.bind(this));

    this.updateVisualPosition();
  }

  handleKeyDown(e) {
    let newValue = this.value;
    let handled = false;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = this.value + this.step;
        handled = true;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = this.value - this.step;
        handled = true;
        break;
      case 'Home':
        newValue = this.min;
        handled = true;
        break;
      case 'End':
        newValue = this.max;
        handled = true;
        break;
      case 'PageUp':
        newValue = this.value + this.step * 10;
        handled = true;
        break;
      case 'PageDown':
        newValue = this.value - this.step * 10;
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      this.setValue(newValue);
    }
  }

  handleMouseDown(e) {
    const handleMouseMove = (e) => {
      const rect = this.slider.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newValue = this.min + percent * (this.max - this.min);
      this.setValue(newValue);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  setValue(newValue) {
    // 边界检查
    newValue = Math.max(this.min, Math.min(this.max, newValue));
    // 步进值处理
    newValue = Math.round(newValue / this.step) * this.step;

    if (newValue !== this.value) {
      this.value = newValue;
      this.slider.setAttribute('aria-valuenow', this.value);
      this.updateVisualPosition();
      this.updateValueText();
    }
  }

  updateVisualPosition() {
    const percent = ((this.value - this.min) / (this.max - this.min)) * 100;
    this.slider.style.left = `${percent}%`;
  }

  updateValueText() {
    // 可选：根据值生成人类可读文本
    this.slider.setAttribute('aria-valuetext', `${this.value}%`);
  }
}

// 初始化
document.querySelectorAll('[role="slider"]').forEach((slider) => {
  new Slider(slider);
});
```

### 4.3 多滑块（价格区间）示例

```html
<div class="range-slider">
  <label>价格区间</label>
  <div class="track">
    <div class="range-fill"></div>

    <div
      role="slider"
      class="thumb thumb-min"
      tabindex="0"
      aria-label="最低价格"
      aria-valuenow="100"
      aria-valuemin="0"
      aria-valuemax="400"
      aria-valuetext="$100"></div>

    <div
      role="slider"
      class="thumb thumb-max"
      tabindex="0"
      aria-label="最高价格"
      aria-valuenow="300"
      aria-valuemin="0"
      aria-valuemax="400"
      aria-valuetext="$300"></div>
  </div>
</div>
```

### 4.4 多滑块 JavaScript 实现

```javascript
class RangeSlider {
  constructor(container) {
    this.container = container;
    this.minThumb = container.querySelector('.thumb-min');
    this.maxThumb = container.querySelector('.thumb-max');
    this.track = container.querySelector('.track');
    this.rangeFill = container.querySelector('.range-fill');

    this.minValue = 0;
    this.maxValue = 400;

    this.init();
  }

  init() {
    this.minThumb.addEventListener('keydown', (e) =>
      this.handleKeyDown(e, 'min'),
    );
    this.maxThumb.addEventListener('keydown', (e) =>
      this.handleKeyDown(e, 'max'),
    );

    this.updateRange();
  }

  handleKeyDown(e, thumbType) {
    const thumb = thumbType === 'min' ? this.minThumb : this.maxThumb;
    let value = parseFloat(thumb.getAttribute('aria-valuenow'));
    let newValue = value;
    const step = 10;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = value + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = value - step;
        break;
      case 'Home':
        newValue = this.minValue;
        break;
      case 'End':
        newValue = this.maxValue;
        break;
    }

    // 边界检查：两滑块不能相互穿过
    if (thumbType === 'min') {
      const maxVal = parseFloat(this.maxThumb.getAttribute('aria-valuenow'));
      newValue = Math.max(this.minValue, Math.min(maxVal - step, newValue));
    } else {
      const minVal = parseFloat(this.minThumb.getAttribute('aria-valuenow'));
      newValue = Math.max(minVal + step, Math.min(this.maxValue, newValue));
    }

    if (newValue !== value) {
      e.preventDefault();
      thumb.setAttribute('aria-valuenow', newValue);
      thumb.setAttribute('aria-valuetext', `$${newValue}`);

      // 更新另一个滑块的边界
      if (thumbType === 'min') {
        this.minThumb.setAttribute('aria-valuemax', newValue);
      } else {
        this.maxThumb.setAttribute('aria-valuemin', newValue);
      }

      this.updateRange();
    }
  }

  updateRange() {
    const minVal = parseFloat(this.minThumb.getAttribute('aria-valuenow'));
    const maxVal = parseFloat(this.maxThumb.getAttribute('aria-valuenow'));

    const minPercent = (minVal / this.maxValue) * 100;
    const maxPercent = (maxVal / this.maxValue) * 100;

    this.rangeFill.style.left = `${minPercent}%`;
    this.rangeFill.style.width = `${maxPercent - minPercent}%`;
  }
}

// 初始化
document.querySelectorAll('.range-slider').forEach((container) => {
  new RangeSlider(container);
});
```

## 五、最佳实践

### 5.1 何时使用 Slider

**适合使用 Slider**：

- 选择**超过 7 个**的选项值（如音量 0-100）
- 需要**直观可视化**当前值和范围
- 连续值或较大范围的选择

**不适合使用 Slider**：

- 选择**少于等于 7 个**的选项值（使用 Radio Group 更合适）
- 需要**精确输入**具体数值（使用输入框或 Spinbutton）

### 5.2 提供视觉反馈

```html
<!-- 始终显示当前值 -->
<div class="slider-wrapper">
  <label for="rating">评分</label>
  <div
    role="slider"
    id="rating"
    aria-valuenow="4"
    aria-valuemin="1"
    aria-valuemax="5"
    aria-valuetext="4 星（共 5 星）">
    <span class="value-display">4</span>
  </div>
</div>
```

### 5.3 步进值处理

```javascript
// 定义合理的步进值
const slider = document.querySelector('[role="slider"]');
slider.setAttribute('data-step', '5');

// 处理步进
setValue(newValue) {
  const step = parseFloat(this.slider.getAttribute('data-step')) || 1;
  newValue = Math.round(newValue / step) * step;
  // ...
}
```

### 5.4 使用 aria-valuetext

当数值本身不够直观时，使用 `aria-valuetext` 提供人类可读的描述：

```html
<!-- 数值不够直观 -->
<div
  role="slider"
  aria-valuenow="3"
  aria-valuemin="1"
  aria-valuemax="7"
  aria-valuetext="中等"></div>

<!-- 时间格式 -->
<div
  role="slider"
  aria-valuenow="90"
  aria-valuemin="0"
  aria-valuemax="3600"
  aria-valuetext="1 分 30 秒"></div>
```

### 5.5 焦点样式

确保滑块有清晰的焦点样式：

```css
[role='slider']:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### 5.6 触控支持注意事项

**警告**：部分基于触控的辅助技术可能无法正确操作 Slider 组件，因为它们需要生成键盘事件的合成手势。建议在生产环境中**充分测试**触控无障碍性。

## 六、常见错误

### 6.1 缺少必需属性

```html
<!-- 错误：缺少必需属性 -->
<div
  role="slider"
  tabindex="0">
  <span>50%</span>
</div>

<!-- 正确：包含所有必需属性 -->
<div
  role="slider"
  tabindex="0"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"></div>
```

### 6.2 未更新 aria-valuenow

```javascript
// 错误：值改变但未更新 ARIA 属性
setValue(newValue) {
  this.value = newValue;
  this.slider.style.left = `${newValue}%`;
  // 忘记更新 aria-valuenow
}

// 正确：同时更新样式和 ARIA 属性
setValue(newValue) {
  this.value = newValue;
  this.slider.style.left = `${newValue}%`;
  this.slider.setAttribute('aria-valuenow', newValue);
}
```

### 6.3 Tab 顺序混乱

多滑块中，Tab 顺序应该**与 DOM 顺序一致**，而不是视觉位置：

```html
<!-- 正确：Tab 顺序与 DOM 顺序一致 -->
<div class="range-slider">
  <div
    role="slider"
    aria-label="最小值"
    tabindex="0">
    <!-- 第一个 Tab -->
  </div>
  <div
    role="slider"
    aria-label="最大值"
    tabindex="0">
    <!-- 第二个 Tab -->
  </div>
</div>
```

### 6.4 边界值处理不当

```javascript
// 错误：未处理越界
setValue(newValue) {
  this.value = newValue; // 可能超出 min/max 范围
}

// 正确：边界检查
setValue(newValue) {
  this.value = Math.max(this.min, Math.min(this.max, newValue));
}
```

## 七、单滑块 vs 多滑块对比

| 特性         | 单滑块（Slider） | 多滑块（Multi-Thumb）   |
| ------------ | ---------------- | ----------------------- |
| **滑块数量** | 1 个             | 2 个或更多              |
| **选择类型** | 单值             | 值范围                  |
| **典型用例** | 音量、评分       | 价格区间                |
| **值依赖**   | 无               | 相互依赖（可选）        |
| **Tab 序列** | 1 个元素         | 每个滑块都是 Tab 停靠点 |
| **键盘交互** | 与单滑块相同     | 每个滑块独立的键盘交互  |
| **边界联动** | 无               | 需要动态更新 min/max    |

## 八、总结

构建无障碍的 Slider 组件需要关注：

1. **优先使用原生元素**：`<input type="range">` 提供内置无障碍支持
2. **必需属性**：`role="slider"`、`aria-valuenow`、`aria-valuemin`、`aria-valuemax`
3. **可选属性**：`aria-valuetext`（人类可读文本）、`aria-orientation`（方向）
4. **键盘交互**：方向键增减值、Home/End 设置边界
5. **多滑块**：Tab 顺序保持不变、动态更新边界属性
6. **视觉反馈**：始终显示当前值、清晰的焦点样式
7. **触控支持**：生产环境前充分测试

遵循 [W3C Slider Pattern][0] 和 [Slider Multi-Thumb Pattern][1] 规范，我们能够创建既实用又无障碍的滑块组件。

文章同步于 an-Onion 的 [Github][11]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
[1]: https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/
[2]: https://www.w3.org/TR/wai-aria-1.2/#slider
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuenow
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuemin
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuemax
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuetext
[7]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
[8]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[9]: https://www.w3.org/TR/wai-aria-1.2/#aria-orientation
[10]: https://www.w3.org/TR/wai-aria-1.2/#aria-readonly
[11]: https://github.com/an-Onion/an-Onion.github.io
