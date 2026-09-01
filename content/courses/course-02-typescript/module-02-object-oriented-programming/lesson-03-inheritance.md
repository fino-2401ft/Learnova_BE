---
id: ts-m2-l3
course: TypeScript
module: Object-Oriented Programming
title: Inheritance
order: 3
difficulty: Beginner
estimatedTime: 35
---
# Inheritance

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Inheritance là gì.
- Sử dụng từ khóa `extends`.
- Gọi Constructor của lớp cha bằng `super()`.
- Ghi đè phương thức (Method Overriding).
- Hiểu lợi ích của việc tái sử dụng mã nguồn thông qua kế thừa.

---

## 📖 Definition

Trong lập trình hướng đối tượng, **Inheritance (Kế thừa)** cho phép một Class kế thừa các thuộc tính và phương thức từ một Class khác.

Class được kế thừa gọi là:

- Parent Class
- Base Class
- Super Class

Class kế thừa gọi là:

- Child Class
- Derived Class
- Sub Class

Nhờ Inheritance, Class con không cần phải viết lại những thuộc tính và phương thức đã có trong Class cha.

Điều này giúp:

- Tái sử dụng mã nguồn.
- Giảm trùng lặp.
- Dễ bảo trì chương trình.
- Dễ mở rộng hệ thống.

---

## 💻 Syntax

### Parent Class

```typescript
class Parent {

}
```

### Child Class

```typescript
class Child extends Parent {

}
```

---

## 📝 Example 1 - Basic Inheritance

```typescript
class User {

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

`Student` kế thừa từ `User`.

Do đó `Student` có thuộc tính `name` mà không cần khai báo lại.

---

## 📝 Example 2 - super()

```typescript
class User {

    constructor(

        public name: string

    ) {}

}

class Teacher extends User {

    constructor(

        name: string,

        public subject: string

    ) {

        super(name);

    }

}

const teacher = new Teacher(

    "David",

    "TypeScript"

);

console.log(teacher);
```

Output

```text
Teacher {
    name: 'David',
    subject: 'TypeScript'
}
```

### Giải thích

`super()` dùng để gọi Constructor của Class cha.

Nếu Class con có Constructor riêng thì phải gọi `super()` trước khi sử dụng `this`.

---

## 📝 Example 3 - Method Overriding

```typescript
class Animal {

    speak(): void {

        console.log("Animal speaks");

    }

}

class Dog extends Animal {

    speak(): void {

        console.log("Woof!");

    }

}

const dog = new Dog();

dog.speak();
```

Output

```text
Woof!
```

### Giải thích

Class `Dog` ghi đè phương thức `speak()` của `Animal`.

Kỹ thuật này gọi là **Method Overriding**.

---

## ⚠️ Notes

### 1. extends

```typescript
class Student extends User {

}
```

`extends` dùng để kế thừa Class khác.

---

### 2. super()

```typescript
super(name);
```

Dùng để gọi Constructor của Class cha.

---

### 3. Method Overriding

```typescript
class Dog extends Animal {

    speak() {

        console.log("Woof");

    }

}
```

Class con có thể thay đổi cách hoạt động của phương thức được kế thừa.

---

### 4. Truy cập phương thức của Class cha

```typescript
class Dog extends Animal {

    speak() {

        super.speak();

        console.log("Woof!");

    }

}
```

Output

```text
Animal speaks
Woof!
```

---

### 5. Inheritance chỉ hỗ trợ kế thừa đơn

TypeScript chỉ cho phép:

```typescript
class B extends A
```

Không cho phép:

```typescript
class C extends A, B
```

Nếu muốn sử dụng nhiều cấu trúc khác nhau, hãy dùng Interface.

---

## 🌍 Real World Example

Trong hệ thống LMS:

```typescript
class User {

    constructor(

        public id: number,

        public name: string

    ) {}

}

class Student extends User {

    constructor(

        id: number,

        name: string,

        public course: string

    ) {

        super(id, name);

    }

}

const student = new Student(

    1,

    "Alice",

    "TypeScript"

);

console.log(student);
```

Output

```text
Student {
    id: 1,
    name: 'Alice',
    course: 'TypeScript'
}
```

Tất cả người dùng đều có:

- id
- name

Trong khi Student bổ sung thêm:

- course

---

## ❌ Common Mistakes

### Sai 1 - Quên super()

Sai

```typescript
class Student extends User {

    constructor(

        name: string

    ) {

        this.name = name;

    }

}
```

Output

```text
Must call super constructor.
```

Đúng

```typescript
constructor(name: string) {

    super(name);

}
```

---

### Sai 2 - Quên extends

Sai

```typescript
class Student {

}
```

Không kế thừa được thuộc tính từ `User`.

---

### Sai 3 - Gọi super() sau this

Sai

```typescript
constructor(name: string) {

    this.name = name;

    super(name);

}
```

Đúng

```typescript
constructor(name: string) {

    super(name);

}
```

---

### Sai 4 - Nhầm giữa kế thừa và sao chép

Inheritance không tạo bản sao của Class cha.

Class con chỉ **kế thừa** thuộc tính và phương thức của Class cha.

---

## 📚 Summary

- Inheritance giúp tái sử dụng mã nguồn.
- Sử dụng từ khóa `extends`.
- `super()` dùng để gọi Constructor của Class cha.
- Class con có thể ghi đè phương thức của Class cha.
- TypeScript chỉ hỗ trợ kế thừa đơn.

---

## 📝 Quiz

### Question 1

Từ khóa nào dùng để kế thừa một Class?

A.

```typescript
implements
```

B.

```typescript
extends
```

C.

```typescript
inherits
```

D.

```typescript
super
```

**Answer: B**

**Giải thích:** `extends` dùng cho kế thừa class. Dễ nhầm với `implements`, nhưng khác biệt cốt lõi: `extends` kế thừa cả **phần cài đặt**, còn `implements` chỉ cam kết về **hình dạng** và bạn phải tự viết lại toàn bộ.

---

### Question 2

`super()` được sử dụng để làm gì?

A.

Tạo Object mới.

B.

Gọi Constructor của Class cha.

C.

Khai báo Interface.

D.

Gọi phương thức tĩnh.

**Answer: B**

**Giải thích:** `super()` gọi constructor của class cha. Trong class con có constructor riêng, nó **bắt buộc** phải được gọi trước khi dùng `this` — nếu không TypeScript báo lỗi, vì các thuộc tính do cha khởi tạo chưa tồn tại.
