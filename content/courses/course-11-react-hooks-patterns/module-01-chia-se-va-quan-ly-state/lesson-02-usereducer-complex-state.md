---
id: react-hooks-patterns-m1-l2
course: React Hooks & Patterns Nâng Cao
module: Chia sẻ và quản lý state
title: useReducer — State Logic Phức Tạp
order: 2
difficulty: Advanced
estimatedTime: 240
---
# useReducer — State Logic Phức Tạp

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Đánh giá khi nào nên chuyển đổi từ `useState` sang **`useReducer`**.
- Nắm vững kiến trúc Reducer: **State**, **Action**, **Dispatch**, **Reducer Function**.
- Xây dựng Pure Reducer Function kiểm soát luồng biến đổi dữ liệu bằng câu lệnh `switch-case`.
- Gửi thông điệp cập nhật state từ UI thông qua hàm `dispatch({ type, payload })`.
- Kết hợp `useReducer` với `useContext` để quản lý State toàn cục quy mô vừa mà không cần thư viện ngoài.

---

## 📖 Definition

### 1. Khi nào nên dùng `useReducer` thay vì `useState`?
Khi State của Component trở nên phức tạp:
- State gồm nhiều thuộc tính lồng nhau và các thuộc tính này có sự phụ thuộc lẫn nhau khi cập nhật.
- Component có nhiều loại hành động (Actions) khác nhau làm biến đổi state theo nhiều kịch bản phức tạp.
- Logic cập nhật state nằm rải rác khắp nơi trong event handlers làm Component bị phình to và khó test.

`useReducer` giúp tách biệt hoàn toàn **Logic cập nhật State** (nằm trong Reducer Function) ra khỏi **Giao diện hiển thị** (Component UI).

### 2. Cấu trúc của `useReducer`
`const [state, dispatch] = useReducer(reducer, initialState);`

- **State:** Trạng thái dữ liệu hiện tại.
- **Dispatch:** Hàm gửi một đối tượng `Action` đến Reducer để kích hoạt cập nhật state.
- **Action:** Đối tượng JS mô tả hành động xảy ra. Chuẩn tiêu chuẩn gồm 2 thuộc tính: `type` (tên hành động chuỗi viết HOA) và `payload` (dữ liệu kèm theo).
- **Reducer Function:** Một Pure Function nhận vào `(currentState, action)` và trả về `newState`.

---

## 💻 Syntax

### Pure Reducer Function Pattern
```javascript
function appReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "FETCH_SUCCESS":
      return { ...state, isLoading: false, data: action.payload, error: null };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}
```

### useReducer in Component
```jsx
const initialState = { data: null, isLoading: false, error: null };

function DataComponent() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadData = () => {
    dispatch({ type: "SET_LOADING", payload: true });
    // API Call...
  };
}
```

---

## 📝 Example 1 - Quản lý Giỏ Hàng (Shopping Cart Reducer)

```jsx
import { useReducer } from "react";

const initialCartState = {
  items: [], // [{ id, title, price, quantity }]
  totalAmount: 0
};

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingIndex = state.items.findIndex(item => item.id === action.payload.id);
      let updatedItems = [...state.items];

      if (existingIndex >= 0) {
        // Đã có -> Tăng số lượng
        const updatedItem = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + 1
        };
        updatedItems[existingIndex] = updatedItem;
      } else {
        // Chưa có -> Thêm mới
        updatedItems.push({ ...action.payload, quantity: 1 });
      }

      const newTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return { ...state, items: updatedItems, totalAmount: newTotal };
    }

    case "REMOVE_FROM_CART": {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      const newTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return { ...state, items: updatedItems, totalAmount: newTotal };
    }

    case "CLEAR_CART":
      return initialCartState;

    default:
      return state;
  }
}

export function ShoppingCartApp() {
  const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

  const handleAdd = (course) => {
    dispatch({ type: "ADD_TO_CART", payload: course });
  };

  return (
    <div className="cart-container">
      <h2>Giỏ hàng của bạn ({cartState.items.length} món)</h2>
      <button onClick={() => handleAdd({ id: 101, title: "React Pro", price: 500000 })}>
        + Thêm khóa React Pro (500k)
      </button>

      <ul>
        {cartState.items.map(item => (
          <li key={item.id}>
            {item.title} - Số lượng: {item.quantity} - {item.price * item.quantity} VNĐ
            <button onClick={() => dispatch({ type: "REMOVE_FROM_CART", payload: item.id })}>Xóa</button>
          </li>
        ))}
      </ul>
      <h3>Tổng tiền thanh toán: {cartState.totalAmount.toLocaleString("vi-VN")} VNĐ</h3>
    </div>
  );
}
```

