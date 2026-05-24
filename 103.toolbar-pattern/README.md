# Toolbar Pattern 详解：构建无障碍的工具栏组件

Toolbar（工具栏）是一种用于**组合一组控件**的容器，例如按钮、菜单按钮或复选框。本文基于 [W3C WAI-ARIA Toolbar Pattern][0] 规范，详解如何构建无障碍的工具栏组件。

## 一、Toolbar 的定义与核心概念

### 1.1 什么是 Toolbar

Toolbar 是一种**控件分组容器**，具有以下特征：

- 将一组相关控件（按钮、菜单、复选框等）**视觉上分组**
- 通过 [`role="toolbar"`][2] 向屏幕阅读器用户传达分组的存在和目的
- **减少键盘 Tab 序列**中的停靠点数量
- 使用**方向键**在控件之间导航
- 通常包含 **3 个或更多控件**

### 1.2 核心术语

| 术语                  | 说明                              |
| --------------------- | --------------------------------- |
| **Toolbar Container** | 工具栏容器，包含所有控件          |
| **Control**           | 工具栏内的控件（按钮、菜单等）    |
| **Roving Tabindex**   | 流动 Tab 索引，管理工具栏内的焦点 |
| **Orientation**       | 工具栏方向（水平或垂直）          |

```plain
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │    │
│  │  │ Bold │ │Italic│ │Under-│ │Align │ │Font  │       │    │
│  │  │  B   │ │  I   │ │line U│ │Left  │ │Size  │       │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │    │
│  │                                                     │    │
│  │  role="toolbar"                                     │    │
│  │  aria-label="Formatting"                            │    │
│  │                                                     │    │
│  │  Tab: Enter/Exit Toolbar                            │    │
│  │  ← → : Move Focus Between Controls                  │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 典型应用场景

- **文本编辑器工具栏**：粗体、斜体、下划线、对齐等按钮
- **富文本编辑器**：字体选择、颜色选择、插入链接等
- **媒体播放器**：播放、暂停、音量、进度控制
- **绘图工具**：画笔、橡皮擦、颜色选择器
- **表格操作**：插入行、删除列、合并单元格

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

Toolbar 使用 [`role="toolbar"`][2] 标记容器。

```html
<div
  role="toolbar"
  aria-label="格式工具栏">
  <button aria-pressed="false">粗体</button>
  <button aria-pressed="false">斜体</button>
  <button>下划线</button>
</div>
```

### 2.2 必需属性

| 属性                                       | 说明           | 示例值       |
| ------------------------------------------ | -------------- | ------------ |
| [`role="toolbar"`][2]                      | 标记工具栏容器 | -            |
| [`aria-label`][3] / [`aria-labelledby`][4] | 工具栏标签     | "格式工具栏" |

### 2.3 可选属性

| 属性                    | 说明       | 示例值                           |
| ----------------------- | ---------- | -------------------------------- |
| [`aria-orientation`][5] | 工具栏方向 | "horizontal"（默认）, "vertical" |

### 2.4 属性详解

#### aria-orientation

用于指定工具栏的方向：

```html
<!-- 水平工具栏（默认） -->
<div
  role="toolbar"
  aria-label="格式工具栏">
  ...
</div>

<!-- 垂直工具栏 -->
<div
  role="toolbar"
  aria-label="侧边工具栏"
  aria-orientation="vertical">
  ...
</div>
```

**注意**：

- 默认方向为水平（`horizontal`）
- 垂直工具栏需要显式设置 `aria-orientation="vertical"`
- 方向影响键盘导航的行为

## 三、键盘交互规范

### 3.1 基本键盘交互

| 按键             | 功能                               |
| ---------------- | ---------------------------------- |
| **Tab**          | 将焦点移入工具栏                   |
| **Shift + Tab**  | 将焦点移出工具栏                   |
| **Left Arrow**   | 将焦点移到上一个控件（水平工具栏） |
| **Right Arrow**  | 将焦点移到下一个控件（水平工具栏） |
| **Up Arrow**     | 将焦点移到上一个控件（垂直工具栏） |
| **Down Arrow**   | 将焦点移到下一个控件（垂直工具栏） |
| **Home**（可选） | 将焦点移到第一个控件               |
| **End**（可选）  | 将焦点移到最后一个控件             |

### 3.2 焦点管理

#### 首次进入工具栏

- 焦点设置到**第一个非禁用控件**

#### 再次进入工具栏

- 焦点**可选地**设置到之前获得焦点的控件
- 否则，焦点设置到**第一个非禁用控件**

#### 水平工具栏导航

```plain
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐          │
│  │ Bold │ ←→ │Italic│ ←→ │Under-│ ←→ │Font  │          │
│  │  B   │    │  I   │    │line U│    │Size  │          │
│  └──────┘    └──────┘    └──────┘    └──────┘          │
│                                                         │
│  Left Arrow: Previous Control                           │
│  Right Arrow: Next Control                              │
│  (Optional: Focus Wraps from First/Last)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 垂直工具栏导航

