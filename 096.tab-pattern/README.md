# Tabs Pattern 详解：构建无障碍标签页组件

标签页（Tabs）是一种分层的内容展示组件，通过标签列表（Tab List）和对应的内容面板（Tab Panel）来组织和展示内容。本文基于 [W3C WAI-ARIA Tabs Pattern][0] 规范，详解如何构建无障碍的标签页组件。

## 一、Tabs 的定义与核心概念

### 1.1 什么是 Tabs

Tabs 是一种将内容分层展示的界面模式：

- **Tab List（标签列表）**：包含一组标签元素的容器
- **Tab（标签）**：作为对应内容面板的标签，激活后显示该面板
- **Tab Panel（标签面板）**：包含与标签关联的内容的元素
- 通常一次只显示一个标签面板
- 标签列表通常排列在当前显示面板的边缘（最常见的是顶部）

### 1.2 核心术语

| 术语          | 说明                                  |
| ------------- | ------------------------------------- |
| **Tab List**  | 包含在 `tablist` 元素中的一组标签元素 |
| **Tab**       | 标签列表中的元素，作为对应面板的标签  |
| **Tab Panel** | 包含与标签关联内容的元素              |

### 1.3 自动激活 vs 手动激活

Tabs 有两种激活模式：

**自动激活（Automatic Activation）**：

- 标签获得焦点时自动激活并显示对应面板
- 要求面板内容已预加载，避免延迟
- 用户导航更高效

**手动激活（Manual Activation）**：

- 用户需要按 Space 或 Enter 激活标签
- 适用于面板内容加载有延迟的场景
- 避免焦点移动时的不必要加载

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

```html
<div
  role="tablist"
  aria-label="产品信息">
  <button
    role="tab"
    aria-selected="true"
    id="tab-1">
    产品详情
  </button>
  <button
    role="tab"
    aria-selected="false"
    id="tab-2">
    规格参数
  </button>
  <button
    role="tab"
    aria-selected="false"
    id="tab-3">
    用户评价
  </button>
</div>

<div
  role="tabpanel"
  aria-labelledby="tab-1">
  <!-- 产品详情内容 -->
</div>
```

### 2.2 Tab List 属性

Tab List 容器具有 [`role="tablist"`][4]：

- 包含一组 `role="tab"` 的元素
- 使用 [`aria-label`][5] 或 [`aria-labelledby`][5] 提供可访问标签
- 可选：使用 [`aria-orientation`][6] 指定方向（`horizontal` 或 `vertical`）

```html
<!-- 水平标签页（默认） -->
<div
  role="tablist"
  aria-label="产品信息">
  ...
</div>

<!-- 垂直标签页 -->
<div
  role="tablist"
  aria-label="设置选项"
  aria-orientation="vertical">
  ...
</div>
```

### 2.3 Tab 属性

每个标签具有 [`role="tab"`][2]：

- [`aria-selected="true"`][3]：当前激活的标签
- [`aria-selected="false"`][3]：未激活的标签
- [`aria-controls`][7]：引用对应面板的 ID
- [`tabindex="0"`][8]：当前激活的标签（可聚焦）
- [`tabindex="-1"`][8]：未激活的标签（可通过方向键聚焦）

```html
<button
  role="tab"
  id="tab-1"
  aria-selected="true"
  aria-controls="panel-1"
  tabindex="0">
  产品详情
</button>

<button
  role="tab"
  id="tab-2"
  aria-selected="false"
  aria-controls="panel-2"
  tabindex="-1">
  规格参数
</button>
```

### 2.4 Tab Panel 属性

每个面板具有 [`role="tabpanel"`][9]：

- [`aria-labelledby`][5]：引用对应标签的 ID
- 未激活的面板通常使用 `hidden` 属性或 CSS 隐藏

```html
<div
  role="tabpanel"
  id="panel-1"
  aria-labelledby="tab-1">
  <!-- 激活的面板内容 -->
</div>

<div
  role="tabpanel"
  id="panel-2"
  aria-labelledby="tab-2"
  hidden>
  <!-- 未激活的面板内容 -->
</div>
```

