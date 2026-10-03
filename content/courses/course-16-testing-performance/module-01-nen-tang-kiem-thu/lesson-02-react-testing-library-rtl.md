---
id: testing-performance-m1-l2
course: Testing, Quality Assurance & Performance Optimization
module: Nền tảng kiểm thử
title: React Testing Library (RTL) & Component Testing
order: 2
difficulty: Intermediate
estimatedTime: 240
---
# React Testing Library (RTL) & Component Testing

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích triết lý kiểm thử lấy người dùng làm trung tâm **(User-Centric Testing Philosophy)** của **React Testing Library (RTL)**.
- Sử dụng hàm `render()` để render Component vào môi trường DOM giả lập (`jsdom`).
- Làm chủ thứ tự ưu tiên của các **Query Methods (`getByRole` > `getByLabelText` > `getByText` > `getByTestId`)**.
- Giả lập hành động tương tác bàn phím và chuột thực tế với thư viện **`@testing-library/user-event`**.
- Xử lý các tác vụ bất đồng bộ với **`findBy*`** và **`waitFor()`**.
- Áp dụng các **Jest-DOM Matchers** (`toBeInTheDocument`, `toHaveValue`, `toBeDisabled`).

---

## 📖 Definition

### 1. Triết Lý Kiểm Thử "User-Centric" Của React Testing Library

Một trong những tư duy sai lầm trước đây khi test React Component (với Enzyme) là kiểm thử chi tiết thực thi bên trong (Implementation Details) như: *Component này có state tên là `count === 1` không?* Hay *Hàm `handleClick` có được gọi không?*

**React Testing Library (RTL)** ra đời với triết lý cốt lõi:
> *"The more your tests resemble the way your software is used, the more confidence they can give you."*  
> *(Bài test càng giống với cách người dùng thực tế sử dụng phần mềm, nó càng mang lại sự tin cậy cao hơn.)*

Người dùng thật không hề quan tâm state của bạn tên là gì hay Component có tên class là gì. Người dùng chỉ quan tâm:
1. Họ có nhìn thấy nút có chữ "Đăng Nhập" trên màn hình không?
2. Khi họ gõ email và bấm nút, giao diện có hiển thị dòng chữ "Xin chào" không?

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   TRIẾT LÝ KIỂM THỬ USER-CENTRIC CỦA RTL               │
└────────────────────────────────────────────────────────────────────────┘

 ❌ SAI (Implementation Details): Check state count === 1, check internal prop
 
 ✅ ĐÚNG (User-Centric RTL):     Query theo ARIA Role / Text ➔ Bấm nút ➔ Expect thấy Text mới!
```

---

## 2. Bảng Thứ Tự Ưu Tiên Các Query Methods Trong RTL

RTL cung cấp 3 họ Query chính: `getBy*` (tìm thấy ngay), `queryBy*` (tìm thấy hoặc trả về `null`), `findBy*` (chờ đợi async):

| Thứ tự Ưu tiên | Hàm Query | Lý do Khuyên dùng |
|---|---|---|
| **1 (ƯU TIÊN 1)** | `getByRole('button', { name: /đăng nhập/i })` | Giống 100% cách Trình đọc Màn hình và Người dùng thật định vị nút |
| **2** | `getByLabelText('Email:')` | Rất tốt cho các ô Form Inputs |
| **3** | `getByPlaceholderText('...')` | Dùng khi không có Label |
| **4** | `getByText('Xin chào')` | Dùng cho các đoạn văn bản hiển thị |
| **5 (CUỐI CÙNG)** | `getByTestId('submit-btn')` | Chỉ dùng khi phần tử không có Role/Text rõ ràng |

---

## 💻 Syntax

### User Event & RTL Render Blueprint
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "./MyComponent";

test("nên hiển thị thông báo khi bấm nút", async () => {
  // 1. Khởi tạo User Event Session
  const user = userEvent.setup();
  
  // 2. Render Component
  render(<MyComponent />);

  // 3. Giả lập người dùng click nút
  const button = screen.getByRole("button", { name: /kích hoạt/i });
  await user.click(button);

  // 4. Khẳng định kết quả hiển thị trên DOM
  expect(screen.getByText(/thành công/i)).toBeInTheDocument();
});
```

---

