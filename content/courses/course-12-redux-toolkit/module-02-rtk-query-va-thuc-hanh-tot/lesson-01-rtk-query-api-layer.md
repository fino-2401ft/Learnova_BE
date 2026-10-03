---
id: redux-toolkit-m2-l1
course: State Management — Redux Toolkit & Modern State
module: RTK Query và thực hành tốt
title: RTK Query — API Layer Tích Hợp
order: 1
difficulty: Advanced
estimatedTime: 240
---
# RTK Query — API Layer Tích Hợp

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Giải thích bản chất kiến trúc quản lý dữ liệu máy chủ **Server State Management** và cách **RTK Query** giúp giải quyết các bài toán Caching, Deduplication, và Synchronization.
- Khởi tạo một API Service tập trung bằng `createApi` và `fetchBaseQuery` trong Redux Toolkit.
- Phân biệt sự khác nhau mấu chốt giữa hai loại Endpoints: **Query** (Đọc dữ liệu - `GET`) và **Mutation** (Thay đổi dữ liệu - `POST/PUT/DELETE`).
- Làm chủ hệ thống Thẻ **Automated Cache Invalidation** với `providesTags` và `invalidatesTags` để tự động làm mới dữ liệu mà không cần gọi API thủ công.
- Đăng ký `api.reducer` và `api.middleware` vào Redux Store chuẩn xác.
- Sử dụng các Auto-generated Hooks (`useGetCoursesQuery`, `useAddCourseMutation`) trong Component với đầy đủ trạng thái (`data`, `isLoading`, `isFetching`, `isError`).

---

## 📖 Definition

### 1. Tại Sao Cần RTK Query Thay Cho `createAsyncThunk` Thủ Công?

Khi quản lý dữ liệu từ API Server bằng `createAsyncThunk` truyền thống, bạn phải tự tay viết hàng nghìn dòng code lặp đi lặp lại:
1. Tạo Slice state chứa `data`, `isLoading`, `error`.
2. Viết `extraReducers` cho 3 trạng thái `pending`, `fulfilled`, `rejected`.
3. Tự viết logic phòng chống gọi trùng request (`Deduplication`).
4. Tự viết logic xóa bộ đệm (Invalidate Cache) khi người dùng thêm/sửa/xóa một sản phẩm.

**RTK Query** là một công cụ mạnh mẽ được tích hợp sẵn trong Redux Toolkit dành riêng cho tác vụ Data Fetching & Caching.

RTK Query giúp giải quyết tự động 100% các bài toán:
- **Tự động Caching (Bộ nhớ đệm):** Giữ dữ liệu API trong RAM. Nếu 3 Component cùng gọi 1 API, RTK Query chỉ gửi **duy nhất 1 HTTP Request** (Deduplication).
- **Tự động Xóa Cache & Refetch:** Tự động gọi lại API lấy danh sách mới ngay khi người dùng vừa thực hiện hành động Thêm/Sửa/Xóa.
- **Tự động Quản lý Vòng đời Data:** Xóa cache khỏi RAM khi không còn Component nào tiêu thụ dữ liệu sau $N$ giây (Garbage Collection).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   HỆ THỐNG AUTOMATED CACHE INVALIDATION                │
└────────────────────────────────────────────────────────────────────────┘

  [ Query: getCourses ] ──( 1. Provides Tag )──> [ Cache Tag: 'Course' ]
                                                           ▲
                                                           │ (3. Invalidate
                                                           │    Refetch)
  [ Mutation: addCourse ] ──( 2. Invalidates Tag )─────────┘
