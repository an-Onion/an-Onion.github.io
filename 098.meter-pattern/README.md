# Meter Pattern 详解：构建无障碍计量器组件

Meter（计量器）是一种图形化显示数值的组件，用于展示在特定范围内变化的数值。本文基于 [W3C WAI-ARIA Meter Pattern][0] 规范，详解如何构建无障碍的 Meter 组件。

## 一、Meter 的定义与核心概念

### 1.1 什么是 Meter

Meter 是一种**图形化显示数值**的组件，具有以下特征：

- 显示一个**在定义范围内变化**的数值
- 通常以视觉形式呈现（如进度条、仪表盘、电池图标等）
- 数值有明确的**最小值**和**最大值**限制

### 1.2 Meter vs Progressbar

Meter 和 Progressbar 容易混淆，但它们有明确的区别：

| 特性         | Meter                          | Progressbar                          |
| ------------ | ------------------------------ | ------------------------------------ |
| **用途**     | 显示当前状态值（如电量、油量） | 显示任务进度（如加载中、完成百分比） |
| **数值变化** | 随时间自然变化                 | 随任务推进单向增长                   |
| **典型场景** | 电池电量、磁盘使用率、温度     | 文件上传、表单提交、安装进度         |

**重要提示**：

- Meter **不应用于**表示进度（如加载或任务完成百分比）
- Meter **不适用于**没有明确最大值的情况（如世界人口数量）

### 1.3 核心术语

| 术语              | 说明                                   |
| ----------------- | -------------------------------------- |
| **Value**         | 计量器当前显示的数值                   |
| **Minimum Value** | 计量器的最小值（[`aria-valuemin`][4]） |
| **Maximum Value** | 计量器的最大值（[`aria-valuemax`][5]） |
| **Current Value** | 当前值（[`aria-valuenow`][3]）         |

```plain
┌─────────────────────────────────────────────────────────────┐
│                      Meter Container                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │████████████████████████████████░░░░░░░░░░░░░░░░░░░░░│    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│   0%          25%          50%          75%        100%     │
│   ↑                                                  ↑      │
│  Minimum                                        Maximum     │
│(aria-valuemin)                              (aria-valuemax) │
│                                                             │
│                         Current: 60%                        │
│                       (aria-valuenow)                       │
└─────────────────────────────────────────────────────────────┘
```

## 二、HTML `<meter>` 标签 vs ARIA `role="meter"`

在实现 Meter 组件时，我们有两种选择：**原生 HTML `<meter>` 标签** 或 **ARIA `role="meter"`**。

### 2.1 两种方式对比

| 特性             | HTML `<meter>`         | ARIA `role="meter"`    |
| ---------------- | ---------------------- | ---------------------- |
| **本质**         | 原生 HTML5 语义化标签  | ARIA 角色属性          |
| **浏览器支持**   | 现代浏览器原生支持     | 所有支持 ARIA 的浏览器 |
| **可定制性**     | 样式受限（浏览器控制） | 完全可定制             |
| **代码简洁度**   | 简洁，内置语义         | 需要显式声明 ARIA 属性 |
| **辅助技术识别** | 自动识别为 meter       | 通过 role 识别为 meter |

### 2.2 使用 HTML `<meter>` 标签（推荐）

HTML5 提供了原生的 `<meter>` 标签，它**自动具有 `role="meter"` 的语义**，无需额外声明：

```html
<meter
  value="60"
  min="0"
  max="100">
  60%
</meter>
```

**`<meter>` 标签的属性：**

| 属性      | 说明     | 示例值 |
| --------- | -------- | ------ |
| `value`   | 当前值   | "60"   |
| `min`     | 最小值   | "0"    |
| `max`     | 最大值   | "100"  |
| `low`     | 低值阈值 | "25"   |
| `high`    | 高值阈值 | "75"   |
| `optimum` | 最佳值   | "90"   |

**示例：带颜色区间的电池电量**

```html
<meter
  value="45"
  min="0"
  max="100"
  low="20"
  high="80"
  optimum="90"
  aria-label="电池电量">
  45%
</meter>
```

- `low` 以下：浏览器通常显示为红色（危险）
- `low` 到 `high` 之间：黄色（警告）
- `high` 以上：绿色（正常）

### 2.3 使用 ARIA `role="meter"`

当需要**完全自定义样式**（如电池图标、仪表盘、信号格等）时，使用 ARIA 方式：

```html
<div
  role="meter"
  aria-label="电池电量"
  aria-valuenow="60"
  aria-valuemin="0"
  aria-valuemax="100">
  <!-- 自定义视觉表现 -->
</div>
```

### 2.4 如何选择

**优先使用 `<meter>` 标签：**

- 简单的进度条场景
- 不需要复杂自定义样式
- 追求代码简洁性

**使用 ARIA `role="meter"`：**

