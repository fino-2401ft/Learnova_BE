---
id: typescript-react-m1-l1
course: TypeScript for React Developers
module: Nền tảng TypeScript
title: TypeScript Fundamentals for React
order: 1
difficulty: Intermediate
estimatedTime: 240
---
# TypeScript Fundamentals for React

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích lợi ích chiến lược của **TypeScript** trong việc triệt tiêu toàn bộ nhóm lỗi runtime phổ biến như `TypeError: Cannot read properties of undefined`.
- Khai báo và phân biệt các kiểu dữ liệu cơ bản (Primitives: `string`, `number`, `boolean`, `null`, `undefined`) và kiểu dữ liệu mở rộng (`any`, `unknown`, `never`).
- Phân biệt sự khác nhau giữa hai cú pháp **`type` alias** và **`interface`**.
- Khai báo kiểu cho Mảng (`T[]`, `Array<T>`) và Tuples (`[string, number]`).
- Cấu hình tệp tin **`tsconfig.json`** với các quy tắc kiểm tra nghiêm ngặt (`strict: true`, `noImplicitAny`).
- Tận dụng tính năng tự động suy luận kiểu (**Type Inference**) của TypeScript Compiler.

---

## 📖 Definition

### 1. Tại Sao Lập Trình Viên React Hiện Đại Bắt Buộc Phải Dùng TypeScript?

Trong JavaScript thuần, mọi phát hiện lỗi chỉ xảy ra khi ứng dụng đang chạy thực tế trên trình duyệt của người dùng (Runtime). Một lỗi cú pháp đơn giản như gõ sai tên thuộc tính `user.profil.name` thay vì `user.profile.name` sẽ làm crash toàn bộ giao diện màn hình trắng.

**TypeScript** là một Siêu tập hợp có kiểu (Typed Superset) của JavaScript:
- **Phát hiện lỗi ngay tại thời điểm gõ phím (Compile-time Type Checking):** Trình soạn thảo (VS Code) sẽ lập tức gạch chân đỏ báo lỗi trước khi bạn lưu file.
- **Tự động gợi ý mã nguồn thông minh (Autocompletion / IntelliSense):** Gợi ý 100% tên thuộc tính và hàm sẵn có mà không cần phải mở file khác để tra cứu.
- **Tự tin Refactor mã nguồn:** Khi bạn đổi tên 1 thuộc tính trong đối tượng User, TypeScript sẽ tự động báo lỗi ở tất cả 50 file đang tiêu thụ đối tượng đó.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   SO SÁNH THỜI ĐIỂM PHÁT HIỆN LỖI                     │
└────────────────────────────────────────────────────────────────────────┘

 [ JavaScript Thuần ] ───> Code ───> Build ───> Trình duyệt Crash! (Runtime Error)
 
 [ TypeScript ]      ───> Code ───> [ LỖI GẠCH ĐỎ NGAY LÚC GÕ! ] (Compile-time Error)
```

---

## 2. Phân Biên: `type` Alias vs `interface`

Cả `type` và `interface` đều dùng để định nghĩa hình dạng dữ liệu (Shape of Object). Tuy nhiên chúng có các khác biệt mấu chốt:

1. **`interface` (Giao diện):**
   - Chuyên dùng để định nghĩa cấu trúc của **Objects** và **Classes**.
   - Hỗ trợ tính năng **Declaration Merging** (tự động hợp nhất 2 interface cùng tên).
   - Hỗ trợ kế thừa qua từ khóa `extends`.
2. **`type` Alias (Bí danh kiểu):**
   - Rất linh hoạt, có thể đại diện cho Primitive types, Unions (`string | number`), Tuples, và Functions.
   - Không hỗ trợ Declaration Merging.
   - Kết hợp các kiểu qua từ khóa `&` (Intersection Types).

*Khuyên dùng trong React:* Dùng `interface` cho Props của Component và API Response Objects; dùng `type` cho Union States, Event Handlers, và Handled Utility Types.

---

## 3. Thẩm Định Kiểu: `unknown` vs `any` vs `never`

- **`any` (Vô hiệu hóa kiểm tra kiểu):** Bỏ qua hoàn toàn sự kiểm tra của TypeScript. Đây là một anti-pattern nguy hiểm làm mất tác dụng của TypeScript.
- **`unknown` (Kiểu chưa xác định an toàn):** Bắt buộc bạn phải kiểm tra kiểu (Type Narrowing via `typeof` hay `instanceof`) trước khi thực hiện thao tác trên biến đó.
- **`never` (Kiểu không bao giờ xảy ra):** Dùng biểu diễn giá trị của các hàm luôn ném ngoại lệ (`throw new Error()`) hoặc các vòng lặp vô tận.

---

## 💻 Syntax

### 1. Primitives & Arrays Syntax
```typescript
const courseName: string = "React TypeScript Masterclass";
const studentCount: number = 1500;
const isPublished: boolean = true;

