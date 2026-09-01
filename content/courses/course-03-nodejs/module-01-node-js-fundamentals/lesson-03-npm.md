---
id: node-m1-l3
course: Node.js
module: Node.js Fundamentals
title: npm
order: 3
difficulty: Beginner
estimatedTime: 35
---
# npm

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu npm là gì.
- Biết vai trò của npm trong Node.js.
- Khởi tạo dự án với npm.
- Cài đặt và gỡ bỏ package.
- Phân biệt Local Package và Global Package.
- Biết một số lệnh npm thông dụng.

---

## 📖 Definition

**npm (Node Package Manager)** là trình quản lý package mặc định của Node.js.

npm giúp lập trình viên:

- Cài đặt thư viện.
- Gỡ bỏ thư viện.
- Cập nhật package.
- Quản lý dependencies của dự án.
- Chạy các script được định nghĩa trong `package.json`.

Hiện nay npm là một trong những kho thư viện mã nguồn mở lớn nhất thế giới.

---

## 💻 Syntax

### Kiểm tra phiên bản npm

```bash
npm -v
```

---

### Khởi tạo dự án

```bash
npm init
```

Hoặc

```bash
npm init -y
```

---

### Cài đặt package

```bash
npm install express
```

Hoặc

```bash
npm i express
```

---

### Gỡ package

```bash
npm uninstall express
```

---

## 📝 Example 1 - Khởi tạo dự án

```bash
npm init -y
```

Output

```text
package.json created
```

### Giải thích

Lệnh này tạo nhanh file `package.json` với các giá trị mặc định.

---

## 📝 Example 2 - Cài đặt thư viện

```bash
npm install lodash
```

Sau khi cài đặt, dự án sẽ có:

```text
project/

├── node_modules/

├── package.json

└── package-lock.json
```

### Giải thích

- `node_modules` chứa thư viện đã cài.
- `package.json` lưu thông tin dependencies.
- `package-lock.json` lưu phiên bản chính xác của các package.

---

## 📝 Example 3 - Cài Global Package

```bash
npm install -g typescript
```

Kiểm tra

```bash
tsc --version
```

Output (ví dụ)

```text
Version 5.9.0
```

### Giải thích

Package được cài toàn cục có thể sử dụng ở mọi dự án trên máy tính.

---

## ⚠️ Notes

### 1. Local Package

```bash
npm install express
```

Package chỉ được sử dụng trong dự án hiện tại.

Đây là cách cài đặt được khuyến nghị.

---

### 2. Global Package

```bash
npm install -g typescript
```

Package có thể sử dụng ở mọi nơi trên hệ thống.

Thường dùng cho các công cụ dòng lệnh (CLI).

---

### 3. package-lock.json

```text
package-lock.json
```

Lưu chính xác phiên bản của các package và dependencies.

Giúp đảm bảo mọi lập trình viên đều cài đặt cùng một phiên bản.

---

### 4. node_modules

```text
node_modules/
```

Chứa toàn bộ package đã cài đặt.

Không nên chỉnh sửa trực tiếp thư mục này.

---

### 5. npm install

```bash
npm install
```

Nếu dự án đã có `package.json`, lệnh này sẽ cài đặt toàn bộ dependencies.

---

## 🌍 Real World Example

Một dự án Express thường được tạo theo các bước sau:

```bash
mkdir my-api

cd my-api

npm init -y

npm install express

npm install -D nodemon
```

Cấu trúc dự án:

```text
my-api/

├── node_modules/

├── package.json

├── package-lock.json

└── app.js
```

Nhờ npm, việc quản lý thư viện và chia sẻ dự án với các thành viên khác trở nên đơn giản hơn.

---

## ❌ Common Mistakes

### Sai 1 - Upload node_modules lên Git

Sai

```text
node_modules/
```

Thư mục này có thể được cài đặt lại bằng:

```bash
npm install
```

Nên thêm `node_modules` vào `.gitignore`.

---

### Sai 2 - Quên package.json

Nếu không có `package.json`, người khác sẽ không biết dự án cần cài những package nào.

---

### Sai 3 - Cài Global thay vì Local

Sai

```bash
npm install -g express
```

Đúng

```bash
npm install express
```

Các thư viện của dự án nên được cài dưới dạng Local Package.

---

### Sai 4 - Xóa package thủ công

Sai

```text
Xóa thư mục trong node_modules
```

Đúng

```bash
npm uninstall express
```

npm sẽ cập nhật lại `package.json` và `package-lock.json`.

---

## 📚 Summary

- npm là trình quản lý package của Node.js.
- Dùng `npm init` để khởi tạo dự án.
- Dùng `npm install` để cài package.
- Dùng `npm uninstall` để gỡ package.
- Local Package chỉ dùng trong dự án.
- Global Package dùng cho toàn hệ thống.
- `package-lock.json` giúp đồng bộ phiên bản package.

---

## 📝 Quiz

### Question 1

Lệnh nào dùng để cài đặt package `express`?

A.

```bash
npm create express
```

B.

```bash
npm add express
```

C.

```bash
npm install express
```

D.

```bash
npm update express
```

**Answer: C**

**Giải thích:** `npm install <tên>` là lệnh chuẩn, viết tắt là `npm i`. `npm add` là cú pháp của Yarn — hai công cụ khác nhau nên lệnh cũng khác.


---

### Question 2

Thư mục nào chứa các package đã được cài đặt?

A.

```text
src
```

B.

```text
dist
```

C.

```text
node_modules
```

D.

```text
public
```

**Answer: C**

**Giải thích:** `node_modules` do npm tạo ra và quản lý hoàn toàn. Nó phải nằm trong `.gitignore` vì dựng lại được từ `package.json` và `package-lock.json`, lại thường nặng hàng trăm megabyte.