- 需要自定义视觉样式（电池图标、仪表盘等）
- 特殊形状或动画效果
- 需要兼容旧浏览器

### 2.5 两种方式的等价关系

以下两种实现**在辅助技术眼中是等价的**：

```html
<!-- 方式1：HTML 原生标签 -->
<meter
  value="60"
  min="0"
  max="100"
  aria-label="电池电量">
  60%
</meter>

<!-- 方式2：ARIA 实现 -->
<div
  role="meter"
  aria-valuenow="60"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="电池电量">
  60%
</div>
```

**注意**：`<meter>` 标签已经内置了 `role="meter"` 语义，不需要额外添加 `role` 属性。

## 三、WAI-ARIA 角色与属性（ARIA 方式）

当使用 `<meter>` 标签时，以下 ARIA 属性**自动处理**，无需手动声明：

| HTML 属性 | 对应的 ARIA 属性     | 说明     |
| --------- | -------------------- | -------- |
| `value`   | [`aria-valuenow`][3] | 自动映射 |
| `min`     | [`aria-valuemin`][4] | 自动映射 |
| `max`     | [`aria-valuemax`][5] | 自动映射 |

当使用 `role="meter"` 时，需要手动声明以下属性：

### 3.1 必需属性

Meter 组件需要以下 ARIA 属性：

| 属性                                        | 说明                             | 示例值     |
| ------------------------------------------- | -------------------------------- | ---------- |
| [`aria-valuenow`][3]                        | 当前值（必须在 min 和 max 之间） | "60"       |
| [`aria-valuemin`][4]                        | 最小值                           | "0"        |
| [`aria-valuemax`][5]                        | 最大值                           | "100"      |
| [`aria-label`][6] 或 [`aria-labelledby`][6] | 计量器的可访问标签               | "电池电量" |

```html
<div
  role="meter"
  aria-label="电池电量"
  aria-valuenow="60"
  aria-valuemin="0"
  aria-valuemax="100">
  <!-- 计量器视觉表现 -->
</div>
```

### 3.2 可选属性

#### [`aria-valuetext`][7]

当仅显示百分比不够友好时，使用 [`aria-valuetext`][7] 提供更友好的值描述：

```html
<div
  role="meter"
  aria-label="电池电量"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="50% (6小时) 剩余">
  <!-- 计量器视觉表现 -->
</div>
```

辅助技术会读取 `aria-valuetext` 而不是简单的百分比数值。

### 3.3 属性关系

```plain
aria-valuemin < aria-valuenow < aria-valuemax
      ↑              ↑               ↑
    最小值         当前值          最大值
      0             60              100
```

**约束条件**：

- [`aria-valuemin`][4] 必须小于 [`aria-valuemax`][5]
- [`aria-valuenow`][3] 必须在 [`aria-valuemin`][4] 和 [`aria-valuemax`][5] 之间
- 所有值都使用十进制数值

## 三、键盘交互规范

Meter 组件**没有特定的键盘交互**，因为它通常是一个只读组件，用户不能直接操作它。

如果 Meter 是可交互的（如可调节的范围选择器），应该使用 [`role="slider"`][8] 而不是 `role="meter"`。

## 四、实现方式

### 4.1 基础 Meter 结构

```html
<div
  class="meter"
  role="meter"
  aria-label="电池电量"
  aria-valuenow="75"
  aria-valuemin="0"
  aria-valuemax="100">
  <div class="meter-bar">
    <div
      class="meter-fill"
      style="width: 75%;"></div>
  </div>
  <span class="meter-value">75%</span>
</div>
```

### 4.2 使用 [`aria-valuetext`][7] 的示例

```html
<div
  class="meter"
  role="meter"
  aria-label="剩余存储空间"
  aria-valuenow="45.5"
  aria-valuemin="0"
  aria-valuemax="128"
  aria-valuetext="45.5 GB 已使用，共 128 GB">
  <div class="meter-bar">
    <div
      class="meter-fill"
      style="width: 35.5%;"></div>
  </div>
  <span class="meter-value">45.5 GB / 128 GB</span>
</div>
```

### 4.3 带颜色状态的 Meter

根据数值范围显示不同颜色（如危险、警告、正常）：

```html
<div
  class="meter meter-danger"
  role="meter"
  aria-label="CPU 使用率"
  aria-valuenow="95"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="95%，危险">
  <div class="meter-bar">
    <div
      class="meter-fill"
      style="width: 95%;"></div>
  </div>
  <span class="meter-value">95%</span>
</div>
```

## 五、常见应用场景

### 5.1 电池电量显示

```html
<div
  role="meter"
  aria-label="电池电量"
  aria-valuenow="45"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="45% (约3小时) 剩余">
  <!-- 电池图标：外框 + 电量填充 -->
  <div class="battery-icon">
    <div class="battery-body">
      <div
        class="battery-level"
        style="width: 45%;"></div>
    </div>
    <div class="battery-cap"></div>
  </div>
  <span>45%</span>
</div>
```

