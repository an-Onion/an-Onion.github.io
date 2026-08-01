# 深入理解 WAI-ARIA Listbox 模式：构建无障碍可滚动选择列表

> 本文基于 [W3C WAI-ARIA Authoring Practices Guide (APG) - Listbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) 撰写，系统讲解 Listbox 组件的语义结构、键盘交互规范与无障碍实现要点。

## 一、什么是 Listbox

**Listbox（列表框）** 是一种用于呈现一组选项并允许用户选择其中一个或多个的 UI 组件。它和我们常用的原生 `<select>` 元素关系密切，但提供了更灵活的样式定制和交互扩展能力。

根据选择模式的不同，Listbox 分为两类：

- **单选 Listbox（Single-select）**：同一时刻只能选中一个选项。
- **多选 Listbox（Multi-select）**：允许同时选中多个选项。

### 典型应用场景

- 邮箱客户端中邮件列表的勾选
- 文件管理器中文件的多选操作
- 表单中需要展示较多选项（>5 项）且希望可见的列表
- 带分组、可拖拽排序的复杂选择场景

### Listbox 的"边界"

W3C 规范特别强调了一个容易踩坑的点：**Listbox 不适合承载交互式元素**。

> 屏幕阅读器在呈现 Listbox 时，会把每个 option 作为一个扁平字符串朗读，option 内部的语义元素（如标题、链接、按钮）不会被识别。同时，`listbox` 角色所传达的交互模型也不支持与 option 内部的元素交互。

如果你的列表项里需要放链接、按钮、复选框等交互元素，请使用 [Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) 而不是 Listbox。

此外，规范还提醒两点关于选项命名的实践：

1. **避免过长的选项名**：屏幕阅读器会一次性朗读整个 option 名称，太长会导致用户难以理解，被中断后还得从头重听。
2. **避免选项名以相同词组开头**：例如 `中国 - 北京`、`中国 - 上海`... 这类前缀冗余会让键盘和屏幕阅读器用户在逐项浏览时反复听到相同内容。更好的做法是拆分为两个 Listbox（国家 + 城市）。

## 二、核心 ARIA 角色与属性

### 2.1 角色结构

Listbox 的 DOM 结构非常简洁，只有两个核心角色：

| 角色      | 元素               | 作用                   |
| :-------- | :----------------- | :--------------------- |
| `listbox` | 包含所有选项的容器 | 标识这是一个列表框组件 |
| `option`  | 每个可选项         | 标识列表中的一个选项   |

如果选项需要分组，可以在 `listbox` 内嵌套 `group` 角色：

```html
<ul
  role="listbox"
  aria-labelledby="label">
  <li
    role="group"
    aria-label="亚洲">
    <ul>
      <li role="option">北京</li>
      <li role="option">东京</li>
    </ul>
  </li>
  <li
    role="group"
    aria-label="欧洲">
    <ul>
      <li role="option">巴黎</li>
      <li role="option">伦敦</li>
    </ul>
  </li>
</ul>
```

**分组规则的强制要求：**

- 每个 `group` 至少包含一个 `option`。
- 每个 `group` 必须通过 `aria-label` 或 `aria-labelledby` 提供可访问名称。

### 2.2 容器属性

| 属性                              | 取值                      | 说明                                                      |
| :-------------------------------- | :------------------------ | :-------------------------------------------------------- |
| `aria-labelledby` 或 `aria-label` | ID 引用 / 字符串          | 为 Listbox 提供可访问名称（若非嵌套在 combobox 中则必填） |
| `aria-multiselectable`            | `true` / `false`          | 是否支持多选，多选时必须设为 `true`                       |
| `aria-orientation`                | `vertical` / `horizontal` | 选项排列方向，默认 `vertical`                             |

### 2.3 选项状态属性

选项的选中状态用 `aria-selected` 或 `aria-checked` 表示，**二者只能选其一**，不要在同一个 Listbox 中混用：

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

当选项数量巨大、采用动态加载时，未渲染到 DOM 的选项需要通过 `aria-setsize` 和 `aria-posinset` 告知辅助技术总数和当前位置：

```html
<li
  role="option"
  aria-setsize="1000"
  aria-posinset="42"
  aria-selected="false">
  第 42 项
</li>
```

## 三、键盘交互规范

