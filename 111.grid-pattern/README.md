# Grid Pattern 详解：交互式表格与布局容器的无障碍实现

Grid（网格）是一种允许用户**使用方向键在单元格之间导航**的复合容器组件。它既能呈现可编辑、可交互的表格数据（Data Grid），也能用于压缩 Tab 序列、分组一组交互元素（Layout Grid）。本文基于 [W3C WAI-ARIA Grid Pattern][0] 规范，详解 Grid 的语义结构、键盘交互模型与无障碍实现要点。

## 一、Grid 的定义与核心概念

### 1.1 什么是 Grid

Grid 是一个支持方向键导航的容器组件，用户可以使用方向键、Home、End 等导航键在其包含的信息或交互元素之间移动焦点。它是一个非常通用的容器，适用范围从简单到复杂：

- **简单场景**：分组一组 checkbox 或导航链接
- **复杂场景**：构建功能完备的电子表格应用

Grid 的三个结构特征：

- **复合组件**：内部始终包含多个可聚焦元素
- **单一 Tab 停靠点**：整个 Grid 在页面 Tab 序列中只包含一个可聚焦元素
- **焦点自管理**：需要作者自行实现[网格内部的焦点移动][1]

> **注意**：虽然 WAI-ARIA 的属性名中包含 "row" 和 "column"，辅助技术也会用行列结构来描述 Grid，但 `role="grid"` 并**不要求**视觉上呈现为表格。

### 1.2 核心术语

| 术语                         | 说明                             |
| ---------------------------- | -------------------------------- |
| **Grid**                     | 网格容器                         |
| **Row**                      | 行容器                           |
| **Rowgroup**                 | 行分组，可选                     |
| **Gridcell**                 | 网格单元                         |
| **Columnheader / Rowheader** | 列头 / 行头                      |
| **Data Grid**                | 呈现表格数据的 Grid              |
| **Layout Grid**              | 分组其他交互元素的 Grid          |
| **Roving Focus**             | 漫游焦点，Tab 序列中仅一个停靠点 |

```plain
┌─────────────────────────────────────────────────────────────┐
│  Employee Directory (Data Grid)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name      | Role     | City      | Status                  │
│  ----------+----------+-----------+--------                 │
│  Alice     | Designer | Shanghai  | Active                  │
│  Bob       | Engineer | Beijing   | Active                  │
│  Cindy     | PM       | Shenzhen  | Away                    │
│                                                             │
│  role="grid" > role="row" > role="gridcell"                 │
│  role="columnheader" / role="rowheader" (optional)          │
│  aria-selected | aria-readonly | aria-rowcount              │
│                                                             │
│  Tab: Enter/Leave Grid (single tab stop)                    │
│  Arrows: Move Between Cells (edge = stop)                   │
│  Home/End: First/Last Cell in Row                           │
│  Ctrl+Home: First Cell | Ctrl+End: Last Cell                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Grid vs Table：如何选择

呈现表格内容时，规范要求在 Grid Pattern 与 [Table Pattern][2] 之间权衡：

| 特性         | Grid                   | Table                  |
| ------------ | ---------------------- | ---------------------- |
| **组件类型** | 复合组件               | 静态结构               |
| **Tab 序列** | 仅 1 个停靠点          | 所有可聚焦元素全部进入 |
| **焦点管理** | 需自行实现方向键导航   | 无需                   |
| **适用内容** | 可编辑、可交互的单元格 | 只读数据展示           |
| **典型场景** | 电子表格、可编辑报表   | 阅读型数据表           |

经验法则：**单元格需要交互或编辑 → Grid；纯阅读展示 → Table**。例如单元格内容是指向更多信息的链接时，用 Table 会把所有链接塞进 Tab 序列（键盘用户按 Tab 按到手软），而 Grid 只需一次 Tab 进入，方向键即可穿梭其中。

### 1.4 两大类别：Data Grid 与 Layout Grid

Grid Pattern 的用途大致分为两类：

| 类别            | 用途         | 典型示例                         |
| --------------- | ------------ | -------------------------------- |
| **Data Grid**   | 呈现表格数据 | 可编辑报表、电子表格             |
| **Layout Grid** | 分组交互元素 | 收件人列表、导航链接组、搜索结果 |

两者使用相同的 ARIA 角色、状态与属性，但键盘交互设计上有重要差异（见第三章）。

## 二、ARIA 角色与属性

### 2.1 角色结构

Grid 的角色层级为：`grid` > `row`（可由 `rowgroup` 分组）> `gridcell`，表头单元格使用 `columnheader` 或 `rowheader`：

```html
<table
  role="grid"
  aria-labelledby="grid-title">
  <caption id="grid-title">
    Employees
  </caption>
  <thead>
    <tr role="row">
      <th role="columnheader">Name</th>
      <th role="columnheader">Role</th>
      <th role="columnheader">City</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="gridcell">Alice</td>
      <td role="gridcell">Designer</td>
      <td role="gridcell">Shanghai</td>
    </tr>
  </tbody>
