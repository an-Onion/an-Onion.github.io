# Menu and Menubar Pattern 详解：持久化菜单栏的无障碍实现

Menu（菜单）与 Menubar（菜单栏）是桌面应用中最经典的交互组件之一。本文基于 [W3C WAI-ARIA Menu and Menubar Pattern][0] 规范，详解 Menu/Menubar 的语义结构、复杂的键盘交互模型与无障碍实现要点。

## 一、Menu 与 Menubar 的定义与核心概念

### 1.1 什么是 Menu 和 Menubar

**Menu** 是一种向用户提供一组选项（如操作或功能）的组件，行为类似操作系统原生菜单。**Menubar** 是视觉上持久存在的 Menu，通常水平排列，类似桌面应用窗口顶部的菜单栏。

两者的关键区别：

| 概念        | 可见性   | 典型排列 | 触发方式                    |
| ----------- | -------- | -------- | --------------------------- |
| **Menu**    | 临时显示 | 垂直     | Menu Button、子菜单、快捷键 |
| **Menubar** | 持久可见 | 水平     | Tab 键进入                  |

> 规范约定：如果菜单项会打开对话框，通常在标签后附加"……"（省略号），例如 `Save As…`。

### 1.2 核心术语

| 术语                 | 说明                                     |
| -------------------- | ---------------------------------------- |
| **Menubar**          | 持久可见的菜单容器，通常水平排列         |
| **Menu**             | 临时显示的菜单容器，通常垂直排列         |
| **Menu Item**        | 菜单中的一个可选项                       |
| **Parent Menu Item** | 拥有子菜单的菜单项                       |
| **Submenu**          | 从父菜单项展开的子菜单（role 为 `menu`） |
| **Separator**        | 菜单中的分隔线，不可聚焦，不可交互       |

### 1.3 与 Menu Button 的关系

[Menu Button Pattern][17] 描述的是"按钮触发菜单"的场景，而 Menu and Menubar Pattern 描述的是菜单本身的结构和交互。两者共享相同的角色（`menu`、`menuitem`）和子菜单交互逻辑，区别在于入口方式：

- **Menu Button** → 打开一个 `menu`（临时显示）
- **Menubar** → 本身就是持久可见的菜单容器

```plain
┌─────────────────────────────────────────────────────────────┐
│  Menubar (persistent)                                       │
│                                                             │
│  ┌────────┬────────┬────────┬────────┐                      │
│  │ File   │ Edit   │ View   │ Help   │                      │
│  └────────┴────────┴────────┴────────┘                      │
│       |                                                     │
│       v Down Arrow                                          │
│                                                             │
│  ┌─────────────────────────────────┐                        │
│  │  New                            │                        │
│  │  Open                           │                        │
│  │  Save                           │                        │
│  │  Save As...                     │                        │
│  │  ─────────────────────────────  │                        │
│  │  Print                          │                        │
│  │  Exit                           │                        │
│  └─────────────────────────────────┘                        │
│                                                             │
│  Menu (temporary, opened from menubar)                      │
│                                                             │
│  Left/Right: Navigate Menubar                               │
│  Down/Enter: Open Submenu                                   │
│  Up/Down: Navigate Menu Items                               │
│  Esc: Close Menu                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 典型应用场景

- **编辑器菜单栏**：文档编辑器顶部的 File / Edit / View / Help 菜单
- **网站导航菜单栏**：网站的持久化导航，每个菜单项可展开子菜单
- **上下文菜单**：通过 `Shift + F10`（Windows）等快捷键触发的右键菜单
- **富文本编辑器格式菜单**：包含复选框（如 Bold）和单选项（如 Align Left/Center/Right）的子菜单

## 二、ARIA 角色与属性

### 2.1 角色结构

| 角色                           | 说明                           |
| ------------------------------ | ------------------------------ |
| [`role="menubar"`][1]          | 持久可见的菜单栏容器           |
| [`role="menu"`][2]             | 临时显示的菜单容器（含子菜单） |
| [`role="menuitem"`][3]         | 普通菜单项                     |
| [`role="menuitemcheckbox"`][4] | 可勾选的菜单项                 |
| [`role="menuitemradio"`][5]    | 单选菜单项                     |
| [`role="separator"`][6]        | 菜单分隔线（不可聚焦）         |

### 2.2 容器属性

| 属性                     | 取值                      | 说明                                            |
| ------------------------ | ------------------------- | ----------------------------------------------- |
| [`aria-labelledby`][11]  | ID 引用                   | Menubar 的可访问名称（引用可见标签）            |
| [`aria-label`][12]       | 字符串                    | Menubar 的可访问名称（无可见标签时使用）        |
| [`aria-orientation`][13] | `horizontal` / `vertical` | Menubar 默认 `horizontal`；Menu 默认 `vertical` |

> **注意**：`menubar` 的 `aria-orientation` 默认是 `horizontal`，而 `menu` 的默认是 `vertical`。如果排列方向与默认不同，必须显式声明。

### 2.3 菜单项属性

**父菜单项（拥有子菜单）**：

| 属性                 | 值               | 说明                 |
| -------------------- | ---------------- | -------------------- |
| [`aria-haspopup`][7] | `menu` 或 `true` | 声明此项可打开子菜单 |
| [`aria-expanded`][8] | `true` / `false` | 子菜单的展开状态     |

**复选框与单选菜单项**：

| 属性                | 值               | 说明     |
| ------------------- | ---------------- | -------- |
| [`aria-checked`][9] | `true` / `false` | 选中状态 |

**禁用菜单项**：

| 属性                  | 值     | 说明                             |
| --------------------- | ------ | -------------------------------- |
| [`aria-disabled`][10] | `true` | 禁用状态（仍可聚焦，但不可激活） |

### 2.4 分组与分隔

`menuitemradio` 同组内只能有一项选中。规范要求用 `separator` 分隔不同组：

```html
<li
  role="menuitemradio"
  aria-checked="true">
  Left
