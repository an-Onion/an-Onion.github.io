# ARIA Menu Button 模式详解：从规范到工程实践

Menu Button（菜单按钮）是 Web 应用中最常见的交互组件之一，从工具栏的"更多操作"到导航栏的下拉菜单，无处不在。然而，一个看似简单的按钮+弹窗组合，其无障碍实现却涉及复杂的键盘交互、焦点管理和状态同步。本文基于 [W3C WAI-ARIA Menu Button Pattern][0] 规范，深入剖析 Menu Button 的核心机制，并对比分析 shadcn/ui、Radix UI、React Aria 等主流库的实现策略，帮助你在工程中做出合理的技术决策。

## 一、Menu Button 的核心概念

### 1.1 什么是 Menu Button

Menu Button 是一个**触发菜单的按钮**，点击或键盘激活后弹出一个包含选项列表的菜单面板。它与普通的 Button 不同之处在于：

- 具有 [`aria-haspopup`][6] 属性，告知辅助技术这是一个菜单触发器
- 需要管理 [`aria-expanded`][7] 状态，反映菜单的展开/收起
- 菜单打开后，焦点需要正确移交到菜单内部
- 菜单项支持方向键导航，而非 Tab 键

```plain
┌───────────────────────────────────────┐
│                                       │
│  ┌─────────────────────────────┐      │
│  │  Actions              ▼     │      │
│  └─────────────────────────────┘      │
│              │                        │
│              ▼                        │
│  ┌─────────────────────────────┐      │
│  │  Cut                        │      │
│  │  Copy                       │      │
│  │  Paste                      │      │
│  │  Delete                 ⌫   │      │
│  └─────────────────────────────┘      │
│                                       │
│  aria-expanded: true                  │
│  aria-haspopup: menu                  │
│                                       │
└───────────────────────────────────────┘
```

### 1.2 经典应用场景

Menu Button 在 Web 应用中极为常见，以下是几个典型场景：

**工具栏溢出菜单（Toolbar Overflow）**
当工具栏空间不足时，将次要操作（如导出、打印、分享）收纳到"更多"按钮中。例如文档编辑器顶部的 ⋮ 菜单。

**用户头像下拉菜单（User Profile Dropdown）**
导航栏右上角的头像或用户名按钮，点击后展示"个人资料"、"设置"、"退出登录"等选项。

**表格行操作菜单（Row Action Menu）**
数据表格中每行末尾的"操作"按钮，提供编辑、删除、复制、查看详情等针对该行的命令。

**富文本编辑器格式菜单（Format Menu）**
编辑器工具栏中的"字体"、"段落样式"、"插入"等下拉按钮，每项展开一组格式命令。

**筛选与排序菜单（Filter/Sort Menu）**
电商或数据后台中的"筛选"按钮，菜单内提供复选框或单选选项用于过滤列表内容。

这些场景的共性是：按钮触发的是**一组命令或操作**，而非从列表中**选择一个值**。

### 1.3 与相关模式的区别

| 模式            | 用途               | 焦点行为                 |
| --------------- | ------------------ | ------------------------ |
| **Menu Button** | 触发一组操作或命令 | 菜单打开后焦点进入菜单项 |
| **Disclosure**  | 展开/收起内容区域  | 焦点保持在触发按钮上     |
| **Combo Box**   | 输入+选择组合      | 在输入框和列表框间切换   |
| **Select**      | 从列表中选择单个值 | 选中后焦点回到触发器     |

**关键区分**：Menu Button 的菜单项执行**操作**（如复制、删除），而 Select 的选项代表**值**（如选择字体大小）。这一语义差异直接影响辅助技术的朗读方式和用户的交互预期。明确了 Menu Button 与其他模式的区别后，下面来看 W3C 规范对角色和属性的具体要求。

### 1.4 规范要求的角色与属性

根据 W3C 规范，Menu Button 必须满足以下角色和属性要求：

**触发按钮（Menu Button）**：

| 属性                 | 值               | 说明                                 |
| -------------------- | ---------------- | ------------------------------------ |
| `role`               | `button`         | 按钮角色（原生 `<button>` 自动具备） |
| `aria-haspopup`      | `menu` 或 `true` | 声明触发的是菜单                     |
| `aria-expanded`      | `true` / `false` | 菜单的展开状态                       |
| [`aria-controls`][8] | 菜单的 ID        | 关联按钮与菜单（可选但推荐）         |

