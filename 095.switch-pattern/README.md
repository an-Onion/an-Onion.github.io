# Switch Pattern 详解：构建无障碍开关组件

开关（Switch）是一种模拟物理开关的控件，用于在两个状态（通常是"开"和"关"）之间切换。本文基于 [W3C WAI-ARIA Switch Pattern][0] 规范，详解如何构建无障碍的开关组件。

## 一、Switch 的定义与核心概念

### 1.1 什么是 Switch

Switch 是一种特殊的二元状态控件，它：

- 模拟物理开关的行为
- 在两个互斥状态之间切换（开/关、启用/禁用）
- 与 Checkbox 不同，Switch 的状态改变通常会立即生效，无需提交表单

### 1.2 Switch 与 Checkbox 的区别

| 特性          | Switch                    | Checkbox                         |
| ------------- | ------------------------- | -------------------------------- |
| **视觉表现**  | 滑动开关样式              | 方框勾选样式                     |
| **状态语义**  | 开/关（On/Off）           | 选中/未选中（Checked/Unchecked） |
| **操作反馈**  | 通常立即生效              | 通常需要提交表单                 |
| **使用场景**  | 设置项切换、功能启用/禁用 | 多选项选择、表单提交             |
| **ARIA 角色** | `role="switch"`           | `role="checkbox"`                |

### 1.3 何时使用 Switch

**适合使用 Switch 的场景：**

- 系统设置（如：开启/关闭通知）
- 功能启用（如：启用暗黑模式）
- 即时生效的选项（如：开启/关闭 WiFi）

**适合使用 Checkbox 的场景：**

- 表单中的多选项
- 需要提交后才生效的选择
- 列表中的批量选择

## 二、原生 HTML Switch 实现

HTML5.2 起，`<input type="checkbox">` 新增了 [`switch` 属性][7]，可以直接创建原生 Switch：

```html
<label>
  开启通知
  <input
    type="checkbox"
    role="switch" />
</label>
```

### 2.1 原生 Switch 的浏览器支持

目前原生 Switch 的支持情况：

- **Safari**：完全支持（包括 iOS Safari）
- **Chrome/Edge**：需要通过 CSS 自定义样式
- **Firefox**：需要通过 CSS 自定义样式

由于跨浏览器兼容性考虑，实际项目中通常使用自定义样式实现。

## 三、WAI-ARIA 角色与属性

### 3.1 基本角色

Switch 具有 [`role="switch"`][2]。

### 3.2 状态属性

- [`aria-checked="true"`][3]：开关处于"开"状态
- [`aria-checked="false"`][3]：开关处于"关"状态

注意：Switch 只支持 `true` 和 `false` 两种状态，**不支持** `mixed`（与 Checkbox 不同）。

### 3.3 可访问标签

Switch 的可访问标签可以通过以下方式提供：

- **可见文本内容**：直接包含在具有 `role="switch"` 的元素内的文本
- **`aria-labelledby`**：引用包含标签文本的元素的 ID
- **`aria-label`**：直接在开关元素上设置标签文本

```html
<!-- 方式一：可见文本内容 -->
<div
  role="switch"
  aria-checked="false">
  开启通知
</div>

<!-- 方式二：aria-labelledby -->
<span id="wifi-label">WiFi</span>
<div
  role="switch"
  aria-checked="true"
  aria-labelledby="wifi-label"></div>

<!-- 方式三：aria-label -->
<div
  role="switch"
  aria-checked="false"
  aria-label="开启暗黑模式"></div>
```

### 3.4 描述属性

如果包含额外的描述性静态文本，使用 [`aria-describedby`][6]：

```html
<div
  role="switch"
  aria-checked="false"
  aria-describedby="airplane-desc">
  飞行模式
</div>
<p id="airplane-desc">关闭所有无线连接</p>
```

## 四、键盘交互规范

当 Switch 获得焦点时：

| 按键  | 功能                         |
| ----- | ---------------------------- |
| Space | 切换开关状态（开 ↔ 关）      |
| Enter | 某些实现中也支持切换开关状态 |

## 五、实现方式

### 5.1 原生 HTML + CSS 实现

```html
<label class="switch">
  <input
    type="checkbox"
    role="switch" />
  <span class="slider"></span>
  开启通知
</label>

<style>
  .switch {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .switch input {
    appearance: none;
    width: 48px;
    height: 24px;
    background: #ccc;
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    transition: background 0.3s;
  }

  .switch input::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.3s;
  }

  .switch input:checked {
    background: #005a9c;
  }

  .switch input:checked::after {
    transform: translateX(24px);
  }

  .switch input:focus {
    outline: 2px solid #005a9c;
    outline-offset: 2px;
  }
</style>
```

