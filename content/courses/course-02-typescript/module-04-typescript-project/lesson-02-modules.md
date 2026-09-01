---
id: ts-m4-l2
course: TypeScript
module: TypeScript Project
title: Modules
order: 2
difficulty: Beginner
estimatedTime: 35
---
# Modules

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu khái niệm Module trong TypeScript.
- Biết cách export và import dữ liệu giữa các file.
- Phân biệt Named Export và Default Export.
- Tổ chức mã nguồn theo nhiều module.
- Áp dụng Module trong các dự án thực tế.

---

## 📖 Definition

Module là một file TypeScript hoặc JavaScript có thể chia sẻ các biến, hàm, class hoặc interface với các file khác.

Module giúp:

- Chia nhỏ chương trình thành nhiều file.
- Dễ bảo trì.
- Dễ tái sử dụng.
- Tránh xung đột tên biến.

Trong TypeScript, mỗi file có chứa `import` hoặc `export` đều được xem là một Module.

---

## 💻 Syntax

### Export

```ts
export const name = "Alice";

export function greet() {}

export class Student {}
```

---

### Import

```ts
import { name, greet, Student } from "./user";
```

---

## 📝 Example 1 - Named Export

**user.ts**

```ts
export const username = "Alice";

export function sayHello() {
    console.log("Hello");
}
```

**app.ts**

```ts
import { username, sayHello } from "./user";

console.log(username);

sayHello();
```

Output

```text
Alice
Hello
```

### Giải thích

- `export` cho phép chia sẻ dữ liệu.
- `import` lấy dữ liệu từ file khác.
- Có thể import nhiều thành phần cùng lúc.

---

## 📝 Example 2 - Default Export

**student.ts**

```ts
export default class Student {

    constructor(public name: string) {}

}
```

**app.ts**

```ts
import Student from "./student";

const s = new Student("John");

console.log(s.name);
```

Output

```text
John
```

### Giải thích

- Một module chỉ có một `default export`.
- Khi import không cần dùng `{}`.

---

## 📝 Example 3 - Export nhiều thành phần

**math.ts**

```ts
export function add(a: number, b: number) {
    return a + b;
}

export function subtract(a: number, b: number) {
    return a - b;
}
```

**app.ts**

```ts
import { add, subtract } from "./math";

console.log(add(10, 5));

console.log(subtract(10, 5));
```

Output

```text
15
5
```

### Giải thích

Một module có thể export nhiều hàm, class hoặc biến.

---

## ⚠️ Notes

### 1. Named Export

```ts
export const age = 20;
```

Import

```ts
import { age } from "./user";
```

Có thể export nhiều thành phần.

---

### 2. Default Export

```ts
export default class User {}
```

Import

```ts
import User from "./user";
```

Mỗi module chỉ có một `default export`.

---

### 3. Import Alias

```ts
import { sayHello as hello } from "./user";

hello();
```

Dùng khi muốn đổi tên thành phần được import.

---

### 4. Import tất cả

```ts
import * as MathUtils from "./math";

console.log(MathUtils.add(5, 2));
```

Import toàn bộ các thành phần trong module.

---

### 5. Relative Path

```ts
import { User } from "./models/user";
```

Đường dẫn phải đúng vị trí của file.

---

## 🌍 Real World Example

Một dự án TypeScript thường được chia thành nhiều module.

```text
src/

├── app.ts

├── models/

│   ├── User.ts
│   └── Product.ts

├── services/

│   ├── UserService.ts
│   └── ProductService.ts

├── utils/

│   └── helper.ts

└── config/

    └── database.ts
```

Ví dụ:

**models/User.ts**

```ts
export class User {

    constructor(
        public name: string,
        public age: number
    ) {}

}
```

**services/UserService.ts**

```ts
import { User } from "../models/User";

export function createUser() {

    return new User("Alice", 22);

}
```

Việc chia module giúp:

- Quản lý mã nguồn dễ dàng.
- Dễ mở rộng dự án.
- Hỗ trợ làm việc nhóm.
- Tăng khả năng tái sử dụng mã.

---

## ❌ Common Mistakes

### Sai 1 - Quên export

Sai

```ts
const age = 20;
```

Sau đó

```ts
import { age } from "./user";
```

Lỗi vì `age` chưa được export.

---

### Sai 2 - Quên dấu {}

Sai

```ts
import age from "./user";
```

Trong khi

```ts
export const age = 20;
```

Đúng

```ts
import { age } from "./user";
```

---

### Sai 3 - Sai đường dẫn

Sai

```ts
import { User } from "./model/User";
```

Trong khi thư mục thực tế là

```text
models/
```

Đúng

```ts
import { User } from "./models/User";
```

---

### Sai 4 - Có nhiều Default Export

Sai

```ts
export default class User {}

export default class Product {}
```

Một module chỉ được phép có một `default export`.

---

## 📚 Summary

- Module giúp chia nhỏ chương trình thành nhiều file.
- Sử dụng `export` để chia sẻ dữ liệu.
- Sử dụng `import` để sử dụng dữ liệu từ module khác.
- Có hai loại export:
  - Named Export
  - Default Export
- Module giúp dự án dễ bảo trì, mở rộng và tái sử dụng.

---

## 📝 Quiz

### Question 1

Từ khóa nào dùng để chia sẻ thành phần của module?

A.

```ts
share
```

B.

```ts
public
```

C.

```ts
export
```

D.

```ts
module
```

**Answer: C**

**Giải thích:** `export` là từ khoá chuẩn của ES Module để công khai một thành phần ra ngoài file. Thứ không được `export` chỉ tồn tại trong phạm vi file đó, dù file khác có biết tên nó.

---

### Question 2

Câu lệnh nào đúng để import Named Export `age`?

A.

```ts
import age from "./user";
```

B.

```ts
import { age } from "./user";
```

C.

```ts
import * age from "./user";
```

D.

```ts
include { age } from "./user";
```

**Answer: B**

**Giải thích:** Named export phải import trong cặp ngoặc nhọn vì tên bắt buộc khớp với tên đã export. Phương án A là cú pháp của default export, và nếu module không có default thì nhận về `undefined` — lỗi khó tìm vì nó không báo gì lúc import.
