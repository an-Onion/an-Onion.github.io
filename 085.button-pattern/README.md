# Button Pattern 详解：构建无障碍按钮组件

按钮是 Web 界面中最基础的交互元素之一，它让用户能够触发特定的操作或事件，如提交表单、打开对话框、取消操作或执行删除操作。根据 [W3C WAI-ARIA Button Pattern 规范][0]，正确实现的按钮组件不仅要具备良好的视觉效果，更需要确保所有用户都能顺利使用，包括依赖屏幕阅读器等辅助技术的用户。本文将深入探讨 Button Pattern 的核心概念、实现要点以及最佳实践。

## 一、按钮的定义与核心功能

按钮是一个允许用户触发动作或事件的界面组件。从功能角度来看，按钮执行的是**动作**而非**导航**，这是按钮与链接的本质区别。常见的按钮功能包括：提交表单数据、打开对话框窗口、取消正在进行的操作、删除特定内容等。一个设计良好的按钮应当让用户清晰地感知到点击它将产生什么效果，这种可预期性是良好用户体验的重要组成部分。

在实际开发中，有一个广为接受的约定值得注意：如果按钮的操作会打开一个对话框或其他需要进一步交互的界面，应该在按钮标签后加上省略号（...）来提示用户。例如，**保存为...**这样的标签能够告诉用户，点击这个按钮后会弹出额外的对话框需要填写。这种细节虽然看似微小，却能显著提升用户对界面行为的理解。

## 二、按钮的三种类型

WAI-ARIA 规范支持三种类型的按钮，每种类型都有其特定的用途和实现要求。理解这三种类型的区别对于构建正确无障碍的界面至关重要。

### 2.1 普通按钮

普通按钮是最常见的按钮类型，它执行单一的操作而不涉及状态的切换。提交表单的**提交**按钮、触发某个动作的**执行**按钮都属于这一类别。普通按钮在激活时会执行预定义的操作，操作完成后通常会根据操作的性质决定焦点的移动位置。例如，打开对话框的按钮在激活后，焦点应移动到对话框内部；而执行原地操作的按钮则可能保持焦点在原位。

```html
<button type="submit">提交表单</button>
```

### 2.2 切换按钮

切换按钮是一种具有两种状态的按钮，可以处于**未按下**或**已按下**的状态。这种按钮通过 aria-pressed 属性向辅助技术传达其当前状态。例如，音频播放器中的**静音**按钮就可以实现为切换按钮：当声音处于静音状态时，按钮的 aria-pressed 值为 true；当声音正常播放时，该值为 false。

实现切换按钮时有一个关键原则需要牢记：按钮的标签在状态改变时不应发生变化。无论按钮是处于按下还是未按下状态，其可访问名称应该保持一致。屏幕阅读器用户依赖这个稳定的标签来理解按钮的功能。如果设计要求在状态改变时显示不同的文本，那么就不应使用 aria-pressed 属性，而是应该通过其他方式传达状态变化。

```html
<button
  type="button"
  aria-pressed="false"
  id="muteButton">
  静音
</button>

<script>
  muteButton.addEventListener('click', function () {
    const isMuted = this.getAttribute('aria-pressed') === 'true';
    this.setAttribute('aria-pressed', !isMuted);
  });
</script>
```

### 2.3 菜单按钮

菜单按钮是一种特殊的按钮，点击后会展开一个菜单或其他弹出式界面。根据 WAI-ARIA 规范，通过将 aria-haspopup 属性设置为 menu 或 true，可以将按钮向辅助技术揭示为菜单按钮。这种按钮在用户界面中非常常见，例如许多应用中的**文件**菜单、**编辑**菜单等。

菜单按钮的实现需要遵循菜单模式的相关规范，确保用户能够通过键盘导航菜单项，屏幕阅读器能够正确播报菜单状态，视觉用户能够清晰地看到菜单的展开和收起状态。正确实现的菜单按钮应当提供平滑的用户体验，无论用户使用何种输入方式或辅助技术。

```html
<button
  type="button"
  aria-haspopup="menu"
  id="fileMenu">
  文件
</button>
```

## 三、键盘交互规范

键盘可访问性是 Web 无障碍设计的核心要素之一。按钮组件必须支持完整的键盘交互，确保无法使用鼠标的用户也能顺利操作。根据 Button Pattern 规范，当按钮获得焦点时，用户应能通过以下按键与按钮交互：

**空格键和回车键**是激活按钮的主要方式。当用户按下空格键或回车键时，按钮被触发执行其预定义的操作。这个设计遵循了用户对表单控件的既有认知，与传统桌面应用的交互模式保持一致。

按钮激活后焦点的处理需要根据具体情境来决定，这是实现良好键盘体验的关键。如果按钮打开了一个对话框，焦点应移动到对话框内部，通常是对话框的第一个可聚焦元素或默认焦点元素。如果按钮关闭了对话框，焦点通常应返回到打开该对话框的按钮，除非对话框中的操作逻辑上应该导致焦点移动到其他位置。例如，在确认删除操作的对话框中点击**确认**后，焦点可能会移动到页面上的其他相关元素。

