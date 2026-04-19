# Window Splitter Pattern 详解：构建可拖拽面板分割器

Window Splitter（窗口分割器，也称为 **Resizable Splitter**、**Pane Resizer**、**Split Panel** 或 **Divider**）是一种可移动的分隔组件，用于调整两个相邻面板（pane）的相对大小。本文基于 [W3C WAI-ARIA Window Splitter Pattern][0] 规范，详解如何构建无障碍的窗口分割器组件。

## 一、Window Splitter 的定义与核心概念

### 1.1 什么是 Window Splitter

Window Splitter 是一种**可移动的分隔条**，位于两个面板之间，允许用户调整面板的相对大小。它具有以下特征：

- 位于**两个面板之间**，作为可交互的分隔线
- 支持**拖拽调整**面板大小
- 可以是**可变（variable）**或**固定（fixed）**类型
  - **可变分割器**：可以在允许范围内调整到任意位置
  - **固定分割器**：在两个固定位置之间切换
- 具有表示**主面板（primary pane）**大小的数值

### 1.2 核心术语

| 术语                  | 说明                                           |
| --------------------- | ---------------------------------------------- |
| **Primary Pane**      | 主面板，分割器的值表示该面板的大小             |
| **Secondary Pane**    | 次面板，大小随主面板变化而调整                 |
| **Variable Splitter** | 可变分割器，可在范围内任意调整                 |
| **Fixed Splitter**    | 固定分割器，只能在两个位置间切换               |
| **Value**             | 分割器当前值，表示主面板的大小（通常为 0-100） |

```plain
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────┬──────────────────────────────────────┐    │
│  │                  │                                      │    │
│  │   Primary Pane   │          Secondary Pane              │    │
│  │                  │                                      │    │
│  │  ┌────────────┐  │  ┌────────────────────────────────┐  │    │
│  │  │            │  │  │                                │  │    │
│  │  │  Content   │  │  │         Content                │  │    │
│  │  │            │  │  │                                │  │    │
│  │  └────────────┘  │  └────────────────────────────────┘  │    │
│  │                  │                                      │    │
│  └──────────────────┼──────────────────────────────────────┘    │
│                     │                                           │
│              ┌──────┴──────┐                                    │
│              │  Splitter   │  <-- draggable separator           │
│              │  (separator)│      role="separator"              │
│              └─────────────┘      aria-valuenow                 │
│                                                                 │
│  Value = 30 (Primary: 30%, Secondary: 70%)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**注意**："主面板"仅表示该面板的大小由分割器控制，不表示其内容更重要。

### 1.3 典型应用场景

- **代码编辑器**：左侧文件树，右侧代码编辑区
- **阅读应用**：左侧目录，右侧正文内容
- **邮件客户端**：左侧邮件列表，右侧邮件详情
- **设计工具**：左侧工具栏，右侧画布

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

Window Splitter 使用 [`role="separator"`][2] 标记。从 ARIA 1.1 开始，当 `separator` 元素可聚焦时，它被视为一个**控件（widget）**。

```html
<div
  role="separator"
  aria-label="目录"
  aria-valuenow="30"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-controls="primary-pane"
  tabindex="0"></div>
```

### 2.2 必需属性

| 属性                                        | 说明                           | 示例值         |
| ------------------------------------------- | ------------------------------ | -------------- |
| [`role="separator"`][2]                     | 标记为分隔符角色               | -              |
| [`aria-valuenow`][3]                        | 当前值，表示主面板大小         | "30"           |
| [`aria-valuemin`][4]                        | 最小值，主面板最小时的位置     | "0"            |
| [`aria-valuemax`][5]                        | 最大值，主面板最大时的位置     | "100"          |
| [`aria-controls`][6]                        | 指向主面板元素                 | "primary-pane" |
| [`aria-label`][7] 或 [`aria-labelledby`][7] | 可访问标签，应与主面板名称匹配 | "目录"         |

### 2.3 属性详解

#### aria-valuenow

表示分割器的当前位置，通常映射为主面板的百分比大小：

- `0`：主面板完全折叠（最小）
- `100`：主面板完全展开（最大）
- `30`：主面板占 30%，次面板占 70%

#### aria-controls

指向主面板元素，让辅助技术知道分割器控制哪个面板：

```html
<div
  id="primary-pane"
  role="region"
  aria-label="目录">
  <!-- 主面板内容 -->
