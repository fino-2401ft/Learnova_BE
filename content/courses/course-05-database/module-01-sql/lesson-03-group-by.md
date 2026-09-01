---
id: db-m1-l3
course: Database
module: SQL
title: GROUP BY
order: 3
difficulty: Intermediate
estimatedTime: 65
---
# GROUP BY

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu GROUP BY là gì.
- Nhóm dữ liệu theo một hoặc nhiều cột.
- Sử dụng các hàm tổng hợp (Aggregate Functions).
- Lọc dữ liệu nhóm bằng HAVING.
- Áp dụng GROUP BY trong các truy vấn thống kê.

---

## 📖 Definition

**GROUP BY** là mệnh đề dùng để nhóm các dòng có cùng giá trị trong một hoặc nhiều cột.

GROUP BY thường được sử dụng cùng các hàm tổng hợp như:

- COUNT()
- SUM()
- AVG()
- MAX()
- MIN()

Ví dụ:

Thống kê số lượng đơn hàng của từng khách hàng.

---

# 💻 Sample Database

### orders

| id | user_id | total |
|----|---------|------:|
|1|1|200|
|2|1|300|
|3|2|500|
|4|2|150|
|5|3|400|

---

## 💻 Syntax

### GROUP BY

```sql
SELECT column,
       aggregate_function(column)
FROM table_name
GROUP BY column;
```

---

### GROUP BY + HAVING

```sql
SELECT column,
       COUNT(*)
FROM table_name
GROUP BY column
HAVING COUNT(*) > 1;
```

---

## 📝 Example 1 - COUNT

```sql
SELECT
    user_id,
    COUNT(*) AS total_orders
FROM orders
GROUP BY user_id;
```

Kết quả

| user_id | total_orders |
|---------|-------------:|
|1|2|
|2|2|
|3|1|

### Giải thích

Đếm số lượng đơn hàng của từng người dùng.

---

## 📝 Example 2 - SUM

```sql
SELECT
    user_id,
    SUM(total) AS total_amount
FROM orders
GROUP BY user_id;
```

Kết quả

| user_id | total_amount |
|---------|-------------:|
|1|500|
|2|650|
|3|400|

### Giải thích

Tính tổng giá trị đơn hàng của từng người dùng.

---

## 📝 Example 3 - AVG

```sql
SELECT
    user_id,
    AVG(total) AS average_amount
FROM orders
GROUP BY user_id;
```

Kết quả

| user_id | average_amount |
|---------|---------------:|
|1|250|
|2|325|
|3|400|

### Giải thích

Tính giá trị trung bình của các đơn hàng.

---

## 📝 Example 4 - MAX và MIN

```sql
SELECT
    user_id,
    MAX(total) AS highest_order,
    MIN(total) AS lowest_order
FROM orders
GROUP BY user_id;
```

Kết quả

| user_id | highest_order | lowest_order |
|---------|--------------:|-------------:|
|1|300|200|
|2|500|150|
|3|400|400|

### Giải thích

- `MAX()` tìm giá trị lớn nhất.
- `MIN()` tìm giá trị nhỏ nhất.

---

## 📝 Example 5 - HAVING

```sql
SELECT
    user_id,
    COUNT(*) AS total_orders
FROM orders
GROUP BY user_id
HAVING COUNT(*) >= 2;
```

Kết quả

| user_id | total_orders |
|---------|-------------:|
|1|2|
|2|2|

### Giải thích

HAVING lọc kết quả **sau khi dữ liệu đã được nhóm**.

---

## ⚠️ Notes

### 1. Aggregate Functions

Các hàm thường dùng:

```sql
COUNT()
```

Đếm số dòng.

---

```sql
SUM()
```

Tính tổng.

---

```sql
AVG()
```

Tính trung bình.

---

```sql
MAX()
```

Lấy giá trị lớn nhất.

---

```sql
MIN()
```

Lấy giá trị nhỏ nhất.

---

### 2. GROUP BY

```sql
GROUP BY user_id;
```

Mỗi giá trị `user_id` sẽ tạo thành một nhóm.

