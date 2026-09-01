---
id: db-m3-l3
course: Database
module: Database Design
title: Index
order: 3
difficulty: Intermediate
estimatedTime: 70
---
# Index

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Index là gì.
- Biết cách Index giúp tăng tốc truy vấn.
- Phân biệt Primary Index và Secondary Index.
- Tạo và xóa Index trong SQL.
- Hiểu khi nào nên và không nên sử dụng Index.
- Áp dụng Index để tối ưu hiệu năng Database.

---

## 📖 Definition

**Index** là một cấu trúc dữ liệu đặc biệt giúp **tăng tốc độ truy vấn dữ liệu** trong cơ sở dữ liệu.

Có thể hình dung Index giống như **mục lục của một cuốn sách**.

Nếu không có mục lục, bạn phải đọc từng trang để tìm nội dung.

Nếu có mục lục, bạn có thể tìm ngay trang mong muốn.

Database cũng hoạt động tương tự.

---

# 💻 Without Index

Giả sử bảng `Users` có 5 triệu bản ghi.

```sql
SELECT *
FROM Users
WHERE email = 'alice@example.com';
```

Nếu cột `email` không có Index:

```text
Database

↓

Scan toàn bộ bảng

↓

Tìm email

↓

Trả kết quả
```

Đây gọi là **Full Table Scan**.

---

# 💻 With Index

Nếu tạo Index cho cột `email`:

```text
Database

↓

Index

↓

Tìm đúng vị trí

↓

Trả kết quả
```

Thời gian truy vấn sẽ nhanh hơn rất nhiều.

---

## 💻 Syntax

### Tạo Index

```sql
CREATE INDEX index_name
ON table_name(column_name);
```

---

### Xóa Index

```sql
DROP INDEX index_name;
```

---

### Unique Index

```sql
CREATE UNIQUE INDEX index_name
ON table_name(column_name);
```

---

## 📝 Example 1 - Create Index

```sql
CREATE INDEX idx_email
ON Users(email);
```

### Giải thích

Tạo Index cho cột `email`.

Các truy vấn theo email sẽ nhanh hơn.

---

## 📝 Example 2 - Unique Index

```sql
CREATE UNIQUE INDEX idx_username
ON Users(username);
```

### Giải thích

Ngoài việc tăng tốc truy vấn, Unique Index còn đảm bảo giá trị không bị trùng lặp.

---

## 📝 Example 3 - Composite Index

```sql
CREATE INDEX idx_name_age
ON Users(name, age);
```

### Giải thích

Đây là **Composite Index (Multi-column Index)**.

Phù hợp với các truy vấn:

```sql
SELECT *
FROM Users
WHERE name = 'Alice'
AND age = 20;
```

---

## 📝 Example 4 - Drop Index

```sql
DROP INDEX idx_email;
```

### Giải thích

Xóa Index khỏi bảng.

Sau khi xóa, Database sẽ không còn sử dụng Index đó để tối ưu truy vấn.

---

## 📝 Example 5 - Prisma

Trong Prisma, có thể khai báo Index ngay trong Schema.

```prisma
model User {

    id Int @id @default(autoincrement())

    email String

    name String

    @@index([email])

}
```

Hoặc Composite Index

```prisma
model User {

    id Int @id @default(autoincrement())

    name String

    age Int

    @@index([name, age])

}
```

### Giải thích

Sau khi chạy Migration, Prisma sẽ tạo Index tương ứng trong Database.

---

## ⚠️ Notes

### 1. Primary Key

```sql
PRIMARY KEY
```

Tự động được tạo Index.

Không cần tạo thêm Index cho Primary Key.

---

### 2. Foreign Key

Foreign Key thường nên được tạo Index để tăng tốc các phép JOIN.

Ví dụ

```sql
customer_id
```

---

### 3. Composite Index

```sql
(name, age)
```

Có hiệu quả với:

```sql
WHERE name = ?

WHERE name = ? AND age = ?
```

Nhưng **không tối ưu** cho:

```sql
WHERE age = ?
```

