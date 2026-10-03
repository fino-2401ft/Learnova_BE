---
id: react-router-api-m1-l3
course: React Router & API Integration
module: Định tuyến với React Router
title: Advanced Routing: Loaders, Actions, Error Boundaries & Deferred Data
order: 3
difficulty: Advanced
estimatedTime: 240
---
# Advanced Routing: Loaders, Actions, Error Boundaries & Deferred Data

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững kiến trúc Data APIs trong **React Router v6.4+** (`loader`, `action`, `errorElement`, `defer`).
- Phân tích sự khác nhau giữa luồng nạp dữ liệu truyền thống (useEffect Waterfall) và luồng nạp dữ liệu song song **Data Pre-fetching với `loader`**.
- Sử dụng **`loader`** để tải trước dữ liệu API trước khi render Component giao diện và trích xuất qua Hook **`useLoaderData`**.
- Xử lý các thao tác nộp Form bằng **`action`** kết hợp thẻ **`<Form>`** và Hook **`useActionData`**.
- Khoanh vùng bắt lỗi giao diện cục bộ của từng đường dẫn với **`errorElement`** và **`useRouteError`**.
- Tích hợp kỹ thuật **Deferred Data (`defer` & `<Await>`)** để stream dữ liệu API chậm mà không làm nghẽn quá trình chuyển trang.

---

## 📖 Definition

### 1. Thách Thức Của Luồng Nạp Dữ Liệu Cũ (useEffect Waterfalling)

Trong các ứng dụng React truyền thống:
1. Người dùng click chuyển hướng sang trang `/courses/101`.
2. Trình duyệt tải mã nguồn JS của trang `CourseDetail`.
3. Component `CourseDetail` render lần đầu tiên với màn hình Loading trắng.
4. Hàm `useEffect` được kích hoạt và mới bắt đầu gửi HTTP Request lấy dữ liệu từ API Server.
5. Khi API trả về ➔ `setState` ➔ Component render lại với dữ liệu thật.

Quy trình này gây ra hiện tượng **Waterfalling (Nạp nối đuôi chậm)**: Thời gian chờ = Thời gian tải JS + Thời gian gọi API.

---

## 2. Giải Pháp Data APIs Trong React Router v6.4+

React Router v6.4+ giới thiệu kiến trúc Data APIs:

- **`loader` (Tải dữ liệu trước):** Là một hàm async chạy **TRƯỚC KHI** Component được render. Trình duyệt thực hiện nạp dữ liệu API song song với quá trình nạp mã nguồn JS.
- **`action` (Xử lý nộp Form):** Hàm async xử lý các thao tác mutation (`POST`, `PUT`, `DELETE`).
- **`errorElement` (Error Boundary Cục bộ):** Nếu hàm `loader` hay `action` bị ném ngoại lệ lỗi (404, 500), chỉ riêng khung giao diện của Route đó hiển thị trang báo lỗi, các phần giao diện chung xung quanh (như Header, Navigation, Sidebar) vẫn hoạt động bình thường!

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   LUỒNG TẢI DỮ LIỆU BAN ĐẦU CỦA ROUTER LOADER          │
└────────────────────────────────────────────────────────────────────────┘

 [ Click Link: /courses/101 ]
          │
          ├──> 1. Gọi Loader Function (Fetch API /courses/101) ──┐
          │                                                       ├──> (Data sẵn sàng)
          └──> 2. Tải Mã Nguồn Component CourseDetailPage ───────┘
                                   │
                                   ▼
                       [ Render CourseDetailPage ]
                      (Có ngay data từ useLoaderData)
```

---

## 💻 Syntax

### Data Router Configuration Pattern
```jsx
import { createBrowserRouter, RouterProvider, useLoaderData, Form, redirect } from "react-router-dom";

// 1. Loader Function
async function courseLoader({ params }) {
  const res = await fetch(`/api/courses/${params.id}`);
  if (res.status === 404) throw new Response("Course Not Found", { status: 404 });
  return res.json();
}

// 2. Action Function
async function createCourseAction({ request }) {
  const formData = await request.formData();
  await api.post("/courses", Object.fromEntries(formData));
  return redirect("/courses");
}

