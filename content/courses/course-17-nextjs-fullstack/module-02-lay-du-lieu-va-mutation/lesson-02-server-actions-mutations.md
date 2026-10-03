---
id: nextjs-fullstack-m2-l2
course: Next.js, Full-stack React & Enterprise System Architecture
module: Lấy dữ liệu và mutation
title: Server Actions & Mutation in Next.js
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Server Actions & Mutation in Next.js

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu kiến trúc **Server Actions** trong React 19 / Next.js 14+ giúp thực hiện các phép biến đổi dữ liệu (Mutations) trên Server không cần viết API Endpoint thủ công.
- Định nghĩa Server Action với chỉ thị **`"use server"`**.
- Gọi Server Action từ HTML Form (`<form action={myAction}>`) hoặc từ Client Component.
- Tích hợp Hook **`useFormStatus`** và **`useFormState`** (hoặc `useActionState`) quản lý trạng thái nộp Form.
- Tự động làm mới giao diện sau khi mutation với **`revalidatePath()`** và điều hướng với **`redirect()`**.

---

## 📖 Definition

### 1. Server Actions là gì?
Trước phiên bản Next.js 13.4, để gửi một Form thêm bài viết từ Client lên Server, bạn phải trải qua 4 bước:
1. Tạo một file Route Handler API `app/api/posts/route.ts`.
2. Viết câu lệnh `fetch('/api/posts', { method: 'POST', body: JSON.stringify(...) })` ở Client.
3. Giải mã JSON và kiểm tra validate ở API Route.
4. Gọi hàm refetch ở Client để cập nhật UI.

**Server Actions** cho phép bạn định nghĩa một **hàm bất đồng bộ chạy trực tiếp trên Server**, và bạn có thể **gọi hàm đó trực tiếp từ Client Component hay thẻ `<form>`**! Next.js tự động xử lý toàn bộ luồng truyền tải HTTP POST ngầm bên dưới.

### 2. Chỉ thị `"use server"`
- Khi đặt `"use server"` ở đầu một file, tất cả các hàm xuất ra từ file đó sẽ trở thành các Server Actions.
- Khi đặt `"use server"` ở đầu thân một hàm async bên trong Server Component, hàm đó sẽ trở thành Server Action cục bộ.

---

## 💻 Syntax

### Server Action Definition Syntax
```typescript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createCourseAction(formData: FormData) {
  const title = formData.get("title") as string;
  const price = Number(formData.get("price"));

  // 1. Lưu vào CSDL trực tiếp ở Server
  await db.course.create({ data: { title, price } });

  // 2. Tự động xóa cache và làm mới giao diện trang /courses ngay lập tức!
  revalidatePath("/courses");
}
```

---

## 📝 Example 1 - Form Thêm Khóa Học Sử Dụng Server Action & `useFormStatus`

```typescript
// app/actions/courseActions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addCourseServerAction(formData: FormData) {
  const title = formData.get("title") as string;
  const price = Number(formData.get("price"));

  if (!title || title.length < 3) {
    return { error: "Tên khóa học phải từ 3 ký tự trở lên!" };
  }

  // Giả lập lưu CSDL
  console.log("💾 [SERVER ACTION] Đã lưu khóa học vào CSDL:", { title, price });

  // Làm tươi lại cache danh sách khóa học
  revalidatePath("/courses");
  // Chuyển hướng người dùng về trang danh sách
  redirect("/courses");
}
```

```tsx
// components/AddCourseForm.tsx
"use client";

import { useFormStatus } from "react-dom";
import { addCourseServerAction } from "@/app/actions/courseActions";

// Component nút Submit dùng useFormStatus đọc trạng thái từ Form cha
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
    >
      {pending ? "⏳ Đang xử lý trên Server..." : "+ Tạo Khóa Học"}
    </button>
  );
}

export function AddCourseForm() {
  return (
    // Gọi trực tiếp Server Action qua thuộc tính action của thẻ <form>!
    <form action={addCourseServerAction} className="max-w-md p-6 bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold">Thêm Khóa Học Mới (Server Action)</h2>

      <div>
        <label className="block text-sm font-medium">Tên khóa học:</label>
        <input name="title" required className="w-full border p-2 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Giá tiền (VNĐ):</label>
        <input name="price" type="number" required className="w-full border p-2 rounded-md" />
      </div>

      <SubmitButton />
    </form>
  );
}
```