### 5.2 ARIA 实现（自定义样式）

```html
<div
  role="switch"
  tabindex="0"
  aria-checked="false"
  aria-labelledby="switch-label"
  onclick="toggleSwitch(this)"
  onkeydown="handleKeydown(event, this)">
  <span class="switch-track">
    <span
      class="switch-thumb"
      aria-hidden="true"></span>
  </span>
  <span id="switch-label">开启通知</span>
</div>

<script>
  function toggleSwitch(switchEl) {
    const isChecked = switchEl.getAttribute('aria-checked') === 'true';
    switchEl.setAttribute('aria-checked', !isChecked);
  }

  function handleKeydown(event, switchEl) {
    if (event.key === ' ') {
      event.preventDefault();
      toggleSwitch(switchEl);
    }
  }
</script>

<style>
  [role='switch'] {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .switch-track {
    width: 48px;
    height: 24px;
    background: #ccc;
    border-radius: 12px;
    position: relative;
    transition: background 0.3s;
  }

  [role='switch'][aria-checked='true'] .switch-track {
    background: #005a9c;
  }

  .switch-thumb {
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.3s;
  }

  [role='switch'][aria-checked='true'] .switch-thumb {
    transform: translateX(24px);
  }

  [role='switch']:focus {
    outline: 2px solid #005a9c;
    outline-offset: 2px;
  }
</style>
```

### 5.3 使用 DaisyUI Toggle 组件

[DaisyUI 的 Toggle 组件][8] 提供了开箱即用的 Switch 样式：

```html
<!-- 基础 Toggle -->
<label class="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    class="toggle" />
  <span class="label-text">开启通知</span>
</label>

<!-- 不同颜色的 Toggle -->
<label class="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    class="toggle toggle-primary"
    checked />
  <span class="label-text">主要色</span>
</label>

<label class="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    class="toggle toggle-success"
    checked />
  <span class="label-text">成功色</span>
</label>

<!-- 不同尺寸 -->
<label class="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    class="toggle toggle-lg" />
  <span class="label-text">大尺寸</span>
</label>
```

DaisyUI 的 Toggle 组件特点：

- 基于原生 Checkbox，自动继承无障碍特性
- 提供多种主题色和尺寸
- 支持禁用状态
- 无需额外 JavaScript

## 六、常见应用场景

### 6.1 系统设置项

```html
<fieldset>
  <legend>通知设置</legend>

  <label class="flex items-center justify-between py-3 border-b">
    <div>
      <span class="font-medium">推送通知</span>
      <p class="text-sm text-gray-500">接收应用推送消息</p>
    </div>
    <input
      type="checkbox"
      class="toggle toggle-primary"
      checked />
  </label>

  <label class="flex items-center justify-between py-3 border-b">
    <div>
      <span class="font-medium">邮件通知</span>
      <p class="text-sm text-gray-500">接收每日摘要邮件</p>
    </div>
    <input
      type="checkbox"
      class="toggle toggle-primary" />
  </label>

  <label class="flex items-center justify-between py-3">
    <div>
      <span class="font-medium">短信通知</span>
      <p class="text-sm text-gray-500">接收重要提醒短信</p>
    </div>
    <input
      type="checkbox"
      class="toggle toggle-primary"
      checked />
  </label>
</fieldset>
```

### 6.2 功能开关

```html
<div class="space-y-4">
  <label
    class="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
    <div class="flex items-center gap-3">
      <span class="text-2xl">🌙</span>
      <div>
        <span class="font-medium">暗黑模式</span>
        <p class="text-sm text-gray-500">使用深色主题保护眼睛</p>
      </div>
    </div>
    <input
      type="checkbox"
      class="toggle toggle-secondary" />
  </label>

  <label
    class="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
    <div class="flex items-center gap-3">
      <span class="text-2xl">🔒</span>
      <div>
        <span class="font-medium">自动锁定</span>
        <p class="text-sm text-gray-500">闲置 5 分钟后自动锁定</p>
      </div>
    </div>
    <input
      type="checkbox"
      class="toggle toggle-secondary"
      checked />
  </label>
</div>
```

### 6.3 隐私设置