// 3. Router Config
const router = createBrowserRouter([
  {
    path: "courses/:id",
    element: <CourseDetailPage />,
    loader: courseLoader,
    action: createCourseAction,
    errorElement: <CourseErrorBoundary />
  }
]);
```

---

## 📝 Example 1 - Tải Dữ Liệu Trước Với `loader` Và Bắt Lỗi Lớp Cục Bộ Với `errorElement`

```jsx
// src/pages/PostDetailPage.jsx
import React from "react";
import { useLoaderData, useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export interface Post {
  id: number;
  title: string;
  body: string;
}

// 1. Loader Function chạy trước khi Component render
export async function postDetailLoader({ params }) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${params.id}`);

  if (response.status === 404) {
    throw new Response("Bài viết bạn tìm kiếm không tồn tại trên hệ thống!", { status: 404 });
  }

  if (!response.ok) {
    throw new Error("Lỗi máy chủ khi nạp dữ liệu bài viết!");
  }

  return response.json();
}

// 2. Component Giao diện sử dụng useLoaderData()
export function PostDetailPage() {
  // Dữ liệu đã sẵn sàng 100% khi Component render! Không cần useState/useEffect
  const post = useLoaderData();

  return (
    <article className="max-w-2xl mx-auto p-6 bg-white rounded-2xl border shadow-sm space-y-4">
      <Link to="/posts" className="text-sm text-blue-600 hover:underline">← Quay lại danh sách</Link>
      <h1 className="text-3xl font-bold text-slate-900">{post.title}</h1>
      <p className="text-slate-700 leading-relaxed">{post.body}</p>
    </article>
  );
}

// 3. Component Bắt Lỗi Cục Bộ (Error Boundary)
export function PostErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl">
        <h3 className="font-bold text-lg mb-2">⚠️ Lỗi Route {error.status}</h3>
        <p className="text-sm mb-4">{error.data}</p>
        <Link to="/posts" className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium">
          Quay lại danh sách bài viết
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-red-50 text-red-700 rounded-xl">
      <h3 className="font-bold text-lg">❌ Lỗi Không Xác Định!</h3>
      <p className="text-sm">{(error as Error)?.message || "Đã xảy ra sự cố."}</p>
    </div>
  );
}
```

---

## 📝 Example 2 - Xử Lý Nộp Form Bằng `action` Kết Hợp Thẻ `<Form>` Của React Router

```jsx
// src/pages/CreatePostPage.jsx
import React from "react";
import { Form, redirect, useActionData, useNavigation } from "react-router-dom";

// 1. Action Function xử lý nộp dữ liệu Form
export async function createPostAction({ request }) {
  const formData = await request.formData();
  const title = formData.get("title");
  const body = formData.get("body");

  // Validate ở phía Server/Router
  if (typeof title !== "string" || title.length < 5) {
    return { error: "Tiêu đề bài viết phải từ 5 ký tự trở lên!" };
  }

  const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, userId: 1 })
  });

  if (response.ok) {
    // Tự động chuyển hướng về trang danh sách sau khi tạo thành công!
    return redirect("/posts");
  }

  return { error: "Không thể tạo bài viết trên máy chủ" };
}

// 2. Component Giao diện
export function CreatePostPage() {
  const actionData = useActionData(); // Đọc kết quả/lỗi trả về từ Action
  const navigation = useNavigation();  // Đọc trạng thái chuyển trang

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border shadow-md">
      <h2 className="text-2xl font-bold mb-4">Tạo Bài Viết Mới (Router Action)</h2>

      {actionData?.error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">
          ❌ {actionData.error}
        </div>
      )}

      {/* Dùng thẻ <Form> của React Router thay cho <form> HTML tiêu chuẩn */}
      <Form method="post" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề:</label>
          <input
            name="title"
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="Nhập tiêu đề..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung:</label>
          <textarea
            name="body"
            rows={4}
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="Nhập nội dung bài viết..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "⏳ Đang xử lý Action..." : "Đăng Bài Viết"}
        </button>
      </Form>
    </div>
  );
}
```

---

## 📝 Example 3 - Streaming Dữ Liệu Chậm Với Kỹ Thuật `defer` và `<Await>`

```jsx
// src/pages/SlowDashboardPage.jsx
import React, { Suspense } from "react";
import { defer, useLoaderData, Await } from "react-router-dom";

// API nhanh
async function getFastUser() {
  return { name: "Nguyễn Long" };
}

// API chậm mất 3 giây
async function getSlowAnalytics() {
  await new Promise((res) => setTimeout(res, 3000));
  return { totalRevenue: 150000000, activeUsers: 1420 };
}

// Loader kết hợp defer
export async function slowDashboardLoader() {
  const user = await getFastUser(); // Chờ API nhanh xong
  const analyticsPromise = getSlowAnalytics(); // KHÔNG AWAIT API chậm!

  // Dùng defer để trả về Promise chậm cho React Suspense stream dữ liệu sau
  return defer({
    user,
    analytics: analyticsPromise
  });
}

export function SlowDashboardPage() {
  const data = useLoaderData();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* 1. Dữ liệu nhanh hiển thị NGAY LẬP TỨC */}
      <h1 className="text-2xl font-bold">Xin chào, {data.user.name}!</h1>

      {/* 2. Dữ liệu chậm hiển thị giao diện chờ Suspense trong lúc stream */}
      <Suspense fallback={<div className="p-4 bg-amber-50 text-amber-800 rounded-lg">⏳ Đang tải dữ liệu phân tích doanh thu (3s)...</div>}>
        <Await resolve={data.analytics} errorElement={<p>Lỗi tải analytics</p>}>
          {(analytics) => (
            <div className="p-6 bg-slate-900 text-white rounded-2xl grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">TỔNG DOANH THU</p>
                <p className="text-2xl font-bold text-emerald-400">{analytics.totalRevenue.toLocaleString()} VNĐ</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">NGƯỜI DÙNG ACTIVE</p>
                <p className="text-2xl font-bold text-blue-400">{analytics.activeUsers}</p>
              </div>
            </div>
          )}
        </Await>
      </Suspense>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Khác biệt `<Form>` của React Router và `<form>` HTML:** Thẻ `<Form>` của React Router tự động chặn reload trang mặc định và kích hoạt hàm `action` tương ứng với Route đó một cách hoàn toàn mượt mà.
2. **Khi Nào Dùng `defer`:** Chỉ sử dụng `defer` khi có một API cực kỳ chậm (mất > 2 giây) mà bạn không muốn làm hoãn lại quá trình chuyển trang của người dùng.

---

## ❌ Common Mistakes

### Sai 1 - Gọi `useLoaderData()` bên ngoài Component thuộc cây Route
Hook `useLoaderData()` chỉ hoạt động bên trong Component giao diện chính của Route đó hoặc các Component con trực thuộc cây DOM của nó. Gọi ở nơi khác sẽ trả về `undefined`.

---

## 📚 Summary

- **`loader`** tải trước dữ liệu bất đồng bộ trước khi Component được render, loại bỏ hiện tượng Waterfalling.
- **`useLoaderData`** trích xuất dữ liệu trực tiếp từ loader mà không cần `useState`/`useEffect`.
- **`action`** và **`<Form>`** quản lý các thao tác nộp dữ liệu và tự động điều hướng (`redirect`).
- **`errorElement`** khoanh vùng xử lý lỗi cục bộ nâng cao độ tin cậy của ứng dụng.
- **`defer`** và **`<Await>`** hỗ trợ stream dữ liệu chậm ngầm ở background mà không làm nghẽn việc chuyển trang.

---

## 📝 Quiz

### Question 1
Hàm `loader` trong kiến trúc Data APIs của React Router v6.4+ được thi hành vào thời điểm nào?

A. Sau khi Component đã render xong và kích hoạt `useEffect`  
B. Chạy TRƯỚC KHI Component giao diện được render, giúp nạp dữ liệu API song song với quá trình tải mã nguồn  
C. Khi người dùng đóng tab trình duyệt  
D. Khi có lỗi JavaScript xảy ra  

**Explanation:**  
`loader` chạy trước khi Component render. Khi người dùng click chuyển hướng, React Router gọi `loader` nạp data song song với quá trình nạp mã nguồn JS của trang mới, loại bỏ hiện tượng màn hình trắng chờ useEffect.

**Answer: B**

---

### Question 2
Hook nào trong React Router v6 được sử dụng bên trong Component để trích xuất dữ liệu đã được nạp thành công từ hàm `loader`?

A. `useParams`  
B. `useLoaderData`  
C. `useFetchData`  
D. `useRouteData`  

**Explanation:**  
Hook `useLoaderData()` trả về dữ liệu được resolved từ hàm `loader` gắn với Route đó, giúp Component nhận dữ liệu sẵn có 100% mà không cần tự tạo State hay `useEffect`.

**Answer: B**

---

### Question 3
Lợi ích lớn nhất của thuộc tính `errorElement` khi được khai báo tại một Route cụ thể trong `createBrowserRouter` là gì?

A. Tự động mã hóa CSDL  
B. Khoanh vùng bắt lỗi (Error Boundary) cục bộ cho riêng Route đó, giúp trang web không bị crash toàn bộ khi 1 API bị lỗi  
C. Tự động thay đổi màu sắc giao diện  
D. Tự động đăng nhập lại  

**Explanation:**  
`errorElement` đóng vai trò là một Error Boundary cục bộ. Nếu `loader` hay `action` của Route `/courses/101` bị lỗi, chỉ riêng vùng giao diện của route đó hiển thị `errorElement`, các phần giao diện chung xung quanh (như Header, Navbar) vẫn hoạt động bình thường.

**Answer: B**