**菜单容器**：

| 属性                   | 值        | 说明                   |
| ---------------------- | --------- | ---------------------- |
| `role`                 | `menu`    | 标记菜单容器           |
| [`aria-labelledby`][9] | 按钮的 ID | 菜单的 Accessible Name |

**菜单项**：

| 角色               | 说明           |
| ------------------ | -------------- |
| `menuitem`         | 普通菜单项     |
| `menuitemcheckbox` | 可勾选的菜单项 |
| `menuitemradio`    | 单选菜单项     |

### 1.5 键盘交互规范

Menu Button 的键盘交互分为**按钮阶段**和**菜单阶段**：

**按钮获得焦点时**：

| 按键              | 行为                             |
| ----------------- | -------------------------------- |
| `Enter` / `Space` | 打开菜单，焦点移到第一个菜单项   |
| `↓`（可选）       | 打开菜单，焦点移到第一个菜单项   |
| `↑`（可选）       | 打开菜单，焦点移到最后一个菜单项 |

**菜单打开后**：

| 按键              | 行为                                           |
| ----------------- | ---------------------------------------------- |
| `↓`               | 焦点移到下一个菜单项（循环）                   |
| `↑`               | 焦点移到上一个菜单项（循环）                   |
| `Home`            | 焦点移到第一个菜单项                           |
| `End`             | 焦点移到最后一个菜单项                         |
| `Enter` / `Space` | 激活菜单项，关闭菜单，焦点回到按钮             |
| `Esc`             | 关闭菜单，焦点回到按钮                         |
| `Tab`             | **不在菜单项间移动**，而是关闭菜单并将焦点移出 |
| 字母键            | 跳到以该字母开头的下一个菜单项                 |

**关键细节**：菜单内部的导航**不使用 Tab 键**，而是使用方向键。这是 Menu 作为复合组件（Composite Widget）的核心特征——Tab 键只用于进入/离开整个组件，方向键用于内部导航。

```plain
┌───────────────────────────────────────┐
│                                       │
│  Button Focus                         │
│  ┌─────────────────────────────┐      │
│  │  Actions              ▼     │      │
│  └─────────────────────────────┘      │
│                                       │
│  Enter / Space / Down Arrow           │
│              │                        │
│              ▼                        │
│  Menu Open                            │
│  ┌─────────────────────────────┐      │
│  │  ▶ Cut          (Home)      │      │
│  │    Copy         (↑/↓)       │      │
│  │    Paste        (End)       │      │
│  │    Delete       (Type)      │      │
│  └─────────────────────────────┘      │
│                                       │
│  Esc / Enter / Space                  │
│              │                        │
│              ▼                        │
│  Focus Back to Button                 │
│  ┌─────────────────────────────┐      │
│  │  Actions              ▼     │      │
│  └─────────────────────────────┘      │
│                                       │
└───────────────────────────────────────┘
```

## 二、基础实现方案对比

在引入 React Aria、Radix UI 等库之前，理解原生技术如何实现 Menu Button 至关重要。下面分析三种常见的基础方案及其局限性。

### 2.1 方案一：Popover API

Popover API 是较新的原生浏览器 API，通过 HTML `popover` 属性实现顶层弹窗。触发按钮使用 `popovertarget` 属性关联菜单容器的 ID，菜单容器声明 `popover` 属性和 `role="menu"`。浏览器会自动处理弹窗的显示与隐藏，并将菜单提升到 top layer。

**Popover API 自动提供的功能**：

- **顶层渲染**：菜单自动提升到 top layer，无需手动处理 z-index
- **轻焦点管理**：打开时焦点自动移到弹窗内第一个可聚焦元素
- **ESC 关闭**：按 ESC 自动关闭弹窗并将焦点返回触发器
- **点击外部关闭**：点击弹窗外部区域自动关闭
- **可访问性映射**：部分浏览器会自动关联 `aria-expanded` 和 `aria-controls`

**局限性**：

- **方向键导航缺失**：Popover API 不提供方向键在 menuitem 间移动的功能，开发者仍需自行实现键盘导航
- **状态同步**：`aria-expanded` 不会自动跟随 popover 的显隐状态更新，需要 JS 监听 `toggle` 事件
- **浏览器兼容性**：Firefox 和 Safari 支持较晚，旧版浏览器需要 polyfill
- **语义不匹配**：`popover` 的默认语义更接近通用弹窗，而非 `role="menu"` 的复合组件语义