```

---

## 2. Phân Biên: Query Endpoints vs Mutation Endpoints

Trong RTK Query, mọi API endpoint đều được chia làm 2 loại duy nhất:

1. **Query Endpoints (Đọc dữ liệu - HTTP GET):**
   - Dùng để đọc và lấy dữ liệu từ Server.
   - RTK Query sẽ tự động sinh ra một React Hook có tên chuẩn: `use<EndpointName>Query()`.
   - Hook này trả về đối tượng: `{ data, isLoading, isFetching, isError, error, refetch }`.

2. **Mutation Endpoints (Thay đổi dữ liệu - HTTP POST / PUT / DELETE):**
   - Dùng để tạo mới, cập nhật hoặc xóa dữ liệu trên Server.
   - RTK Query tự động sinh ra Hook có tên chuẩn: `use<EndpointName>Mutation()`.
   - Hook này trả về một mảng chứa 2 phần tử: `[triggerFunction, { isLoading, isSuccess, isError }]`.

---

## 3. Cơ Chế Thẻ Tự Động Xóa Đệm (Automated Cache Invalidation via Tags)

RTK Query sử dụng khái niệm **Tags** (Thẻ đánh dấu) để liên kết giữa Query đọc dữ liệu và Mutation biến đổi dữ liệu:

- **Query `getCourses`** khai báo: `providesTags: ['Course']` (Báo cho RTK Query biết dữ liệu này gắn với nhãn 'Course').
- **Mutation `addCourse`** khai báo: `invalidatesTags: ['Course']` (Báo rằng khi hành động thêm khóa học thành công, nhãn 'Course' đã bị lỗi thời).
- **Kết quả:** Ngay khi `addCourse` thành công, RTK Query sẽ **tự động kích hoạt chạy lại (Refetch) tất cả các Query đang mở có gắn nhãn 'Course'** hoàn toàn ngầm định bên dưới!

---

## 💻 Syntax

### 1. Cấu trúc Khai báo API Service với `createApi`
```javascript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const courseApi = createApi({
  reducerPath: "courseApi", // Tên slice trong Redux Store
  baseQuery: fetchBaseQuery({ 
    baseUrl: "https://api.educonnect.vn/api/v1/",
    prepareHeaders: (headers, { getState }) => {
      // Tự động gắn Token vào mọi Request
      const token = getState().auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    }
  }),
  tagTypes: ["Course", "User"], // Khai báo danh sách các nhãn Thẻ
  endpoints: (builder) => ({
    // GET Query
    getCourses: builder.query({
      query: () => "courses",
      providesTags: (result) => 
        result 
          ? [...result.map(({ id }) => ({ type: "Course", id })), { type: "Course", id: "LIST" }]
          : [{ type: "Course", id: "LIST" }]
    }),
    // POST Mutation
    addCourse: builder.mutation({
      query: (newCourse) => ({
        url: "courses",
        method: "POST",
        body: newCourse
      }),
      invalidatesTags: [{ type: "Course", id: "LIST" }] // Làm mới cache danh sách
    })
  })
});

// Export Auto-generated Hooks
export const { useGetCoursesQuery, useAddCourseMutation } = courseApi;
```

---

## 📝 Example 1 - Đăng Ký RTK Query Reducer & Middleware vào Redux Store

```javascript
// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import { courseApi } from "./courseApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // 1. Đăng ký Reducer của RTK Query theo reducerPath
    [courseApi.reducerPath]: courseApi.reducer
  },
  // 2. BẮT BUỘC: Thêm Middleware của RTK Query để quản lý Caching, Polling, và Invalidation
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(courseApi.middleware)
});
```

---

## 📝 Example 2 - Sử Dụng `useGetCoursesQuery` Đọc Dữ Liệu Trong Component

```jsx
// src/components/CourseCatalog.jsx
import React from "react";
import { useGetCoursesQuery } from "../store/courseApi";

