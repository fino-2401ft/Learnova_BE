---
id: ts-m1-l3
course: TypeScript
module: Type System
title: Type Alias
order: 3
difficulty: Beginner
estimatedTime: 30
---
# Type Alias

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Type Alias là gì.
- Tạo kiểu dữ liệu tùy chỉnh bằng từ khóa `type`.
- Sử dụng Type Alias cho Primitive Type, Object và Union Type.
- Biết khi nào nên sử dụng Type Alias.
- Phân biệt Type Alias và Interface.

---

## 📖 Definition

Khi dự án lớn dần, chúng ta sẽ phải sử dụng nhiều kiểu dữ liệu giống nhau.

Ví dụ:

```typescript
let student: {
    id: number;
    name: string;
    age: number;
};

let teacher: {
    id: number;
    name: string;
    age: number;
};
```

Việc lặp lại cùng một kiểu dữ liệu khiến mã nguồn dài và khó bảo trì.

TypeScript cung cấp **Type Alias** để đặt tên cho một kiểu dữ liệu.

Sau đó có thể tái sử dụng ở nhiều nơi.

---

## 💻 Syntax

### Type Alias

```typescript
type TypeName = Type;
```

Ví dụ

```typescript
type UserName = string;
```

---

### Object Type

```typescript
type Student = {

    id: number;

    name: string;

};
```

---

## 📝 Example 1 - Primitive Type Alias

```typescript
type UserName = string;

let username: UserName = "Alice";

console.log(username);
```

Output

```text
Alice
```

### Giải thích

`UserName` là tên mới của kiểu `string`.

Không tạo kiểu dữ liệu mới mà chỉ đặt tên cho kiểu dữ liệu hiện có.

---

## 📝 Example 2 - Object Type Alias

```typescript
type Student = {

    id: number;

    name: string;

    age: number;

};

const student: Student = {

    id: 1,

    name: "John",

    age: 20

};

console.log(student);
```

Output

```text
{
  id: 1,
  name: 'John',
  age: 20
}
```

### Giải thích

Type Alias giúp tái sử dụng cấu trúc Object ở nhiều nơi.

---

## 📝 Example 3 - Union Type Alias

```typescript
type ID = number | string;

let studentId: ID = 100;

console.log(studentId);

studentId = "ST001";

console.log(studentId);
```

Output

```text
100
ST001
```

### Giải thích

Type Alias có thể kết hợp với Union Type để tạo kiểu dữ liệu linh hoạt hơn.

---

## ⚠️ Notes

### 1. Đặt tên kiểu dữ liệu

```typescript
type Age = number;
```

Giúp code dễ đọc hơn.

---

### 2. Type Alias cho Object

```typescript
type User = {

    id: number;

    name: string;

};
```

Đây là cách sử dụng phổ biến nhất.

---

### 3. Type Alias cho Union

```typescript
type Status =

    "Pending"

    | "Success"

    | "Failed";
```

Thường dùng với API hoặc trạng thái của ứng dụng.

---

### 4. Type Alias cho Function

```typescript
type Sum = (

    a: number,

    b: number

) => number;

const add: Sum = (a, b) => a + b;
```

Output

```text
(add function)
```

---

### 5. Type Alias và Interface

| Type Alias | Interface |
|------------|-----------|
| Có thể dùng cho mọi kiểu dữ liệu | Chủ yếu dùng cho Object |
| Hỗ trợ Union và Intersection | Không hỗ trợ Type Alias cho Primitive |
| Linh hoạt hơn | Thường dùng để mô tả Object và Class |

Trong thực tế:

- `type` thường dùng cho Union, Function và kiểu đơn giản.
- `interface` thường dùng để mô tả Object hoặc Class.

---

## ❌ Common Mistakes

### Sai 1 - Gán sai kiểu dữ liệu

Sai

```typescript
type Age = number;

let age: Age = "20";
```

Output

```text
Type 'string' is not assignable to type 'number'.
```

Đúng

```typescript
let age: Age = 20;
```

---

### Sai 2 - Thiếu thuộc tính của Object

Sai

```typescript
type Student = {

    id: number;

    name: string;

};

const student: Student = {

    id: 1

};
```

Output

```text
Property 'name' is missing.
```

Đúng

```typescript
const student: Student = {

    id: 1,

    name: "John"

};
```

---

### Sai 3 - Gán giá trị ngoài Union Type

Sai

```typescript
type ID = number | string;

let id: ID = true;
```

Output

```text
Type 'boolean' is not assignable.
```

---

### Sai 4 - Đặt tên không rõ nghĩa

Không nên

```typescript
type T = {

    id: number;

};
```

Nên

```typescript
type Student = {

    id: number;

};
```

Tên kiểu dữ liệu nên phản ánh đúng ý nghĩa của nó.

---

## 📚 Summary

- Type Alias dùng để đặt tên cho một kiểu dữ liệu.
- Sử dụng từ khóa `type`.
- Có thể áp dụng cho Primitive Type, Object, Union, Function,...
- Giúp mã nguồn ngắn gọn và dễ bảo trì.
- Type Alias và Interface đều mô tả kiểu dữ liệu nhưng có phạm vi sử dụng khác nhau.

---

## 📝 Quiz

### Question 1

Từ khóa nào dùng để tạo Type Alias?

A.

```typescript
class
```

B.

```typescript
interface
```

C.

```typescript
type
```

D.

```typescript
alias
```

**Answer: C**

**Giải thích:** `type` đặt tên cho một kiểu bất kỳ — kể cả kiểu nguyên thuỷ, union hay hàm. `interface` cũng đặt tên được nhưng chỉ cho hình dạng object. `alias` không phải từ khoá của TypeScript.

---

### Question 2

Đoạn mã nào khai báo Type Alias hợp lệ?

A.

```typescript
type User = string;
```

B.

```typescript
alias User = string;
```

C.

```typescript
interface User = string;
```

D.

```typescript
class User = string;
```

**Answer: A**

**Giải thích:** `type` dùng dấu `=` vì nó là phép đặt bí danh cho một kiểu. `interface` thì mô tả hình dạng bằng cặp `{}` và không bao giờ có dấu `=`, nên phương án C sai cú pháp. `class` sinh ra cả giá trị lúc chạy chứ không chỉ là kiểu.