</li>
<li
  role="menuitemradio"
  aria-checked="false">
  Center
</li>
<li
  role="menuitemradio"
  aria-checked="false">
  Right
</li>
<li role="separator"></li>
<li role="menuitem">Customize…</li>
```

Separator 的 [`aria-orientation`][13] 应与其视觉方向一致（水平分隔线设 `horizontal`，垂直设 `vertical`）。

### 2.5 非 DOM 子元素

如果使用 [`aria-owns`][15] 将非 DOM 子元素纳入菜单，这些元素会按引用顺序排列在 DOM 子元素之后。焦点管理脚本需确保视觉焦点顺序与辅助技术的阅读顺序一致。

## 三、键盘交互规范

Menu/Menubar 的键盘交互是所有 ARIA Pattern 中最复杂的之一，因为涉及**水平导航**（Menubar 内）和**垂直导航**（Menu 内）两个维度，以及子菜单的展开/收起。

### 3.1 焦点进入行为

**Tab / Shift + Tab 进入 Menubar**：

- 首次进入：焦点落在第一个 `menuitem`
- 再次进入：焦点可选地落在上次获得焦点的 `menuitem`；否则落在第一个未禁用的 `menuitem`

> **注意**：Tab/Shift+Tab **不会**进入 `menu`（临时菜单）。`menu` 打开时，作者需确保焦点自动移到菜单内第一个项。

**Tab / Shift + Tab 离开**：

- 焦点在 `menu` 或 `menubar` 内时，Tab/Shift+Tab 移出整个菜单，并关闭所有已打开的菜单和子菜单。

### 3.2 Menubar 内部导航（水平）

| 按键     | 行为                                   |
| -------- | -------------------------------------- |
| **→**    | 焦点移到下一个菜单项（可选循环）       |
| **←**    | 焦点移到上一个菜单项（可选循环）       |
| **Home** | 焦点移到第一个菜单项（不支持循环时）   |
| **End**  | 焦点移到最后一个菜单项（不支持循环时） |

### 3.3 子菜单操作

| 按键      | 焦点位置           | 行为                                            |
| --------- | ------------------ | ----------------------------------------------- |
| **↓**     | Menubar 菜单项     | 打开子菜单，焦点移到第一个子菜单项              |
| **↓**     | Menu 内            | 焦点移到下一项（可选循环）                      |
| **↑**     | Menu 内            | 焦点移到上一项（可选循环）                      |
| **↑**     | Menubar 菜单项     | （可选）打开子菜单，焦点移到最后一个子菜单项    |
| **→**     | Menu 内有子菜单    | 打开子菜单，焦点移到第一个子菜单项              |
| **→**     | Menu 内无子菜单    | 关闭当前子菜单及父菜单，焦点移到 Menubar 下一项 |
| **←**     | 子菜单内           | 关闭子菜单，焦点回到父菜单项                    |
| **←**     | Menubar 内         | 焦点移到上一个菜单项                            |
| **Enter** | 有子菜单的项       | 打开子菜单，焦点移到第一个子菜单项              |
| **Enter** | 无子菜单的项       | 激活该项，关闭菜单                              |
| **Space** | `menuitemcheckbox` | （可选）切换选中状态，不关闭菜单                |
| **Space** | `menuitemradio`    | （可选）选中该项，不关闭菜单                    |
| **Esc**   | 菜单内             | 关闭当前菜单，焦点回到触发源（按钮或父菜单项）  |

### 3.4 → 键的无子菜单分支（关键细节）

当焦点在子菜单中一个**无子菜单**的项上按 `→` 时，执行三步操作：

1. 关闭当前子菜单及所有父菜单
2. 焦点移到 Menubar 的下一个菜单项
3. 如果新的焦点项有子菜单：**（推荐）** 打开其子菜单但焦点保持在 Menubar 项上；或打开子菜单并将焦点移到第一个子菜单项

> 如果没有 Menubar（如从 Menu Button 打开的菜单），`→` 在无子菜单项上不做任何操作。

### 3.5 ← 键的子菜单分支（关键细节）

当焦点在 Menubar 某项的子菜单内按 `←` 时，执行三步操作：

1. 关闭子菜单
2. 焦点移到 Menubar 的上一个菜单项
3. 如果新的焦点项有子菜单：**（推荐）** 打开其子菜单但焦点保持在 Menubar 项上；或打开子菜单并将焦点移到第一个子菜单项

### 3.6 其他按键

| 按键       | 行为                                       |
| ---------- | ------------------------------------------ |
| **字母键** | （可选）焦点移到下一个以该字符开头的菜单项 |
| **Esc**    | 关闭菜单，焦点回到触发源                   |

### 3.7 垂直排列的方向交换

如果 Menubar 是**垂直**排列，或 Menu 是**水平**排列，方向键语义互换：

- `↓` 执行 `→` 的逻辑，反之亦然
- `↑` 执行 `←` 的逻辑，反之亦然

```plain
┌─────────────────────────────────────────────────────────────┐
│  Vertical Menubar                                           │
│                                                             │
│  ┌────────┐                                                 │
│  │ File   │                                                 │
│  ├────────┤                                                 │
│  │ Edit   │  <- Up/Down navigates menubar                   │
│  ├────────┤  <- Left/Right opens/closes submenu             │
│  │ View   │                                                 │
│  ├────────┤                                                 │
│  │ Help   │                                                 │
│  └────────┘                                                 │
│                                                             │
│  aria-orientation: "vertical"                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 四、实现方式

