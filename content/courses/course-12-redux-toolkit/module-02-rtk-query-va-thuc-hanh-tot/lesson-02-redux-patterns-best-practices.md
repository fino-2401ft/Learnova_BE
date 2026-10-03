---
id: redux-toolkit-m2-l2
course: State Management — Redux Toolkit & Modern State
module: RTK Query và thực hành tốt
title: Redux Patterns & Best Practices
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Redux Patterns & Best Practices

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững các Nguyên tắc và Mẫu Thiết kế (Design Patterns & Best Practices) chuẩn mực khi kiến tạo Redux Store trong ứng dụng doanh nghiệp.
- Chuẩn hóa cấu trúc State dữ liệu dạng phẳng với **`createEntityAdapter`** (Normalized State Structure `{ ids: [], entities: {} }`).
- Áp dụng thư viện **Reselect** (`createSelector`) để tạo các Memoized Selectors tối ưu hiệu năng tính toán và triệt tiêu Re-render thừa.
- Tổ chức cấu trúc thư mục dự án Redux theo mô hình **Feature-folder Pattern** chuẩn mực.
- Thiết lập quy tắc phân định ranh giới (Decision Flowchart) khi nào nên dùng Redux Global State và khi nào nên dùng Local Component State.
- Áp dụng các quy tắc kiểm tra tính sẵn sàng mã hóa (Serialization Guidelines) cho Redux Store.

---

## 📖 Definition

### 1. Chuẩn Hóa Cấu Trúc State (Normalized State Structure) với `createEntityAdapter`

Trong các ứng dụng thực tế, dữ liệu nhận về từ API thường có dạng danh sách lồng nhau (Nested Arrays). 

```javascript
// ❌ CẤU TRÚC LỒNG NHAU NGUY HIỂM (UN-NORMALIZED)
const state = {
  posts: [
    { id: 'p1', title: 'Post 1', author: { id: 'u1', name: 'Long' } },
    { id: 'p2', title: 'Post 2', author: { id: 'u1', name: 'Long' } } // ⚠️ Trùng lặp author u1!
  ]
};
```

Nếu tác giả `u1` đổi tên, bạn phải duyệt qua toàn bộ mảng `posts` để cập nhật ở mọi bài viết. Thao tác này có độ phức tạp $O(n)$, dễ sót và tốn hiệu năng.

**Chuẩn Hóa State (Normalization)** chuyển đổi mảng thành cấu trúc dạng phẳng mô phỏng Cơ sở dữ liệu:
- **`ids`:** Mảng chứa danh sách các khóa chính (`['p1', 'p2']`).
- **`entities`:** Đối tượng lưu dữ liệu với key là ID (`{ p1: {...}, p2: {...} }`).

**`createEntityAdapter`** trong RTK cung cấp sẵn các phương thức CRUD chuẩn hóa đạt tốc độ truy cập $O(1)$: `addOne`, `addMany`, `setAll`, `updateOne`, `removeOne`.

```text
┌────────────────────────────────────────────────────────────────────────┐
│             CẤU TRÚC STATE CHUẨN HÓA (CREATEENTITYADAPTER)             │
└────────────────────────────────────────────────────────────────────────┘

  state.users = {
    ids: ['u101', 'u102'],
    entities: {
      'u101': { id: 'u101', name: 'Nguyễn Long', role: 'admin' },
      'u102': { id: 'u102', name: 'Trần Vũ', role: 'student' }
    },
    isLoading: false // Meta state mở rộng
  }
```

---

## 2. Memoized Selectors Với `createSelector` (Reselect)

Khi trích xuất và biến đổi dữ liệu từ Redux Store (như lọc danh sách theo từ khóa, tính tổng tiền giỏ hàng), nếu bạn viết logic lọc trực tiếp trong `useSelector`:

```javascript
// ❌ SAI: Mảng .filter() luôn tạo ra mảng mới -> useSelector làm Component RE-RENDER Ở MỌI LẦN STORE UPDATE!
const activeUsers = useSelector(state => state.users.filter(u => u.isActive));
```

