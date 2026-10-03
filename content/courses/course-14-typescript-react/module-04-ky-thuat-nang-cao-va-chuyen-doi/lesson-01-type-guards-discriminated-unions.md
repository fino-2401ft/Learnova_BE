---
id: typescript-react-m4-l1
course: TypeScript for React Developers
module: Kỹ thuật nâng cao và chuyển đổi
title: Type Guards, Discriminated Unions & Assertion Functions
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Type Guards, Discriminated Unions & Assertion Functions

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững khái niệm **Type Narrowing** (Thu hẹp phạm vi kiểu dữ liệu) trong TypeScript.
- Viết các hàm **Custom Type Guards** chuẩn mực với cú pháp toán tử **`pet is Fish`** (`parameter is Type`).
- Làm chủ kỹ thuật **Discriminated Unions** (Union có nhãn nhận diện) cho các mẫu thiết kế State phức tạp.
- Sử dụng các toán tử thu hẹp kiểu tích hợp: **`typeof`**, **`instanceof`**, và **`in`**.
- Xây dựng các hàm khẳng định kiểu **Assertion Functions (`asserts value is Type`)**.
- Áp dụng kiểm tra kiệt xuất **Exhaustiveness Checking với `never`** đảm bảo không bỏ sót trường hợp trong câu lệnh `switch`.

---

## 📖 Definition

### 1. Type Narrowing (Thu Hẹp Phạm Vi Kiểu)

Trong TypeScript, một biến thường có kiểu kết hợp Union (như `string | number | null`). Để thực hiện một thao tác dành riêng cho `string` (như `.toUpperCase()`), bạn phải giúp trình biên dịch "thu hẹp" kiểu của biến đó từ `string | number | null` về duy nhất `string`.

Các phương thức Thu Hẹp Kiểu (Type Narrowing):
1. **`typeof`**: Dùng cho các kiểu nguyên thủy (`string`, `number`, `boolean`, `symbol`).
2. **`instanceof`**: Dùng cho các đối tượng tạo từ Class (`Error`, `Date`, `HTMLInputElement`).
3. **`in`**: Dùng để kiểm tra xem một thuộc tính có tồn tại trong Object không (`"message" in error`).
4. **Custom Type Guard (`is` operator):** Một hàm tự định nghĩa trả về kiểu `value is SpecifiedType`.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   LUỒNG THU HẸP KIỂU (TYPE NARROWING)                   │
└────────────────────────────────────────────────────────────────────────┘

 [ Input: string | number ] ───> [ if (typeof x === "string") ]
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
         [ Nhánh Đúng: string ]                              [ Nhánh Sai: number ]
        (Dùng x.toUpperCase())                              (Dùng x.toFixed(2))
```

---

## 2. Exhaustiveness Checking Với Kiểu `never`

Khi bạn có một Discriminated Union chứa 3 kiểu trạng thái:
`type Status = "idle" | "loading" | "success" | "error";`

Nếu bạn xử lý các trạng thái bằng `switch (status)` nhưng lại quên viết trường hợp `case "error"`, TypeScript có thể tự động cảnh báo lỗi nếu bạn khai báo nhánh `default` với cờ `never`:

```typescript
default: {
  // Lỗi compile nếu còn case nào chưa được xử lý!
  const _exhaustiveCheck: never = status;
  return _exhaustiveCheck;
}
```

---

## 💻 Syntax

### Custom Type Guard Syntax
```typescript
interface Admin {
  role: "admin";
  permissions: string[];
}

interface User {
  role: "user";
  name: string;
}

type Person = Admin | User;

// Custom Type Guard với cú pháp "person is Admin"
function isAdmin(person: Person): person is Admin {
  return person.role === "admin";
}
```

---

## 📝 Example 1 - Custom Type Guard Phân Tách Dữ Liệu Bài Viết Video vs Bài Viết Văn Bản

```typescript
// src/types/post.ts

export interface VideoPost {
  type: "video";
  id: string;
  title: string;
  videoUrl: string;
  durationSeconds: number;
}

export interface TextPost {
  type: "text";
  id: string;
  title: string;
  content: string;
  readTimeMinutes: number;
}

export type Post = VideoPost | TextPost;

// 1. Custom Type Guard cho VideoPost
export function isVideoPost(post: Post): post is VideoPost {
  return post.type === "video";
}

// 2. Custom Type Guard cho TextPost
export function isTextPost(post: Post): post is TextPost {
  return post.type === "text";
}

// 3. Render Helper với Exhaustiveness Checking
export function renderPostSummary(post: Post): string {
  if (isVideoPost(post)) {
    // TypeScript tự động biết post là VideoPost 100%!
    return `🎥 [VIDEO] ${post.title} (${post.durationSeconds}s)`;
  }

  if (isTextPost(post)) {
    // TypeScript tự động biết post là TextPost 100%!
    return `📄 [BÀI VIẾT] ${post.title} (${post.readTimeMinutes} phút đọc)`;
  }

  // Khẳng định kiệt xuất
  const _exhaustiveCheck: never = post;
  return _exhaustiveCheck;
}
```

---

## 📝 Example 2 - Discriminated Union Pattern Cho State Máy Trạng Thái (Async State Machine)

```tsx
// src/components/AsyncStateDisplay.tsx
import React from "react";

// Discriminated Union cho 4 Trạng thái riêng biệt của API
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T; timestamp: Date }
  | { status: "error"; error: string };

interface DisplayProps<T> {
  state: AsyncState<T>;
  renderData: (data: T) => React.ReactNode;
}