---

## 📝 Example 2 - Quản lý Trạng thái Form Đăng ký phức tạp với useReducer

```jsx
import { useReducer } from "react";

const formInitialState = {
  step: 1,
  username: "",
  email: "",
  password: "",
  isSubmitting: false,
  error: null
};

function formReducer(state, action) {
  switch (action.type) {
    case "FIELD_CHANGE":
      return {
        ...state,
        [action.field]: action.value,
        error: null
      };
    case "NEXT_STEP":
      return { ...state, step: state.step + 1 };
    case "PREV_STEP":
      return { ...state, step: state.step - 1 };
    case "SUBMIT_START":
      return { ...state, isSubmitting: true, error: null };
    case "SUBMIT_SUCCESS":
      return formInitialState; // Reset
    case "SUBMIT_ERROR":
      return { ...state, isSubmitting: false, error: action.payload };
    default:
      return state;
  }
}

export function MultiStepForm() {
  const [state, dispatch] = useReducer(formReducer, formInitialState);

  const handleInputChange = (e) => {
    dispatch({
      type: "FIELD_CHANGE",
      field: e.target.name,
      value: e.target.value
    });
  };

  return (
    <div className="multi-step-form">
      <h3>Đăng ký tài khoản - Bước {state.step}/2</h3>
      {state.error && <p className="error">{state.error}</p>}

      {state.step === 1 && (
        <div>
          <input name="username" value={state.username} onChange={handleInputChange} placeholder="Tên đăng nhập" />
          <input name="email" value={state.email} onChange={handleInputChange} placeholder="Email" />
          <button onClick={() => dispatch({ type: "NEXT_STEP" })}>Tiếp theo</button>
        </div>
      )}

      {state.step === 2 && (
        <div>
          <input type="password" name="password" value={state.password} onChange={handleInputChange} placeholder="Mật khẩu" />
          <button onClick={() => dispatch({ type: "PREV_STEP" })}>Quay lại</button>
          <button onClick={() => dispatch({ type: "SUBMIT_SUCCESS" })}>Hoàn tất</button>
        </div>
      )}
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Reducer Function BẮT BUỘC phải là Pure Function:** Không được phép gọi API, không được dùng `Math.random()`, `Date.now()`, hay làm biến đổi trực tiếp đối tượng `state` hiện tại bên trong Reducer.
2. **Luôn có nhánh `default` trong switch-case:** Luôn trả về `state` hiện tại trong nhánh `default` phòng trường hợp một action không xác định bị gửi nhầm vào Reducer.

---

## ❌ Common Mistakes

### Sai 1 - Mutate `state` trực tiếp bên trong Reducer Function
```javascript
// ❌ Sai nghiêm trọng: Mutate state -> React không detect được thay đổi
function badReducer(state, action) {
  if (action.type === "ADD") {
    state.count++; // ❌ Mutate state trực tiếp!
    return state;
  }
}

// ✅ Đúng chuẩn: Trả về Object mới hoàn toàn
function goodReducer(state, action) {
  if (action.type === "ADD") {
    return { ...state, count: state.count + 1 };
  }
}
```

---

## 📚 Summary

- **`useReducer`** thích hợp quản lý State có cấu trúc phức tạp và nhiều luồng biến đổi khác nhau.
- Mô hình Reducer gồm: **State** (dữ liệu), **Action** (`{ type, payload }`), **Dispatch** (gửi action), **Reducer** (hàm xử lý thuần túy).
- Reducer Function nhận vào `(state, action)` và bắt buộc phải trả về một đối tượng **State MỚI** (Pure Function).

---

## 📝 Quiz

### Question 1
Hàm Reducer Function trong `useReducer` bắt buộc phải thỏa mãn tính chất nào sau đây?

A. Là một Async Function  
B. Là một Pure Function (không gây ra tác dụng phụ, trả về state mới từ state cũ và action)  
C. Phải gọi API bên trong hàm  
D. Phải dùng `document.getElementById`  

**Answer: B**

---

### Question 2
Thuộc tính `type` trong một đối tượng `Action` gửi đến `dispatch()` thường có định dạng như thế nào theo chuẩn công nghiệp?

A. Số nguyên âm  
B. Một chuỗi chữ in HOA mô tả hành động (ví dụ: `"ADD_TO_CART"`)  
C. Một mảng chứa dữ liệu  
D. Một hàm callback  

**Answer: B**

---

### Question 3
Phương thức nào được Component gọi để gửi thông điệp `Action` đến Reducer Function nhằm cập nhật State?

A. `setState()`  
B. `dispatch(action)`  
C. `execute(action)`  
D. `sendAction()`  

**Answer: B**