**`createSelector`** từ thư viện Reselect giải quyết bài toán này qua cơ chế **Memoization (Ghi nhớ kết quả)**:
- Nó lưu lại kết quả tính toán lần gần nhất.
- Nếu các dữ liệu đầu vào (Input Selectors) **không thay đổi**, nó lập tức trả về kết quả đã ghi nhớ trong RAM mà **KHÔNG CẦN tính toán lại** và không làm Component re-render!

---

## 3. Quy Trình Quyết Định Vị Trí Lưu State (Local vs Redux State)

Một trong những sai lầm lớn nhất của lập trình viên là đưa tất cả mọi thứ vào Redux Store.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   THÁC QUYẾT ĐỊNH VỊ TRÍ LƯU STATE                     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                      Dữ liệu có cần dùng chung ở
                     nhiều trang/components không?
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
                    [ CÓ ]                    [ KHÔNG ]
                       │                         │
             Dữ liệu có thay đổi               Lưu tại Component
            từ Server hay CSDL không?         bằng useState() /
                       │                      useReducer()
                ┌──────┴──────┐
                ▼             ▼
             [ CÓ ]        [ KHÔNG ]
                │             │
           Lưu bằng        Lưu bằng
          RTK Query      Redux Slice
```

---

## 💻 Syntax

### 1. `createEntityAdapter` Syntax
```javascript
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

// 1. Tạo Adapter
const usersAdapter = createEntityAdapter({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
});

// 2. Initial State chuẩn hóa { ids: [], entities: {} }
const initialState = usersAdapter.getInitialState({
  status: "idle"
});

// 3. Slice reducers
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    userAdded: usersAdapter.addOne,
    usersReceived: usersAdapter.setAll,
    userUpdated: usersAdapter.updateOne,
    userRemoved: usersAdapter.removeOne
  }
});

// 4. Export Selectors chuẩn hóa
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds
} = usersAdapter.getSelectors((state) => state.users);
```

### 2. Memoized Selector (`createSelector`) Syntax
```javascript
import { createSelector } from "@reduxjs/toolkit";

const selectAllBooks = (state) => state.books.entities;
const selectFilterCategory = (state) => state.books.selectedCategory;

export const selectBooksByCategory = createSelector(
  [selectAllBooks, selectFilterCategory],
  (entities, category) => {
    const bookList = Object.values(entities);
    if (category === "all") return bookList;
    return bookList.filter((book) => book.category === category);
  }
);
```

---

## 📝 Example 1 - Áp dụng `createEntityAdapter` Quản Lý Dữ Liệu Khóa Học $O(1)$

```javascript
// src/features/courses/courseNormalizedSlice.js
import { createEntityAdapter, createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Khởi tạo Adapter xếp theo thứ tự ưu tiên priority
export const coursesAdapter = createEntityAdapter({
  selectId: (course) => course.id,
  sortComparer: (a, b) => b.priority - a.priority
});

// Thunk nạp dữ liệu
export const fetchNormalizedCourses = createAsyncThunk(
  "coursesNormalized/fetch",
  async () => {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const data = await response.json();
    return data.map((item, idx) => ({
      id: `C-${item.id}`,
      title: item.title,
      priority: idx + 1
    }));
  }
);

const courseNormalizedSlice = createSlice({
  name: "coursesNormalized",
  initialState: coursesAdapter.getInitialState({
    isLoading: false,
    selectedId: null
  }),
  reducers: {
    addCourse: coursesAdapter.addOne,
    updateCourse: coursesAdapter.updateOne,
    removeCourse: coursesAdapter.removeOne,
    setSelectedCourseId: (state, action) => {
      state.selectedId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNormalizedCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNormalizedCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        // setAll tự động chuyển mảng thành { ids: ['C-1', 'C-2'], entities: { 'C-1': {...} } }
        coursesAdapter.setAll(state, action.payload);
      });
  }
});

export const { addCourse, updateCourse, removeCourse, setSelectedCourseId } = courseNormalizedSlice.actions;

