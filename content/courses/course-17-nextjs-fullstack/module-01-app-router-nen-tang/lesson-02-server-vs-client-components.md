---
id: nextjs-fullstack-m1-l2
course: Next.js, Full-stack React & Enterprise System Architecture
module: App Router nền tảng
title: Server vs Client Components Architecture
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Server vs Client Components Architecture

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích bản chất mô hình **React Server Components (RSC)** và sự khác biệt mấu chốt với **Client Components**.
- Nắm vững quy tắc phân định ranh giới **"Server-Client Boundary"** và vị trí đặt chỉ thị **`"use client"`**.
- Giải thích nguyên lý **0KB JavaScript Bundle** sent to client của Server Components.
- Áp dụng các mẫu thiết kế phối hợp hợp lệ: Chèn Client Components vào Server Components, và truyền Server Components làm `children` cho Client Components.
- Bảo mật thông tin mã nguồn và API Keys trên Server bằng gói **`server-only`**.
- Xử lý mượt mượt các sự kiện tương tác (`onClick`, `onChange`) và React Hooks (`useState`, `useEffect`) tại Client Components.

---

## 📖 Definition

### 1. Bản Chất Mô Hình React Server Components (RSC)

Trước Next.js 13, tất cả các React Component đều là **Client Components**: Mã nguồn JavaScript của 100% Component được gửi xuống trình duyệt, trình duyệt thực thi JS để dựng lại DOM (Hydration).

Trong kiến trúc **React Server Components (RSC)** của Next.js App Router:
- **Mặc định, tất cả các Component trong thư mục `app/` đều là SERVER COMPONENTS!**
- Server Components chạy và thực thi **DUY NHẤT TRÊN SERVER**.
- Kết quả trả về cho trình duyệt là **HTML tĩnh đã dựng sẵn** và đối tượng cây dữ liệu JSON đặc biệt (RSC Payload).
- **Mã nguồn JavaScript của Server Components KHÔNG BAO GIỜ bị gửi xuống trình duyệt (0KB JS Bundle)!**

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   RANH GIỚI SERVER-CLIENT BOUNDARY IN RSC              │
└────────────────────────────────────────────────────────────────────────┘

 [ SERVER ENVIRONMENT ]
  ├── RootLayout (Server Component - 0KB JS)
  └── CourseDetailPage (Fetch DB trực tiếp - 0KB JS)
           │
   (Ghi dấu ranh giới "use client")
           │
           ▼
 [ CLIENT ENVIRONMENT (Trình duyệt) ]
  └── LikeButton (Client Component - Gửi JS để xử lý onClick, useState)
```

---

## 2. Bảng So Sánh Quyền Hạn: Server vs Client Components

| Tính năng / Thao tác | Server Components (Mặc định) | Client Components (`"use client"`) |
|---|---|---|
| Truy cập CSDL trực tiếp (Prisma, PostgreSQL) | **CÓ** (An toàn 100%) | ❌ KHÔNG |
| Lưu giữ bí mật API Keys / Tokens | **CÓ** (Không lộ ra client) | ❌ KHÔNG (Lộ trong file JS) |
| Sử dụng React Hooks (`useState`, `useEffect`) | ❌ KHÔNG | **CÓ** |
| Đăng ký Event Listeners (`onClick`, `onChange`) | ❌ KHÔNG | **CÓ** |
| Sử dụng Web Browser APIs (`window`, `localStorage`) | ❌ KHÔNG | **CÓ** |
| Ảnh hưởng đến dung lượng JS Bundle gửi xuống Client | **0 KB (Không ảnh hưởng)** | Có gửi JS xuống Client |

---

## 💻 Syntax

### Client Component Declaration Syntax
```tsx
"use client"; // Chỉ thị bắt buộc ở dòng ĐẦU TIÊN của file!

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c + 1)}>Count: {count}</button>;
}
```

---

## 📝 Example 1 - Server Component Đọc CSDL Trực Tiếp Không Tốn 1 Byte JS Bundle (`app/courses/page.tsx`)

```tsx
// app/courses/page.tsx (SERVER COMPONENT MẶC ĐỊNH)
// Không chứa "use client" -> Chạy 100% trên Node.js Server!

import Link from "next/link";
import { LikeButton } from "@/components/LikeButton"; // Import Client Component

interface Course {
  id: string;
  title: string;
  price: number;
}

// Giả lập hàm đọc trực tiếp từ CSDL PostgreSQL/Prisma
async function getCoursesFromDatabase(): Promise<Course[]> {
  // Thao tác bảo mật trực tiếp ở Server
  return [
    { id: "101", title: "Khóa học React Server Components", price: 1500000 },
    { id: "102", title: "Khóa học Next.js App Router Pro", price: 1800000 }
  ];
}