export function CourseCatalog() {
  // RTK Query tự động gọi API khi component mount và quản lý cache
  const { 
    data: courses, 
    isLoading, 
    isFetching, 
    isError, 
    error, 
    refetch 
  } = useGetCoursesQuery(undefined, {
    pollingInterval: 60000, // Tự động refetch làm tươi dữ liệu mỗi 60 giây
    refetchOnMountOrArgChange: true
  });

  // 1. Lần đầu nạp chưa có cache
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-slate-600 font-medium">⏳ Đang tải dữ liệu từ RTK Query Cache...</p>
      </div>
    );
  }

  // 2. Xử lý Lỗi
  if (isError) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl">
        <p className="font-bold">❌ Lỗi Tải API: {error?.status || "Lỗi mạng"}</p>
        <button 
          onClick={refetch}
          className="mt-3 bg-red-600 text-white px-4 py-1.5 rounded text-sm font-medium"
        >
          Thử Lại (Refetch)
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Danh Sách Khóa Học ({courses?.length || 0})
          {isFetching && <span className="ml-2 text-xs text-blue-600 font-normal">🔄 Đang cập nhật ngầm...</span>}
        </h2>
        <button
          onClick={refetch}
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          🔄 Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <div key={course.id} className="p-5 border rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
            <h3 className="font-bold text-lg text-slate-900 mb-2">{course.title}</h3>
            <p className="text-blue-600 font-bold">{course.price?.toLocaleString()} VNĐ</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📝 Example 3 - Sử Dụng Mutation `useAddCourseMutation` Với Auto-Cache Invalidation

```jsx
// src/components/AddCourseModal.jsx
import React, { useState } from "react";
import { useAddCourseMutation } from "../store/courseApi";

export function AddCourseModal({ onClose }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(500000);

  // Hook Mutation trả về [triggerFunction, { isLoading, isError }]
  const [addCourse, { isLoading, isError, error }] = useAddCourseMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      // Gọi trigger function gửi request POST. Dùng .unwrap() để bắt error nếu có
      const result = await addCourse({ title, price }).unwrap();
      console.log("Thêm mới thành công:", result);
      
      alert("✅ Thêm khóa học thành công! Danh sách tự động refetch!");
      onClose();
      // 💡 KHÔNG CẦN DISPATCH FETCH LẠI! RTK Query tự động refetch useGetCoursesQuery nhờ invalidatesTags!
    } catch (err) {
      console.error("Lỗi thêm khóa học:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Thêm Khóa Học Mới</h3>

        {isError && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            ❌ Thêm thất bại: {error?.data?.message || "Lỗi máy chủ"}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tên khóa học:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên khóa học..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Giá tiền (VNĐ):</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? "⏳ Đang tạo..." : "+ Tạo Mới"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Bắt Bắt Thêm `middleware` Trong `configureStore`:** Nếu bạn quên thêm `courseApi.middleware` vào mảng middleware của Store, các tính năng tự động làm mới bộ đệm (Automated Invalidation), Polling, và Refetch on Focus sẽ bị vô hiệu hóa hoàn toàn mà không báo lỗi rõ ràng.
2. **Khác biệt Giữa `isLoading` và `isFetching`:**
   - **`isLoading` (`true`):** Chỉ xảy ra ở LẦN ĐẦU TIÊN gọi API khi chưa hề có dữ liệu nào trong bộ đệm RAM (Dùng để bật Skeleton Loading toàn màn hình).
   - **`isFetching` (`true`):** Xảy ra ở MỌI LẦN gọi API (kể cả lần đầu lẫn những lần refetch làm tươi dữ liệu ngầm). Trong lúc `isFetching = true`, `data` cũ vẫn tồn tại để UI hiển thị mượt mà không bị trắng màn hình.

---

## ❌ Common Mistakes

### Sai 1 - Đặt tên Auto-generated Hook sai chuẩn định dạng của RTK Query
```javascript
// ❌ SAI: Nhầm tên endpoint hoặc định dạng hook
import { useGetCourses } from "./courseApi"; // undefined!