// Mảng
const tags: string[] = ["react", "typescript", "frontend"];
const scores: Array<number> = [90, 85, 95];

// Tuple (Mảng có kích thước và kiểu cố định tại từng vị trí)
const httpResponse: [number, string] = [200, "OK"];
```

### 2. Interface & Type Alias Syntax
```typescript
// Interface với thuộc tính tùy chọn (?) và Readonly
interface UserProfile {
  readonly id: string; // Không thể sửa id sau khi tạo
  name: string;
  email: string;
  avatarUrl?: string; // Tùy chọn (có thể undefined)
}

// Type với Union Type
type UserRole = "admin" | "instructor" | "student";

// Interface Kế Thừa (Extends)
interface StudentProfile extends UserProfile {
  enrolledCourses: string[];
  role: UserRole;
}
```

---

## 📝 Example 1 - Định Nghĩa Hình Dạng Dữ Liệu Khóa Học Với Interface & Union Types

```typescript
// src/types/course.ts

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  isFreePreview: boolean;
}

export interface Course {
  readonly id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number;
  level: CourseLevel;
  instructor: Instructor;
  lessons: Lesson[];
  tags: string[];
  createdAt: Date;
}

// Hàm tính toán tổng thời lượng học
export function calculateTotalDuration(lessons: Lesson[]): number {
  return lessons.reduce((total, lesson) => total + lesson.durationMinutes, 0);
}
```

---

## 📝 Example 2 - Phân Tách `unknown` và `any` Trong Xử Lý Bắt Lỗi Try...Catch An Toàn

```typescript
// src/utils/errorHandler.ts

// ❌ NGUY HIỂM: Dùng any bỏ qua kiểm tra kiểu
export function handleBadError(error: any) {
  console.log(error.message.toUpperCase()); // Crash nếu error không phải là Object chứa .message!
}