### 4.1 基础 Menubar 结构

```html
<span
  id="app-label"
  class="sr-only"
  >Editor Menu</span
>

<ul
  role="menubar"
  aria-labelledby="app-label">
  <li
    role="menuitem"
    tabindex="0">
    File
  </li>
  <li
    role="menuitem"
    tabindex="-1">
    Edit
  </li>
  <li
    role="menuitem"
    tabindex="-1">
    View
  </li>
  <li
    role="menuitem"
    tabindex="-1">
    Help
  </li>
</ul>
```

> 漫游焦点方案：Menubar 第一项 `tabindex="0"`，其余项 `tabindex="-1"`。导航时动态更新 tabindex 或直接调用 `element.focus()`。

### 4.2 带子菜单的 Menubar 结构

```html
<ul
  role="menubar"
  aria-label="Editor">
  <!-- File 菜单 -->
  <li
    role="menuitem"
    tabindex="0"
    aria-haspopup="true"
    aria-expanded="false">
    File
    <!-- 子菜单必须在 DOM 中紧跟父菜单项，作为其兄弟元素 -->
    <ul
      role="menu"
      aria-label="File">
      <li
        role="menuitem"
        tabindex="-1">
        New
      </li>
      <li
        role="menuitem"
        tabindex="-1">
        Open…
      </li>
      <li
        role="menuitem"
        tabindex="-1">
        Save
      </li>
      <li
        role="menuitem"
        tabindex="-1"
        aria-haspopup="true"
        aria-expanded="false">
        Save As
        <!-- 嵌套子菜单 -->
        <ul
          role="menu"
          aria-label="Save As">
          <li
            role="menuitem"
            tabindex="-1">
            Project…
          </li>
          <li
            role="menuitem"
            tabindex="-1">
            File…
          </li>
        </ul>
      </li>
      <li role="separator"></li>
      <li
        role="menuitem"
        tabindex="-1">
        Exit
      </li>
    </ul>
  </li>
  <!-- Edit 菜单 -->
  <li
    role="menuitem"
    tabindex="-1"
    aria-haspopup="true"
    aria-expanded="false">
    Edit
    <ul
      role="menu"
      aria-label="Edit">
      <li
        role="menuitem"
        tabindex="-1">
        Undo
      </li>
      <li
        role="menuitem"
        tabindex="-1">
        Redo
      </li>
    </ul>
  </li>
</ul>
```

