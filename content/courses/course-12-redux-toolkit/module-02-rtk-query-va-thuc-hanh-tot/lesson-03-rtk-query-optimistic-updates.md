---
id: redux-toolkit-m2-l3
course: State Management — Redux Toolkit & Modern State
module: RTK Query và thực hành tốt
title: Advanced RTK Query: Optimistic Updates, Polling & Rehydration
order: 3
difficulty: Advanced
estimatedTime: 240
---
# Advanced RTK Query: Optimistic Updates, Polling & Rehydration

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Giải thích bản chất kỹ thuật **Optimistic Updates** (Cập nhật giao diện lạc quan trong 0ms) và so sánh với **Pessimistic Updates** (Cập nhật bi quan).
- Làm chủ quy trình cập nhật và hoàn tác dữ liệu (**Rollback Mechanism**) khi Optimistic Update gặp sự cố lỗi máy chủ.
- Sử dụng phương thức `onQueryStarted` để vá bộ đệm cục bộ với `dispatch(api.util.updateQueryData())`.
- Cấu hình tính năng tự động thăm dò dữ liệu theo chu kỳ **Polling (`pollingInterval`)** cho các ứng dụng dữ liệu thời gian thực.
- Cấu hình tự động làm mới bộ đệm khi người dùng quay lại tab trình duyệt (**Refetch on Focus** / **Refetch on Reconnect**).
- Khôi phục và duy trì bộ nhớ đệm Redux qua cơ chế **Rehydration**.

---

## 📖 Definition

### 1. Phân Biên: Pessimistic Updates vs Optimistic Updates

Trong các ứng dụng tương tác cao (như bấm nút Like bài viết, thả tim, check-in công việc, xóa bình luận):

- **Pessimistic Updates (Cập nhật bi quan - Mặc định):**
  - Người dùng bấm nút "Like".
  - Giao diện hiển thị icon Loading, chờ 500ms cho HTTP Request gửi lên Server và nhận kết quả phản hồi 200 OK.
  - Giao diện mới chuyển icon Like sang màu đỏ.
  - *Đánh giá:* An toàn nhưng mang lại cảm giác giật lag, chậm chạp cho người dùng.

- **Optimistic Updates (Cập nhật lạc quan - Nâng cao):**
  - Người dùng bấm nút "Like".
  - Giao diện **ngay lập tức trong 0ms** chuyển icon Like sang màu đỏ và tăng số lượt Like lên 1.
  - Đồng thời gửi HTTP Request lên Server ở background.
  - Nếu Server trả về lỗi 500: Giao diện tự động **Rollback (hoàn tác)** trở lại icon cũ và số lượt Like ban đầu, kèm theo một thông báo Toast lỗi ngắn gọn.
  - *Đánh giá:* Mang lại trải nghiệm phản hồi tức thì mượt mà như ứng dụng Desktop Native.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   QUY TRÌNH OPTIMISTIC UPDATES VÀ ROLLBACK             │
└────────────────────────────────────────────────────────────────────────┘

 [ User Click Like ] ───> 1. Gán UI màu đỏ NGAY LẬP TỨC (0ms)
                                  │
                                  ├─> 2. Gửi API PATCH /posts/1 ngầm
                                  │
               ┌──────────────────┴──────────────────┐
               ▼                                     ▼
        [ API THÀNH CÔNG ]                    [ API THẤT BẠI ]
               │                                     │
     3A. Giữ nguyên UI màu đỏ               3B. Gọi patchResult.undo()
                                                (Rollback về màu cũ + Toast lỗi)
