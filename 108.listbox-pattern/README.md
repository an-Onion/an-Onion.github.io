# Listbox Pattern 详解：可滚动选择列表的无障碍实现

Listbox（列表框）是一种用于**呈现一组选项并允许用户选择一个或多个**的输入组件。本文基于 [W3C WAI-ARIA Listbox Pattern][0] 规范，详解 Listbox 的语义结构、键盘交互规范与无障碍实现要点。

## 一、Listbox 的定义与核心概念

### 1.1 什么是 Listbox

Listbox 具有以下特征：

- 呈现一组可见的选项列表
- 允许用户通过键盘或鼠标选择**一个或多个**选项
- 选项可以滚动显示，不占用过多页面空间
- 适用于选项较多（>5 项）、需要持久可见的场景

### 1.2 核心术语

| 术语                  | 说明                          |
| --------------------- | ----------------------------- |
| **Listbox**           | 包含所有选项的容器            |
| **Option**            | 列表中的一个可选项            |
| **Group**             | 选项分组，用于组织相关选项    |
| **Selected State**    | 选项的选中状态                |
| **Active Descendant** | 视觉焦点项（区别于 DOM 焦点） |

```plain
┌─────────────────────────────────────────────────────────────┐
│  Select Your Favorite Fruit                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ◯ Apple                                      [active]│  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  ● Banana                                   [selected]│  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  ◯ Orange                                             │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  ◯ Grape                                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  role="listbox"                                             │
│  role="option" (children)                                   │
│  aria-selected: true/false                                  │
│                                                             │
│  Up/Down: Navigate Options                                  │
│  Space: Toggle Selection                                    │
│  Home: First  |  End: Last                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 两种选择模式

| 模式               | 说明                     | 典型用例           |
| ------------------ | ------------------------ | ------------------ |
| **单选（Single）** | 同一时刻只能选中一个选项 | 性别选择、语言切换 |
| **多选（Multi）**  | 允许同时选中多个选项     | 邮件勾选、标签筛选 |

两种模式的详细对比：

| 特性             | 单选（Single）                | 多选（Multi）                 |
| ---------------- | ----------------------------- | ----------------------------- |
| **选择数量**     | 1 个                          | 多个                          |
| **状态属性**     | `aria-selected`               | `aria-checked`（推荐）        |
| **容器属性**     | 无需额外属性                  | `aria-multiselectable="true"` |
| **典型用例**     | 语言切换、性别选择            | 邮件勾选、标签筛选            |
| **键盘交互**     | 方向键导航 + Enter/Space 选择 | Space 切换 + Shift 区间选择   |
| **选择跟随焦点** | 可选                          | 不推荐                        |
| **全选按钮**     | 无需                          | 推荐提供独立按钮              |

### 1.4 原生 HTML vs ARIA Listbox

| 特性         | 原生 `<select size="n">` | ARIA `role="listbox"`  |
| ------------ | ------------------------ | ---------------------- |
| **可访问性** | 内置，无需额外 ARIA      | 需要手动添加 ARIA 属性 |
| **样式控制** | 样式有限                 | 完全自定义样式         |
| **交互扩展** | 不支持复杂交互           | 支持分组、拖拽等       |
| **推荐度**   | **优先使用**             | 仅在原生能力不足时使用 |

**推荐**：优先使用原生 `<select>` 元素，只有在需要复杂分组、自定义交互或视觉样式超出原生能力时才使用 ARIA Listbox。

### 1.5 Listbox 的边界

W3C 规范特别强调：**Listbox 不适合承载交互式元素**。

> 屏幕阅读器会把每个 option 作为一个扁平字符串朗读，option 内部的语义元素（如标题、链接、按钮）不会被识别。同时，`listbox` 角色所传达的交互模型也不支持与 option 内部的元素交互。

如果你的列表项里需要放链接、按钮、复选框等交互元素，请使用 [Grid Pattern][15] 而不是 Listbox；如果需要输入框 + 下拉选项的组合，请使用 Combobox Pattern。

```html
<!-- ❌ 错误：option 内含按钮，辅助技术无法操作 -->
<li role="option">
  文件 A
  <button aria-label="删除">删除</button>