**子菜单 DOM 结构的强制要求**：

- 子菜单的 `menu` 元素必须包含在父 `menu` 元素内
- 子菜单 `menu` 必须是其父 `menuitem` 的**紧随的兄弟元素**（DOM 顺序）
- 父 `menuitem` 必须设置 `aria-haspopup="menu"` 或 `aria-haspopup="true"`

### 4.3 复选框与单选菜单项

```html
<!-- View 菜单：复选框菜单项 -->
<li
  role="menuitem"
  tabindex="-1"
  aria-haspopup="true"
  aria-expanded="false">
  View
  <ul
    role="menu"
    aria-label="View">
    <li
      role="menuitemcheckbox"
      tabindex="-1"
      aria-checked="true">
      Show Ruler
    </li>
    <li
      role="menuitemcheckbox"
      tabindex="-1"
      aria-checked="false">
      Show Grid
    </li>
    <li role="separator"></li>
    <!-- 单选组 -->
    <li
      role="menuitemradio"
      tabindex="-1"
      aria-checked="true">
      Left
    </li>
    <li
      role="menuitemradio"
      tabindex="-1"
      aria-checked="false">
      Center
    </li>
    <li
      role="menuitemradio"
      tabindex="-1"
      aria-checked="false">
      Right
    </li>
  </ul>
</li>
```

### 4.4 焦点管理：两种方案

| 方案                        | 实现                                            | 优点                           | 缺点                                   |
| --------------------------- | ----------------------------------------------- | ------------------------------ | -------------------------------------- |
| **漫游 DOM 焦点**           | 每次导航把 `focus()` 移到目标菜单项             | 实现直观，兼容性最好           | 焦点频繁移动可能触发额外滚动           |
| **`aria-activedescendant`** | 容器持有 DOM 焦点，通过属性指向当前"活动菜单项" | 避免焦点移动开销，适合复杂容器 | 需保证容器有 `tabindex` 且 id 引用正确 |

### 4.5 纯 HTML 实现：Popover API 的边界

HTML Popover API（`popover` 属性 + `popovertarget`）是 2023 年新增的原生能力，许多 UI 库（如 [daisyUI Megamenu][18]）已采用：

```html
<button popovertarget="file-menu">File</button>
<div
  id="file-menu"
  popover>
  <ul>
    <li><a href="/new">New</a></li>
    <li><a href="/open">Open</a></li>
  </ul>
</div>
```

Popover API 提供的能力：

