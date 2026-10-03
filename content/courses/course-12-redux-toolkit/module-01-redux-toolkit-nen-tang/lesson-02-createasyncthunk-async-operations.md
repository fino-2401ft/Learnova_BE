---
id: redux-toolkit-m1-l2
course: State Management — Redux Toolkit & Modern State
module: Redux Toolkit nền tảng
title: createAsyncThunk — Async Operations
order: 2
difficulty: Advanced
estimatedTime: 240
---
# createAsyncThunk — Async Operations

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Giải thích bản chất tại sao các hàm Redux Reducers thuần túy (Pure Functions) bắt buộc phải là đồng bộ và cách **`createAsyncThunk`** giải quyết bài toán xử lý tác vụ bất đồng bộ (Async Operations / API Calls).
- Nắm vững vòng đời 3 trạng thái Action tự động được tạo ra bởi Async Thunk: **`pending`**, **`fulfilled`**, và **`rejected`**.
- Xử lý các trạng thái Async Thunk bên trong mảng **`extraReducers`** của `createSlice` sử dụng phương thức Builder Callback chuẩn mực.
- Sử dụng tham số `thunkAPI` để đọc dữ liệu từ State khác (`getState()`) và ném lỗi tùy chỉnh về khối `rejected` bằng **`rejectWithValue()`**.
- Xây dựng giao diện hiển thị trạng thái đang tải (Loading Skeleton/Spinner) và xử lý thông báo lỗi (Error UI) dựa trên Redux State.
- Sử dụng phương thức `.unwrap()` để bắt và xử lý Promise ở cấp Component khi gọi `dispatch(myThunk())`.

---

## 📖 Definition

### 1. Tại Sao Redux Reducers Phải Thuần Túy (Pure Functions)?

Trong kiến trúc Redux, một Reducer Function bắt buộc phải tuân theo nguyên tắc Pure Function:
$$\text{Output} = f(\text{Previous State}, \text{Action})$$

Nó **KHÔNG ĐƯỢC PHÉP** chứa bất kỳ Side Effect nào như:
- Gọi HTTP Requests (`fetch` hay `axios`).
- Sinh số ngẫu nhiên (`Math.random()`) hay đọc thời gian thực (`new Date()`).
- Biến đổi dữ liệu ngoài phạm vi hàm.

Nếu bạn gọi API bất đồng bộ trực tiếp bên trong Reducer, Redux sẽ không thể theo dõi được thời điểm State thay đổi, làm phá hỏng hoàn toàn tính năng Time-travel Debugging của Redux DevTools.

Để giải quyết nhu cầu gọi API bất đồng bộ, Redux sử dụng cơ chế **Middleware** (tiêu biểu là Redux Thunk).

---

## 2. Chu Trình Vòng Đời 3 Trạng Thái Action của `createAsyncThunk`

`createAsyncThunk` là một hàm utility cao cấp của Redux Toolkit giúp tự động hóa việc tạo ra các Async Actions.

Khi bạn khởi tạo một Async Thunk:
```javascript
export const fetchCourses = createAsyncThunk("courses/fetchCourses", async () => { ... });
```

Và thi hành nó trong Component: `dispatch(fetchCourses())`, `createAsyncThunk` sẽ **tự động bắn ra 3 Action Types tương ứng với 3 giai đoạn** của một Promise:

```text
┌────────────────────────────────────────────────────────────────────────┐
│               VÒNG ĐỜI ACTION CỦA CREATEASYNCTHUNK                     │
└────────────────────────────────────────────────────────────────────────┘

 [ Component ] ──> dispatch(fetchCourses())
                        │
                        ├── (1) Bắn Action: "courses/fetchCourses/pending"
                        │   👉 State: isLoading = true, error = null
                        │
                        ├── (2A) Nếu API Thành Công (Resolved):
                        │   👉 Bắn Action: "courses/fetchCourses/fulfilled"
                        │   👉 State: isLoading = false, data = action.payload
                        │
                        └── (2B) Nếu API Thất Bại (Rejected):
                            👉 Bắn Action: "courses/fetchCourses/rejected"
                            👉 State: isLoading = false, error = action.payload
```

