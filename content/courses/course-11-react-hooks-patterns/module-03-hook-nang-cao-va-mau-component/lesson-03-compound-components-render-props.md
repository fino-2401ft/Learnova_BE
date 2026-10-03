---
id: react-hooks-patterns-m3-l3
course: React Hooks & Patterns Nâng Cao
module: Hook nâng cao và mẫu component
title: Advanced Component Patterns: Compound Components, Render Props & HOC
order: 3
difficulty: Advanced
estimatedTime: 240
---
# Advanced Component Patterns: Compound Components, Render Props & HOC

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu và ứng dụng Pattern **Compound Components** để xây dựng các UI Components có cấu trúc linh hoạt (như Tabs, Accordion, Select, Menu).
- Nắm vững Pattern **Render Props** để chia sẻ logic giao diện giữa các Components.
- Phân tích và xây dựng **Higher-Order Components (HOC)**.
- Phân biệt ưu nhược điểm của từng Pattern thiết kế Component nâng cao.
- Xây dựng thư viện Component chuẩn mực thương mại (Component Library Design).

---

## 📖 Definition

### 1. Compound Components Pattern (Thành phần hợp thành)
Compound Components là pattern nơi một nhóm các Component làm việc cùng nhau để quản lý một trạng thái chung mà người dùng không cần truyền props lồng nhau rườm rà.

Ví dụ tiêu chuẩn trong HTML: Thẻ `<select>` và `<option>`. Thẻ `<option>` tự động biết giá trị được chọn từ `<select>` cha mà bạn không cần viết `<option selected={value === 'A'}>`.

Trong React, Compound Components kết hợp **React Context** để chia sẻ ngầm trạng thái giữa Component cha (`Accordion`) và các Component con (`Accordion.Item`, `Accordion.Header`, `Accordion.Body`).

### 2. Render Props Pattern
Render Props là kỹ thuật chia sẻ mã nguồn bằng cách truyền một **hàm trả về JSX** qua Props: `<DataFetcher render={(data) => <UI data={data} />} />`.

### 3. Higher-Order Components (HOC)
HOC là một hàm nhận vào một Component và trả về một Component mới đã được nâng cấp thêm tính năng (như `withAuth(MyComponent)`).

---

## 💻 Syntax

### Compound Components Pattern Setup
```jsx
import { createContext, useContext, useState } from "react";

const ToggleContext = createContext(null);

export function Toggle({ children }) {
  const [on, setOn] = useState(false);
  const toggle = () => setOn(o => !o);

  return (
    <ToggleContext.Provider value={{ on, toggle }}>
      {children}
    </ToggleContext.Provider>
  );
}

// Sub-components
Toggle.On = function ToggleOn({ children }) {
  const { on } = useContext(ToggleContext);
  return on ? children : null;
};

Toggle.Button = function ToggleButton() {
  const { toggle } = useContext(ToggleContext);
  return <button onClick={toggle}>Switch</button>;
};
```

---

## 📝 Example 1 - Xây dựng Accordion Component chuẩn Compound Components

```jsx
// src/components/Accordion.jsx
import { createContext, useContext, useState } from "react";

const AccordionContext = createContext(null);

export function Accordion({ children }) {
  const [openId, setOpenId] = useState(null);
  const toggleItem = (id) => setOpenId(current => current === id ? null : id);

  return (
    <AccordionContext.Provider value={{ openId, toggleItem }}>
      <div className="accordion-wrapper">{children}</div>
    </AccordionContext.Provider>
  );
}

Accordion.Item = function AccordionItem({ id, children }) {
  return <div className="accordion-item" data-id={id}>{children}</div>;
};

Accordion.Header = function AccordionHeader({ id, children }) {
  const { toggleItem } = useContext(AccordionContext);
  return (
    <div className="accordion-header" onClick={() => toggleItem(id)} style={{ cursor: "pointer", fontWeight: "bold" }}>
      {children}
    </div>
  );
};

Accordion.Body = function AccordionBody({ id, children }) {
  const { openId } = useContext(AccordionContext);
  if (openId !== id) return null;
  return <div className="accordion-body" style={{ padding: "10px", background: "#f1f5f9" }}>{children}</div>;
};

// Sử dụng linh hoạt trong App
export function FAQPage() {
  return (
    <Accordion>
      <Accordion.Item id="q1">
        <Accordion.Header id="q1">Khóa học kéo dài bao lâu?</Accordion.Header>
        <Accordion.Body id="q1">Khóa học kéo dài 3 tháng với lộ trình 80 bài học.</Accordion.Body>
      </Accordion.Item>

      <Accordion.Item id="q2">
        <Accordion.Header id="q2">Tôi có được cấp chứng chỉ không?</Accordion.Header>
        <Accordion.Body id="q2">Có, bạn sẽ được cấp chứng chỉ khi hoàn thành bài test cuối khóa.</Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
```

