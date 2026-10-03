---
id: nextjs-fullstack-m4-l1
course: Next.js, Full-stack React & Enterprise System Architecture
module: Kiến trúc và triển khai
title: Full-stack Enterprise Project Architecture (E-Commerce / SaaS)
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Full-stack Enterprise Project Architecture (E-Commerce / SaaS)

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Làm chủ kiến trúc dự án doanh nghiệp lớn **Full-stack Enterprise Project Architecture** trong Next.js.
- Phân rã cấu trúc mã nguồn theo nguyên lý **Clean Architecture / Feature-Driven Directory Structure**.
- Tích hợp cơ sở dữ liệu với ORM hiện đại **Prisma ORM** / **Drizzle ORM** và TypeScript.
- Xây dựng mô hình thiết kế **Repository / Service Pattern** tách rời logic kinh doanh khỏi UI.
- Quản lý cấu hình biến môi trường đa cấp (Development, Staging, Production) an toàn với **Zod Environment Validation**.

---

## 📖 Definition

### 1. Kiến trúc Dự Án Enterprise (Feature-Driven Architecture)
Trong các dự án nhỏ, bạn có thể nhét tất cả components vào 1 thư mục `components/`. Nhưng trong các dự án quy mô enterprise với hàng trăm tính năng (Thanh toán, Đơn hàng, Người dùng, Báo cáo), kiến trúc theo Tính Năng (**Feature-Driven Architecture**) giúp các team phát triển độc lập mà không dẫm chân lên nhau.

```text
src/
├── app/                  # Chịu trách nhiệm định tuyến Routing & Layouts
├── features/             # Mỗi thư mục đại diện cho 1 Domain tính năng độc lập
│   ├── auth/             # Component, Hooks, API, Actions của Auth
│   ├── checkout/         # Component, Hooks, API, Actions của Checkout
│   └── courses/          # Component, Hooks, API, Actions của Courses
├── lib/                  # Nơi chứa config CSDL (Prisma), Axios Client, Zod
└── components/ui/        # Shared Primitive UI (Shadcn UI Kit)
```

### 2. Tầng ORM & Service Layer (Prisma ORM)
Thay vì viết các câu lệnh SQL thô (`SELECT * FROM users`), **Prisma ORM** cung cấp Client được tự động định kiểu TypeScript 100% dựa trên file `schema.prisma`.

---

## 💻 Syntax

### Prisma Schema Definition (`prisma/schema.prisma`)
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      String   @default("student")
  createdAt DateTime @default(now())
}
```

---

## 📝 Example 1 - Xây dựng Service Layer Tách Rời Logic CSDL (`src/features/courses/services/courseService.ts`)

```typescript
// src/features/courses/services/courseService.ts
import { prisma } from "@/lib/prisma";

export interface CreateCourseInput {
  title: string;
  description: string;
  price: number;
  authorId: string;
}

// Service Layer tập trung mọi thao tác với CSDL
export const courseService = {
  async getAllCourses() {
    return await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true, email: true } } }
    });
  },

  async getCourseById(id: string) {
    return await prisma.course.findUnique({
      where: { id },
      include: { lessons: true }
    });
  },

  async createCourse(data: CreateCourseInput) {
    return await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        authorId: data.authorId
      }
    });
  }
};
```

---

## 📝 Example 2 - Validate Biến Môi Trường (.env) An Toàn Với Zod (`src/lib/env.ts`)

```typescript
// src/lib/env.ts
import { z } from "zod";

// Định nghĩa Schema kiểm tra biến môi trường bắt buộc
const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL phải là một URL hợp lệ"),
  NEXTAUTH_SECRET: z.string().min(10, "NEXTAUTH_SECRET phải từ 10 ký tự"),
  NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL phải là URL hợp lệ"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

// Quét và validate các biến môi trường khi ứng dụng vừa khởi chạy
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ CẤU HÌNH BIẾN MÔI TRƯỜNG BI LỖI:", _env.error.format());
  throw new Error("Ứng dụng bị dừng do thiếu hoặc sai cấu hình biến môi trường!");
}

