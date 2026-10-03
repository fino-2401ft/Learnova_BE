---
id: styling-ui-m1-l3
course: Styling, CSS Systems & UI Component Libraries
module: CSS Modules và Tailwind
title: Responsive Design & Dark Mode System
order: 3
difficulty: Intermediate
estimatedTime: 240
---
# Responsive Design & Dark Mode System

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Làm chủ tư duy thiết kế ưu tiên thiết bị di động **Mobile-First Responsive Design** trong Tailwind CSS.
- Nắm vững hệ thống Breakpoints chuẩn mực (`sm`, `md`, `lg`, `xl`, `2xl`).
- Xây dựng tính năng **Dark Mode** chuyên nghiệp với chiến lược `class` hoặc `data-theme`.
- Tự động phát hiện chế độ màu mặc định của hệ điều hành (**`prefers-color-scheme`**).
- Tích hợp thư viện **`next-themes`** hoặc custom React Context để quản lý trạng thái Dark Mode không bị giật trang (**Flicker-Free Theme System**).
- Thiết kế Grid Layouts tự động co giãn linh hoạt (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

---

## 📖 Definition

### 1. Tư Duy Mobile-First Responsive Design

Trong thiết kế web hiện đại, quy tắc vàng là: **Hãy viết CSS cho giao diện di động (Mobile) trước tiên, sau đó mới bổ sung các Breakpoints mở rộng cho Tablet và Desktop**.

Trong Tailwind CSS, các tiền tố breakpoint như `md:` hay `lg:` hoạt động theo cơ chế **`min-width` Media Queries**:
- `w-full`: Áp dụng cho MỌI kích thước màn hình (từ 0px trở lên).
- `md:w-1/2`: Áp dụng khi màn hình có độ rộng $\ge 768\text{px}$.
- `lg:w-1/3`: Áp dụng khi màn hình có độ rộng $\ge 1024\text{px}$.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   HỆ THỐNG BREAKPOINTS MOBILE-FIRST TAILWIND           │
└────────────────────────────────────────────────────────────────────────┘

 [ 0px - 639px ] ──────> Default (Mobile)       👉  w-full grid-cols-1
 [ 640px + ] ──────────> sm: (Mobile Large)     👉  sm:grid-cols-2
 [ 768px + ] ──────────> md: (Tablet)           👉  md:px-8
 [ 1024px + ] ─────────> lg: (Laptop/Desktop)   👉  lg:grid-cols-3
 [ 1280px + ] ─────────> xl: (Desktop Large)    👉  xl:max-w-7xl
```

---

## 2. Hệ Thống Dark Mode Chống Giật Màn Hình (Flicker-Free Dark Mode)

Hiện tượng **Flicker (Giật màn hình)** xảy ra khi người dùng đặt chế độ Dark Mode: Trang web tải lên với nền trắng trong 200ms đầu tiên rồi mới giật sang màu đen.

Để khắc phục:
1. Đọc preference từ `localStorage` hoặc hệ điều hành `window.matchMedia('(prefers-color-scheme: dark)')`.
2. Gán class `dark` vào thẻ `<html class="dark">` ngay tại tập tin HTML/Script đầu tiên trước khi cây React Component được mount.

---

## 💻 Syntax

### Dark Mode & Breakpoints Blueprint
```html
<!-- Bật class "dark" trên <html> -->
<html class="dark">
  <body>
    <!-- Text màu đen ở Light Mode, màu trắng ở Dark Mode -->
    <div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 md:p-8">
      Mobile Full, Desktop Half Width
    </div>
  </body>
</html>
```

---

## 📝 Example 1 - Xây Dựng `ThemeProvider` Quản Lý Dark Mode Không Giật Trang (React Context)

```tsx
// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "educonnect-theme"
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    // Xóa tất cả các class theme cũ
    root.classList.remove("light", "dark");

    if (theme === "system") {
      // Tự động đọc chế độ màu của Hệ Điều Hành
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme bắt buộc dùng trong <ThemeProvider>");
  return context;
}
```

---

## 📝 Example 2 - Component Dropdown Chọn Theme (Light, Dark, System)

```tsx
// src/components/ThemeToggleDropdown.tsx
import React from "react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggleDropdown() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
      <button
        onClick={() => setTheme("light")}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          theme === "light"
            ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm"
            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        ☀️ Light
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          theme === "dark"
            ? "bg-slate-900 text-blue-400 shadow-sm"
            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        🌙 Dark
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          theme === "system"
            ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm"
            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        💻 System
      </button>
    </div>
  );
}
```

---

## 📝 Example 3 - Responsive Grid Dashboard Layout Mobile-First Chuyên Nghiệp

```tsx
// src/components/ResponsiveDashboardGrid.tsx
import React from "react";