### 5.2 磁盘使用率

```html
<div
  role="meter"
  aria-label="磁盘使用率"
  aria-valuenow="72"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="72% 已使用 (360 GB / 500 GB)">
  <div class="meter-bar">
    <div style="width: 72%"></div>
  </div>
  <span>72% 已使用</span>
</div>
```

### 5.3 温度显示

```html
<div
  role="meter"
  aria-label="CPU 温度"
  aria-valuenow="65"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="65°C">
  <div class="meter-bar">
    <div style="width: 65%"></div>
  </div>
  <span>65°C</span>
</div>
```

### 5.4 信号强度

```html
<div
  role="meter"
  aria-label="WiFi 信号强度"
  aria-valuenow="3"
  aria-valuemin="0"
  aria-valuemax="4"
  aria-valuetext="3格信号 (良好)">
  <div class="signal-bars">
    <span class="bar active"></span>
    <span class="bar active"></span>
    <span class="bar active"></span>
    <span class="bar"></span>
  </div>
</div>
```

## 六、最佳实践

### 6.1 正确选择使用场景

**使用 Meter**：

- 电池电量
- 磁盘/存储使用率
- 温度、压力等物理量
- 信号强度
- 任何有明确范围的数值

**不使用 Meter**（改用 Progressbar）：

- 文件上传进度
- 安装进度
- 任务完成百分比
- 任何表示"进度"的场景

**不使用 Meter**（改用其他组件）：

- 世界人口（无最大值）
- 可调节的数值（使用 Slider）

### 6.2 提供清晰的标签

始终为 Meter 提供描述性的标签：

```html
<!-- 好的示例 -->
<div
  role="meter"
  aria-label="电池电量">
  ...
</div>

<!-- 不好的示例 -->
<div role="meter">...</div>
```

### 6.3 使用 [`aria-valuetext`][7] 增强可读性

当纯百分比不够直观时，使用 [`aria-valuetext`][7]：

```html
<!-- 好的示例 -->
<div
  role="meter"
  aria-label="电池"
  aria-valuenow="50"
  aria-valuetext="50% (6小时) 剩余">
  ...
</div>

<!-- 不好的示例 -->
<div
  role="meter"
  aria-label="电池"
  aria-valuenow="50">
  ...
</div>
```

### 6.4 确保数值在有效范围内

```javascript
// 确保 aria-valuenow 在有效范围内
function updateMeter(element, value) {
  const min = parseFloat(element.getAttribute('aria-valuemin'));
  const max = parseFloat(element.getAttribute('aria-valuemax'));

  // 限制值在范围内
  const clampedValue = Math.max(min, Math.min(max, value));

  element.setAttribute('aria-valuenow', clampedValue);
}
```

### 6.5 视觉与 ARIA 值保持一致

确保视觉表现和 ARIA 属性值同步更新：

```javascript
function setMeterValue(element, value) {
  const min = parseFloat(element.getAttribute('aria-valuemin'));
  const max = parseFloat(element.getAttribute('aria-valuemax'));

  // 更新 ARIA 值
  element.setAttribute('aria-valuenow', value);

  // 更新视觉表现
  const percentage = ((value - min) / (max - min)) * 100;
  const fillElement = element.querySelector('.meter-fill');
  fillElement.style.width = percentage + '%';

  // 更新文本
  const valueElement = element.querySelector('.meter-value');
  valueElement.textContent = Math.round(percentage) + '%';
}
```

### 6.6 考虑颜色对比度

确保 Meter 的不同状态颜色具有足够的对比度：

```css
.meter-fill {
  background-color: #3b82f6; /* 蓝色 - 正常 */
}

.meter-warning .meter-fill {
  background-color: #f59e0b; /* 黄色 - 警告 */
}

.meter-danger .meter-fill {
  background-color: #ef4444; /* 红色 - 危险 */
}
```

## 七、总结

Meter 组件虽然简单，但正确使用 ARIA 属性对于无障碍体验至关重要：

1. **使用正确的 role**：`role="meter"` 用于显示范围内的数值
2. **设置必需的属性**：[`aria-valuenow`][3]、[ `aria-valuemin`][4]、[ `aria-valuemax`][5]
3. **提供清晰的标签**：使用 [`aria-label`][6] 或 [`aria-labelledby`][6]
4. **增强可读性**：使用 [`aria-valuetext`][7] 提供更友好的值描述
5. **区分使用场景**：Meter vs Progressbar vs Slider

遵循 [W3C Meter Pattern][0] 规范，我们能够创建既美观又无障碍的计量器组件，为所有用户提供清晰的状态信息。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#meter
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuenow
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuemin
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuemax
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
[7]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuetext
[8]: https://www.w3.org/TR/wai-aria-1.2/#slider
