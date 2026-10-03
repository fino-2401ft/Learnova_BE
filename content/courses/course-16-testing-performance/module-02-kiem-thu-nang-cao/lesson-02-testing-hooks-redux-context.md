---
id: testing-performance-m2-l2
course: Testing, Quality Assurance & Performance Optimization
module: Kiểm thử nâng cao
title: Testing Hooks, Redux Store & Context
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Testing Hooks, Redux Store & Context

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích quy trình kiểm thử các Custom Hooks phức tạp bằng **`renderHook()`** và **`act()`** từ `@testing-library/react`.
- Xây dựng **Custom Test Render Wrapper** tự động bọc `<Provider store={store}>` và `<BrowserRouter>` cho tất cả các bài test.
- Kiểm thử tích hợp toàn diện luồng dữ liệu Redux Toolkit (Slices, Thunks, Selectors).
- Kiểm thử các React Context Providers với trạng thái Auth / Theme.
- Khởi tạo Redux Store giả lập riêng biệt cho từng bài test để triệt tiêu hiện tượng rò rỉ State giữa các bài test.

---

## 📖 Definition

### 1. Kiểm Thử Custom Hooks Với `renderHook()`

Một Custom Hook trong React không thể gọi trực tiếp như một hàm JS thuần (`const res = useMyHook()`) vì nó vi phạm Quy tắc Hooks (Rules of Hooks).

**`renderHook()`** tạo ra một Component container ẩn ngầm bên dưới để mount Hook đó vào môi trường React DOM:
- **`result.current`**: Truy cập và đọc giá trị mới nhất do Hook trả về.
- **`act(() => { ... })`**: Bọc các hành động làm thay đổi State bên trong Hook để đảm bảo React đã hoàn tất cập nhật DOM trước khi bạn thực hiện khẳng định `expect()`.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CƠ CHẾ HOẠT ĐỘNG CỦA RENDERHOOK()                     │
└────────────────────────────────────────────────────────────────────────┘

 [ renderHook(() => useCounter()) ] ───> [ Ẩn Container Component ]
                                                       │
                                                       ▼
 [ expect(result.current.count).toBe(1) ] <── [ result.current ]
```

---

## 2. Kiểm Thử Redux Store Với Custom Render Wrapper

Khi kiểm thử một Component có tiêu thụ Redux Store (như `useAppSelector` hay `useAppDispatch`):
- Nếu bạn gọi `render(<MyComponent />)` đơn thuần, bài test sẽ bị crash lập tức với lỗi *"Could not find react-redux context value"*.

Giải pháp chuẩn mực: Xây dựng một hàm tiện ích **`renderWithProviders()`** tự động khởi tạo một Redux Store mới độc nhất cho từng bài test và bọc Component trong `<Provider store={testStore}>`.

---

## 💻 Syntax

### Custom Render Wrapper Pattern
```tsx
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/authSlice";

export function renderWithProviders(
  ui: React.ReactElement,
  { preloadedState = {}, store = configureStore({ reducer: { auth: authReducer }, preloadedState }) } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return { store, ...render(ui, { wrapper: Wrapper }) };
}
```

---

## 📝 Example 1 - Unit Test Custom Hook `useCounter` Với `renderHook()` Và `act()`

```typescript
// src/hooks/useCounter.ts
import { useState } from "react";

export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => c - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}
```

```typescript
// src/hooks/useCounter.test.ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useCounter } from "./useCounter";

describe("Unit Test Custom Hook: useCounter", () => {
  it("nên khởi tạo với giá trị mặc định", () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it("nên tăng giá trị khi gọi hàm increment()", () => {
    const { result } = renderHook(() => useCounter(0));

    // BẮT BUỘC: Bọc các hàm làm thay đổi React State bên trong act()!
    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("nên reset về giá trị ban đầu khi gọi reset()", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });
});
```

---

## 📝 Example 2 - Xây Dựng `renderWithProviders` Cho Redux Toolkit & React Router

```tsx
// src/test/test-utils.tsx
import React, { PropsWithChildren } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore, RootState } from "@reduxjs/toolkit";
import authReducer from "../store/authSlice";
import courseReducer from "../store/courseSlice";

interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof setupTestStore>;
}

export function setupTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      courses: courseReducer
    },
    preloadedState: preloadedState as any
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = setupTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
```

---

## 📝 Example 3 - Integration Test Component Tiêu Thụ Redux Store Với Mock Initial State

```tsx
// src/components/HeaderUserProfile.test.tsx
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../test/test-utils";
import { HeaderUserProfile } from "./HeaderUserProfile";