// ✅ ĐÚNG CHUẨN TYPESCRIPT: Dùng unknown kết hợp Type Narrowing
export function handleSafeError(error: unknown): string {
  if (error instanceof Error) {
    // TypeScript tự động hiểu error là đối tượng Error chuẩn
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return "Đã xảy ra một lỗi không xác định";
}
```

---

## 📝 Example 3 - Cấu Hình File `tsconfig.json` Nghiêm Ngặt Cho Dự Án React

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* 💡 QUY TẮC KIỂM TRA NGHIÊM NGẶT (STRICT CHECKS) */
    "strict": true,                         // Bật toàn bộ kiểm tra nghiêm ngặt
    "noImplicitAny": true,                  // Cấm tự động ép kiểu any ngầm định
    "strictNullChecks": true,               // Bắt buộc kiểm tra null/undefined
    "noUnusedLocals": true,                 // Báo lỗi biến không sử dụng
    "noUnusedParameters": true,             // Báo lỗi tham số hàm không sử dụng
    "noImplicitReturns": true,              // Bắt buộc mọi nhánh hàm phải return
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]                      // Cấu hình Alias path @/
    }
  },
  "include": ["src"]
}
```

---

## ⚠️ Notes

1. **Luôn Bật `strictNullChecks: true`:** Việc bật `strictNullChecks` giúp TypeScript ép buộc bạn phải kiểm tra `if (user !== null)` trước khi truy cập `user.name`, loại bỏ hoàn toàn các lỗi sập ứng dụng kinh điển `Cannot read properties of null`.

---

## ❌ Common Mistakes

### Sai 1 - Lạm dụng kiểu `any` làm mất đi giá trị của TypeScript
```typescript
// ❌ SAI TAI HẠI: Viết TypeScript nhưng ép kiểu any khắp nơi -> Không khác gì JS thuần!
function processData(data: any) {
  return data.items.map((i: any) => i.name);
}

// ✅ ĐÚNG CHUẨN: Khai báo Generic hoặc Interface cụ thể
interface DataResponse<T> {
  items: T[];
}
```

---

## 📚 Summary

- **TypeScript** giúp phát hiện 100% lỗi cú pháp và kiểu ngay tại thời điểm gõ phím (Compile-time).
- Dùng **`interface`** cho cấu trúc Objects/Props; dùng **`type`** cho Unions/Primitives.
- Tránh xa **`any`**; ưu tiên dùng **`unknown`** kết hợp kiểm tra kiểu (Type Narrowing).
- Bật cờ **`strict: true`** trong `tsconfig.json` để tối đa hóa độ an toàn của mã nguồn.

---

## 📝 Quiz

### Question 1
Lợi ích vượt trội mấu chốt nhất của việc tích hợp TypeScript vào dự án React so with JavaScript thuần là gì?

A. TypeScript giúp mã nguồn tự động chạy nhanh hơn 10 lần trên trình duyệt  
B. TypeScript cho phép phát hiện các lỗi sai kiểu (Type Error) và sai tên thuộc tính ngay tại thời điểm gõ phím (Compile-time) thay vì chờ ứng dụng bị crash khi chạy thực tế (Runtime)  
C. TypeScript thay thế HTML  
D. TypeScript xóa bỏ nhu cầu viết CSS  

**Explanation:**  
Trình biên dịch TypeScript kiểm tra mã nguồn tĩnh ngay trong VS Code, hiển thị gạch chân đỏ cảnh báo lỗi sai kiểu hoặc sai tên thuộc tính trước khi bạn chạy ứng dụng, ngăn chặn lỗi màn hình trắng sản phẩm.

**Answer: B**

---

### Question 2
Sự khác biệt mấu chốt về mặt an toàn kiểu giữa hai từ khóa `unknown` và `any` trong TypeScript là gì?

A. `any` an toàn hơn `unknown`  
B. `any` tắt hoàn toàn kiểm tra kiểu, trong khi `unknown` bắt buộc lập trình viên phải thực hiện kiểm tra kiểu (Type Narrowing via typeof/instanceof) trước khi thao tác  
C. `unknown` chỉ dùng cho số  
D. Cả hai hoàn toàn giống nhau  

**Explanation:**  
Khi một biến có kiểu `unknown`, TypeScript sẽ không cho phép bạn gọi hàm hay truy cập thuộc tính trên nó trừ khi bạn đã kiểm tra kiểu của nó (ví dụ `if (typeof x === 'string')`). Ngược lại `any` bỏ qua mọi sự kiểm tra.

**Answer: B**

---

### Question 3
Tính năng đặc thù nào chỉ có ở `interface` mà KHÔNG HỖ TRỢ đối với `type` alias trong TypeScript?

A. Khai báo mảng  
B. Declaration Merging (Tự động hợp nhất 2 interface cùng tên trong cùng scope)  
C. Khai báo Union type  
D. Khai báo chuỗi  

**Explanation:**  
`interface` hỗ trợ Declaration Merging: Nếu bạn khai báo 2 `interface User` ở hai nơi khác nhau, TypeScript sẽ tự động gộp các thuộc tính của 2 interface đó lại làm một. `type` alias không có tính năng này và sẽ ném lỗi trùng tên.

**Answer: B**
