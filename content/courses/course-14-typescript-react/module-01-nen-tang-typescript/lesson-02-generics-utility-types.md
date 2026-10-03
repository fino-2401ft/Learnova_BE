---
id: typescript-react-m1-l2
course: TypeScript for React Developers
module: Nền tảng TypeScript
title: Generics & Utility Types
order: 2
difficulty: Intermediate
estimatedTime: 240
---
# Generics & Utility Types

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích khái niệm **Generics** (Tham số kiểu - Type Parameters `<T>`) giúp tái sử dụng mã nguồn linh hoạt mà vẫn đảm bảo tính an toàn kiểu 100%.
- Ràng buộc tham số kiểu với từ khóa **`extends`** (Generic Constraints `<T extends object>`).
- Tải giá trị mặc định cho Generics (`<T = string>`).
- Nắm vững và ứng dụng thành thạo các **Built-in Utility Types** phổ biến của TypeScript:
  - **`Partial<T>`**: Biến tất cả thuộc tính thành optional (`?`).
  - **`Required<T>`**: Bắt buộc tất cả thuộc tính (xóa bỏ `?`).
  - **`Readonly<T>`**: Đóng băng không cho sửa đổi thuộc tính.
  - **`Pick<T, K>`**: Trích xuất một tập hợp thuộc tính cụ thể.
  - **`Omit<T, K>`**: Loại bỏ một tập hợp thuộc tính cụ thể.
  - **`Record<K, T>`**: Tạo Map/Dictionary với key `K` và value `T`.
  - **`ReturnType<T>`**: Trích xuất kiểu trả về của một hàm.

---

## 📖 Definition

### 1. Generics (Tham Số Kiểu Tự Co Co) Là Gì?

Hãy tưởng tượng bạn muốn viết một hàm nhận vào một mảng và trả về phần tử đầu tiên của mảng đó.

- Nếu viết `function getFirst(arr: any[]): any`, bạn bị mất hoàn toàn định kiểu dữ liệu đầu ra.
- Nếu viết hàm riêng `getFirstString(arr: string[])` và `getFirstNumber(arr: number[])`, bạn bị lặp code.

**Generics `<T>`** cho phép bạn truyền **Kiểu dữ liệu như một Tham số**!
```typescript
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}
```
Khi bạn gọi `getFirst([1, 2, 3])`, TypeScript tự động hiểu `T` là `number` và suy luận ra kiểu trả về chính xác là `number | undefined`!

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CƠ CHẾ TRUYỀN THAM SỐ KIỂU CỦA GENERICS             │
└────────────────────────────────────────────────────────────────────────┘

 [ Input Data: string[] ] ───> function getFirst<T>(arr: T[]): T
                                                  │
                                                  ▼
                               [ TypeScript suy luận: T = string ]
                                                  │
                                                  ▼
                              [ Output Return Type: string ]
```

---

## 2. Các Utility Types Chuẩn Cốt Lõi Của TypeScript

TypeScript cung cấp sẵn các toán tử biến đổi Kiểu dữ liệu (Utility Types) vô cùng mạnh mẽ:

1. **`Partial<User>`**: Tạo ra một kiểu mới mà mọi thuộc tính của `User` đều trở thành tùy chọn (`?`). Dùng cho hàm Update Profile.
2. **`Omit<User, "id" | "createdAt">`**: Tạo ra kiểu mới loại bỏ thuộc tính `id` và `createdAt`. Dùng cho Form Tạo Mới User.
3. **`Pick<User, "id" | "name">`**: Chỉ lấy duy nhất 2 thuộc tính `id` và `name`. Dùng cho Component Avatar nhỏ.
4. **`Record<string, number>`**: Tạo ra một Đối tượng Map với key là `string` và value là `number`.

---

## 💻 Syntax

### Generic Function & Constraints Syntax
```typescript
// Generic Function với constraint T phải là object
function mergeObjects<T extends object, U extends object>(objA: T, objB: U): T & U {
  return { ...objA, ...objB };
}

const merged = mergeObjects({ name: "Long" }, { age: 25 });
// merged có kiểu: { name: string } & { age: number }
```

---

## 📝 Example 1 - Xây Dựng Component Table Dữ Liệu Tái Sử Dụng Với Generics (Generic Table Component)

```tsx
// src/components/GenericTable.tsx
import React from "react";

// 1. Định nghĩa Column Interface với Generic T đại diện cho Dữ liệu của 1 dòng (Row Data)
export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowId: (item: T) => string | number;
}