export function AsyncStateDisplay<T>({ state, renderData }: DisplayProps<T>) {
  switch (state.status) {
    case "idle":
      return <p className="text-slate-400">Vui lòng kích hoạt thao tác nạp dữ liệu.</p>;

    case "loading":
      return <p className="text-blue-600 animate-pulse">⏳ Đang tải dữ liệu ngầm...</p>;

    case "success":
      // TypeScript TỰ ĐỘNG BIẾT state có thuộc tính .data và .timestamp!
      return (
        <div className="space-y-2">
          {renderData(state.data)}
          <p className="text-xs text-slate-400">Tải lúc: {state.timestamp.toLocaleTimeString()}</p>
        </div>
      );

    case "error":
      // TypeScript TỰ ĐỘNG BIẾT state có thuộc tính .error!
      return <p className="text-red-500 font-bold">❌ Lỗi: {state.error}</p>;

    default: {
      const _exhaustiveCheck: never = state;
      return _exhaustiveCheck;
    }
  }
}
```

---

## 📝 Example 3 - Assertion Functions Khẳng Định Dữ Liệu (`asserts value is Type`)

```typescript
// src/utils/assertions.ts

// Assertion Function: Nếu value bị null/undefined -> Ném lỗi crash lập tức. Ngược lại -> Khẳng định value KHÔNG NULL
export function assertIsDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || `Khẳng định thất bại: Giá trị bị ${String(value)}`);
  }
}

// Ví dụ tiêu thụ
function processUserAvatar(avatarUrl: string | null) {
  // Trước khi assert: avatarUrl có kiểu string | null
  assertIsDefined(avatarUrl, "Avatar URL không được để trống!");

  // ĐẰNG SAU DÒNG NÀY: TypeScript TỰ ĐỘNG ÉP KIỂU avatarUrl THÀNH string 100%!
  console.log(avatarUrl.toUpperCase()); // An toàn 100%!
}
```

---

## ⚠️ Notes

1. **Cú Pháp Trả Về Của Custom Type Guard:** Cú pháp trả về của một hàm Type Guard bắt buộc phải là `paramName is Type` (ví dụ `target is HTMLInputElement`). Nếu bạn ghi `boolean`, TypeScript sẽ không thể thực hiện thu hẹp kiểu ở khối `if`.

---

## ❌ Common Mistakes

### Sai 1 - Dùng Type Assertion (`as`) để cưỡng ép kiểu thay vì dùng Type Guard
```typescript
// ❌ SAI NGUY HIỂM: Cưỡng ép kiểu bằng 'as' bỏ qua kiểm tra runtime -> Vẫn crash nếu data thực tế sai!
const video = data as VideoPost;
console.log(video.videoUrl.toUpperCase()); 

// ✅ ĐÚNG CHUẨN TYPESCRIPT: Dùng Custom Type Guard kiểm tra thực tế
if (isVideoPost(data)) {
  console.log(data.videoUrl.toUpperCase());
}
```

---

## 📚 Summary

- **Type Narrowing** giúp thu hẹp phạm vi kiểu từ Union về kiểu cụ thể.
- **Custom Type Guards** sử dụng cú pháp trả về `param is Type`.
- **Discriminated Unions** phân loại các trạng thái dữ liệu dựa trên một thuộc tính nhãn chung (ví dụ `status: "success"`).
- Dùng cờ **`never`** cho **Exhaustiveness Checking** trong `switch-case`.
- Dùng **Assertion Functions (`asserts value is T`)** để ném ngoại lệ và ép kiểu an toàn.

---

## 📝 Quiz

### Question 1
Cú pháp trả về nào trong một hàm JavaScript/TypeScript biến hàm đó thành một Custom Type Guard cho phép TypeScript thu hẹp kiểu biến `item` thành `User`?

A. `function isUser(item: any): boolean`  
B. `function isUser(item: any): item is User`  
C. `function isUser(item: any): User`  
D. `function isUser(item: any): asserts User`  

**Explanation:**  
Cú pháp `paramName is Type` (ví dụ `item is User`) thông báo cho trình biên dịch TypeScript biết rằng nếu hàm này trả về `true`, biến `item` truyền vào chắc chắn có kiểu `User`.

**Answer: B**

---

### Question 2
Kỹ thuật **Exhaustiveness Checking** sử dụng kiểu `never` trong khối `default` của câu lệnh `switch` mang lại lợi ích gì?

A. Tự động mã hóa CSDL  
B. Bắt trình biên dịch TypeScript báo lỗi Compile-time nếu lập trình viên quên xử lý một trong các trường hợp (case) của Discriminated Union  
C. Tự động reload trang web  
D. Cả A và C  

**Explanation:**  
Khi gán `const _check: never = value` trong nhánh `default`, nếu còn bất kỳ trường hợp nào trong Union chưa được xử lý qua `case`, `value` vẫn còn kiểu đó (chưa về `never`) ➔ TypeScript ném lỗi Compile-time báo bạn chưa xử lý hết.

**Answer: B**

---

### Question 3
Toán tử nào được sử dụng để thu hẹp kiểu của một biến dựa trên kiểu phần tử khởi tạo của Class (ví dụ kiểm tra xem biến `err` có phải là một đối tượng `Error` hay không)?

A. `typeof err === "error"`  
B. `err instanceof Error`  
C. `err in Error`  
D. `isError(err)`  

**Explanation:**  
Toán tử `instanceof` kiểm tra xem một đối tượng có được khởi tạo từ một Class/Constructor Function cụ thể hay không (ví dụ `err instanceof Error` hay `el instanceof HTMLInputElement`).

**Answer: B**
