---
id: styling-ui-m3-l2
course: Styling, CSS Systems & UI Component Libraries
module: Design system và khả năng tiếp cận
title: Theme System & Design Tokens
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Theme System & Design Tokens

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích kiến trúc **Design Tokens Architecture** đa tầng (Primitive Tokens, Semantic Tokens, Component Tokens).
- Định nghĩa cấu trúc thẻ màu sắc chuẩn **HSL (Hue, Saturation, Lightness)** giúp hỗ trợ tính toán độ đục (Opacity) linh hoạt.
- Tự động đồng bộ hệ thống Design Tokens giữa các công cụ thiết kế (Figma Tokens / Style Dictionary) và mã nguồn Frontend.
- Xây dựng hệ thống Đa Chủ Đề **Multi-Theme Engine** (Brand Themes: Blue, Emerald, Purple).
- Tích hợp Design Tokens vào Tailwind CSS v4 `@theme`.
- Đảm bảo tính nhất quán của hệ thống khoảng cách (Spacing Scale) và kiểu chữ (Typography Scale).

---

## 📖 Definition

### 1. Kiến Trúc 3 Tầng Của Design Tokens (3-Tier Tokens Architecture)

Trong các ứng dụng quy mô lớn, việc khai báo màu sắc mã hex trực tiếp (`color: #2563eb`) gây khó khăn cực kỳ khi công ty muốn đổi nhận diện thương hiệu.

**Design Tokens Architecture** chia các giá trị thiết kế thành 3 tầng phân cấp rõ ràng:

1. **Primitive Tokens (Tokens Cơ sở / Thô):**
   - Lưu trữ các giá trị màu sắc, độ rộng thô: `--blue-500: #3b82f6;`, `--spacing-4: 16px;`.
2. **Semantic Tokens (Tokens Ngữ nghĩa):**
   - Gán ý nghĩa nghiệp vụ cho giá trị thô: `--bg-interactive: var(--blue-500);`, `--text-danger: var(--red-600);`.
3. **Component Tokens (Tokens Component Cụ thể):**
   - Gán cho từng phần tử: `--button-primary-bg: var(--bg-interactive);`.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   KIẾN TRÚC DESIGN TOKENS 3 TẦNG                       │
└────────────────────────────────────────────────────────────────────────┘

  [ Tier 1: Primitive ]  ───>  --blue-600: #2563eb;
                                    │
  [ Tier 2: Semantic ]   ───>  --color-brand-primary: var(--blue-600);
                                    │
  [ Tier 3: Component ]  ───>  --btn-bg: var(--color-brand-primary);
```

---

## 2. Hệ Màu HSL (Hue, Saturation, Lightness) Cho Design Systems

Thay vì dùng mã Hex (`#2563eb`) hay RGB, các hệ thống UI cao cấp (như Shadcn UI) ưu tiên lưu trữ màu dưới dạng HSL rời:
`--primary: 221.2 83.2% 53.3%;`

Lợi ích vượt trội của HSL:
Bạn có thể điều chỉnh độ mờ opacity dễ dàng trong Tailwind CSS hay CSS thuần bằng cách truyền thêm biến alpha: `hsl(var(--primary) / 0.5)` (Độ mờ 50%).

---

## 💻 Syntax

### HSL Design Token System Blueprint
```css
:root {
  /* HSL Values (Không chứa ngoặc hsl() để linh hoạt gán alpha) */
  --primary-hsl: 221.2 83.2% 53.3%;
  
  /* Sử dụng */
  --primary-color: hsl(var(--primary-hsl));
  --primary-hover: hsl(var(--primary-hsl) / 0.9);
}
```

---

## 📝 Example 1 - Khai Báo Hệ Thống Semantic Design Tokens Đa Chủ Đề (`theme-tokens.css`)

