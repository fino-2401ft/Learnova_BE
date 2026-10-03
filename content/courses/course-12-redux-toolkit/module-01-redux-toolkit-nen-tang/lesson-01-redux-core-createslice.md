---
id: redux-toolkit-m1-l1
course: State Management — Redux Toolkit & Modern State
module: Redux Toolkit nền tảng
title: Redux Core & createSlice
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Redux Core & createSlice

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích kiến trúc quản lý trạng thái tập trung **Centralized State Management** theo mô hình đơn luồng dữ liệu (Unidirectional Data Flow) trong ứng dụng quy mô lớn.
- Giải thích nguyên lý hoạt động của Redux Store với vai trò là **Single Source of Truth** duy nhất của toàn bộ ứng dụng.
- Sử dụng phương thức `configureStore` từ thư viện **Redux Toolkit (RTK)** để khởi tạo Store đã được tích hợp sẵn Redux Thunk Middleware và Redux DevTools Extension.
- Xây dựng các **Slices** dữ liệu chuẩn mực bằng `createSlice` (tự động gom nhóm Reducers, Action Creators, và Action Types).
- Nắm vững cơ chế hoạt động của thư viện **Immer.js** tích hợp sẵn trong RTK cho phép viết code biến đổi State trực tiếp ("mutating") mà vẫn đảm bảo tính bất biến (Immutability).
- Tối ưu hóa việc kết nối Component với Redux Store bằng bộ đôi Hooks **`useSelector`** (trích xuất State) và **`useDispatch`** (bắn Action).

---

## 📖 Definition

### 1. Tại sao cần Redux Toolkit (RTK) trong Ứng dụng Doanh Nghiệp?

Trong các ứng dụng React vừa và nhỏ, việc sử dụng `useState` hoặc `useContext` có thể đáp ứng đủ nhu cầu truyền nhận dữ liệu. Tuy nhiên, khi ứng dụng phình to với hàng trăm Component, hàng chục trang giao diện cùng sử dụng và biến đổi chung một số tập dữ liệu (như thông tin đăng nhập, giỏ hàng, danh sách thông báo, cấu hình phân quyền), React Context API sẽ lộ rõ các hạn chế nghiêm trọng:

1. **Hiệu năng Re-render kém:** Khi một giá trị trong `Context.Provider` thay đổi, **tất cả** các Component đăng ký tiêu thụ Context đó đều bắt buộc phải re-render lại, bất kể chúng có thực sự sử dụng thuộc tính bị thay đổi đó hay không.
2. **Khó kiểm vết biến đổi dữ liệu (Debugging & Traceability):** Với Context hay State rải rác, khi một bug xảy ra (ví dụ: dữ liệu giỏ hàng bị mất đột ngột), lập trình viên rất khó truy vết xem Component nào, ở thời điểm nào, với sự kiện nào đã làm thay đổi State đó.
3. **Mã nguồn lộn xộn (Prop Drilling & Boilerplate):** Truyền props lồng qua 5-7 tầng component khiến mã nguồn cực kỳ khó bảo trì.

**Redux** giải quyết bài toán này bằng cách đưa toàn bộ State toàn cục vào một đối tượng bộ nhớ tập trung duy nhất gọi là **Redux Store**. 

**Redux Toolkit (RTK)** là bộ công cụ chuẩn chính thức (Official Recommended Standard) do Redux Team phát triển nhằm loại bỏ hoàn toàn mã rườm rà (Boilerplate code) phức tạp của Redux thuần truyền thống.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        LUỒNG DỮ LIỆU ĐƠN HƯỚNG (REDUX DATA FLOW)       │
└────────────────────────────────────────────────────────────────────────┘

 [ UI Component ] ──( 1. Action Event )──> [ dispatch(action) ]
        ▲                                          │
        │                                          ▼
 ( 4. Re-render UI ) <──( 3. New State )─── [ Reducer Function ]
                                                   │
                                            ( 2. Mutate State 
                                              via Immer.js )