## 📝 Example 1 - Component Counter Đơn Giản Và Bài Test Tương Tác Nút Bấm

```tsx
// src/components/Counter.tsx
import React, { useState } from "react";

export function Counter({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);

  return (
    <div className="p-4 border rounded-xl max-w-xs text-center space-y-3">
      <h2 className="text-xl font-bold">Bộ Đếm: <span data-testid="count-value">{count}</span></h2>
      <div className="space-x-2">
        <button
          onClick={() => setCount((c) => c - 1)}
          className="px-3 py-1 bg-red-500 text-white rounded font-bold"
        >
          - Giảm
        </button>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-3 py-1 bg-blue-500 text-white rounded font-bold"
        >
          + Tăng
        </button>
      </div>
    </div>
  );
}
```

```tsx
// src/components/Counter.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Counter } from "./Counter";

describe("Integration Test: Counter Component", () => {
  it("nên hiển thị giá trị khởi tạo ban đầu", () => {
    // Render với initialCount = 5
    render(<Counter initialCount={5} />);

    // Kiểm tra text "Bộ Đếm: 5" xuất hiện trên DOM
    expect(screen.getByText(/Bộ Đếm:/i)).toBeInTheDocument();
    expect(screen.getByTestId("count-value")).toHaveTextContent("5");
  });

  it("nên tăng giá trị khi người dùng click vào nút '+ Tăng'", async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={0} />);

    // Tìm nút "+ Tăng" bằng getByRole
    const incrementBtn = screen.getByRole("button", { name: /\+ tăng/i });

    // Giả lập click nút
    await user.click(incrementBtn);

    // Khẳng định giá trị tăng lên 1
    expect(screen.getByTestId("count-value")).toHaveTextContent("1");
  });
});
```

---

## 📝 Example 2 - Test Form Đăng Nhập Với Giả Lập Gõ Phím `user.type()` Và Xử Lý Lỗi

```tsx
// src/components/LoginForm.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { LoginForm } from "./LoginForm"; // Component nhận prop onSubmit(email, password)

describe("Integration Test: LoginForm Component", () => {
  it("nên hiển thị lỗi validation khi submit form rỗng", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<LoginForm onSubmit={mockOnSubmit} />);

    // Bấm nút Đăng nhập khi chưa nhập gì
    const submitBtn = screen.getByRole("button", { name: /đăng nhập/i });
    await user.click(submitBtn);

    // Khẳng định câu thông báo lỗi xuất hiện trên DOM
    expect(screen.getByText(/email không được để trống/i)).toBeInTheDocument();
    // Khẳng định hàm mockOnSubmit KHÔNG được gọi
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("nên gửi thông tin email và password hợp lệ khi submit", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();

    render(<LoginForm onSubmit={mockOnSubmit} />);

    // Tìm các ô input bằng label text
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mật khẩu/i);
    const submitBtn = screen.getByRole("button", { name: /đăng nhập/i });

    // Giả lập người dùng gõ phím thực tế
    await user.type(emailInput, "long@educonnect.vn");
    await user.type(passwordInput, "123456");

    // Click submit
    await user.click(submitBtn);

    // Khẳng định mockOnSubmit được gọi với đúng tham số
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith("long@educonnect.vn", "123456");
  });
});
```

---

## 📝 Example 3 - Test Component Bất Đồng Bộ (Async Data Fetching) Với `findBy*` Và `waitFor`

```tsx
// src/components/AsyncUserList.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AsyncUserList } from "./AsyncUserList";

describe("Async Component Test: AsyncUserList", () => {
  it("nên hiển thị màn hình Loading rồi mới hiển thị danh sách người dùng", async () => {
    render(<AsyncUserList />);

    // 1. Kiểm tra màn hình Loading xuất hiện ngay lập tức (getByText)
    expect(screen.getByText(/đang tải dữ liệu/i)).toBeInTheDocument();

    // 2. Dùng findByRole để CHỜ ĐỜI (Async Wait) dữ liệu nạp xong và xuất hiện trên DOM
    // findBy* tự động retry trong 1000ms cho đến khi tìm thấy!
    const userItem = await screen.findByText(/nguyễn long/i);
    expect(userItem).toBeInTheDocument();

    // 3. Khẳng định màn hình Loading đã biến mất (dùng queryByText)
    expect(screen.queryByText(/đang tải dữ liệu/i)).not.toBeInTheDocument();
  });
});
```