</table>
```

要点：

- [`grid`][3] 容器必须有可访问名称（[`aria-labelledby`][4] 或 [`aria-label`][5]）
- [`gridcell`][6]：单元格；若内容是单个交互元素，可让该元素本身获得焦点
- [`columnheader`][7] / [`rowheader`][8]：列头与行头；若表头不提供排序、筛选等功能，无需可聚焦
- 呈现表格数据时优先复用原生 `table`/`tr`/`td`，仅在非表格布局时用 `div` 构建

### 2.2 计数与定位属性（虚拟滚动）

大数据量场景下，DOM 中往往只渲染可视区的部分行，此时必须向辅助技术补全“真实世界”的定位信息：

- [`aria-rowcount`][9] / [`aria-colcount`][10]：声明真实的总行数/总列数；未知时设为 `-1`
- [`aria-rowindex`][11] / [`aria-colindex`][12]：声明当前行/列在整个网格中的位置（从 1 开始）

```html
<div
  role="grid"
  aria-label="Employees"
  aria-rowcount="237"
  aria-colcount="4">
  <div
    role="row"
    aria-rowindex="58">
    <div
      role="gridcell"
      aria-colindex="1">
      Alice
    </div>
    <div
      role="gridcell"
      aria-colindex="2">
      Designer
    </div>
    <div
      role="gridcell"
      aria-colindex="3">
      Shanghai
    </div>
    <div
      role="gridcell"
      aria-colindex="4">
      Active
    </div>
  </div>
  <!-- 仅渲染可视区的行 -->
