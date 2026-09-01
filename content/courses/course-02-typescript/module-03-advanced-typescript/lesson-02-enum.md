---
id: ts-m3-l2
course: TypeScript
module: Advanced TypeScript
title: Enum
order: 2
difficulty: Intermediate
estimatedTime: 30
---
# Enum

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Enum là gì.
- Khai báo Numeric Enum và String Enum.
- Truy cập giá trị của Enum.
- Hiểu khi nào nên sử dụng Enum.
- Phân biệt Enum và Literal Type.

---

## 📖 Definition

Trong nhiều chương trình, một biến chỉ có thể nhận một số giá trị cố định.

Ví dụ:

- Trạng thái đơn hàng
- Vai trò người dùng
- Ngày trong tuần
- Mức độ ưu tiên

Nếu sử dụng chuỗi (string) trực tiếp sẽ dễ xảy ra lỗi đánh máy.

Ví dụ:

```typescript
let role = "Admin";

role = "Admn";
```

TypeScript không biết `"Admn"` là sai.

Để giải quyết vấn đề này, TypeScript cung cấp **Enum (Enumeration)**.

Enum là một tập hợp các hằng số có tên.

---

## 💻 Syntax

### Numeric Enum

```typescript
enum EnumName {

    VALUE1,

    VALUE2,

    VALUE3

}
```

---

### String Enum

```typescript
enum EnumName {

    VALUE1 = "A",

    VALUE2 = "B"

}
```

---

## 📝 Example 1 - Numeric Enum

```typescript
enum Role {

    Admin,

    Teacher,

    Student

}

console.log(Role.Admin);

console.log(Role.Student);
```

Output

```text
0
2
```

### Giải thích

Theo mặc định:

```text
Admin = 0

Teacher = 1

Student = 2
```

Giá trị sẽ tự động tăng thêm 1.

---

## 📝 Example 2 - String Enum

```typescript
enum Status {

    Pending = "PENDING",

    Success = "SUCCESS",

    Failed = "FAILED"

}

console.log(Status.Success);
```

Output

```text
SUCCESS
```

### Giải thích

String Enum giúp mã nguồn dễ đọc và thường được sử dụng khi làm việc với API hoặc cơ sở dữ liệu.

---

## 📝 Example 3 - Enum trong Function

```typescript
enum Role {

    Admin,

    Teacher,

    Student

}

function printRole(role: Role): void {

    console.log(role);

}

printRole(Role.Teacher);
```

Output

```text
1
```

### Giải thích

Tham số `role` chỉ được phép nhận các giá trị thuộc `Role`.

Nếu truyền giá trị khác, TypeScript sẽ báo lỗi.

---

## ⚠️ Notes

### 1. Giá trị mặc định

```typescript
enum Level {

    Low,

    Medium,

    High

}
```

Output

```text
Low = 0

Medium = 1

High = 2
```

---

### 2. Giá trị bắt đầu

```typescript
enum Level {

    Low = 1,

    Medium,

    High

}
```

Output

```text
Low = 1

Medium = 2

High = 3
```

---

### 3. String Enum

```typescript
enum Direction {

    Left = "LEFT",

    Right = "RIGHT"

}
```

Đây là loại Enum được sử dụng phổ biến nhất.

---

### 4. Truy cập Enum

```typescript
Role.Admin
```

hoặc

```typescript
Role[0]
```

Đối với Numeric Enum.

---

### 5. Enum và Literal Type

Literal Type

```typescript
type Role =

    "Admin"

    | "Teacher"

    | "Student";
```

Enum

```typescript
enum Role {

    Admin,

    Teacher,

    Student

}
```

- Literal Type đơn giản và linh hoạt hơn.
- Enum phù hợp khi cần một tập hằng số có tên.

---

## 🌍 Real World Example

Trong hệ thống LMS:

```typescript
enum CourseStatus {

    Draft = "DRAFT",

    Published = "PUBLISHED",

    Archived = "ARCHIVED"

}

const status = CourseStatus.Published;

console.log(status);
```

Output

```text
PUBLISHED
```

Enum giúp đảm bảo trạng thái của khóa học luôn hợp lệ.

---

## ❌ Common Mistakes

### Sai 1 - Truyền chuỗi thay vì Enum

Sai

```typescript
printRole("Teacher");
```

Đúng

```typescript
printRole(Role.Teacher);
```

---

### Sai 2 - Nhầm Numeric Enum với String

Sai

```typescript
enum Role {

    Admin,

    Teacher

}

console.log(Role.Admin);
```

Kết quả

```text
0
```

Không phải

```text
Admin
```

---

### Sai 3 - Gán giá trị ngoài Enum

Sai

```typescript
let status: Status = "SUCCESS";
```

Đúng

```typescript
let status = Status.Success;
```

---

### Sai 4 - Lạm dụng Enum

Nếu chỉ cần vài giá trị cố định đơn giản, Literal Type thường dễ đọc hơn.

---

## 📚 Summary

- Enum là tập hợp các hằng số có tên.
- Có hai loại phổ biến: Numeric Enum và String Enum.
- Enum giúp hạn chế lỗi khi sử dụng các giá trị cố định.
- String Enum thường được ưu tiên trong các ứng dụng thực tế.
- Enum phù hợp với trạng thái, vai trò hoặc các giá trị không thay đổi.

---

## 📝 Quiz

### Question 1

Enum nào dưới đây là String Enum?

A.

```typescript
enum Status {

    Pending,

    Success

}
```

B.

```typescript
enum Status {

    Pending = "PENDING",

    Success = "SUCCESS"

}
```

C.

```typescript
type Status = "Pending";
```

D.

```typescript
const Status = {};
```

**Answer: B**

**Giải thích:** String Enum là enum mà **mọi** phần tử đều được gán giá trị chuỗi tường minh. Phương án A không gán gì nên là Numeric Enum. C là union literal và D là object thường — cả hai đều không phải enum.

---

### Question 2

Theo mặc định, giá trị của phần tử đầu tiên trong Numeric Enum là?

A.

```text
-1
```

B.

```text
0
```

C.

```text
1
```

D.

```text
100
```

**Answer: B**

**Giải thích:** Numeric Enum đánh số tự động từ `0`, các phần tử sau tăng dần một đơn vị. Hệ quả đáng nhớ: phần tử đầu tiên là falsy, nên `if (status)` sẽ bỏ sót nó. Muốn bắt đầu từ 1 thì phải gán tay `Pending = 1`.