---

### 3. HAVING và WHERE

**WHERE**

Lọc dữ liệu **trước khi GROUP BY**.

```sql
SELECT *
FROM orders
WHERE total > 100;
```

---

**HAVING**

Lọc dữ liệu **sau khi GROUP BY**.

```sql
HAVING COUNT(*) > 1;
```

---

### 4. GROUP BY nhiều cột

```sql
GROUP BY user_id, status;
```

Dữ liệu sẽ được nhóm theo cả hai cột.

---

### 5. Thứ tự các mệnh đề

```sql
SELECT

FROM

WHERE

GROUP BY

HAVING

ORDER BY

LIMIT
```

Đây là thứ tự chuẩn trong một câu truy vấn SQL.

---

## 🌍 Real World Example

Thống kê doanh thu theo khách hàng.

```sql
SELECT
    user_id,
    COUNT(*) AS total_orders,
    SUM(total) AS revenue
FROM orders
GROUP BY user_id
ORDER BY revenue DESC;
```

Kết quả

| user_id | total_orders | revenue |
|---------|-------------:|--------:|
|2|2|650|
|1|2|500|
|3|1|400|

Đây là truy vấn thường gặp trong các hệ thống bán hàng và báo cáo doanh thu.

---

## ❌ Common Mistakes

### Sai 1 - Không GROUP BY cột không tổng hợp

Sai

```sql
SELECT
    user_id,
    total
FROM orders
GROUP BY user_id;
```

Đúng

```sql
SELECT
    user_id,
    SUM(total)
FROM orders
GROUP BY user_id;
```

---

### Sai 2 - Dùng WHERE với hàm tổng hợp

Sai

```sql
WHERE COUNT(*) > 1
```

Đúng

```sql
HAVING COUNT(*) > 1
```

---

### Sai 3 - Quên GROUP BY

Sai

```sql
SELECT
    user_id,
    COUNT(*)
FROM orders;
```

Đúng

```sql
SELECT
    user_id,
    COUNT(*)
FROM orders
GROUP BY user_id;
```

---

### Sai 4 - Nhầm thứ tự mệnh đề

Sai

```sql
HAVING COUNT(*) > 1
GROUP BY user_id
```

Đúng

```sql
GROUP BY user_id
HAVING COUNT(*) > 1
```

---

## 📚 Summary

- `GROUP BY` dùng để nhóm dữ liệu.
- Các hàm tổng hợp phổ biến gồm `COUNT()`, `SUM()`, `AVG()`, `MAX()` và `MIN()`.
- `HAVING` dùng để lọc các nhóm dữ liệu sau khi đã GROUP BY.
- `WHERE` lọc dữ liệu trước khi GROUP BY.
- GROUP BY là nền tảng để xây dựng các báo cáo và thống kê dữ liệu.

---

## 📝 Quiz

### Question 1

Mệnh đề nào được sử dụng để nhóm dữ liệu?

A.

```sql
ORDER BY
```

B.

```sql
GROUP BY
```

C.

```sql
HAVING
```

D.

```sql
LIMIT
```

**Answer: B**

**Giải thích:** `GROUP BY` gộp các dòng có cùng giá trị thành một nhóm, để hàm tổng hợp như `COUNT`, `SUM`, `AVG` tính trên từng nhóm. Quy tắc đi kèm: mọi cột trong `SELECT` mà không nằm trong hàm tổng hợp thì phải có mặt ở `GROUP BY`.


---

### Question 2

Mệnh đề nào dùng để lọc dữ liệu sau khi GROUP BY?

A.

```sql
WHERE
```

B.

```sql
LIMIT
```

C.

```sql
HAVING
```

D.

```sql
ORDER BY
```

**Answer: C**

**Giải thích:** `HAVING` lọc **sau** khi gom nhóm nên dùng được kết quả của hàm tổng hợp, ví dụ `HAVING COUNT(*) > 5`. `WHERE` chạy trước `GROUP BY` nên không thấy được những giá trị đó — viết `WHERE COUNT(*) > 5` là lỗi cú pháp.

