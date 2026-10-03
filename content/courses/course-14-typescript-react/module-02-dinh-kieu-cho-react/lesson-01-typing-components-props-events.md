---
id: typescript-react-m2-l1
course: TypeScript for React Developers
module: Định kiểu cho React
title: Typing React Components, Props & Events
order: 1
difficulty: Intermediate
estimatedTime: 240
---
# Typing React Components, Props & Events

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Khai báo kiểu cho React Components và Props chuẩn mực (dùng `FC` vs Function Declaration thuần).
- Khai báo thuộc tính con **`children`** với `React.ReactNode` và `React.ReactElement`.
- Định kiểu chính xác cho các sự kiện trình duyệt phổ biến: **`React.MouseEvent`**, **`React.ChangeEvent`**, và **`React.FormEvent`**.
- Mở rộng các thuộc tính HTML mặc định của thẻ chuẩn bằng **`React.ComponentPropsWithoutRef<'button'>`**.
- Định kiểu cho **`React.CSSProperties`** khi truyền Inline Styles.
- Khai báo kiều cho các Component có Props đa hình (**Polymorphic Components**).

---

## 📖 Definition

### 1. Phân Biên: `React.FC` vs Function Declarations

Trong các phiên bản React cũ, lập trình viên thường dùng `React.FC<Props>` (hoặc `React.FunctionComponent`). 

Tuy nhiên, trong các dự án React hiện đại, cộng đồng ưu tiên **Function Declarations thuần kèm type Props**:

```typescript
// ❌ CÁCH CŨ (React.FC): Tự động gộp children ngầm định trong các bản React cũ, gây khó kiểm soát
export const Button: React.FC<ButtonProps> = ({ title }) => { ... };

// ✅ ĐÚNG CHUẨN HIỆN ĐẠI: Rõ ràng, dễ đọc, hỗ trợ Generics mượt mà hơn
export function Button({ title, children }: ButtonProps) { ... }
```

---

## 2. Phân Biên `React.ReactNode` vs `React.ReactElement`

Khi khai báo kiểu cho thuộc tính `children`:
- **`React.ReactNode` (Rộng nhất - KHUYÊN DÙNG):** Chấp nhận mọi thứ mà React có thể render ra DOM: Chữ (`string`), Số (`number`), Khối JSX (`ReactElement`), Mảng JSX (`ReactNode[]`), `null`, `undefined`, hoặc `boolean`.
- **`React.ReactElement` (Hẹp hơn):** Chỉ chấp nhận duy nhất một phần tử JSX thực sự (ví dụ `<div />`), không chấp nhận chuỗi text hay số thuần.

---

## 3. Định Kiểu Sự Kiện Trình Duyệt (Event Handlers)

Để có autocompletion và kiểm tra kiểu an toàn cho các hàm sự kiện:

| Sự kiện HTML | Kiểu Sự Kiện Trong React | Kiểu Phần Tử HTML (`event.target`) |
|---|---|---|
| Click nút / link | `React.MouseEvent<HTMLButtonElement>` | `HTMLButtonElement` |
| Gõ phím ô input | `React.ChangeEvent<HTMLInputElement>` | `HTMLInputElement` |
| Thay đổi ô select | `React.ChangeEvent<HTMLSelectElement>` | `HTMLSelectElement` |
| Submit Form | `React.FormEvent<HTMLFormElement>` | `HTMLFormElement` |
| Di chuyển chuột | `React.PointerEvent<HTMLDivElement>` | `HTMLDivElement` |

---

## 💻 Syntax

### Component Props & Events Blueprint
```typescript
import React from "react";

interface CustomInputProps extends React.ComponentPropsWithoutRef<"input"> {
  label: string;
  errorMessage?: string;
}

export function CustomInput({ label, errorMessage, ...inputProps }: CustomInputProps) {
  return (
    <div>
      <label>{label}</label>
      <input {...inputProps} />
      {errorMessage && <span>{errorMessage}</span>}
    </div>
  );
}
```

---

## 📝 Example 1 - Xây Dựng Component Nút Bấm (Button) Kế Thừa Thuộc Tính HTML Chuẩn Với `ComponentPropsWithoutRef`

```tsx
// src/components/ui/Button.tsx
import React from "react";

// Mở rộng toàn bộ thuộc tính mặc định của thẻ <button> HTML (disabled, onClick, type, className...)
export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  children,
  className = "",
  disabled,
  ...restProps
}: ButtonProps) {
  // Base classes
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Variant classes
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-slate-800 hover:bg-slate-900 text-white focus:ring-slate-700",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-blue-500"
  };

  // Size classes
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className} ${(disabled || isLoading) ? "opacity-50 cursor-not-allowed" : ""}`}
      {...restProps}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        leftIcon && <span className="mr-2">{leftIcon}</span>
      )}
      {children}
    </button>
  );
}
```

---

## 📝 Example 2 - Định Kiểu Chi Tiết Cho Form Handlers VÀ Inline Styles

```tsx
// src/components/ContactForm.tsx
import React, { useState } from "react";

