---
id: db-m1-l4
course: Database
module: SQL
title: Transaction
order: 4
difficulty: Intermediate
estimatedTime: 70
---
# Transaction

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Transaction là gì.
- Biết tại sao cần Transaction.
- Sử dụng BEGIN, COMMIT và ROLLBACK.
- Hiểu tính chất ACID của Transaction.
- Áp dụng Transaction trong các thao tác liên quan đến nhiều bảng.
- Xử lý lỗi để đảm bảo tính toàn vẹn dữ liệu.

---

## 📖 Definition

**Transaction** là một nhóm các câu lệnh SQL được thực hiện như **một đơn vị công việc (Unit of Work)**.

Nếu **tất cả câu lệnh đều thành công**, dữ liệu sẽ được lưu.

Nếu **một câu lệnh thất bại**, toàn bộ thay đổi sẽ bị hủy.

Transaction giúp đảm bảo dữ liệu luôn nhất quán và chính xác.

Ví dụ:

Khi chuyển tiền ngân hàng:

1. Trừ tiền tài khoản A.
2. Cộng tiền tài khoản B.

Nếu bước 2 thất bại thì bước 1 cũng phải được hủy.

---

## 💻 Syntax

### Bắt đầu Transaction

```sql
BEGIN;
```

---

### Lưu thay đổi

```sql
COMMIT;
```

---

### Hủy thay đổi

```sql
ROLLBACK;
```

---

## 📝 Example 1 - COMMIT

```sql
BEGIN;

UPDATE accounts
SET balance = balance - 100
WHERE id = 1;

UPDATE accounts
SET balance = balance + 100
WHERE id = 2;

COMMIT;
```

### Giải thích

Nếu cả hai câu lệnh UPDATE thành công thì Transaction được lưu bằng `COMMIT`.

---

## 📝 Example 2 - ROLLBACK

```sql
BEGIN;

UPDATE accounts
SET balance = balance - 100
WHERE id = 1;

UPDATE accounts
SET balance = balance + 100
WHERE id = 999;

ROLLBACK;
```

### Giải thích

Do tài khoản `999` không tồn tại nên Transaction bị hủy.

Tài khoản đầu tiên sẽ không bị trừ tiền.

---

## 📝 Example 3 - Transaction khi tạo đơn hàng

```sql
BEGIN;

INSERT INTO orders(user_id, total)
VALUES (1, 500);

UPDATE products
SET stock = stock - 1
WHERE id = 10;

COMMIT;
```

### Giải thích

Đơn hàng chỉ được tạo khi việc cập nhật tồn kho cũng thành công.

---

## 📝 Example 4 - Transaction trong Node.js

```javascript
await prisma.$transaction(async (tx) => {

    await tx.user.create({

        data: {

            name: "Alice"

        }

    });

    await tx.profile.create({

        data: {

            userId: 1

        }

    });

});
```

### Giải thích

Prisma sẽ tự động:

- Commit nếu tất cả thành công.
- Rollback nếu có lỗi.

---

## ⚠️ Notes

### 1. ACID

Transaction tuân theo bốn tính chất ACID.

---

### Atomicity

```text
All or Nothing
```

Hoặc tất cả thành công, hoặc tất cả thất bại.

---

### Consistency

Transaction luôn đưa Database từ trạng thái hợp lệ này sang trạng thái hợp lệ khác.

---

### Isolation

Các Transaction chạy đồng thời không ảnh hưởng lẫn nhau.

---

### Durability

Sau khi `COMMIT`, dữ liệu sẽ được lưu vĩnh viễn ngay cả khi hệ thống gặp sự cố.

---

### 2. COMMIT

```sql
COMMIT;
```

Lưu toàn bộ thay đổi.

---

### 3. ROLLBACK

```sql
ROLLBACK;
```

Hủy toàn bộ thay đổi kể từ khi bắt đầu Transaction.

---

