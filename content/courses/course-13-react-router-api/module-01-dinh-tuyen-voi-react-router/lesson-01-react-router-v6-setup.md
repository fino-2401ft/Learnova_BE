---
id: react-router-api-m1-l1
course: React Router & API Integration
module: Định tuyến với React Router
title: React Router v6 Setup
order: 1
difficulty: Advanced
estimatedTime: 240
---
# React Router v6 Setup

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích sự khác biệt mấu chốt giữa kiến trúc **Client-side Routing** trong Single Page Applications (SPA) và Server-side Routing truyền thống.
- Khởi tạo cây định tuyến hiện đại bằng đối tượng **`createBrowserRouter`** và **`<RouterProvider>`** trong React Router v6+.
- Xây dựng bố cục giao diện lồng nhau (**Nested Layouts**) và sử dụng vị trí render **`<Outlet />`**.
- Thực hiện điều hướng giữa các trang linh hoạt bằng **`<Link>`**, **`<NavLink>`** (nhận class `isActive`) và Hook **`useNavigate`**.
- Trích xuất các tham số biến động từ đường dẫn URL với **`useParams`** (Path Params) và **`useSearchParams`** (Query Strings).
- Khai báo trang lỗi toàn cục (Catch-all 404 Route) với `path: "*"`.

---

## 📖 Definition

### 1. Client-Side Routing Trong Ứng Dụng SPA

Trong mô hình web truyền thống (Multi-Page Application - MPA), mỗi khi người dùng click vào một đường link, trình duyệt sẽ hủy trang hiện tại, gửi một HTTP Request mới lên máy chủ và tải về một tập tin HTML mới hoàn toàn. Thao tác này gây ra màn hình trắng (Blank Screen) trong vài giây và làm mất toàn bộ trạng thái ứng dụng.

Trong các ứng dụng React SPA, **Client-Side Routing** (Định tuyến phía Máy khách) giúp chuyển đổi nội dung giao diện ngay lập tức trên trình duyệt bằng **HTML5 History API (`pushState` / `replaceState`)**:
- Trình duyệt **KHÔNG TẢI LẠI TRANG** (No Page Reload).
- URL trên thanh địa chỉ thay đổi tương ứng.
- Giữ nguyên trạng thái RAM ứng dụng (React State) mang lại trải nghiệm nhanh mượt như ứng dụng Desktop Native.

```text
┌────────────────────────────────────────────────────────────────────────┐
│               LUỒNG ĐỊNH TUYẾN CLIENT-SIDE ROUTING (SPA)               │
└────────────────────────────────────────────────────────────────────────┘

 [ User Click Link ] ───> 1. Chặn hành động reload mặc định của thẻ <a>
                                  │
                                  ├─> 2. Đổi URL bằng history.pushState()
                                  │
                                  └─> 3. React Router khớp Route Path
                                          │
                                          ▼
                                   [ Render Component Mới ]
                                  (Giữ nguyên State & Layout)
```

---

## 2. Định Tuyến Hiện Đại Với Data APIs (`createBrowserRouter` & `RouterProvider`)

Từ phiên bản React Router v6.4+, nhà phát triển khuyến nghị chuyển đổi từ cú pháp bọc thẻ JSX cũ (`<BrowserRouter><Routes>...`) sang cú pháp **Data APIs** sử dụng `createBrowserRouter` và đối tượng `<RouterProvider>`:

- **Tách Rời Cấu Hình Route (Decoupled Configuration):** Cho phép khai báo danh sách Route dưới dạng một mảng JS Objects rõ ràng.
- **Hỗ trợ Data Loaders & Actions:** Cho phép nạp trước dữ liệu API song song với quá trình chuyển trang.
- **Nested Layouts (`<Outlet />`):** Các trang con (như Dashboard, Profile, Analytics) có thể nằm bên trong một Bố cục chung (như Sidebar Layout) mà không cần phải lặp lại mã nguồn Header/Sidebar ở từng trang.

---

## 3. Quản Lý Tham Số URL: `useParams` vs `useSearchParams`

1. **`useParams()` (Path Parameters - Tham số đường dẫn):**
   - Khai báo trên Route: `path: "courses/:courseId"`
   - URL thực tế: `/courses/101`
   - Đọc dữ liệu: `const { courseId } = useParams();` ➔ `courseId === "101"`
2. **`useSearchParams()` (Query Strings - Tham số truy vấn):**
   - URL thực tế: `/courses?category=react&sort=price`
   - Đọc dữ liệu: `const [searchParams] = useSearchParams();` ➔ `searchParams.get("category") === "react"`