// Auto-generated Selectors
export const {
  selectAll: selectAllNormalizedCourses,
  selectById: selectNormalizedCourseById,
  selectEntities: selectCourseEntities
} = coursesAdapter.getSelectors((state) => state.coursesNormalized);

export default courseNormalizedSlice.reducer;
```

---

## 📝 Example 2 - Cấu Trúc Thư Mục Feature-Folder Pattern Chuẩn Doanh Nghiệp

```text
src/
├── app/                      # Cấu hình Store chung của toàn ứng dụng
│   ├── store.js              # configureStore
│   └── rootReducer.js        # Gom nhóm reducers
├── features/                 # Chia mã nguồn theo từng tính năng nghiệp vụ độc lập
│   ├── auth/                 # Domain Auth
│   │   ├── authSlice.js      # Slice state
│   │   ├── authApi.js        # RTK Query service
│   │   ├── components/       # UI Components của riêng Auth
│   │   │   └── LoginForm.jsx
│   │   └── authSelectors.js  # Reselect Selectors
│   ├── courses/              # Domain Courses
│   │   ├── courseSlice.js
│   │   ├── CourseList.jsx
│   │   └── courseService.js
│   └── cart/                 # Domain Cart
│       ├── cartSlice.js
│       └── CartDrawer.jsx
├── components/               # UI Components dùng chung (Shared Buttons, Modals)
│   └── Button.jsx
└── utils/                    # Helper functions thuần túy
```

---

## 📝 Example 3 - Memoized Selector Phân Tích Giỏ Hàng Với `createSelector`

```javascript
// src/features/cart/cartSelectors.js
import { createSelector } from "@reduxjs/toolkit";

const selectCartItems = (state) => state.cart.items;
const selectTaxRate = (state) => state.cart.taxRate;
const selectCouponDiscount = (state) => state.cart.couponDiscount;

