---
id: styling-ui-m3-l3
course: Styling, CSS Systems & UI Component Libraries
module: Design system và khả năng tiếp cận
title: Styled Components & Emotion (CSS-in-JS)
order: 3
difficulty: Advanced
estimatedTime: 240
---
# Styled Components & Emotion (CSS-in-JS)

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích bản chất và mô hình hoạt động của kiến trúc **CSS-in-JS** (`styled-components` và `@emotion/react`).
- Tạo các Styled Components bằng cú pháp chuỗi mẫu **Tagged Template Literals**.
- Truyền và xử lý **Dynamic Props** trực tiếp bên trong CSS blocks.
- Khai báo và tiêu thụ đối tượng **ThemeContext với `<ThemeProvider>`**.
- Phân tích các ưu nhược điểm về hiệu năng của CSS-in-JS (Runtime overhead vs Build-time zero-runtime CSS).
- Refactor chuyển đổi linh hoạt giữa CSS-in-JS và Tailwind CSS.

---

## 📖 Definition

### 1. Bản Chất Của Architecture CSS-in-JS

Trong kiến trúc **CSS-in-JS**, mã CSS không còn nằm ở các file `.css` độc lập nữa mà được viết trực tiếp bên trong các tập tin mã nguồn JavaScript/TypeScript.

Thư viện **Styled Components** sử dụng cú pháp **Tagged Template Literals** (`styled.button` ``` ... ```):
- Tại thời điểm React Component render, Styled Components sẽ tự động sinh ra một tên class băm ngầm định (như `.sc-bdVaJa`).
- Tự động chèn một thẻ `<style>` chứa các thuộc tính CSS vào đầu phần tử `<head>` của trang DOM.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   LUỒNG HOẠT ĐỘNG CỦA CSS-IN-JS RUNTIME                 │
└────────────────────────────────────────────────────────────────────────┘

 [ Component Render với Dynamic Props ] ───> 1. Tính toán giá trị CSS bằng JS
                                                      │
                                                      ▼
 [ Thẻ DOM nhận Class mới ] <── 3. Chèn class vào <head> ── 2. Sinh Hash Class độc nhất
```

---

## 2. Ưu Nhược Điểm Về Mặt Hiệu Năng Của CSS-in-JS

- **Ưu điểm:**
  - **Dynamic Props Styling Cực Mạnh:** Dễ dàng thay đổi thuộc tính CSS dựa trên Props (`background: ${props => props.active ? 'blue' : 'gray'}`).
  - Tự động dọn dẹp CSS không sử dụng (Zero Dead Code).
  - Định kiểu đóng gói tuyệt đối theo từng Component.
- **Nhược điểm (Runtime Overhead):**
  - Vì CSS được tính toán và chèn vào DOM ở thời điểm **Runtime** (khi React đang render), với các cây Component có hàng nghìn phần tử biến đổi liên tục, CSS-in-JS sẽ tốn CPU và làm giảm chỉ số hiệu năng (Core Web Vitals).
  - Không tương thích mượt mượt với React 18 / 19 Server Components.

---

## 💻 Syntax

### Styled Components Basic Blueprint
```tsx
import styled from "styled-components";

interface ButtonProps {
  $variant?: "primary" | "danger";
}

// Định nghĩa Styled Component với Props động
export const StyledButton = styled.button<ButtonProps>`
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  
  background-color: ${(props) => (props.$variant === "danger" ? "#dc2626" : "#2563eb")};
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;
```

---

## 📝 Example 1 - Xây Dựng Hệ Thống Component Giao Diện Với Styled Components & ThemeProvider

```tsx
// src/components/StyledSystemDemo.tsx
import React, { useState } from "react";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";

// 1. Định nghĩa Kiểu cho Theme
export interface AppTheme {
  colors: {
    background: string;
    text: string;
    primary: string;
    border: string;
  };
  radii: {
    card: string;
  };
}

const lightTheme: AppTheme = {
  colors: {
    background: "#ffffff",
    text: "#0f172a",
    primary: "#2563eb",
    border: "#e2e8f0"
  },
  radii: { card: "16px" }
};

const darkTheme: AppTheme = {
  colors: {
    background: "#0f172a",
    text: "#f8fafc",
    primary: "#3b82f6",
    border: "#334155"
  },
  radii: { card: "16px" }
};

// 2. Global Styles
const GlobalStyle = createGlobalStyle<{ theme: AppTheme }>`
  body {
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text};
    font-family: 'Inter', sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
  }
`;

// 3. Styled Container với Transient Props ($isFeatured)
const CardContainer = styled.div<{ $isFeatured?: boolean }>`
  background-color: ${(props) => props.theme.colors.background};
  border: 2px solid ${(props) => (props.$isFeatured ? props.theme.colors.primary : props.theme.colors.border)};
  border-radius: ${(props) => props.theme.radii.card};
  padding: 24px;
  box-shadow: ${(props) => (props.$isFeatured ? "0 10px 25px -5px rgba(37, 99, 235, 0.2)" : "0 2px 4px rgba(0,0,0,0.05)")};
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-4px);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: ${(props) => props.theme.colors.text};
`;

export function StyledSystemDemo() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <GlobalStyle />
      <div className="p-8 max-w-md mx-auto space-y-6">
        <button
          onClick={() => setIsDark(!isDark)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold"
        >
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        <CardContainer $isFeatured={true}>
          <CardTitle>Khóa Học React Masterclass</CardTitle>
          <p className="text-sm opacity-80">
            Lộ trình học Styled Components & CSS-in-JS chuyên sâu cho Frontend Developer.
          </p>
        </CardContainer>
      </div>
    </ThemeProvider>
  );
}
```

