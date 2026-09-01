---
id: node-m1-l4
course: Node.js
module: Node.js Fundamentals
title: Package.json
order: 4
difficulty: Beginner
estimatedTime: 35
---
# Package.json

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu vai trò của `package.json`.
- Biết cách tạo file `package.json`.
- Hiểu các trường (fields) quan trọng trong `package.json`.
- Phân biệt `dependencies` và `devDependencies`.
- Biết cách sử dụng `scripts` để chạy ứng dụng.

---

## 📖 Definition

`package.json` là tệp cấu hình của một dự án Node.js.

File này chứa các thông tin như:

- Tên dự án.
- Phiên bản.
- Mô tả.
- Danh sách thư viện sử dụng.
- Các câu lệnh (scripts).
- Thông tin tác giả và giấy phép.

Hầu hết mọi dự án Node.js đều có file `package.json` ở thư mục gốc.

---

## 💻 Syntax

### Khởi tạo package.json

```bash
npm init
```

Hoặc

```bash
npm init -y
```

---

### Cấu trúc cơ bản

```json
{
    "name": "my-project",
    "version": "1.0.0",
    "main": "index.js"
}
```

---

## 📝 Example 1 - package.json đơn giản

```json
{
    "name": "node-demo",
    "version": "1.0.0",
    "description": "My first Node.js project",
    "main": "index.js"
}
```

### Giải thích

- `name`: tên dự án.
- `version`: phiên bản hiện tại.
- `description`: mô tả ngắn.
- `main`: file bắt đầu của ứng dụng.

---

## 📝 Example 2 - Thêm dependencies

```json
{
    "dependencies": {
        "express": "^5.0.0"
    }
}
```

Sau khi chạy:

```bash
npm install
```

npm sẽ tự động cài đặt tất cả package trong `dependencies`.

### Giải thích

`dependencies` chứa các thư viện cần thiết để ứng dụng hoạt động.

---

## 📝 Example 3 - Thêm scripts

```json
{
    "scripts": {
        "start": "node index.js",
        "dev": "nodemon index.js"
    }
}
```

Chạy ứng dụng

```bash
npm run start
```

Hoặc

```bash
npm run dev
```

### Giải thích

`scripts` giúp định nghĩa các câu lệnh thường dùng để chạy, kiểm thử hoặc build dự án.

---

## ⚠️ Notes

### 1. name

```json
"name": "my-project"
```

Tên của dự án.

Tên nên viết bằng chữ thường và dùng dấu gạch ngang (`-`) thay cho khoảng trắng.

---

### 2. version

```json
"version": "1.0.0"
```

Phiên bản của dự án.

Thông thường tuân theo quy tắc:

```text
Major.Minor.Patch
```

Ví dụ:

```text
2.5.1
```

---

### 3. dependencies

```json
"dependencies": {
    "express": "^5.0.0"
}
```

Các package cần thiết khi chạy ứng dụng.

---

### 4. devDependencies

```json
"devDependencies": {
    "nodemon": "^3.0.0"
}
```

Các package chỉ phục vụ cho quá trình phát triển hoặc kiểm thử.

---

### 5. scripts

```json
"scripts": {
    "start": "node index.js"
}
```

Cho phép chạy nhanh các lệnh bằng npm.

Ví dụ:

```bash
npm run start
```

---

## 🌍 Real World Example

Một dự án Express có thể có file `package.json` như sau:

```json
{
    "name": "express-api",
    "version": "1.0.0",
    "description": "REST API using Express",
    "main": "app.js",
    "scripts": {
        "start": "node app.js",
        "dev": "nodemon app.js"
    },
    "dependencies": {
        "express": "^5.0.0"
    },
    "devDependencies": {
        "nodemon": "^3.0.0"
    }
}
```

Nhờ `package.json`, mọi thành viên trong nhóm chỉ cần chạy:

```bash
npm install
```

để cài đặt đầy đủ các thư viện cần thiết cho dự án.

---

## ❌ Common Mistakes

### Sai 1 - Chỉnh sửa package.json nhưng không cài package

Sai

```json
{
    "dependencies": {
        "express": "^5.0.0"
    }
}
```

Sau khi chỉnh sửa, cần chạy:

```bash
npm install
```

để cài đặt package.

---

### Sai 2 - Cài nhầm devDependencies

Sai

```bash
npm install nodemon
```

Đúng

```bash
npm install -D nodemon
```

`nodemon` chỉ phục vụ trong quá trình phát triển.

---

### Sai 3 - Nhầm dependencies và devDependencies

- `dependencies`: dùng khi chạy ứng dụng.
- `devDependencies`: dùng trong quá trình phát triển và kiểm thử.

---

### Sai 4 - Quên scripts

Nếu không khai báo `scripts`, bạn phải nhập đầy đủ câu lệnh mỗi lần chạy ứng dụng.

Ví dụ:

```bash
node app.js
```

Thay vào đó có thể sử dụng:

```bash
npm run start
```

---

## 📚 Summary

- `package.json` là tệp cấu hình của dự án Node.js.
- Được tạo bằng `npm init` hoặc `npm init -y`.
- Chứa thông tin về dự án, package và scripts.
- `dependencies` lưu các thư viện cần thiết khi chạy ứng dụng.
- `devDependencies` lưu các thư viện phục vụ phát triển.
- `scripts` giúp chạy các lệnh phổ biến bằng npm.

---

## 📝 Quiz

### Question 1

Lệnh nào dùng để tạo nhanh file `package.json` với các giá trị mặc định?

A.

```bash
npm install
```

B.

```bash
npm init -y
```

C.

```bash
node init
```

D.

```bash
npm create
```

**Answer: B**

**Giải thích:** Cờ `-y` (viết tắt của `--yes`) chấp nhận mọi giá trị mặc định nên không phải trả lời câu hỏi nào. Bỏ cờ đi thì npm hỏi lần lượt tên, phiên bản, mô tả.


---

### Question 2

Trường nào trong `package.json` dùng để định nghĩa các câu lệnh có thể chạy bằng npm?

A.

```text
dependencies
```

B.

```text
main
```

C.

```text
scripts
```

D.

```text
version
```

**Answer: C**

**Giải thích:** `scripts` định nghĩa các lệnh chạy bằng `npm run <tên>`. Lợi ích thật của nó là mọi người trong nhóm gõ cùng một lệnh dù bên dưới là công cụ gì — `npm run build` không đổi kể cả khi bạn thay `tsc` bằng thứ khác.

