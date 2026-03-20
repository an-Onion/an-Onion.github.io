# Carousel Pattern 详解：构建无障碍轮播组件

轮播（Carousel）是一种按顺序展示一组内容项（称为幻灯片）的组件。本文基于 [W3C WAI-ARIA Carousel Pattern][0] 规范，详解如何构建无障碍的轮播组件。

## 一、Carousel 的定义与核心概念

### 1.1 什么是 Carousel

Carousel（也称为幻灯片或图片轮播器）具有以下特征：

- 展示一组称为**幻灯片（Slide）**的内容项
- 通常一次显示一个幻灯片，通过控制按钮切换
- 可以自动轮播，也可以手动控制
- 幻灯片可以包含任何类型的内容，图片轮播最为常见

### 1.2 核心术语

| 术语                       | 说明                                     |
| -------------------------- | ---------------------------------------- |
| **Slide**                  | 轮播中的单个内容容器                     |
| **Rotation Control**       | 停止/启动自动轮播的交互控件              |
| **Next Slide Control**     | 显示下一张幻灯片的控件（通常为箭头样式） |
| **Previous Slide Control** | 显示上一张幻灯片的控件（通常为箭头样式） |
| **Slide Picker Controls**  | 选择特定幻灯片的控件组（通常为圆点样式） |

### 1.3 无障碍挑战

轮播组件如果没有正确实现，会对无障碍体验造成严重影响：

- **屏幕阅读器用户困惑**：如果不可见的幻灯片没有被正确隐藏，用户可能在不知情的情况下从幻灯片 1 跳转到幻灯片 2 的内容
- **自动轮播干扰**：自动轮播可能打断屏幕阅读器用户的浏览流程
- **键盘导航困难**：如果轮播没有正确处理焦点管理，键盘用户可能无法有效控制轮播

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

轮播区域使用 [`role="region"`][7] 标记为地标区域，并通过 [`aria-roledescription="carousel"`][8] 提供额外的角色描述：

```html
<section
  role="region"
  aria-roledescription="carousel"
  aria-label="产品展示">
  <!-- 轮播内容 -->
</section>
```

### 2.2 幻灯片属性

每个幻灯片具有以下属性：

- [`role="group"`][4]：将幻灯片标记为一个组
- [`aria-roledescription="slide"`][8]：提供幻灯片的角色描述
- [`aria-label`][5] 或 [`aria-labelledby`][5]：提供幻灯片的可访问标签

```html
<div
  role="group"
  aria-roledescription="slide"
  aria-label="第 1 张，共 3 张">
  <!-- 幻灯片内容 -->
</div>
```

### 2.3 幻灯片可见性

使用 [`aria-hidden`][9] 控制幻灯片的可见性：

- `aria-hidden="true"`：幻灯片不可见（不在视口内）
- `aria-hidden="false"`：幻灯片可见（当前显示的幻灯片）

```html
<!-- 当前显示的幻灯片 -->
<div
  role="group"
  aria-roledescription="slide"
  aria-label="第 1 张，共 3 张"
  aria-hidden="false">
  <img
    src="slide1.jpg"
    alt="产品图片 1" />
</div>

<!-- 隐藏的幻灯片 -->
<div
  role="group"
  aria-roledescription="slide"
  aria-label="第 2 张，共 3 张"
  aria-hidden="true">
  <img
    src="slide2.jpg"
    alt="产品图片 2" />
</div>
```

### 2.4 控制按钮属性

#### 上一张/下一张按钮

```html
<button
  aria-label="上一张"
  aria-controls="carousel-slides">
  ←
</button>
<button
  aria-label="下一张"
  aria-controls="carousel-slides">
  →
</button>
```

#### 轮播控制按钮（停止/启动）

```html
<button
  aria-label="停止轮播"
  aria-pressed="false"
  aria-controls="carousel-slides">
  ⏸
</button>
```

#### 幻灯片选择器（圆点导航）

```html
<div
  role="tablist"
  aria-label="幻灯片选择">
  <button
    role="tab"
    aria-label="第 1 张"
    aria-selected="true"
    aria-controls="slide-1"></button>
  <button
    role="tab"
    aria-label="第 2 张"
    aria-selected="false"
    aria-controls="slide-2"></button>
  <button
    role="tab"
    aria-label="第 3 张"
    aria-selected="false"
    aria-controls="slide-3"></button>
</div>
```

## 三、键盘交互规范

