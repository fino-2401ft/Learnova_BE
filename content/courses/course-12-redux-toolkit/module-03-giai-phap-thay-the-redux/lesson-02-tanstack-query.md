---
id: redux-toolkit-m3-l2
course: State Management — Redux Toolkit & Modern State
module: Giải pháp thay thế Redux
title: TanStack Query (React Query) — Server State Powerhouse
order: 2
difficulty: Advanced
estimatedTime: 240
---
# TanStack Query (React Query) — Server State Powerhouse

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích sự khác biệt mấu chốt giữa **Client State** (Trạng thái giao diện máy khách) và **Server State** (Trạng thái dữ liệu máy chủ).
- Sử dụng **TanStack Query v5 (React Query)** — Thư viện hàng đầu thế giới chuyên biệt cho quản lý, Caching, và Đồng bộ dữ liệu Server.
- Khởi tạo đối tượng `QueryClient` và bọc ứng dụng với `<QueryClientProvider>`.
- Làm chủ Hook **`useQuery`** (Fetch, Cache, Stale management) và **`useMutation`** (Cập nhật dữ liệu).
- Quản lý cấu trúc mảng **Query Keys** chuẩn mực để tự động làm tươi dữ liệu bằng `queryClient.invalidateQueries()`.
- Nắm vững quy trình quản lý thời gian dữ liệu: **`staleTime`** (thời gian dữ liệu tươi) và **`gcTime`** (thời gian lưu đệm RAM trước khi giải phóng rác).

---

## 📖 Definition

### 1. Phân Biên: Client State vs Server State

Một trong những bước ngoặt tư duy quan trọng nhất của lập trình viên React hiện đại là nhận ra sự khác biệt giữa hai loại dữ liệu:

1. **Client State (Trạng thái giao diện Cục bộ):**
   - Trực thuộc sở hữu 100% của trình duyệt.
   - Thường là các trạng thái giao diện như: Đóng/Mở Sidebar, Tab đang được chọn, Trạng thái bật/tắt Modal, Nội dung ô nhập liệu chưa submit.
   - Luôn luôn sẵn có trong RAM đồng bộ.
   - *Công cụ giải quyết:* `useState`, `useReducer`, Context API, Zustand, Redux.

2. **Server State (Trạng thái Dữ liệu Máy chủ):**
   - Thuộc sở hữu từ xa của Máy chủ/CSDL.
   - Thường là các danh sách sản phẩm, bài viết, thông tin hồ sơ cá nhân.
   - **Bất đồng bộ (Async):** Phải chờ nạp qua HTTP Request.
   - **Có thể bịỗi thời (Stale):** Dữ liệu trên Server có thể bị sửa đổi bởi người dùng khác bất cứ lúc nào mà Client không hề hay biết!
   - *Công cụ giải quyết chuyên biệt:* **TanStack Query (React Query)** hoặc RTK Query.

```text
┌────────────────────────────────────────────────────────────────────────┐
│               VÒNG ĐỜI DỮ LIỆU CACHE TRONG TANSTACK QUERY               │
└────────────────────────────────────────────────────────────────────────┘

  [ Fetch Data ] ───> [ Fresh State ] ──( staleTime: 5m )──> [ Stale State ]
                             │                                     │
                    Component mount lại                    Component mount lại
                    👉 Dùng data từ RAM                    👉 Dùng data từ RAM
                       (NO HTTP REQUEST)                      + Gửi HTTP Request
                                                                Background Refetch!
```

---

## 2. Hai Hằng Số Cốt Lõi: `staleTime` và `gcTime` (cacheTime)

TanStack Query phân chia vòng đời của một kết quả API Cache qua 2 tham số:

- **`staleTime` (Thời gian Dữ liệu được coi là Tươi mới):**
  - Mặc định = `0`.
  - Trong khoảng thời gian `staleTime` (ví dụ 5 phút), dữ liệu được coi là hoàn toàn mới. Nếu bất kỳ Component nào mount lại hoặc người dùng switch tab, TanStack Query sẽ lấy trực tiếp dữ liệu từ RAM mà **KHÔNG GỬI BẤT KỲ HTTP REQUEST NÀO**.
- **`gcTime` (Garbage Collection Time - Thời gian dọn dẹp rác):**
  - Mặc định = `5 phút`.
  - Khi không còn bất kỳ Component nào trên màn hình tiêu thụ Query Key đó, TanStack Query sẽ giữ dữ liệu trong RAM trong khoảng `gcTime` trước khi xóa hoàn toàn để giải phóng bộ nhớ.