对于不会关闭当前上下文的按钮（如**应用**按钮、**重新计算**按钮），激活后焦点通常应保持在原位。如果按钮的操作表示上下文将要发生变化（如向导中的**下一步**），则应将焦点移动到该操作的起始位置。对于通过快捷键触发的按钮，焦点通常应保持在触发快捷键时的上下文中。

## 四、WAI-ARIA 角色、状态和属性

正确使用 WAI-ARIA 属性是构建无障碍按钮组件的技术基础。虽然语义化的 HTML 按钮元素（button）本身已经具备正确的角色和基本行为，但在某些情况下需要使用自定义实现或 ARIA 属性来增强可访问性。

**角色声明**是基础要求。按钮元素的 role 属性应设置为 [button][1]，向辅助技术表明这是一个按钮组件。对于使用 button 这样的原生 HTML 元素，浏览器会自动处理角色声明，无需开发者手动添加。

示例：使用 div 元素模拟按钮时需要添加 role="button"：

```html
<div
  role="button"
  tabindex="0"
  onclick="handleClick()">
  提交
</div>
```

**可访问名称**是按钮最重要的可访问性特征之一。按钮必须有可访问的名称，这个名称可以通过多种方式提供：按钮内部的文本内容是最常见的来源；在某些情况下，可以使用 [aria-labelledby][2] 引用页面上的其他元素作为标签；或者使用 [aria-label][3] 直接提供标签文本。屏幕阅读器用户主要依赖这个名称来理解按钮的功能。

示例 1：使用 aria-labelledby 引用其他元素作为标签：

```html
<h2 id="save-heading">保存设置</h2>
<button
  role="button"
  aria-labelledby="save-heading">
  图标
</button>
```

示例 2：使用 aria-label 直接提供标签文本：

```html
<button
  aria-label="关闭对话框"
  onclick="closeDialog()">
  ×
</button>
```

**描述信息**可以通过 [aria-describedby][4] 属性关联。如果页面上存在对按钮功能的详细描述说明，应将描述元素的 ID 赋给这个属性，辅助技术会在播报按钮名称后继续播报描述内容。

示例：使用 aria-describedby 提供详细描述：

```html
<button aria-describedby="delete-warning">删除</button>
<p id="delete-warning">此操作无法撤销，将永久删除所选数据。</p>
```

**禁用状态**需要正确使用 [aria-disabled][5] 属性。当按钮的关联操作不可用时，应设置 aria-disabled="true"。这个属性向辅助技术传达按钮当前处于禁用状态，用户无法与之交互。需要注意的是，对于原生 HTML button 元素，应使用 disabled 属性而非 aria-disabled。

示例：使用 aria-disabled 禁用非原生按钮：

```html
<div
  role="button"
  tabindex="-1"
  aria-disabled="true"
  aria-label="保存">
  保存
</div>
```

**切换状态**使用 [aria-pressed][6] 属性来传达，这个属性只用于实现为切换按钮的组件。属性值应为 true（按下状态）、false（未按下状态）或 mixed（部分选中状态，用于三态树节点等场景）。

示例：使用 aria-pressed 实现切换按钮：

```html
<button
  type="button"
  aria-pressed="false"
  id="toggleBtn"
  onclick="toggleState()">
  夜间模式
</button>
```

## 五、按钮与链接的区别

在 Web 开发中，一个常见的混淆点是何时应该使用按钮，何时应该使用链接。这两者的功能定位有着本质的区别，理解这个区别对于构建语义正确的页面至关重要。

按钮用于**触发动作**，如提交表单、打开对话框、执行计算、删除数据等。这些操作会产生副作用，改变应用的状态或数据。链接用于**导航**，将用户带到另一个页面、页面的不同位置或不同的应用状态。链接的本质是超文本引用，它告诉用户**这里有你可能感兴趣的另一个资源**。

从技术实现角度，这个区别直接影响了可访问性。屏幕阅读器对按钮和链接的播报方式不同，用户会根据这些提示形成对界面功能的预期。如果一个元素看起来像链接（蓝色下划线文本）但点击后执行的是按钮的动作（提交表单），会给用户造成困惑。即使出于设计考虑必须使用这种视觉与功能的组合，也应通过 [role="button"][1] 属性明确告诉辅助技术这个元素的真实功能，避免给依赖辅助技术的用户带来困惑。

更好的做法是调整视觉设计，使其与功能保持一致。如果某个元素执行的是动作，就应该看起来像一个按钮；如果用户需要被导航到新页面，就应该使用标准的链接样式。这种设计上的统一能够减少所有用户的认知负担。

## 六、其他示例

以下是一个常见按钮场景的实现示例——打开对话框的按钮，展示了如何正确应用 Button Pattern 规范。

使用 HTML 原生 `<dialog>` 元素配合按钮实现对话框功能：