## 三、键盘交互规范

### 3.1 Tab 键导航

| 场景               | 行为                                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| 焦点进入 Tab List  | 焦点置于当前激活的标签上                                                        |
| 焦点在 Tab List 中 | 焦点移动到 Tab List 外的下一个元素（通常是 Tab Panel 或其内部第一个可聚焦元素） |

### 3.2 方向键导航（水平标签页）

| 按键         | 功能                                               |
| ------------ | -------------------------------------------------- |
| 左箭头       | 焦点移到上一个标签；如果在第一个标签，移到最后一个 |
| 右箭头       | 焦点移到下一个标签；如果在最后一个标签，移到第一个 |
| Home（可选） | 焦点移到第一个标签                                 |
| End（可选）  | 焦点移到最后一个标签                               |

### 3.3 方向键导航（垂直标签页）

| 按键   | 功能                     |
| ------ | ------------------------ |
| 上箭头 | 等同于水平标签页的左箭头 |
| 下箭头 | 等同于水平标签页的右箭头 |

### 3.4 激活操作

| 按键                                            | 功能                                 |
| ----------------------------------------------- | ------------------------------------ |
| Space / Enter                                   | 激活当前聚焦的标签（手动激活模式下） |
| Shift + F10（Windows）<br>Control + 点击（Mac） | 如果标签有关联的弹出菜单，打开菜单   |
| Delete（可选）                                  | 如果允许删除，删除当前标签及其面板   |

### 3.5 自动激活说明

- 推荐在面板内容已预加载时使用自动激活
- 自动激活时，方向键移动焦点会立即激活对应标签
- 如果面板加载有延迟，使用手动激活避免阻碍导航

## 四、实现方式与样式要点

### 4.1 基础 HTML 结构

```html
<div class="tabs">
  <!-- Tab List -->
  <div
    role="tablist"
    aria-label="产品信息">
    <button
      role="tab"
      id="tab-1"
      aria-selected="true"
      aria-controls="panel-1"
      tabindex="0">
      产品详情
    </button>
    <button
      role="tab"
      id="tab-2"
      aria-selected="false"
      aria-controls="panel-2"
      tabindex="-1">
      规格参数
    </button>
    <button
      role="tab"
      id="tab-3"
      aria-selected="false"
      aria-controls="panel-3"
      tabindex="-1">
      用户评价
    </button>
  </div>

  <!-- Tab Panels -->
  <div
    role="tabpanel"
    id="panel-1"
    aria-labelledby="tab-1">
    <h2>产品详情</h2>
    <p>这是一款高性能的...</p>
  </div>

  <div
    role="tabpanel"
    id="panel-2"
    aria-labelledby="tab-2"
    hidden>
    <h2>规格参数</h2>
    <table>
      <tr>
        <th>尺寸</th>
        <td>100 x 50 x 20 mm</td>
      </tr>
      <tr>
        <th>重量</th>
        <td>200g</td>
      </tr>
    </table>
  </div>

  <div
    role="tabpanel"
    id="panel-3"
    aria-labelledby="tab-3"
    hidden>
    <h2>用户评价</h2>
    <p>"非常满意这款产品..."</p>
  </div>
</div>
```

### 4.2 样式实现注意事项

#### 4.2.1 激活状态样式

激活的标签需要有明显的视觉区分：

- **下划线/边框**：使用边框颜色变化指示激活状态
- **背景色**：激活标签使用不同的背景色
- **文字样式**：加粗或改变颜色增强对比

#### 4.2.2 焦点状态样式

确保键盘用户可以清楚看到当前焦点位置：

- 使用 `outline` 或 `box-shadow` 创建焦点环
- 焦点环颜色与背景有足够对比度
- 避免使用 `outline: none` 而不提供替代样式

#### 4.2.3 面板显示/隐藏

