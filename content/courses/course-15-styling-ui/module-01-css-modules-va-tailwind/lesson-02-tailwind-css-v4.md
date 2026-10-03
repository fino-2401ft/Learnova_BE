---
id: styling-ui-m1-l2
course: Styling, CSS Systems & UI Component Libraries
module: CSS Modules và Tailwind
title: Tailwind CSS v4 Principles
order: 2
difficulty: Intermediate
estimatedTime: 240
---
# Tailwind CSS v4 Principles

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích các bước ngoặt đột phá trong phiên bản **Tailwind CSS v4** (Engine Oxide viết bằng Rust, cấu hình CSS-First, loại bỏ `tailwind.config.js`).
- Khai báo cấu hình Theme và Design Tokens bằng chỉ thị **`@theme`** ngay trong tập tin CSS gốc.
- Sử dụng công cụ gộp class **`tailwind-merge`** và **`clsx`** (Hàm `cn()`) để ghi đè Tailwind Utility Classes an toàn trong Reusable Components.
- Làm chủ kỹ thuật viết CSS Utility-First trực tiếp trên JSX.
- Áp dụng các toán tử trạng thái nâng cao (**Hover, Focus, Active, Group-Hover, Peer-Checked**).
- Tối ưu hóa dung lượng đóng gói CSS với công cụ tự động dọn dẹp utility không sử dụng của Tailwind.

---

## 📖 Definition

### 1. Sự Khác Biệt Đột Phá Của Tailwind CSS v4

Trong phiên bản Tailwind CSS v3 cũ, bạn bắt buộc phải duy trì tập tin cấu hình JavaScript phức tạp `tailwind.config.js` để định nghĩa màu sắc, font chữ, và plugins.

Trong phiên bản mới nhất **Tailwind CSS v4**:
1. **Engine Oxide Siêu Tốc:** Engine biên dịch được viết lại hoàn toàn bằng **Rust**, cho tốc độ build nhanh gấp **10 lần** phiên bản v3.
2. **Cấu Hình CSS-First:** Loại bỏ hoàn toàn `tailwind.config.js`. Tất cả các tùy chỉnh màu sắc, font chữ, breakpoints được khai báo trực tiếp trong file CSS bằng khối **`@theme`**.
3. **Tự Động Phát Hiện Module:** Không cần khai báo mảng `content: ['./src/**/*.{html,js,ts,jsx,tsx}']` thủ công nữa, Tailwind v4 tự động quét mã nguồn.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   KIẾN TRÚC CSS-FIRST TRONG TAILWIND CSS V4            │
└────────────────────────────────────────────────────────────────────────┘

  [ main.css ]
  @import "tailwindcss";
  
  @theme {
    --color-brand: #2563eb;
    --font-heading: 'Outfit', sans-serif;
  }
```

---

## 2. Giải Quyết Bài Toán Ghi Đè Class Với `tailwind-merge` và `cn()`

Khi bạn tạo một Component tái sử dụng:
```tsx
function Badge({ className }) {
  return <span className={`bg-blue-500 text-white px-2 py-1 ${className}`}>Badge</span>
}
```

Nếu nơi tiêu thụ truyền vào `className="bg-red-500"`, chuỗi kết quả thu được là `"bg-blue-500 text-white px-2 py-1 bg-red-500"`. Lúc này, trình duyệt sẽ tuân theo thứ tự khai báo trong CSS stylesheet chứ **KHÔNG TUÂN THEO thứ tự chuỗi!** Class `bg-blue-500` có thể vẫn đè `bg-red-500`.

Hàm **`cn()`** kết hợp `clsx` và **`tailwind-merge`** giải quyết triệt để vấn đề này bằng cách phân tích và loại bỏ các utility class bị xung đột!

---

## 💻 Syntax

### 1. Hàm `cn()` Standard Helper Blueprint
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 📝 Example 1 - Khai Báo Cấu Hình CSS-First `@theme` Trong Tailwind CSS v4 (`src/index.css`)

```css
/* src/index.css */
@import "tailwindcss";

/* Định nghĩa Design Tokens chuẩn CSS-First của Tailwind v4 */
@theme {
  --color-brand-50: #eff6ff;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;

  --font-display: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;

  --radius-custom: 16px;
}

/* Custom Utilities tùy chỉnh */
@utility card-shadow {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
}
```

---

## 📝 Example 2 - Xây Dựng Component Input Tái Sử Dụng Với `cn()` Và Trạng Thái `peer-checked`

```tsx
// src/components/ui/Input.tsx
import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.ComponentPropsWithoutRef<"input"> {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, className, id, ...props }: InputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1.5 w-full">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            "w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
            "placeholder:text-slate-400",
            leftIcon && "pl-10",
            error && "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/50",
            className // Cho phép ghi đè mượt mượt qua tailwind-merge!
          )}
          {...props}
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
}
```

---

## 📝 Example 3 - Card Sản Phẩm Tương Tác Cao Sử Dụng `group-hover` Và Tailwind v4 Dynamic Classes

```tsx
// src/components/CourseCard.tsx
import React from "react";