键盘无障碍是 Listbox 的核心。规范的键盘模型如下（以垂直方向为例）：

### 3.1 获得焦点时的行为

**单选 Listbox：**

- 若进入前没有任何选项被选中 → 焦点落在第一个选项（可选：同时选中它）。
- 若进入前已有选项被选中 → 焦点落在已选中的那个选项上。

**多选 Listbox：**

- 若进入前无选中项 → 焦点落在第一个选项，不改变任何选中状态。
- 若进入前有选中项 → 焦点落在第一个被选中的选项上。

### 3.2 基础导航键

| 按键                    | 行为                                           |
| :---------------------- | :--------------------------------------------- |
| `↓` Down Arrow          | 焦点移到下一个选项（单选时可选：选择跟随焦点） |
| `↑` Up Arrow            | 焦点移到上一个选项（单选时可选：选择跟随焦点） |
| `Home`（推荐，>5 项时） | 焦点移到第一个选项                             |
| `End`（推荐，>5 项时）  | 焦点移到最后一个选项                           |

### 3.3 类型提前匹配（Type-ahead）

> 规范**强烈推荐**在选项数 >7 的 Listbox 中实现。

- **输入单个字符**：焦点移到下一个以该字符开头的选项。
- **快速连续输入多个字符**：焦点移到下一个以该字符串开头的选项。

### 3.4 多选的两种交互模型

规范提供了两种多选模型，推荐使用第一种。

#### 模型一：推荐模型（无需按住修饰键）

| 按键                          | 行为                                     |
| :---------------------------- | :--------------------------------------- |
| `Space`                       | 切换当前焦点选项的选中状态               |
| `Shift + ↓`（可选）           | 焦点下移并切换该选项选中状态             |
| `Shift + ↑`（可选）           | 焦点上移并切换该选项选中状态             |
| `Shift + Space`（可选）       | 选中从上次选中项到当前焦点项之间的连续项 |
| `Ctrl + Shift + Home`（可选） | 选中焦点项到第一项之间的所有项           |
| `Ctrl + Shift + End`（可选）  | 选中焦点项到最后一项之间的所有项         |
| `Ctrl + A`（可选）            | 全选（若已全选则可取消全选）             |

#### 模型二：替代模型（需要按住修饰键避免丢选）

这个模型下，不按修饰键移动焦点会丢失其他选中状态，行为更接近原生桌面文件管理器：

| 按键                                                 | 行为                       |
| :--------------------------------------------------- | :------------------------- |
| `Shift + ↓` / `Shift + ↑`                            | 焦点移动并切换选项选中状态 |
| `Ctrl + ↓` / `Ctrl + ↑`                              | 仅移动焦点，不改变选中状态 |
| `Ctrl + Space`                                       | 切换当前焦点选项的选中状态 |
| `Shift + Space`（可选）                              | 选中连续区间               |
| `Ctrl + Shift + Home` / `Ctrl + Shift + End`（可选） | 选中到首/末项              |
| `Ctrl + A`（可选）                                   | 全选                       |

### 3.5 几个关键提醒

1. **焦点 ≠ 选中**：DOM 焦点（active element）和选中状态是两个独立的概念。详见 [focus vs selection](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_vs_selection)。
2. **`aria-activedescendant` 的替代方案**：除了在 `option` 之间移动真实 DOM 焦点，也可以让容器保持焦点，通过 `aria-activedescendant` 指向当前"视觉焦点"选项。详见 [Managing Focus in Composites Using aria-activedescendant](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_activedescendant)。
3. **选择跟随焦点要慎用**：单选 Listbox 中"移动焦点即选中"虽然方便，但在某些场景下会严重降低可访问性，需权衡。
4. **全选/取消全选建议提供独立按钮**：如果这些操作很重要，单独提供按钮比纯键盘快捷键可访问性更好。
5. **水平排列**：如果选项水平排列，方向键语义对调（Down/Up 与 Right/Left 互换），并设置 `aria-orientation="horizontal"`。

## 四、完整代码示例

下面给出一个可运行的单选 Listbox 示例，完整实现键盘导航、类型匹配和 ARIA 状态同步。

### 4.1 HTML 结构

