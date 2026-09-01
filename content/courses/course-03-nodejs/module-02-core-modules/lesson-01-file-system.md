---
id: node-m2-l1
course: Node.js
module: Core Modules
title: File System
order: 1
difficulty: Beginner
estimatedTime: 45
---
# File System

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu File System (`fs`) Module là gì.
- Đọc nội dung của một tệp.
- Ghi dữ liệu vào tệp.
- Tạo và xóa tệp.
- Phân biệt phương thức đồng bộ (Sync) và bất đồng bộ (Async).
- Áp dụng File System trong các ứng dụng Node.js.

---

## 📖 Definition

**File System (fs)** là một Core Module của Node.js cho phép chương trình làm việc với hệ thống tệp của máy tính.

Module `fs` hỗ trợ:

- Đọc tệp.
- Ghi tệp.
- Tạo tệp.
- Xóa tệp.
- Đổi tên tệp.
- Làm việc với thư mục.

Đây là một trong những module được sử dụng nhiều nhất trong các ứng dụng Node.js.

---

## 💻 Syntax

### Import File System Module

```javascript
const fs = require("fs");
```

---

### Đọc tệp bất đồng bộ

```javascript
fs.readFile("hello.txt", "utf8", (err, data) => {

    if (err) {
        console.log(err);
        return;
    }

    console.log(data);

});
```

---

### Ghi tệp

```javascript
fs.writeFile("hello.txt", "Hello Node.js", (err) => {

    if (err) {
        console.log(err);
        return;
    }

    console.log("Write successful");

});
```

---

## 📝 Example 1 - Đọc tệp

Giả sử file `message.txt`

```text
Welcome to Node.js
```

```javascript
const fs = require("fs");

fs.readFile("message.txt", "utf8", (err, data) => {

    if (err) {
        console.log(err);
        return;
    }

    console.log(data);

});
```

Output

```text
Welcome to Node.js
```

### Giải thích

`readFile()` đọc toàn bộ nội dung của tệp theo cách bất đồng bộ.

---

## 📝 Example 2 - Ghi tệp

```javascript
const fs = require("fs");

fs.writeFile("note.txt", "Learning Node.js", (err) => {

    if (err) {
        console.log(err);
        return;
    }

    console.log("File created.");

});
```

Output

```text
File created.
```

### Giải thích

Nếu tệp chưa tồn tại, Node.js sẽ tự động tạo mới.

Nếu tệp đã tồn tại, nội dung cũ sẽ bị ghi đè.

---

## 📝 Example 3 - Đọc tệp đồng bộ

```javascript
const fs = require("fs");

const data = fs.readFileSync("message.txt", "utf8");

console.log(data);
```

Output

```text
Welcome to Node.js
```

### Giải thích

`readFileSync()` sẽ chờ đọc xong tệp rồi mới thực hiện các lệnh tiếp theo.

Phương thức này đơn giản nhưng có thể làm chương trình bị chặn (blocking).

---

## ⚠️ Notes

### 1. readFile()

```javascript
fs.readFile(path, encoding, callback);
```

Đọc tệp theo cách bất đồng bộ.

Đây là phương thức được khuyến nghị trong hầu hết các ứng dụng Node.js.

---

### 2. writeFile()

```javascript
fs.writeFile(path, data, callback);
```

Ghi dữ liệu vào tệp.

Nếu tệp chưa tồn tại, Node.js sẽ tạo mới.

---

### 3. readFileSync()

```javascript
fs.readFileSync(path, encoding);
```

Đọc tệp theo cách đồng bộ.

Chương trình sẽ dừng cho đến khi việc đọc hoàn thành.

---

### 4. Sync và Async

**Sync**

```javascript
const data = fs.readFileSync(...);
```

- Dễ hiểu.
- Blocking.

**Async**

```javascript
fs.readFile(...);
```

- Non-blocking.
- Hiệu quả hơn khi xử lý nhiều yêu cầu.

---

### 5. Xử lý lỗi

Luôn kiểm tra đối tượng `err` trong callback.

```javascript
if (err) {
    console.log(err);
    return;
}
```

Điều này giúp tránh chương trình bị dừng khi xảy ra lỗi.

---

## 🌍 Real World Example

Một API đọc dữ liệu từ tệp JSON:

```javascript
const fs = require("fs");

fs.readFile("users.json", "utf8", (err, data) => {

    if (err) {
        console.log(err);
        return;
    }

    const users = JSON.parse(data);

    console.log(users);

});
```

Ứng dụng thực tế:

- Đọc file cấu hình.
- Lưu log hệ thống.
- Đọc dữ liệu JSON.
- Xuất báo cáo.
- Upload và quản lý tệp.

---

## ❌ Common Mistakes

### Sai 1 - Quên xử lý lỗi

Sai

```javascript
fs.readFile("data.txt", "utf8", (err, data) => {

    console.log(data);

});
```

Đúng

```javascript
if (err) {
    console.log(err);
    return;
}
```

---

### Sai 2 - Dùng readFileSync trong Server

Sai

```javascript
const data = fs.readFileSync("large.txt");
```

Điều này có thể làm server bị chặn khi nhiều người dùng truy cập.

---

### Sai 3 - Ghi đè dữ liệu ngoài ý muốn

```javascript
fs.writeFile(...)
```

`writeFile()` sẽ ghi đè toàn bộ nội dung tệp nếu tệp đã tồn tại.

---

### Sai 4 - Sai đường dẫn

```javascript
fs.readFile("user.txt")
```

Nếu tệp không tồn tại hoặc đường dẫn sai, Node.js sẽ báo lỗi.

Nên kiểm tra đường dẫn trước khi đọc.

---

## 📚 Summary

- `fs` là Core Module dùng để làm việc với hệ thống tệp.
- `readFile()` đọc tệp theo cách bất đồng bộ.
- `writeFile()` ghi dữ liệu vào tệp.
- `readFileSync()` đọc tệp theo cách đồng bộ.
- Luôn xử lý lỗi khi thao tác với tệp.
- Trong các ứng dụng thực tế, nên ưu tiên sử dụng các phương thức bất đồng bộ.

---

## 📝 Quiz

### Question 1

Module nào được dùng để làm việc với hệ thống tệp trong Node.js?

A.

```text
http
```

B.

```text
path
```

C.

```text
fs
```

D.

```text
os
```

**Answer: C**

**Giải thích:** `fs` là module lõi cho mọi thao tác với tệp và thư mục. Nó có sẵn trong Node nên không cần cài, chỉ cần `require('node:fs')`.


---

### Question 2

Phương thức nào đọc tệp theo cách bất đồng bộ?

A.

```javascript
fs.readFile()
```

B.

```javascript
fs.readFileSync()
```

C.

```javascript
fs.writeFile()
```

D.

```javascript
fs.unlink()
```

**Answer: A**

**Giải thích:** `fs.readFile()` nhận callback và trả quyền điều khiển lại ngay. Bản `Sync` thì **chặn** cả tiến trình cho tới khi đọc xong — trên server, điều đó nghĩa là không request nào khác được phục vụ trong khoảng thời gian ấy.

