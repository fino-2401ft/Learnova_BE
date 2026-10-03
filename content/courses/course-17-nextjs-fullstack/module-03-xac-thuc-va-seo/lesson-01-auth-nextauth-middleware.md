---
id: nextjs-fullstack-m3-l1
course: Next.js, Full-stack React & Enterprise System Architecture
module: Xác thực và SEO
title: Authentication & Authorization in Next.js (NextAuth / Auth.js & Middleware)
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Authentication & Authorization in Next.js (NextAuth / Auth.js & Middleware)

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững kiến trúc Xác thực (**Authentication**) và Phân quyền (**Authorization**) toàn diện trong Next.js App Router.
- Tích hợp thư viện **Auth.js (NextAuth.v5)** hỗ trợ các phương thức Đăng nhập đa dạng (Credentials, OAuth Google/GitHub).
- Bảo vệ các tuyến đường riêng tư ở mức Edge Server với **Next.js Middleware (`middleware.ts`)**.
- Trích xuất thông tin người dùng an toàn trên Server Components với `auth()` session.
- Xử lý cơ chế kiểm tra token và tự động điều hướng (Redirect) trước khi trang web kịp render.

---

## 📖 Definition

### 1. Tại sao cần Middleware trong Next.js?
Nếu bạn chỉ kiểm tra trạng thái đăng nhập bên trong từng Component giao diện, trình duyệt vẫn phải tải mã nguồn và nạp layout về rồi mới kiểm tra và redirect.

**Next.js Middleware (`middleware.ts`)** chạy ở lớp Edge Network **TRƯỚC KHI** request chạm vào bất kỳ Route hay Component nào:
- Nó chặn và kiểm tra Cookie/JWT Session Token của người dùng ngay từ cổng vào.
- Nếu người dùng chưa đăng nhập cố truy cập `/dashboard`, Middleware lập tức gửi phản hồi `NextResponse.redirect('/login')` trong vài mili giây.

### 2. Thư viện Auth.js (NextAuth.js v5)
Auth.js là giải pháp xác thực chuẩn mực chính thức cho Next.js:
- Tự động quản lý Chế độ Session (JWT hoặc Database Session).
- Hỗ trợ sẵn các Nhà cung cấp OAuth (Google, GitHub, Facebook) chỉ với vài dòng cấu hình.
- Cung cấp hàm `auth()` chạy đồng bộ cực nhanh trên cả Server Components, Server Actions và Middleware.

---

## 💻 Syntax

### Next.js Middleware Pattern (`middleware.ts`)
```typescript
// middleware.ts (Đặt tại thư mục gốc dự án)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Cấu hình matcher áp dụng Middleware cho các tuyến đường cụ thể
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"]
};
```

---

## 📝 Example 1 - Khởi tạo Cấu hình Auth.js (NextAuth v5) (`auth.ts`)

```typescript
// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Giả lập kiểm tra CSDL
        if (credentials?.email === "admin@educonnect.vn" && credentials?.password === "123456") {
          return { id: "1", name: "Admin User", email: "admin@educonnect.vn", role: "admin" };
        }
        return null; // Đăng nhập thất bại
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as any).role = token.role;
      return session;
    }
  },
  pages: {
    signIn: "/login", // Trang đăng nhập tùy chỉnh
  }
});
```

---

## 📝 Example 2 - Đọc Session An Toàn trong Server Component với hàm `auth()`

```tsx
// app/dashboard/page.tsx (Server Component)
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Lấy thông tin Session người dùng trực tiếp trên Server (0KB JS sent to client)
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Bảng Điều Khiển Dashboard</h1>
      <div className="mt-4 p-4 bg-slate-100 rounded-xl">
        <p>Xin chào: <strong>{session.user.name}</strong></p>
        <p>Email: {session.user.email}</p>
        <p>Vai trò: <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">{(session.user as any).role}</span></p>
      </div>
    </div>
  );
}
```

---

## 📝 Example 3 - Nút Đăng Xuất Sử Dụng Server Action trong Component

```tsx
// components/SignOutButton.tsx
import { signOut } from "@/auth";

export function SignOutButton() {
  return (
    // Nút đăng xuất kích hoạt Server Action của Auth.js trực tiếp!
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
        Đăng xuất
      </button>
    </form>
  );
}
```

---

## ⚠️ Notes

1. **Vị trí duy nhất của file `middleware.ts`:** File `middleware.ts` bắt buộc phải đặt ở **thư mục gốc của dự án (Root)** hoặc ngay bên trong thư mục `src/` (nếu có dùng thư mục `src/`). Không bao giờ đặt `middleware.ts` bên trong thư mục `app/`.

---

## ❌ Common Mistakes

### Sai 1 - Kiểm tra Auth ở Client làm lộ nội dung riêng tư trong lúc loading
Nếu chỉ dùng `useSession()` ở Client Component để chuyển hướng, trình duyệt vẫn tải về mã nguồn HTML ban đầu của trang Dashboard trước khi client thực hiện redirect. Hãy luôn chặn ở `middleware.ts` hoặc Server Component với `auth()`.

---

## 📚 Summary

- **Middleware (`middleware.ts`)** chặn và kiểm tra token ngay tại Edge Server trước khi request chạm tới các trang.
- **Auth.js (NextAuth v5)** là giải pháp xác thực toàn diện hỗ trợ Credentials và OAuth (Google, GitHub).
- Đọc thông tin phiên làm việc đồng bộ trên Server Component với **`const session = await auth()`**.
- Sử dụng Server Action để đăng xuất an toàn với **`await signOut()`**.

---

## 📝 Quiz

### Question 1
Tập tin đặc biệt nào được đặt tại thư mục gốc dự án Next.js để thực hiện chặn kiểm tra Token và điều hướng (Redirect) ngay tại lớp Edge Server trước khi request chạm vào bất kỳ Route hay Component nào?

A. `auth.ts`  
B. `middleware.ts`  
C. `server.ts`  
D. `router.ts`  

**Answer: B**

---

### Question 2
Hàm nào trong thư viện Auth.js (NextAuth v5) được sử dụng để trích xuất đối tượng Session người dùng trực tiếp và đồng bộ bên trong một Server Component?

A. `useSession()`  
B. `await auth()`  
C. `getAuthUser()`  
D. `fetchSession()`  

**Answer: B**

---

### Question 3
Vị trí đặt file `middleware.ts` chuẩn xác trong cấu hình dự án Next.js là ở đâu?

A. Đặt bên trong thư mục `app/dashboard/`  
B. Đặt tại thư mục gốc của dự án (Root) hoặc ngay trong thư mục `src/`  
C. Đặt trong thư mục `public/`  
D. Đặt trong `node_modules/`  

**Answer: B**