```css
/* src/styles/theme-tokens.css */

/* 1. TẦNG PRIMITIVE TOKENS (Giá trị thô) */
:root {
  --color-blue-500: 217 91% 60%;
  --color-blue-600: 221 83% 53%;
  
  --color-emerald-500: 160 84% 39%;
  --color-emerald-600: 161 94% 30%;

  --color-purple-500: 270 91% 65%;
  --color-purple-600: 271 81% 56%;

  --slate-50: 210 40% 98%;
  --slate-900: 222 47% 11%;
}

/* 2. TẦNG SEMANTIC TOKENS (Mặc định: Blue Theme) */
:root, [data-brand="blue"] {
  --brand-primary: var(--color-blue-600);
  --brand-light: var(--color-blue-500);
  --bg-app: var(--slate-50);
  --text-app: var(--slate-900);
}

/* 3. THAY ĐỔI BRAND THEMES LINH HOẠT */
[data-brand="emerald"] {
  --brand-primary: var(--color-emerald-600);
  --brand-light: var(--color-emerald-500);
}

[data-brand="purple"] {
  --brand-primary: var(--color-purple-600);
  --brand-light: var(--color-purple-500);
}

/* Class tiện ích sử dụng HSL kèm Opacity */
.btn-brand {
  background-color: hsl(var(--brand-primary));
  color: white;
  transition: all 0.2s ease;
}

.btn-brand:hover {
  background-color: hsl(var(--brand-primary) / 0.85); /* Tự động chỉnh Opacity 85%! */
}
```

---

## 📝 Example 2 - Tích Hợp Design Tokens Vào Tailwind CSS v4 `@theme`

```css
/* src/index.css */
@import "tailwindcss";
@import "./styles/theme-tokens.css";

/* Tích hợp Semantic Tokens vào Tailwind v4 Engine */
@theme {
  --color-brand-primary: hsl(var(--brand-primary));
  --color-brand-light: hsl(var(--brand-light));
  --color-app-bg: hsl(var(--bg-app));
  --color-app-text: hsl(var(--text-app));

  /* Spacing Scale Tokens chuẩn mực */
  --spacing-container: 1280px;
}
```

---

## 📝 Example 3 - Trình Chọn Chủ Đề Thương Hiệu (Brand Theme Selector) Trong React

```tsx
// src/components/BrandThemeSelector.tsx
import React, { useState, useEffect } from "react";

type BrandTheme = "blue" | "emerald" | "purple";

export function BrandThemeSelector() {
  const [brand, setBrand] = useState<BrandTheme>(() => {
    return (localStorage.getItem("brand-theme") as BrandTheme) || "blue";
  });

  useEffect(() => {
    // Đổi thuộc tính data-brand trên <html> để toàn bộ Semantic Tokens tự đổi màu!
    document.documentElement.setAttribute("data-brand", brand);
    localStorage.setItem("brand-theme", brand);
  }, [brand]);

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-slate-900 border rounded-2xl shadow-md space-y-4">
      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Chọn Chủ Đề Thương Hiệu</h3>

      <div className="flex space-x-3">
        {[
          { id: "blue", name: "Xanh Dương", color: "bg-blue-600" },
          { id: "emerald", name: "Xanh Lục", color: "bg-emerald-600" },
          { id: "purple", name: "Tím Mộng Mơ", color: "bg-purple-600" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setBrand(item.id as BrandTheme)}
            className={`flex-1 p-3 rounded-xl border flex flex-col items-center space-y-2 transition-all ${
              brand === item.id ? "border-slate-900 dark:border-white ring-2 ring-slate-900/10" : "border-slate-200"
            }`}
          >
            <span className={`w-6 h-6 rounded-full ${item.color}`} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        {/* Nút bấm tự động đổi màu theo Brand Theme vừa chọn! */}
        <button className="w-full btn-brand py-2.5 rounded-xl font-bold text-sm shadow">
          Nút Bấm Nhận Diện Thương Hiệu
        </button>
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Tách Biệt Giữa Values Thô và Tokens Ngữ Nghĩa:** Không bao giờ gán thẳng tên màu vào mã nguồn Component (ví dụ `text-blue-600`). Hãy gán qua Semantic Token `text-brand-primary`. Nhờ đó khi chuyển theme sang màu Xanh Lục, bạn không cần phải đi sửa chữ "blue" thành "emerald" ở 100 file HTML.

---

## ❌ Common Mistakes

### Sai 1 - Khai báo mã màu Hex cứng làm mất khả năng chỉnh Opacity linh hoạt
```css
/* ❌ SAI: Mã Hex không thể dễ dàng chỉnh opacity trong CSS thuần */
--primary: #2563eb;

