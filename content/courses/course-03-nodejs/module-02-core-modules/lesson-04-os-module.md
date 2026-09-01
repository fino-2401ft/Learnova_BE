---
id: node-m2-l4
course: Node.js
module: Core Modules
title: OS Module
order: 4
difficulty: Beginner
estimatedTime: 30
---
# OS Module

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu OS Module là gì.
- Lấy thông tin về hệ điều hành.
- Kiểm tra kiến trúc CPU và nền tảng hệ điều hành.
- Lấy thông tin về bộ nhớ.
- Biết một số hàm phổ biến của OS Module.
- Áp dụng OS Module trong các ứng dụng Node.js.

---

## 📖 Definition

**OS Module** là một Core Module của Node.js dùng để lấy thông tin về hệ điều hành đang chạy chương trình.

Module `os` cung cấp nhiều hàm hữu ích như:

- Lấy tên hệ điều hành.
- Kiểm tra kiến trúc CPU.
- Xem dung lượng bộ nhớ.
- Lấy thư mục Home của người dùng.
- Lấy thông tin CPU.

OS Module thường được sử dụng trong các ứng dụng cần thu thập thông tin môi trường hoặc kiểm tra cấu hình máy chủ.

---

## 💻 Syntax

### Import OS Module

```javascript
const os = require("os");
```

---

### Lấy tên hệ điều hành

```javascript
console.log(os.platform());
```

---

### Lấy kiến trúc CPU

```javascript
console.log(os.arch());
```

---

## 📝 Example 1 - Thông tin hệ điều hành

```javascript
const os = require("os");

console.log(os.platform());

console.log(os.type());

console.log(os.release());
```

Output (ví dụ)

```text
win32

Windows_NT

10.0.26100
```

### Giải thích

- `platform()` trả về nền tảng của hệ điều hành.
- `type()` trả về tên hệ điều hành.
- `release()` trả về phiên bản của hệ điều hành.

---

## 📝 Example 2 - Thông tin bộ nhớ

```javascript
const os = require("os");

console.log(os.totalmem());

console.log(os.freemem());
```

Output (ví dụ)

```text
17071734784

8254128128
```

### Giải thích

- `totalmem()` trả về tổng dung lượng RAM (bytes).
- `freemem()` trả về dung lượng RAM còn trống (bytes).

Có thể chuyển đổi sang GB:

```javascript
const totalGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

console.log(totalGB + " GB");
```

---

## 📝 Example 3 - Thông tin CPU

```javascript
const os = require("os");

console.log(os.cpus().length);

console.log(os.arch());
```

Output (ví dụ)

```text
8

x64
```

### Giải thích

- `cpus()` trả về danh sách các lõi CPU.
- `cpus().length` cho biết số lượng lõi CPU.
- `arch()` trả về kiến trúc của CPU.

---

## ⚠️ Notes

### 1. os.platform()

```javascript
os.platform();
```

Một số kết quả phổ biến:

```text
win32

linux

darwin
```

- `win32`: Windows
- `linux`: Linux
- `darwin`: macOS

---

### 2. os.arch()

```javascript
os.arch();
```

Một số giá trị:

```text
x64

arm64
```

Cho biết kiến trúc của CPU.

---

### 3. os.hostname()

```javascript
os.hostname();
```

Trả về tên của máy tính.

---

### 4. os.homedir()

```javascript
os.homedir();
```

Trả về đường dẫn tới thư mục Home của người dùng.

Ví dụ

```text
C:\Users\Admin
```

---

### 5. os.uptime()

```javascript
os.uptime();
```

Trả về thời gian hệ điều hành đã hoạt động (tính bằng giây).

---

## 🌍 Real World Example

Một ứng dụng quản trị hệ thống có thể hiển thị thông tin máy chủ:

```javascript
const os = require("os");

console.log("Platform:", os.platform());

console.log("CPU:", os.cpus().length);

console.log("Architecture:", os.arch());

console.log("Free Memory:", os.freemem());

console.log("Home Directory:", os.homedir());
```

Output (ví dụ)

```text
Platform: win32

CPU: 8

Architecture: x64

Free Memory: 8254128128

Home Directory: C:\Users\Admin
```

Thông tin này thường được sử dụng trong:

- Dashboard quản trị hệ thống.
- Công cụ giám sát máy chủ.
- Ứng dụng CLI.
- Kiểm tra môi trường trước khi cài đặt phần mềm.

---

## ❌ Common Mistakes

### Sai 1 - Nghĩ os có thể thay đổi hệ điều hành

Sai

```javascript
os.platform();
```

OS Module chỉ đọc thông tin của hệ điều hành, không thể thay đổi cấu hình hệ thống.

---

### Sai 2 - Nhầm totalmem() với freemem()

```javascript
os.totalmem();
```

Trả về tổng dung lượng RAM.

```javascript
os.freemem();
```

Trả về dung lượng RAM còn trống.

---

### Sai 3 - Quên import Module

Sai

```javascript
console.log(os.platform());
```

Đúng

```javascript
const os = require("os");
```

---

### Sai 4 - Hiển thị trực tiếp giá trị bộ nhớ

Sai

```javascript
console.log(os.totalmem());
```

Kết quả là số byte rất lớn.

Nên chuyển đổi sang MB hoặc GB để dễ đọc.

---

## 📚 Summary

- `os` là Core Module dùng để lấy thông tin hệ điều hành.
- `os.platform()` trả về nền tảng của hệ điều hành.
- `os.arch()` trả về kiến trúc CPU.
- `os.totalmem()` trả về tổng dung lượng RAM.
- `os.freemem()` trả về dung lượng RAM còn trống.
- `os.hostname()` và `os.homedir()` cung cấp thông tin về máy tính và người dùng.

---

## 📝 Quiz

### Question 1

Module nào dùng để lấy thông tin hệ điều hành trong Node.js?

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
os
```

D.

```text
fs
```

**Answer: C**

**Giải thích:** `os` cung cấp thông tin về máy đang chạy: hệ điều hành, số nhân CPU, dung lượng RAM, thư mục tạm. Thường dùng để điều chỉnh cấu hình theo phần cứng, ví dụ số worker bằng số nhân CPU.


---

### Question 2

Phương thức nào trả về tổng dung lượng RAM của hệ thống?

A.

```javascript
os.freemem()
```

B.

```javascript
os.totalmem()
```

C.

```javascript
os.memory()
```

D.

```javascript
os.ram()
```

**Answer: B**

**Giải thích:** `os.totalmem()` trả về tổng RAM lắp trên máy, còn `os.freemem()` trả về phần đang trống. Cả hai đều tính bằng **byte**, nên muốn ra gigabyte phải chia cho 1024 ba lần.