```

---

## 2. Khái niệm `createSlice` và Cơ chế Tự động hóa của RTK

Trong Redux truyền thống, để tạo một tính năng (ví dụ: Auth), bạn phải viết rải rác ở 3-4 file khác nhau: `authTypes.js` (định nghĩa hằng số action string), `authActions.js` (định nghĩa hàm tạo action), và `authReducer.js` (câu lệnh `switch-case` dài hàng trăm dòng).

`createSlice` trong Redux Toolkit đóng gói toàn bộ quy trình này vào duy nhất 1 hàm:
- **`name`:** Chuỗi danh xưng làm tiền tố cho các Action Types (ví dụ: `"auth"` ➔ `"auth/loginSuccess"`).
- **`initialState`:** Giá trị khởi tạo ban đầu cho vùng bộ nhớ State đó.
- **`reducers`:** Tập hợp các hàm xử lý biến đổi State tương ứng với từng hành động. `createSlice` sẽ **tự động sinh ra các Action Creator functions** trùng tên với các hàm reducer này!

---

## 3. Bản chất của Thư viện Immer.js bên trong `createSlice`

Một trong những quy tắc bất di bất dịch của Redux là: **Không bao giờ được phép trực tiếp sửa đổi (Mutate) đối tượng State cũ**.

```javascript
// ❌ CÁCH REDUX TRUYỀN THỐNG (Phải tạo object mới thủ công vô cùng phức tạp)
function oldReducer(state = initialState, action) {
  switch (action.type) {
    case 'UPDATE_USER':
      return {
        ...state,
        user: {
          ...state.user,
          profile: {
            ...state.user.profile,
            name: action.payload
          }
        }
      };
    default:
      return state;
  }
}
```

Bên trong `createSlice`, Redux Toolkit tích hợp sẵn thư viện **Immer.js**. Immer sử dụng cơ chế **JS Proxy** để tạo ra một bản sao tạm thời gọi là `draftState`. Bạn có thể thoải mái viết code "mutate" trực tiếp trên `draftState` như JavaScript thuần (ví dụ `state.user.profile.name = action.payload`), ngầm bên dưới Immer sẽ tự động theo dõi các dòng thay đổi đó và tạo ra một đối tượng State mới bất biến (Immutable State) hoàn toàn an toàn!

---

## 💻 Syntax

### 1. Khai báo Slice dữ liệu với `createSlice`
```javascript
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: 0,
  status: "idle"
};

export const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment: (state) => {
      // Immer.js cho phép gán trực tiếp
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      // action.payload chứa dữ liệu truyền vào
      state.value += action.payload;
    }
  }
});

// Export các Action Creators tự động sinh ra
export const { increment, decrement, incrementByAmount } = counterSlice.actions;

// Export Reducer để đăng ký vào Store
export default counterSlice.reducer;
```

### 2. Cấu hình Store chính với `configureStore`
```javascript
import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer // Đăng ký slice "counter" vào bộ nhớ Redux Store
  }
});
```

---

## 📝 Example 1 - Xây dựng `authSlice` Quản lý Trạng Thái Xác Thực Người Dùng Chuyên Nghiệp

```javascript
// src/store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

// 1. Định nghĩa cấu trúc State ban đầu
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  role: "guest"
};

// 2. Khai báo Slice
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Action Đăng nhập thành công
    loginSuccess: (state, action) => {
      // action.payload: { user: { id, name, email }, token: string, role: string }
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.isAuthenticated = true;
    },
    // Action Đăng xuất
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = "guest";
      state.isAuthenticated = false;
    },
    // Action Cập nhật thông tin Hồ sơ người dùng
    updateProfile: (state, action) => {
      if (state.user) {
        // Nhờ Immer, ta có thể ghi đè từng thuộc tính của Object lồng nhau
        Object.assign(state.user, action.payload);
      }
    }
  }
});