```html
<fieldset>
  <legend class="text-lg font-semibold mb-4">隐私设置</legend>

  <div class="space-y-4">
    <label class="flex items-center justify-between">
      <div>
        <span class="font-medium">公开个人资料</span>
        <p class="text-sm text-gray-500">允许其他用户查看您的资料</p>
      </div>
      <input
        type="checkbox"
        class="toggle toggle-accent" />
    </label>

    <label class="flex items-center justify-between">
      <div>
        <span class="font-medium">显示在线状态</span>
        <p class="text-sm text-gray-500">让好友知道您在线</p>
      </div>
      <input
        type="checkbox"
        class="toggle toggle-accent"
        checked />
    </label>

    <label class="flex items-center justify-between">
      <div>
        <span class="font-medium">允许搜索到我</span>
        <p class="text-sm text-gray-500">通过用户名搜索可以找到您</p>
      </div>
      <input
        type="checkbox"
        class="toggle toggle-accent"
        checked />
    </label>
  </div>
</fieldset>
```

## 七、最佳实践

### 7.1 优先使用原生 Checkbox + Toggle 样式

原生 HTML `<input type="checkbox">` 配合 CSS 样式是最可靠的方式：

```html
<label class="switch-container">
  <input
    type="checkbox"
    class="sr-only peer" />
  <div
    class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
  <span class="ml-3 text-sm font-medium text-gray-900">开启功能</span>
</label>
```

### 7.2 提供清晰的标签

始终为 Switch 提供清晰的标签，说明开关控制的功能：

```html
<!-- 推荐 -->
<label class="flex items-center justify-between">
  <span>开启自动保存</span>
  <input
    type="checkbox"
    class="toggle" />
</label>

<!-- 不推荐：没有标签或标签不清晰 -->
<input
  type="checkbox"
  class="toggle" />
<span>开启</span>
```

### 7.3 使用描述文本

对于复杂的设置项，提供额外的描述文本：

```html
<label class="flex items-center justify-between">
  <div>
    <span class="font-medium">数据同步</span>
    <p class="text-sm text-gray-500">自动将数据备份到云端</p>
  </div>
  <input
    type="checkbox"
    class="toggle" />
</label>
```

### 7.4 避免在 Switch 上嵌套其他交互元素

```html
<!-- 不推荐 -->
<label>
  <input
    type="checkbox"
    class="toggle" />
  开启功能 <a href="/help">了解更多</a>
</label>

<!-- 推荐 -->
<div class="flex items-center justify-between">
  <div>
    <span>开启功能</span>
    <a href="/help">了解更多</a>
  </div>
  <input
    type="checkbox"
    class="toggle" />
</div>
```

### 7.5 状态反馈

确保用户能够清楚地看到开关的当前状态：

```css
/* 清晰的视觉反馈 */
.toggle:checked {
  background-color: #005a9c;
}

.toggle:focus {
  outline: 2px solid #005a9c;
  outline-offset: 2px;
}

/* 禁用状态 */
.toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 7.6 移动端触摸区域

确保 Switch 有足够的触摸区域（至少 44x44px）：

```css
.switch-container {
  min-height: 44px;
  padding: 8px 0;
}

.toggle {
  width: 48px;
  height: 28px;
}
```

## 八、Switch、Checkbox 与 Radio 的选择

| 场景             | 推荐组件     | 原因                   |
| ---------------- | ------------ | ---------------------- |
| 即时生效的设置项 | **Switch**   | 模拟物理开关，立即反馈 |
| 表单中的多选项   | **Checkbox** | 需要提交后才生效       |
| 单选场景         | **Radio**    | 互斥选择               |
| 列表中的批量操作 | **Checkbox** | 支持多选               |

## 九、总结

Switch 是一种直观的状态切换控件，适用于需要即时反馈的设置场景。与 Checkbox 相比，Switch 更强调"开/关"的语义，通常用于控制功能的启用和禁用。

构建无障碍的 Switch 组件需要注意：使用正确的 ARIA 角色（`role="switch"`）、提供清晰的标签、确保键盘可访问性（Space 键切换），以及为屏幕阅读器用户提供准确的状态反馈。

随着 HTML 原生 Switch 属性的逐渐普及，以及像 [DaisyUI Toggle][8] 这样的组件库的支持，实现无障碍的 Switch 变得越来越简单。开发者应优先使用语义化的 HTML 元素，确保所有用户都能顺畅地使用开关功能。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#switch
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-checked
[4]: https://www.w3.org/TR/wai-aria-1.2/#radiogroup
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-describedby
[7]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox#switch
[8]: https://daisyui.com/components/toggle/
