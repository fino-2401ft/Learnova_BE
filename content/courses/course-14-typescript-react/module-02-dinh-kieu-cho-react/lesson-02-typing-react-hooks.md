---
id: typescript-react-m2-l2
course: TypeScript for React Developers
module: Định kiểu cho React
title: Typing React Hooks
order: 2
difficulty: Intermediate
estimatedTime: 240
---
# Typing React Hooks

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Khai báo kiểu cho Hook **`useState`** (Tự động suy luận kiểu vs Khai báo Generics `<T>`).
- Định kiểu cho **`useRef`** phân biệt rõ ràng giữa **DOM Ref** (Read-only `ref.current`) và **Mutable Ref** (Read-write `ref.current`).
- Khai báo kiểu cho **`useReducer`** với Discriminated Unions cho Action Types.
- Định kiểu cho **`useContext`** xử lý an toàn trường hợp giá trị ban đầu là `null` (`ContextType | null`).
- Định kiểu cho các Custom Hooks nâng cao tái sử dụng.

---

## 📖 Definition

### 1. Phân Biên DOM Ref vs Mutable Ref Trong `useRef`

Trong TypeScript, cách bạn truyền giá trị khởi tạo ban đầu cho `useRef` sẽ quyết định `ref.current` có cho phép ghi đè hay không:

1. **DOM Ref (Gắn vào phần tử DOM):**
   - Cú pháp: `useRef<HTMLInputElement>(null);` (Truyền giá trị ban đầu là `null`).
   - TypeScript tự động coi `ref.current` là **Read-Only** (Chỉ đọc). Bạn không được phép gán `ref.current = newElement`, mà phải để React tự gán DOM Element vào đó.
2. **Mutable Ref (Lưu biến biến đổi ngầm):**
   - Cú pháp: `useRef<number>(0);` hoặc `useRef<number | null>(null);`
   - TypeScript coi `ref.current` là **Read-Write** (Được gán trực tiếp): `ref.current = window.setInterval(...)`.

---

## 2. Kiểu Discriminated Unions Trong `useReducer`

Khi định kiểu cho Actions của `useReducer`, kỹ thuật **Discriminated Unions** (Union có nhãn phân biệt) giúp TypeScript tự động thu hẹp kiểu của `action.payload` dựa trên thuộc tính `action.type`:

```typescript
type CartAction =
  | { type: "ADD_ITEM"; payload: { id: string; title: string; price: number } }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "CLEAR_CART" }; // Không có payload
```

Trong câu lệnh `switch (action.type)`, khi lọt vào `case "ADD_ITEM"`, TypeScript **tự động biết 100% `action.payload` có chứa `title` và `price`**!

---

## 💻 Syntax

### Typing Common React Hooks Blueprint
```typescript
import { useState, useRef, useReducer, createContext } from "react";

// useState với Generic
const [user, setUser] = useState<User | null>(null);

// DOM Ref
const inputRef = useRef<HTMLInputElement>(null);

// Mutable Ref
const timerRef = useRef<number | null>(null);
```

---

## 📝 Example 1 - Định Kiểu `useReducer` Với Discriminated Unions Cho Giỏ Hàng

```typescript
// src/hooks/useCartReducer.ts
import { useReducer } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
}

// Discriminated Union cho Actions
export type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" };

const initialCartState: CartState = {
  items: [],
  totalAmount: 0
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex((item) => item.id === action.payload.id);
      let updatedItems: CartItem[];

      if (existingIndex > -1) {
        updatedItems = [...state.items];
        updatedItems[existingIndex].quantity += 1;
      } else {
        updatedItems = [...state.items, { ...action.payload, quantity: 1 }];
      }

      const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return { items: updatedItems, totalAmount: total };
    }

    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter((item) => item.id !== action.payload.id);
      const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return { items: updatedItems, totalAmount: total };
    }

    case "UPDATE_QUANTITY": {
      const updatedItems = state.items.map((item) =>
        item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
      );
      const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return { items: updatedItems, totalAmount: total };
    }

    case "CLEAR_CART":
      return initialCartState;

    default:
      return state;
  }
}

export function useCartReducer() {
  return useReducer(cartReducer, initialCartState);
}
```

---

## 📝 Example 2 - Định Kiểu `useContext` Chuẩn Với Xử Lý Null Guard (Strict Context Hook)

