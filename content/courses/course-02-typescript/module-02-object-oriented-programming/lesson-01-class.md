---
id: ts-m2-l1
course: TypeScript
module: Object-Oriented Programming
title: Class
order: 1
difficulty: Beginner
estimatedTime: 35
---
# Class

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Class là gì.
- Khởi tạo Object từ Class.
- Khai báo Properties và Methods.
- Sử dụng Constructor.
- Hiểu Access Modifiers (public, private, protected, readonly).

---

## 📖 Definition

Trong lập trình hướng đối tượng (Object-Oriented Programming - OOP), **Class** là bản thiết kế (Blueprint) dùng để tạo ra các đối tượng (Object).

Class mô tả:

- Thuộc tính (Properties)
- Hành vi (Methods)

Ví dụ:

Một sinh viên sẽ có

- id
- name
- age

và các hành động như

- study()
- introduce()

Mỗi sinh viên khác nhau sẽ là một Object được tạo từ cùng một Class.

---

## 💻 Syntax

### Class Declaration

```typescript
class ClassName {

    property: type;

    constructor(...) {

    }

    method() {

    }

}
```

### Create Object

```typescript
const object = new ClassName(...);
```

---

## 📝 Example 1 - Create a Class

```typescript
class Student {

    name: string;

    age: number;

}

const student = new Student();

student.name = "Alice";

student.age = 20;

console.log(student);
```

Output

```text
Student {
    name: 'Alice',
    age: 20
}
```

### Giải thích

- `Student` là Class.
- `student` là Object được tạo từ Class bằng từ khóa `new`.

---

## 📝 Example 2 - Constructor

```typescript
class Student {

    name: string;

    age: number;

    constructor(name: string, age: number) {

        this.name = name;

        this.age = age;

    }

}

const student = new Student("John", 21);

console.log(student);
```

Output

```text
Student {
    name: 'John',
    age: 21
}
```

### Giải thích

Constructor được gọi tự động khi tạo Object.

`this` đại diện cho Object hiện tại.

---

## 📝 Example 3 - Method

```typescript
class Student {

    name: string;

    constructor(name: string) {

        this.name = name;

    }

    introduce(): void {

        console.log(`Hello, I'm ${this.name}`);

    }

}

const student = new Student("David");

student.introduce();
```

Output

```text
Hello, I'm David
```

### Giải thích

Method là hành động của Object.

Có thể truy cập thuộc tính bằng `this`.

---

## ⚠️ Notes

### 1. Property

```typescript
class User {

    username: string;

}
```

Property lưu trạng thái của Object.

---

### 2. Constructor

Mỗi Class chỉ có một Constructor.

```typescript
constructor(name: string) {

    this.name = name;

}
```

Nếu không khai báo, TypeScript sẽ tạo Constructor mặc định.

---

### 3. Method

```typescript
login() {

    console.log("Login");

}
```

Method mô tả hành vi của Object.

---

### 4. Access Modifiers

#### public

```typescript
public name: string;
```

Có thể truy cập ở mọi nơi.

---

#### private

```typescript
private password: string;
```

Chỉ được sử dụng bên trong Class.

---

#### protected

```typescript
protected age: number;
```

Có thể truy cập trong Class và Class con.

---

#### readonly

```typescript
readonly id: number;
```

Không thể thay đổi sau khi khởi tạo.

---

### 5. Parameter Properties

Có thể viết ngắn gọn:

```typescript
class Student {

    constructor(

        public name: string,

        public age: number

    ) {}

}
```

Thay vì

```typescript
class Student {

    name: string;

    age: number;

    constructor(name: string, age: number) {

        this.name = name;

        this.age = age;

    }

}
```

Đây là cách viết rất phổ biến trong TypeScript và NestJS.

---

## 🌍 Real World Example

Trong hệ thống quản lý học tập:

```typescript
class Course {

    constructor(

        public id: number,

        public title: string,

        public price: number

    ) {}

}

const course = new Course(

    1,

    "TypeScript",

    499

);

console.log(course);
```

Output

```text
Course {
    id: 1,
    title: 'TypeScript',
    price: 499
}
```

Mỗi khóa học trong hệ thống sẽ được biểu diễn bằng một Object của Class `Course`.

---

## ❌ Common Mistakes

### Sai 1 - Quên từ khóa new

Sai

```typescript
const student = Student();
```

Đúng

```typescript
const student = new Student();
```

---

### Sai 2 - Quên this

Sai

```typescript
constructor(name: string) {

    name = name;

}
```

Đúng

```typescript
constructor(name: string) {

    this.name = name;

}
```

---

### Sai 3 - Truy cập private từ bên ngoài

Sai

```typescript
class User {

    private password = "123";

}

const user = new User();

console.log(user.password);
```

Output

```text
Property 'password' is private.
```

---

### Sai 4 - Thay đổi readonly

Sai

```typescript
class User {

    readonly id = 1;

}

const user = new User();

user.id = 2;
```

Output

```text
Cannot assign to 'id' because it is a read-only property.
```

---

## 📚 Summary

- Class là bản thiết kế để tạo Object.
- Object được tạo bằng từ khóa `new`.
- Constructor khởi tạo dữ liệu ban đầu.
- Method mô tả hành vi của Object.
- `this` đại diện cho Object hiện tại.
- Access Modifiers giúp kiểm soát quyền truy cập vào thuộc tính và phương thức.
- Parameter Properties giúp viết Class ngắn gọn hơn.

---

## 📝 Quiz

### Question 1

Từ khóa nào dùng để tạo Object từ một Class?

A.

```typescript
create
```

B.

```typescript
new
```

C.

```typescript
object
```

D.

```typescript
instance
```

**Answer: B**

**Giải thích:** `new` cấp phát object mới rồi chạy constructor của class. Ba phương án còn lại không phải từ khoá của TypeScript. Lưu ý `instanceof` là toán tử **kiểm tra**, không phải tạo object.

---

### Question 2

Access Modifier nào chỉ cho phép truy cập bên trong chính Class?

A.

```typescript
public
```

B.

```typescript
protected
```

C.

```typescript
private
```

D.

```typescript
readonly
```

**Answer: C**

**Giải thích:** `private` chặn truy cập từ mọi nơi ngoài chính class đó. `protected` nới thêm cho class con, còn `public` (mặc định) thì ai cũng dùng được. `readonly` là chuyện khác hẳn — nó chặn **ghi đè**, không chặn **đọc**.