</div>
```

### 2.3 状态属性

| 属性                                        | 作用                                             |
| ------------------------------------------- | ------------------------------------------------ |
| [`aria-multiselectable`][13]                | 声明 Grid 支持多选                               |
| [`aria-selected`][14]                       | 单元格/行/列的选中状态                           |
| [`aria-readonly`][15]                       | 在 `grid` 上声明整体只读，可编辑单元格再单独覆盖 |
| [`aria-disabled`][16]                       | 禁用某个单元格                                   |
| [`aria-colspan`][17] / [`aria-rowspan`][18] | 跨列/跨行（在 div 结构中取代原生属性）           |

## 三、键盘交互规范

### 3.1 单一 Tab 停靠点与漫游焦点

Grid 是复合组件：整个 Grid 在页面 Tab 序列中只占**一个**停靠点。Tab 进入后，用方向键在单元格间移动焦点（Roving Focus），Tab 离开后焦点回到进入时的单元格。这与 Listbox 的导航模型一致，但 Grid 是二维的。

### 3.2 Data Grid 导航键

以下按键在 Grid 获得焦点后生效（如用户用 Tab 进入 Grid 之后）：

| 按键             | 行为                             |
| ---------------- | -------------------------------- |
| `Right Arrow`    | 焦点右移一格，到行尾停止         |
| `Left Arrow`     | 焦点左移一格，到行首停止         |
| `Down Arrow`     | 焦点下移一格，到底部停止         |
| `Up Arrow`       | 焦点上移一格，到顶部停止         |
| `Page Down`      | 下移作者定义的行数，通常伴随滚动 |
| `Page Up`        | 上移作者定义的行数，通常伴随滚动 |
| `Home`           | 移到所在行的第一个单元格         |
| `End`            | 移到所在行的最后一个单元格       |
| `Control + Home` | 移到网格的第一个单元格           |
| `Control + End`  | 移到网格的最后一个单元格         |

> **注意**：如果导航可以动态向 DOM 添加行，`Control + End` 这类"跳到末尾"的按键可能落到 DOM 的最后一行，而非后端数据的最后一行——需要保证虚拟列表先行渲染目标行。

### 3.3 Layout Grid 导航键：允许回绕

Layout Grid（用于分组链接、按钮等）的导航键有两个关键差异：

- **方向键可选回绕**：行尾再按 `Right Arrow` 可以跳到下一行行首，让用户像读文本一样从开头读到结尾（Data Grid 中回绕会让人迷失方向，严禁使用）
- **更多按键可选**：`Page Up/Down`、`Control + Home/End` 在 Layout Grid 中都是可选项；`Home/End` 在单列或每行少于 3 格时，可选改为跳到网格首/末

### 3.4 选择操作键

如果 Grid 支持选择单元格、行或列，常用以下按键：

| 按键              | 行为                                       |
| ----------------- | ------------------------------------------ |
| `Control + Space` | 选中焦点所在的列                           |
| `Shift + Space`   | 选中焦点所在的行（有勾选列时也是快捷勾选） |
| `Control + A`     | 全选                                       |
| `Shift + 方向键`  | 向对应方向扩展选区                         |

剪切、复制、粘贴的键位遵循[通用键位约定][19]。

### 3.5 编辑与单元格内部交互

方向键被 Grid 导航占用后，就无法再用于操作单元格内部——比如移动文本光标、驱动一个 [Listbox][20]。以下三种情况需要"暂停/恢复 Grid 导航"的机制：

1. 单元格包含**可编辑内容**
2. 单元格包含**多个组件**
3. 单元格包含**自身需要方向键的组件**（如 radio group、slider）

约定的按键：

| 按键    | 行为                                                                     |
| ------- | ------------------------------------------------------------------------ |
| `Enter` | 禁用 Grid 导航：焦点进入输入框，或单元格内第一个组件                     |
| `F2`    | 切换：效果同 Enter 进入，再按一次恢复 Grid 导航（类似 Excel 的操作习惯） |
| `Esc`   | 恢复 Grid 导航                                                           |

单行输入框中，`Enter` 也可以选择移到相邻单元格的输入框，而非恢复导航——由作者决定。

### 3.6 焦点落在单元格还是内部元素

导航键移动焦点时，焦点应落在单元格上还是单元格内的元素上？规范给出两类最优设计：

1. 单元格包含**一个不需要方向键的组件**（link、button、menubutton、toggle button、radio button——注意不是 radio group、switch、checkbox）→ 焦点直接落在**该组件**上
2. 单元格只包含**文本或单个图形** → 焦点落在**单元格**上

> **为什么所有单元格都必须可聚焦？** 屏幕阅读器用户与 Grid 交互时，通常处于"应用阅读模式"（而非文档阅读模式）。该模式下用户只能听到可聚焦元素和标注表头的内容——不可聚焦的单元格会被**无声地跳过**，用户甚至不知道它们的存在。

## 四、实现方式

### 4.1 Data Grid：基于原生 table

呈现表格数据时优先复用原生元素，加上角色即可：

```html
<table
  role="grid"
  aria-labelledby="emp-title"
  aria-rowcount="237"
  aria-multiselectable="true">
  <caption id="emp-title">
    Employees
  </caption>
  <thead>
    <tr role="row">
      <th role="columnheader">Name</th>
      <th role="columnheader">Role</th>
      <th role="columnheader">City</th>
      <th role="columnheader">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr
      role="row"
      aria-selected="false">
      <td role="gridcell">Alice</td>
      <td role="gridcell">Designer</td>
      <td role="gridcell">Shanghai</td>
      <td role="gridcell">Active</td>
    </tr>
  </tbody>