```html
<span
  id="fruit-label"
  class="listbox-label"
  >选择你喜欢的水果：</span
>

<ul
  id="fruit-listbox"
  role="listbox"
  aria-labelledby="fruit-label"
  tabindex="0"
  class="listbox">
  <li
    role="option"
    id="opt-1"
    aria-selected="false"
    class="option">
    苹果
  </li>
  <li
    role="option"
    id="opt-2"
    aria-selected="false"
    class="option">
    香蕉
  </li>
  <li
    role="option"
    id="opt-3"
    aria-selected="false"
    class="option">
    橙子
  </li>
  <li
    role="option"
    id="opt-4"
    aria-selected="false"
    class="option">
    葡萄
  </li>
  <li
    role="option"
    id="opt-5"
    aria-selected="false"
    class="option">
    西瓜
  </li>
  <li
    role="option"
    id="opt-6"
    aria-selected="false"
    class="option">
    草莓
  </li>
  <li
    role="option"
    id="opt-7"
    aria-selected="false"
    class="option">
    芒果
  </li>
  <li
    role="option"
    id="opt-8"
    aria-selected="false"
    class="option">
    樱桃
  </li>
</ul>

<div
  class="sr-only"
  aria-live="polite"
  id="live-region"></div>
```

### 4.2 CSS 样式

```css
.listbox-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.listbox {
  list-style: none;
  margin: 0;
  padding: 4px;
  border: 1px solid #ccc;
  border-radius: 6px;
  max-height: 180px;
  overflow-y: auto;
  width: 220px;
  /* 让 listbox 本身可接收焦点（使用 activedescendant 方案时） */
  outline: none;
}

.option {
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  /* 视觉焦点样式 */
}

.option[aria-selected='true'] {
  background-color: #2563eb;
  color: #fff;
}

/* 视觉焦点：通过 aria-activedescendant 指向的选项 */
.option.is-active {
  background-color: #dbeafe;
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

/* 屏幕阅读器专用文本 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 4.3 JavaScript 交互逻辑

```javascript
class Listbox {
  constructor(rootEl) {
    this.root = rootEl;
    this.options = Array.from(rootEl.querySelectorAll('[role="option"]'));
    this.activeIndex = 0;
    // 单选：使用 aria-selected；多选时按需切换为 aria-checked
    this.stateAttr = 'aria-selected';
    // 类型匹配用的字符串和计时器
    this.typeaheadStr = '';
    this.typeaheadTimer = null;

    this.liveRegion = document.getElementById('live-region');

    this.root.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.root.addEventListener('click', this.handleClick.bind(this));

    // 初始焦点：优先落在已选中项，否则第一项
    const selectedIdx = this.options.findIndex(
      (opt) => opt.getAttribute(this.stateAttr) === 'true',
    );
    this.activeIndex = selectedIdx >= 0 ? selectedIdx : 0;
    this.updateActive();
  }

  /** 更新视觉焦点与 aria-activedescendant */
  updateActive() {
    this.options.forEach((opt, i) => {
      opt.classList.toggle('is-active', i === this.activeIndex);
    });
    this.root.setAttribute(
      'aria-activedescendant',
      this.options[this.activeIndex].id,
    );

    // 确保焦点项在可视区域内
    const activeEl = this.options[this.activeIndex];
    activeEl.scrollIntoView({ block: 'nearest' });
  }

  /** 单选：选中某个选项，取消其他选项 */
  select(index) {
    this.options.forEach((opt, i) => {
      opt.setAttribute(this.stateAttr, i === index ? 'true' : 'false');
    });
    this.announce(this.options[index].textContent);
  }

  /** 通过 aria-live 通知屏幕阅读器 */
  announce(text) {
    if (this.liveRegion) {
      this.liveRegion.textContent = `已选择：${text}`;
    }
  }