</div>

<div
  role="separator"
  aria-controls="primary-pane"
  ...></div>
```

#### aria-label

标签应与主面板名称匹配，帮助用户理解分割器的作用：

```html
<!-- 好的示例 -->
<div
  role="region"
  aria-label="目录"
  id="toc-pane">
  ...
</div>
<div
  role="separator"
  aria-label="目录"
  aria-controls="toc-pane">
  ...
</div>

<!-- 不好的示例 -->
<div
  role="separator"
  aria-label="分割器">
  ...
</div>
```

## 三、键盘交互规范

### 3.1 基本键盘交互

| 按键              | 功能                                       |
| ----------------- | ------------------------------------------ |
| **← Left Arrow**  | 垂直分割器向左移动                         |
| **→ Right Arrow** | 垂直分割器向右移动                         |
| **↑ Up Arrow**    | 水平分割器向上移动                         |
| **↓ Down Arrow**  | 水平分割器向下移动                         |
| **Enter**         | 切换主面板的展开/折叠状态                  |
| **Home**（可选）  | 将分割器移到最小位置（可能完全折叠主面板） |
| **End**（可选）   | 将分割器移到最大位置（可能完全展开主面板） |
| **F6**（可选）    | 在窗口面板之间循环切换焦点                 |

### 3.2 Enter 键行为详解

Enter 键用于**切换主面板的折叠状态**：

- 如果主面板**未折叠**：折叠主面板（分割器移到最小值）
- 如果主面板**已折叠**：恢复分割器到之前的位置

```javascript
function handleEnter(splitter) {
  const currentValue = parseInt(splitter.getAttribute('aria-valuenow'));
  const minValue = parseInt(splitter.getAttribute('aria-valuemin'));

  if (currentValue > minValue) {
    // 主面板未折叠，保存当前位置并折叠
    splitter.dataset.previousValue = currentValue;
    setSplitterValue(splitter, minValue);
  } else {
    // 主面板已折叠，恢复到之前的位置
    const previousValue = parseInt(splitter.dataset.previousValue || '50');
    setSplitterValue(splitter, previousValue);
  }
}
```

### 3.3 固定分割器的键盘交互

固定分割器**只支持 Enter 键**，不支持方向键：

- 在两个固定位置之间切换
- 例如：折叠/展开侧边栏

## 四、鼠标交互规范

### 4.1 拖拽行为

- **鼠标按下**：开始拖拽，记录起始位置
- **鼠标移动**：实时更新分割器位置和面板大小
- **鼠标释放**：结束拖拽，保存最终位置

### 4.2 视觉反馈

- **悬停状态**：鼠标悬停时显示可拖拽的视觉提示（如改变光标为 `col-resize` 或 `row-resize`）
- **拖拽状态**：拖拽过程中显示视觉反馈（如半透明遮罩）
- **焦点状态**：键盘聚焦时显示清晰的焦点指示器

```css
[role='separator'] {
  cursor: col-resize; /* 垂直分割器 */
}

[role='separator'][aria-orientation='horizontal'] {
  cursor: row-resize; /* 水平分割器 */
}

[role='separator']:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

## 五、实现方式

### 5.1 基础 Window Splitter 结构

```html
<!-- 窗口容器 -->
<div class="window-container">
  <!-- 主面板 -->
  <div
    id="primary-pane"
    class="primary-pane"
    role="region"
    aria-label="目录">
    <!-- 主面板内容 -->
    <nav>
      <h2>目录</h2>
      <ul>
        <li><a href="#ch1">第一章</a></li>
        <li><a href="#ch2">第二章</a></li>
      </ul>
    </nav>
  </div>

  <!-- 分割器 -->
  <div
    role="separator"
    class="splitter"
    aria-label="目录"
    aria-valuenow="30"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-controls="primary-pane"
    tabindex="0"></div>

  <!-- 次面板 -->
  <div
    class="secondary-pane"
    role="region"
    aria-label="内容">
    <!-- 次面板内容 -->
    <article>
      <h1>文章标题</h1>
      <p>文章内容...</p>
    </article>
  </div>
</div>
```