---

## 💻 Syntax

### 1. Cấu hình Cây Route với `createBrowserRouter`
```jsx
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />, // Layout chung chứa Navigation Bar
    errorElement: <NotFoundPage />, // Trang 404 Catch-all
    children: [
      { index: true, element: <HomePage /> }, // Path "/"
      { path: "courses", element: <CourseListPage /> }, // Path "/courses"
      { path: "courses/:id", element: <CourseDetailPage /> } // Path dynamic "/courses/101"
    ]
  }
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

### 2. Layout với `<Outlet />`
```jsx
function RootLayout() {
  return (
    <div>
      <Navbar />
      {/* Vị trí Route con (HomePage, CourseListPage...) hiển thị */}
      <main><Outlet /></main>
      <Footer />
    </div>
  );
}
```

---

## 📝 Example 1 - Xây Dựng Navigation Bar Chuẩn Với `<NavLink>` và `useNavigate`

```jsx
// src/components/Navbar.jsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Điều hướng chuyển trang qua lập trình (Programmatic Navigation)
    console.log("Đã đăng xuất");
    // replace: true giúp ghi đè lịch sử, ngăn người dùng bấm nút Back quay lại
    navigate("/login", { replace: true });
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-slate-900 text-white shadow-md">
      <Link to="/" className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
        EduConnect
      </Link>

      <div className="flex space-x-6">
        {/* NavLink tự động nhận hàm ({ isActive }) để áp dụng CSS Class linh hoạt */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `text-sm font-medium transition-colors ${isActive ? "text-blue-400 border-b-2 border-blue-400 pb-1" : "text-slate-300 hover:text-white"}`
          }
        >
          Trang chủ
        </NavLink>

        <NavLink
          to="/courses"
          className={({ isActive }) =>
            `text-sm font-medium transition-colors ${isActive ? "text-blue-400 border-b-2 border-blue-400 pb-1" : "text-slate-300 hover:text-white"}`
          }
        >
          Khóa học
        </NavLink>
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Đăng xuất
      </button>
    </nav>
  );
}
```

---

## 📝 Example 2 - Trích Xuất Dynamic Path Params Với `useParams`

```jsx
// src/pages/CourseDetailPage.jsx
import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export function CourseDetailPage() {
  // Trích xuất tham số ":id" từ đường dẫn URL "/courses/:id"
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)} // Quay lại trang trước đó trong History
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Quay lại trang trước
      </button>

      <div className="p-6 bg-white rounded-2xl border shadow-sm space-y-4">
        <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded">
          COURSE ID: #{id}
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Chi Tiết Khóa Học Số {id}</h1>
        <p className="text-slate-600">
          Đang nạp dữ liệu chi tiết cho khóa học có ID là {id} từ máy chủ...
        </p>
      </div>
    </div>
  );
}
```

---

## 📝 Example 3 - Đọc Và Cập Nhật Query String Với `useSearchParams`

```jsx
// src/pages/CourseSearchPage.jsx
// URL thử nghiệm: /courses?category=react&sort=price_asc
import React from "react";
import { useSearchParams } from "react-router-dom";