```tsx
// src/context/AuthContext.tsx
import React, { createContext, useContext, useState } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// 1. Tạo Context với giá trị khởi tạo là null
const AuthContext = createContext<AuthContextType | null>(null);

// 2. AuthProvider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Custom Hook an toàn 100%: Tự động check null và ném lỗi nếu quên bọc Provider!
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth bắt buộc phải được sử dụng bên trong <AuthProvider>!");
  }
  return context; // Context chắc chắn không phải null!
}
```

---

## 📝 Example 3 - Định Kiểu Custom Hook Fetch Dữ Liệu Generic (`useFetch<T>`)

```typescript
// src/hooks/useFetch.ts
import { useState, useEffect } from "react";

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    setState({ data: null, isLoading: true, error: null });

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then((data: T) => {
        if (isMounted) setState({ data, isLoading: false, error: null });
      })
      .catch((err: Error) => {
        if (isMounted) setState({ data: null, isLoading: false, error: err.message });
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return state;
}
```

---

## ⚠️ Notes

1. **Khởi Tạo `useRef<T>(null)` Cho DOM Elements:** Muốn TypeScript hiểu đây là một Ref trỏ tới phần tử DOM HTML, bắt buộc phải truyền giá trị khởi tạo ban đầu là `null`: `useRef<HTMLInputElement>(null)`.

---

## ❌ Common Mistakes

### Sai 1 - Viết `useContext(Context)` trực tiếp mà không có Null Guard
```tsx
// ❌ SAI: useContext có thể trả về null, phải tự check if (context === null) ở từng file tiêu thụ!
const context = useContext(AuthContext);
console.log(context.user); // Báo lỗi Object is possibly 'null'!

// ✅ ĐÚNG CHUẨN: Dùng Custom Hook useAuth() đã có Null Guard tập trung!
```

---

## 📚 Summary

- `useState<T>` tự động suy luận kiểu cho các giá trị ban đầu nguyên thủy; cần dùng Generic cho Object/Union (`useState<User | null>(null)`).
- `useRef<HTMLInputElement>(null)` tạo Read-only DOM Ref; `useRef<number>(0)` tạo Mutable Ref.
- Dùng **Discriminated Unions** cho Actions của `useReducer`.
- Tạo Custom Hook tiêu thụ `useContext` có Null Guard để loại bỏ kiểm tra `null` ở các Component.

---

## 📝 Quiz

### Question 1
Cách khai báo `useRef` nào dưới đây tạo ra một **DOM Ref** gắn vào phần tử HTML `<input>` với thuộc tính `ref.current` được TypeScript thiết lập là **Read-Only** (Chỉ đọc)?

A. `useRef<HTMLInputElement>()`  
B. `useRef<HTMLInputElement>(null)`  
C. `useRef<HTMLInputElement>(new HTMLInputElement())`  
D. `useRef<any>(0)`  

**Explanation:**  
Khi truyền giá trị khởi tạo ban đầu là `null` trong `useRef<HTMLInputElement>(null)`, TypeScript nhận dạng đây là một Ref dành riêng cho phần tử DOM và đặt thuộc tính `ref.current` thành Read-Only.

**Answer: B**

---

### Question 2
Kỹ thuật định kiểu nào trong TypeScript được áp dụng cho các Actions của `useReducer` giúp TypeScript tự động thu hẹp kiểu của `action.payload` chuẩn xác dựa trên giá trị chuỗi của `action.type`?

A. Generic Constraints  
B. Discriminated Unions  
C. Type Assertion  
D. Optional Chaining  

**Explanation:**  
Discriminated Unions sử dụng một thuộc tính phân biệt chung (ví dụ `type: "ADD"` vs `type: "REMOVE"`) để giúp TypeScript thu hẹp và xác định chính xác cấu trúc của `action.payload` trong từng nhánh `switch-case`.

**Answer: B**

---

### Question 3
Lợi ích mấu chốt của việc tạo một Custom Hook tiêu thụ `useContext` có chứa câu lệnh kiểm tra `if (!context) throw new Error(...)` là gì?

A. Làm cho context chạy nhanh hơn  
B. Loại bỏ hoàn toàn khả năng context bị `null` ở phía Component tiêu thụ, giúp không phải viết câu lệnh kiểm tra `if (context === null)` lặp đi lặp lại ở mọi nơi  
C. Tự động mã hóa mật khẩu  
D. Tự động render CSS  

**Explanation:**  
Custom Hook như `useAuth()` thực hiện kiểm tra `null` tập trung. Nếu context bằng `null` (do quên bọc Provider), nó ném ngoại lệ rõ ràng. Nếu hợp lệ, nó trả về kiểu `AuthContextType` (đã loại bỏ `null`), giúp các Component tiêu thụ sử dụng an toàn 100%.

**Answer: B**