### 5.2 CSS 样式

```css
.window-container {
  display: flex;
  height: 100vh;
}

.primary-pane {
  width: 30%; /* 初始宽度对应 aria-valuenow="30" */
  min-width: 0;
  overflow: auto;
}

.splitter {
  width: 4px;
  background-color: #e5e7eb;
  cursor: col-resize;
  transition: background-color 0.2s;
}

.splitter:hover,
.splitter:focus {
  background-color: #3b82f6;
}

.splitter:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.secondary-pane {
  flex: 1;
  overflow: auto;
}
```

### 5.3 JavaScript 实现

```javascript
class WindowSplitter {
  constructor(splitterElement) {
    this.splitter = splitterElement;
    this.primaryPane = document.getElementById(
      splitterElement.getAttribute('aria-controls'),
    );
    this.container = this.splitter.parentElement;

    this.isDragging = false;
    this.startX = 0;
    this.startWidth = 0;

    this.init();
  }

  init() {
    // 鼠标事件
    this.splitter.addEventListener(
      'mousedown',
      this.handleMouseDown.bind(this),
    );
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // 键盘事件
    this.splitter.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.startX = e.clientX;
    this.startWidth = this.primaryPane.offsetWidth;
    this.container.style.userSelect = 'none';
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;

    const delta = e.clientX - this.startX;
    const newWidth = this.startWidth + delta;
    const containerWidth = this.container.offsetWidth;
    const percentage = Math.round((newWidth / containerWidth) * 100);

    this.setValue(percentage);
  }

  handleMouseUp() {
    this.isDragging = false;
    this.container.style.userSelect = '';
  }

  handleKeyDown(e) {
    const currentValue = parseInt(this.splitter.getAttribute('aria-valuenow'));
    const minValue = parseInt(this.splitter.getAttribute('aria-valuemin'));
    const maxValue = parseInt(this.splitter.getAttribute('aria-valuemax'));
    const step = 5; // 每次移动 5%

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.setValue(Math.max(minValue, currentValue - step));
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.setValue(Math.min(maxValue, currentValue + step));
        break;
      case 'Home':
        e.preventDefault();
        this.setValue(minValue);
        break;
      case 'End':
        e.preventDefault();
        this.setValue(maxValue);
        break;
      case 'Enter':
        e.preventDefault();
        this.toggleCollapse();
        break;
    }
  }

  setValue(value) {
    const minValue = parseInt(this.splitter.getAttribute('aria-valuemin'));
    const maxValue = parseInt(this.splitter.getAttribute('aria-valuemax'));

    // 限制在范围内
    value = Math.max(minValue, Math.min(maxValue, value));

    // 更新 ARIA 属性
    this.splitter.setAttribute('aria-valuenow', value);

    // 更新视觉
    this.primaryPane.style.width = value + '%';
  }

  toggleCollapse() {
    const currentValue = parseInt(this.splitter.getAttribute('aria-valuenow'));
    const minValue = parseInt(this.splitter.getAttribute('aria-valuemin'));

    if (currentValue > minValue) {
      // 保存当前值并折叠
      this.splitter.dataset.previousValue = currentValue;
      this.setValue(minValue);
    } else {
      // 恢复之前的位置
      const previousValue = parseInt(
        this.splitter.dataset.previousValue || '30',
      );
      this.setValue(previousValue);
    }
  }
}

// 初始化
const splitter = document.querySelector('[role="separator"]');
new WindowSplitter(splitter);
```

### 5.4 固定分割器实现

固定分割器只支持 Enter 键切换：