// ✅ ĐÚNG CHUẨN NGUYÊN TẮC TỰ ĐỘNG SINH HOOK CỦA RTK QUERY:
// Quy tắc: "use" + TênEndpointViếtHoa + "Query" (hoặc "Mutation")
// Endpoint name: "getCourses" ➔ Hook: useGetCoursesQuery
// Endpoint name: "addCourse"  ➔ Hook: useAddCourseMutation
```

### Sai 2 - Quên khai báo `tagTypes` ở đối tượng root của `createApi`
```javascript
// ❌ SAI: Dùng invalidatesTags: ['Course'] nhưng quên khai báo tagTypes: ['Course'] ở root
export const api = createApi({
  baseQuery: ...,
  // Quên line: tagTypes: ['Course'],
  endpoints: (builder) => ({ ... })
});
// Kết quả: System sẽ ném cảnh báo Tag type not provided!
```

---

## 📚 Summary

- **RTK Query** quản lý bộ đệm và trạng thái dữ liệu Server (Server State) chuyên nghiệp.
- **`builder.query`** dành cho tác vụ đọc dữ liệu (`GET`); **`builder.mutation`** dành cho tác vụ thay đổi dữ liệu (`POST/PUT/DELETE`).
- Bắt buộc đăng ký `api.reducer` và `api.middleware` vào Redux `configureStore`.
- Hệ thống **Tags (`providesTags` & `invalidatesTags`)** tự động làm mới bộ đệm (Refetch) ngầm ngay khi dữ liệu bị thay đổi.
- Phân biệt **`isLoading`** (lần đầu chưa có dữ liệu) và **`isFetching`** (đang refetch ngầm).

---

## 📝 Quiz

### Question 1
RTK Query phân chia các endpoints thành hai loại chính nào để phân định rõ ràng giữa tác vụ đọc dữ liệu và tác vụ biến đổi dữ liệu?

A. `builder.get` và `builder.post`  
B. `builder.query` (đọc dữ liệu GET) và `builder.mutation` (thay đổi dữ liệu POST/PUT/DELETE)  
C. `builder.read` và `builder.write`  
D. `builder.fetch` và `builder.send`  

**Explanation:**  
Trong RTK Query, `builder.query` được thiết kế chuyên biệt cho việc đọc dữ liệu (HTTP GET) kèm theo cơ chế Caching, trong khi `builder.mutation` được thiết kế cho việc gửi các lệnh biến đổi dữ liệu (HTTP POST, PUT, DELETE) kèm cơ chế Invalidate Tags.

**Answer: B**

---

### Question 2
Sự khác nhau cốt lõi về mặt trải nghiệm người dùng giữa hai cờ trạng thái `isLoading` và `isFetching` do `useQuery` Hook trả về là gì?

A. `isLoading` dùng cho mobile, `isFetching` dùng cho desktop  
B. `isLoading` chỉ bằng `true` ở lần đầu gọi API khi chưa có dữ liệu trong RAM; trong khi `isFetching` bằng `true` ở mọi lượt gọi API (kể cả lượt refetch ngầm mà UI vẫn giữ nguyên data cũ)  
C. `isLoading` chạy chậm hơn  
D. Cả hai hoàn toàn giống nhau  

**Explanation:**  
`isLoading` bằng `true` khi request đầu tiên đang chạy và chưa có dữ liệu cache (cần hiện Spinner/Skeleton toàn màn hình). `isFetching` bằng `true` bất cứ khi nào một request đang chạy (kể cả refetch ngầm), giúp UI hiển thị một icon xoay nhỏ ở góc màn hình mà không làm gián đoạn trải nghiệm người dùng với data cũ.

**Answer: B**

---

### Question 3
Cơ chế hệ thống Thẻ (Tags) với bộ đôi `providesTags` trong Query và `invalidatesTags` trong Mutation giải quyết bài toán quan trọng nào?

A. Tự động mã hóa mật khẩu  
B. Tự động xóa bộ đệm cũ bị lỗi thời và kích hoạt refetch nạp lại dữ liệu mới nhất (Auto Cache Invalidation & Refetch) ngay sau khi thao tác mutation thành công  
C. Tự động thay đổi màu sắc CSS  
D. Tự động đăng xuất người dùng  

**Explanation:**  
Khi Mutation `addCourse` hoàn thành với `invalidatesTags: ['Course']`, RTK Query sẽ tìm tất cả các Query đang hiển thị có gắn `providesTags: ['Course']` và đánh dấu bộ đệm đó đã lỗi thời, tự động gửi request `getCourses` mới để cập nhật UI ngay lập tức.

**Answer: B**