---

## 3. Khái Niệm `extraReducers` và Builder Callback Pattern

Trong khi trường `reducers` của `createSlice` dùng để xử lý các Action đồng bộ do chính Slice đó tự sinh ra, trường **`extraReducers`** cho phép Slice lắng nghe và cập nhật State dựa trên các Action sinh ra từ **BÊN NGOÀI Slice** — mà điển hình nhất chính là các Action bất đồng bộ từ `createAsyncThunk`.

Từ phiên bản Redux Toolkit 2.0+, cú pháp gán Object kiểu cũ đã bị loại bỏ hoàn toàn. Bắt buộc phải sử dụng **Builder Callback Pattern**:

```javascript
extraReducers: (builder) => {
  builder
    .addCase(myThunk.pending, (state, action) => { ... })
    .addCase(myThunk.fulfilled, (state, action) => { ... })
    .addCase(myThunk.rejected, (state, action) => { ... });
}
```

---

## 💻 Syntax

### 1. Định nghĩa Async Thunk với `rejectWithValue`
```javascript
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchUserById = createAsyncThunk(
  "users/fetchById",
  async (userId, { rejectWithValue, getState }) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Không thể tải thông tin người dùng");
      }
      return await response.json(); // Payload trả về cho fulfilled
    } catch (error) {
      return rejectWithValue(error.message); // Payload trả về cho rejected
    }
  }
);
```

---

## 📝 Example 1 - Xây dựng `courseSlice` Fetch Dữ Liệu Khóa Học Với Xử Lý Trạng Thái Đầy Đủ