```javascript
class FixedWindowSplitter {
  constructor(splitterElement) {
    this.splitter = splitterElement;
    this.primaryPane = document.getElementById(
      splitterElement.getAttribute('aria-controls'),
    );

    this.positions = [0, 30]; // 两个固定位置：折叠、展开
    this.currentIndex = 1; // 默认展开

    this.init();
  }

  init() {
    this.splitter.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.togglePosition();
    }
  }

  togglePosition() {
    this.currentIndex = (this.currentIndex + 1) % this.positions.length;
    const value = this.positions[this.currentIndex];

    this.splitter.setAttribute('aria-valuenow', value);
    this.primaryPane.style.width = value + '%';
  }
}
```

## 六、最佳实践

### 6.1 提供清晰的标签

分割器的标签应与主面板名称匹配：

```html
<!-- 好的示例 -->
<div
  role="region"
  aria-label="文件树"
  id="file-tree">
  ...
</div>
<div
  role="separator"
  aria-label="文件树"
  aria-controls="file-tree">
  ...
</div>

<!-- 不好的示例 -->
<div
  role="separator"
  aria-label="拖拽调整">
  ...
</div>
```

### 6.2 确保键盘可访问

- 分割器必须可聚焦（`tabindex="0"`）
- 支持方向键调整位置
- 支持 Enter 键折叠/展开

### 6.3 提供视觉反馈

- 悬停时改变光标样式
- 焦点状态清晰可见
- 拖拽过程中实时更新面板大小

### 6.4 限制调整范围

设置合理的 `aria-valuemin` 和 `aria-valuemax`，防止面板过小或过大：

```html
<!-- 主面板最小 15%，最大 50% -->
<div
  role="separator"
  aria-valuemin="15"
  aria-valuemax="50"
  ...></div>
```

### 6.5 保存用户偏好

记住用户调整后的面板大小，下次访问时恢复：

```javascript
// 保存
localStorage.setItem('splitter-value', splitter.getAttribute('aria-valuenow'));

// 恢复
const savedValue = localStorage.getItem('splitter-value');
if (savedValue) {
  splitter.setAttribute('aria-valuenow', savedValue);
  primaryPane.style.width = savedValue + '%';
}
```

### 6.6 响应式设计考虑

在小屏幕上，考虑禁用分割器或提供替代方案：

```css
@media (max-width: 768px) {
  [role='separator'] {
    display: none; /* 小屏幕隐藏分割器 */
  }

  .primary-pane {
    width: 100% !important; /* 全宽显示 */
  }
}
```

## 七、常见错误

### 7.1 忘记设置 aria-controls

```html
<!-- 错误 -->
<div
  role="separator"
  aria-label="目录"></div>

<!-- 正确 -->
<div
  role="separator"
  aria-label="目录"
  aria-controls="primary-pane"></div>
```

### 7.2 标签与主面板不匹配

```html
<!-- 错误 -->
<div
  role="region"
  aria-label="目录">
  ...
</div>
<div
  role="separator"
  aria-label="调整大小">
  ...
</div>

<!-- 正确 -->
<div
  role="region"
  aria-label="目录">
  ...
</div>
<div
  role="separator"
  aria-label="目录">
  ...
</div>
```

### 7.3 忽略键盘交互

只实现鼠标拖拽，不实现键盘支持，导致键盘用户无法调整面板大小。

## 八、总结

构建无障碍的 Window Splitter 组件需要关注：

1. **正确的角色**：使用 `role="separator"`
2. **必需的属性**：[`aria-valuenow`][3]、[ `aria-valuemin`][4]、[ `aria-valuemax`][5]、[ `aria-controls`][6]、[ `aria-label`][7]
3. **完整的键盘支持**：方向键调整、Enter 键折叠、Home/End 快捷键
4. **鼠标拖拽支持**：mousedown/mousemove/mouseup 事件
5. **清晰的标签**：标签与主面板名称匹配
6. **视觉反馈**：悬停、焦点、拖拽状态的视觉提示

遵循 [W3C Window Splitter Pattern][0] 规范，我们能够创建既实用又无障碍的面板分割器，提升所有用户的操作体验。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#separator
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuenow
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuemin
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-valuemax
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-controls
[7]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
