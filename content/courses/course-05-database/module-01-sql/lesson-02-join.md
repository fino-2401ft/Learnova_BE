---
id: db-m1-l2
course: Database
module: SQL
title: JOIN
order: 2
difficulty: Intermediate
estimatedTime: 70
---
# JOIN

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu JOIN là gì.
- Kết hợp dữ liệu từ nhiều bảng.
- Phân biệt INNER JOIN, LEFT JOIN, RIGHT JOIN và FULL JOIN.
- Sử dụng điều kiện JOIN với `ON`.
- Áp dụng JOIN trong các truy vấn thực tế.

---

## 📖 Definition

**JOIN** là câu lệnh dùng để kết hợp dữ liệu từ hai hoặc nhiều bảng dựa trên mối quan hệ giữa các cột.

Ví dụ:

- Bảng `users`
- Bảng `orders`

Thông qua khóa `user_id`, ta có thể biết mỗi đơn hàng thuộc về người dùng nào.

JOIN là một trong những kỹ năng quan trọng nhất khi làm việc với cơ sở dữ liệu quan hệ.

---

# 💻 Sample Database

### users

| id | name |
|----|------|
|1|Alice|
|2|Bob|
|3|Charlie|

---

### orders

| id | user_id | total |
|----|---------|-------|
|1|1|250|
|2|1|500|
|3|2|120|

---

## 💻 Syntax

### INNER JOIN

```sql
SELECT columns
FROM table1
INNER JOIN table2
ON table1.id = table2.id;
```

---

### LEFT JOIN

```sql
SELECT columns
FROM table1
LEFT JOIN table2
ON table1.id = table2.id;
```

---

### RIGHT JOIN

```sql
SELECT columns
FROM table1
RIGHT JOIN table2
ON table1.id = table2.id;
```

---

### FULL JOIN

```sql
SELECT columns
FROM table1
FULL OUTER JOIN table2
ON table1.id = table2.id;
```

---

## 📝 Example 1 - INNER JOIN

```sql
SELECT
    users.name,
    orders.total
FROM users
INNER JOIN orders
ON users.id = orders.user_id;
```

Kết quả

| name | total |
|------|-------|
|Alice|250|
|Alice|500|
|Bob|120|

### Giải thích

Chỉ những bản ghi xuất hiện ở **cả hai bảng** mới được trả về.

Charlie không xuất hiện vì chưa có đơn hàng.

---

## 📝 Example 2 - LEFT JOIN

```sql
SELECT
    users.name,
    orders.total
FROM users
LEFT JOIN orders
ON users.id = orders.user_id;
```

Kết quả

| name | total |
|------|-------|
|Alice|250|
|Alice|500|
|Bob|120|
|Charlie|NULL|

### Giải thích

LEFT JOIN lấy **toàn bộ dữ liệu của bảng bên trái** (`users`).

Nếu không có dữ liệu tương ứng trong bảng `orders`, giá trị sẽ là `NULL`.

---

## 📝 Example 3 - RIGHT JOIN

```sql
SELECT
    users.name,
    orders.total
FROM users
RIGHT JOIN orders
ON users.id = orders.user_id;
```

Kết quả

| name | total |
|------|-------|
|Alice|250|
|Alice|500|
|Bob|120|

### Giải thích

RIGHT JOIN luôn lấy toàn bộ dữ liệu từ bảng bên phải (`orders`).

---

## 📝 Example 4 - FULL JOIN

```sql
SELECT
    users.name,
    orders.total
FROM users
FULL OUTER JOIN orders
ON users.id = orders.user_id;
```

### Giải thích

FULL JOIN trả về toàn bộ dữ liệu của cả hai bảng.

Lưu ý:

- PostgreSQL hỗ trợ trực tiếp.
- MySQL không hỗ trợ `FULL OUTER JOIN`, thường mô phỏng bằng `UNION`.

---

## 📝 Example 5 - JOIN nhiều bảng

Giả sử có thêm bảng `products`.

```sql
SELECT
    users.name,
    orders.id,
    products.name
FROM users
INNER JOIN orders
ON users.id = orders.user_id
INNER JOIN products
ON orders.product_id = products.id;
```

### Giải thích

Có thể JOIN nhiều bảng liên tiếp để lấy dữ liệu liên quan.

---

## ⚠️ Notes

