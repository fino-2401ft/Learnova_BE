---
id: db-m2-l1
course: Database
module: Prisma ORM
title: Prisma Schema
order: 1
difficulty: Intermediate
estimatedTime: 60
---
# Prisma Schema

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Prisma Schema là gì.
- Cấu hình kết nối Database.
- Định nghĩa Model trong Prisma.
- Khai báo kiểu dữ liệu và khóa chính.
- Sinh Prisma Client từ Schema.
- Áp dụng Prisma Schema trong dự án Node.js.

---

## 📖 Definition

**Prisma Schema** là tệp cấu hình trung tâm của Prisma ORM.

Mặc định có tên:

```text
schema.prisma
```

Tệp này dùng để:

- Cấu hình Database.
- Khai báo các Model.
- Định nghĩa mối quan hệ giữa các bảng.
- Sinh Prisma Client.

Một dự án Prisma thường có cấu trúc:

```text
prisma/

└── schema.prisma
```

---

# 💻 Basic Structure

Một file `schema.prisma` gồm ba phần chính:

```text
generator

datasource

model
```

---

## 💻 Syntax

### Generator

```prisma
generator client {

    provider = "prisma-client-js"

}
```

---

### Datasource

```prisma
datasource db {

    provider = "mysql"

    url = env("DATABASE_URL")

}
```

---

### Model

```prisma
model User {

    id    Int    @id @default(autoincrement())

    name  String

    email String @unique

}
```

---

## 📝 Example 1 - Prisma Schema đầy đủ

```prisma
generator client {

    provider = "prisma-client-js"

}

datasource db {

    provider = "mysql"

    url = env("DATABASE_URL")

}

model User {

    id    Int    @id @default(autoincrement())

    name  String

    email String @unique

}
```

### Giải thích

Schema gồm:

- Generator
- Datasource
- Model

Đây là cấu trúc tối thiểu của một dự án Prisma.

---

## 📝 Example 2 - Model Product

```prisma
model Product {

    id      Int     @id @default(autoincrement())

    name    String

    price   Float

    stock   Int

}
```

### Giải thích

Model `Product` sẽ tương ứng với bảng `Product` trong Database.

---

## 📝 Example 3 - Thêm trường Optional

```prisma
model User {

    id      Int     @id @default(autoincrement())

    name    String

    phone   String?

}
```

### Giải thích

Dấu `?` cho biết trường có thể nhận giá trị `NULL`.

---

## 📝 Example 4 - Default Value

```prisma
model User {

    id        Int      @id @default(autoincrement())

    createdAt DateTime @default(now())

}
```

### Giải thích

Khi tạo bản ghi mới, `createdAt` sẽ tự động nhận thời gian hiện tại.

---

## 📝 Example 5 - Unique Field

```prisma
model User {

    id    Int    @id @default(autoincrement())

    email String @unique

}
```

### Giải thích

`@unique` đảm bảo mỗi giá trị email chỉ xuất hiện một lần.

---

## ⚠️ Notes

### 1. Generator

```prisma
generator client {

    provider = "prisma-client-js"

}
```

Generator dùng để sinh Prisma Client.

---

### 2. Datasource

```prisma
datasource db {

    provider = "mysql"

}
```

Một số Database được Prisma hỗ trợ:

- MySQL
- PostgreSQL
- SQLite
- SQL Server
- MongoDB

---

### 3. Model

Mỗi Model tương ứng với một bảng trong Database.

Ví dụ

```prisma
model User
```

↓

```text
User Table
```

---

### 4. Primary Key

```prisma
@id
```

Đánh dấu khóa chính.

---

### 5. Auto Increment

```prisma
@default(autoincrement())
```

Tự động tăng giá trị của khóa chính.

---

### 6. Optional Field

```prisma
String?
```

Cho phép giá trị `NULL`.

---

### 7. Unique Field

```prisma
@unique
```

Đảm bảo dữ liệu không bị trùng lặp.

---

## 🌍 Real World Example

Schema cho hệ thống bán hàng.

```prisma
model User {

    id    Int    @id @default(autoincrement())

    name  String

    email String @unique

}

model Product {

    id    Int    @id @default(autoincrement())

    name  String

    price Float

}
```

Sau khi hoàn thành Schema, Prisma có thể tạo các bảng tương ứng trong Database.

---

## ❌ Common Mistakes

### Sai 1 - Quên @id

Sai

```prisma
model User {

    name String

}
```

Đúng

```prisma
model User {

    id Int @id @default(autoincrement())

}
```

---

### Sai 2 - Sai provider

Sai

```prisma
provider = "mysql2"
```

Đúng

```prisma
provider = "mysql"
```

---

### Sai 3 - Quên @unique

Sai

```prisma
email String
```

Nếu email cần duy nhất thì nên khai báo:

```prisma
email String @unique
```

---

### Sai 4 - Không sử dụng biến môi trường

Sai

```prisma
url = "mysql://root:123456@localhost:3306/shop"
```

Đúng

```prisma
url = env("DATABASE_URL")
```

Giúp bảo mật thông tin kết nối.

---

## 📚 Summary

- `schema.prisma` là tệp cấu hình chính của Prisma.
- Schema gồm ba phần: Generator, Datasource và Model.
- Mỗi Model tương ứng với một bảng trong Database.
- `@id` dùng để khai báo khóa chính.
- `@default(autoincrement())` tạo giá trị tự tăng.
- `@unique` đảm bảo dữ liệu không bị trùng.
- Prisma Client được sinh từ Schema để thao tác với Database.

---

## 📝 Quiz

### Question 1

Tệp cấu hình chính của Prisma có tên là gì?

A.

```text
database.prisma
```

B.

```text
schema.prisma
```

C.

```text
prisma.config
```

D.

```text
model.prisma
```

**Answer: B**

**Giải thích:** `schema.prisma` là nguồn duy nhất mô tả mô hình dữ liệu: từ đây Prisma sinh ra client TypeScript và sinh ra migration SQL. Sửa cấu trúc bảng luôn bắt đầu từ file này, không bao giờ sửa thẳng database.


---

### Question 2

Annotation nào được dùng để đánh dấu khóa chính trong Prisma?

A.

```prisma
@primary
```

B.

```prisma
@key
```

C.

```prisma
@id
```

D.

```prisma
@index
```

**Answer: C**

**Giải thích:** `@id` đánh dấu khoá chính. Nó thường đi cùng một giá trị mặc định như `@default(uuid(7))` hoặc `@default(autoincrement())`. Đừng nhầm với `@unique` — cột unique cũng không cho trùng nhưng không phải khoá chính, và một bảng có thể có nhiều cột unique nhưng chỉ một khoá chính.

