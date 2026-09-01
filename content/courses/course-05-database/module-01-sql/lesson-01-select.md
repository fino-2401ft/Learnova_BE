---
id: db-m1-l1
course: Database
module: SQL
title: SELECT
order: 1
difficulty: Beginner
estimatedTime: 60
---
# SELECT

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu câu lệnh SELECT.
- Truy vấn dữ liệu từ một hoặc nhiều cột.
- Lọc dữ liệu bằng WHERE.
- Sắp xếp dữ liệu bằng ORDER BY.
- Giới hạn số dòng bằng LIMIT.
- Kết hợp các mệnh đề để xây dựng truy vấn SQL hoàn chỉnh.

---

## 📖 Definition

`SELECT` là câu lệnh được sử dụng để truy vấn dữ liệu từ bảng trong cơ sở dữ liệu.

Đây là câu lệnh được sử dụng nhiều nhất trong SQL.

Ví dụ:

```sql
SELECT * FROM users;
```

Lệnh trên sẽ lấy toàn bộ dữ liệu trong bảng `users`.

---

## 💻 Syntax

### Chọn tất cả các cột

```sql
SELECT *
FROM table_name;
```

---

### Chọn một số cột

```sql
SELECT column1, column2
FROM table_name;
```

---

### Lọc dữ liệu

```sql
SELECT *
FROM table_name
WHERE condition;
```

---

### Sắp xếp dữ liệu

```sql
SELECT *
FROM table_name
ORDER BY column ASC;
```

---

### Giới hạn số dòng

```sql
SELECT *
FROM table_name
LIMIT 5;
```

---

## 📝 Example 1 - SELECT *

Giả sử bảng `users`

| id | name | age |
|----|------|-----|
|1|Alice|22|
|2|Bob|25|
|3|Charlie|20|

```sql
SELECT *
FROM users;
```

Kết quả

| id | name | age |
|----|------|-----|
|1|Alice|22|
|2|Bob|25|
|3|Charlie|20|

### Giải thích

`*` đại diện cho tất cả các cột trong bảng.

---

## 📝 Example 2 - Chọn một số cột

```sql
SELECT id, name
FROM users;
```

Kết quả

| id | name |
|----|------|
|1|Alice|
|2|Bob|
|3|Charlie|

### Giải thích

Chỉ lấy hai cột `id` và `name`.

---

## 📝 Example 3 - WHERE

```sql
SELECT *
FROM users
WHERE age >= 22;
```

Kết quả

| id | name | age |
|----|------|-----|
|1|Alice|22|
|2|Bob|25|

### Giải thích

Chỉ lấy những người có tuổi lớn hơn hoặc bằng 22.

---

## 📝 Example 4 - ORDER BY

```sql
SELECT *
FROM users
ORDER BY age DESC;
```

Kết quả

| id | name | age |
|----|------|-----|
|2|Bob|25|
|1|Alice|22|
|3|Charlie|20|

### Giải thích

Sắp xếp theo tuổi giảm dần.

---

## 📝 Example 5 - LIMIT

```sql
SELECT *
FROM users
LIMIT 2;
```

Kết quả

| id | name | age |
|----|------|-----|
|1|Alice|22|
|2|Bob|25|

### Giải thích

Chỉ lấy hai dòng đầu tiên.

---

## ⚠️ Notes

### 1. SELECT *

```sql
SELECT *
FROM users;
```

Lấy toàn bộ cột.

Trong ứng dụng thực tế, nên chỉ lấy các cột cần thiết để tăng hiệu năng.

---

### 2. WHERE

Một số toán tử phổ biến:

```sql
=
<>
>
<
>=
<=
```

---

### 3. ORDER BY

```sql
ASC
```

Sắp xếp tăng dần (mặc định).

```sql
DESC
```

Sắp xếp giảm dần.

---

### 4. LIMIT

```sql
LIMIT 10;
```

Giới hạn số bản ghi trả về.

---

### 5. Thứ tự các mệnh đề

```sql
SELECT

FROM

WHERE

ORDER BY

LIMIT
```

---

## 🌍 Real World Example

Lấy 5 sản phẩm có giá cao nhất.

```sql
SELECT id, name, price
FROM products
WHERE price > 0
ORDER BY price DESC
LIMIT 5;
```

Đây là truy vấn phổ biến trong các website thương mại điện tử.

---

## ❌ Common Mistakes

### Sai 1 - Quên FROM

Sai

```sql
SELECT *
```

Đúng

```sql
SELECT *
FROM users;
```

---

### Sai 2 - Sai thứ tự mệnh đề

Sai

```sql
SELECT *
ORDER BY age
FROM users;
```

Đúng

```sql
SELECT *
FROM users
ORDER BY age;
```

---

### Sai 3 - Lạm dụng SELECT *

Sai

```sql
SELECT *
FROM products;
```

Đúng

```sql
SELECT id, name, price
FROM products;
```

---

### Sai 4 - Điều kiện WHERE sai

Sai

```sql
WHERE age = "20"
```

Nên sử dụng đúng kiểu dữ liệu của cột.

---

## 📚 Summary

- `SELECT` dùng để truy vấn dữ liệu.
- `FROM` xác định bảng cần truy vấn.
- `WHERE` dùng để lọc dữ liệu.
- `ORDER BY` dùng để sắp xếp kết quả.
- `LIMIT` dùng để giới hạn số lượng bản ghi.
- Nên chỉ chọn các cột cần thiết thay vì sử dụng `SELECT *`.

---

## 📝 Quiz

### Question 1

Mệnh đề nào dùng để lọc dữ liệu?

A.

```sql
ORDER BY
```

B.

```sql
LIMIT
```

C.

```sql
WHERE
```

D.

```sql
GROUP BY
```

**Answer: C**

**Giải thích:** `WHERE` lọc **từng dòng** trước khi gom nhóm hay sắp xếp. Đừng nhầm với `HAVING` — nó lọc sau khi `GROUP BY` đã chạy, tức là lọc trên kết quả gộp chứ không phải trên dòng gốc.


---

### Question 2

Mệnh đề nào dùng để sắp xếp dữ liệu theo thứ tự giảm dần?

A.

```sql
ORDER BY ASC
```

B.

```sql
ORDER BY DESC
```

C.

```sql
LIMIT
```

D.

```sql
WHERE
```

**Answer: B**

**Giải thích:** `ORDER BY <cột> DESC` sắp giảm dần. Mặc định là `ASC` nên viết `ORDER BY ASC` thiếu tên cột là sai cú pháp. Lưu ý: không có `ORDER BY` thì database **không cam kết** thứ tự trả về, dù kết quả nhìn có vẻ ổn định.