export function ResponsiveDashboardGrid() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Stat Cards Grid: Mobile 1 cột, Tablet 2 cột, Laptop 4 cột */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "TỔNG HỌC VIÊN", val: "12,450", change: "+12%" },
          { label: "DOANH THU THÁNG", val: "185,000,000 ₫", change: "+8%" },
          { label: "KHÓA HỌC ACTIVE", val: "48", change: "+2" },
          { label: "ĐÁNH GIÁ TRUNG BÌNH", val: "4.9 ★", change: "+0.1" }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2 hover:border-brand-500 transition-colors"
          >
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{stat.label}</p>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stat.val}</span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Main Content Layout: Mobile 1 cột dọc, Desktop 3 cột (2 cột main + 1 cột sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area (Chiếm 2 cột trên Desktop) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[300px]">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Biểu Đồ Tăng Trưởng Doanh Thu</h3>
          <div className="h-48 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 text-sm">
            [ Area Chart Component ]
          </div>
        </div>

        {/* Sidebar Activity Area (Chiếm 1 cột trên Desktop) */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Hoạt Động Mới Nhất</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 text-xs text-slate-600 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                <span>Học viên <strong>Nguyễn Long</strong> vừa đăng ký khóa học React</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Luôn Bật Tiền Tố `dark:` Kèm Theo Thuộc Tính Màu Mặc Định:** Mỗi khi khai báo màu nền hay màu chữ, hãy luôn đi kèm cặp `bg-white dark:bg-slate-900` và `text-slate-900 dark:text-white` để giao diện chuyển đổi mượt mượt ở cả 2 chế độ.

---

## ❌ Common Mistakes

### Sai 1 - Viết Breakpoints theo tư duy Desktop-First
```tsx
// ❌ SAI TƯ DUY TAILWIND: Viết class desktop trước rồi mới đè max-w
// Tailwind mặc định dùng MIN-WIDTH media queries!

// ✅ ĐÚNG CHUẨN TAILWIND MOBILE-FIRST:
// Khai báo kiểu di động trước, mở rộng lên desktop bằng md: và lg:
<div className="w-full md:w-1/2 lg:w-1/3" />
```

---

## 📚 Summary

- **Mobile-First Design** áp dụng quy tắc `min-width`: Viết utility mặc định cho Mobile, mở rộng qua `sm:`, `md:`, `lg:`.
- Bật cờ **Dark Mode** qua class `dark` trên thẻ `<html>`.
- Tự động đồng bộ chế độ màu hệ điều hành bằng **`prefers-color-scheme`**.
- Tạo **Responsive Grids** với `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- Luôn kết hợp cặp màu `light-color dark:dark-color` cho mọi phần tử giao diện.

---

## 📝 Quiz

### Question 1
Cơ chế hoạt động của các tiền tố Breakpoint trong Tailwind CSS (như `md:` hay `lg:`) tuân theo nguyên tắc thiết kế nào?

A. Desktop-First với Max-Width Queries  
B. Mobile-First với Min-Width Queries (Utility mặc định áp dụng cho Mobile, tiền tố `md:` kích hoạt khi màn hình rộng $\ge 768\text{px}$)  
C. Chỉ áp dụng cho màn hình TV  
D. Cả A và C  

**Explanation:**  
Tailwind CSS được thiết kế chuẩn Mobile-First. Các utility không có tiền tố áp dụng cho màn hình nhỏ nhất (Mobile), các tiền tố như `md:` (`@media (min-width: 768px)`) chỉ kích hoạt khi kích thước màn hình đạt đến hoặc vượt qua ngưỡng đó.

**Answer: B**

---

### Question 2
Media query chuẩn của trình duyệt nào được sử dụng để tự động phát hiện xem người dùng đang cài đặt chế độ màu Tối (Dark) hay Sáng (Light) trên Hệ Điều Hành của thiết bị?

A. `@media (dark-mode: true)`  
B. `@media (prefers-color-scheme: dark)`  
C. `@media (system-theme: dark)`  
D. `@media (color-mode: dark)`  

**Explanation:**  
`prefers-color-scheme: dark` là chuẩn CSS Media Query chính thức được tất cả các trình duyệt hỗ trợ để truy vấn chế độ giao diện mặc định của hệ điều hành (macOS, Windows, iOS, Android).

**Answer: B**

---

### Question 3
Cách khai báo cặp class Tailwind CSS nào dưới đây là chuẩn xác để thiết lập một phần tử có nền trắng ở Light Mode và tự động đổi sang nền màu tối Slate-900 ở Dark Mode?

A. `bg-white bg-dark-slate-900`  
B. `bg-white dark:bg-slate-900`  
C. `bg-light-white bg-dark-900`  
D. `theme-white-dark`  

**Explanation:**  
Trong Tailwind CSS, tiền tố `dark:` được sử dụng để kích hoạt các utility class khi cờ Dark Mode được bật trên cây DOM (ví dụ `bg-white dark:bg-slate-900`).

**Answer: B**