```

---

## 2. Phương Thức `onQueryStarted` và Utility `updateQueryData`

Trong RTK Query, để thực hiện Optimistic Update, bạn sử dụng thuộc tính `onQueryStarted` bên trong khai báo mutation endpoint:

- **`onQueryStarted(arg, { dispatch, queryFulfilled })`**: Hàm này được RTK Query tự động gọi ngay tại thời điểm mutation **VỪA BẮT ĐẦU** (trước khi HTTP request có phản hồi).
- **`dispatch(api.util.updateQueryData(endpointName, args, draft => { ... }))`**: Dùng để cập nhật trực tiếp bản nháp (Draft) của bộ đệm Query đang mở.
- **`patchResult.undo()`**: Trả về từ lệnh dispatch ở trên. Nếu khối `await queryFulfilled` bị ném lỗi, gọi `patchResult.undo()` để khôi phục bộ đệm cũ trong 0.1ms!

---

## 3. Polling Interval & Refetch On Focus

- **Polling (`pollingInterval`):** Đặt một khoảng thời gian (tính bằng ms). RTK Query sẽ tự động chạy lại Query ở background sau mỗi khoảng thời gian đó. Nếu không có Component nào mount trên màn hình tiêu thụ Query này, Polling sẽ tự động tạm dừng để tiết kiệm tài nguyên.
- **Refetch on Focus (`refetchOnFocus`):** Tự động gửi request làm tươi dữ liệu khi người dùng chuyển từ một tab khác quay trở lại tab ứng dụng.
- **Refetch on Reconnect (`refetchOnReconnect`):** Tự động refetch dữ liệu khi thiết bị lấy lại kết nối mạng Internet.

---

## 💻 Syntax

### Optimistic Update Code Blueprint
```javascript
toggleLike: builder.mutation({
  query: ({ postId, isLiked }) => ({
    url: `posts/${postId}/like`,
    method: "PATCH",
    body: { isLiked }
  }),
  async onQueryStarted({ postId, isLiked }, { dispatch, queryFulfilled }) {
    // 1. Cập nhật lạc quan Cache cục bộ NGAY LẬP TỨC
    const patchResult = dispatch(
      postApi.util.updateQueryData("getPostById", postId, (draft) => {
        draft.isLiked = isLiked;
        draft.likeCount += isLiked ? 1 : -1;
      })
    );

    try {
      // 2. Chờ API phản hồi
      await queryFulfilled;
    } catch {
      // 3. Nếu Server bị lỗi -> HOÀN TÁC (Rollback) lại cache cũ!
      patchResult.undo();
    }
  }
})
```

---

## 📝 Example 1 - Cài Đặt Optimistic Update Cho Nút Đánh Dấu Hoàn Thành Công Việc (Todo Task)

```javascript
// src/store/todoApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const todoApi = createApi({
  reducerPath: "todoApi",
  baseQuery: fetchBaseQuery({ baseUrl: "https://jsonplaceholder.typicode.com/" }),
  tagTypes: ["Todo"],
  endpoints: (builder) => ({
    getTodos: builder.query({
      query: () => "todos?_limit=5",
      providesTags: ["Todo"]
    }),
    toggleTodoStatus: builder.mutation({
      query: ({ id, completed }) => ({
        url: `todos/${id}`,
        method: "PATCH",
        body: { completed }
      }),
      // Thực hiện Optimistic Update
      async onQueryStarted({ id, completed }, { dispatch, queryFulfilled }) {
        // 1. Vá bộ đệm 'getTodos' ngay lập tức
        const patchResult = dispatch(
          todoApi.util.updateQueryData("getTodos", undefined, (draft) => {
            const todo = draft.find((t) => t.id === id);
            if (todo) {
              todo.completed = completed; // Cập nhật trạng thái trong 0ms
            }
          })
        );

        try {
          // 2. Chờ Server xác nhận
          await queryFulfilled;
        } catch (err) {
          // 3. Nếu thất bại -> Rollback lại ô checkbox cũ!
          patchResult.undo();
          alert("❌ Không thể cập nhật trạng thái trên Server. Đã hoàn tác!");
        }
      }
    })
  })
});

export const { useGetTodosQuery, useToggleTodoStatusMutation } = todoApi;
```

---

## 📝 Example 2 - Cấu Hình Polling & Refetch On Focus Cho Bảng Giá Chứng Khoán Real-time

```jsx
// src/components/RealtimeStockTicker.jsx
import React from "react";
import { todoApi } from "../store/todoApi";