- 未激活的面板应使用 `hidden` 属性或 `display: none` 完全隐藏
- 避免使用 `visibility: hidden` 或 `opacity: 0`，这会让内容仍可被屏幕阅读器访问

#### 4.2.4 垂直标签页样式

垂直布局时需要注意：

- 标签列表使用 `flex-direction: column`
- 激活指示器从底部边框改为右侧边框
- 确保足够的点击区域（最小 44x44px）

#### 4.2.5 响应式设计

移动端适配建议：

- 小屏幕下标签可以换行或使用水平滚动
- 考虑将水平标签页切换为垂直布局
- 调整标签内边距和字体大小

## 五、常见应用场景

### 5.1 产品详情页

```html
<div
  role="tablist"
  aria-label="产品信息">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-overview">
    概览
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-features">
    功能
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-reviews">
    评价
  </button>
</div>
```

### 5.2 设置面板

```html
<div
  role="tablist"
  aria-label="设置选项"
  aria-orientation="vertical">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-account">
    账户
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-privacy">
    隐私
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-notifications">
    通知
  </button>
</div>
```

### 5.3 代码示例展示

```html
<div
  role="tablist"
  aria-label="代码示例">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-html">
    HTML
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-css">
    CSS
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-js">
    JavaScript
  </button>
</div>
```

## 六、最佳实践

### 6.1 选择合适的激活模式

- **自动激活**：面板内容已预加载，无明显延迟
- **手动激活**：面板内容需要异步加载，或加载时间较长

### 6.2 确保键盘可访问

- 所有标签都必须可以通过键盘聚焦
- 方向键在标签之间循环导航
- Tab 键从标签列表移动到面板内容

### 6.3 提供清晰的视觉反馈

- 激活的标签使用不同的样式（颜色、边框）
- 焦点状态清晰可见
- 未激活的面板完全隐藏

### 6.4 避免嵌套 Tabs

不要在 Tab Panel 内部嵌套另一个 Tabs，这会造成：

- 键盘导航复杂且容易迷失
- 屏幕阅读器用户难以理解层级关系
- 视觉上的混乱

### 6.5 处理大量标签

如果标签数量过多：

- 考虑使用垂直方向节省水平空间
- 或者重新组织内容结构
- 避免标签需要水平滚动

### 6.6 移动端适配

```css
@media (max-width: 640px) {
  [role='tablist'] {
    flex-wrap: wrap;
  }

  [role='tab'] {
    flex: 1;
    min-width: 80px;
    padding: 10px;
    font-size: 14px;
  }
}
```

## 七、Tabs 与 Accordion 的选择

| 场景             | 推荐组件      | 原因               |
| ---------------- | ------------- | ------------------ |
| 内容需要同时对比 | **Accordion** | 可以展开多个面板   |
| 空间有限         | **Tabs**      | 更紧凑的界面       |
| 内容有明确的顺序 | **Tabs**      | 标签顺序暗示重要性 |
| 大量内容分组     | **Tabs**      | 更好的内容组织     |
| 移动设备优先     | **Accordion** | 垂直空间更充裕     |

## 八、总结

构建无障碍的 Tabs 组件需要关注：

1. **正确的 ARIA 角色**：`tablist`、`tab`、`tabpanel`
2. **完整的状态管理**：`aria-selected`、`aria-controls`、`tabindex`
3. **键盘导航支持**：方向键循环、Home/End 快捷键
4. **合适的激活模式**：根据内容加载情况选择自动或手动激活
5. **清晰的视觉反馈**：激活状态、焦点状态明确可辨

遵循 [W3C Tabs Pattern][0] 规范，我们能够创建既美观又包容的标签页组件，为所有用户提供一致的体验。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#tab
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-selected
[4]: https://www.w3.org/TR/wai-aria-1.2/#tablist
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-orientation
[7]: https://www.w3.org/TR/wai-aria-1.2/#aria-controls
[8]: https://html.spec.whatwg.org/multipage/interaction.html#tabindex
[9]: https://www.w3.org/TR/wai-aria-1.2/#tabpanel