| 能力                              | 支持                   | Menu Pattern 要求 |
| --------------------------------- | ---------------------- | ----------------- |
| 触发/显隐                         | ✅ 声明式              | 无要求            |
| Esc 关闭                          | ✅ 内置                | ✅ 必须           |
| 点击外部关闭                      | ✅ light dismiss       | 未明确要求        |
| `role="menubar"` / `role="menu"`  | ❌ 缺失                | ✅ 必须           |
| `role="menuitem"`                 | ❌ 用 `<button>`/`<a>` | ✅ 必须           |
| 方向键导航                        | ❌ 不支持              | ✅ 必须           |
| `aria-haspopup` / `aria-expanded` | ❌ 未设置              | ✅ 父项必须       |

**结论**：Popover API 方案**部分符合标准**。是否可接受取决于用途：

- **导航型菜单**（如网站 Megamenu，内容是链接）：Popover API 可接受。W3C 不强制导航菜单使用 Menu Pattern，用 `<nav>` + `<ul>` + `<a>` 也能实现可访问的导航
- **应用型菜单**（如编辑器 File/Edit/View，内容是命令+快捷键）：**不符合标准**。缺少方向键导航和 ARIA 菜单语义，屏幕阅读器用户无法获得"菜单"的心智模型

## 五、最佳实践与常见错误

### 5.1 子菜单 DOM 结构错误

```html
<!-- ❌ 错误：子菜单不是父 menuitem 的兄弟元素 -->
<li
  role="menuitem"
  aria-haspopup="true">
  File
</li>
<ul role="menu">
  <!-- 破坏了兄弟关系 -->
  <li role="menuitem">New</li>
</ul>

<!-- ✅ 正确：子菜单紧跟父 menuitem，作为其兄弟元素 -->
<li
  role="menuitem"
  aria-haspopup="true"
  aria-expanded="false">
  File
  <ul role="menu">
    <li role="menuitem">New</li>
  </ul>
</li>
```

### 5.2 Tab 键在菜单项间移动

```html
<!-- ❌ 错误：所有菜单项都设 tabindex="0" -->
<li
  role="menuitem"
  tabindex="0">
  File
</li>
<li
  role="menuitem"
  tabindex="0">
  Edit
</li>
<!-- Tab 会停在这里 -->

<!-- ✅ 正确：仅 Menubar 首项 tabindex="0" -->
<li
  role="menuitem"
  tabindex="0">
  File
</li>
<li
  role="menuitem"
  tabindex="-1">
  Edit
</li>
<!-- Tab 直接跳过 -->
```

Menu/Menubar 是复合组件（Composite Widget），Tab 键只用于进入/离开整个组件，**内部导航使用方向键**。

### 5.3 缺少 aria-expanded 同步

父菜单项必须始终维护准确的 `aria-expanded` 值。子菜单展开时设为 `true`，收起时设为 `false`。如果仅靠 CSS 控制显隐而不同步 ARIA 状态，屏幕阅读器用户无法感知子菜单是否已打开。

### 5.4 禁用项不可聚焦

```html
<!-- ❌ 错误：使用 disabled 属性导致不可聚焦 -->
<li
  role="menuitem"
  disabled>
  Save
</li>

<!-- ✅ 正确：使用 aria-disabled，保持可聚焦 -->
<li
  role="menuitem"
  aria-disabled="true">
  Save
</li>
```

规范明确要求：**禁用菜单项应可聚焦但不可激活**。使用 `aria-disabled="true"` 而非 HTML `disabled` 属性，后者会将元素从 Tab 序列中完全移除。

### 5.5 Separator 不可聚焦

`separator` 角色的元素**不可聚焦，不可交互**。不要给 separator 设置 `tabindex`，也不要绑定事件。它的唯一作用是视觉分隔和语义分组。

### 5.6 方向键未 preventDefault

方向键在菜单内必须调用 `e.preventDefault()`，否则会触发页面滚动。这在水平 Menubar 中尤为关键——`←`/`→` 在浏览器中可能有历史导航等默认行为。

### 5.7 Esc 焦点恢复

按 `Esc` 关闭菜单时，焦点必须回到**触发源**：

- 从 Menubar 打开的子菜单 → 焦点回到 Menubar 中的父菜单项
- 从 Menu Button 打开的菜单 → 焦点回到触发按钮
- 通过快捷键（如 `Shift + F10`）打开的上下文菜单 → 焦点回到调用上下文（如编辑器）

### 5.8 导航菜单栏的特殊约定