export function ContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  // 1. Handler cho sự kiện Change của ô Input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Handler cho sự kiện Submit của Form
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submit Form thành công:", formData);
  };

  // 3. Định kiểu cho Inline CSS Properties
  const containerStyle: React.CSSProperties = {
    maxWidth: "500px",
    margin: "0 auto",
    padding: "24px"
  };

  return (
    <form onSubmit={handleFormSubmit} style={containerStyle} className="bg-white rounded-2xl border shadow-sm space-y-4">
      <h2 className="text-xl font-bold">Liên Hệ Hỗ Trợ</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Họ tên:</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full border p-2 rounded text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full border p-2 rounded text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Lời nhắn:</label>
        <textarea
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleInputChange}
          className="w-full border p-2 rounded text-sm"
        />
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium">
        Gửi Liên Hệ
      </button>
    </form>
  );
}
```

---

## 📝 Example 3 - Xây Dựng Polymorphic Component (Component Đa Hình Thuộc Tính `as`)

```tsx
// src/components/Text.tsx
import React from "react";

type TextOwnProps<E extends React.ElementType> = {
  as?: E;
  children: React.ReactNode;
  className?: string;
};

// Kết hợp Props riêng của Text với Props mặc định của thẻ HTML được chọn
type TextProps<E extends React.ElementType> = TextOwnProps<E> &
  Omit<React.ComponentPropsWithoutRef<E>, keyof TextOwnProps<E>>;

// Component đa hình: Có thể render thành <h1>, <p>, <span> hoặc <a> tùy thuộc thuộc tính `as`
export function Text<E extends React.ElementType = "span">({
  as,
  children,
  className = "",
  ...restProps
}: TextProps<E>) {
  const Component = as || "span";
  return (
    <Component className={className} {...restProps}>
      {children}
    </Component>
  );
}

// 💡 CÁCH SỬ DỤNG CHUẨN TYPESCRIPT:
// <Text as="h1" className="text-3xl font-bold">Tiêu đề H1</Text>
// <Text as="a" href="https://google.com" target="_blank">Đường link</Text>
```

---

## ⚠️ Notes

1. **Sử Dụng `React.ComponentPropsWithoutRef<'element'>` Mở Rộng HTML Props:** Thay vì phải tự viết lại các thuộc tính `disabled`, `onClick`, `className`, `style`... Hãy luôn kế thừa từ `React.ComponentPropsWithoutRef<'button'>` để nhận 100% thuộc tính HTML chuẩn.

---

## ❌ Common Mistakes

### Sai 1 - Định kiểu sự kiện inline sai với `any`
```tsx
// ❌ SAI: Dùng (e: any) làm mất tính an toàn và gợi ý thuộc tính của e.target!
<input onChange={(e: any) => console.log(e.target.value)} />

// ✅ ĐÚNG CHUẨN TYPESCRIPT:
<input onChange={(e: React.ChangeEvent<HTMLInputElement>) => console.log(e.target.value)} />
```

---

## 📚 Summary

- Dùng **Function Declarations thuần kèm Interface Props** thay cho `React.FC`.
- Dùng **`React.ReactNode`** làm kiểu dữ liệu chuẩn cho thuộc tính `children`.
- Định kiểu chính xác sự kiện: **`React.MouseEvent`**, **`React.ChangeEvent`**, và **`React.FormEvent`**.
- Mở rộng thuộc tính thẻ HTML bằng **`React.ComponentPropsWithoutRef<'tag'>`**.
- Định kiểu Inline Style bằng **`React.CSSProperties`**.

---

## 📝 Quiz

### Question 1
Kiểu dữ liệu nào trong React TypeScript là lựa chọn khuyên dùng rộng rãi và chuẩn xác nhất cho thuộc tính `children` của một Component?

A. `React.ReactElement`  
B. `React.ReactNode`  
C. `JSX.Element`  
D. `string`  

**Explanation:**  
`React.ReactNode` bao gồm tất cả những gì React có thể render ra màn hình: Chuỗi, Số, JSX Element, Mảng các Node, `null`, hoặc `undefined`, làm cho nó trở thành kiểu dữ liệu chuẩn và linh hoạt nhất cho `children`.

**Answer: B**

---

### Question 2
Để mở rộng toàn bộ các thuộc tính mặc định của thẻ HTML `<button>` (như `disabled`, `onClick`, `type`, `tabIndex`) cho một Custom Button Component mà không cần viết lại thuộc tính thủ công, bạn nên kế thừa từ kiểu nào?

A. `React.ButtonHTMLAttributes`  
B. `React.ComponentPropsWithoutRef<'button'>`  
C. `HTMLButtonElement`  
D. `React.ElementProps<'button'>`  

**Explanation:**  
`React.ComponentPropsWithoutRef<'button'>` trả về một đối tượng chứa toàn bộ các thuộc tính HTML chuẩn của thẻ `<button>` mà không bao gồm `ref`, giúp bạn dễ dàng kết hợp và mở rộng bằng toán tử `&`.

**Answer: B**

---

### Question 3
Kiểu sự kiện nào được sử dụng để định kiểu cho tham số `e` trong hàm xử lý sự kiện nộp Form `onSubmit={(e) => ...}`?

A. `React.MouseEvent<HTMLFormElement>`  
B. `React.FormEvent<HTMLFormElement>`  
C. `React.SubmitEvent<HTMLFormElement>`  
D. `React.ChangeEvent<HTMLFormElement>`  

**Explanation:**  
Trong React, sự kiện submit Form có kiểu chuẩn là `React.FormEvent<HTMLFormElement>`, cung cấp sẵn hàm `e.preventDefault()` có gợi ý Intellisense chuẩn xác.

**Answer: B**