### 3.1 基本键盘交互

| 按键              | 功能                                                |
| ----------------- | --------------------------------------------------- |
| Tab / Shift + Tab | 在轮播的交互元素之间移动焦点                        |
| Space / Enter     | 激活按钮（上一张、下一张、停止/启动）               |
| 方向键（可选）    | 如果幻灯片选择器使用 Tab 模式，可用方向键切换幻灯片 |

### 3.2 自动轮播的键盘行为

- 当轮播中的任何元素获得键盘焦点时，**自动轮播必须停止**
- 轮播不会自动恢复，除非用户明确激活旋转控制

### 3.3 Tab 顺序

- 旋转控制按钮（如果存在）必须是轮播内部 Tab 顺序中的**第一个元素**
- 这确保辅助技术用户可以轻松找到控制按钮

## 四、鼠标交互规范

### 4.1 悬停行为

- 当鼠标悬停在轮播上时，**自动轮播必须停止**
- 鼠标移出后，可以恢复自动轮播（根据设计决定）

### 4.2 点击行为

- 点击上一张/下一张按钮切换幻灯片
- 点击幻灯片选择器跳转到特定幻灯片
- 点击旋转控制按钮停止/启动自动轮播

## 五、实现方式

### 5.1 基础轮播结构

```html
<section
  class="carousel"
  aria-roledescription="carousel"
  aria-label="产品展示">
  <!-- 旋转控制按钮 -->
  <button
    class="rotation-control"
    aria-label="停止轮播"
    aria-pressed="false"
    aria-controls="carousel-slides">
    ⏸
  </button>

  <!-- 幻灯片容器 -->
  <div
    id="carousel-slides"
    class="carousel-slides">
    <div
      role="group"
      aria-roledescription="slide"
      aria-label="第 1 张，共 3 张"
      aria-hidden="false"
      class="slide active">
      <img
        src="slide1.jpg"
        alt="产品图片 1" />
      <div class="slide-content">
        <h2>产品标题 1</h2>
        <p>产品描述...</p>
        <a href="/product1">了解更多</a>
      </div>
    </div>

    <div
      role="group"
      aria-roledescription="slide"
      aria-label="第 2 张，共 3 张"
      aria-hidden="true"
      class="slide">
      <img
        src="slide2.jpg"
        alt="产品图片 2" />
      <div class="slide-content">
        <h2>产品标题 2</h2>
        <p>产品描述...</p>
        <a href="/product2">了解更多</a>
      </div>
    </div>

    <div
      role="group"
      aria-roledescription="slide"
      aria-label="第 3 张，共 3 张"
      aria-hidden="true"
      class="slide">
      <img
        src="slide3.jpg"
        alt="产品图片 3" />
      <div class="slide-content">
        <h2>产品标题 3</h2>
        <p>产品描述...</p>
        <a href="/product3">了解更多</a>
      </div>
    </div>
  </div>

  <!-- 导航按钮 -->
  <button
    class="prev-btn"
    aria-label="上一张"
    aria-controls="carousel-slides">
    ←
  </button>
  <button
    class="next-btn"
    aria-label="下一张"
    aria-controls="carousel-slides">
    →
  </button>

  <!-- 幻灯片选择器 -->
  <div
    class="slide-picker"
    role="tablist"
    aria-label="幻灯片选择">
    <button
      role="tab"
      aria-label="第 1 张"
      aria-selected="true"
      aria-controls="slide-1"></button>
    <button
      role="tab"
      aria-label="第 2 张"
      aria-selected="false"
      aria-controls="slide-2"></button>
    <button
      role="tab"
      aria-label="第 3 张"
      aria-selected="false"
      aria-controls="slide-3"></button>
  </div>
</section>
```

### 5.2 基础 CSS 样式

```css
.carousel {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.carousel-slides {
  position: relative;
  overflow: hidden;
  height: 400px;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.slide.active {
  opacity: 1;
}

/* 旋转控制按钮 */
.rotation-control {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 导航按钮 */
.prev-btn,
.next-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 16px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 20px;
}

.prev-btn {
  left: 10px;
}

.next-btn {
  right: 10px;
}

.prev-btn:hover,
.next-btn:hover,
.rotation-control:hover {
  background: rgba(0, 0, 0, 0.8);
}

.prev-btn:focus,
.next-btn:focus,
.rotation-control:focus {
  outline: 2px solid #005a9c;
  outline-offset: 2px;
}

/* 幻灯片选择器 */
.slide-picker {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.slide-picker button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: transparent;
  cursor: pointer;
}

.slide-picker button[aria-selected='true'] {
  background: #005a9c;
  border-color: #005a9c;
}

.slide-picker button:focus {
  outline: 2px solid #005a9c;
  outline-offset: 2px;
}
```