---

## 📝 Example 2 - Render Props Pattern cho Mouse Tracker Component

```jsx
import { useState } from "react";

// Component chịu trách nhiệm theo dõi vị trí chuột
export function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div style={{ height: "200px", border: "1px solid #ccc" }} onMouseMove={handleMouseMove}>
      {/* Gọi hàm render prop và truyền dữ liệu position ra ngoài */}
      {render(position)}
    </div>
  );
}

// Sử dụng Render Props
export function AppApp() {
  return (
    <MouseTracker 
      render={({ x, y }) => (
        <h3>Vị trí con trỏ chuột hiện tại: X = {x}, Y = {y}</h3>
      )} 
    />
  );
}
```

---

## 📝 Example 3 - Higher-Order Component (HOC) `withAuth` bảo vệ Component

```jsx
import { useAuth } from "../hooks/useAuth";

// HOC nâng cấp Component với tính năng kiểm tra Auth
export function withAuth(ComponentToProtect) {
  return function ProtectedComponentProps(props) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
      return <div className="error">🔒 Bạn phải đăng nhập để xem nội dung này!</div>;
    }

    return <ComponentToProtect {...props} />;
  };
}

// Component thường
function UserDashboard() {
  return <div>Nội dung riêng tư của Dashboard</div>;
}

// Bọc Component bằng HOC
export const ProtectedDashboard = withAuth(UserDashboard);
```

---

## ⚠️ Notes

1. **Custom Hooks đã thay thế phần lớn HOC và Render Props:** Trong React hiện đại, Custom Hooks là cách được ưu tiên hàng đầu để tái sử dụng logic. Tuy nhiên, Compound Components Pattern vẫn là chuẩn mực vàng khi xây dựng các UI Component Library (như Radix UI, Headless UI, Shadcn UI).

---

## ❌ Common Mistakes

### Sai 1 - Viết Compound Components nhưng quên export các sub-components
```jsx
// ❌ Quên gắn sub-components vào Component chính
export function Tabs() {}
// Quên: Tabs.Item = ...
```

---

## 📚 Summary

- **Compound Components** kết hợp Context API cho phép tạo nhóm Component giao diện linh hoạt (như `<Tabs.Item>`).
- **Render Props** truyền hàm trả về JSX để chia sẻ logic giao diện.
- **HOC** nhận vào Component và trả về Component mới đã được nâng cấp tính năng.

---

## 📝 Quiz

### Question 1
Pattern thiết kế Component nào cho phép một nhóm các Component con (như `<Select.Option>`) tự động chia sẻ trạng thái ngầm từ Component cha mà không cần người dùng truyền props thủ công?

A. Render Props Pattern  
B. Compound Components Pattern  
C. Higher-Order Component Pattern  
D. Singleton Pattern  

**Answer: B**

---

### Question 2
Đặc điểm nhận biết của Render Props Pattern là gì?

A. Truyền một hàm trả về JSX qua Props của Component  
B. Sử dụng `useEffect` trong vòng lặp  
C. Đổi tên file thành `.ts`  
D. Dùng `document.querySelector`  

**Answer: A**

---

### Question 3
Higher-Order Component (HOC) trong React là gì?

A. Một Component dạng Class  
B. Một hàm nhận vào một Component và trả về một Component mới được bổ sung thêm tính năng  
C. Một sự kiện DOM  
D. Một thuộc tính CSS  

**Answer: B**