// 2. Component Generic nhận tham số kiểu <T>
export function GenericTable<T>({ data, columns, getRowId }: GenericTableProps<T>) {
  return (
    <div className="overflow-x-auto border rounded-xl shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase">
          <tr>
            {columns.map((col, idx) => (
              <th key={String(col.key) + idx} className="p-3 border-b">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y text-sm text-slate-800">
          {data.map((item) => (
            <tr key={getRowId(item)} className="hover:bg-slate-50 transition-colors">
              {columns.map((col, idx) => (
                <td key={String(col.key) + idx} className="p-3">
                  {col.render
                    ? col.render(item)
                    : String((item as any)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 📝 Example 2 - Ứng Dụng Utility Types `Omit`, `Partial`, và `Record` Trong API Service Layer

```typescript
// src/services/userService.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
  createdAt: Date;
}

// 1. Kiểu dữ liệu để tạo User mới (Loại bỏ id và createdAt tự sinh bởi DB)
export type CreateUserInput = Omit<User, "id" | "createdAt">;

// 2. Kiểu dữ liệu để cập nhật User (Tất cả thuộc tính đều tùy chọn, trừ id)
export type UpdateUserInput = Partial<Omit<User, "id">> & { id: string };

// 3. Kiểu dữ liệu Map lưu trữ Cache theo ID
export type UserCacheMap = Record<string, User>;

export const userService = {
  // Hàm tạo mới nhận CreateUserInput
  createUser: async (input: CreateUserInput): Promise<User> => {
    return {
      ...input,
      id: "USR-" + Date.now(),
      createdAt: new Date()
    };
  },

  // Hàm cập nhật nhận UpdateUserInput
  updateUser: async (input: UpdateUserInput): Promise<User> => {
    console.log("Cập nhật user ID:", input.id);
    return {} as User;
  }
};
```

---

## 📝 Example 3 - Trích Xuất Kiểu Dữ Liệu Tự Động Với `ReturnType` và `Parameters`

```typescript
// src/utils/typeExtractors.ts

function createApiResponse(status: number, message: string, data: { items: string[] }) {
  return {
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

// 1. Tự động trích xuất kiểu trả về của hàm createApiResponse mà không cần viết lại Interface!
export type ApiResponse = ReturnType<typeof createApiResponse>;

// 2. Tự động trích xuất kiểu của mảng các tham số truyền vào hàm
export type CreateApiResponseParams = Parameters<typeof createApiResponse>;
// [status: number, message: string, data: { items: string[] }]
```

---

## ⚠️ Notes

1. **Ràng Buộc Generics Với `extends`:** Nếu không ràng buộc Generics (ví dụ `<T extends { id: string } >`), bạn sẽ không thể truy cập thuộc tính `item.id` bên trong hàm vì TypeScript không thể đảm bảo `T` có chứa `id` hay không.

---

## ❌ Common Mistakes

### Sai 1 - Tạo quá nhiều biến Generic `<T, U, V, X, Y>` không cần thiết làm mờ nghĩa mã nguồn
Hãy giữ Generics đơn giản. Đặt tên Generic có ý nghĩa nếu có nhiều tham số: `<TData, TError, TFilter>`.

---

## 📚 Summary

- **Generics `<T>`** cho phép tạo các Functions/Components tái sử dụng với tham số kiểu linh hoạt.
- Ràng buộc Generics bằng từ khóa **`extends`**.
- Dùng **`Partial<T>`** cho dữ liệu cập nhật tùy chọn; **`Omit<T, K>`** cho dữ liệu tạo mới loại bỏ trường tự sinh.
- Dùng **`Pick<T, K>`** để trích xuất tập con thuộc tính; **`Record<K, T>`** để khai báo Map Object.
- Dùng **`ReturnType<typeof fn>`** để tự động trích xuất kiểu trả về của một hàm.

---

## 📝 Quiz

### Question 1
Mục đích chiến lược chính của việc sử dụng Generics `<T>` trong TypeScript là gì?

A. Để làm cho code chạy nhanh hơn  
B. Cho phép xây dựng các hàm, interface hay Component có thể làm việc linh hoạt với nhiều kiểu dữ liệu khác nhau mà vẫn đảm bảo tính an toàn kiểu (Type Safety) 100%  
C. Để tự động mã hóa dữ liệu  
D. Để thay thế CSS  

**Explanation:**  
Generics cho phép bạn truyền kiểu dữ liệu dưới dạng tham số `<T>`, giúp tái sử dụng mã nguồn cho nhiều loại dữ liệu khác nhau mà không phải hạ cấp xuống kiểu `any` nguy hiểm.

**Answer: B**

---

### Question 2
Utility Type nào được sử dụng để tạo ra một kiểu dữ liệu mới bằng cách **loại bỏ** một số thuộc tính cụ thể khỏi kiểu dữ liệu gốc `T`?

A. `Pick<T, K>`  
B. `Omit<T, K>`  
C. `Partial<T>`  
D. `Exclude<T, U>`  

**Explanation:**  
`Omit<T, K>` nhận vào kiểu dữ liệu gốc `T` và danh sách các khóa `K` cần loại bỏ, trả về một kiểu mới chứa tất cả các thuộc tính còn lại (ví dụ `Omit<User, "id">` tạo kiểu User không có id).

**Answer: B**

---

### Question 3
Utility Type nào của TypeScript được sử dụng để khởi tạo kiểu cho một đối tượng Map/Dictionary với kiểu dữ liệu của Key là `K` và kiểu dữ liệu của Value là `T`?

A. `Map<K, T>`  
B. `Record<K, T>`  
C. `Dictionary<K, T>`  
D. `ObjectMap<K, T>`  

**Explanation:**  
`Record<K, T>` được dùng để định nghĩa kiểu cho một đối tượng JavaScript dạng Key-Value (ví dụ `Record<string, number>` đại diện cho một Object có key là chuỗi và value là số).

**Answer: B**