### 1. Điều kiện JOIN

Luôn sử dụng

```sql
ON
```

để xác định mối quan hệ.

Ví dụ

```sql
ON users.id = orders.user_id
```

---

### 2. INNER JOIN

```text
Intersection
```

Chỉ lấy dữ liệu tồn tại ở cả hai bảng.

---

### 3. LEFT JOIN

```text
All Left

+

Matching Right
```

Được sử dụng rất nhiều trong thực tế.

---

### 4. RIGHT JOIN

Lấy toàn bộ dữ liệu của bảng bên phải.

Trong nhiều dự án, RIGHT JOIN ít được sử dụng hơn LEFT JOIN.

---

### 5. FULL JOIN

Lấy toàn bộ dữ liệu của cả hai bảng.

Trong MySQL cần mô phỏng bằng:

```sql
LEFT JOIN
UNION
RIGHT JOIN
```

---

## 🌍 Real World Example

Lấy danh sách đơn hàng cùng tên khách hàng.

```sql
SELECT
    users.name,
    orders.id,
    orders.total
FROM users
INNER JOIN orders
ON users.id = orders.user_id;
```

Kết quả

| name | id | total |
|------|----|-------|
|Alice|1|250|
|Alice|2|500|
|Bob|3|120|

Đây là truy vấn rất phổ biến trong các hệ thống bán hàng.

---

## ❌ Common Mistakes

### Sai 1 - Quên ON

Sai

```sql
SELECT *
FROM users
INNER JOIN orders;
```

Đúng

```sql
SELECT *
FROM users
INNER JOIN orders
ON users.id = orders.user_id;
```

---

### Sai 2 - JOIN sai cột

Sai

```sql
ON users.id = orders.id
```

Đúng

```sql
ON users.id = orders.user_id
```

---

### Sai 3 - Lạm dụng SELECT *

Sai

```sql
SELECT *
FROM users
INNER JOIN orders
ON users.id = orders.user_id;
```

Đúng

```sql
SELECT
    users.name,
    orders.total
FROM users
INNER JOIN orders
ON users.id = orders.user_id;
```

---

### Sai 4 - Không phân biệt NULL

Trong LEFT JOIN, nếu không có dữ liệu khớp thì các cột của bảng bên phải sẽ nhận giá trị `NULL`.

Cần xử lý phù hợp trong ứng dụng.

---

## 📚 Summary

- JOIN dùng để kết hợp dữ liệu từ nhiều bảng.
- `INNER JOIN` chỉ lấy dữ liệu khớp ở cả hai bảng.
- `LEFT JOIN` lấy toàn bộ dữ liệu của bảng bên trái.
- `RIGHT JOIN` lấy toàn bộ dữ liệu của bảng bên phải.
- `FULL OUTER JOIN` lấy toàn bộ dữ liệu của cả hai bảng.
- Điều kiện JOIN được xác định bằng mệnh đề `ON`.

---

## 📝 Quiz

### Question 1

JOIN nào trả về tất cả dữ liệu của bảng bên trái, kể cả khi không có bản ghi tương ứng ở bảng bên phải?

A.

```text
INNER JOIN
```

B.

```text
LEFT JOIN
```

C.

```text
RIGHT JOIN
```

D.

```text
FULL JOIN
```

**Answer: B**

**Giải thích:** `LEFT JOIN` giữ toàn bộ dòng của bảng bên trái; chỗ nào bảng phải không khớp thì điền `NULL`. `INNER JOIN` thì loại luôn những dòng đó — đây là lý do một câu truy vấn đột nhiên mất bản ghi sau khi thêm `JOIN`.


---

### Question 2

Mệnh đề nào được sử dụng để xác định điều kiện kết nối giữa hai bảng?

A.

```sql
WHERE
```

B.

```sql
GROUP BY
```

C.

```sql
ON
```

D.

```sql
HAVING
```

**Answer: C**

**Giải thích:** `ON` nêu điều kiện nối hai bảng, `WHERE` lọc kết quả sau khi đã nối. Với `INNER JOIN` thì đặt điều kiện ở đâu cũng ra kết quả như nhau, nhưng với `LEFT JOIN` thì khác hẳn: điều kiện lên bảng phải mà đặt ở `WHERE` sẽ biến `LEFT JOIN` thành `INNER JOIN`.

