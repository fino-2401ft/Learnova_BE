---
id: ts-m3-l4
course: TypeScript
module: Advanced TypeScript
title: Utility Types
order: 4
difficulty: Intermediate
estimatedTime: 45
---
# Utility Types

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Utility Types là gì.
- Sử dụng `Partial`, `Required`, `Readonly`, `Pick`, `Omit`.
- Biết khi nào nên áp dụng từng Utility Type.
- Áp dụng Utility Types trong các dự án thực tế.
- Hiểu vai trò của Utility Types trong React và NestJS.

---

## 📖 Definition

Trong quá trình phát triển ứng dụng, chúng ta thường cần tạo một kiểu dữ liệu mới dựa trên kiểu dữ liệu đã có.

Ví dụ:

```typescript
interface User {

    id: number;

    name: string;

    email: string;

    password: string;

}
```

Có lúc ta cần:

- Chỉ lấy `id` và `name`.
- Bỏ thuộc tính `password`.
- Biến tất cả thuộc tính thành tùy chọn.
- Biến tất cả thuộc tính thành bắt buộc.
- Biến toàn bộ thuộc tính thành chỉ đọc.

Nếu tự viết lại Interface sẽ gây trùng lặp mã nguồn.

TypeScript cung cấp **Utility Types** để giải quyết vấn đề này.

---

## 💻 Syntax

### Partial

```typescript
Partial<Type>
```

### Required

```typescript
Required<Type>
```

### Readonly

```typescript
Readonly<Type>
```

### Pick

```typescript
Pick<Type, Keys>
```

### Omit

```typescript
Omit<Type, Keys>
```

---

## 📝 Example 1 - Partial

```typescript
interface User {

    id: number;

    name: string;

    email: string;

}

const user: Partial<User> = {

    name: "Alice"

};

console.log(user);
```

Output

```text
{
  name: 'Alice'
}
```

### Giải thích

`Partial<T>` biến **tất cả thuộc tính** thành tùy chọn.

Rất phù hợp cho chức năng cập nhật dữ liệu.

---

## 📝 Example 2 - Pick

```typescript
interface User {

    id: number;

    name: string;

    email: string;

}

type UserInfo = Pick<User, "id" | "name">;

const user: UserInfo = {

    id: 1,

    name: "Alice"

};

console.log(user);
```

Output

```text
{
  id: 1,
  name: 'Alice'
}
```

### Giải thích

`Pick` chỉ lấy những thuộc tính cần thiết từ Interface.

---

## 📝 Example 3 - Omit

```typescript
interface User {

    id: number;

    name: string;

    email: string;

    password: string;

}

type PublicUser = Omit<User, "password">;

const user: PublicUser = {

    id: 1,

    name: "Alice",

    email: "alice@gmail.com"

};

console.log(user);
```

Output

```text
{
  id: 1,
  name: 'Alice',
  email: 'alice@gmail.com'
}
```

### Giải thích

`Omit` loại bỏ những thuộc tính không mong muốn.

Được sử dụng rất nhiều khi trả dữ liệu từ API.

---

## ⚠️ Notes

### 1. Partial

```typescript
Partial<User>
```

Biến tất cả thuộc tính thành tùy chọn.

Ví dụ

```typescript
{

    id?: number;

    name?: string;

}
```

---

### 2. Required

```typescript
Required<User>
```

Biến mọi thuộc tính thành bắt buộc.

Ví dụ

```typescript
interface User {

    name?: string;

}
```

Sau khi dùng

```typescript
Required<User>
```

thì `name` sẽ trở thành bắt buộc.

---

### 3. Readonly

```typescript
Readonly<User>
```

Không cho phép thay đổi giá trị sau khi khởi tạo.

Ví dụ

```typescript
user.name = "David";
```

Output

```text
Cannot assign to 'name'
```

---

### 4. Pick

```typescript
Pick<User, "id" | "name">
```

Chỉ lấy những thuộc tính cần thiết.

---

### 5. Omit

```typescript
Omit<User, "password">
```

Loại bỏ các thuộc tính không cần thiết.

Đây là Utility Type được sử dụng nhiều nhất trong Backend.

---

## 🌍 Real World Example

```typescript
interface User {

    id: number;

    name: string;

    email: string;

    password: string;

}
```

### DTO cập nhật

```typescript
type UpdateUserDto = Partial<User>;
```

### Dữ liệu trả về

```typescript
type UserResponse = Omit<User, "password">;
```

### Chỉ lấy thông tin cơ bản

```typescript
type UserProfile = Pick<User, "id" | "name">;
```

Trong NestJS, các DTO thường được xây dựng dựa trên các Utility Types để giảm việc lặp lại mã nguồn.

---

## ❌ Common Mistakes

### Sai 1 - Nhầm giữa Pick và Omit

Sai

```typescript
Pick<User, "password">
```

Nếu muốn loại bỏ `password`, phải dùng:

```typescript
Omit<User, "password">
```

---

### Sai 2 - Dùng Partial khi muốn dữ liệu bắt buộc

Sai

```typescript
Partial<User>
```

Đúng

```typescript
User
```

hoặc

```typescript
Required<User>
```

---

### Sai 3 - Thay đổi Readonly

Sai

```typescript
const user: Readonly<User> = {

    id: 1,

    name: "Alice",

    email: "a@gmail.com"

};

user.name = "Bob";
```

Output

```text
Cannot assign to 'name' because it is a read-only property.
```

---

### Sai 4 - Lạm dụng Utility Types

Utility Types giúp tái sử dụng kiểu dữ liệu.

Tuy nhiên, nếu kiểu dữ liệu mới có cấu trúc khác hoàn toàn, nên tạo Interface hoặc Type mới để mã nguồn rõ ràng hơn.

---

## 📚 Summary

- Utility Types giúp tạo kiểu dữ liệu mới từ kiểu dữ liệu đã có.
- `Partial<T>`: tất cả thuộc tính trở thành tùy chọn.
- `Required<T>`: tất cả thuộc tính trở thành bắt buộc.
- `Readonly<T>`: tất cả thuộc tính chỉ đọc.
- `Pick<T, K>`: lấy một số thuộc tính.
- `Omit<T, K>`: loại bỏ một số thuộc tính.
- Utility Types được sử dụng rất nhiều trong React, NestJS và các dự án TypeScript.

---

## 📝 Quiz

### Question 1

Utility Type nào dùng để biến tất cả thuộc tính thành tùy chọn?

A.

```typescript
Readonly
```

B.

```typescript
Partial
```

C.

```typescript
Pick
```

D.

```typescript
Required
```

**Answer: B**

**Giải thích:** `Partial<T>` biến mọi thuộc tính thành tuỳ chọn — rất hợp cho payload của `PATCH`, nơi client chỉ gửi những trường muốn sửa. `Required<T>` làm điều ngược lại, còn `Readonly<T>` chặn ghi chứ không đụng tới tính bắt buộc.

---

### Question 2

Utility Type nào dùng để loại bỏ thuộc tính `password`?

A.

```typescript
Pick<User, "password">
```

B.

```typescript
Required<User>
```

C.

```typescript
Omit<User, "password">
```

D.

```typescript
Readonly<User>
```

**Answer: C**

**Giải thích:** `Omit<T, K>` giữ mọi thuộc tính **trừ** những khoá liệt kê, nên `Omit<User, "password">` đúng là thứ cần cho DTO trả về API. `Pick` thì ngược lại — `Pick<User, "password">` chỉ giữ đúng trường nhạy cảm đó.