  handleKeyDown(e) {
    const last = this.options.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.activeIndex = this.activeIndex < last ? this.activeIndex + 1 : 0;
        this.updateActive();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.activeIndex = this.activeIndex > 0 ? this.activeIndex - 1 : last;
        this.updateActive();
        break;
      case 'Home':
        e.preventDefault();
        this.activeIndex = 0;
        this.updateActive();
        break;
      case 'End':
        e.preventDefault();
        this.activeIndex = last;
        this.updateActive();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.select(this.activeIndex);
        break;
      default:
        // 单字符：触发类型匹配（忽略功能键与组合键）
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this.handleTypeahead(e.key);
        }
    }
  }

  handleTypeahead(char) {
    // 快速连续输入视为同一个查询字符串
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadStr += char.toLowerCase();
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadStr = '';
    }, 500);

    // 从当前项之后开始查找，找不到再从头找
    const total = this.options.length;
    for (let offset = 1; offset <= total; offset++) {
      const idx = (this.activeIndex + offset) % total;
      const text = this.options[idx].textContent.toLowerCase();
      if (text.startsWith(this.typeaheadStr)) {
        this.activeIndex = idx;
        this.updateActive();
        return;
      }
    }
  }

  handleClick(e) {
    const target = e.target.closest('[role="option"]');
    if (!target) return;
    const idx = this.options.indexOf(target);
    if (idx === -1) return;
    this.activeIndex = idx;
    this.updateActive();
    this.select(idx);
  }
}

// 初始化
new Listbox(document.getElementById('fruit-listbox'));
```

## 五、无障碍实现要点

### 5.1 焦点管理：两种方案对比

| 方案                        | 实现                                                                                 | 优点                           | 缺点                                   |
| :-------------------------- | :----------------------------------------------------------------------------------- | :----------------------------- | :------------------------------------- |
| **漫游 DOM 焦点**           | 每次导航把 `focus()` 移到目标 `option`，设 `tabindex=-1`，容器 `tabindex=0` 作为入口 | 实现直观，兼容性最好           | 焦点频繁移动可能触发额外滚动           |
| **`aria-activedescendant`** | 容器始终持有 DOM 焦点，通过属性指向当前"活动选项"                                    | 避免焦点移动开销，适合复杂容器 | 需保证容器有 `tabindex` 且 id 引用正确 |

上面的示例用的是 `aria-activedescendant` 方案。如果改用漫游焦点方案，结构上每个 option 需要 `tabindex="-1"`，并在 `updateActive` 中调用 `option.focus()`。

### 5.2 可访问名称（Accessible Name）

Listbox 必须有可访问名称，通过 `aria-labelledby`（优先）或 `aria-label` 提供：

```html
<!-- 推荐：引用可见标签 -->
<label id="fruit-label">选择水果</label>
<ul
  role="listbox"
  aria-labelledby="fruit-label">
  ...
</ul>

<!-- 备选：仅屏幕阅读器可见 -->
<ul
  role="listbox"
  aria-label="水果选择列表">
  ...
</ul>
```

### 5.3 状态播报

选中状态变化时，通过 `aria-live="polite"` 的区域向屏幕阅读器播报，避免用户操作后缺乏反馈：

```html
<div
  class="sr-only"
  aria-live="polite"></div>
```

注意 `aria-live` 不要滥用——每次焦点移动都播报会很吵，通常只在"选中状态变化"这类语义事件上播报。

### 5.4 分组选项的无障碍命名

```html
<ul
  role="listbox"
  aria-labelledby="city-label">
  <li role="presentation">
    <span
      role="group"
      aria-label="华北">
      <ul role="presentation">
        <li role="option">北京</li>
        <li role="option">天津</li>
      </ul>
    </span>
  </li>
</ul>
```

每个 `group` 必须有 `aria-label` 或 `aria-labelledby`，否则分组对辅助技术不可见。

## 六、最佳实践与避坑指南

### 6.1 何时用 Listbox，何时用其他模式

| 需求                            | 推荐模式                       |
| :------------------------------ | :----------------------------- |
| 选项数少（≤5），单选            | 原生 `<select>` 或 Radio Group |
| 选项数多，单选/多选，无内部交互 | **Listbox**                    |
| 选项内含链接/按钮/复选框        | Grid Pattern                   |
| 输入框 + 下拉选项               | Combobox Pattern               |
| 树形层级结构                    | Treeview Pattern               |

### 6.2 不要在 option 内塞交互元素

```html
<!-- ❌ 错误：option 内含按钮，辅助技术无法操作 -->
<li role="option">
  文件 A
  <button aria-label="删除">删除</button>
</li>

