---
id: ts-m2-l4
course: TypeScript
module: Object-Oriented Programming
title: Abstract Class
order: 4
difficulty: Beginner
estimatedTime: 35
---
# Abstract Class

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Abstract Class là gì.
- Khai báo Abstract Class.
- Tạo Abstract Method.
- Kế thừa Abstract Class.
- Phân biệt Abstract Class và Interface.

---

## 📖 Definition

Trong nhiều trường hợp, chúng ta muốn tạo một Class chỉ để làm lớp cha và **không cho phép tạo Object trực tiếp**.

Ví dụ:

Trong hệ thống quản lý học tập có các loại người dùng:

- Student
- Teacher
- Admin

Tất cả đều có:

- id
- name
- login()

Nhưng không tồn tại một đối tượng chung tên là **User**.

Lúc này, ta sử dụng **Abstract Class**.

Abstract Class là một Class đặc biệt:

- Có thể chứa thuộc tính.
- Có thể chứa Constructor.
- Có thể chứa Method đã cài đặt.
- Có thể chứa Abstract Method (chưa cài đặt).
- Không thể tạo Object trực tiếp.

---

## 💻 Syntax

### Abstract Class

```typescript
abstract class User {

}
```

### Abstract Method

```typescript
abstract login(): void;
```

### Inheritance

```typescript
class Student extends User {

}
```

---

## 📝 Example 1 - Abstract Class

```typescript
abstract class User {

    constructor(

        public name: string

    ) {}

}

class Student extends User {

}

const student = new Student("Alice");

console.log(student.name);
```

Output

```text
Alice
```

### Giải thích

`User` là Abstract Class.

Không thể tạo Object từ `User`, nhưng `Student` có thể kế thừa và sử dụng Constructor của lớp cha.

---

## 📝 Example 2 - Abstract Method

```typescript
abstract class User {

    abstract login(): void;

}

class Student extends User {

    login(): void {

        console.log("Student Login");

    }

}

const student = new Student();

student.login();
```

Output

```text
Student Login
```

### Giải thích

`login()` là Abstract Method.

Class con bắt buộc phải triển khai phương thức này.

---

## 📝 Example 3 - Abstract Class trong thực tế

```typescript
abstract class Employee {

    constructor(

        public name: string

    ) {}

    introduce(): void {

        console.log(`I'm ${this.name}`);

    }

    abstract work(): void;

}

class Developer extends Employee {

    work(): void {

        console.log("Write Code");

    }

}

const dev = new Developer("David");

dev.introduce();

dev.work();
```

Output

```text
I'm David
Write Code
```

### Giải thích

Abstract Class có thể chứa:

- Method thông thường (`introduce()`)
- Abstract Method (`work()`)

Class con chỉ cần cài đặt các Abstract Method.

---

## ⚠️ Notes

### 1. Không thể tạo Object

Sai

```typescript
abstract class User {

}

const user = new User();
```

Output

```text
Cannot create an instance of an abstract class.
```

---

### 2. Có thể có Constructor

```typescript
abstract class User {

    constructor(

        public name: string

    ) {}

}
```

Constructor sẽ được gọi khi Class con được tạo.

---

### 3. Abstract Method

```typescript
abstract login(): void;
```

Không có phần thân của hàm.

Class con phải cài đặt.

---

### 4. Class con bắt buộc Override

```typescript
class Student extends User {

    login() {

        console.log("Login");

    }

}
```

Nếu không Override sẽ báo lỗi.

---

### 5. Abstract Class và Interface

| Abstract Class | Interface |
|----------------|-----------|
| Có Constructor | Không có Constructor |
| Có thuộc tính | Có thuộc tính |
| Có Method đã cài đặt | Không có Method đã cài đặt |
| Có Abstract Method | Chỉ mô tả phương thức |
| Dùng `extends` | Dùng `implements` |

Thông thường:

- Interface dùng để mô tả cấu trúc.
- Abstract Class dùng để chia sẻ logic chung giữa các Class.

---

## 🌍 Real World Example

Trong hệ thống LMS:

```typescript
abstract class User {

    constructor(

        public id: number,

        public name: string

    ) {}

    showProfile(): void {

        console.log(`${this.id} - ${this.name}`);

    }

    abstract login(): void;

}

class Teacher extends User {

    login(): void {

        console.log("Teacher Login");

    }

}

const teacher = new Teacher(

    1,

    "Tom"

);

teacher.showProfile();

teacher.login();
```

Output

```text
1 - Tom
Teacher Login
```

Abstract Class giúp các loại người dùng dùng chung logic như:

- showProfile()
- Constructor

Trong khi mỗi loại người dùng sẽ có cách đăng nhập riêng.

---

## ❌ Common Mistakes

### Sai 1 - Tạo Object từ Abstract Class

Sai

```typescript
const user = new User();
```

Output

```text
Cannot create an instance of an abstract class.
```

Đúng

```typescript
const student = new Student();
```

---

### Sai 2 - Không Override Abstract Method

Sai

```typescript
class Student extends User {

}
```

Output

```text
Non-abstract class 'Student' does not implement inherited abstract member.
```

---

### Sai 3 - Quên từ khóa abstract

Sai

```typescript
class User {

    login();

}
```

Đúng

```typescript
abstract class User {

    abstract login(): void;

}
```

---

### Sai 4 - Nhầm Interface và Abstract Class

Nếu chỉ muốn mô tả dữ liệu:

```typescript
interface User {

}
```

Nếu muốn chia sẻ Constructor hoặc Method:

```typescript
abstract class User {

}
```

---

## 📚 Summary

- Abstract Class là Class không thể tạo Object trực tiếp.
- Sử dụng từ khóa `abstract`.
- Có thể chứa Constructor, Property và Method.
- Có thể khai báo Abstract Method.
- Class con phải Override tất cả Abstract Method.
- Abstract Class phù hợp khi nhiều Class có chung logic xử lý.

---

## 📝 Quiz

### Question 1

Từ khóa nào dùng để khai báo Abstract Class?

A.

```typescript
interface
```

B.

```typescript
extends
```

C.

```typescript
abstract
```

D.

```typescript
implements
```

**Answer: C**

**Giải thích:** `abstract` đánh dấu class không tạo object trực tiếp được, chỉ dùng làm lớp cơ sở. Cùng từ khoá đó cũng dùng cho phương thức chỉ khai báo mà không có thân hàm.

---

### Question 2

Phát biểu nào đúng về Abstract Class?

A.

Có thể tạo Object trực tiếp.

B.

Không được chứa Constructor.

C.

Class con bắt buộc phải cài đặt các Abstract Method.

D.

Không được chứa Method thông thường.

**Answer: C**

**Giải thích:** Abstract method chỉ có chữ ký, không có thân hàm, nên class con buộc phải cài đặt — quên là lỗi biên dịch. A sai vì không `new` được abstract class; B và D đều sai vì abstract class vẫn có constructor và phương thức thường bình thường. Đó chính là điểm khác biệt so với interface.