</li>

<!-- ✅ 正确：使用 Grid Pattern 承载可交互列表 -->
```

此外，规范还提醒两点关于选项命名的实践：

1. **避免过长的选项名**：屏幕阅读器会一次性朗读整个 option 名称，太长会导致用户难以理解，被中断后还得从头重听。
2. **避免选项名以相同词组开头**：例如 `中国 - 北京`、`中国 - 上海`... 这类前缀冗余会让键盘和屏幕阅读器用户反复听到相同内容。更好的做法是拆分为两个 Listbox（国家 + 城市）。

## 二、ARIA 角色与属性

### 2.1 角色结构

| 角色                  | 说明               |
| --------------------- | ------------------ |
| [`role="listbox"`][1] | 包含所有选项的容器 |
| [`role="option"`][2]  | 列表中的一个可选项 |
| [`role="group"`][3]   | 选项分组（可选）   |

### 2.2 容器属性

| 属性                                        | 取值                      | 说明                                                      |
| ------------------------------------------- | ------------------------- | --------------------------------------------------------- |
| [`aria-labelledby`][4] 或 [`aria-label`][5] | ID 引用 / 字符串          | 为 Listbox 提供可访问名称（若非嵌套在 combobox 中则必填） |
| [`aria-multiselectable`][6]                 | `true` / `false`          | 是否支持多选，多选时必须设为 `true`                       |
| [`aria-orientation`][7]                     | `vertical` / `horizontal` | 选项排列方向，默认 `vertical`                             |

### 2.3 选项状态属性

选项的选中状态用 [`aria-selected`][8] 或 [`aria-checked`][9] 表示，**二者只能选其一**，不要在同一个 Listbox 中混用：

```html
<!-- 方式一：使用 aria-selected（推荐用于单选） -->
<li
  role="option"
  aria-selected="true">
  选项 A
</li>
<li
  role="option"
  aria-selected="false">
  选项 B
</li>

<!-- 方式二：使用 aria-checked（推荐用于多选） -->
<li
  role="option"
  aria-checked="true">
  选项 A
</li>
<li
  role="option"
  aria-checked="false">
  选项 B
</li>
```

**选择约定：**

- 单选 Listbox 通常使用 `aria-selected`。
- 多选 Listbox（尤其视觉上是勾选样式）通常使用 `aria-checked`。
- 全站/全应用保持一致约定，不要这里用 `selected` 那里用 `checked`。
- 极其罕见的情况下两者并存需要同时满足三个条件：含义不同、UI 能区分、提供独立控制方式。规范强烈建议避免这种设计。

### 2.4 虚拟滚动场景

当选项数量巨大、采用动态加载时，未渲染到 DOM 的选项需要通过 [`aria-setsize`][10] 和 [`aria-posinset`][11] 告知辅助技术总数和当前位置：

```html
<li
  role="option"
  aria-setsize="1000"
  aria-posinset="42"
  aria-selected="false">
  第 42 项
</li>
```

### 2.5 分组选项

如果选项需要分组，可以在 `listbox` 内嵌套 `group` 角色：

```plain
┌─────────────────────────────────────────────────────────────┐
│  Select City                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  North                                                │  │
│  │  ◯ Beijing                                            │  │
│  │  ◯ Tianjin                                            │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  East                                                 │  │
│  │  ◯ Shanghai                                           │  │
│  │  ◯ Hangzhou                                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  role="group" + aria-label                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**分组规则的强制要求：**

- 每个 `group` 至少包含一个 `option`。
- 每个 `group` 必须通过 `aria-label` 或 `aria-labelledby` 提供可访问名称。

## 三、键盘交互规范

### 3.1 获得焦点时的行为

**单选 Listbox：**

- 若进入前没有任何选项被选中 → 焦点落在第一个选项（可选：同时选中它）。
- 若进入前已有选项被选中 → 焦点落在已选中的那个选项上。

**多选 Listbox：**

- 若进入前无选中项 → 焦点落在第一个选项，不改变任何选中状态。
- 若进入前有选中项 → 焦点落在第一个被选中的选项上。

### 3.2 基础导航键