### 2.2 方案二：details + summary

`<details>` 和 `<summary>` 是 HTML5 提供的原生折叠组件，无需任何 JavaScript。`summary` 作为可交互的触发器，点击或按 Space/Enter 可展开或收起其下的内容区域。开发者可以尝试在 `details` 内部嵌入 `role="menu"` 和 `role="menuitem"` 来模拟 Menu Button，但这种方式存在本质性的语义冲突。

**优势**：

- **零 JavaScript**：纯 HTML 实现，语义清晰，无需额外状态管理
- **键盘可访问**：`summary` 默认可通过 Space/Enter 展开收起
- **渐进增强**：即使 JS 失败，基本功能依然可用

**局限性**：

- **不支持 `role="menu"` 的键盘规范**：方向键在 `details` 内部仍按默认 Tab 顺序移动，无法实现 Arrow Up/Down 在 menuitem 间循环导航
- **`aria-expanded` 不自动同步**：`details` 的 open/close 状态不会自动映射到 `aria-expanded`
- **无法阻止 Tab 在菜单项间移动**：W3C 规范要求 Tab 键直接移出菜单而非在菜单项间切换，但 `details` 内部元素天然支持 Tab 导航
- **屏幕阅读器差异**：部分屏幕阅读器将 `details` 朗读为"可折叠区域"而非"菜单"
- **动画受限**：`details` 的 open/close 动画实现困难，缺少进入/退出状态钩子

**结论**：`details + summary` 适合 Disclosure（展开/收起内容）模式，但**不适合 Menu Button 模式**，因为后者要求方向键导航和特定的焦点管理语义。

### 2.3 方案三：CSS :focus / :focus-within

纯 CSS 方案利用 `:focus-within` 或 `:hover` 伪类控制菜单的显示与隐藏。当按钮或其内部元素获得焦点时，`focus-within` 匹配成功，菜单从 `display: none` 变为可见。这种方式无需任何 JavaScript，仅依靠 CSS 选择器即可实现视觉层面的下拉效果。

**优势**：

- **极简**：无 JS，纯 CSS 控制显隐
- **焦点跟随**：`focus-within` 能正确响应焦点进入/离开

**严重局限性**：

- **无法同步 `aria-expanded`**：CSS 无法操作 ARIA 属性，屏幕阅读器不知道菜单已打开
- **方向键导航缺失**：纯 CSS 完全无法处理 Arrow Up/Down/Home/End 等键盘事件
- **无法阻止 Tab 在菜单项间移动**：菜单项如果使用 `tabindex="0"` 会导致 Tab 在菜单内部循环；使用 `tabindex="-1"` 则根本进不去
- **ESC 键无法关闭**：CSS 没有 `:active` 或 `:key-pressed` 伪类来响应 ESC
- **点击外部无法关闭**：除非通过 `:focus-within`，但点击非焦点元素时菜单会意外关闭
- **无 [`aria-activedescendant`][10] 支持**：无法标记当前激活项

**结论**：纯 CSS 方案**无法满足 W3C Menu Button 规范**，仅能作为视觉演示或教学用途，不能用于生产环境的无障碍组件。

### 2.4 三种方案对比总结

| 维度                     | Popover API            | details + summary    | CSS :focus-within    |
| ------------------------ | ---------------------- | -------------------- | -------------------- |
| **JavaScript 依赖**      | 可选（需 JS 补充交互） | 无                   | 无                   |
| **顶层渲染**             | 原生支持               | 否（需 CSS z-index） | 否                   |
| **ESC 关闭**             | 原生支持               | 否                   | 否                   |
| **点击外部关闭**         | 原生支持               | 否                   | 部分（focus-within） |
| **方向键导航**           | 需 JS 补充             | 不支持               | 不支持               |
| **`aria-expanded` 同步** | 需 JS 手动             | 不支持               | 不支持               |
| **W3C 规范符合度**       | 低（需大量 JS 补充）   | 极低                 | 极低                 |
| **生产可用性**           | 未来可期（配合 JS）    | 不推荐               | 不推荐               |

**工程建议**：