---

## 📝 Example 2 - Cú Pháp `@emotion/react` Với `css` Prop Linh Hoạt

```tsx
// src/components/EmotionDemo.tsx
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";

const cardStyle = (isDanger: boolean) => css`
  padding: 20px;
  border-radius: 12px;
  background-color: ${isDanger ? "#fef2f2" : "#f0f9ff"};
  border: 1px solid ${isDanger ? "#fca5a5" : "#bae6fd"};
  color: ${isDanger ? "#991b1b" : "#075985"};
  font-weight: 500;

  &:hover {
    filter: brightness(0.95);
  }
`;

export function EmotionDemo({ isDanger }: { isDanger: boolean }) {
  return (
    <div css={cardStyle(isDanger)}>
      Thông báo được định kiểu linh hoạt qua Emotion css prop!
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Sử Dụng Transient Props Với Tiền Tố `$` Trong Styled Components:** Khi truyền props riêng dành cho việc định kiểu CSS vào Styled Component (như `$isFeatured`), hãy luôn thêm tiền tố `$` (Transient Props). Việc này thông báo cho Styled Components **KHÔNG ĐỰỢC PHÉP ĐẨY PROP NÀY VÀO THẺ DOM HTML THỰC TẾ**, tránh bị cảnh báo lỗi trình duyệt "Unknown DOM attribute".

---

## ❌ Common Mistakes

### Sai 1 - Khai báo Styled Component bên trong thân một Component khác
```tsx
// ❌ SAI TAI HẠI: Styled Component bị tạo lại MỖI LẦN OuterComponent render -> Mất Focus ô input và tốn CPU kinh khủng!
function OuterComponent() {
  const InnerStyledInput = styled.input` padding: 8px; `; 
  return <InnerStyledInput />;
}

// ✅ ĐÚNG CHUẨN: Khai báo Styled Component bên NGOÀI thân Component
const InnerStyledInput = styled.input` padding: 8px; `;
function OuterComponent() {
  return <InnerStyledInput />;
}
```

---

## 📚 Summary

- **CSS-in-JS** (`styled-components`, `@emotion/react`) cho phép viết mã CSS trực tiếp trong các file JavaScript/TypeScript.
- Dùng **Tagged Template Literals** (`styled.div` ```...```) để tạo Styled Components.
- Dùng **Transient Props (`$propName`)** để truyền dữ liệu động vào CSS mà không lộ ra thẻ DOM HTML.
- **`<ThemeProvider>`** cung cấp dữ liệu theme toàn cục qua React Context.
- Lưu ý nhược điểm **Runtime Overhead** của CSS-in-JS trên các ứng dụng quy mô lớn.

---

## 📝 Quiz

### Question 1
Mục đích cốt lõi của việc thêm tiền tố `$` vào tên của một thuộc tính (Transient Props như `$isFeatured`) khi truyền vào Styled Component là gì?

A. Để mã hóa thuộc tính  
B. Thông báo cho thư viện Styled Components biết prop này chỉ dùng để tính toán CSS và KHÔNG ĐƯỢC PHÉP ghi thuộc tính đó vào thẻ DOM HTML thực tế, tránh lỗi trình duyệt  
C. Để tăng tốc độ mạng  
D. Cả A và C  

**Explanation:**  
Transient Props (bắt đầu bằng dấu `$`) không được truyền xuống phần tử DOM bên dưới. Nếu không có dấu `$`, prop như `isFeatured` sẽ bị ghi vào HTML `<div isfeatured="true">` và gây cảnh báo lỗi "React does not recognize the prop on a DOM element".

**Answer: B**

---

### Question 2
Hậu quả nghiêm trọng về mặt hiệu năng sẽ xảy ra nếu bạn vô tình định nghĩa một Styled Component bên trong thân của một React Component khác là gì?

A. Không có ảnh hưởng gì  
B. Styled Component sẽ bị khởi tạo lại ở MỌI LẦN Component cha render, làm mất focus của ô nhập liệu và tốn tài nguyên CPU xử lý lại CSS ở runtime  
C. Trình duyệt tự động tắt  
D. Cả A và C  

**Explanation:**  
Khi định nghĩa Styled Component bên trong thân một hàm Component, mỗi khi Component cha re-render, một class Styled Component hoàn toàn mới sẽ được tạo ra, buộc React phải unmount và mount lại DOM element đó, làm đơ ứng dụng và mất focus ô input.

**Answer: B**

---

### Question 3
Nhược điểm lớn nhất về mặt hiệu năng của kiến trúc CSS-in-JS (như Styled Components) so với các giải pháp Utility-First như Tailwind CSS hay CSS Modules là gì?

A. Không viết được màu đỏ  
B. Chi phí xử lý Runtime Overhead: CSS phải được tính toán, sinh tên class hash và chèn thẻ `<style>` vào DOM bằng JavaScript ngay tại thời điểm trình duyệt đang render  
C. Không hỗ trợ React  
D. Cả A và C  

**Explanation:**  
CSS-in-JS thực thi việc parse và chèn CSS vào DOM ngay ở thời điểm Runtime. Với các cây DOM lớn hoặc các hiệu ứng thay đổi liên tục, việc này gây ra Runtime Overhead tốn CPU và không tương thích tối ưu với React Server Components.

**Answer: B**
