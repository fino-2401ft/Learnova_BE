---
id: styling-ui-m1-l1
course: Styling, CSS Systems & UI Component Libraries
module: CSS Modules và Tailwind
title: CSS Modules & CSS Variables
order: 1
difficulty: Intermediate
estimatedTime: 240
---
# CSS Modules & CSS Variables

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích nguyên nhân tại sao CSS toàn cục (Global CSS) dễ bị rò rỉ kiểu dáng (**CSS Scope Pollution**) và cách **CSS Modules** cô lập phạm vi kiểu dáng cục bộ (Scoped Styles).
- Khai báo và sử dụng tệp tin **`[name].module.css`** trong React.
- Làm chủ biến **CSS Variables (Custom Properties)** cho hệ thống Design System (Màu sắc, Khoảng cách, Font chữ).
- Kết hợp động giữa CSS Modules và biến CSS Variables để tạo tính năng đổi giao diện **Dynamic Theme Switching (Light/Dark Mode)**.
- Xử lý các Class tĩnh và động linh hoạt với thư viện **`clsx`** hoặc **`classnames`**.
- Ghi đè CSS toàn cục một cách có kiểm soát bằng từ khóa toán tử **`:global`**.

---

## 📖 Definition

### 1. Thách Thức Của CSS Truyền Thống Và Giải Pháp CSS Modules

Trong các ứng dụng React lớn, nếu bạn sử dụng các file `.css` truyền thống:
```css
/* button.css */
.btn { background-color: blue; }
```
Khi bạn import `button.css` ở bất kỳ đâu, class `.btn` sẽ bị đẩy vào phạm vi toàn cục (Global Scope). Nếu một Component khác ở một trang khác cũng dùng tên class `.btn`, xung đột kiểu dáng (CSS Name Collision) sẽ xảy ra khiến giao diện bị đè vỡ.

**CSS Modules** giải quyết triệt để bài toán này bằng cách tự động đổi tên class thành các chuỗi hash độc nhất tại thời điểm build:
- File mã nguồn: `.button { background: blue; }` trong `Button.module.css`
- Kết quả sau khi Build: `.Button_button__a1b2c { background: blue; }`

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CƠ CHẾ CÔ LẬP NGHĨA CỦA CSS MODULES                  │
└────────────────────────────────────────────────────────────────────────┘

 [ Input: .card { ... } ] ───( Build Process )───> [ Output: .Card_card__x9z8q { ... } ]
 (Trong Card.module.css)                                (Hash độc nhất 100% scoped!)
```

---

## 2. CSS Variables (Custom Properties)

**CSS Variables** là các biến số được định nghĩa trực tiếp trong tập tin CSS bằng tiền tố `--`:
```css
:root {
  --primary-color: #2563eb;
  --font-family: 'Inter', sans-serif;
  --spacing-md: 16px;
}
```
Khác với biến Sass/Less (chỉ tồn tại tại thời điểm compile), CSS Variables tồn tại thực sự trên DOM ở runtime. Bạn có thể dễ dàng thay đổi giá trị của `--primary-color` bằng JavaScript trong 0.1ms để đổi toàn bộ Theme giao diện của trang web!

---

## 💻 Syntax

### 1. Import và tiêu thụ CSS Modules trong React
```tsx
import styles from "./Button.module.css";
import clsx from "clsx";

export function Button({ variant = "primary", className }: ButtonProps) {
  return (
    <button
      className={clsx(
        styles.btn, // Class cơ sở từ Module
        styles[variant], // Class động dựa trên props
        className // Class tùy chỉnh truyền từ bên ngoài
      )}
    >
      Click Me
    </button>
  );
}
```

---

## 📝 Example 1 - Thiết Lập Hệ Thống Design Tokens Với CSS Variables (`variables.css`)

```css
/* src/styles/variables.css */
:root {
  /* Color Tokens - Light Theme */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --brand-color: #2563eb;
  --brand-hover: #1d4ed8;
  --border-color: #e2e8f0;

  /* Typography & Spacing Tokens */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --radius-md: 12px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Dark Theme Overrides */
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --brand-color: #3b82f6;
  --brand-hover: #60a5fa;
  --border-color: #334155;
}
```

---

## 📝 Example 2 - Xây Dựng Component Card Sản Phẩm Sử Dụng CSS Modules (`Card.module.css`)

```css
/* src/components/Card.module.css */