<!-- ✅ 正确：使用 Grid Pattern 承载可交互列表 -->
```

### 6.3 保持视觉焦点与 DOM 焦点一致

无论是漫游焦点还是 `aria-activedescendant`，都要确保**视觉上看到的"高亮项"和屏幕阅读器读到的"当前项"是同一个**。这是无障碍审计中最常见的失败点之一。

### 6.4 滚动可见性

当 Listbox 可滚动时，键盘导航到边缘选项要自动滚动让其可见：

```javascript
activeEl.scrollIntoView({ block: 'nearest' });
```

规范中的 [Scrollable Listbox Example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-scrollable/) 就是这一场景的标准实现。

### 6.5 多选时明确告知"可多选"

- 容器设 `aria-multiselectable="true"`。
- 可见标签或说明文字中提示"可多选，按空格选择"。
- 视觉上使用勾选框（`aria-checked`）而非高亮（`aria-selected`），更符合多选直觉。

### 6.6 谨慎使用"选择跟随焦点"

```javascript
// 单选时，可以在导航的同时选中——但要评估场景
case 'ArrowDown':
  this.activeIndex++;
  this.updateActive();
  this.select(this.activeIndex); // 选择跟随焦点
  break;
```

适用场景：表单中选择唯一值，用户期望"按方向键即确定"。
不适用场景：浏览型列表，用户可能只是想查看选项而非立即选中。

详见 [Deciding When to Make Selection Automatically Follow Focus](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#:~:text=Deciding%20When%20to%20Make%20Selection%20Automatically%20Follow%20Focus)。

## 七、常见问题速查

| 问题                          | 原因                                    | 解决方案                                                                             |
| :---------------------------- | :-------------------------------------- | :----------------------------------------------------------------------------------- |
| 屏幕阅读器不朗读"已选中 N 项" | 未用 `aria-live` 播报状态变化           | 添加 `aria-live="polite"` 区域并在状态变化时更新文本                                 |
| 键盘无法进入 Listbox          | 容器无 `tabindex`                       | 设 `tabindex="0"`（漫游焦点方案则给首个 option 设 `tabindex="0"`，其余 `-1`）        |
| `aria-activedescendant` 无效  | 容器未持有焦点，或 id 引用错误          | 确保容器 `tabindex="0"` 且被 `focus()`，activedescendant 指向 DOM 内存在的 option id |
| 屏幕阅读器读不出分组          | `group` 缺少 `aria-label`               | 为每个 `group` 提供可访问名称                                                        |
| 方向键导致页面滚动            | 未 `preventDefault()`                   | 在 `keydown` 中对方向键调用 `e.preventDefault()`                                     |
| 虚拟滚动下选项位置丢失        | 未设置 `aria-setsize` / `aria-posinset` | 为动态渲染的 option 补全这两个属性                                                   |

## 八、总结

Listbox 是一个"看似简单、实则细节繁多"的组件。其无障碍实现的关键可归纳为以下几点：

1. **语义清晰**：`listbox` + `option`（+ 可选 `group`）的角色结构要正确，避免在 option 内塞交互元素。
2. **命名完整**：容器和分组都要有可访问名称，优先用 `aria-labelledby`。
3. **键盘完备**：方向键、Home/End、Space、Type-ahead、多选修饰键，缺一不可。
4. **状态同步**：`aria-selected` 或 `aria-checked` 与视觉状态、`aria-live` 播报保持一致。
5. **焦点可控**：漫游焦点或 `aria-activedescendant` 二选一，确保视觉焦点与辅助技术焦点一致。
6. **谨慎跟随**：单选时"选择跟随焦点"按需启用，多选时优先用推荐模型（无需按住修饰键）。

如果你正在构建设计系统，强烈建议先通读 [WAI-ARIA APG 的官方示例](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#examples)，它们涵盖了可滚动、可重排、分组三种典型场景，是落地实现的权威参考。

无障碍不是"附加题"，而是 Web 组件的基本质量指标。一个键盘完备、语义正确的 Listbox，不仅让残障用户能用，也让所有键盘用户和自动化测试受益。

---

**参考资料**

- [WAI-ARIA Authoring Practices - Listbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
- [Keyboard Interface Practices - Focus vs Selection](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_vs_selection)
- [Managing Focus with aria-activedescendant](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_activedescendant)
- [Scrollable Listbox Example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-scrollable/)
- [Listbox with Grouped Options Example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/)