---

## ⚠️ Notes

1. **Khác biệt `getBy*` vs `queryBy*` vs `findBy*`:**
   - **`getByText`**: Tìm ngay lập tức. Nếu KHÔNG tìm thấy ➔ Ném lỗi crash test (Dùng để khẳng định phần tử CHẮC CHẮN tồn tại).
   - **`queryByText`**: Tìm ngay lập tức. Nếu KHÔNG tìm thấy ➔ Trả về `null` (Dùng để khẳng định phần tử KHÔNG tồn tại: `expect(screen.queryByText('...')).not.toBeInTheDocument()`).
   - **`findByText`**: Trả về một Promise bất đồng bộ. Tự động chờ đợi và retry cho đến khi phần tử xuất hiện trên DOM.

---

## ❌ Common Mistakes

### Sai 1 - Dùng `fireEvent` thay vì `@testing-library/user-event`
```typescript
// ❌ KHÔNG KHUYÊN DÙNG: fireEvent chỉ bắn 1 event thô, không kích hoạt đúng chuỗi sự kiện hover/focus của người dùng thật
fireEvent.change(input, { target: { value: 'abc' } });

// ✅ ĐÚNG CHUẨN RTL HIỆN ĐẠI: Dùng userEvent.type() mô phỏng đúng từng thao tác gõ phím của người dùng
const user = userEvent.setup();
await user.type(input, 'abc');
```

---

## 📚 Summary

- RTL theo triết lý **User-Centric Testing**: Kiểm thử giao diện theo góc nhìn người dùng thật.
- Ưu tiên Query theo **`getByRole`** và **`getByLabelText`**.
- Dùng **`@testing-library/user-event`** để giả lập các hành động gõ phím (`type`) và click chuột (`click`).
- Dùng **`queryBy*`** để khẳng định một phần tử KHÔNG tồn tại trên DOM.
- Dùng **`findBy*`** để chờ đợi các phần tử xuất hiện bất đồng bộ.

---

## 📝 Quiz

### Question 1
Triết lý kiểm thử mấu chốt của React Testing Library (RTL) khuyên lập trình viên nên tập trung vào điều gì khi viết bài test cho một Component?

A. Kiểm thử chi tiết biến state nội bộ xem có tên là `count` không  
B. Kiểm thử theo đúng góc nhìn và hành vi của người dùng thật (User-Centric) hiển thị trên giao diện DOM  
C. Kiểm thử xem file CSS nặng bao nhiêu KB  
D. Cả A và C  

**Explanation:**  
RTL thúc đẩy việc viết test dựa trên những gì người dùng nhìn thấy và tương tác (nút bấm, text, ô form) thay vì can thiệp sâu vào implementation details như tên biến state hay hàm nội bộ.

**Answer: B**

---

### Question 2
Hàm Query nào trong React Testing Library được khuyến nghị ưu tiên hàng đầu (Top Priority) để định vị các phần tử tương tác trên giao diện?

A. `getByTestId`  
B. `getByRole` (ví dụ: `getByRole('button', { name: /đăng nhập/i })`)  
C. `getByClassName`  
D. `querySelector`  

**Explanation:**  
`getByRole` phản ánh chính xác nhất cách các công cụ hỗ trợ người khuyết tật (Screen Readers) và người dùng định vị các nút bấm, ô input, hình ảnh... trên trang web.

**Answer: B**

---

### Question 3
Phương thức Query nào dưới đây phải được sử dụng khi bạn muốn khẳng định một phần tử giao diện **KHÔNG TỒN TẠI** (Hoặc đã biến mất) trên cây DOM mà không làm ném lỗi crash bài test?

A. `getByText`  
B. `queryByText` (ví dụ `expect(screen.queryByText('...')).not.toBeInTheDocument()`)  
C. `findByText`  
D. `getAllByText`  

**Explanation:**  
`getByText` sẽ ném ngoại lệ lập tức nếu không tìm thấy phần tử. `queryByText` trả về `null` nếu không tìm thấy, cho phép bạn viết câu lệnh khẳng định `expect(screen.queryByText('...')).not.toBeInTheDocument()` một cách an toàn.

**Answer: B**