export default async function CoursesPage() {
  // Gọi CSDL trực tiếp với async/await! Không cần useEffect hay Axios!
  const courses = await getCoursesFromDatabase();

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Danh Sách Khóa Học (Server Rendered)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="p-6 bg-white rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-bold text-xl text-slate-800">{course.title}</h3>
            <p className="text-blue-600 font-extrabold">{course.price.toLocaleString()} VNĐ</p>

            <div className="flex justify-between items-center pt-2">
              <Link href={`/courses/${course.id}`} className="text-sm font-medium text-slate-600 hover:underline">
                Xem chi tiết →
              </Link>

              {/* 💡 CHÈN CLIENT COMPONENT VÀO SERVER COMPONENT CHO CÁC PHẦN CẦN TƯƠNG TÁC */}
              <LikeButton courseId={course.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📝 Example 2 - Client Component Xử Lý Tương Tác Nút Like (`components/LikeButton.tsx`)

```tsx
// components/LikeButton.tsx
"use client"; // 💡 ĐÁNH DẤU RANH GIỚI CLIENT COMPONENT

import React, { useState } from "react";

export function LikeButton({ courseId }: { courseId: string }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(12);

  const handleToggleLike = () => {
    setIsLiked((prev) => !prev);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <button
      onClick={handleToggleLike}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1 ${
        isLiked
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      <span>{isLiked ? "❤️" : "🤍"}</span>
      <span>{likesCount}</span>
    </button>
  );
}
```

---

## 📝 Example 3 - Mẫu Thiết Kế Pass Server Component Làm `children` Cho Client Component (`components/SidebarDrawer.tsx`)

```tsx
// components/SidebarDrawer.tsx
"use client";

import React, { useState } from "react";

// Client Component quản lý trạng thái đóng/mở Sidebar
export function SidebarDrawer({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-slate-900 text-white rounded">
        ☰ Toggle Sidebar
      </button>

      {isOpen && (
        <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r p-6 shadow-xl z-50">
          <button onClick={() => setIsOpen(false)} className="mb-4 text-xs font-bold">✕ Đóng</button>
          
          {/* 💡 RENDER SERVER COMPONENT DƯỚI DẠNG CHILDREN!
              Dữ liệu bên trong children vẫn được render trên Server với 0KB JS! */}
          {children}
        </aside>
      )}
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Gói `server-only` Bảo Vệ Mã Nguồn Server:** Cài đặt gói `npm i server-only` và thêm `import 'server-only'` ở đầu các file chứa API Keys hay query CSDL. Nếu vô tình import file này vào một Client Component, Next.js sẽ báo lỗi compile ngay lập tức, ngăn chặn rò rỉ secret keys.

---

## ❌ Common Mistakes

### Sai 1 - Đặt `"use client"` ở file `layout.tsx` gốc của ứng dụng
```tsx
// ❌ SAI TAI HẠI: Đặt "use client" ở root layout -> Biến TOÀN BỘ ứng dụng phía dưới thành Client Components, làm mất sạch lợi ích 0KB JS của RSC!
"use client"; 
export default function RootLayout({ children }) { ... }

// ✅ ĐÚNG CHUẨN: Giữ RootLayout là Server Component. Chỉ thêm "use client" ở các Component con thực sự cần useState/onClick!
```

---

## 📚 Summary

- **Server Components (Mặc định)** chạy 100% trên Node.js Server, đọc CSDL trực tiếp và gửi **0KB JS Bundle** xuống Client.
- **Client Components (`"use client"`)** được gửi mã JS xuống trình duyệt để xử lý Hooks (`useState`) và Events (`onClick`).
- Giữ cờ `"use client"` ở các lá Component càng sâu trên cây DOM càng tốt (Push Client Boundary Down).
- Có thể truyền Server Component dưới dạng `children` cho Client Component.
- Dùng gói **`server-only`** để bảo vệ mã nguồn CSDL nhạy cảm.

---

## 📝 Quiz

### Question 1
Mặc định trong Next.js App Router, tất cả các Component được tạo ra trong thư mục `app/` là loại Component nào nếu không có chỉ thị `"use client"`?

A. Client Components  
B. React Server Components (RSC)  
C. Shared Components  
D. Static Components  

**Explanation:**  
Trong App Router của Next.js, mặc định mọi Component được tạo ra đều là React Server Components (RSC), thực thi 100% trên Server và trả về HTML tĩnh với 0KB JavaScript gửi xuống client.

**Answer: B**

---

### Question 2
Chỉ thị nào bắt buộc phải được đặt ở dòng đầu tiên của tập tin để chuyển đổi một Component thành Client Component cho phép sử dụng các React Hooks như `useState` và `useEffect`?

A. `"use server"`  
B. `"use client"`  
C. `"use react"`  
D. `"use browser"`  

**Explanation:**  
Chỉ thị `"use client"` đánh dấu ranh giới chuyển đổi (Client Boundary). Mọi Component chứa chỉ thị này và các file được nó import sẽ được đóng gói gửi JavaScript xuống trình duyệt để xử lý tương tác.

**Answer: B**

---

### Question 3
Điều gì sẽ xảy ra với dung lượng tập tin JavaScript Bundle gửi xuống trình duyệt (Client Bundle Size) đối với các mã nguồn chạy bên trong một React Server Component?

A. Dung lượng tăng thêm 500KB  
B. Dung lượng bằng **0 KB** (Mã nguồn Server Component không bị đóng gói gửi xuống trình duyệt)  
C. Dung lượng tăng gấp đôi  
D. Cả A và C  

**Explanation:**  
Server Components chỉ chạy trên Server. Trình duyệt chỉ nhận về HTML tĩnh và dữ liệu RSC Payload. Do đó mã nguồn và thư viện npm dùng trong Server Component đóng góp chính xác 0 KB vào tập tin JavaScript Bundle gửi xuống trình duyệt.

**Answer: B**