Do Composite Index hoạt động theo nguyên tắc **Leftmost Prefix**.

---

### 4. Index không phải lúc nào cũng tốt

Index giúp tăng tốc:

- SELECT
- JOIN
- ORDER BY
- GROUP BY

Nhưng sẽ làm chậm:

- INSERT
- UPDATE
- DELETE

Vì Database phải cập nhật lại Index sau mỗi lần dữ liệu thay đổi.

---

### 5. Không nên tạo quá nhiều Index

Mỗi Index đều:

- Chiếm dung lượng lưu trữ.
- Tăng thời gian ghi dữ liệu.
- Làm chậm quá trình Migration và Backup.

Chỉ nên tạo Index cho các cột thường xuyên được truy vấn.

---

## 🌍 Real World Example

Một website thương mại điện tử có hàng triệu sản phẩm.

Người dùng thường tìm kiếm theo:

- Email
- SKU
- Product Name
- Category

Các cột này nên được tạo Index.

```sql
CREATE INDEX idx_product_name
ON Products(name);

CREATE INDEX idx_category
ON Products(category_id);
```

Kết quả:

- Tìm kiếm nhanh hơn.
- Trang web phản hồi nhanh hơn.
- Giảm tải cho Database Server.

---

## ❌ Common Mistakes

### Sai 1 - Index mọi cột

Không phải cột nào cũng cần Index.

Ví dụ:

```text
Gender

Status

Boolean
```

Các cột có ít giá trị khác nhau thường không mang lại hiệu quả cao khi tạo Index.

---

### Sai 2 - Quá nhiều Index

Một bảng có quá nhiều Index sẽ:

- Tăng dung lượng.
- Làm chậm thao tác ghi dữ liệu.

---

### Sai 3 - Quên Index cho Foreign Key

```sql
Orders.customer_id
```

Nếu không có Index, các truy vấn JOIN có thể rất chậm khi dữ liệu lớn.

---

### Sai 4 - Không kiểm tra kế hoạch thực thi

Trước khi tối ưu, nên sử dụng:

```sql
EXPLAIN
```

hoặc

```sql
EXPLAIN ANALYZE
```

để xem Database có đang sử dụng Index hay không.

---

## 📚 Summary

- Index giúp tăng tốc truy vấn dữ liệu.
- Index hoạt động tương tự mục lục của một cuốn sách.
- `CREATE INDEX` dùng để tạo Index.
- `DROP INDEX` dùng để xóa Index.
- Primary Key thường được đánh Index tự động.
- Composite Index hỗ trợ truy vấn trên nhiều cột.
- Không nên tạo quá nhiều Index vì sẽ làm giảm hiệu năng ghi dữ liệu.
- Sử dụng `EXPLAIN` để kiểm tra việc sử dụng Index trong truy vấn.

---

## 📝 Quiz

### Question 1

Mục đích chính của Index là gì?

A.

Giảm kích thước Database.

B.

Tăng tốc độ truy vấn dữ liệu.

C.

Tăng dung lượng lưu trữ.

D.

Thay thế Primary Key.

**Answer: B**

**Giải thích:** Index cho phép database tìm đúng dòng cần mà không quét cả bảng. Nhưng nó không miễn phí: mỗi index chiếm thêm dung lượng và làm chậm `INSERT`, `UPDATE`, `DELETE` vì phải cập nhật theo. Đánh index bừa vào mọi cột thường làm hệ thống chậm đi.


---

### Question 2

Lệnh nào dùng để tạo Index?

A.

```sql
CREATE KEY
```

B.

```sql
CREATE INDEX
```

C.

```sql
ADD INDEX
```

D.

```sql
MAKE INDEX
```

**Answer: B**

**Giải thích:** `CREATE INDEX <tên> ON <bảng>(<cột>)` là cú pháp chuẩn SQL. Lưu ý index chỉ có tác dụng khi truy vấn dùng đúng cột đó theo cách index hỗ trợ — ví dụ index B-tree vô dụng với `LIKE '%abc'` vì dấu `%` ở đầu khiến không thể tìm theo tiền tố.