</table>
```

### 4.2 Layout Grid：压缩 Tab 序列

购物网站的"猜你喜欢"商品流会源源不断地加载链接。如果所有链接都进 Tab 序列，键盘用户会被困在里面；用 Layout Grid 分组，整个商品流只占一个 Tab 停靠点：

```html
<div
  role="grid"
  aria-label="Recommended Products">
  <div role="row">
    <div role="gridcell">
      <a
        href="/p/1"
        tabindex="-1"
        >Product A</a
      >
    </div>
    <div role="gridcell">
      <a
        href="/p/2"
        tabindex="-1"
        >Product B</a
      >
    </div>
    <div role="gridcell">
      <a
        href="/p/3"
        tabindex="-1"
        >Product C</a
      >
    </div>
  </div>
  <div role="row">
    <div role="gridcell">
      <a
        href="/p/4"
        tabindex="-1"
        >Product D</a
      >
    </div>
    <div role="gridcell">
      <a
        href="/p/5"
        tabindex="-1"
        >Product E</a
      >
    </div>
    <div role="gridcell">
      <a
        href="/p/6"
        tabindex="-1"
        >Product F</a
      >
    </div>
  </div>
</div>
```

只有第一个链接 `tabindex="0"`，其余均为 `-1`，靠方向键到达。

### 4.3 漫游焦点核心逻辑

```ts
function setupGridNavigation(
  grid: HTMLElement,
  colCount: number,
  cells: () => HTMLElement[],
) {
  const focusCell = (cell: HTMLElement) => {
    cells().forEach((c) => (c.tabIndex = -1));
    cell.tabIndex = 0;
    cell.focus();
  };

  grid.addEventListener('keydown', (e) => {
    const list = cells();
    const idx = list.indexOf(document.activeElement as HTMLElement);
    if (idx < 0) return;

    const col = idx % colCount;
    let next = -1;
    switch (e.key) {
      case 'ArrowRight':
        next = idx + 1;
        break;
      case 'ArrowLeft':
        next = idx - 1;
        break;
      case 'ArrowDown':
        next = idx + colCount;
        break;
      case 'ArrowUp':
        next = idx - colCount;
        break;
      case 'Home':
        next = idx - col;
        break;
      case 'End':
        next = idx + (colCount - 1 - col);
        break;
      case 'Enter':
      case 'F2':
      case 'Escape':
        // 编辑模式的暂停/恢复逻辑，见 3.5
        return;
    }
    const target = list[next];
    if (target && next >= 0) {
      e.preventDefault();
      focusCell(target);
    }
  });
}
```

生产实现还需要补全 `Control + Home/End`、`Page Up/Down`、选区扩展，以及动态行加载时的滚动同步。

## 五、最佳实践与常见错误

### 5.1 忘记让所有单元格可聚焦

```html
<!-- ❌ 错误：纯文本 td 无法聚焦，应用模式下会被屏幕阅读器无声跳过 -->
<td role="gridcell">Shanghai</td>

<!-- ✅ 正确：文本单元格本身设置 tabindex="-1"，由漫游焦点控制 -->
<td
  role="gridcell"
  tabindex="-1">
  Shanghai
</td>
```

### 5.2 缺少可访问名称

```html
<!-- ❌ 错误：屏幕阅读器只会朗读 "grid"，用户不知道它是什么 -->
<div role="grid">...</div>

<!-- ✅ 正确：提供可访问名称 -->
<div
  role="grid"
  aria-labelledby="grid-title">
  ...
</div>
```

### 5.3 方向键导致页面滚动

网格内容超出可视区时，`Down Arrow` 默认会滚动页面。必须 `preventDefault()`（见 4.3 的实现），同时确保 `Tab` 键不受影响——它承担着进出 Grid 的职责。

### 5.4 Data Grid 使用回绕导航

```html
<!-- ❌ 错误：在 Data Grid 中行尾回绕到下一行 -->
<!-- 屏幕阅读器用户会失去位置感，不知道自己"换行"了 -->

<!-- ✅ 正确：Data Grid 到边缘即停；回绕只用于 Layout Grid -->
```

### 5.5 虚拟滚动缺失计数属性

```html
<!-- ❌ 错误：DOM 只有 20 行，屏幕阅读器以为整个网格就 20 行 -->
<div role="grid">
  <div
    role="row"
    aria-rowindex="1">
    ...
  </div>