/* ✅ ĐÚNG CHUẨN DESIGN SYSTEM: Lưu giá trị HSL nguyên thủy */
--primary-hsl: 221.2 83.2% 53.3%;
/* Sử dụng: hsl(var(--primary-hsl) / 0.5) */
```

---

## 📚 Summary

- **Design Tokens Architecture** chia làm 3 tầng: Primitive, Semantic, và Component Tokens.
- Lưu trữ màu sắc dạng **HSL** để tự động điều chỉnh Opacity linh hoạt.
- Đổi chủ đề giao diện (Multi-Theme Engine) qua các thuộc tính **`data-brand="..."`**.
- Tích hợp Semantic Tokens vào Tailwind v4 **`@theme`**.

---

## 📝 Quiz

### Question 1
Kiến trúc Design Tokens đa tầng giúp giải quyết bài toán quan trọng nào trong việc quản lý hệ thống giao diện (Design System) quy mô doanh nghiệp?

A. Giúp website tải ảnh nhanh hơn  
B. Phân tách rành mạch giữa giá trị màu thô (Primitive) và ý nghĩa nghiệp vụ (Semantic), cho phép thay đổi toàn bộ tông màu thương hiệu của hệ thống chỉ bằng việc sửa 1 biến Semantic Token duy nhất  
C. Tự động mã hóa CSDL  
D. Cả A và C  

**Explanation:**  
Bằng cách dùng Semantic Tokens (`--brand-primary: var(--blue-600)`), các Component chỉ cần tiêu thụ `--brand-primary`. Khi cần đổi thương hiệu sang màu Xanh Lục, bạn chỉ cần trỏ `--brand-primary: var(--emerald-600)` mà không cần đi sửa lại hàng trăm file mã nguồn.

**Answer: B**

---

### Question 2
Ưu điểm đột phá của việc lưu trữ giá trị màu sắc dưới dạng các tham số HSL rời (`--primary: 221.2 83.2% 53.3%`) thay vì mã Hex (`#2563eb`) là gì?

A. HSL tốn ít dung lượng RAM hơn  
B. Cho phép dễ dàng truyền thêm tham số Alpha để tính toán và điều chỉnh độ mờ (Opacity) linh hoạt trong CSS thuần và Tailwind (`hsl(var(--primary) / 0.5)`)  
C. Mã Hex bị cấm bởi trình duyệt Chrome  
D. Cả B và C  

**Explanation:**  
Lưu trữ tham số HSL rời giúp bạn có thể bọc giá trị đó bằng toán tử `hsl(var(--primary) / alpha)` để tạo ra các sắc độ màu có độ mờ opacity từ 0% đến 100% cực kỳ linh hoạt mà không cần khai báo mã Hex mới.

**Answer: B**

---

### Question 3
Thuộc tính nào trên thẻ `<html>` thường được sử dụng để kích hoạt tính năng chuyển đổi Đa chủ đề thương hiệu (Brand Themes: Blue, Emerald, Purple) thông qua CSS Selectors?

A. `data-brand="emerald"`  
B. `style="blue"`  
C. `class="theme-switcher"`  
D. `id="color"`  

**Explanation:**  
Sử dụng các thuộc tính dữ liệu tùy biến như `data-brand="emerald"` trên thẻ root `<html>` cho phép CSS Selectors dạng `[data-brand="emerald"] { --brand-primary: ... }` ghi đè giá trị biến Semantic Tokens một cách vô cùng sạch sẽ và hiệu quả.

**Answer: A**
