---
id: ts-m1-l2
course: TypeScript
module: Type System
title: Union & Intersection
order: 2
difficulty: Beginner
estimatedTime: 35
---
# Union & Intersection

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Union Type và Intersection Type.
- Sử dụng toán tử `|` và `&`.
- Phân biệt sự khác nhau giữa Union và Intersection.
- Thu hẹp kiểu dữ liệu (Type Narrowing).
- Biết khi nào nên sử dụng từng loại.

---

## 📖 Definition

Trong TypeScript, một biến không nhất thiết chỉ có một kiểu dữ liệu.

TypeScript cung cấp hai tính năng rất mạnh:

- **Union Type (`|`)**: Một giá trị có thể thuộc **một trong nhiều kiểu dữ liệu**.
- **Intersection Type (`&`)**: Một giá trị phải **đồng thời thỏa mãn nhiều kiểu dữ liệu**.

Đây là một trong những điểm mạnh nhất của TypeScript giúp mô hình hóa dữ liệu linh hoạt hơn.

---

## 💻 Syntax

### Union Type

```typescript
let variable: Type1 | Type2;
```

Ví dụ

```typescript
let id: number | string;
```

---

### Intersection Type

```typescript
type NewType = Type1 & Type2;
```

---

## 📝 Example 1 - Union Type

```typescript
let id: number | string;

id = 100;

console.log(id);

id = "EMP001";

console.log(id);
```

Output

```text
100
EMP001
```

### Giải thích

Biến `id` có thể lưu:

- number
- string

Nhưng không thể lưu kiểu khác.

---

## 📝 Example 2 - Type Narrowing

```typescript
function print(value: string | number) {

    if (typeof value === "string") {

        console.log(value.toUpperCase());

    } else {

        console.log(value.toFixed(2));

    }

}

print("typescript");

print(12.5);
```

Output

```text
TYPESCRIPT
12.50
```

### Giải thích

TypeScript không biết `value` là kiểu gì.

Ta dùng `typeof` để thu hẹp kiểu dữ liệu (Type Narrowing) trước khi gọi các phương thức tương ứng.

---

## 📝 Example 3 - Intersection Type

```typescript
type Person = {

    name: string;

};

type Employee = {

    salary: number;

};

type Staff = Person & Employee;

const staff: Staff = {

    name: "John",

    salary: 1500

};

console.log(staff);
```

Output

```text
{
  name: 'John',
  salary: 1500
}
```

### Giải thích

`Staff` phải có đầy đủ thuộc tính của:

- Person
- Employee

---

## ⚠️ Notes

### 1. Union Type

```typescript
let value: string | number;
```

Có nghĩa là biến chỉ được phép là:

- string
- number

---

### 2. Intersection Type

```typescript
type Admin = User & Permission;
```

Đối tượng phải chứa tất cả thuộc tính của cả hai kiểu dữ liệu.

---

### 3. Type Narrowing

```typescript
if (typeof value === "string") {

}
```

TypeScript sẽ xác định:

```typescript
value -> string
```

Trong khối `if`.

---

### 4. Union với Array

```typescript
let values: (string | number)[] = [

    "Java",

    100,

    "TypeScript"

];
```

Output

```text
[
  'Java',
  100,
  'TypeScript'
]
```

---

### 5. Intersection thường dùng với Interface

```typescript
interface User {

    id: number;

}

interface Teacher {

    subject: string;

}

type Instructor = User & Teacher;
```

Đây là cách rất phổ biến trong các dự án NestJS.

---

## ❌ Common Mistakes

### Sai 1 - Gọi phương thức khi chưa kiểm tra kiểu

Sai

```typescript
function print(value: string | number) {

    console.log(value.toUpperCase());

}
```

Output

```text
Property 'toUpperCase' does not exist on type 'number'.
```

Đúng

```typescript
if (typeof value === "string") {

    console.log(value.toUpperCase());

}
```

---

### Sai 2 - Thiếu thuộc tính của Intersection

Sai

```typescript
type Person = {

    name: string;

};

type Employee = {

    salary: number;

};

type Staff = Person & Employee;

const staff: Staff = {

    name: "John"

};
```

Output

```text
Property 'salary' is missing.
```

Đúng

```typescript
const staff: Staff = {

    name: "John",

    salary: 1500

};
```

---

### Sai 3 - Gán kiểu không thuộc Union

Sai

```typescript
let id: number | string;

id = true;
```

Output

```text
Type 'boolean' is not assignable to type 'string | number'.
```

---

### Sai 4 - Nhầm Union và Intersection

Union

```typescript
string | number
```

Có thể là **một trong hai**.

Intersection

```typescript
Person & Employee
```

Phải có **đầy đủ cả hai**.

---

## 📚 Summary

- Union Type sử dụng toán tử `|`.
- Intersection Type sử dụng toán tử `&`.
- Union cho phép một giá trị thuộc nhiều kiểu dữ liệu.
- Intersection kết hợp nhiều kiểu dữ liệu thành một.
- Type Narrowing giúp TypeScript xác định kiểu dữ liệu chính xác trước khi sử dụng.

---

## 📝 Quiz

### Question 1

Toán tử nào dùng để khai báo Union Type?

A.

```typescript
&
```

B.

```typescript
+
```

C.

```typescript
|
```

D.

```typescript
*
```

**Answer: C**

**Giải thích:** `|` là Union — giá trị thuộc **một trong** các kiểu liệt kê. Đừng nhầm với `&` (Intersection), thứ đòi giá trị phải thoả **đồng thời** mọi kiểu. Mẹo nhớ: `|` giống toán tử OR, `&` giống AND.

---

### Question 2

Cho đoạn mã sau:

```typescript
type Person = {

    name: string;

};

type Employee = {

    salary: number;

};

type Staff = Person & Employee;
```

Đối tượng nào hợp lệ?

A.

```typescript
{
    name: "John"
}
```

B.

```typescript
{
    salary: 1000
}
```

C.

```typescript
{
    name: "John",
    salary: 1000
}
```

D.

```typescript
{}
```

**Answer: C**

**Giải thích:** Intersection gộp toàn bộ thuộc tính của cả hai kiểu, nên `Staff` bắt buộc có **cả** `name` lẫn `salary`. A và B mỗi cái chỉ thoả một nửa nên đều thiếu. Đây là chỗ Intersection ngược trực giác: dấu `&` làm kiểu **hẹp** đi (ít giá trị hợp lệ hơn), còn `|` làm kiểu **rộng** ra.
