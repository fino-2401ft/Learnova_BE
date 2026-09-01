---
id: ts-m2-l2
course: TypeScript
module: Object-Oriented Programming
title: Interface
order: 2
difficulty: Beginner
estimatedTime: 35
---
# Interface

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Interface là gì.
- Khai báo Interface.
- Sử dụng Interface để mô tả Object.
- Triển khai (implement) Interface trong Class.
- Phân biệt Interface và Type Alias.

---

## 📖 Definition

Trong TypeScript, **Interface** là một bản mô tả (Contract) quy định một Object hoặc Class phải có những thuộc tính và phương thức nào.

Interface **không chứa dữ liệu**, mà chỉ mô tả cấu trúc.

Ví dụ:

Một User trong hệ thống phải có:

- id
- name
- email

Ta có thể tạo Interface để mọi Object User đều tuân theo cấu trúc này.

Interface giúp:

- Chuẩn hóa dữ liệu.
- Kiểm tra kiểu dữ liệu.
- Dễ mở rộng và bảo trì chương trình.

---

## 💻 Syntax

### Declare an Interface

```typescript
interface InterfaceName {

    property: type;

    method(): returnType;

}
```

### Implement Interface

```typescript
class ClassName implements InterfaceName {

}
```

---

## 📝 Example 1 - Interface for Object

```typescript
interface Student {

    id: number;

    name: string;

    age: number;

}

const student: Student = {

    id: 1,

    name: "Alice",

    age: 20

};

console.log(student);
```

Output

```text
{
  id: 1,
  name: 'Alice',
  age: 20
}
```

### Giải thích

Interface quy định Object `student` phải có đầy đủ:

- id
- name
- age

---

## 📝 Example 2 - Interface with Method

```typescript
interface User {

    name: string;

    login(): void;

}

const admin: User = {

    name: "Admin",

    login() {

        console.log("Login Success");

    }

};

admin.login();
```

Output

```text
Login Success
```

### Giải thích

Interface có thể mô tả cả thuộc tính và phương thức.

---

## 📝 Example 3 - Class Implements Interface

```typescript
interface Animal {

    name: string;

    speak(): void;

}

class Dog implements Animal {

    constructor(

        public name: string

    ) {}

    speak(): void {

        console.log("Woof!");

    }

}

const dog = new Dog("Lucky");

dog.speak();
```

Output

```text
Woof!
```

### Giải thích

Từ khóa `implements` yêu cầu Class phải triển khai đầy đủ các thành phần được định nghĩa trong Interface.

---

## ⚠️ Notes

### 1. Interface chỉ mô tả cấu trúc

```typescript
interface User {

    id: number;

    name: string;

}
```

Không thể tạo Object trực tiếp từ Interface.

---

### 2. Class implements Interface

```typescript
class Student implements User {

}
```

Class phải cài đặt đầy đủ các thuộc tính và phương thức của Interface.

---

### 3. Optional Property

Có thể khai báo thuộc tính không bắt buộc bằng `?`.

```typescript
interface User {

    name: string;

    age?: number;

}
```

Ví dụ

```typescript
const user: User = {

    name: "John"

};
```

---

### 4. Readonly Property

```typescript
interface User {

    readonly id: number;

}
```

Sau khi tạo Object, không thể thay đổi giá trị của `id`.

---

### 5. Interface Extension

Một Interface có thể kế thừa Interface khác.

```typescript
interface Person {

    name: string;

}

interface Student extends Person {

    age: number;

}
```

`Student` sẽ có:

- name
- age

---

## 🌍 Real World Example

Trong hệ thống đào tạo trực tuyến:

```typescript
interface Course {

    id: number;

    title: string;

    price: number;

}

const course: Course = {

    id: 1,

    title: "TypeScript",

    price: 499

};

console.log(course);
```

Output

```text
{
  id: 1,
  title: 'TypeScript',
  price: 499
}
```

Hầu hết các DTO, Response hoặc Entity trong các dự án TypeScript đều được mô tả bằng Interface.

---

## ❌ Common Mistakes

### Sai 1 - Thiếu thuộc tính

Sai

```typescript
interface User {

    id: number;

    name: string;

}

const user: User = {

    id: 1

};
```

Output

```text
Property 'name' is missing.
```

---

### Sai 2 - Không implement đầy đủ

Sai

```typescript
interface Animal {

    speak(): void;

}

class Dog implements Animal {

}
```

Output

```text
Class 'Dog' incorrectly implements interface 'Animal'.
```

Đúng

```typescript
class Dog implements Animal {

    speak() {

        console.log("Woof!");

    }

}
```

---

### Sai 3 - Khởi tạo Interface

Sai

```typescript
const user = new User();
```

Output

```text
Cannot create an instance of an interface.
```

Interface chỉ dùng để mô tả kiểu dữ liệu.

---

### Sai 4 - Thay đổi readonly

Sai

```typescript
interface User {

    readonly id: number;

}

const user: User = {

    id: 1

};

user.id = 2;
```

Output

```text
Cannot assign to 'id' because it is a read-only property.
```

---

## 📚 Summary

- Interface mô tả cấu trúc của Object hoặc Class.
- Sử dụng từ khóa `interface`.
- Interface có thể chứa thuộc tính và phương thức.
- Class sử dụng `implements` để triển khai Interface.
- Interface hỗ trợ `optional (?)`, `readonly` và `extends`.
- Interface được sử dụng rộng rãi trong các dự án TypeScript và NestJS.

---

## 📝 Quiz

### Question 1

Từ khóa nào dùng để khai báo Interface?

A.

```typescript
class
```

B.

```typescript
type
```

C.

```typescript
interface
```

D.

```typescript
object
```

**Answer: C**

**Giải thích:** `interface` mô tả hình dạng mà một object phải có. Nó chỉ tồn tại lúc biên dịch và biến mất hoàn toàn trong JavaScript đầu ra — khác với `class`, thứ vẫn còn lại lúc chạy.

---

### Question 2

Từ khóa nào dùng để một Class triển khai Interface?

A.

```typescript
extends
```

B.

```typescript
implements
```

C.

```typescript
inherits
```

D.

```typescript
uses
```

**Answer: B**

**Giải thích:** `implements` nghĩa là "class này cam kết có đủ những gì interface mô tả". `extends` là kế thừa từ một class khác, hai chuyện khác nhau: một class có thể `implements` nhiều interface nhưng chỉ `extends` được một class.