规范指出，导航型 Menubar 可能存在一种特殊设计：`menuitem` **既执行导航又打开子菜单**。在这种实现中：

- `Enter` / `Space`：执行导航功能（如加载新内容）
- `↓`（水平 Menubar）：打开该项的子菜单

> 规范建议尽量避免这种设计，因为它打破了菜单项的常规交互预期。但如果确实需要，务必在可见说明中告知用户"按向下箭头查看更多选项"。

## 六、Agentic 时代 Menubar 的定位

有趣的是，当前 AI 原生应用（如 ChatGPT、Claude）几乎**不使用 Menubar**。原因有三：

1. **功能不可枚举**——AI 能做的事是开放的，无法穷举为静态菜单项
2. **用户意图优先**——用户直接描述需求，而非"找到功能 → 点击"
3. **功能在对话流中动态生成**——菜单是静态的，但 AI 输出是动态的

那为什么还要学这个 Pattern？因为 AI 应用正在从"聊天框"演变为"可操作的应用"。当 Agentic 前端需要渲染 AI 生成的复杂 UI（如 DSL 流生成的 Dashboard、表单、工具栏）时，Menubar 会重新获得价值——它提供**功能可发现性**（discoverability），帮用户知道"这个 AI 应用到底能做什么"。

所以这篇博客的定位是**基础设施**：不是"AI 应用现在常用 Menubar"，而是"AI 应用复杂化后会需要 Menubar"。Agentic 时代的 Menubar 会以动态生成的形式出现——LLM 根据当前上下文生成菜单项，而非开发者在代码里写死。

## 七、总结

构建无障碍的 Menu/Menubar 组件需要关注：

1. **角色清晰**：`menubar`（持久） vs `menu`（临时）；菜单项根据语义选择 `menuitem` / `menuitemcheckbox` / `menuitemradio`。
2. **子菜单结构**：子菜单 `menu` 必须是父 `menuitem` 的紧随兄弟元素，父项设置 `aria-haspopup` 和 `aria-expanded`。
3. **键盘交互**：Menubar 用 `←`/`→` 水平导航，Menu 用 `↑`/`↓` 垂直导航；`Enter`/`↓` 打开子菜单，`←`/`Esc` 收起子菜单。
4. **Tab 不进 Menu**：Tab/Shift+Tab 只进入/离开 Menubar，Menu 打开时焦点自动移到内部第一项。
5. **焦点管理**：漫游焦点或 `aria-activedescendant` 二选一；Menubar 首项 `tabindex="0"`，其余 `-1`。
6. **禁用项可聚焦**：用 `aria-disabled` 而非 `disabled`，保持可聚焦但不可激活。
7. **方向交换**：垂直 Menubar 或水平 Menu 需交换方向键语义，并设置对应的 `aria-orientation`。

遵循 [W3C Menu and Menubar Pattern][0] 规范，我们能够创建既符合桌面用户直觉又满足无障碍标准的菜单组件。

文章同步于 an-Onion 的 [Github][16]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
[1]: https://www.w3.org/TR/wai-aria-1.2/#menubar
[2]: https://www.w3.org/TR/wai-aria-1.2/#menu
[3]: https://www.w3.org/TR/wai-aria-1.2/#menuitem
[4]: https://www.w3.org/TR/wai-aria-1.2/#menuitemcheckbox
[5]: https://www.w3.org/TR/wai-aria-1.2/#menuitemradio
[6]: https://www.w3.org/TR/wai-aria-1.2/#separator
[7]: https://www.w3.org/TR/wai-aria-1.2/#aria-haspopup
[8]: https://www.w3.org/TR/wai-aria-1.2/#aria-expanded
[9]: https://www.w3.org/TR/wai-aria-1.2/#aria-checked
[10]: https://www.w3.org/TR/wai-aria-1.2/#aria-disabled
[11]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[12]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
[13]: https://www.w3.org/TR/wai-aria-1.2/#aria-orientation
[14]: https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant
[15]: https://www.w3.org/TR/wai-aria-1.2/#aria-owns
[16]: https://github.com/an-Onion/an-Onion.github.io
[17]: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
[18]: https://daisyui.com/components/megamenu/
