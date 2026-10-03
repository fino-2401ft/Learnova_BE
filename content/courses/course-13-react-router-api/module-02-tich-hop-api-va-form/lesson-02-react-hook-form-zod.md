---
id: react-router-api-m2-l2
course: React Router & API Integration
module: Tích hợp API và form
title: React Hook Form + Zod Validation
order: 2
difficulty: Advanced
estimatedTime: 240
---
# React Hook Form + Zod Validation

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Giải thích bản chất tại sao **React Hook Form (RHF)** mang lại hiệu năng vượt trội gấp nhiều lần so with Controlled Components dùng `useState` nhờ kiến trúc **Uncontrolled Component**.
- Định nghĩa các quy tắc xác thực dữ liệu tập trung (Schema Validation) với thư viện **Zod**.
- Tích hợp RHF và Zod qua bộ chuyển đổi **`@hookform/resolvers/zod`**.
- Đăng ký các ô nhập liệu bằng phương thức toán tử spread `{...register("fieldName")}` và bắt thông báo lỗi qua `formState.errors`.
- Xử lý các Form phức tạp với Dynamic Fields (`useFieldArray`), Checkbox Groups, và Select Inputs.
- Quản lý trạng thái đang nộp Form (`isSubmitting`) và tự động reset dữ liệu form.

---

## 📖 Definition

### 1. Tại Sao Controlled Form Với `useState` Lại Gây Lag Giao Diện?

Trong phong cách Controlled Form truyền thống:
```jsx
// ❌ CÁCH CŨ: Re-render ở MỌI LẦN gõ phím!
const [text, setText] = useState("");
<input value={text} onChange={(e) => setText(e.target.value)} />
```

Mỗi khi người dùng gõ **1 ký tự** vào ô input, câu lệnh `setText` được kích hoạt ➔ Toàn bộ Form Component (gồm cả 20 ô input khác) **bắt buộc phải bị Re-render lại**. Với các Form đăng ký phức tạp (như Form thanh toán, Form khai báo bảo hiểm), điều này gây trễ và đơ giao diện rõ rệt.

**React Hook Form (RHF)** áp dụng kiến trúc **Uncontrolled Component dựa trên `ref`**:
- RHF không lưu từng ký tự vào React State.
- Nó truy cập trực tiếp giá trị ô input qua DOM Ref khi cần.
- **KHÔNG RE-RENDER FORM COMPONENT KHI GÕ PHÍM**, giúp hiệu năng tăng tốc vượt trội.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   SO SÁNH HIỆU NĂNG RENDER KHI GÕ PHÍM                 │
└────────────────────────────────────────────────────────────────────────┘

 [ Controlled Form (useState) ] ──( Gõ 1 ký tự )──> [ RE-RENDER TOÀN FORM! ]
 
 [ React Hook Form (ref) ]     ──( Gõ 1 ký tự )──> [ 0 RE-RENDER ] (Mượt 100%)
```

---

## 2. Thư Viện Schema Validation Zod

Thay vì phải tự viết hàng chục câu lệnh `if...else` thủ công rải rác để kiểm tra độ dài chuỗi, định dạng email, mật khẩu trùng khớp...

**Zod** cho phép bạn định nghĩa một bộ quy tắc xác thực tập trung độc lập (**Zod Schema**):
- Tự động kiểm tra kiểu dữ liệu, regex, chuỗi tối thiểu/tối đa, số dương.
- Tự động sinh ra kiểu dữ liệu TypeScript tĩnh qua `z.infer<typeof schema>`.
- Hiển thị thông báo lỗi tiếng Việt tùy chỉnh dễ dàng.

---

## 3. Bộ Nối `@hookform/resolvers/zod`

Gói `@hookform/resolvers/zod` đóng vai trò là chiếc cầu nối giữa React Hook Form và Zod:
- Người dùng bấm nút Submit Form ➔ RHF truyền toàn bộ giá trị form cho `zodResolver(schema)`.
- Zod thực hiện kiểm tra ➔ Nếu có lỗi, Zod tự động đẩy danh sách thông báo lỗi vào `formState.errors` của React Hook Form.

---

## 💻 Syntax

### Zod Schema & RHF Setup Blueprint
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 1. Định nghĩa Zod Schema
const loginSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải từ 6 ký tự trở lên")
});

// 2. Trích xuất kiểu TypeScript tự động từ Zod Schema
type LoginFormValues = z.infer<typeof loginSchema>;

// 3. Khởi tạo Hook
function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (data: LoginFormValues) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}
    </form>
  );
}
```

---