```plain
┌─────────────────────────┐
│                         │
│  ┌──────┐               │
│  │ Bold │               │
│  │  B   │               │
│  └──────┘               │
│     ↑↓                  │
│  ┌──────┐               │
│  │Italic│               │
│  │  I   │               │
│  └──────┘               │
│     ↑↓                  │
│  ┌──────┐               │
│  │Under-│               │
│  │line U│               │
│  └──────┘               │
│                         │
│  Up Arrow: Previous     │
│  Down Arrow: Next       │
│                         │
└─────────────────────────┘
```

### 3.3 方向键的复用

在水平工具栏中：

- **Left/Right Arrow**：在控件间导航
- **Up/Down Arrow**：可以复用 Left/Right Arrow 的功能，或保留给需要垂直方向键操作的控件（如 Spinbutton）

在垂直工具栏中：

- **Up/Down Arrow**：在控件间导航
- **Left/Right Arrow**：可以复用 Up/Down Arrow 的功能，或保留给需要水平方向键操作的控件（如 Slider）

### 3.4 禁用控件的焦点

通常，禁用控件在键盘导航中**不可聚焦**。但在某些情况下，如果**发现功能至关重要**，可以让禁用控件可聚焦，以便屏幕阅读器用户了解其存在。

## 四、实现方式

### 4.1 基础 Toolbar 结构

```html
<div
  role="toolbar"
  aria-label="文本格式工具栏">
  <button
    id="bold-btn"
    aria-pressed="false"
    tabindex="0">
    粗体
  </button>
  <button
    id="italic-btn"
    aria-pressed="false"
    tabindex="-1">
    斜体
  </button>
  <button
    id="underline-btn"
    tabindex="-1">
    下划线
  </button>
  <button
    id="align-left-btn"
    aria-pressed="true"
    tabindex="-1">
    左对齐
  </button>
  <button
    id="align-center-btn"
    aria-pressed="false"
    tabindex="-1">
    居中对齐
  </button>
</div>
```

### 4.2 JavaScript 实现

```javascript
class Toolbar {
  constructor(element) {
    this.toolbar = element;
    this.controls = Array.from(
      this.toolbar.querySelectorAll(
        'button, [role="button"], input, select, [role="checkbox"], [role="radio"]',
      ),
    );
    this.orientation =
      this.toolbar.getAttribute('aria-orientation') || 'horizontal';

    this.init();
  }

  init() {
    // 键盘事件
    this.toolbar.addEventListener('keydown', this.handleKeyDown.bind(this));

    // 焦点管理
    this.controls.forEach((control, index) => {
      control.addEventListener('focus', () => this.setFocusedControl(index));
    });
  }

  handleKeyDown(e) {
    const currentIndex = this.controls.indexOf(document.activeElement);

    if (currentIndex === -1) return;

    let nextIndex = -1;

    switch (e.key) {
      case 'ArrowLeft':
        if (this.orientation === 'horizontal') {
          e.preventDefault();
          nextIndex = this.getPreviousIndex(currentIndex);
        }
        break;
      case 'ArrowRight':
        if (this.orientation === 'horizontal') {
          e.preventDefault();
          nextIndex = this.getNextIndex(currentIndex);
        }
        break;
      case 'ArrowUp':
        if (this.orientation === 'vertical') {
          e.preventDefault();
          nextIndex = this.getPreviousIndex(currentIndex);
        }
        break;
      case 'ArrowDown':
        if (this.orientation === 'vertical') {
          e.preventDefault();
          nextIndex = this.getNextIndex(currentIndex);
        }
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = this.controls.length - 1;
        break;
    }

    if (nextIndex !== -1) {
      this.focusControl(nextIndex);
    }
  }

  getPreviousIndex(currentIndex) {
    // 循环到末尾
    return currentIndex === 0 ? this.controls.length - 1 : currentIndex - 1;
  }

  getNextIndex(currentIndex) {
    // 循环到开头
    return currentIndex === this.controls.length - 1 ? 0 : currentIndex + 1;
  }

  focusControl(index) {
    const control = this.controls[index];
    if (control && !control.disabled) {
      control.focus();
    }
  }

  setFocusedControl(index) {
    // 更新 tabindex，实现 roving tabindex
    this.controls.forEach((control, i) => {
      control.setAttribute('tabindex', i === index ? '0' : '-1');
    });
  }
}

// 初始化
const toolbar = document.querySelector('[role="toolbar"]');
new Toolbar(toolbar);
```