```javascript
// src/store/courseSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// 1. Tạo Async Thunk lấy danh sách khóa học theo danh mục
export const fetchCoursesByCategory = createAsyncThunk(
  "courses/fetchByCategory",
  async (category, { rejectWithValue }) => {
    try {
      const response = await fetch(`https://jsonplaceholder.typicode.com/posts?_limit=4&cat=${category}`);
      
      if (!response.ok) {
        throw new Error(`Mã lỗi HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data; // Dữ liệu này sẽ tự động gắn vào action.payload của fulfilled
    } catch (err) {
      // Dùng rejectWithValue để ném chuỗi lỗi tùy chỉnh vào action.payload của rejected
      return rejectWithValue(err.message || "Lỗi nạp dữ liệu từ máy chủ");
    }
  }
);

// 2. Khởi tạo Slice với extraReducers
const initialState = {
  items: [],
  isLoading: false,
  error: null,
  selectedCategory: "frontend"
};

const courseSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    setCategory: (state, action) => {
      state.selectedCategory = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Xử lý trạng thái PENDING (Đang gọi API)
      .addCase(fetchCoursesByCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Xử lý trạng thái FULFILLED (Gọi API thành công)
      .addCase(fetchCoursesByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      // Xử lý trạng thái REJECTED (Gọi API thất bại)
      .addCase(fetchCoursesByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Đã xảy ra lỗi không xác định";
      });
  }
});

export const { setCategory } = courseSlice.actions;
export default courseSlice.reducer;
```

---

## 📝 Example 2 - Sử Dụng `getState()` trong Thunk để Đọc Token Xác Thực

```javascript
// src/store/orderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Thunk Đặt Hàng cần đính kèm Bearer Token từ authSlice
export const createOrderThunk = createAsyncThunk(
  "order/createOrder",
  async (orderItems, { getState, rejectWithValue }) => {
    try {
      // Đọc toàn bộ State hiện tại của Redux Store bằng getState()
      const state = getState();
      const token = state.auth.token; // Trích xuất Token từ authSlice

      if (!token) {
        return rejectWithValue("Phiên làm việc hết hạn. Vui lòng đăng nhập lại!");
      }

      const response = await fetch("https://api.educonnect.vn/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ items: orderItems })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Đặt hàng thất bại");
      }

      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
```

---

## 📝 Example 3 - Giao Diện Component Hiển Thị UI Loading/Error & Dùng `.unwrap()`

```jsx
// src/components/CourseListContainer.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCoursesByCategory, setCategory } from "../store/courseSlice";

export function CourseListContainer() {
  const dispatch = useDispatch();
  const { items: courses, isLoading, error, selectedCategory } = useSelector((state) => state.courses);

  useEffect(() => {
    // Dispatch Async Thunk khi component mount hoặc khi đổi category
    dispatch(fetchCoursesByCategory(selectedCategory));
  }, [dispatch, selectedCategory]);

  // Handler thực thi reload thử lại với `.unwrap()`
  const handleReloadWithUnwrap = async () => {
    try {
      // dispatch(thunk) trả về một Promise. Gọi .unwrap() để trích xuất payload hoặc ném error
      const resultData = await dispatch(fetchCoursesByCategory(selectedCategory)).unwrap();
      console.log("Tải dữ liệu thành công trực tiếp tại Component:", resultData);
    } catch (rejectedValue) {
      console.error("Bắt lỗi trực tiếp tại Component:", rejectedValue);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Danh Sách Khóa Học ({selectedCategory.toUpperCase()})</h2>
        
        <div className="space-x-2">
          <button
            onClick={() => dispatch(setCategory("frontend"))}
            className={`px-3 py-1 rounded text-sm ${selectedCategory === "frontend" ? "bg-blue-600 text-white" : "bg-slate-200"}`}
          >
            Frontend
          </button>
          <button
            onClick={() => dispatch(setCategory("backend"))}
            className={`px-3 py-1 rounded text-sm ${selectedCategory === "backend" ? "bg-blue-600 text-white" : "bg-slate-200"}`}
          >
            Backend
          </button>
        </div>
      </div>

      {/* 1. Trạng thái Loading */}
      {isLoading && (
        <div className="p-8 text-center bg-blue-50 text-blue-600 rounded-xl animate-pulse">
          <p className="font-semibold">⏳ Đang gọi API lấy danh sách khóa học từ Server...</p>
        </div>
      )}

      {/* 2. Trạng thái Lỗi */}
      {error && !isLoading && (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-4">
          <h3 className="font-bold mb-2">❌ Thao Tác Thất Bại</h3>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={handleReloadWithUnwrap}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Thử lại với .unwrap()
          </button>
        </div>
      )}

      {/* 3. Hiển thị Dữ liệu */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg text-slate-800 mb-2">{course.title}</h3>
              <p className="text-slate-600 text-sm line-clamp-2">{course.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## ⚠️ Notes

1. **`dispatch(thunk)` Luôn Trả Về Promise Đã Resolved:** Khác với hàm bình thường, lệnh `dispatch(fetchCourses())` luôn trả về một Promise thành công (Resolved Promise) chứa Action object `{ type: '...', payload: '...' }` ngay cả khi API bị ném lỗi `rejected`! Để có thể bắt lỗi bằng `try...catch` ở Component, bạn bắt buộc phải gọi hàm `.unwrap()`: `await dispatch(myThunk()).unwrap()`.
2. **Tránh Viết Side Effects Trực Tiếp Ở UI Khi Dùng Thunk:** Hãy đưa toàn bộ logic parse dữ liệu, retry, kiểm tra token vào trong Async Thunk để giữ cho React UI Component thật sạch sẽ.

---

## ❌ Common Mistakes

### Sai 1 - Bắt `try...catch` trong Thunk nhưng quên dùng `rejectWithValue`
```javascript
// ❌ SAI TAI HẠI: Trả về chuỗi err.message bằng từ khóa "return"
export const badThunk = createAsyncThunk("test", async () => {
  try {
    throw new Error("Lỗi Server 500");
  } catch (err) {
    return err.message; // ❌ Dù có lỗi, Thunk vẫn coi đây là FULFILLED với payload là "Lỗi Server 500"!
  }
});

// ✅ ĐÚNG CHUẨN REDUX TOOLKIT:
export const goodThunk = createAsyncThunk("test", async (_, { rejectWithValue }) => {
  try {
    throw new Error("Lỗi Server 500");
  } catch (err) {
    return rejectWithValue(err.message); // ✅ Lọt chính xác vào extraReducers.rejected!
  }
});
```

---

## 📚 Summary

- **Redux Reducers** phải là Pure Functions đồng bộ; các thao tác bất đồng bộ (API) phải được xử lý qua **`createAsyncThunk`**.
- `createAsyncThunk` tự động sinh ra 3 Actions theo vòng đời: **`pending`**, **`fulfilled`**, và **`rejected`**.
- Lắng nghe và cập nhật State cho Thunk bên trong mảng **`extraReducers`** của Slice sử dụng Builder Callback.
- Sử dụng **`rejectWithValue()`** để ném thông tin lỗi tùy chỉnh vào nhánh `rejected`.
- Sử dụng **`.unwrap()`** ở Component nếu muốn dùng `try...catch` trực tiếp khi dispatch Thunk.

---

## 📝 Quiz

### Question 1
Ba trạng thái Action Types tự động được tạo ra theo vòng đời thi hành của một Async Thunk trong Redux Toolkit là gì?

A. `start`, `success`, `fail`  
B. `pending`, `fulfilled`, `rejected`  
C. `loading`, `done`, `error`  
D. `init`, `process`, `complete`  

**Explanation:**  
Khi thi hành `createAsyncThunk`, Redux Toolkit tự động sinh ra 3 Action Types dựa trên tên prefix: `prefix/pending` (khi bắt đầu gọi), `prefix/fulfilled` (khi Promise resolved thành công), và `prefix/rejected` (khi Promise bị rejected hoặc gặp lỗi).

**Answer: B**

---

### Question 2
Điều gì sẽ xảy ra nếu bạn dùng câu lệnh `catch (err) { return err.message; }` bên trong một Async Thunk mà KHÔNG dùng `rejectWithValue(err.message)`?

A. Thunk sẽ ném ra ngoại lệ crash ứng dụng  
B. Thunk sẽ coi lệnh `return` đó là một kết quả thành công và đẩy Action lọt nhầm vào nhánh `fulfilled` với payload là chuỗi thông báo lỗi  
C. Thunk tự động gửi lại API  
D. Thunk không chạy  

**Explanation:**  
Trong JavaScript async function, bất kỳ giá trị nào được trả về bằng từ khóa `return` (mà không bị `throw` hoặc `rejectWithValue`) đều làm cho Promise chuyển sang trạng thái Resolved. Do đó Async Thunk sẽ hiểu đó là kết quả thành công và rơi vào `fulfilled`.

**Answer: B**

---

### Question 3
Phương thức nào được gọi nối tiếp đằng sau `dispatch(myAsyncThunk())` trong Component để biến Promise mặc định của Redux thành một Promise có thể ném ngoại lệ (throw error) trực tiếp cho khối `try...catch` ở UI?

A. `.extract()`  
B. `.unwrap()`  
C. `.toPromise()`  
D. `.catchError()`  

**Explanation:**  
Hàm `dispatch(myAsyncThunk())` mặc định trả về một Promise luôn resolved chứa Action object. Gọi `.unwrap()` trên Promise đó sẽ trích xuất trực tiếp `action.payload` nếu thành công, hoặc ném ra ngoại lệ (throw) nếu Async Thunk bị `rejected`, giúp khối `try...catch` ở Component hoạt động đúng kỳ vọng.

**Answer: B**
