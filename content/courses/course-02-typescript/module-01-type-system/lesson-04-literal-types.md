---
id: ts-m1-l4
course: TypeScript
module: Type System
title: Literal Types
order: 4
difficulty: Beginner
estimatedTime: 25
---
# Literal Types

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Literal Type là gì.
- Khai báo Literal Type cho String, Number và Boolean.
- Kết hợp Literal Type với Union Type.
- Hiểu lợi ích của Literal Type trong việc hạn chế giá trị hợp lệ.
- Áp dụng Literal Type để mô tả trạng thái hoặc vai trò của người dùng.

---

## 📖 Definition

Thông thường, khi khai báo:

```typescript
let role: string;
```

biến `role` có thể nhận **mọi chuỗi**.

```typescript
role = "Admin";

role = "Teacher";

role = "Hello";

role = "ABC";
```

Trong nhiều trường hợp, chương trình chỉ cho phép một số giá trị nhất định.

Ví dụ:

- Admin
- Teacher
- Student

TypeScript cung cấp **Literal Types** để giới hạn giá trị hợp lệ của biến.

Literal Type là kiểu dữ liệu chỉ cho phép **một hoặc một số giá trị cụ thể**, thay vì toàn bộ kiểu dữ liệu.

---

## 💻 Syntax

### String Literal

```typescript
let role: "Admin";
```

---

### Number Literal

```typescript
let level: 1;
```

---

### Boolean Literal

```typescript
let success: true;
```

---

### Union Literal

```typescript
let role: "Admin" | "Teacher" | "Student";
```

---

## 📝 Example 1 - String Literal

```typescript
let role: "Admin";

role = "Admin";

console.log(role);
```

Output

```text
Admin
```

### Giải thích

Biến `role` chỉ được phép nhận giá trị `"Admin"`.

Nếu gán giá trị khác, TypeScript sẽ báo lỗi.

---

## 📝 Example 2 - Union Literal

```typescript
type Role =

    "Admin"

    | "Teacher"

    | "Student";

let userRole: Role = "Teacher";

console.log(userRole);
```

Output

```text
Teacher
```

### Giải thích

Đây là cách sử dụng phổ biến nhất của Literal Type.

Biến chỉ được phép nhận một trong ba giá trị.

---

## 📝 Example 3 - Number Literal

```typescript
type Rating =

    1

    | 2

    | 3

    | 4

    | 5;

let score: Rating = 5;

console.log(score);
```

Output

```text
5
```

### Giải thích

Literal Type không chỉ áp dụng cho chuỗi mà còn có thể sử dụng với số.

---

## ⚠️ Notes

### 1. String Literal

```typescript
type Status =

    "Pending"

    | "Success"

    | "Failed";
```

Thường dùng để mô tả trạng thái của ứng dụng.

---

### 2. Number Literal

```typescript
type Month =

    1 | 2 | 3 | 4 | 5 | 6 |

    7 | 8 | 9 | 10 | 11 | 12;
```

Giúp giới hạn giá trị hợp lệ.

---

### 3. Boolean Literal

```typescript
type Success = true;
```

Ít được sử dụng hơn nhưng vẫn hợp lệ.

---

### 4. Kết hợp với Type Alias

```typescript
type Role =

    "Admin"

    | "Teacher"

    | "Student";
```

Đây là cách sử dụng phổ biến nhất trong các dự án TypeScript.

---

### 5. Ứng dụng thực tế

Trong hệ thống quản lý người dùng:

```typescript
type Role =

    "Admin"

    | "Teacher"

    | "Student";

type Status =

    "Active"

    | "Inactive"

    | "Blocked";
```

Nhờ đó, TypeScript sẽ ngăn việc gán các giá trị không hợp lệ như `"Manager"` hoặc `"Deleted"`.

---

## ❌ Common Mistakes

### Sai 1 - Gán giá trị ngoài Literal

Sai

```typescript
type Role =

    "Admin"

    | "Teacher";

let role: Role = "Student";
```

Output

```text
Type '"Student"' is not assignable to type 'Role'.
```

Đúng

```typescript
let role: Role = "Teacher";
```

---

### Sai 2 - Nhầm Literal Type với string

Sai

```typescript
let role: "Admin";

role = "Teacher";
```

Output

```text
Type '"Teacher"' is not assignable to type '"Admin"'.
```

---

### Sai 3 - Không sử dụng Type Alias

Không nên

```typescript
let role:

"Admin"

| "Teacher"

| "Student";
```

Nên

```typescript
type Role =

    "Admin"

    | "Teacher"

    | "Student";

let role: Role;
```

Giúp mã nguồn ngắn gọn và dễ tái sử dụng.

---

### Sai 4 - Dùng Literal Type khi không cần thiết

Nếu một biến có thể nhận nhiều giá trị khác nhau, nên dùng:

```typescript
string
```

thay vì Literal Type.

---

## 📚 Summary

- Literal Type giới hạn giá trị hợp lệ của biến.
- Có thể sử dụng với String, Number và Boolean.
- Thường kết hợp với Union Type.
- Giúp giảm lỗi do gán sai giá trị.
- Được sử dụng nhiều để mô tả Role, Status hoặc các giá trị cố định trong ứng dụng.

---

## 📝 Quiz

### Question 1

Đâu là khai báo Literal Type hợp lệ?

A.

```typescript
let role: string;
```

B.

```typescript
let role: "Admin";
```

C.

```typescript
let role: any;
```

D.

```typescript
let role: object;
```

**Answer: B**

**Giải thích:** Literal Type giới hạn biến vào **đúng một giá trị cụ thể**, nên `role` chỉ nhận được chuỗi `"Admin"`. Phương án A cho phép mọi chuỗi, còn C tắt hẳn việc kiểm tra kiểu.

---

### Question 2

Cho đoạn mã sau:

```typescript
type Status =

    "Pending"

    | "Success"

    | "Failed";

let status: Status = "Success";
```

Giá trị nào sau đây **không hợp lệ**?

A.

```text
Pending
```

B.

```text
Success
```

C.

```text
Failed
```

D.

```text
Completed
```

**Answer: D**

**Giải thích:** `Status` là union của ba literal, nên chỉ ba chuỗi đó hợp lệ. `"Completed"` không nằm trong danh sách nên TypeScript từ chối ngay lúc biên dịch. Đây là lý do union literal thường tốt hơn `string` cho các trường trạng thái: gõ sai chính tả bị bắt ngay thay vì lọt xuống database.
