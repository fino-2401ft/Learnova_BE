---
id: auth-m1-l1
course: Authentication & Security
module: Authentication
title: Password Hashing
order: 1
difficulty: Intermediate
estimatedTime: 40
---
# Password Hashing

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Password Hashing là gì.
- Phân biệt Hashing và Encryption.
- Biết vì sao không được lưu mật khẩu dạng Plain Text.
- Sử dụng bcrypt để Hash và Verify Password.
- Áp dụng Password Hashing trong ứng dụng NestJS.

---

## 📖 Definition

Khi người dùng đăng ký tài khoản, **không bao giờ được lưu mật khẩu gốc (Plain Text)** vào cơ sở dữ liệu.

Ví dụ không an toàn:

```text
Username: alice

Password: 123456
```

Nếu cơ sở dữ liệu bị rò rỉ, toàn bộ mật khẩu sẽ bị lộ.

Để bảo vệ người dùng, mật khẩu phải được **Hash** trước khi lưu.

Hashing là quá trình chuyển đổi dữ liệu thành một chuỗi ký tự có độ dài cố định bằng thuật toán băm.

Ví dụ:

```text
123456

↓

$2b$10$GpGmX5...
```

Server chỉ lưu chuỗi đã Hash thay vì mật khẩu gốc.

---

## 💻 Syntax

### Cài đặt bcrypt

```bash
npm install bcrypt
```

---

### Hash Password

```typescript
const hash = await bcrypt.hash(password, 10);
```

---

### Verify Password

```typescript
const isMatch = await bcrypt.compare(password, hash);
```

---

## 📝 Example 1 - Hash Password

```typescript
import * as bcrypt from "bcrypt";

const password = "123456";

const hash = await bcrypt.hash(password, 10);

console.log(hash);
```

Output

```text
$2b$10$GpGmX5J...
```

### Giải thích

Mỗi lần Hash sẽ tạo ra một chuỗi khác nhau do bcrypt tự sinh **Salt**.

---

## 📝 Example 2 - Compare Password

```typescript
const password = "123456";

const isMatch = await bcrypt.compare(password, hash);

console.log(isMatch);
```

Output

```text
true
```

### Giải thích

bcrypt sẽ Hash lại mật khẩu nhập vào và so sánh với giá trị đã lưu trong cơ sở dữ liệu.

---

## 📝 Example 3 - Register User

```typescript
const hashedPassword = await bcrypt.hash(user.password, 10);

await prisma.user.create({

    data: {

        username: user.username,

        password: hashedPassword

    }

});
```

Output

```text
User created successfully.
```

### Giải thích

Chỉ mật khẩu đã Hash được lưu vào Database.

Không lưu mật khẩu gốc.

---

## ⚠️ Notes

### 1. Không lưu Plain Text Password

Sai

```text
123456
```

Đúng

```text
$2b$10$...
```

---

### 2. Hash ≠ Encryption

Hash

- Một chiều.
- Không thể giải mã.

Encryption

- Hai chiều.
- Có thể giải mã bằng Key.

Mật khẩu nên sử dụng **Hash**, không phải Encryption.

---

### 3. Salt

bcrypt tự động sinh Salt trước khi Hash.

Điều này giúp:

- Hai người dùng có cùng mật khẩu vẫn tạo ra Hash khác nhau.
- Chống Rainbow Table Attack.

---

### 4. Salt Rounds

```typescript
bcrypt.hash(password, 10);
```

Số **10** là Salt Rounds.

Giá trị càng lớn:

- Bảo mật hơn.
- Hash chậm hơn.

Thông thường sử dụng từ **10 đến 12**.

---

### 5. bcrypt.compare()

Không nên so sánh trực tiếp:

```typescript
password === hash
```

Phải sử dụng:

```typescript
bcrypt.compare()
```

---

## 🌍 Real World Example

Quy trình đăng ký:

```text
Client

↓

POST /register

↓

Hash Password

↓

Save User

↓

Database
```

Quy trình đăng nhập:

```text
Client

↓

POST /login

↓

Find User

↓

bcrypt.compare()

↓

Generate JWT
```

Đây là quy trình xác thực phổ biến trong các ứng dụng Node.js và NestJS.

---

## ❌ Common Mistakes

### Sai 1 - Lưu mật khẩu gốc

Sai

```typescript
password: "123456"
```

Đúng

```typescript
password: hashedPassword
```

---

### Sai 2 - Dùng MD5 hoặc SHA1

Các thuật toán như:

- MD5
- SHA1

không còn phù hợp để Hash Password.

Nên sử dụng:

- bcrypt
- argon2

---

### Sai 3 - So sánh bằng toán tử ===

Sai

```typescript
password === hash
```

Đúng

```typescript
bcrypt.compare(password, hash)
```

---

### Sai 4 - Salt Rounds quá thấp

Ví dụ

```typescript
bcrypt.hash(password, 1)
```

Không đủ an toàn.

Khuyến nghị:

```typescript
10 - 12
```

---

## 📚 Summary

- Không bao giờ lưu mật khẩu dạng Plain Text.
- bcrypt là thư viện phổ biến để Hash Password trong Node.js.
- Hashing là quá trình một chiều, không thể giải mã.
- bcrypt sử dụng Salt để tăng tính bảo mật.
- Khi đăng nhập, sử dụng `bcrypt.compare()` để xác minh mật khẩu.

---

## 📝 Quiz

### Question 1

Thư viện nào thường dùng để Hash Password trong Node.js?

A.

```text
jsonwebtoken
```

B.

```text
bcrypt
```

C.

```text
helmet
```

D.

```text
express
```

**Answer: B**

**Giải thích:** `bcrypt` băm mật khẩu **một chiều** và cố tình chạy chậm để chống dò tìm hàng loạt. `jsonwebtoken` làm việc hoàn toàn khác — nó ký token, và token thì đọc ngược được. Đừng bao giờ dùng hàm băm nhanh như MD5 hay SHA-256 cho mật khẩu: chính tốc độ của chúng là điểm yếu.


---

### Question 2

Phương thức nào dùng để kiểm tra mật khẩu?

A.

```typescript
bcrypt.verify()
```

B.

```typescript
bcrypt.compare()
```

C.

```typescript
bcrypt.check()
```

D.

```typescript
bcrypt.validate()
```

**Answer: B**

**Giải thích:** `bcrypt.compare(plain, hash)` băm lại chuỗi đầu vào bằng đúng salt lấy từ hash rồi so kết quả. Không có cách nào giải mã hash ngược về mật khẩu — đó chính là mục đích. Lưu ý bcrypt âm thầm cắt mọi thứ vượt quá 72 byte, nên DTO phải chặn độ dài từ đầu.