### 4.3 富文本编辑器 Toolbar 示例

```html
<div
  role="toolbar"
  aria-label="富文本编辑器工具栏">
  <!-- 文本样式 -->
  <button
    id="bold"
    aria-pressed="false"
    tabindex="0">
    <span aria-hidden="true">B</span>
    <span class="sr-only">粗体</span>
  </button>
  <button
    id="italic"
    aria-pressed="false"
    tabindex="-1">
    <span aria-hidden="true">I</span>
    <span class="sr-only">斜体</span>
  </button>
  <button
    id="underline"
    aria-pressed="false"
    tabindex="-1">
    <span aria-hidden="true">U</span>
    <span class="sr-only">下划线</span>
  </button>

  <!-- 分隔符 -->
  <span
    role="separator"
    aria-orientation="vertical"></span>

  <!-- 对齐方式 -->
  <button
    id="align-left"
    aria-pressed="true"
    tabindex="-1">
    <span class="sr-only">左对齐</span>
  </button>
  <button
    id="align-center"
    aria-pressed="false"
    tabindex="-1">
    <span class="sr-only">居中对齐</span>
  </button>
  <button
    id="align-right"
    aria-pressed="false"
    tabindex="-1">
    <span class="sr-only">右对齐</span>
  </button>

  <!-- 分隔符 -->
  <span
    role="separator"
    aria-orientation="vertical"></span>

  <!-- 字体大小 -->
  <label for="font-size">字体大小</label>
  <select
    id="font-size"
    tabindex="-1">
    <option value="12">12px</option>
    <option value="14">14px</option>
    <option
      value="16"
      selected>
      16px
    </option>
    <option value="18">18px</option>
  </select>
</div>
```

### 4.4 垂直 Toolbar 示例

```html
<div
  role="toolbar"
  aria-label="绘图工具栏"
  aria-orientation="vertical">
  <button
    id="brush"
    aria-pressed="true"
    tabindex="0">
    <span class="sr-only">画笔</span>
  </button>
  <button
    id="eraser"
    aria-pressed="false"
    tabindex="-1">
    <span class="sr-only">橡皮擦</span>
  </button>
  <button
    id="line"
    aria-pressed="false"
    tabindex="-1">
    <span class="sr-only">直线</span>
  </button>
  <button
    id="rectangle"
    aria-pressed="false"
    tabindex="-1">
    <span class="sr-only">矩形</span>
  </button>
  <button
    id="circle"
    aria-pressed="false"
    tabindex="-1">
    <span class="sr-only">圆形</span>
  </button>
</div>
```

## 五、最佳实践

### 5.1 控件数量

**仅在包含 3 个或更多控件时使用 Toolbar**：

```html
<!-- 好的示例：3 个以上控件 -->
<div
  role="toolbar"
  aria-label="格式工具栏">
  <button>粗体</button>
  <button>斜体</button>
  <button>下划线</button>
</div>

<!-- 不好的示例：控件太少，不需要 Toolbar -->
<div
  role="toolbar"
  aria-label="操作">
  <button>保存</button>
</div>
```

### 5.2 避免冲突的控件

**避免包含需要与 Toolbar 导航方向冲突的控件**：

```html
<!-- 错误：水平工具栏中包含需要左右方向键的 Spinbutton -->
<!-- 问题：用户按 Left/Right 时，Toolbar 和 Spinbutton 都要响应，冲突！ -->
<div
  role="toolbar"
  aria-label="错误示例">
  <button>加粗</button>
  <button>斜体</button>
  <div
    role="spinbutton"
    aria-label="字体大小"
    aria-valuenow="16">
    16px
  </div>
  <!-- 冲突！ -->
</div>

<!-- 正确：避免使用方向键冲突的控件，或改用不冲突的替代方案 -->
<div
  role="toolbar"
  aria-label="正确示例">
  <button>加粗</button>
  <button>斜体</button>
  <!-- 用 select 替代 spinbutton：select 只有展开后才占用方向键，平时不冲突 -->
  <select aria-label="字体大小">
    <option>12px</option>
    <option selected>16px</option>
    <option>20px</option>
  </select>
</div>
```

### 5.3 使用 Roving Tabindex

通过 Roving Tabindex 管理焦点，确保只有一个控件在 Tab 序列中：

