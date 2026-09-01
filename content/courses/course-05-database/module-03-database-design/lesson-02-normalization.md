---
id: db-m3-l2
course: Database
module: Database Design
title: Normalization
order: 2
difficulty: Intermediate
estimatedTime: 75
---
# Normalization

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Normalization là gì.
- Biết lợi ích của việc chuẩn hóa dữ liệu.
- Phân biệt các chuẩn 1NF, 2NF và 3NF.
- Nhận biết dữ liệu dư thừa (Data Redundancy).
- Thiết kế cơ sở dữ liệu theo các chuẩn phổ biến.
- Áp dụng Normalization vào các hệ thống thực tế.

---

## 📖 Definition

**Normalization (Chuẩn hóa dữ liệu)** là quá trình tổ chức dữ liệu trong cơ sở dữ liệu nhằm:

- Giảm dữ liệu trùng lặp.
- Tránh bất nhất dữ liệu.
- Đảm bảo tính toàn vẹn.
- Dễ dàng bảo trì và mở rộng.

Normalization chia dữ liệu thành nhiều bảng và liên kết chúng bằng **Primary Key** và **Foreign Key**.

---

# 💻 Vì sao cần Normalization?

Giả sử lưu dữ liệu như sau:

| Student | Course | Teacher |
|---------|--------|----------|
| Alice | Database | John |
| Alice | Java | David |
| Bob | Database | John |
| Bob | Java | David |

Nếu giáo viên của môn Database đổi tên từ **John** thành **Michael**, chúng ta phải cập nhật nhiều dòng.

Điều này dễ gây sai sót nếu bỏ sót một bản ghi.

---

# 💻 Các chuẩn phổ biến

```text
1NF

↓

2NF

↓

3NF
```

Mỗi chuẩn sẽ loại bỏ một loại dư thừa dữ liệu khác nhau.

---

# 📝 First Normal Form (1NF)

## Điều kiện

- Mỗi cột chỉ chứa **một giá trị**.
- Không có danh sách hoặc mảng trong một ô.
- Mỗi dòng là duy nhất.

### Sai

| id | name | phones |
|----|------|----------------|
|1|Alice|111,222|

---

### Đúng

| id | name |
|----|------|
|1|Alice|

| user_id | phone |
|---------|-------|
|1|111|
|1|222|

### Giải thích

Mỗi ô chỉ chứa một giá trị.

---

# 📝 Second Normal Form (2NF)

## Điều kiện

- Đã đạt 1NF.
- Mọi thuộc tính không khóa phải phụ thuộc **toàn bộ khóa chính**.

Ví dụ

### Sai

| student_id | course_id | student_name |
|------------|-----------|--------------|

Tên sinh viên chỉ phụ thuộc vào `student_id`, không phụ thuộc toàn bộ khóa.

---

### Đúng

Student

| id | name |
|----|------|

Enrollment

| student_id | course_id |

### Giải thích

Thông tin sinh viên được tách sang bảng riêng.

---

# 📝 Third Normal Form (3NF)

## Điều kiện

- Đã đạt 2NF.
- Không có phụ thuộc bắc cầu (Transitive Dependency).

### Sai

Employee

| id | department | manager |
|----|------------|----------|

Manager phụ thuộc vào Department chứ không phụ thuộc Employee.

---

### Đúng

Department

| id | name | manager |

Employee

| id | name | department_id |

### Giải thích

Thông tin phòng ban được tách thành bảng riêng.

---

## 📝 Example 1 - Dữ liệu chưa chuẩn hóa

```text
Order

OrderID

CustomerName

CustomerPhone

Product1

Product2

Product3
```

### Vấn đề

- Khó mở rộng.
- Có nhiều giá trị trong cùng một cột.
- Trùng lặp dữ liệu.

---

## 📝 Example 2 - Sau chuẩn hóa

Customers

```text
Customer
```

Orders

```text
Order
```

Products

```text
Product
```

OrderItems

```text
Order - Product
```

### Giải thích

Thông tin được chia thành nhiều bảng và liên kết với nhau.

---

## 📝 Example 3 - Quan hệ sau chuẩn hóa

```text
Customer

↓

Orders

↓

OrderItems

↓

Products
```

Mỗi bảng chỉ chịu trách nhiệm lưu một loại dữ liệu.

---

## 📝 Example 4 - SQL

```sql
CREATE TABLE Customers (

    id INT PRIMARY KEY,

    name VARCHAR(100)

);

CREATE TABLE Orders (

    id INT PRIMARY KEY,

    customer_id INT,

    FOREIGN KEY(customer_id)

    REFERENCES Customers(id)

);
```