---

## 📝 Example 2 - Quản lý Kết Quả Trả Về từ Server Action với `useFormState` (React 19 `useActionState`)

```tsx
// components/QuickFeedbackForm.tsx
"use client";

import { useFormState } from "react-dom";
import { submitFeedbackAction } from "@/app/actions/feedbackActions";

const initialState = { message: "", isSuccess: false };

export function QuickFeedbackForm() {
  // useFormState liên kết Server Action với State kết quả phản hồi trả về từ Server
  const [state, formAction] = useFormState(submitFeedbackAction, initialState);

  return (
    <form action={formAction} className="p-4 border rounded-lg space-y-3">
      {state.message && (
        <p className={state.isSuccess ? "text-emerald-600" : "text-red-600"}>
          {state.message}
        </p>
      )}

      <textarea name="feedback" placeholder="Ý kiến đóng góp của bạn..." className="w-full border p-2 rounded" />
      <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded">
        Gửi Phản Hồi
      </button>
    </form>
  );
}
```

---

## ⚠️ Notes

1. **Bảo mật với Server Actions:** Mặc dù Server Actions cho cảm giác như bạn đang gọi một hàm JS bình thường, nhưng dưới bản chất nó tạo ra một HTTP POST Endpoint ngầm. **Hãy luôn thực hiện kiểm tra Authentication và Validation (với Zod) bên trong Server Action** trước khi lưu vào CSDL.

---

## ❌ Common Mistakes

### Sai 1 - Quên từ khóa `"use server"` ở đầu file chứa Server Action
Nếu bạn quên từ khóa `"use server"`, Next.js sẽ coi đó là hàm Client thông thường và ném lỗi khi bạn cố tình gọi các thư viện CSDL của Node.js (như `fs` hay `prisma`).

---

## 📚 Summary

- **Server Actions** cho phép thực thi hàm Server trực tiếp từ Form hoặc Client Component mà không cần tạo API Routes thủ công.
- Sử dụng chỉ thị **`"use server"`** ở đầu file hoặc thân hàm async.
- Hook **`useFormStatus`** đọc trạng thái đang xử lý (`pending`) của Form cha.
- Hook **`useFormState`** quản lý kết quả/thông báo lỗi trả về từ Server Action.
- Dùng **`revalidatePath()`** để tự động làm mới giao diện sau khi mutation thành công.

---

## 📝 Quiz

### Question 1
Chỉ thị nào bắt buộc phải đặt ở đầu một tập tin hoặc thân hàm async để khai báo một Server Action trong Next.js / React 19?

A. `"use client"`  
B. `"use server"`  
C. `"use action"`  
D. `"use api"`  

**Answer: B**

---

### Question 2
Hook nào của `react-dom` cho phép một Component con (như nút Submit) tự động truy cập và đọc trạng thái đang gửi dữ liệu (`pending`) của thẻ `<form>` cha bọc ngoài nó?

A. `useFormStatus`  
B. `useFormState`  
C. `useFormContext`  
D. `useFormPending`  

**Answer: A**

---

### Question 3
Hàm nào của Next.js (`next/cache`) thường được gọi bên trong một Server Action sau khi lưu thành công dữ liệu mới vào CSDL để tự động xóa bộ đệm và làm mới giao diện trang web ngay lập tức?

A. `revalidatePath("/path")`  
B. `clearCache()`  
C. `refreshUI()`  
D. `reloadPage()`  

**Answer: A**