| 按键                    | 行为                                           |
| ----------------------- | ---------------------------------------------- |
| **↓** Down Arrow        | 焦点移到下一个选项（单选时可选：选择跟随焦点） |
| **↑** Up Arrow          | 焦点移到上一个选项（单选时可选：选择跟随焦点） |
| **Home**（推荐，>5 项） | 焦点移到第一个选项                             |
| **End**（推荐，>5 项）  | 焦点移到最后一个选项                           |

### 3.3 类型提前匹配（Type-ahead）

> 规范**强烈推荐**在选项数 >7 的 Listbox 中实现。

- **输入单个字符**：焦点移到下一个以该字符开头的选项。
- **快速连续输入多个字符**：焦点移到下一个以该字符串开头的选项。

### 3.4 多选的两种交互模型

规范提供了两种多选模型，推荐使用第一种。

#### 模型一：推荐模型（无需按住修饰键）

| 按键                            | 行为                                     |
| ------------------------------- | ---------------------------------------- |
| **Space**                       | 切换当前焦点选项的选中状态               |
| **Shift + ↓**（可选）           | 焦点下移并切换该选项选中状态             |
| **Shift + ↑**（可选）           | 焦点上移并切换该选项选中状态             |
| **Shift + Space**（可选）       | 选中从上次选中项到当前焦点项之间的连续项 |
| **Ctrl + Shift + Home**（可选） | 选中焦点项到第一项之间的所有项           |
| **Ctrl + Shift + End**（可选）  | 选中焦点项到最后一项之间的所有项         |
| **Ctrl + A**（可选）            | 全选（若已全选则可取消全选）             |

#### 模型二：替代模型（需要按住修饰键避免丢选）

这个模型下，不按修饰键移动焦点会丢失其他选中状态，行为更接近原生桌面文件管理器：

| 按键                                                     | 行为                       |
| -------------------------------------------------------- | -------------------------- |
| **Shift + ↓** / **Shift + ↑**                            | 焦点移动并切换选项选中状态 |
| **Ctrl + ↓** / **Ctrl + ↑**                              | 仅移动焦点，不改变选中状态 |
| **Ctrl + Space**                                         | 切换当前焦点选项的选中状态 |
| **Shift + Space**（可选）                                | 选中连续区间               |
| **Ctrl + Shift + Home** / **Ctrl + Shift + End**（可选） | 选中到首/末项              |
| **Ctrl + A**（可选）                                     | 全选                       |

### 3.5 几个关键提醒

1. **焦点 ≠ 选中**：DOM 焦点（active element）和选中状态是两个独立的概念。详见 [focus vs selection][16]。
2. **`aria-activedescendant` 的替代方案**：除了在 `option` 之间移动真实 DOM 焦点，也可以让容器保持焦点，通过 [`aria-activedescendant`][12] 指向当前"视觉焦点"选项。
3. **选择跟随焦点要慎用**：单选 Listbox 中"移动焦点即选中"虽然方便，但在某些场景下会严重降低可访问性，需权衡。
4. **全选/取消全选建议提供独立按钮**：如果这些操作很重要，单独提供按钮比纯键盘快捷键可访问性更好。
5. **水平排列**：如果选项水平排列，方向键语义对调（Down/Up 与 Right/Left 互换），并设置 `aria-orientation="horizontal"`。

```plain
┌─────────────────────────────────────────────────────────────┐
│  Horizontal Listbox                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────┬────────┬────────┬────────┬────────┐             │
│  │ Apple  │ Banana │[Orange]│ Grape  │ Melon  │             │
│  └────────┴────────┴────────┴────────┴────────┘             │
│                         ^                                   │
│                     active option                           │
│                                                             │
│  Left/Right: Navigate Options                               │
│  Home: First  |  End: Last                                  │
│  aria-orientation: "horizontal"                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 四、实现方式

### 4.1 基础 Listbox 结构

```html
<span id="fruit-label">选择你喜欢的水果：</span>

