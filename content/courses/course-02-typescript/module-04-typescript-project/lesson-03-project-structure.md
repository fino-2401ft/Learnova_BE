---
id: ts-m4-l3
course: TypeScript
module: TypeScript Project
title: Project Structure
order: 3
difficulty: Beginner
estimatedTime: 30
---
# Project Structure

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu tầm quan trọng của việc tổ chức cấu trúc dự án.
- Biết cách sắp xếp các thư mục trong dự án TypeScript.
- Phân biệt vai trò của các thư mục phổ biến.
- Tổ chức mã nguồn theo hướng dễ bảo trì và mở rộng.
- Áp dụng cấu trúc dự án trong các ứng dụng thực tế.

---

## 📖 Definition

Project Structure là cách tổ chức các thư mục và tệp trong một dự án.

Một cấu trúc hợp lý giúp:

- Dễ tìm kiếm mã nguồn.
- Dễ bảo trì.
- Dễ mở rộng.
- Hỗ trợ làm việc nhóm hiệu quả.

Trong các dự án TypeScript, mã nguồn thường được đặt trong thư mục `src`, còn mã JavaScript sau khi biên dịch được đặt trong `dist`.

---

## 💻 Syntax

### Cấu trúc cơ bản

```text
project/

├── src/

├── dist/

├── package.json

├── tsconfig.json

└── node_modules/
```

---

### Thư mục src

```text
src/

├── app.ts

├── models/

├── services/

└── utils/
```

---

## 📝 Example 1 - Dự án TypeScript đơn giản

```text
project/

├── src/

│   └── app.ts

├── dist/

├── package.json

└── tsconfig.json
```

### Giải thích

- `src`: chứa mã nguồn TypeScript.
- `dist`: chứa file JavaScript sau khi biên dịch.
- `package.json`: quản lý package của dự án.
- `tsconfig.json`: cấu hình TypeScript Compiler.

---

## 📝 Example 2 - Chia thư mục theo chức năng

```text
src/

├── models/

│   └── User.ts

├── services/

│   └── UserService.ts

├── utils/

│   └── helper.ts

└── app.ts
```

### Giải thích

- `models`: chứa class hoặc interface của dữ liệu.
- `services`: chứa logic xử lý nghiệp vụ.
- `utils`: chứa các hàm tiện ích.
- `app.ts`: điểm bắt đầu của chương trình.

---

## 📝 Example 3 - Dự án lớn

```text
project/

├── src/

│   ├── controllers/

│   ├── services/

│   ├── models/

│   ├── interfaces/

│   ├── utils/

│   ├── config/

│   └── app.ts

├── dist/

├── package.json

├── tsconfig.json

└── README.md
```

### Giải thích

Khi dự án phát triển lớn hơn, mã nguồn được chia thành nhiều thư mục theo chức năng để dễ quản lý và mở rộng.

---

## ⚠️ Notes

### 1. src

```text
src/
```

Chứa toàn bộ mã nguồn TypeScript.

---

### 2. dist

```text
dist/
```

Chứa các file JavaScript được tạo sau khi biên dịch.

Không nên chỉnh sửa trực tiếp các file trong thư mục này.

---

### 3. package.json

```text
package.json
```

Quản lý:

- Tên dự án.
- Phiên bản.
- Scripts.
- Dependencies.

---

### 4. tsconfig.json

```text
tsconfig.json
```

Quản lý các thiết lập của TypeScript Compiler.

---

### 5. node_modules

```text
node_modules/
```

Chứa các thư viện được cài đặt bằng npm.

Không nên chỉnh sửa thủ công thư mục này.

---

## 🌍 Real World Example

Một dự án Backend sử dụng TypeScript có thể được tổ chức như sau:

```text
project/

├── src/

│   ├── controllers/

│   │   └── UserController.ts

│   ├── services/

│   │   └── UserService.ts

│   ├── models/

│   │   └── User.ts

│   ├── routes/

│   │   └── userRoutes.ts

│   ├── config/

│   │   └── database.ts

│   └── app.ts

├── dist/

├── package.json

├── tsconfig.json

└── README.md
```

Cấu trúc này giúp:

- Dễ phát triển thêm tính năng.
- Dễ kiểm thử.
- Hỗ trợ nhiều lập trình viên làm việc cùng lúc.
- Dễ bảo trì khi dự án mở rộng.

---

## ❌ Common Mistakes

### Sai 1 - Đặt tất cả file trong src

Sai

```text
src/

app.ts

User.ts

Product.ts

Order.ts

helper.ts

database.ts
```

Việc để tất cả file trong cùng một thư mục khiến dự án khó quản lý.

---

### Sai 2 - Chỉnh sửa file trong dist

Sai

```text
dist/

app.js
```

Các file trong `dist` sẽ bị ghi đè sau mỗi lần biên dịch.

Chỉ nên chỉnh sửa các file trong `src`.

---

### Sai 3 - Đưa node_modules lên Git

Sai

```text
node_modules/
```

Thư mục này rất lớn và có thể cài đặt lại bằng:

```bash
npm install
```

Nên thêm `node_modules` vào `.gitignore`.

---

### Sai 4 - Không chia thư mục theo chức năng

Đặt toàn bộ model, service và utility trong cùng một thư mục sẽ làm mã nguồn khó đọc và khó mở rộng.

---

## 📚 Summary

- Project Structure là cách tổ chức các thư mục trong dự án.
- `src` chứa mã nguồn TypeScript.
- `dist` chứa mã JavaScript sau khi biên dịch.
- `package.json` quản lý dependencies và scripts.
- `tsconfig.json` cấu hình TypeScript Compiler.
- Một cấu trúc dự án rõ ràng giúp dễ phát triển, bảo trì và mở rộng.

---

## 📝 Quiz

### Question 1

Thư mục nào thường chứa mã nguồn TypeScript?

A.

```text
dist
```

B.

```text
src
```

C.

```text
node_modules
```

D.

```text
config
```

**Answer: B**

**Giải thích:** `src` là quy ước cho mã nguồn. Tách riêng khỏi thư mục đầu ra giúp việc dọn dẹp trở nên an toàn: xoá sạch thư mục build không bao giờ chạm vào code.

---

### Question 2

Thư mục nào chứa các file JavaScript sau khi biên dịch?

A.

```text
src
```

B.

```text
controllers
```

C.

```text
dist
```

D.

```text
utils
```

**Answer: C**

**Giải thích:** `dist` chứa JavaScript do `tsc` sinh ra, đúng theo `outDir` trong `tsconfig.json`. Thư mục này phải nằm trong `.gitignore` vì nó là sản phẩm dựng lại được, không phải mã nguồn.