---

## 3. Quản Lý Query Keys Chuẩn Mức (Query Keys Matrix)

Trong TanStack Query v5, `queryKey` **bắt buộc phải là một Mảng (Array)**. Query Key đóng vai trò là một khóa định danh duy nhất (Unique Hash Key) cho từng bộ đệm dữ liệu:

- Danh sách toàn bộ khóa học: `queryKey: ['courses']`
- Danh sách khóa học có bộ lọc: `queryKey: ['courses', { category: 'frontend', page: 1 }]`
- Chi tiết một khóa học: `queryKey: ['courses', 'detail', courseId]`

Khi bất kỳ giá trị nào bên trong mảng Query Key thay đổi (ví dụ `page` đổi từ 1 sang 2), TanStack Query sẽ **tự động kích hoạt gọi API nạp dữ liệu cho trang mới!**

---

## 💻 Syntax

### 1. Khởi tạo QueryClientProvider
```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dữ liệu tươi trong 5 phút
      gcTime: 1000 * 60 * 30,    // Giữ cache trong RAM 30 phút
      refetchOnWindowFocus: false // Tắt tự động refetch khi focus tab
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 2. Standard `useQuery` Syntax
```typescript
const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
  queryKey: ["courses", category],
  queryFn: () => fetchCourses(category),
  enabled: !!category // Chỉ chạy query khi category có giá trị
});
```

---

## 📝 Example 1 - Đọc Dữ Liệu Với `useQuery` và Cấu Hình Dynamic Query Keys

```tsx
// src/features/courses/CourseList.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Course {
  id: number;
  title: string;
  body: string;
}

// API Service function thuần túy
async function fetchCourses(category: string): Promise<Course[]> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts?_limit=4&cat=${category}`);
  if (!res.ok) {
    throw new Error("Không thể tải danh sách khóa học từ máy chủ");
  }
  return res.json();
}

export function CourseList() {
  const [category, setCategory] = useState("frontend");

  // useQuery quản lý Caching, Loading, và Automatic Refetch khi `category` thay đổi
  const {
    data: courses,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["courses", category], // Query Key mảng động
    queryFn: () => fetchCourses(category),
    staleTime: 1000 * 60 * 2, // Coi dữ liệu tươi trong 2 phút
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-slate-600">⏳ Đang nạp dữ liệu lần đầu từ Server...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl">
        <p className="font-bold">❌ Lỗi: {(error as Error).message}</p>
        <button onClick={() => refetch()} className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Danh Sách Khóa Học
          {isFetching && <span className="ml-2 text-xs text-blue-600 font-normal">🔄 (Đang Sync ngầm...)</span>}
        </h2>

        <div className="space-x-2">
          <button
            onClick={() => setCategory("frontend")}
            className={`px-3 py-1 rounded ${category === "frontend" ? "bg-blue-600 text-white" : "bg-slate-200"}`}
          >
            Frontend
          </button>
          <button
            onClick={() => setCategory("backend")}
            className={`px-3 py-1 rounded ${category === "backend" ? "bg-blue-600 text-white" : "bg-slate-200"}`}
          >
            Backend
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses?.map((c) => (
          <div key={c.id} className="p-4 border rounded-xl bg-white shadow-sm">
            <h3 className="font-bold text-lg mb-1">{c.title}</h3>
            <p className="text-slate-500 text-sm line-clamp-2">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📝 Example 2 - Biến Đổi Dữ Liệu Với `useMutation` Và Tự Động Invalidate Cache

```tsx
// src/features/courses/AddCourseForm.tsx
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function createCourseApi(newCourse: { title: string; price: number }) {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newCourse)
  });
  if (!res.ok) throw new Error("Không thể tạo khóa học mới");
  return res.json();
}

