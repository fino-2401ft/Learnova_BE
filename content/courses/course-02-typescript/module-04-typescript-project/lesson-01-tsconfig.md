---
id: ts-m4-l1
course: TypeScript
module: TypeScript Project
title: tsconfig
order: 1
difficulty: Beginner
estimatedTime: 30
---
# tsconfig

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu vai trò của `tsconfig.json`.
- Khởi tạo một dự án TypeScript.
- Hiểu các cấu hình quan trọng trong `tsconfig.json`.
- Biết cách biên dịch dự án bằng TypeScript Compiler.

---

## 📖 Definition

`tsconfig.json` là tệp cấu hình của dự án TypeScript.

File này cho TypeScript Compiler (`tsc`) biết:

- File nào cần biên dịch.
- Phiên bản JavaScript sẽ được tạo ra.
- Thư mục chứa mã nguồn.
- Thư mục chứa file sau khi biên dịch.
- Các quy tắc kiểm tra kiểu dữ liệu.

Hầu hết mọi dự án TypeScript đều có file này ở thư mục gốc.

---

## 💻 Syntax

### Khởi tạo tsconfig

```bash
tsc --init
```

Sau khi chạy lệnh, TypeScript sẽ tạo:

```text
tsconfig.json
```

---

### Cấu trúc cơ bản

```json
{
    "compilerOptions": {

    }
}
```

---

## 📝 Example 1 - Tạo tsconfig

```bash
tsc --init
```

Output

```text
Created a new tsconfig.json
```

### Giải thích

Lệnh trên tự động tạo file cấu hình mặc định cho dự án.

---

## 📝 Example 2 - Cấu hình Compiler

```json
{
    "compilerOptions": {

        "target": "ES2022",

        "module": "CommonJS",

        "strict": true

    }
}
```

### Giải thích

- `target`: Phiên bản JavaScript được tạo ra.
- `module`: Hệ thống Module sử dụng.
- `strict`: Bật chế độ kiểm tra kiểu dữ liệu nghiêm ngặt.

---

## 📝 Example 3 - Chỉ định thư mục

```json
{
    "compilerOptions": {

        "rootDir": "./src",

        "outDir": "./dist"

    }
}
```

Sau khi biên dịch:

```text
src/
    app.ts

↓

dist/
    app.js
```

### Giải thích

- `rootDir`: Thư mục chứa mã nguồn.
- `outDir`: Thư mục chứa mã JavaScript sau khi biên dịch.

---

## ⚠️ Notes

### 1. target

```json
"target": "ES2022"
```

Xác định phiên bản JavaScript được tạo ra.

---

### 2. module

```json
"module": "CommonJS"
```

Hoặc

```json
"module": "ESNext"
```

Phụ thuộc vào môi trường Node.js hoặc trình duyệt.

---

### 3. rootDir

```json
"rootDir": "./src"
```

Thư mục chứa mã nguồn.

---

### 4. outDir

```json
"outDir": "./dist"
```

Thư mục chứa file JavaScript sau khi build.

---

### 5. strict

```json
"strict": true
```

Bật tất cả các quy tắc kiểm tra kiểu dữ liệu.

Đây là cấu hình được khuyến nghị trong mọi dự án TypeScript.

---

## 🌍 Real World Example

Một dự án Node.js thường có cấu trúc:

```text
project/

│

├── src/

│   ├── app.ts

│   └── server.ts

│

├── dist/

│

├── package.json

└── tsconfig.json
```

File `tsconfig.json`

```json
{
    "compilerOptions": {

        "target": "ES2022",

        "module": "CommonJS",

        "rootDir": "./src",

        "outDir": "./dist",

        "strict": true

    }
}
```

Đây là cấu hình phổ biến trong các dự án Node.js và NestJS.

---

## ❌ Common Mistakes

### Sai 1 - Không có tsconfig

Nếu không có `tsconfig.json`, TypeScript sẽ sử dụng cấu hình mặc định.

Điều này có thể dẫn đến kết quả biên dịch không như mong muốn.

---

### Sai 2 - Sai rootDir

Sai

```json
"rootDir": "./source"
```

Trong khi thư mục thực tế là:

```text
src/
```

---

### Sai 3 - Quên outDir

Nếu không chỉ định `outDir`, file JavaScript sẽ được tạo cùng thư mục với file TypeScript.

---

### Sai 4 - Tắt strict

```json
"strict": false
```

Làm giảm khả năng phát hiện lỗi của TypeScript.

Khuyến nghị luôn để:

```json
"strict": true
```

---

## 📚 Summary

- `tsconfig.json` là file cấu hình của TypeScript.
- Được tạo bằng lệnh `tsc --init`.
- Chứa các tùy chọn cho TypeScript Compiler.
- Các cấu hình quan trọng gồm:
  - `target`
  - `module`
  - `rootDir`
  - `outDir`
  - `strict`
- Mọi dự án TypeScript đều nên có `tsconfig.json`.

---

## 📝 Quiz

### Question 1

Lệnh nào dùng để tạo `tsconfig.json`?

A.

```bash
npm init
```

B.

```bash
tsc --init
```

C.

```bash
node init
```

D.

```bash
npm install typescript
```

**Answer: B**

**Giải thích:** `tsc --init` sinh ra `tsconfig.json` kèm chú thích cho từng tuỳ chọn. `npm init` tạo `package.json` — file khác hẳn, và `npm install typescript` chỉ cài trình biên dịch chứ không tạo cấu hình.

---

### Question 2

Thuộc tính nào xác định thư mục chứa file JavaScript sau khi biên dịch?

A.

```text
target
```

B.

```text
rootDir
```

C.

```text
outDir
```

D.

```text
strict
```

**Answer: C**

**Giải thích:** `outDir` chỉ nơi ghi file JavaScript sau khi biên dịch. Đừng nhầm với `rootDir` — nó chỉ nơi **đọc** mã nguồn vào. Cặp này thường đi cùng nhau: `rootDir: "src"` và `outDir: "dist"`.