export const env = _env.data;
```

---

## 📝 Example 3 - Sử dụng Service Layer trong Server Action (`src/features/courses/actions/createCourse.ts`)

```typescript
// src/features/courses/actions/createCourse.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { courseService } from "../services/courseService";
import { z } from "zod";

const createCourseSchema = z.object({
  title: z.string().min(3, "Tên khóa học từ 3 ký tự trở lên"),
  description: z.string().min(10, "Mô tả từ 10 ký tự trở lên"),
  price: z.number().min(0, "Giá tiền không được số âm")
});

export async function createCourseAction(formData: FormData) {
  // 1. Kiểm tra Quyền người dùng
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    return { error: "Bạn không có quyền thực hiện thao tác này!" };
  }

  // 2. Validate dữ liệu đầu vào với Zod
  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    price: Number(formData.get("price"))
  };

  const validation = createCourseSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // 3. Gọi Service Layer xử lý CSDL
  try {
    await courseService.createCourse({
      ...validation.data,
      authorId: session.user.id!
    });

    revalidatePath("/courses");
    return { success: true };
  } catch (err: any) {
    return { error: "Lỗi hệ thống CSDL: " + err.message };
  }
}
```

---

## ⚠️ Notes

1. **Không truy vấn CSDL trực tiếp trong Component UI:** Luôn phân rã mã nguồn thành 3 tầng rõ ràng: **UI Component ➔ Server Action / Route Handler ➔ Service Layer (Prisma)**. Điều này giúp mã nguồn dễ viết Unit Test và có thể tái sử dụng logic ở nhiều nơi.

---

## ❌ Common Mistakes

### Sai 1 - Khai báo PrismaClient mới ở mọi lượt request gây cạn kiệt Connection Pool CSDL
```typescript
// ❌ Sai: Mỗi lần gọi API lại new PrismaClient() -> Nhanh chóng bị crash CSDL do cạn Connection!
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ✅ Đúng: Khởi tạo Singleton Prisma Instance dùng chung (như trong src/lib/prisma.ts)
```

---

## 📚 Summary

- **Feature-Driven Architecture** chia mã nguồn theo từng Domain tính năng độc lập dễ mở rộng.
- **Prisma ORM** truy vấn CSDL với tự động định kiểu TypeScript 100%.
- **Service Layer** đóng gói logic thao tác CSDL độc lập khỏi giao diện.
- **Zod Environment Validation** đảm bảo ứng dụng không khởi chạy nếu thiếu file `.env`.

---

## 📝 Quiz

### Question 1
Mô hình tổ chức mã nguồn theo tính năng độc lập (Feature-Driven Architecture) mang lại lợi ích mấu chốt nào cho các dự án Enterprise lớn?

A. Tự động mã hóa ảnh  
B. Gom nhóm tất cả Component, Actions, Services của từng miền tính năng (như auth, checkout, courses) vào thư mục riêng giúp dễ bảo trì và phân công team  
C. Xóa bỏ hoàn toàn HTML  
D. Không cần dùng Git  

**Answer: B**

---

### Question 2
Công cụ ORM nào hiện đại hỗ trợ tự động sinh kiểu dữ liệu TypeScript 100% dựa trên file `schema.prisma` giúp lập trình viên truy vấn CSDL an toàn và thông minh?

A. Express  
B. Prisma ORM (hoặc Drizzle ORM)  
C. jQuery  
D. Webpack  

**Answer: B**

---

### Question 3
Tại sao bạn nên kiểm tra biến môi trường bằng Zod (`envSchema.safeParse(process.env)`) ngay khi ứng dụng khởi chạy?

A. Để làm tăng dung lượng file build  
B. Để tự động phát hiện và dừng ứng dụng ngay lập tức nếu thiếu hoặc sai định dạng các biến môi trường quan trọng (như DATABASE_URL) trước khi lỗi xảy ra trên Production  
C. Để tự động đổi màu trang web  
D. Không có tác dụng gì  

**Answer: B**