export function AddCourseForm() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient(); // Truy cập đối tượng QueryClient

  // useMutation xử lý tác vụ POST
  const mutation = useMutation({
    mutationFn: createCourseApi,
    onSuccess: (data) => {
      alert("✅ Thêm khóa học thành công!");
      setTitle("");

      // 💡 AUTOMATED CACHE INVALIDATION:
      // Làm mới toàn bộ các Query có chứa prefix key ['courses']!
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err: Error) => {
      alert("❌ Thất bại: " + err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    mutation.mutate({ title, price: 990000 });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-xl max-w-md space-y-3">
      <h3 className="font-bold text-lg">Tạo Khóa Học (TanStack Mutation)</h3>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tên khóa học mới..."
        className="w-full border p-2 rounded"
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
      >
        {mutation.isPending ? "⏳ Đang tạo..." : "+ Thêm Khóa Học"}
      </button>
    </form>
  );
}
```

---

## ⚠️ Notes

1. **Khác biệt v4 và v5 TanStack Query:**
   - Trong TanStack Query v5, `cacheTime` được đổi tên chính thức thành **`gcTime`** (Garbage Collection Time) để thể hiện đúng bản chất dọn dẹp rác.
   - `queryKey` **bắt buộc phải là mảng** (Array), không còn hỗ trợ truyền chuỗi string đơn như v3/v4 cũ.

---

## ❌ Common Mistakes

### Sai 1 - Đưa dữ liệu Server State từ TanStack Query vào Redux Store một cách dư thừa
```tsx
// ❌ SAI TAI HẠI: Vừa dùng TanStack Query vừa dispatch lưu data vào Redux!
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
useEffect(() => {
  if (data) dispatch(setUsers(data)); // ❌ DƯ THỪA HOÀN TOÀN!
}, [data]);

// ✅ ĐÚNG CHUẨN: Để TanStack Query tự quản lý Server State của nó. Đọc data trực tiếp từ useQuery ở nơi cần dùng!
```

---

## 📚 Summary

- **Server State** (API Data) cần công cụ quản lý chuyên biệt như **TanStack Query**.
- **`useQuery`** dùng cho tác vụ đọc dữ liệu (`GET`), tự động quản lý Cache, Loading, và Refetch.
- **`useMutation`** dùng cho tác vụ biến đổi dữ liệu (`POST/PUT/DELETE`).
- **`staleTime`** quy định thời gian dữ liệu tươi mới (không gọi lại API); **`gcTime`** quy định thời gian lưu cache RAM trước khi giải phóng rác.
- Dùng **`queryClient.invalidateQueries({ queryKey })`** để tự động nạp lại dữ liệu mới sau khi Mutation thành công.

---

## 📝 Quiz

### Question 1
Sự khác biệt bản chất mấu chốt giữa Client State (như trạng thái đóng/mở Sidebar) và Server State (như danh sách sản phẩm từ CSDL) là gì?

A. Client State chạy chậm hơn  
B. Server State thuộc sở hữu từ xa của máy chủ, bất đồng bộ, và có thể bị lỗi thời (Stale) bất kỳ lúc nào do hành động của người dùng khác  
C. Client State bắt buộc phải lưu trong Postgres CSDL  
D. Cả hai giống hệt nhau  

**Explanation:**  
Server State nằm ở máy chủ từ xa, phải truy cập bất đồng bộ qua mạng, và có nguy cơ bị lỗi thời do người dùng khác cập nhật CSDL. Do đó nó cần các tính năng Caching, Invalidation và Auto Refetch của TanStack Query.

**Answer: B**

---

### Question 2
Trong TanStack Query v5, tham số cấu hình `staleTime: 60000` (1 phút) mang ý nghĩa gì đối với hiệu năng ứng dụng?

A. Sau 1 phút trang web tự động tắt  
B. Trong vòng 1 phút kể từ khi nạp dữ liệu, dữ liệu được coi là "tươi mới", nếu Component mount lại thì TanStack Query lấy trực tiếp data từ RAM mà KHÔNG GỬI BẤT KỲ HTTP REQUEST NÀO  
C. Tự động xóa CSDL sau 1 phút  
D. Giới hạn thời gian gõ phím  

**Explanation:**  
`staleTime` định nghĩa khoảng thời gian dữ liệu được coi là fresh (tươi mới). Khi `staleTime` chưa hết hạn, TanStack Query sẽ phục vụ dữ liệu trực tiếp từ bộ nhớ đệm RAM trong 0ms mà không gửi lại HTTP request.

**Answer: B**

---

### Question 3
Hàm nào được gọi trên đối tượng `queryClient` bên trong callback `onSuccess` của `useMutation` để làm mới và nạp lại bộ đệm cho một danh sách dữ liệu cũ?

A. `queryClient.invalidateQueries({ queryKey })`  
B. `queryClient.clear()`  
C. `queryClient.resetStore()`  
D. `queryClient.deleteCache()`  

**Explanation:**  
`queryClient.invalidateQueries({ queryKey })` đánh dấu các Query matching với `queryKey` đó thành lỗi thời (stale) và tự động kích hoạt nạp lại (refetch) dữ liệu mới nhất từ Server để giao diện UI cập nhật đồng bộ.

**Answer: A**