.card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.title {
  font-family: var(--font-sans);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Class kế thừa toán tử :global cho các plugin bên thứ 3 */
.card :global(.highlight-badge) {
  background-color: #fef08a;
  color: #854d0e;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}
```

```tsx
// src/components/Card.tsx
import React from "react";
import styles from "./Card.module.css";
import clsx from "clsx";

interface CardProps {
  title: string;
  description: string;
  isFeatured?: boolean;
  className?: string;
}

export function Card({ title, description, isFeatured = false, className }: CardProps) {
  return (
    <div className={clsx(styles.card, isFeatured && styles.featured, className)}>
      <h3 className={styles.title}>
        {title} {isFeatured && <span className="highlight-badge">HOT</span>}
      </h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
```

---

## 📝 Example 3 - Trình Đổi Theme Light/Dark Mode Linh Hoạt Bằng JavaScript & CSS Variables

```tsx
// src/components/ThemeSwitcher.tsx
import React, { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    // Gán thuộc tính data-theme vào thẻ <html> để CSS Variables tự động đổi màu!
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
    >
      {theme === "light" ? "🌙 Bật Dark Mode" : "☀️ Bật Light Mode"}
    </button>
  );
}
```

---

## ⚠️ Notes

1. **Quy Tắc Đặt Tên Tệp CSS Modules:** Bắt buộc tập tin phải có phần mở rộng dạng `[filename].module.css` (hoặc `[filename].module.scss`). Nếu bạn đặt tên `Card.css`, Vite/Webpack sẽ xử lý nó thành Global CSS thông thường.

---

## ❌ Common Mistakes

### Sai 1 - Đặt tên class chứa dấu gạch ngang và truy cập kiểu `styles.my-class`
```tsx
/* my-style.module.css: .my-btn { color: red; } */

// ❌ SAI CÚ PHÁP JAVASCRIPT: Không thể truy cập styles.my-btn!
const cls = styles.my-btn; 

// ✅ ĐÚNG: Dùng camelCase .myBtn hoặc ngoặc vuông styles['my-btn']
const cls = styles.myBtn;
```

---

## 📚 Summary

- **CSS Modules** tự động tạo ra tên class duy nhất (Scoped Styles) ngăn chặn triệt để hiện tượng rò rỉ kiểu dáng toàn cục.
- **CSS Variables** cho phép định nghĩa Design Tokens trên DOM và thay đổi theme mượt mượt ở runtime.
- Dùng thư viện **`clsx`** để gộp nhiều class tĩnh và class động một cách sạch sẽ.
- Dùng **`:global(.className)`** khi muốn ghi đè CSS cho các thành phần bên thứ ba.

---

## 📝 Quiz

### Question 1
Lợi ích vượt trội mấu chốt nhất của việc sử dụng CSS Modules (`[name].module.css`) trong dự án React so with file CSS toàn cục truyền thống là gì?

A. Tự động mã hóa CSDL  
B. Tự động băm (hash) tên class thành các chuỗi duy nhất, cô lập phạm vi kiểu dáng cục bộ (Scoped Styles) và loại bỏ hoàn toàn nguy cơ xung đột tên class giữa các Component  
C. Làm tăng tốc độ tải mạng  
D. Cả A và C  

**Explanation:**  
CSS Modules tự động chuyển đổi tên class (ví dụ `.button` ➔ `.Button_button__a1b2c`) tại thời điểm build, giúp kiểu dáng của từng Component hoàn toàn độc lập và không bao giờ ảnh hưởng đến các Component khác.

**Answer: B**

---

### Question 2
Điểm vượt trội của biến CSS Variables (`--primary-color: #2563eb`) so với các biến Sass/Less compile tĩnh là gì?

A. CSS Variables chỉ dùng được trên di động  
B. CSS Variables thực sự tồn tại trên DOM cây trình duyệt ở runtime, cho phép JavaScript dễ dàng thay đổi giá trị để đổi Theme (Light/Dark Mode) tức thì  
C. CSS Variables không cần trình duyệt  
D. Cả B và C  

**Explanation:**  
CSS Variables tồn tại ở runtime. Bằng cách thay đổi thuộc tính CSS Variable trên thẻ `<html>` hoặc `:root`, toàn bộ giao diện ứng dụng sẽ lập tức cập nhật màu sắc mới trong 0.1ms mà không cần recompile CSS.

**Answer: B**

---

### Question 3
Thư viện utility phổ biến nào được sử dụng để kết hợp và gộp các class tên từ CSS Modules và class động từ Props một cách ngắn gọn, sạch sẽ?

A. `clsx` (hoặc `classnames`)  
B. `axios`  
C. `lodash`  
D. `zustand`  

**Explanation:**  
Thư viện `clsx` cho phép bạn truyền vào mảng các chuỗi class, đối tượng điều kiện `{ [styles.active]: isActive }`, và tự động lọc loại bỏ các giá trị `falsy`, gộp lại thành 1 chuỗi `className` hoàn chỉnh.

**Answer: A**