<ul
  role="listbox"
  aria-labelledby="fruit-label"
  tabindex="0">
  <li
    role="option"
    id="opt-1"
    aria-selected="false">
    苹果
  </li>
  <li
    role="option"
    id="opt-2"
    aria-selected="false">
    香蕉
  </li>
  <li
    role="option"
    id="opt-3"
    aria-selected="false">
    橙子
  </li>
  <li
    role="option"
    id="opt-4"
    aria-selected="false">
    葡萄
  </li>
</ul>
```

### 4.2 分组选项结构

```html
<span id="city-label">选择城市：</span>

<ul
  role="listbox"
  aria-labelledby="city-label"
  tabindex="0">
  <li
    role="group"
    aria-label="华北">
    <ul>
      <li
        role="option"
        aria-selected="false">
        北京
      </li>
      <li
        role="option"
        aria-selected="false">
        天津
      </li>
    </ul>
  </li>
  <li
    role="group"
    aria-label="华东">
    <ul>
      <li
        role="option"
        aria-selected="false">
        上海
      </li>
      <li
        role="option"
        aria-selected="false">
        杭州
      </li>
    </ul>
  </li>
</ul>
```

### 4.3 多选 Listbox 结构

```html
<span id="hobby-label">选择你的爱好（可多选）：</span>

<ul
  role="listbox"
  aria-labelledby="hobby-label"
  aria-multiselectable="true"
  tabindex="0">
  <li
    role="option"
    id="opt-1"
    aria-checked="false">
    阅读
  </li>
  <li
    role="option"
    id="opt-2"
    aria-checked="true">
    音乐
  </li>
  <li
    role="option"
    id="opt-3"
    aria-checked="false">
    运动
  </li>
  <li
    role="option"
    id="opt-4"
    aria-checked="false">
    旅行
  </li>
</ul>
```

### 4.4 焦点管理：两种方案

| 方案                        | 实现                                                     | 优点                           | 缺点                                   |
| --------------------------- | -------------------------------------------------------- | ------------------------------ | -------------------------------------- |
| **漫游 DOM 焦点**           | 每次导航把 `focus()` 移到目标 `option`，设 `tabindex=-1` | 实现直观，兼容性最好           | 焦点频繁移动可能触发额外滚动           |
| **`aria-activedescendant`** | 容器始终持有 DOM 焦点，通过属性指向当前"活动选项"        | 避免焦点移动开销，适合复杂容器 | 需保证容器有 `tabindex` 且 id 引用正确 |

**漫游焦点方案**结构上每个 option 需要 `tabindex="-1"`，并在导航时调用 `option.focus()`。  
**`aria-activedescendant` 方案**容器始终 `tabindex="0"` 持有焦点，通过属性指向当前活动 option 的 id。

### 4.5 状态播报

选中状态变化时，通过 [`aria-live`][13] 区域向屏幕阅读器播报，避免用户操作后缺乏反馈：

```html
<div
  class="sr-only"
  aria-live="polite"></div>
```

注意 `aria-live` 不要滥用——每次焦点移动都播报会很吵，通常只在"选中状态变化"这类语义事件上播报。

## 五、最佳实践与常见错误

### 5.1 缺少可访问名称

```html
<!-- ❌ 错误：缺少 aria-labelledby 或 aria-label -->
<ul
  role="listbox"
  tabindex="0">
  <li role="option">苹果</li>
</ul>

<!-- ✅ 正确：通过 aria-labelledby 引用可见标签 -->
<span id="fruit-label">选择水果</span>
<ul
  role="listbox"
  aria-labelledby="fruit-label"
  tabindex="0">
  <li role="option">苹果</li>
</ul>
```

### 5.2 容器无法获得焦点

```html
<!-- ❌ 错误：容器无 tabindex，键盘用户无法进入 -->
<ul
  role="listbox"
  aria-labelledby="label">
  <li role="option">苹果</li>
</ul>

<!-- ✅ 正确：设 tabindex="0" -->
<ul
  role="listbox"
  aria-labelledby="label"
  tabindex="0">
  <li role="option">苹果</li>
