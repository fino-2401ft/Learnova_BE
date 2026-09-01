---
id: db-m2-l4
course: Database
module: Prisma ORM
title: Migration
order: 4
difficulty: Intermediate
estimatedTime: 65
---
# Migration

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Migration là gì.
- Biết lợi ích của Database Migration.
- Tạo Migration bằng Prisma CLI.
- Cập nhật Database từ Prisma Schema.
- Sinh Prisma Client sau khi Migration.
- Quản lý thay đổi cấu trúc Database trong quá trình phát triển.

---

## 📖 Definition

**Migration** là quá trình quản lý các thay đổi đối với cấu trúc cơ sở dữ liệu theo thời gian.

Khi chỉnh sửa `schema.prisma`, Database sẽ **không tự động cập nhật**.

Prisma sử dụng **Migration** để:

- Tạo bảng mới.
- Thêm cột.
- Xóa cột.
- Đổi kiểu dữ liệu.
- Đồng bộ Database với Prisma Schema.

Mỗi Migration được lưu thành một thư mục riêng để có thể theo dõi lịch sử thay đổi.

---

# 💻 Migration Workflow

```text
Update schema.prisma

↓

Create Migration

↓

Update Database

↓

Generate Prisma Client
```

---

# 💻 Prisma CLI

### Tạo Migration

```bash
npx prisma migrate dev --name init
```

---

### Sinh Prisma Client

```bash
npx prisma generate
```

---

### Xem trạng thái Migration

```bash
npx prisma migrate status
```

---

### Reset Database

```bash
npx prisma migrate reset
```

---

## 📝 Example 1 - Tạo Migration đầu tiên

Schema

```prisma
model User {

    id    Int    @id @default(autoincrement())

    name  String

}
```

Thực hiện

```bash
npx prisma migrate dev --name init
```

Kết quả

```text
✔ Migration created

✔ Database updated

✔ Prisma Client generated
```

### Giải thích

Migration đầu tiên thường có tên:

```text
init
```

Prisma sẽ:

- Tạo Migration.
- Cập nhật Database.
- Sinh Prisma Client.

---

## 📝 Example 2 - Thêm cột mới

Schema

```prisma
model User {

    id    Int    @id @default(autoincrement())

    name  String

    email String
}
```

Tạo Migration

```bash
npx prisma migrate dev --name add-email
```

### Giải thích

Prisma sẽ thêm cột `email` vào bảng `User`.

---

## 📝 Example 3 - Thêm Model mới

```prisma
model Product {

    id    Int     @id @default(autoincrement())

    name  String

    price Float

}
```

Thực hiện

```bash
npx prisma migrate dev --name create-product
```

### Giải thích

Prisma sẽ tạo bảng `Product` trong Database.

---

## 📝 Example 4 - Generate Prisma Client

```bash
npx prisma generate
```

### Giải thích

Sau khi Schema thay đổi, Prisma Client cần được sinh lại để phản ánh các Model mới.

---

## 📝 Example 5 - Reset Database

```bash
npx prisma migrate reset
```

Kết quả

```text
Drop Database

↓

Recreate Database

↓

Run all Migrations

↓

Generate Prisma Client
```

### Giải thích

Lệnh này thường được sử dụng trong quá trình phát triển để làm mới Database.

---

## ⚠️ Notes

### 1. Migration Folder

Sau khi Migration thành công:

```text
prisma/

└── migrations/

    ├── 20260715093000_init/

    ├── migration.sql

    └── ...
```

Mỗi lần Migration sẽ tạo một thư mục mới.

---

### 2. migrate dev

```bash
npx prisma migrate dev
```

Sử dụng trong môi trường phát triển.

---

### 3. migrate deploy

```bash
npx prisma migrate deploy
```

Sử dụng khi triển khai ứng dụng lên Production.

---

### 4. generate

```bash
npx prisma generate
```

Sinh lại Prisma Client từ Schema hiện tại.

---

### 5. migrate reset

```bash
npx prisma migrate reset
```

Xóa toàn bộ dữ liệu và chạy lại tất cả Migration.

Không nên sử dụng trên môi trường Production.

---

### 6. Đặt tên Migration

Nên đặt tên thể hiện mục đích thay đổi.

Ví dụ:

```text
init

add-user-table

create-product

add-email

update-order-status
```

---

## 🌍 Real World Example

Giả sử hệ thống thương mại điện tử cần bổ sung trường `stock` cho bảng `Product`.

Schema

```prisma
model Product {

    id    Int     @id @default(autoincrement())

    name  String

    price Float

    stock Int
}
```

Chạy Migration

```bash
npx prisma migrate dev --name add-stock
```

Prisma sẽ:

- Thêm cột `stock`.
- Cập nhật Database.
- Sinh Prisma Client.

Ứng dụng có thể sử dụng ngay trường mới mà không cần viết SQL thủ công.

---

## ❌ Common Mistakes

### Sai 1 - Quên chạy Migration

Sai

Chỉ sửa:

```text
schema.prisma
```

Database sẽ **không thay đổi**.

Đúng

```bash
npx prisma migrate dev
```

---

### Sai 2 - Quên Generate Client

Sai

```text
Schema đã thay đổi
```

nhưng vẫn sử dụng Prisma Client cũ.

Đúng

```bash
npx prisma generate
```

(Mặc dù `migrate dev` thường tự động generate.)

---

### Sai 3 - Sử dụng migrate reset trên Production

Sai

```bash
npx prisma migrate reset
```

Lệnh này sẽ xóa toàn bộ dữ liệu.

---

### Sai 4 - Đặt tên Migration không rõ ràng

Sai

```text
update1

fix

abc
```

Đúng

```text
add-email

create-order

update-user-role
```

---

## 📚 Summary

- Migration giúp quản lý thay đổi cấu trúc Database.
- `migrate dev` tạo Migration và cập nhật Database trong môi trường phát triển.
- `migrate deploy` áp dụng Migration trên Production.
- `generate` sinh Prisma Client mới từ Schema.
- `migrate reset` xóa Database và chạy lại toàn bộ Migration.
- Nên đặt tên Migration rõ ràng để dễ theo dõi lịch sử thay đổi.

---

## 📝 Quiz

### Question 1

Lệnh nào dùng để tạo Migration mới trong môi trường phát triển?

A.

```bash
npx prisma generate
```

B.

```bash
npx prisma migrate dev --name init
```

C.

```bash
npx prisma migrate deploy
```

D.

```bash
npx prisma db push
```

**Answer: B**

**Giải thích:** `migrate dev` so sánh schema với database, sinh file SQL migration rồi áp dụng — chỉ dùng ở môi trường phát triển. Trên production phải dùng `migrate deploy`: nó chỉ áp những migration đã có sẵn chứ không tự sinh và không bao giờ xoá dữ liệu.


---

### Question 2

Lệnh nào dùng để sinh lại Prisma Client?

A.

```bash
npx prisma migrate status
```

B.

```bash
npx prisma generate
```

C.

```bash
npx prisma db seed
```

D.

```bash
npx prisma validate
```

**Answer: B**

**Giải thích:** `prisma generate` sinh lại client TypeScript từ schema. Phải chạy sau mỗi lần đổi schema, nếu không code vẫn dùng kiểu cũ và trình biên dịch báo lỗi ở những chỗ hoàn toàn hợp lệ. `migrate dev` đã tự gọi lệnh này, nhưng khi chỉ đổi thứ không sinh migration thì phải gọi tay.