export function RealtimeStockTicker() {
  // Cấu hình Polling tự động làm mới dữ liệu mỗi 5 giây
  const { data: todos, isLoading, isFetching } = todoApi.useGetTodosQuery(undefined, {
    pollingInterval: 5000, // Tự động refetch mỗi 5000ms
    refetchOnFocus: true,  // Tự động refetch khi người dùng quay lại tab
    refetchOnReconnect: true // Tự động refetch khi có lại mạng Wi-Fi
  });

  if (isLoading) return <div className="p-4">⏳ Đang khởi tạo bảng giá...</div>;

  return (
    <div className="p-6 bg-slate-900 text-white rounded-2xl max-w-lg mx-auto shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-emerald-400">Bảng Giá Chứng Khoán Realtime</h3>
        {isFetching && (
          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full animate-pulse">
            🔄 Live Sync (5s)
          </span>
        )}
      </div>

      <div className="space-y-2">
        {todos?.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
            <span className="text-sm truncate max-w-[250px]">{item.title}</span>
            <span className={`text-xs px-2 py-1 rounded font-bold ${item.completed ? "bg-emerald-600" : "bg-amber-600"}`}>
              {item.completed ? "TĂNG ▲" : "GIẢM ▼"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📝 Example 3 - Optimistic Delete Item Với Xử Lý Rollback Và Toast

```jsx
// src/components/OptimisticTodoList.jsx
import React from "react";
import { useGetTodosQuery, useToggleTodoStatusMutation } from "../store/todoApi";

export function OptimisticTodoList() {
  const { data: todos } = useGetTodosQuery();
  const [toggleTodo] = useToggleTodoStatusMutation();

  const handleCheckboxChange = (id, currentCompleted) => {
    // Kích hoạt mutation -> UI đổi trạng thái checkbox trong 0ms nhờ Optimistic Update!
    toggleTodo({ id, completed: !currentCompleted });
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl border shadow-sm">
      <h2 className="text-xl font-bold mb-4">Danh Sách Công Việc (Optimistic UI)</h2>
      <div className="space-y-3">
        {todos?.map((todo) => (
          <label key={todo.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-50 rounded">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleCheckboxChange(todo.id, todo.completed)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className={`text-sm ${todo.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
              {todo.title}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Bắt Bắt Đảm Bảo `queryFulfilled` Nằm Trong Khối `try...catch`:** Nếu bạn không bọc `await queryFulfilled` bên trong khối `try...catch`, khi Server trả về lỗi 4xx/5xx, ngoại lệ Unhandled Rejection sẽ bị ném ra và câu lệnh `patchResult.undo()` bên dưới sẽ không bao giờ được thực thi, làm mất khả năng Rollback.

---

## ❌ Common Mistakes

### Sai 1 - Truyền sai arguments vào `updateQueryData`
```javascript
// ❌ SAI: Query getTodos không nhận tham số (undefined), nhưng lại truyền id vào làm arg
dispatch(todoApi.util.updateQueryData("getTodos", id, (draft) => { ... }));
// Kết quả: RTK Query không tìm thấy cache key "getTodos(id)" nên Optimistic Update thất bại!

// ✅ ĐÚNG CHUẨN: Truyền đúng tham số arg mà Query getTodos đã dùng khi fetch (ví dụ undefined)
dispatch(todoApi.util.updateQueryData("getTodos", undefined, (draft) => { ... }));
```

---

## 📚 Summary

- **Optimistic Updates** cập nhật UI ngay lập tức trong 0ms và tự động **Rollback (`patchResult.undo()`)** nếu Server bị lỗi.
- Phương thức **`onQueryStarted`** được kích hoạt ngay khi mutation vừa khởi chạy.
- **`dispatch(api.util.updateQueryData(...))`** cho phép vá bộ đệm cục bộ ngắn hạn.
- **`pollingInterval`** tự động cập nhật dữ liệu API theo chu kỳ cố định (ms).
- **`refetchOnFocus`** tự động làm tươi bộ đệm khi người dùng chuyển tab quay lại ứng dụng.

---

## 📝 Quiz

### Question 1
Sự khác nhau mấu chốt về mặt trải nghiệm người dùng (UX) giữa Optimistic Updates và Pessimistic Updates là gì?

A. Optimistic Updates chạy chậm hơn 500ms  
B. Optimistic Updates cập nhật giao diện ngay lập tức trong 0ms trước khi Server phản hồi và tự động Rollback nếu API bị lỗi, trong khi Pessimistic Updates bắt người dùng phải chờ API trả về mới đổi UI  
C. Pessimistic Updates chỉ dùng cho ứng dụng di động  
D. Cả hai hoàn toàn giống nhau  

**Explanation:**  
Optimistic Updates mang lại cảm giác phản hồi tức thì 0ms bằng cách giả định thao tác sẽ thành công và vá UI ngay lập tức. Nếu API thất bại, hệ thống sẽ hoàn tác (Rollback) lại trạng thái cũ. In contrast, Pessimistic Updates chờ phản hồi OK từ máy chủ rồi mới cập nhật UI.

**Answer: B**

---

### Question 2
Phương thức nào được gọi trên đối tượng `patchResult` trong khối `catch` của `onQueryStarted` để hoàn tác lại bộ đệm cũ khi thao tác Optimistic Update gặp sự cố lỗi máy chủ?

A. `patchResult.rollback()`  
B. `patchResult.undo()`  
C. `patchResult.cancel()`  
D. `patchResult.reset()`  

**Explanation:**  
Khi gọi `dispatch(api.util.updateQueryData(...))`, hàm này trả về một đối tượng `patchResult` chứa phương thức `.undo()`. Nếu khối `await queryFulfilled` thất bại, việc gọi `patchResult.undo()` sẽ khôi phục bộ đệm về đúng trạng thái ban đầu trước khi sửa.

**Answer: B**

---

### Question 3
Tính năng Polling (`pollingInterval: 5000`) trong RTK Query sẽ tự động làm gì khi tất cả các Component tiêu thụ Query đó đều bị unmount khỏi màn hình?

A. Tiếp tục gửi request liên tục làm tốn băng thông  
B. Tự động tạm dừng Polling để tiết kiệm tài nguyên CPU và băng thông mạng  
C. Xóa toàn bộ Redux Store  
D. Tự động tắt trình duyệt  

**Explanation:**  
RTK Query theo dõi số lượng người tiêu thụ (Subscription reference count). Khi không còn Component nào hiển thị trên màn hình đăng ký sử dụng Query đó, RTK Query sẽ thông minh tự động tạm dừng Polling để tránh lãng phí tài nguyên mạng.

**Answer: B**