</ul>
```

### 5.3 保持视觉焦点与 DOM 焦点一致

无论是漫游焦点还是 `aria-activedescendant`，都要确保**视觉上看到的"高亮项"和屏幕阅读器读到的"当前项"是同一个**。这是无障碍审计中最常见的失败点之一。

### 5.4 滚动可见性

当 Listbox 可滚动时，键盘导航到边缘选项要自动滚动让其可见：

```javascript
activeEl.scrollIntoView({ block: 'nearest' });
```

### 5.5 方向键导致页面滚动

```javascript
// ❌ 错误：未阻止默认行为
handleKeyDown(e) {
  switch (e.key) {
    case 'ArrowDown':
      this.activeIndex++;
      this.updateActive();
      // 页面会跟着滚动
      break;
  }
}

// ✅ 正确：阻止默认行为
handleKeyDown(e) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      this.activeIndex++;
      this.updateActive();
      break;
  }
}
```

### 5.6 谨慎使用"选择跟随焦点"

```javascript
// 单选时，可以在导航的同时选中——但要评估场景
case 'ArrowDown':
  this.activeIndex++;
  this.updateActive();
  this.select(this.activeIndex); // 选择跟随焦点
  break;
```

**适用场景**：表单中选择唯一值，用户期望"按方向键即确定"。
**不适用场景**：浏览型列表，用户可能只是想查看选项而非立即选中。

详见 [Deciding When to Make Selection Automatically Follow Focus][17]。

### 5.7 多选时明确告知"可多选"

- 容器设 `aria-multiselectable="true"`。
- 可见标签或说明文字中提示"可多选，按空格选择"。
- 视觉上使用勾选框（`aria-checked`）而非高亮（`aria-selected`），更符合多选直觉。

## 六、总结

构建无障碍的 Listbox 组件需要关注：

1. **语义清晰**：`role="listbox"` + `role="option"`（+ 可选 `role="group"`）的角色结构要正确，避免在 option 内塞交互元素。
2. **命名完整**：容器和分组都要有可访问名称，优先用 `aria-labelledby`。
3. **键盘完备**：方向键、Home/End、Space、Type-ahead、多选修饰键，缺一不可。
4. **状态同步**：`aria-selected` 或 `aria-checked` 与视觉状态、`aria-live` 播报保持一致。
5. **焦点可控**：漫游焦点或 `aria-activedescendant` 二选一，确保视觉焦点与辅助技术焦点一致。
6. **谨慎跟随**：单选时"选择跟随焦点"按需启用，多选时优先用推荐模型（无需按住修饰键）。

遵循 [W3C Listbox Pattern][0] 规范，我们能够创建既实用又无障碍的列表选择组件。

## 七、写在最后

Agentic 时代，传统前端的价值正在缩水，但 UI/UX、Accessibility 等需求依然旺盛。有人认为其他工种让 AI 写代码会消灭前端，但我反倒认为：**前端工程师成为产品 + 设计 + 实现的全才，反而更容易**。大 AI 时代，已经不需要区分产品经理、设计师、前端、后端等这类细分工种了。拓宽知识边界，成为全链路人才，才是每一个从业者未来的出路。

这篇文章就是一个缩影——Listbox Pattern 讲的不只是代码，而是产品体验、交互规范和无障碍标准。AI 让实现成本降低，但"什么是对的体验、什么是好的无障碍"这些判断力，依然是人的核心竞争力。

文章同步于 an-Onion 的 [Github][14]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
[1]: https://www.w3.org/TR/wai-aria-1.2/#listbox
[2]: https://www.w3.org/TR/wai-aria-1.2/#option
[3]: https://www.w3.org/TR/wai-aria-1.2/#group
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-multiselectable
[7]: https://www.w3.org/TR/wai-aria-1.2/#aria-orientation
[8]: https://www.w3.org/TR/wai-aria-1.2/#aria-selected
[9]: https://www.w3.org/TR/wai-aria-1.2/#aria-checked
[10]: https://www.w3.org/TR/wai-aria-1.2/#aria-setsize
[11]: https://www.w3.org/TR/wai-aria-1.2/#aria-posinset
[12]: https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant
[13]: https://www.w3.org/TR/wai-aria-1.2/#aria-live
[14]: https://github.com/an-Onion/an-Onion.github.io
[15]: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
[16]: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_vs_selection
[17]: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_selection_follows_focus