describe("Integration Test: HeaderUserProfile với Redux Store", () => {
  it("nên hiển thị nút Đăng nhập khi người dùng chưa xác thực", () => {
    // Render với preloadedState giả lập chưa đăng nhập
    renderWithProviders(<HeaderUserProfile />, {
      preloadedState: {
        auth: { user: null, isAuthenticated: false, token: null }
      }
    });

    expect(screen.getByRole("button", { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it("nên hiển thị tên người dùng và vai trò khi đã đăng nhập", () => {
    // Render với preloadedState giả lập ĐÃ đăng nhập
    renderWithProviders(<HeaderUserProfile />, {
      preloadedState: {
        auth: {
          user: { id: "1", name: "Nguyễn Long", email: "long@educonnect.vn" },
          isAuthenticated: true,
          token: "fake-jwt-token"
        }
      }
    });

    expect(screen.getByText(/Xin chào, Nguyễn Long/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /đăng nhập/i })).not.toBeInTheDocument();
  });
});
```

---

## ⚠️ Notes

1. **Khởi Tạo Store Mới Cho Mỗi Bài Test:** Không bao giờ dùng chung 1 đối tượng `store` toàn cục cho tất cả các bài test. Hãy luôn gọi `setupTestStore()` để tạo 1 instance Store mới hoàn toàn trong `renderWithProviders`, triệt tiêu hiện tượng rò rỉ State giữa các case test.

---

## ❌ Common Mistakes

### Sai 1 - Gọi hàm thay đổi state của Custom Hook mà không bọc trong `act()`
```typescript
// ❌ SAI: Báo cảnh báo "An update to Component inside a test was not wrapped in act(...)"
result.current.increment();

// ✅ ĐÚNG CHUẨN: Bọc hàm làm đổi state trong act()
act(() => {
  result.current.increment();
});
```

---

## 📚 Summary

- Dùng **`renderHook()`** và **`act()`** để kiểm thử các Custom Hooks.
- Đọc giá trị mới nhất của Hook qua **`result.current`**.
- Xây dựng **`renderWithProviders()`** tự động bọc Redux `<Provider>` và Router.
- Khởi tạo **Redux Store mới** độc lập cho mỗi bài test để tránh rò rỉ State.

---

## 📝 Quiz

### Question 1
Hàm tiện ích nào của thư viện `@testing-library/react` được sử dụng chuyên biệt để khởi tạo và mount một Custom Hook vào môi trường kiểm thử mà không vi phạm Quy tắc Hooks?

A. `testHook()`  
B. `renderHook()`  
C. `mountHook()`  
D. `initHook()`  

**Explanation:**  
`renderHook(() => useMyHook())` tạo ra một container component ngầm bên dưới để mount Hook, cho phép bạn đọc giá trị trả về của Hook qua thuộc tính `result.current`.

**Answer: B**

---

### Question 2
Hàm nào bắt buộc phải được sử dụng để bọc các thao tác làm thay đổi State bên trong một Custom Hook (như gọi `result.current.increment()`) nhằm đảm bảo React đã cập nhật DOM xong trước khi Assert?

A. `act(() => { ... })`  
B. `sync(() => { ... })`  
C. `wait(() => { ... })`  

**Explanation:**  
Hàm `act(() => { ... })` đảm bảo rằng tất cả các cập nhật trạng thái (State updates) và Side Effects liên quan đã được React xử lý hoàn tất và đẩy lên DOM giả lập trước khi bạn thực hiện câu lệnh `expect()`.

**Answer: A**

---

### Question 3
Tại sao bạn nên khởi tạo một đối tượng Redux Store mới độc lập (New Store Instance) cho từng bài test trong hàm `renderWithProviders`?

A. Để làm tăng dung lượng file test  
B. Tránh hiện tượng rò rỉ và nhiễm độc trạng thái (State Contamination/Leakage) từ bài test trước sang bài test sau, đảm bảo các bài test hoàn toàn cô lập  
C. Bắt buộc bởi Redux  

**Explanation:**  
Nếu dùng chung 1 instance Store, dữ liệu thay đổi ở bài test 1 sẽ còn lưu lại và làm sai lệch kết quả của bài test 2. Khởi tạo Store mới cho từng bài test đảm bảo tính độc lập và độ tin cậy.

**Answer: B**