- **Popover API** 是目前最有潜力的原生方案，但它只解决了"弹窗显示/隐藏"这一层，**方向键导航、焦点管理和 ARIA 状态同步仍需 JavaScript 补充**。在浏览器生态完全成熟前，它还不能独立支撑生产级的 Menu Button。
- **details + summary** 适合 Disclosure 模式（FAQ、可折叠面板），但不适合 Menu Button 的复合组件交互模型。
- **纯 CSS 方案** 因无法处理键盘事件和 ARIA 状态，**不能用于无障碍 Menu Button 实现**。
- **当前最优解**：在原生 API 补齐之前，仍需借助 JavaScript 框架或专用库（如 Radix UI、React Aria）来实现完全符合 W3C 规范的 Menu Button。

## 三、关键技术点解析

### 3.1 无障碍属性设置

无障碍属性是辅助技术理解组件语义的基础。本节介绍 Menu Button 中最关键的 ARIA 属性及其正确使用方式。

#### 3.1.1 aria-haspopup 的正确使用

`aria-haspopup` 的值决定了辅助技术如何描述这个按钮。推荐明确声明 `aria-haspopup="menu"`，而非模糊的 `true`。在 ARIA 1.1 中，该属性还支持 `listbox`、`tree`、`grid`、`dialog` 等值，精确声明有助于用户建立正确的交互预期，避免将菜单误认为对话框或其他弹窗类型。

#### 3.1.2 aria-expanded 的同步时机

`aria-expanded` 必须在菜单的**显示状态变化完成后**更新，而不是在动画开始前。如果在动画期间更新属性，屏幕阅读器会提前通知用户菜单已打开，但此时菜单内容尚未可见或不可交互，造成状态与感知脱节。对于包含进入/退出动画的组件，应在动画结束回调中同步 ARIA 状态，或在状态机设计中区分 `opening` / `open` / `closing` / `closed` 四个阶段，仅在稳定的 `open` 和 `closed` 阶段更新 `aria-expanded`。

#### 3.1.3 菜单的 Accessible Name

菜单容器必须有 Accessible Name，通常通过 `aria-labelledby` 引用触发按钮的 ID。这样屏幕阅读器会将菜单朗读为"Actions 菜单"或"Actions menu"，帮助用户理解当前所处的上下文。若按钮本身没有可见文本（如图标按钮），则应使用 [`aria-label`][11] 为菜单直接命名。

### 3.2 键盘交互实现

Menu Button 的键盘交互分为按钮阶段和菜单阶段。本节讨论方向键导航、字母键快速跳转以及 Esc 关闭的实现要点。

#### 3.2.1 方向键导航

菜单项间的导航需要处理循环和边界。`ArrowDown` 将焦点移到下一项，到达末尾时循环回第一项；`ArrowUp` 将焦点移到上一项，到达开头时循环回最后一项。`Home` 和 `End` 分别直接跳转到第一项和最后一项。所有方向键操作都需要调用 `event.preventDefault()`，防止页面滚动或其他默认行为干扰。

实现时需要维护一个当前激活项的索引状态，根据按键方向计算目标索引。若采用 `element.focus()` 策略，则直接对目标 DOM 节点调用 `focus()`；若采用 `aria-activedescendant` 策略，则更新该属性指向目标项的 ID，同时保持焦点在按钮上。

#### 3.2.2 字母键快速跳转

W3C 规范要求支持字母键跳转到对应菜单项。当用户按下字母键时，系统应从当前激活项之后开始搜索，找到第一个以该字母开头的菜单项并将焦点移过去。此功能需要累积输入（如快速输入"co"应匹配"Copy"），并在输入间隔超过一定时间（通常 500ms 到 1 秒）后重置累积字符串。

实现时需要维护一个累积输入缓冲区和一个计时器。每次按键时重置计时器，将新字符追加到缓冲区，然后遍历菜单项进行前缀匹配。匹配失败时保留焦点在当前位置，匹配成功则移动焦点。

#### 3.2.3 Esc 键关闭与焦点恢复

按 `Esc` 键必须关闭菜单，并将焦点恢复到触发按钮。这是键盘用户的安全出口——无论菜单层级多深，按 Esc 都能回到已知的起点。如果菜单是通过鼠标打开的，但用户用键盘关闭，焦点恢复能确保键盘用户不会丢失位置，避免焦点意外跳转到页面开头或其他不可预期的地方。

实现时需要在菜单容器的 `keydown` 事件中监听 `Escape` 键，先阻止默认行为，然后调用关闭逻辑，最后通过 `triggerButton.focus()` 或等效方式将焦点移回。

### 3.3 状态管理机制