## 📝 Example 1 - Form Tạo Khóa Học Đầy Đủ Với Zod Validation Và Ép Kiểu Number

```tsx
// src/components/CreateCourseForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 1. Khai báo Zod Schema với các thông báo lỗi tiếng Việt
const courseFormSchema = z.object({
  title: z.string()
    .min(5, "Tên khóa học phải có ít nhất 5 ký tự")
    .max(50, "Tên khóa học không được vượt quá 50 ký tự"),
  price: z.number({ invalid_type_error: "Giá tiền phải là một số" })
    .min(0, "Giá tiền không được là số âm"),
  category: z.enum(["frontend", "backend", "mobile"], {
    errorMap: () => ({ message: "Vui lòng chọn một danh mục hợp lệ" })
  }),
  description: z.string().min(10, "Mô tả chi tiết phải từ 10 ký tự trở lên")
});

// 2. Trích xuất Type từ Schema
type CourseFormValues = z.infer<typeof courseFormSchema>;

export function CreateCourseForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      price: 0,
      category: "frontend",
      description: ""
    }
  });

  const handleFormSubmit = async (data: CourseFormValues) => {
    // Giả lập gửi API
    await new Promise((res) => setTimeout(res, 1500));
    console.log("Dữ liệu Form gửi đi hợp lệ:", data);
    alert("✅ Tạo khóa học thành công!");
    reset(); // Reset form về trạng thái ban đầu
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-lg mx-auto p-6 bg-white rounded-2xl border shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Tạo Khóa Học Mới</h2>

      {/* Trường Tên khóa học */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tên khóa học:</label>
        <input
          {...register("title")}
          className={`w-full border rounded-lg p-2.5 text-sm ${errors.title ? "border-red-500 bg-red-50" : "border-slate-300"}`}
        />
        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
      </div>

      {/* Trường Giá tiền (Bắt buộc dùng valueAsNumber) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Giá tiền (VNĐ):</label>
        <input
          type="number"
          {...register("price", { valueAsNumber: true })}
          className={`w-full border rounded-lg p-2.5 text-sm ${errors.price ? "border-red-500 bg-red-50" : "border-slate-300"}`}
        />
        {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>}
      </div>

      {/* Trường Danh mục */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục:</label>
        <select {...register("category")} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
          <option value="frontend">Frontend Development</option>
          <option value="backend">Backend Development</option>
          <option value="mobile">Mobile Development</option>
        </select>
        {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
      </div>

      {/* Trường Mô tả */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết:</label>
        <textarea
          rows={4}
          {...register("description")}
          className={`w-full border rounded-lg p-2.5 text-sm ${errors.description ? "border-red-500 bg-red-50" : "border-slate-300"}`}
        />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "⏳ Đang gửi dữ liệu..." : "Tạo Khóa Học"}
      </button>
    </form>
  );
}
```

---

## 📝 Example 2 - Phân Tách Schema Ra File Riêng Và Kiểm Tra Mật Khẩu Trùng Khớp (`refine`)

```typescript
// src/schemas/registerSchema.ts
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Họ và tên ít nhất 2 ký tự"),
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải từ 6 ký tự trở lên"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không trùng khớp!",
  path: ["confirmPassword"] // Gán lỗi vào ô confirmPassword
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
```

---

## 📝 Example 3 - Xử Lý Dynamic Fields (Danh Sách Động) Với `useFieldArray`

```tsx
// src/components/DynamicLessonForm.tsx
import React from "react";
import { useForm, useFieldArray } from "react-hook-form";

interface LessonFormValues {
  courseTitle: string;
  lessons: { title: string; duration: number }[];
}

export function DynamicLessonForm() {
  const { register, control, handleSubmit } = useForm<LessonFormValues>({
    defaultValues: {
      courseTitle: "",
      lessons: [{ title: "Bài 1: Giới thiệu", duration: 15 }]
    }
  });

  // useFieldArray quản lý việc thêm/xóa dòng động trong Form
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lessons"
  });

  const onSubmit = (data: LessonFormValues) => {
    console.log("Danh sách bài học Submit:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 border rounded-xl max-w-lg space-y-4">
      <h3 className="font-bold text-lg">Thiết Kế Lộ Trình Bài Học</h3>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center space-x-2">
          <input
            {...register(`lessons.${index}.title` as const)}
            placeholder="Tên bài học"
            className="flex-1 border p-2 rounded text-sm"
          />
          <input
            type="number"
            {...register(`lessons.${index}.duration` as const, { valueAsNumber: true })}
            placeholder="Phút"
            className="w-20 border p-2 rounded text-sm"
          />
          <button type="button" onClick={() => remove(index)} className="text-red-600 text-sm font-bold">
            ✕
          </button>
        </div>
      ))}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={() => append({ title: "", duration: 10 })}
          className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm font-medium"
        >
          + Thêm Bài Học
        </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium">
          Lưu Lộ Trình
        </button>
      </div>
    </form>
  );
}
```

