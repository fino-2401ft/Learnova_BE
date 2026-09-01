---
id: node-m4-l3
course: Node.js
module: Stream & Buffer
title: Pipe
order: 3
difficulty: Beginner
estimatedTime: 40
---
# Pipe

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Pipe là gì.
- Biết cách kết nối Readable Stream và Writable Stream.
- Sử dụng `pipe()` để sao chép dữ liệu.
- Hiểu ưu điểm của Pipe so với việc đọc và ghi thủ công.
- Áp dụng Pipe trong các ứng dụng Node.js.

---

## 📖 Definition

**Pipe** là một phương thức của Stream trong Node.js dùng để **chuyển dữ liệu trực tiếp từ Readable Stream sang Writable Stream**.

Thay vì phải:

- Đọc từng chunk.
- Ghi từng chunk.

`pipe()` sẽ tự động thực hiện toàn bộ quá trình này.

Pipe giúp:

- Viết mã ngắn gọn.
- Tiết kiệm bộ nhớ.
- Tự động quản lý luồng dữ liệu (Flow Control).
- Tăng hiệu suất khi xử lý các tệp lớn.

---

## 💻 Syntax

### Cú pháp

```javascript
readableStream.pipe(writableStream);
```

---

### Ví dụ

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("input.txt");

const writeStream = fs.createWriteStream("output.txt");

readStream.pipe(writeStream);
```

---

## 📝 Example 1 - Sao chép file

Giả sử file `input.txt`

```text
Hello Node.js
```

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("input.txt");

const writeStream = fs.createWriteStream("output.txt");

readStream.pipe(writeStream);
```

Kết quả

```text
output.txt

Hello Node.js
```

### Giải thích

`pipe()` tự động đọc dữ liệu từ `input.txt` và ghi vào `output.txt`.

---

## 📝 Example 2 - Hiển thị khi hoàn thành

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("input.txt");

const writeStream = fs.createWriteStream("output.txt");

readStream.pipe(writeStream);

writeStream.on("finish", () => {

    console.log("Copy completed.");

});
```

Output

```text
Copy completed.
```

### Giải thích

Sự kiện `finish` được phát khi Writable Stream ghi xong toàn bộ dữ liệu.

---

## 📝 Example 3 - Xử lý lỗi

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("input.txt");

const writeStream = fs.createWriteStream("output.txt");

readStream.pipe(writeStream);

readStream.on("error", (err) => {

    console.log(err);

});

writeStream.on("error", (err) => {

    console.log(err);

});
```

### Giải thích

Luôn xử lý lỗi cho cả Readable Stream và Writable Stream để tránh chương trình bị dừng khi xảy ra sự cố.

---

## ⚠️ Notes

### 1. pipe()

```javascript
readStream.pipe(writeStream);
```

Kết nối một Readable Stream với một Writable Stream.

---

### 2. Flow Control

`pipe()` tự động điều chỉnh tốc độ truyền dữ liệu.

Nếu Writable Stream ghi chậm hơn tốc độ đọc, Node.js sẽ tạm dừng Readable Stream và tiếp tục khi Writable Stream sẵn sàng.

Điều này giúp tránh tiêu tốn quá nhiều bộ nhớ.

---

### 3. Chuỗi Pipe

Có thể kết nối nhiều Stream liên tiếp.

```javascript
readable
    .pipe(transform)
    .pipe(writable);
```

Ví dụ:

```text
Read File

↓

Compress

↓

Write File
```

---

### 4. finish Event

```javascript
writeStream.on("finish", () => {

});
```

Được gọi khi toàn bộ dữ liệu đã được ghi thành công.

---

### 5. error Event

```javascript
readStream.on("error", handler);

writeStream.on("error", handler);
```

Luôn nên xử lý lỗi để ứng dụng hoạt động ổn định.

---

## 🌍 Real World Example

Sao chép một video lớn:

```javascript
const fs = require("fs");

const source = fs.createReadStream("movie.mp4");

const destination = fs.createWriteStream("backup.mp4");

source.pipe(destination);

destination.on("finish", () => {

    console.log("Backup completed.");

});
```

Thay vì đọc toàn bộ file vào RAM, dữ liệu sẽ được truyền từng chunk từ file nguồn sang file đích.

Pipe được sử dụng trong:

- Upload file.
- Download file.
- Sao chép file.
- Video Streaming.
- Nén và giải nén dữ liệu.
- Truyền dữ liệu qua mạng.

---

## ❌ Common Mistakes

### Sai 1 - Đọc và ghi thủ công

Sai

```javascript
readStream.on("data", (chunk) => {

    writeStream.write(chunk);

});
```

Đúng

```javascript
readStream.pipe(writeStream);
```

`pipe()` giúp mã ngắn gọn và tự động quản lý luồng dữ liệu.

---

### Sai 2 - Không xử lý lỗi

Sai

```javascript
readStream.pipe(writeStream);
```

Đúng

```javascript
readStream.on("error", console.error);

writeStream.on("error", console.error);
```

---

### Sai 3 - Nhầm pipe() với Stream

`pipe()` không phải là Stream.

Đây là phương thức dùng để kết nối các Stream với nhau.

---

### Sai 4 - Pipe giữa hai Stream không tương thích

Sai

```javascript
writable.pipe(readable);
```

Chỉ có **Readable Stream** mới có thể gọi `pipe()` để ghi dữ liệu sang **Writable Stream**.

---

## 📚 Summary

- `pipe()` dùng để kết nối Readable Stream với Writable Stream.
- Pipe giúp truyền dữ liệu theo từng chunk mà không cần đọc toàn bộ vào bộ nhớ.
- `pipe()` tự động quản lý Flow Control.
- Có thể kết nối nhiều Stream liên tiếp bằng Pipe.
- Pipe được sử dụng phổ biến trong xử lý file, video streaming và truyền dữ liệu.

---

## 📝 Quiz

### Question 1

Phương thức nào dùng để kết nối Readable Stream với Writable Stream?

A.

```javascript
connect()
```

B.

```javascript
stream()
```

C.

```javascript
pipe()
```

D.

```javascript
write()
```

**Answer: C**

**Giải thích:** `pipe()` nối đầu ra của Readable Stream vào đầu vào của Writable Stream, đọc tới đâu ghi tới đó. Tên gọi lấy từ toán tử `|` của shell, và ý tưởng cũng y hệt.


---

### Question 2

Lợi ích chính của `pipe()` là gì?

A.

```text
Đọc toàn bộ dữ liệu vào RAM trước khi ghi
```

B.

```text
Tự động truyền dữ liệu giữa các Stream và quản lý Flow Control
```

C.

```text
Chỉ hoạt động với file văn bản
```

D.

```text
Tăng kích thước của Buffer
```

**Answer: B**

**Giải thích:** Lợi ích lớn nhất là **flow control** (backpressure): khi bên ghi xử lý chậm hơn bên đọc, `pipe()` tự tạm dừng bên đọc rồi cho chạy lại. Tự viết bằng `on('data')` và `write()` mà bỏ qua điều này thì dữ liệu dồn vào bộ nhớ cho tới khi tiến trình hết RAM.