Menu Button 涉及显隐状态、动画状态、焦点索引等多个状态的协调。本节从状态机模型和受控模式两个角度介绍状态管理策略。

#### 3.3.1 状态机模型

Menu Button 可以用有限状态机描述：

```plain
[closed] -- Enter/Space/Arrow --> [open]
[open] -- Esc/Tab/Select --> [closed]
[open] -- ArrowDown/ArrowUp --> [open]
```

对于包含动画的组件，建议扩展为四个状态：`closed`（完全关闭）、`opening`（开启动画中）、`open`（完全打开）、`closing`（关闭动画中）。只有在 `open` 和 `closed` 两个稳定状态才更新 `aria-expanded`，避免动画期间屏幕阅读器读到不一致的状态。React 中推荐使用 `useReducer` 管理这类复杂状态流转；Vue 可用组合式函数配合响应式状态；原生 JS 可直接使用状态变量和切换函数。

#### 3.3.2 受控与非受控模式

组件库通常应同时支持受控与非受控两种模式。非受控模式下，组件内部自行管理 `isOpen` 状态，开发者只需声明式使用，降低了接入门槛。受控模式则通过 `open` 和 `onOpenChange` 将状态提升到外部，满足复杂交互需求——例如菜单打开时同步加载数据、菜单状态与 URL 同步、或在一个页面中同时只允许一个菜单打开。两种模式的核心差异在于状态所有权，但内部的键盘交互和焦点管理逻辑保持一致。

### 3.4 焦点管理

焦点管理是无障碍 Menu Button 的核心难点。本节讨论菜单打开时的初始焦点位置以及禁用项的处理方式。

#### 3.4.1 初始焦点位置

菜单打开时，焦点位置取决于触发方式：

| 触发方式          | 焦点位置       |
| ----------------- | -------------- |
| 点击按钮          | 第一个菜单项   |
| `Enter` / `Space` | 第一个菜单项   |
| `↓`               | 第一个菜单项   |
| `↑`               | 最后一个菜单项 |

实现时需要记录触发方式（通过判断 `click`、`keydown` 的事件类型和键值），在打开菜单后根据触发方式计算初始焦点索引，然后通过 `element.focus()` 或更新 `aria-activedescendant` 将焦点或激活状态设置到对应项。

#### 3.4.2 禁用项的处理