// 3. Xuất ra Action Creators và Reducer
export const { loginSuccess, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
```

---

## 📝 Example 2 - Đăng Ký Store và Bọc Ứng Dụng Với `<Provider>`

```javascript
// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

// configureStore tự động bật Redux DevTools Extension và Redux Thunk Middleware
export const store = configureStore({
  reducer: {
    auth: authReducer
  }
});
```

```jsx
// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import App from "./App";

// Thẻ <Provider> cấp quyền truy cập Redux Store cho toàn bộ cây Component con
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

---

## 📝 Example 3 - Tương Tác Giữa Redux Store và React Component

```jsx
// src/components/HeaderAuthNavbar.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess, logout } from "../store/authSlice";

export function HeaderAuthNavbar() {
  const dispatch = useDispatch();

  // 1. Dùng useSelector để trích xuất dữ liệu từ Redux Store
  // Component sẽ TỰ ĐỘNG Re-render lại khi và chỉ khi user hoặc isAuthenticated đổi!
  const { user, isAuthenticated, role } = useSelector((state) => state.auth);

  // 2. Giả lập đăng nhập
  const handleFakeLogin = () => {
    const fakeUserData = {
      user: { id: "USR-101", name: "Nguyễn Long", email: "long@educonnect.vn" },
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      role: "admin"
    };
    // Bắn (dispatch) action loginSuccess kèm theo dữ liệu payload
    dispatch(loginSuccess(fakeUserData));
  };

  // 3. Giả lập đăng xuất
  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="flex justify-between items-center p-4 bg-slate-900 text-white">
      <div className="text-xl font-bold">EduConnect Platform</div>

      <div>
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm bg-blue-600 px-2 py-1 rounded">Quyền: {role}</span>
            <span className="font-medium">Xin chào, {user?.name}!</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            onClick={handleFakeLogin}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Đăng nhập thử nghiệm
          </button>
        )}
      </div>
    </header>
  );
}
```

---

## ⚠️ Notes

1. **`useSelector` Thực Hiện So Sánh Nông (Shallow Comparison):** `useSelector` kiểm tra kết quả trả về của câu lệnh bằng phép so sánh `===`. Nếu bạn trả về một Object mới ở mỗi lượt render (ví dụ `useSelector(state => ({ a: state.a, b: state.b }))`), Component sẽ bị **Re-render liên tục ở MỌI lượt update Store**! Hãy trích xuất từng thuộc tính riêng biệt hoặc dùng `shallowEqual`.
2. **Không biến đổi State bên ngoài Redux Reducer:** Nhờ Immer.js, bạn chỉ được phép dùng cú pháp mutate (`state.a = 1`) bên trong các reducers của `createSlice`. Dữ liệu đọc ra từ `useSelector` trong Component là Frozen Object (Read-Only).

---

## ❌ Common Mistakes

### Sai 1 - Khai báo nhầm biến Reducer trong `configureStore`
```javascript
// ❌ SAI: Truyền đối tượng Slice thay vì đối tượng Reducer của Slice
import authSlice from "./authSlice"; 
// configureStore({ reducer: { auth: authSlice } }); // Báo lỗi crash ứng dụng!

// ✅ ĐÚNG:
import authReducer from "./authSlice"; // authSlice.reducer
configureStore({ reducer: { auth: authReducer } });
```

### Sai 2 - Cố tình `return` giá trị mới đồng thời với việc `mutate` State trong Immer
```javascript
// ❌ SAI: Immer không cho phép vừa gán trực tiếp vừa return đối tượng mới trong cùng 1 reducer!
reducers: {
  updateName: (state, action) => {
    state.name = action.payload;
    return state; // Lỗi: An immer producer returned a new value AND modified the draft
  }
}

// ✅ ĐÚNG: Chọn 1 trong 2 cách
// Cách A (Mutate):
updateName: (state, action) => { state.name = action.payload; }
// Cách B (Return new state):
updateName: (state, action) => ({ ...state, name: action.payload })
```

---

## 📚 Summary

- **Redux Store** đóng vai trò Single Source of Truth tập trung lưu trữ trạng thái toàn cục cho ứng dụng.
- **`createSlice`** gom nhóm Reducers và tự động sinh ra các Action Creators và Action Types chuẩn mực.
- Thư viện **Immer.js** tích hợp sẵn trong RTK giúp cho phép viết mã biến đổi State trực tiếp mà vẫn đảm bảo Immutability an toàn.
- Dùng **`useSelector`** để đọc dữ liệu từ Store và **`useDispatch`** để bắn Action biến đổi State từ UI.

---

## 📝 Quiz

### Question 1
Kiến trúc Redux áp dụng nguyên tắc quản lý dữ liệu nào để đảm bảo tính dự đoán được (Predictability) và khả năng theo dõi biến đổi của ứng dụng?

A. Bi-directional Data Binding (Truyền dữ liệu 2 chiều)  
B. Single Source of Truth & Unidirectional Data Flow (Nguồn sự thật duy nhất & Luồng dữ liệu đơn hướng)  
C. Multi-store Distribution (Phân tán dữ liệu ra nhiều CSDL)  
D. Direct Component State Mutation  

**Explanation:**  
Redux hoạt động dựa trên 3 nguyên tắc cốt lõi: Single Source of Truth (Toàn bộ state nằm tại 1 Store duy nhất), State is Read-only (Chỉ biến đổi qua Dispatch Action), và Unidirectional Data Flow (Luồng dữ liệu di chuyển theo 1 chiều duy nhất từ UI ➔ Dispatch ➔ Reducer ➔ Store ➔ UI).

**Answer: B**

---

### Question 2
Thư viện nào được tích hợp mặc định bên trong `createSlice` của Redux Toolkit giúp lập trình viên viết được mã gán giá trị biến đổi trực tiếp (`state.user.name = action.payload`) mà vẫn tạo ra State mới bất biến (Immutable)?

A. Lodash  
B. Immer.js  
C. Axios  
D. RxJS  

**Explanation:**  
Redux Toolkit tích hợp sẵn thư viện Immer.js bên trong `createSlice`. Immer sử dụng JS Proxy tạo ra bản sao `draftState` giúp theo dõi các thay đổi và tự động sản sinh ra Immutable State mới một cách ngầm định.

**Answer: B**

---

### Question 3
Hiện tượng gì sẽ xảy ra nếu bạn viết một câu lệnh `useSelector` trả về một Object khởi tạo mới ở mỗi lượt render như `useSelector(state => ({ user: state.auth.user, theme: state.theme }))` mà không dùng `shallowEqual`?

A. Ứng dụng tự động bị đóng băng  
B. Component sẽ bị Re-render thừa ở MỌI lượt cập nhật Redux Store vì phép so sánh nông `===` thấy Object trả về luôn có địa chỉ ô nhớ mới  
C. Redux Store bị xóa toàn bộ dữ liệu  
D. Không có ảnh hưởng gì  

**Explanation:**  
`useSelector` sử dụng phép so sánh strict equality (`===`) giữa giá trị cũ và mới trả về từ selector function. Nếu selector function luôn trả về một Object mới `{ ... }`, phép so sánh `===` luôn trả về `false`, buộc Component phải re-render lại ở mọi lượt update của Store.

**Answer: B**