### Giải thích

Quan hệ được xây dựng bằng Foreign Key thay vì lặp dữ liệu.

---

## 📝 Example 5 - Prisma

```prisma
model Customer {

    id Int @id @default(autoincrement())

    name String

    orders Order[]

}

model Order {

    id Int @id @default(autoincrement())

    customerId Int

    customer Customer

        @relation(fields:[customerId], references:[id])

}
```

### Giải thích

Prisma cũng áp dụng nguyên tắc chuẩn hóa dữ liệu giống SQL.

---

## ⚠️ Notes

### 1. Không phải lúc nào cũng chuẩn hóa tối đa

Chuẩn hóa giúp giảm trùng lặp nhưng đôi khi làm tăng số lượng JOIN.

---

### 2. Denormalization

Trong các hệ thống lớn, có thể cố ý lưu dữ liệu trùng lặp để tăng tốc truy vấn.

Ví dụ:

- Dashboard
- Data Warehouse
- Hệ thống báo cáo

---

### 3. Foreign Key

Foreign Key giúp:

- Liên kết bảng.
- Đảm bảo dữ liệu hợp lệ.
- Ngăn dữ liệu mồ côi (Orphan Records).

---

### 4. Redundancy

Dữ liệu dư thừa làm tăng:

- Dung lượng lưu trữ.
- Khả năng xảy ra lỗi.
- Chi phí bảo trì.

---

### 5. Mục tiêu của Normalization

- Ít dữ liệu trùng lặp.
- Dễ cập nhật.
- Dễ mở rộng.
- Đảm bảo tính nhất quán.

---

## 🌍 Real World Example

Một website thương mại điện tử.

Thay vì lưu:

```text
Order

Customer Name

Customer Address

Customer Phone
```

ở mọi đơn hàng, hệ thống chỉ lưu:

```text
Orders

↓

customer_id

↓

Customers
```

Khi khách hàng thay đổi số điện thoại hoặc địa chỉ, chỉ cần cập nhật một bản ghi trong bảng `Customers`.

---

## ❌ Common Mistakes

### Sai 1 - Lưu nhiều giá trị trong một cột

```text
111,222,333
```

Nên tách thành nhiều dòng.

---

### Sai 2 - Lưu thông tin khách hàng trong mọi đơn hàng

Điều này gây dư thừa dữ liệu.

Nên sử dụng `customer_id`.

---

### Sai 3 - Không sử dụng Foreign Key

Khi không có Foreign Key, dữ liệu rất dễ mất tính toàn vẹn.

---

### Sai 4 - Chuẩn hóa quá mức

Quá nhiều bảng sẽ khiến truy vấn phức tạp và giảm hiệu năng.

Cần cân bằng giữa chuẩn hóa và hiệu suất.

---

## 📚 Summary

- Normalization giúp giảm dữ liệu dư thừa.
- 1NF yêu cầu mỗi ô chỉ chứa một giá trị.
- 2NF loại bỏ phụ thuộc một phần.
- 3NF loại bỏ phụ thuộc bắc cầu.
- Foreign Key giúp liên kết các bảng.
- Chuẩn hóa giúp cơ sở dữ liệu dễ bảo trì, mở rộng và đảm bảo tính nhất quán.

---

## 📝 Quiz

### Question 1

Chuẩn nào yêu cầu mỗi ô chỉ chứa một giá trị?

A.

```text
2NF
```

B.

```text
3NF
```

C.

```text
1NF
```

D.

```text
BCNF
```

**Answer: C**

**Giải thích:** **1NF** đòi mỗi ô chỉ chứa một giá trị nguyên tử — không nhét `"toán, lý, hoá"` vào một cột. Vi phạm nó thì mọi truy vấn lọc theo một môn đều phải dùng so khớp chuỗi, vừa chậm vừa sai khi tên môn này là con của tên môn kia.


---

### Question 2

Mục tiêu chính của Normalization là gì?

A.

Tăng kích thước Database.

B.

Giảm dữ liệu dư thừa và đảm bảo tính nhất quán.

C.

Giảm số lượng bảng.

D.

Loại bỏ Primary Key.

**Answer: B**

**Giải thích:** Chuẩn hoá loại bỏ dữ liệu lặp để một sự thật chỉ được lưu ở đúng một chỗ. Lợi ích thật nằm ở tính nhất quán: lưu tên khách hàng ở mười dòng đơn hàng thì sửa tên phải sửa cả mười, và bỏ sót một dòng là dữ liệu mâu thuẫn. Đánh đổi là phải `JOIN` nhiều hơn khi đọc.