</div>

<!-- ✅ 正确：声明真实总数与当前行的绝对位置 -->
<div
  role="grid"
  aria-rowcount="237">
  <div
    role="row"
    aria-rowindex="58">
    ...
  </div>
</div>
```

### 5.6 滥用 Grid

Grid 的实现成本在所有 Pattern 中名列前茅。以下场景不该用它：

- **静态只读数据** → 用原生 `table`（Table Pattern）
- **单列选项选择** → 用 [Listbox][20]
- **分层展示、无需编辑** → 用 `disclosure` 或 `tree view`
- 只是想让一组按钮支持方向键 → 评估 `toolbar` 或 `radiogroup` 是否更简单

## 六、总结

构建无障碍的 Grid 需要关注：

1. **先做选择题**：可编辑/可交互用 Grid，只读展示用 Table，单纯选择用 Listbox。
2. **单一 Tab 停靠点**：整个 Grid 只占一个 Tab 位置，内部用漫游焦点在单元格间移动。
3. **角色层级正确**：`grid` > `row` > `gridcell`，表头用 `columnheader`/`rowheader`，优先复用原生 `table`。
4. **全单元格可聚焦**：屏幕阅读器的应用模式下，不可聚焦的单元格会被无声跳过。
5. **键盘完备**：方向键、Home/End、Ctrl+Home/End、Page Up/Down、选择键、Enter/F2/Esc 编辑切换，缺一不可。
6. **区分两类 Grid**：Data Grid 到边缘即停、禁用回绕；Layout Grid 可回绕、按键可选。
7. **虚拟滚动补全语义**：`aria-rowcount` 声明总数，`aria-rowindex` 标注绝对位置。

遵循 [W3C Grid Pattern][0] 规范，Grid 是 APG 中交互最复杂的 Pattern 之一，但也是键盘用户体验的天花板——做好它，电子表格级的交互也能对所有用户开放。

## 七、写在最后

Agentic 时代，传统前端的价值正在缩水，但复杂交互、Accessibility 等需求依然旺盛。Grid 是 APG 里最考验工程功底的 Pattern——焦点管理、虚拟滚动、选区模型、编辑态切换环环相扣，任何一个环节的疏漏都会让辅助技术用户寸步难行。AI 能帮你生成大段网格代码，但"回绕该不该开""这个单元格该聚焦谁"这类判断，依然依赖对规范和用户的理解。

这篇文章就是一个缩影——Grid Pattern 讲的不只是代码，而是交互架构、状态管理和无障碍标准的综合应用。AI 让实现成本降低，但"什么是对的交互、什么是好的无障碍"这些判断力，依然是人的核心竞争力。

文章同步于 an-Onion 的 [Github][21]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
[1]: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_general_within
[2]: https://www.w3.org/WAI/ARIA/apg/patterns/table/
[3]: https://www.w3.org/TR/wai-aria-1.2/#grid
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
[6]: https://www.w3.org/TR/wai-aria-1.2/#gridcell
[7]: https://www.w3.org/TR/wai-aria-1.2/#columnheader
[8]: https://www.w3.org/TR/wai-aria-1.2/#rowheader
[9]: https://www.w3.org/TR/wai-aria-1.2/#aria-rowcount
[10]: https://www.w3.org/TR/wai-aria-1.2/#aria-colcount
[11]: https://www.w3.org/TR/wai-aria-1.2/#aria-rowindex
[12]: https://www.w3.org/TR/wai-aria-1.2/#aria-colindex
[13]: https://www.w3.org/TR/wai-aria-1.2/#aria-multiselectable
[14]: https://www.w3.org/TR/wai-aria-1.2/#aria-selected
[15]: https://www.w3.org/TR/wai-aria-1.2/#aria-readonly
[16]: https://www.w3.org/TR/wai-aria-1.2/#aria-disabled
[17]: https://www.w3.org/TR/wai-aria-1.2/#aria-colspan
[18]: https://www.w3.org/TR/wai-aria-1.2/#aria-rowspan
[19]: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_common_conventions
[20]: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
[21]: https://github.com/an-Onion/an-Onion.github.io