### 5.3 JavaScript 实现

```javascript
class Carousel {
  constructor(element) {
    this.carousel = element;
    this.slides = element.querySelectorAll('.slide');
    this.prevBtn = element.querySelector('.prev-btn');
    this.nextBtn = element.querySelector('.next-btn');
    this.rotationControl = element.querySelector('.rotation-control');
    this.slidePicker = element.querySelector('.slide-picker');

    this.currentSlide = 0;
    this.isAutoRotating = false;
    this.autoRotateInterval = null;
    this.autoRotateDelay = 5000; // 5秒

    this.init();
  }

  init() {
    // 绑定按钮事件
    this.prevBtn.addEventListener('click', () => this.prevSlide());
    this.nextBtn.addEventListener('click', () => this.nextSlide());

    // 绑定旋转控制
    if (this.rotationControl) {
      this.rotationControl.addEventListener('click', () =>
        this.toggleRotation(),
      );
    }

    // 绑定幻灯片选择器
    if (this.slidePicker) {
      const pickerButtons = this.slidePicker.querySelectorAll('button');
      pickerButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => this.goToSlide(index));
      });
    }

    // 键盘焦点管理
    this.carousel.addEventListener('focusin', () => this.stopAutoRotate());

    // 鼠标悬停管理
    this.carousel.addEventListener('mouseenter', () => this.stopAutoRotate());

    // 启动自动轮播（如果启用）
    this.startAutoRotate();
  }

  showSlide(index) {
    // 隐藏所有幻灯片
    this.slides.forEach((slide, i) => {
      slide.classList.remove('active');
      slide.setAttribute('aria-hidden', 'true');

      // 更新幻灯片选择器
      if (this.slidePicker) {
        const pickerBtn = this.slidePicker.querySelectorAll('button')[i];
        if (pickerBtn) {
          pickerBtn.setAttribute('aria-selected', 'false');
        }
      }
    });

    // 显示当前幻灯片
    this.slides[index].classList.add('active');
    this.slides[index].setAttribute('aria-hidden', 'false');

    // 更新幻灯片选择器
    if (this.slidePicker) {
      const pickerBtn = this.slidePicker.querySelectorAll('button')[index];
      if (pickerBtn) {
        pickerBtn.setAttribute('aria-selected', 'true');
      }
    }

    this.currentSlide = index;
  }

  nextSlide() {
    const next = (this.currentSlide + 1) % this.slides.length;
    this.showSlide(next);
  }

  prevSlide() {
    const prev =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.showSlide(prev);
  }

  goToSlide(index) {
    this.showSlide(index);
  }

  startAutoRotate() {
    if (this.autoRotateInterval) return;

    this.isAutoRotating = true;
    if (this.rotationControl) {
      this.rotationControl.setAttribute('aria-label', '停止轮播');
      this.rotationControl.setAttribute('aria-pressed', 'false');
      this.rotationControl.textContent = '⏸';
    }

    this.autoRotateInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoRotateDelay);
  }

  stopAutoRotate() {
    if (!this.autoRotateInterval) return;

    clearInterval(this.autoRotateInterval);
    this.autoRotateInterval = null;
    this.isAutoRotating = false;

    if (this.rotationControl) {
      this.rotationControl.setAttribute('aria-label', '启动轮播');
      this.rotationControl.setAttribute('aria-pressed', 'true');
      this.rotationControl.textContent = '▶';
    }
  }

  toggleRotation() {
    if (this.isAutoRotating) {
      this.stopAutoRotate();
    } else {
      this.startAutoRotate();
    }
  }
}

// 初始化所有轮播
document.querySelectorAll('.carousel').forEach((carousel) => {
  new Carousel(carousel);
});
```

## 六、常见应用场景

### 6.1 产品图片展示