禁用项应**不参与键盘导航**，但保持可见。实现时需要先过滤出所有未禁用的菜单项索引，方向键导航时仅在可用项之间循环。禁用项使用 [`aria-disabled`][12]="true"`标记，而不是 HTML 的`disabled` 属性（后者会导致该项从 Tab 序列中移除，但 Menu Button 内部本就不使用 Tab 导航）。视觉上禁用项应呈现为灰色或其他非激活样式，鼠标点击时不响应。

## 四、实现要点概述

### 4.1 基础 Menu Button 的实现要点

一个符合 W3C 规范的基础 Menu Button 需要处理以下核心模块：

**状态管理**：内部维护 `isOpen`（菜单显隐）和 `activeIndex`（当前激活项索引）两个核心状态。打开菜单时根据触发方式设置初始焦点位置——点击或按 Enter/Space/Down 时聚焦第一项，按 Up 时聚焦最后一项。关闭菜单时需重置激活索引并将焦点移回按钮。

**按钮事件**：按钮的 `onClick` 负责切换菜单显隐；`onKeyDown` 监听 Enter、Space、ArrowDown 和 ArrowUp，在键盘激活时打开菜单并设置对应初始焦点。

**菜单键盘导航**：菜单容器监听 `onKeyDown`，处理 ArrowDown（下一项）、ArrowUp（上一项）、Home（第一项）、End（最后一项）、Enter/Space（选中并关闭）、Escape（关闭并恢复焦点）、Tab（关闭菜单）以及字母键快速跳转。方向键导航需要跳过禁用项，并在到达边界时循环。

**焦点同步**：若采用 `element.focus()` 策略，需在 `activeIndex` 变化后通过 `useEffect` 将焦点设置到对应菜单项 DOM 节点；菜单关闭时通过 `buttonRef.current?.focus()` 恢复焦点。

**点击外部关闭**：通过全局 `mousedown` 事件监听，判断点击目标是否在菜单或按钮之外，若是则关闭菜单。注意在组件卸载时清理事件监听器。

**ARIA 属性**：按钮需设置 `aria-haspopup="menu"`、`aria-expanded` 和 `aria-controls`；菜单容器设置 `role="menu"` 和 `aria-labelledby`；菜单项设置 `role="menuitem"`、`tabIndex={-1}` 和 `aria-disabled`。

### 4.2 子菜单支持

子菜单是 Menu Button 的进阶用法，常见于复杂的应用菜单：

```plain
┌───────────────────────────────────────┐
│                                       │
│  Parent Menu                          │
│  ┌─────────────────────────────┐      │
│  │  New                        │      │
│  │  Open                       │      │
│  │  Save                       │      │
│  │  Save As    ▶               │      │
│  └──────────────┬──────────────┘      │
│                 │                     │
│                 ▼                     │
│  ┌─────────────────────────────┐      │
│  │  Project...                 │      │
│  │  File...                    │      │
│  │  Workspace...               │      │
│  └─────────────────────────────┘      │
│                                       │
│  → : Open Submenu                     │
│  ← : Close Submenu                    │
│                                       │
└───────────────────────────────────────┘
```

子菜单项本身使用 `role="menuitem"`，同时声明 `aria-haspopup="menu"` 和 `aria-expanded` 表示其具有可展开的子菜单。键盘交互上，按 `ArrowRight` 打开子菜单并将焦点移到第一个子菜单项，按 `ArrowLeft` 或 `Esc` 关闭子菜单并将焦点回到父菜单项。子菜单的上下方向键独立导航，与父菜单互不影响。鼠标悬停时也可触发子菜单展开，但需注意提供适当的延迟或防抖，避免菜单在快速移动鼠标时频繁闪烁。

**子菜单的键盘交互**：

- `→`：打开子菜单，焦点移到第一个子菜单项
- `←` / `Esc`：关闭子菜单，焦点回到父菜单项
- 子菜单的 `↑`/`↓` 独立导航

### 4.3 复选框与单选菜单项

复选框菜单项使用 `role="menuitemcheckbox"`，通过 [`aria-checked`][13] 表达选中状态。视觉上的勾选图标应设置 `aria-hidden="true"`，避免屏幕阅读器重复朗读。单选菜单项使用 `role="menuitemradio"`，通常将多个单选项包裹在 `role="group"` 的容器内，并通过 `aria-label` 为分组命名（如"Zoom"）。同一组内只有一个项能被选中，`aria-checked` 仅在选中项上为 `true`。

## 五、实际应用注意事项

### 5.1 Portal 渲染的考量

菜单通常需要渲染到 `document.body`（Portal）以避免父容器的 `overflow: hidden` 裁剪或 `z-index` 层级被压制。Portal 将菜单 DOM 挂载到 body 下，使其独立于触发按钮的父级布局上下文。但 Portal 会打破框架默认的事件冒泡路径，因此点击外部关闭的逻辑需要基于全局事件监听（如 `document.addEventListener('mousedown')`）配合目标元素判断来实现，而非依赖事件冒泡。

菜单的定位需要动态计算触发按钮的视口坐标（`getBoundingClientRect()`），并在窗口滚动或 resize 时重新计算位置，确保菜单始终对齐按钮。部分框架提供了 `Floating UI` 或 `Popper.js` 等定位引擎，可自动处理边界检测和翻转逻辑。

**注意事项**：

- Portal 会打破 React 的事件冒泡，需要手动处理点击外部关闭
- 菜单的定位需要计算触发按钮的坐标，使用 `getBoundingClientRect()`
- 窗口滚动或 resize 时需要重新计算位置

### 5.2 性能优化

菜单可能在页面中多次出现，且频繁响应用户交互。本节介绍两种常见的性能优化手段。

#### 5.2.1 懒加载菜单内容

对于包含复杂子组件（如图标、嵌套菜单、动态数据）的菜单，推荐在菜单首次打开时才加载其内容，而非在页面初始加载时就挂载全部 DOM。框架层面可通过代码分割（code splitting）和异步组件实现懒加载，配合一个轻量的骨架屏或空状态作为加载占位。

#### 5.2.2 避免频繁重渲染

菜单的状态更新（如 `activeIndex` 变化）不应触发整个应用的重渲染。优化策略包括：将菜单项抽取为独立组件并使用浅比较（如 React 的 `memo`）隔离更新；使用记忆化钩子缓存菜单项列表的渲染结果，避免每次状态变化都重新创建子组件；将频繁变化的状态（如 `activeIndex`）与稳定状态（如 `items` 配置）分离，减少不必要的订阅和重新计算。

### 5.3 移动端与触控设备

**警告**：部分触控辅助技术（如 iOS VoiceOver）可能无法正确触发 Menu Button 的键盘事件。

**优化建议**：

- 确保菜单项有足够的触控目标（至少 44×44px）
- 菜单打开时，允许点击非菜单区域关闭
- 考虑在移动端使用原生 `<select>` 替代复杂的 Menu Button
- 测试时覆盖 TalkBack（Android）和 VoiceOver（iOS）

### 5.4 常见错误

#### 错误 1：缺少 aria-expanded

仅设置 `aria-haspopup="menu"` 而不同步 `aria-expanded` 状态，会导致屏幕阅读器无法感知菜单的展开与收起。触发按钮必须始终维护准确的 `aria-expanded` 值，并在状态变化时立即同步。

#### 错误 2：Tab 键在菜单项间导航

将菜单项设置为 `tabindex="0"` 会让 Tab 键在菜单项之间移动，违反了 Menu 作为复合组件的交互规范。正确做法是所有菜单项使用 `tabindex="-1"`，内部导航仅通过方向键完成，Tab 键直接移出整个菜单组件。

#### 错误 3：菜单关闭后焦点丢失

关闭菜单时若未将焦点恢复到触发按钮，键盘用户会丢失当前位置，屏幕阅读器可能回到页面开头或跳转到不可预期的元素。无论菜单是通过鼠标、键盘还是触摸关闭，都必须确保焦点最终落在按钮上。

#### 错误 4：菜单项使用 `<a>` 标签但缺少 href

没有 `href` 属性的 `<a>` 标签在语义上不是真正的链接，无法通过键盘激活，也不会被部分辅助技术识别为交互元素。如果菜单项执行的是命令操作（如复制、删除），应使用 `<button>`；如果是页面导航，则必须提供有效的 `href`。

## 六、测试清单

部署前，使用以下清单验证 Menu Button 的无障碍性：

| 检查项                         | 验证方式                        |
| ------------------------------ | ------------------------------- |
| 按钮有 `aria-haspopup="menu"`  | Chrome DevTools > Accessibility |
| `aria-expanded` 状态正确同步   | 屏幕阅读器                      |
| 菜单项使用 `role="menuitem"`   | Chrome DevTools                 |
| 方向键在菜单项间导航           | 键盘测试                        |
| Tab 键移出菜单（不在项间移动） | 键盘测试                        |
| Esc 关闭菜单并恢复焦点到按钮   | 键盘测试                        |
| 点击外部关闭菜单               | 鼠标测试                        |
| 字母键跳转到对应菜单项         | 键盘测试                        |
| 禁用项不可聚焦                 | 键盘测试                        |
| 焦点样式清晰可见               | 视觉检查                        |
| 屏幕阅读器正确朗读"菜单"       | NVDA/VoiceOver                  |
| 触控目标 ≥ 44×44px             | DevTools 审查                   |

## 七、总结

Menu Button 是一个看似简单但实现精细的组件。核心要点：

1. **语义优先**：使用 `aria-haspopup="menu"` 和 `aria-expanded` 准确表达组件语义
2. **键盘为王**：方向键内部导航、Esc 关闭、Tab 移出、字母键跳转
3. **焦点管理**：菜单关闭后必须将焦点恢复到触发按钮
4. **方案选择**：Popover API 是未来趋势但仍需 JavaScript 补充交互；纯 CSS 和 details 方案不满足 W3C 规范，不推荐用于生产环境
5. **测试不可少**：覆盖键盘、屏幕阅读器、触控设备

## 参考链接

- [W3C WAI-ARIA Menu Button Pattern][0]
- [W3C Menu and Menubar Pattern][1]
- [Radix UI DropdownMenu][2]
- [React Aria useMenuTrigger][3]
- [shadcn/ui DropdownMenu][4]
- [Ariakit Menu][5]

文章同步于 an-Onion 的 [Github][11]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
[1]: https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
[2]: https://www.radix-ui.com/primitives/docs/components/dropdown-menu
[3]: https://react-spectrum.adobe.com/react-aria/useMenuTrigger.html
[4]: https://ui.shadcn.com/docs/components/dropdown-menu
[5]: https://ariakit.org/components/menu
[6]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-haspopup
[7]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded
[8]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-controls
[9]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-labelledby
[10]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant
[11]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label
[12]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled
[13]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-checked