export function CourseSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc giá trị từ Query String trên URL (nếu không có thì lấy giá trị mặc định)
  const category = searchParams.get("category") || "all";
  const sort = searchParams.get("sort") || "name";

  const handleFilterCategory = (newCategory) => {
    // Cập nhật Query String trên URL mà KHÔNG TẢI LẠI TRANG!
    setSearchParams({ category: newCategory, sort });
  };

  const handleSortChange = (newSort) => {
    setSearchParams({ category, sort: newSort });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Lọc Danh Sách Khóa Học</h2>

      <div className="flex space-x-4 mb-6 p-4 bg-slate-100 rounded-xl">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">DANH MỤC:</label>
          <div className="space-x-2">
            <button
              onClick={() => handleFilterCategory("all")}
              className={`px-3 py-1 text-sm rounded ${category === "all" ? "bg-blue-600 text-white" : "bg-white"}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleFilterCategory("react")}
              className={`px-3 py-1 text-sm rounded ${category === "react" ? "bg-blue-600 text-white" : "bg-white"}`}
            >
              React
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">SẮP XẾP:</label>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="p-1.5 text-sm rounded border bg-white"
          >
            <option value="name">Theo tên</option>
            <option value="price_asc">Giá tăng dần</option>
          </select>
        </div>
      </div>

      <div className="p-4 bg-blue-50 text-blue-900 rounded-xl">
        <p className="font-semibold">
          🔎 Đang hiển thị kết quả cho Category: <span className="underline">{category}</span> | Sort: <span className="underline">{sort}</span>
        </p>
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Tuyệt Đối Không Dùng Thẻ `<a href>` Cho Định Tuyến Nội Bộ:** Dùng thẻ `<a href="/courses">` sẽ buộc trình duyệt thực hiện một lượt HTTP Request mới về Server, làm reload lại toàn bộ trang web và làm mất sạch bộ nhớ RAM React State. Luôn luôn dùng `<Link to="/courses">`.
2. **Khai Báo Catch-All 404 Route Ở Cuối Cùng:** Khai báo `{ path: "*", element: <NotFoundPage /> }` ở vị trí cuối cùng trong danh sách `children` để bắt tất cả các đường dẫn không tồn tại và hiển thị trang thông báo lỗi 404 Not Found.

---

## ❌ Common Mistakes

### Sai 1 - Quên thẻ `<Outlet />` Trong Layout Component
```jsx
// ❌ SAI TAI HẠI: Layout không có <Outlet /> -> Các Route con như <HomePage /> hay <CourseListPage /> sẽ KHÔNG BAO GIỜ hiển thị!
function RootLayout() {
  return (
    <div>
      <Navbar />
      <Footer />
    </div>
  );
}

// ✅ ĐÚNG CHUẨN REACT ROUTER V6:
function RootLayout() {
  return (
    <div>
      <Navbar />
      <main><Outlet /></main> {/* Vị trí các trang con sẽ được chèn vào */}
      <Footer />
    </div>
  );
}
```

---

## 📚 Summary

- **Client-Side Routing (SPA)** giúp chuyển đổi giao diện tức thì qua History API mà không reload trình duyệt.
- Dùng **`createBrowserRouter`** và **`<RouterProvider>`** để định cấu hình danh sách đường dẫn dạng Objects.
- Thẻ **`<Outlet />`** đánh dấu vị trí render cho các Route con bên trong Bố cục chung (Nested Layout).
- Dùng **`<Link>`** / **`<NavLink>`** để di chuyển trang không reload.
- Dùng **`useParams()`** cho Path Params (`/courses/:id`) và **`useSearchParams()`** cho Query Strings (`/courses?cat=react`).

---

## 📝 Quiz

### Question 1
Thẻ nào dưới đây được sử dụng trong React Router v6 để đánh dấu vị trí mà giao diện của các Route con (Nested Routes) sẽ được chèn vào bên trong một Layout cha?

A. `<Container />`  
B. `<Outlet />`  
C. `<ChildRoute />`  
D. `<Inject />`  

**Explanation:**  
Thẻ `<Outlet />` trong React Router v6 đóng vai trò là một Placeholder định vị nơi mà giao diện của các Route con (children routes) được khai báo trong `createBrowserRouter` sẽ hiển thị ra bên trong Bố cục chung (Layout).

**Answer: B**

---

### Question 2
Tại sao bạn nên dùng thẻ `<Link to="...">` hoặc `<NavLink to="...">` thay cho thẻ HTML truyền thống `<a href="...">` khi định tuyến trong ứng dụng React SPA?

A. Thẻ `<Link>` giúp giao diện tự đổi màu  
B. Thẻ `<Link>` chuyển trang qua History API mà KHÔNG reload lại trình duyệt, giúp bảo toàn trạng thái ứng dụng (React State)  
C. Thẻ `<a>` không chạy được trên các thiết bị di động  
D. Thẻ `<Link>` tự động gửi dữ liệu xuống CSDL  

**Explanation:**  
Thẻ `<a href="...">` khiến trình duyệt thực hiện một lượt tải lại trang toàn bộ (Full Page Reload) làm mất hết React State trong RAM. Thẻ `<Link>` chặn hành động reload này và thực hiện điều hướng mượt mượt qua HTML5 History API.

**Answer: B**

---

### Question 3
Hook nào trong React Router v6 được sử dụng để trích xuất các tham số biến động trên đường dẫn URL như `:id` từ Route `path: "courses/:id"`?

A. `useLocation`  
B. `useParams`  
C. `useSearchParams`  
D. `useNavigate`  

**Explanation:**  
Hook `useParams()` trả về một đối tượng key/value chứa các tham số biến động (dynamic path params) được định nghĩa bởi dấu hai chấm ( ví dụ `:id` ) trên khai báo đường dẫn của Route.

**Answer: B**