```html
<button
  type="button"
  aria-haspopup="dialog"
  aria-expanded="false"
  id="openDialog">
  设置...
</button>

<dialog id="settingsDialog">
  <form method="dialog">
    <label> <input type="checkbox" /> 启用通知 </label>
    <button value="confirm">确定</button>
  </form>
</dialog>

<script>
  const dialog = document.getElementById('settingsDialog');
  const openBtn = document.getElementById('openDialog');

  openBtn.addEventListener('click', () => {
    dialog.showModal();
    openBtn.setAttribute('aria-expanded', 'true');
  });

  dialog.addEventListener('close', () => {
    openBtn.setAttribute('aria-expanded', 'false');
  });
</script>
```

当按钮会打开对话框时，使用省略号提示用户后面还有额外交互。[aria-haspopup][7] 表明按钮会弹出内容，[aria-expanded][8] 用于传达弹出内容的当前状态。

## 七、CSS 伪类与交互样式

以下 CSS 伪类可用于增强按钮的键盘交互体验：

```css
/* Tab 键导航到按钮时显示焦点框 */
button:focus {
  outline: 2px solid blue;
  outline-offset: 2px;
}

/* 仅键盘焦点显示样式，鼠标点击不显示 */
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* 空格键或回车键按下时的样式 */
button:active {
  transform: scale(0.98);
}

/* 鼠标悬停效果（可选，增强视觉反馈） */
button:hover {
  opacity: 0.9;
}

/* Tab + Space 组合键激活样式（需 JS 添加类） */
button.keyboard-active {
  transform: scale(0.95);
  background-color: oklch(from currentColor 0.8);
}

/* Tab + Enter 组合键激活样式（需 JS 添加类） */
button.keyboard-enter {
  transform: scale(0.95);
  background-color: oklch(from currentColor 0.8);
}
```

**各伪类说明：**

| 伪类             | 触发方式           | 用途                                 |
| ---------------- | ------------------ | ------------------------------------ |
| `:focus`         | Tab 键/鼠标点击    | 元素获得焦点时                       |
| `:focus-visible` | 仅键盘 Tab         | 仅键盘焦点显示，避免鼠标点击时出现框 |
| `:active`        | 按下空格/回车/鼠标 | 元素被激活时                         |
| `:hover`         | 鼠标悬停           | 鼠标悬停时的视觉反馈                 |

### 7.1 组合键交互示例

CSS 本身无法直接检测组合键，但可以通过 JavaScript 增强体验：

```html
<button id="submitBtn">提交</button>

<style>
  /* Tab + Space 激活状态 */
  button.space-pressed {
    transform: scale(0.95);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  /* Tab + Enter 激活状态 */
  button.enter-pressed {
    transform: scale(0.95);
    background-color: oklch(from var(--btn-bg, currentColor) 0.8);
  }
</style>

<script>
  const btn = document.getElementById('submitBtn');

  // Tab + Space 组合键
  btn.addEventListener('keydown', (e) => {
    if (e.key === ' ' && e.target === document.activeElement) {
      btn.classList.add('space-pressed');
    }
    if (e.key === 'Enter' && e.target === document.activeElement) {
      btn.classList.add('enter-pressed');
    }
  });

  btn.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
      btn.classList.remove('space-pressed');
    }
    if (e.key === 'Enter') {
      btn.classList.remove('enter-pressed');
    }
  });
</script>
```

**组合键说明：**

| 组合键      | 效果           | 触发元素                          |
| ----------- | -------------- | --------------------------------- |
| Tab + Space | 聚焦并激活按钮 | `<button>`                        |
| Tab + Enter | 聚焦并触发按钮 | `<button>`、`<div role="button">` |

**原生 HTML 按钮的行为：**

- `<button>`：Tab 聚焦后按 Space/Enter 都会触发点击
- `<div role="button">`：需要额外 JS 处理 Space 键

## 八、总结

构建无障碍的按钮组件需要关注多个层面的细节。从视觉设计角度，按钮应该让用户清晰地感知到它是一个可交互的元素；从键盘交互角度，必须支持空格键和回车键的激活操作；从 ARIA 属性角度，需要正确使用角色、状态和属性来传达组件的语义和当前状态。

按钮与链接的功能区分是 Web 语义化的基础之一，遵循这个原则不仅有助于辅助技术用户理解页面结构，也能提升所有用户的使用体验。在实际开发中，优先使用语义化的原生 HTML 元素，只有在必要时才考虑使用自定义实现，并确保为这些实现添加完整的无障碍支持。

WAI-ARIA Button Pattern 为我们提供了清晰的指导方针，将这些规范内化为开发习惯，能够帮助我们创建更加包容和易用的 Web 应用。每一个正确实现的按钮组件，都是构建无障碍网络环境的重要一步。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/button/
[1]: https://www.w3.org/TR/wai-aria-1.2/#button
[2]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-describedby
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-disabled
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-pressed
[7]: https://www.w3.org/TR/wai-aria-1.2/#aria-haspopup
[8]: https://www.w3.org/TR/wai-aria-1.2/#aria-expanded