---

## ⚠️ Notes

1. **Sử Dụng `valueAsNumber: true` Cho Input Số:** Mặc định trong HTML DOM, giá trị thu được từ `<input type="number">` vẫn là dạng Chuỗi (`"500000"`). Nếu bạn không thêm `{ valueAsNumber: true }` vào câu lệnh `register()`, Zod Schema dạng `z.number()` sẽ ném lỗi "Expected number, received string".
2. **Cú Pháp Spread `{...register("name")}`:** Cú pháp toán tử Spread `...` giúp trích xuất đầy đủ 4 thuộc tính do React Hook Form tự động quản lý: `name`, `ref`, `onChange`, và `onBlur`.

---

## ❌ Common Mistakes

### Sai 1 - Nhầm lẫn giữa `onSubmit` của bạn và `handleSubmit` của RHF
```jsx
// ❌ SAI TAI HẠI: Truyền trực tiếp hàm handleSave vào onSubmit của thẻ form -> Không kích hoạt Validation và e.preventDefault()!
<form onSubmit={handleSave}>

// ✅ ĐÚNG CHUẨN REACT HOOK FORM:
<form onSubmit={handleSubmit(handleSave)}>
```

---

## 📚 Summary

- **React Hook Form (RHF)** dựa trên kiến trúc Uncontrolled Component (DOM Ref) giúp triệt tiêu hiện tượng Re-render thừa khi gõ phím.
- **Zod** định nghĩa bộ quy tắc xác thực dữ liệu (Schema) tập trung và tự động trích xuất kiểu TypeScript.
- Kết hợp RHF và Zod qua **`zodResolver(schema)`**.
- Dùng **`register("fieldName")`** để liên kết ô input và đọc lỗi từ `formState.errors`.
- Dùng **`useFieldArray`** cho các form có danh sách thêm/xóa dòng động.

---

## 📝 Quiz

### Question 1
Lợi ích vượt trội mấu chốt về mặt hiệu năng của React Hook Form so với cách làm Controlled Form truyền thống dùng `useState` là gì?

A. React Hook Form tự động mã hóa SSL  
B. React Hook Form dựa trên kiến trúc Uncontrolled Component (dùng Ref) và KHÔNG gây Re-render lại toàn bộ Form Component mỗi khi người dùng gõ 1 ký tự  
C. React Hook Form không cần cài đặt qua npm  
D. React Hook Form tự động tải lại trang web  

**Explanation:**  
RHF truy cập dữ liệu trực tiếp từ DOM Ref khi submit thay vì lưu từng ký tự vào React State. Điều này giúp loại bỏ 100% các lượt Re-render không cần thiết mỗi khi gõ phím, làm cho Form mượt mà ngay cả với hàng chục ô nhập liệu.

**Answer: B**

---

### Question 2
Hàm nào được cung cấp bởi bộ nối `@hookform/resolvers/zod` dùng để kết nối một Zod Schema vào thuộc tính `resolver` của `useForm`?

A. `zodResolver(schema)`  
B. `useZod(schema)`  
C. `connectZod(schema)`  
D. `validateZod(schema)`  

**Explanation:**  
Hàm `zodResolver(schema)` đóng vai trò chuyển đổi Zod Schema thành một Validation Resolver tương thích với React Hook Form, tự động đẩy danh sách thông báo lỗi vào `formState.errors`.

**Answer: A**

---

### Question 3
Cú pháp TypeScript chuẩn nào được sử dụng để tự động trích xuất kiểu dữ liệu tĩnh (Static Type) từ một Zod Schema đã định nghĩa `const mySchema = z.object({...})`?

A. `type MyType = z.infer<typeof mySchema>;`  
B. `type MyType = z.getType<mySchema>;`  
C. `type MyType = typeof mySchema;`  
D. `type MyType = z.extract(mySchema);`  

**Explanation:**  
Zod cung cấp hàm tiện ích `z.infer<typeof schema>` giúp tự động suy luận và trích xuất ra kiểu dữ liệu TypeScript chuẩn xác từ định nghĩa Schema mà không cần phải viết lại Interface thủ công.

**Answer: A**