### 4. Khi nào cần Transaction?

Nên sử dụng khi:

- Chuyển tiền.
- Đặt hàng.
- Thanh toán.
- Cập nhật nhiều bảng.
- Thực hiện nhiều thao tác phụ thuộc lẫn nhau.

---

### 5. Không nên Transaction quá lâu

Transaction kéo dài có thể:

- Khóa bảng.
- Giảm hiệu năng.
- Gây Deadlock.

Nên thực hiện nhanh và chỉ bao gồm các thao tác cần thiết.

---

## 🌍 Real World Example

Một hệ thống thương mại điện tử.

Khi khách hàng đặt hàng:

```text
Tạo đơn hàng

↓

Giảm số lượng tồn kho

↓

Tạo lịch sử thanh toán

↓

Cập nhật điểm thưởng

↓

COMMIT
```

Nếu một trong các bước thất bại:

```text
ROLLBACK
```

Không có thay đổi nào được lưu.

Điều này giúp đảm bảo dữ liệu luôn chính xác.

---

## ❌ Common Mistakes

### Sai 1 - Quên COMMIT

Sai

```sql
BEGIN;

UPDATE products
SET stock = stock - 1;
```

Không gọi:

```sql
COMMIT;
```

Thay đổi sẽ không được lưu.

---

### Sai 2 - Không ROLLBACK khi có lỗi

Sai

```sql
BEGIN;

UPDATE accounts
SET balance = balance - 100;
```

Nếu có lỗi xảy ra mà không gọi `ROLLBACK`, Transaction có thể ở trạng thái chưa hoàn tất.

---

### Sai 3 - Không dùng Transaction

Sai

```sql
UPDATE accounts
SET balance = balance - 100;

UPDATE accounts
SET balance = balance + 100;
```

Nếu câu lệnh thứ hai thất bại, dữ liệu sẽ không còn nhất quán.

Đúng

```sql
BEGIN;

UPDATE ...

UPDATE ...

COMMIT;
```

---

### Sai 4 - Transaction quá dài

Không nên đặt các thao tác mất nhiều thời gian (đọc file, gọi API...) bên trong Transaction vì sẽ giữ khóa dữ liệu lâu hơn cần thiết.

---

## 📚 Summary

- Transaction là tập hợp nhiều câu lệnh SQL được thực hiện như một đơn vị.
- `BEGIN` bắt đầu Transaction.
- `COMMIT` lưu toàn bộ thay đổi.
- `ROLLBACK` hủy toàn bộ thay đổi khi có lỗi.
- Transaction đảm bảo tính toàn vẹn dữ liệu thông qua các tính chất ACID.
- Transaction rất quan trọng trong các hệ thống ngân hàng, thương mại điện tử và thanh toán.

---

## 📝 Quiz

### Question 1

Lệnh nào dùng để lưu toàn bộ thay đổi của Transaction?

A.

```sql
BEGIN
```

B.

```sql
SAVE
```

C.

```sql
COMMIT
```

D.

```sql
ROLLBACK
```

**Answer: C**

**Giải thích:** `COMMIT` ghi vĩnh viễn mọi thay đổi của transaction. Trước khi commit, các thay đổi chỉ nhìn thấy được từ chính phiên đó; `ROLLBACK` sẽ huỷ sạch chúng như chưa từng xảy ra.


---

### Question 2

Trong ACID, chữ **A** là viết tắt của?

A.

```text
Accuracy
```

B.

```text
Atomicity
```

C.

```text
Availability
```

D.

```text
Authorization
```

**Answer: B**

**Giải thích:** **Atomicity** — hoặc tất cả thành công, hoặc không gì cả. Ví dụ điển hình là chuyển khoản: trừ tiền tài khoản A và cộng tiền tài khoản B phải cùng thành công; nếu bước hai hỏng mà bước một đã ghi thì tiền biến mất. Ba chữ còn lại là Consistency, Isolation, Durability.