```html
<section
  aria-roledescription="carousel"
  aria-label="产品图片">
  <div
    role="group"
    aria-roledescription="slide"
    aria-label="第 1 张，共 4 张">
    <img
      src="product-1.jpg"
      alt="产品正面视图" />
  </div>
  <div
    role="group"
    aria-roledescription="slide"
    aria-label="第 2 张，共 4 张">
    <img
      src="product-2.jpg"
      alt="产品侧面视图" />
  </div>
  <div
    role="group"
    aria-roledescription="slide"
    aria-label="第 3 张，共 4 张">
    <img
      src="product-3.jpg"
      alt="产品背面视图" />
  </div>
  <div
    role="group"
    aria-roledescription="slide"
    aria-label="第 4 张，共 4 张">
    <img
      src="product-4.jpg"
      alt="产品细节视图" />
  </div>
</section>
```

### 6.2 testimonials/客户评价

```html
<section
  aria-roledescription="carousel"
  aria-label="客户评价">
  <div
    role="group"
    aria-roledescription="slide"
    aria-label="第 1 张，共 3 张">
    <blockquote>
      <p>"这个产品改变了我的工作方式..."</p>
      <footer>— 张三，某公司员工</footer>
    </blockquote>
  </div>
  <div
    role="group"
    aria-roledescription="slide"
    aria-label="第 2 张，共 3 张">
    <blockquote>
      <p>"客服非常专业，响应迅速..."</p>
      <footer>— 李四，自由职业者</footer>
    </blockquote>
  </div>
</section>
```

### 6.3 新闻/公告轮播

```html
<section
  aria-roledescription="carousel"
  aria-label="最新公告">
  <div
    role="group"
    aria-roledescription="slide"
    aria-label="第 1 张，共 3 张">
    <article>
      <h3>公司发布新产品</h3>
      <p>我们很高兴地宣布...</p>
      <a href="/news/1">阅读更多</a>
    </article>
  </div>
</section>
```

## 七、最佳实践

### 7.1 始终提供轮播控制

- 必须提供上一张/下一张按钮
- 如果启用自动轮播，必须提供停止/启动控制按钮
- 建议提供幻灯片选择器（圆点导航）

### 7.2 正确处理幻灯片可见性

- 使用 `aria-hidden="true"` 隐藏不可见的幻灯片
- 确保隐藏的幻灯片内容不会被屏幕阅读器读取
- 当前幻灯片使用 `aria-hidden="false"`

### 7.3 自动轮播的控制

- 自动轮播必须在以下情况下停止：
  - 键盘焦点进入轮播区域
  - 鼠标悬停在轮播上
  - 用户点击停止按钮
- 不要在用户未明确请求的情况下重新启动自动轮播

### 7.4 提供清晰的标签

- 为轮播区域提供描述性的 `aria-label`
- 为每个幻灯片提供包含位置信息的标签（如"第 1 张，共 3 张"）
- 为所有控制按钮提供清晰的 `aria-label`

### 7.5 避免使用轮播的情况

以下情况不建议使用轮播：

- 内容对用户都很重要，需要同时可见
- 用户需要比较不同幻灯片的内容
- 幻灯片内容包含重要的交互元素

在这些情况下，考虑使用静态列表或网格布局。

### 7.6 移动端触摸支持

```javascript
// 添加触摸滑动支持
let touchStartX = 0;
let touchEndX = 0;

this.carousel.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

this.carousel.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  this.handleSwipe();
});

handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      this.nextSlide(); // 向左滑动，显示下一张
    } else {
      this.prevSlide(); // 向右滑动，显示上一张
    }
  }
}
```

## 八、总结

构建无障碍的 Carousel 组件需要特别关注：

1. **正确的 ARIA 标记**：使用 `role="region"`、`aria-roledescription`、`aria-hidden` 等属性
2. **完整的键盘支持**：确保所有功能都可以通过键盘访问
3. **自动轮播控制**：提供停止/启动控制，并在焦点进入时自动停止
4. **清晰的标签**：为轮播、幻灯片和控制按钮提供描述性标签
5. **幻灯片可见性管理**：正确隐藏不可见的幻灯片，避免屏幕阅读器混淆

轮播组件虽然常见，但如果没有正确实现，会对无障碍体验造成严重影响。遵循 [W3C Carousel Pattern][0] 规范，我们能够创建既美观又包容的轮播组件，为所有用户提供良好的体验。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#button
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-expanded
[4]: https://www.w3.org/TR/wai-aria-1.2/#group
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-controls
[7]: https://www.w3.org/TR/wai-aria-1.2/#region
[8]: https://www.w3.org/TR/wai-aria-1.2/#aria-roledescription
[9]: https://www.w3.org/TR/wai-aria-1.2/#aria-hidden