```javascript
// 初始化时，只有第一个控件 tabindex="0"
// 其他控件 tabindex="-1"

// 当焦点移动时，更新 tabindex
setFocusedControl(index) {
  this.controls.forEach((control, i) => {
    control.setAttribute('tabindex', i === index ? '0' : '-1');
  });
}
```

### 5.4 提供快捷键

在需要快速访问工具栏的应用中，提供快捷键：

```javascript
// 从文本区域快速跳转到工具栏
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'f10') {
    e.preventDefault();
    const toolbar = document.querySelector('[role="toolbar"]');
    const firstControl = toolbar.querySelector('[tabindex="0"]');
    firstControl.focus();
  }
});
```

### 5.5 视觉与语义一致

确保工具栏的视觉呈现与 ARIA 语义一致：

```html
<!-- 视觉上是分组，语义上也是分组 -->
<div
  role="toolbar"
  aria-label="对齐工具栏"
  class="toolbar-group">
  <button aria-pressed="true">左对齐</button>
  <button aria-pressed="false">居中对齐</button>
  <button aria-pressed="false">右对齐</button>
</div>
```

### 5.6 处理禁用控件

```html
<!-- 禁用控件通常不可聚焦 -->
<button disabled>不可用</button>

<!-- 但在需要发现功能时，可以让其可聚焦 -->
<button
  aria-disabled="true"
  tabindex="-1">
  即将推出
</button>
```

## 六、常见错误

### 6.1 忘记设置 role="toolbar"

```html
<!-- 错误 -->
<div class="toolbar">
  <button>粗体</button>
  <button>斜体</button>
</div>

<!-- 正确 -->
<div
  role="toolbar"
  aria-label="格式工具栏">
  <button>粗体</button>
  <button>斜体</button>
</div>
```

### 6.2 所有控件都 tabindex="0"

```html
<!-- 错误：所有控件都在 Tab 序列中 -->
<div role="toolbar">
  <button tabindex="0">按钮 1</button>
  <button tabindex="0">按钮 2</button>
  <button tabindex="0">按钮 3</button>
</div>

<!-- 正确：只有一个控件在 Tab 序列中 -->
<div role="toolbar">
  <button tabindex="0">按钮 1</button>
  <button tabindex="-1">按钮 2</button>
  <button tabindex="-1">按钮 3</button>
</div>
```

### 6.3 控件太少使用 Toolbar

```html
<!-- 错误：只有 2 个控件 -->
<div
  role="toolbar"
  aria-label="操作">
  <button>保存</button>
  <button>取消</button>
</div>

<!-- 正确：直接放置，不使用 Toolbar -->
<button>保存</button>
<button>取消</button>
```

### 6.4 方向键冲突

```html
<!-- 错误：水平工具栏中包含需要左右方向键的控件 -->
<div
  role="toolbar"
  aria-label="错误示例">
  <button>按钮</button>
  <div
    role="spinbutton"
    aria-label="字体大小">
    16
  </div>
  <!-- 冲突！ -->
</div>
```

## 七、Toolbar vs 其他组件

### 7.1 Toolbar vs Menu

| 特性         | Toolbar    | Menu         |
| ------------ | ---------- | ------------ |
| **结构**     | 平级控件   | 层级结构     |
| **交互**     | 直接操作   | 选择后执行   |
| **持久性**   | 始终可见   | 通常需要触发 |
| **典型用例** | 格式工具栏 | 下拉菜单     |

### 7.2 Toolbar vs Button Group

| 特性         | Toolbar         | Button Group   |
| ------------ | --------------- | -------------- |
| **键盘导航** | 方向键          | Tab 键         |
| **焦点管理** | Roving Tabindex | 独立焦点       |
| **Tab 序列** | 一个停靠点      | 多个停靠点     |
| **适用场景** | 频繁操作的工具  | 相关操作的分组 |

## 八、总结

构建无障碍的 Toolbar 组件需要关注：

1. **正确的角色**：使用 `role="toolbar"`
2. **标签**：使用 `aria-label` 或 `aria-labelledby`
3. **方向**：使用 `aria-orientation` 指定方向
4. **焦点管理**：使用 Roving Tabindex 减少 Tab 停靠点
5. **键盘导航**：方向键在控件间移动焦点
6. **控件数量**：仅在 3 个以上控件时使用
7. **避免冲突**：避免包含与导航方向冲突的控件
8. **快捷键**：在需要快速访问时提供快捷键

遵循 [W3C Toolbar Pattern][0] 规范，我们能够创建既实用又无障碍的工具栏组件，为所有用户提供高效的操作体验。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#toolbar
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-orientation