// Memoized Selector 1: Tính tổng giá trị chưa thuế
export const selectCartSubtotal = createSelector(
  [selectCartItems],
  (items) => {
    console.log("⚡ [RESELECT] Tính toán Subtotal...");
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
);

// Memoized Selector 2: Tính tổng tiền thanh toán cuối cùng (Phụ thuộc Selector 1)
export const selectCartFinalTotal = createSelector(
  [selectCartSubtotal, selectTaxRate, selectCouponDiscount],
  (subtotal, taxRate, discount) => {
    console.log("⚡ [RESELECT] Tính toán Final Total...");
    const discounted = subtotal * (1 - discount);
    const totalWithTax = discounted * (1 + taxRate);
    return Math.max(0, Math.round(totalWithTax));
  }
);
```

```jsx
// src/features/cart/CartSummary.jsx
import React from "react";
import { useSelector } from "react-redux";
import { selectCartSubtotal, selectCartFinalTotal } from "./cartSelectors";

export function CartSummary() {
  // Chỉ Re-render khi giá trị tính toán subtotal hoặc finalTotal thay đổi!
  const subtotal = useSelector(selectCartSubtotal);
  const finalTotal = useSelector(selectCartFinalTotal);

  return (
    <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
      <div className="flex justify-between text-sm text-slate-600">
        <span>Tạm tính:</span>
        <span>{subtotal.toLocaleString()} VNĐ</span>
      </div>
      <div className="flex justify-between font-bold text-lg text-slate-900 border-t pt-2">
        <span>Tổng thanh toán:</span>
        <span className="text-blue-600">{finalTotal.toLocaleString()} VNĐ</span>
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Quy Tắc Serialization Trong Redux Store:** Không bao giờ lưu các dữ liệu không thể mã hóa chuỗi (Non-serializable Data) như `Promises`, `Functions`, `Class Instances`, `RxJS Observables`, hay `DOM Elements` vào Redux Store. Hãy chỉ lưu trữ các giá trị nguyên thủy (Primitives), Đối tượng thuần (`Plain Objects`), và Mảng (`Arrays`).
2. **Không Lạm Dụng Redux Cho State Form Nhập Liệu:** Trạng thái ô input người dùng đang gõ từng ký tự nên được giữ trong Local Component State (bằng `useState` hoặc React Hook Form). Chỉ dispatch lên Redux Store khi người dùng thực hiện hành động Submit Form thành công.

---

## ❌ Common Mistakes

### Sai 1 - Viết phép biến đổi tạo mảng/đối tượng mới trực tiếp trong `useSelector`
```jsx
// ❌ SAI TAI HẠI: .filter() và .map() luôn tạo mảng mới -> useSelector thấy địa chỉ ô nhớ đổi ở MỌI lượt update Store!
const activeUsers = useSelector(state => state.users.filter(u => u.active)); 

// ✅ ĐÚNG CHUẨN: Sử dụng Memoized Selector tạo bởi createSelector
const activeUsers = useSelector(selectActiveUsers);
```

---

## 📚 Summary

- **`createEntityAdapter`** giúp chuẩn hóa cấu trúc State thành `{ ids: [], entities: {} }` với tốc độ truy xuất $O(1)$.
- **Reselect (`createSelector`)** tạo các Memoized Selectors giúp ghi nhớ kết quả tính toán, tránh tính toán lại và triệt tiêu Re-render thừa.
- Tổ chức cấu trúc mã nguồn theo mô hình **Feature-folder Pattern**.
- Chỉ lưu trữ các dữ liệu có thể mã hóa chuỗi (**Serializable Data**) trong Redux Store.
- Phân định rõ ràng: Giữ State UI ngắn hạn trong Local State (`useState`), đưa State toàn cục/phức tạp vào Redux.

---

## 📝 Quiz

### Question 1
Cấu trúc dạng phẳng Normalized State Structure được tạo ra bởi `createEntityAdapter` bao gồm hai thành phần cốt lõi nào?

A. `data` và `status`  
B. `ids` (mảng chứa các khóa chính ID) và `entities` (đối tượng tra cứu chứa dữ liệu theo key là ID)  
C. `head` và `tail`  
D. `keys` và `values`  

**Explanation:**  
`createEntityAdapter` chuẩn hóa mảng dữ liệu thành một cấu trúc dạng phẳng chuẩn CSDL gồm: `ids: string[] | number[]` chứa danh sách các ID, và `entities: Record<string, T>` lưu trữ dữ liệu chi tiết theo key là ID, giúp tìm kiếm đạt tốc độ $O(1)$.

**Answer: B**

---

### Question 2
Lợi ích mấu chốt của việc sử dụng hàm `createSelector` từ thư viện Reselect khi trích xuất và biến đổi dữ liệu từ Redux Store là gì?

A. Tự động mã hóa mật khẩu  
B. Ghi nhớ (Memoize) kết quả tính toán, tránh tính toán lại và ngăn chặn Component bị Re-render thừa khi các tham số đầu vào không thay đổi  
C. Tự động gửi API lên server  
D. Tự động xóa CSDL  

**Explanation:**  
`createSelector` lưu lại kết quả tính toán gần nhất. Nếu các input selectors trả về giá trị giữ nguyên (so sánh Strict Equality `===`), `createSelector` trả về ngay kết quả đã lưu trong RAM mà không chạy lại hàm tính toán, bảo toàn địa chỉ ô nhớ và ngăn Re-render thừa cho Component.

**Answer: B**

---

### Question 3
Dữ liệu nào sau đây KHÔNG NÊN lưu trữ vào Redux Store để đảm bảo tính năng Serialization và khả năng hoạt động của Redux DevTools?

A. Mảng chứa các chuỗi ID  
B. Các đối tượng Non-serializable như Hàm (Functions), Promise, hay phần tử DOM Elements  
C. Số nguyên thủy  
D. Đối tượng thông tin người dùng dạng Plain Object  

**Explanation:**  
Redux yêu cầu mọi giá trị lưu trong Store phải là Serializable (có thể chuyển đổi thành JSON string mà không mất mát dữ liệu). Các đối tượng như Functions, Promises, hay DOM Elements không thể serialize được, sẽ làm hỏng tính năng Time-travel Debugging và Persist của Redux.

**Answer: B**
