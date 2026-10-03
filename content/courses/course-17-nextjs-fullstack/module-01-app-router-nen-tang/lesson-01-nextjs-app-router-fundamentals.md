---
id: nextjs-fullstack-m1-l1
course: Next.js, Full-stack React & Enterprise System Architecture
module: App Router nền tảng
title: Next.js App Router Fundamentals
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Next.js App Router Fundamentals

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Giải thích sự tiến hóa kiến trúc từ **Pages Router (`pages/`)** sang **App Router (`app/`)** trong Next.js.
- Nắm vững hệ thống định tuyến dựa trên cấu trúc thư mục **File-system Based Routing** (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`).
- Xây dựng bố cục giao diện lồng nhau (**Nested Layouts**) bảo toàn trạng thái (State Preservation) giữa các chuyển đổi trang.
- Định nghĩa các tuyến đường động (**Dynamic Routes `[id]`**) và tuyến đường gom nhóm (**Route Groups `(auth)`**).
- Sử dụng các thành phần điều hướng tối ưu **`<Link>`** và **`useRouter()`**.
- Tích hợp **Parallel Routes (`@slot`)** và **Intercepting Routes (`(.)photos`)** cho các mẫu thiết kế UI phức tạp (như Modal Overlay URL).

---

## 📖 Definition

### 1. Sự Tiến Hóa Kiến Trúc: Pages Router vs App Router

Next.js 13+ giới thiệu kiến trúc **App Router** hoàn toàn mới dựa trên React Server Components (RSC):

| Tiêu chí | Pages Router (`pages/`) | App Router (`app/`) |
|---|---|---|
| **Cơ chế Render mặc định** | Client Components | **React Server Components (RSC)** |
| **Định vị tệp trang** | Mọi file trong `pages/` đều thành URL | Chỉ file tên **`page.tsx`** mới tạo thành Route URL |
| **Bố cục Giao diện Layouts** | Lồng nhau rườm rà qua `getLayout` | Hỗ trợ **Nested Layouts (`layout.tsx`)** tự nhiên |
| **Data Fetching** | `getServerSideProps`, `getStaticProps` | **`async / await` trực tiếp trong Server Components** |
| **Đóng gói Bundle** | JS sent to client lớn hơn | **0KB JavaScript** gửi xuống cho mã Server Components |

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   HỆ THỐNG ROUTING TỆP CỦA NEXT.JS APP ROUTER          │
└────────────────────────────────────────────────────────────────────────┘

  app/
  ├── layout.tsx         👉 Bố cục chung toàn ứng dụng (Root Layout)
  ├── page.tsx           👉 URL: "/" (Trang chủ)
  ├── (auth)/            👉 Route Group (Không xuất hiện trên URL!)
  │   ├── login/
  │   │   └── page.tsx   👉 URL: "/login"
  │   └── register/
  │       └── page.tsx   👉 URL: "/register"
  └── courses/
      ├── page.tsx       👉 URL: "/courses"
      └── [id]/
          ├── loading.tsx 👉 Màn hình chờ tự động với React Suspense
          ├── error.tsx   👉 Error Boundary bắt lỗi cục bộ
          └── page.tsx   👉 URL: "/courses/101" (Dynamic Route)
```

---

## 2. Các Tập Tin Đặc Biệt Trong Thư Mục App Router

1. **`layout.tsx`**: Khai báo Bố cục chung. Nhận vào `children`. Được giữ nguyên (Preserved State) và không bị re-render khi di chuyển giữa các trang con.
2. **`page.tsx`**: Giao diện độc nhất của một tuyến đường URL. Bắt buộc phải có để URL đó truy cập được.
3. **`loading.tsx`**: Tự động bọc `page.tsx` trong một React `<Suspense>` fallback, hiển thị UI chờ lập tức khi chuyển trang.
4. **`error.tsx`**: Bắt buộc là Client Component (`"use client"`), đóng vai trò Error Boundary bắt lỗi runtime cục bộ cho nhánh Route đó.
5. **`not-found.tsx`**: Giao diện tùy chỉnh 404 Not Found khi gọi hàm `notFound()`.

---

## 💻 Syntax

### Root Layout Syntax (`app/layout.tsx`)
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduConnect Platform",
  description: "Nền tảng học lập trình React & Next.js doanh nghiệp"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-50 text-slate-900">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

---

## 📝 Example 1 - Khai Báo Nested Layout Cho Khu Vực Quản Trị (`app/admin/layout.tsx`)

```tsx
// app/admin/layout.tsx
import React from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Admin Cố Định - Không bị re-render khi chuyển các trang admin con! */}
      <aside className="w-64 bg-slate-900 text-white p-6 space-y-6 flex-shrink-0">
        <div className="text-xl font-bold text-blue-400">Admin Portal</div>
        
        <nav className="space-y-2">
          <Link href="/admin/dashboard" className="block px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            📊 Bảng Điều Khiển
          </Link>
          <Link href="/admin/courses" className="block px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            📚 Quản Lý Khóa Học
          </Link>
          <Link href="/admin/users" className="block px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            👥 Quản Lý Người Dùng
          </Link>
        </nav>
      </aside>

      {/* Vị trí render các trang con admin */}
      <main className="flex-1 p-8 bg-slate-50">{children}</main>
    </div>
  );
}
```

---

## 📝 Example 2 - Trang Chi Tiết Khóa Học Động Với Loading & Error Handling (`app/courses/[id]/page.tsx`)

```tsx
// app/courses/[id]/loading.tsx
export default function CourseLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="h-64 bg-slate-200 rounded-2xl" />
      <div className="h-4 bg-slate-200 rounded w-2/3" />
    </div>
  );
}
```

```tsx
// app/courses/[id]/page.tsx
import { notFound } from "next/navigation";

interface CoursePageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

// Giả lập Fetch dữ liệu trên Server
async function getCourse(id: string) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    next: { revalidate: 60 } // Revalidate cache mỗi 60s
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Lỗi nạp dữ liệu khóa học");
  return res.json();
}

export default async function CourseDetailPage({ params, searchParams }: CoursePageProps) {
  const course = await getCourse(params.id);

  // Kích hoạt hiển thị trang app/courses/[id]/not-found.tsx nếu không thấy khóa học
  if (!course) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
        COURSE ID: #{params.id} | TAB: {searchParams.tab || "overview"}
      </span>
      <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
      <p className="text-slate-700 leading-relaxed">{course.body}</p>
    </div>
  );
}
```

---

## 📝 Example 3 - Route Groups `(auth)` Gom Nhóm Các Trang Xác Thực

```tsx
// app/(auth)/layout.tsx
// Route Group (auth) giúp dùng chung Layout cho /login và /register mà KHÔNG biến "(auth)" thành URL!
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **`error.tsx` Bắt Bắt Phải Là Client Component:** Vì Error Boundary của React đòi hỏi xử lý các sự kiện khôi phục state và tương tác người dùng, tệp `error.tsx` bắt buộc phải có chỉ thị `"use server"`? KHÔNG, bắt buộc phải có chỉ thị **`"use client"`** ở dòng đầu tiên.

---

## ❌ Common Mistakes

### Sai 1 - Tạo file trong `app/` nhưng quên tên `page.tsx`
```text
❌ SAI: Tạo file app/dashboard.tsx -> Next.js KHÔNG tạo ra URL /dashboard!
✅ ĐÚNG: Tạo file app/dashboard/page.tsx -> Next.js tạo ra URL /dashboard chuẩn xác.
```

---

## 📚 Summary

- **App Router (`app/`)** chuyển sang mô hình Server Components theo cấu trúc thư mục File-system.
- Chỉ các file tên **`page.tsx`** mới tạo thành các đường dẫn URL public.
- **`layout.tsx`** bảo toàn trạng thái (Preserved State) khi chuyển đổi trang con.
- **`loading.tsx`** tự động kích hoạt React Suspense hiển thị giao diện chờ.
- **Route Groups `(folder)`** gom nhóm code dùng chung Layout mà không làm đổi URL.

---

## 📝 Quiz

### Question 1
Tên tập tin nào là bắt buộc trong hệ thống App Router của Next.js để biến một thư mục (ví dụ `app/courses/`) thành một tuyến đường URL có thể truy cập công khai?

A. `index.tsx`  
B. `page.tsx`  
C. `route.tsx`  
D. `view.tsx`  

**Explanation:**  
Trong App Router của Next.js, duy nhất các tệp tin có tên chính xác là `page.tsx` (hoặc `page.jsx`) mới tạo ra một trang giao diện có thể truy cập được thông qua đường dẫn URL tương ứng của thư mục chứa nó.

**Answer: B**

---

### Question 2
Mục đích cốt lõi của việc sử dụng cú pháp đóng ngoặc đơn Route Groups `(auth)` cho các thư mục trong App Router là gì?

A. Để ẩn mã nguồn khỏi GitHub  
B. Gom nhóm các tuyến đường liên quan lại với nhau để dùng chung Layout mà KHÔNG làm ảnh hưởng hay thêm tên thư mục đó vào đường dẫn URL thực tế  
C. Tự động mã hóa mật khẩu  
D. Cả A và C  

**Explanation:**  
Route Groups dạng `(group-name)` giúp bạn tổ chức cấu trúc thư mục mã nguồn và chia sẻ `layout.tsx` chung cho một tập hợp các trang (như `/login` và `/register`) mà không làm xuất hiện từ `(group-name)` trên thanh địa chỉ URL của trình duyệt.

**Answer: B**

---

### Question 3
Tập tin đặc biệt nào trong App Router của Next.js BẮT BUỘC phải khai báo chỉ thị `"use client"` ở dòng đầu tiên?

A. `layout.tsx`  
B. `page.tsx`  
C. `error.tsx`  
D. `loading.tsx`  

**Explanation:**  
Tệp `error.tsx` đóng vai trò là một React Error Boundary. Vì Error Boundary cần tương tác với người dùng (như bấm nút `reset()` thử lại), Next.js bắt buộc `error.tsx` phải là một Client Component (`"use client"`).

**Answer: C**
