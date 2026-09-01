---
id: node-m2-l2
course: Node.js
module: Core Modules
title: Path
order: 2
difficulty: Beginner
estimatedTime: 35
---
# Path

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu vai trò của Path Module.
- Biết cách làm việc với đường dẫn trong Node.js.
- Sử dụng các hàm phổ biến của `path`.
- Phân biệt đường dẫn tuyệt đối (Absolute Path) và đường dẫn tương đối (Relative Path).
- Áp dụng Path Module trong các dự án thực tế.

---

## 📖 Definition

**Path** là một Core Module của Node.js dùng để làm việc với đường dẫn của tệp (file) và thư mục (directory).

Module `path` giúp:

- Ghép đường dẫn.
- Lấy tên file.
- Lấy phần mở rộng của file.
- Lấy tên thư mục.
- Chuẩn hóa đường dẫn.

Việc sử dụng `path` giúp chương trình hoạt động ổn định trên nhiều hệ điều hành như Windows, Linux và macOS.

---

## 💻 Syntax

### Import Path Module

```javascript
const path = require("path");
```

---

### Ghép đường dẫn

```javascript
path.join("src", "images", "logo.png");
```

---

### Lấy tên file

```javascript
path.basename("images/logo.png");
```

---

## 📝 Example 1 - path.join()

```javascript
const path = require("path");

const filePath = path.join("src", "assets", "logo.png");

console.log(filePath);
```

Output (Windows)

```text
src\assets\logo.png
```

Output (Linux/macOS)

```text
src/assets/logo.png
```

### Giải thích

`path.join()` tự động sử dụng dấu phân cách phù hợp với hệ điều hành.

---

## 📝 Example 2 - path.basename()

```javascript
const path = require("path");

const fileName = path.basename("/images/photo.jpg");

console.log(fileName);
```

Output

```text
photo.jpg
```

### Giải thích

`basename()` trả về tên của file từ một đường dẫn.

---

## 📝 Example 3 - path.extname()

```javascript
const path = require("path");

const extension = path.extname("document.pdf");

console.log(extension);
```

Output

```text
.pdf
```

### Giải thích

`extname()` trả về phần mở rộng của file.

---

## ⚠️ Notes

### 1. path.join()

```javascript
path.join("folder", "file.txt");
```

Ghép nhiều phần của đường dẫn thành một đường dẫn hoàn chỉnh.

---

### 2. path.basename()

```javascript
path.basename("images/logo.png");
```

Trả về tên file.

---

### 3. path.dirname()

```javascript
path.dirname("images/logo.png");
```

Output

```text
images
```

Trả về tên thư mục chứa file.

---

### 4. path.extname()

```javascript
path.extname("index.html");
```

Output

```text
.html
```

Trả về phần mở rộng của file.

---

### 5. path.resolve()

```javascript
path.resolve("src", "app.js");
```

Trả về đường dẫn tuyệt đối dựa trên thư mục hiện tại.

---

## 🌍 Real World Example

Giả sử một dự án có cấu trúc:

```text
project/

├── src/

│   ├── app.js

│   └── uploads/

│       └── avatar.png
```

Trong `app.js`

```javascript
const path = require("path");

const uploadPath = path.join(__dirname, "uploads", "avatar.png");

console.log(uploadPath);
```

Output (ví dụ)

```text
C:\project\src\uploads\avatar.png
```

Việc sử dụng `path.join()` giúp chương trình hoạt động đúng trên mọi hệ điều hành mà không cần quan tâm đến dấu `/` hay `\`.

---

## ❌ Common Mistakes

### Sai 1 - Ghép đường dẫn bằng chuỗi

Sai

```javascript
const file = "src/" + "images/" + "logo.png";
```

Đúng

```javascript
const file = path.join("src", "images", "logo.png");
```

---

### Sai 2 - Hard-code dấu `/`

Sai

```javascript
const file = "src/images/file.txt";
```

Trên Windows, dấu phân cách là `\`.

Nên sử dụng `path.join()` để đảm bảo tính tương thích.

---

### Sai 3 - Nhầm basename() với dirname()

```javascript
path.basename("images/photo.png");
```

Output

```text
photo.png
```

```javascript
path.dirname("images/photo.png");
```

Output

```text
images
```

---

### Sai 4 - Nhầm extname()

Sai

```javascript
path.extname("README");
```

Output

```text
""
```

Do file không có phần mở rộng.

---

## 📚 Summary

- `path` là Core Module dùng để xử lý đường dẫn.
- `path.join()` ghép nhiều phần của đường dẫn.
- `path.basename()` lấy tên file.
- `path.dirname()` lấy tên thư mục.
- `path.extname()` lấy phần mở rộng của file.
- `path.resolve()` tạo đường dẫn tuyệt đối.
- Nên sử dụng `path` thay vì ghép chuỗi thủ công để đảm bảo tính tương thích giữa các hệ điều hành.

---

## 📝 Quiz

### Question 1

Module nào được dùng để xử lý đường dẫn trong Node.js?

A.

```text
fs
```

B.

```text
http
```

C.

```text
path
```

D.

```text
os
```

**Answer: C**

**Giải thích:** `path` xử lý đường dẫn theo đúng quy ước của hệ điều hành đang chạy. Cần nó vì Windows dùng `\` còn Linux và macOS dùng `/` — tự nối chuỗi là code chạy được trên máy mình nhưng hỏng trên server.


---

### Question 2

Phương thức nào dùng để ghép nhiều phần của đường dẫn?

A.

```javascript
path.basename()
```

B.

```javascript
path.dirname()
```

C.

```javascript
path.extname()
```

D.

```javascript
path.join()
```

**Answer: D**

**Giải thích:** `path.join()` ghép các phần lại và tự chọn dấu phân cách đúng, đồng thời chuẩn hoá `..` và `.`. Ba phương án còn lại làm việc ngược lại: chúng **tách** thông tin ra khỏi một đường dẫn có sẵn.