interface CourseCardProps {
  title: string;
  category: string;
  price: number;
  imageUrl: string;
}

export function CourseCard({ title, category, price, imageUrl }: CourseCardProps) {
  return (
    // Dùng class "group" ở container cha để kích hoạt hiệu ứnggroup-hover cho các phần tử con!
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden card-shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
          {category}
        </span>
      </div>

      <div className="p-5 space-y-3">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 group-hover:text-brand-600 transition-colors">
          {title}
        </h3>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xl font-black text-brand-600">
            {price.toLocaleString()} VNĐ
          </span>
          <span className="text-sm font-medium text-slate-500 group-hover:translate-x-1 transition-transform flex items-center">
            Chi tiết →
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Luôn Dùng Hàm `cn()` Cho Reusable Components:** Tuyệt đối không nối chuỗi class bằng dấu cộng đơn giản (`className + ' bg-red-500'`). Hãy luôn bọc qua hàm `cn(...)` chứa `tailwind-merge` để đảm bảo class tùy chỉnh có thể ghi đè class mặc định một cách chính xác.

---

## ❌ Common Mistakes

### Sai 1 - Viết tên utility class dạng nối chuỗi động (Dynamic String Concatenation)
```tsx
// ❌ SAI TAI HẠI: Tailwind JIT Compiler KHÔNG THỂ tìm thấy và đóng gói class này!
const color = "red";
<div className={`bg-${color}-500`} /> 

// ✅ ĐÚNG CHUẨN TAILWIND: Khai báo đầy đủ tên class hoặc dùng Lookup Object
const colorClasses = { red: "bg-red-500", blue: "bg-blue-500" };
<div className={colorClasses[color]} />
```

---

## 📚 Summary

- **Tailwind CSS v4** sử dụng Engine Oxide (Rust) cho tốc độ build vượt trội và cấu hình **CSS-First (`@theme`)**.
- Loại bỏ hoàn toàn tập tin `tailwind.config.js`.
- Hàm **`cn()`** (`clsx` + `tailwind-merge`) giải quyết bài toán xung đột và ghi đè class Tailwind trong Reusable Components.
- Sử dụng các state modifiers **`group-hover`**, **`peer-checked`**, **`focus-within`** để tạo hiệu ứng UI mượt mượt.
- Không nối chuỗi tên class động (`bg-${color}-500`).

---

## 📝 Quiz

### Question 1
Thay đổi đột phá mấu chốt về mặt cấu hình của Tailwind CSS v4 so với phiên bản v3 cũ là gì?

A. Bắt buộc phải dùng CSDL MySQL  
B. Loại bỏ tệp `tailwind.config.js` và chuyển sang mô hình cấu hình CSS-First bằng chỉ thị `@theme` trực tiếp trong file CSS gốc, biên dịch bởi Engine Oxide (Rust)  
C. Không hỗ trợ React  
D. Cả A và C  

**Explanation:**  
Tailwind CSS v4 giới thiệu kiến trúc CSS-First hoàn toàn mới. Mọi tùy chỉnh Design Tokens đều được khai báo trong chỉ thị `@theme` ở file CSS, và engine Oxide viết bằng Rust giúp tốc độ biên dịch nhanh gấp 10 lần.

**Answer: B**

---

### Question 2
Hàm utility `cn()` (kết hợp `clsx` và `tailwind-merge`) giải quyết bài toán quan trọng nào khi xây dựng các UI Component tái sử dụng trong Tailwind CSS?

A. Tự động mã hóa mật khẩu  
B. Phân tích và loại bỏ các utility class bị xung đột (ví dụ `bg-blue-500` bị ghi đè bởi `bg-red-500`), đảm bảo class truyền từ bên ngoài luôn ghi đè chính xác class mặc định  
C. Tải file CSS từ server  
D. Tự động dịch tiếng Anh  

**Explanation:**  
Trong Tailwind CSS, thứ tự ưu tiên của class phụ thuộc vào stylesheet chứ không phải thứ tự trong chuỗi `className`. `tailwind-merge` phân tích cú pháp utility class và tự động xóa class cũ bị xung đột để class mới hoạt động đúng.

**Answer: B**

---

### Question 3
Tại sao bạn KHÔNG NÊN viết câu lệnh nối chuỗi class động dạng `<div className={`text-${color}-600`} />` trong Tailwind CSS?

A. Vì cú pháp đó bị cấm bởi JavaScript  
B. Vì công cụ quét mã nguồn tĩnh (JIT Compiler) của Tailwind không thể phát hiện và đóng gói các utility class bị cắt nhỏ thành chuỗi, khiến class đó không có hiệu lực trên giao diện  
C. Vì nó làm chậm RAM  
D. Cả B và C  

**Explanation:**  
Tailwind quét mã nguồn theo dạng chuỗi thô. Nếu bạn nối chuỗi `text-${color}-600`, trình biên dịch không thể biết trước giá trị của `color` để đưa class `text-red-600` vào file CSS đóng gói final.

**Answer: B**
