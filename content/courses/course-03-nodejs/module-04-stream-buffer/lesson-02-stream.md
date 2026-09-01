---
id: node-m4-l2
course: Node.js
module: Stream & Buffer
title: Stream
order: 2
difficulty: Beginner
estimatedTime: 50
---
# Stream

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Stream là gì.
- Biết các loại Stream trong Node.js.
- Đọc dữ liệu bằng Readable Stream.
- Ghi dữ liệu bằng Writable Stream.
- Hiểu ưu điểm của Stream so với việc đọc toàn bộ dữ liệu.
- Áp dụng Stream trong các ứng dụng Node.js.

---

## 📖 Definition

**Stream** là cơ chế xử lý dữ liệu theo từng phần nhỏ (**chunk**) thay vì tải toàn bộ dữ liệu vào bộ nhớ.

Điều này giúp:

- Tiết kiệm RAM.
- Tăng hiệu suất.
- Xử lý được các tệp có kích thước lớn.
- Phù hợp với dữ liệu truyền qua mạng.

Node.js sử dụng Stream rất nhiều trong:

- File System.
- HTTP.
- Upload/Download file.
- Video Streaming.
- Network.

---

## 💻 Syntax

### Tạo Readable Stream

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("data.txt");
```

---

### Tạo Writable Stream

```javascript
const fs = require("fs");

const writeStream = fs.createWriteStream("output.txt");
```

---

### Lắng nghe sự kiện data

```javascript
readStream.on("data", (chunk) => {

    console.log(chunk);

});
```

---

## 📝 Example 1 - Đọc file bằng Stream

Giả sử file `message.txt`

```text
Hello Node.js Stream
```

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("message.txt", "utf8");

readStream.on("data", (chunk) => {

    console.log(chunk);

});
```

Output

```text
Hello Node.js Stream
```

### Giải thích

Dữ liệu được đọc từng chunk thay vì đọc toàn bộ file một lần.

---

## 📝 Example 2 - Ghi dữ liệu bằng Stream

```javascript
const fs = require("fs");

const writeStream = fs.createWriteStream("output.txt");

writeStream.write("Hello ");

writeStream.write("Node.js");

writeStream.end();
```

File `output.txt`

```text
Hello Node.js
```

### Giải thích

`write()` ghi dữ liệu vào Stream.

`end()` kết thúc quá trình ghi.

---

## 📝 Example 3 - Theo dõi sự kiện kết thúc

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("message.txt", "utf8");

readStream.on("end", () => {

    console.log("Finished reading.");

});
```

Output

```text
Finished reading.
```

### Giải thích

Sự kiện `end` được phát khi toàn bộ dữ liệu đã được đọc.

---

## ⚠️ Notes

### 1. Bốn loại Stream

Node.js có bốn loại Stream:

```text
Readable Stream
```

Chỉ đọc dữ liệu.

Ví dụ:

- File đọc.
- HTTP Request.

---

```text
Writable Stream
```

Chỉ ghi dữ liệu.

Ví dụ:

- Ghi file.
- HTTP Response.

---

```text
Duplex Stream
```

Có thể vừa đọc vừa ghi.

Ví dụ:

- TCP Socket.

---

```text
Transform Stream
```

Đọc dữ liệu, xử lý rồi ghi ra dữ liệu mới.

Ví dụ:

- Nén dữ liệu.
- Mã hóa dữ liệu.

---

### 2. Chunk

Stream xử lý dữ liệu theo từng phần nhỏ.

Ví dụ:

```text
File 1GB
```

↓

```text
Chunk 1

Chunk 2

Chunk 3

...
```

Điều này giúp không cần tải toàn bộ file vào RAM.

---

### 3. Sự kiện data

```javascript
readStream.on("data", (chunk) => {

});
```

Được gọi mỗi khi có một chunk dữ liệu mới.

---

### 4. Sự kiện end

```javascript
readStream.on("end", () => {

});
```

Được gọi khi đã đọc hết dữ liệu.

---

### 5. Sự kiện error

```javascript
readStream.on("error", (err) => {

    console.log(err);

});
```

Nên luôn xử lý lỗi khi làm việc với Stream.

---

## 🌍 Real World Example

Đọc một file video lớn:

```javascript
const fs = require("fs");

const stream = fs.createReadStream("movie.mp4");

stream.on("data", (chunk) => {

    console.log(chunk.length);

});
```

Thay vì đọc toàn bộ file vài GB vào RAM, Stream chỉ đọc từng chunk.

Ứng dụng thực tế:

- Video Streaming.
- Upload file.
- Download file.
- Đọc log hệ thống.
- Truyền dữ liệu qua mạng.

---

## ❌ Common Mistakes

### Sai 1 - Đọc file lớn bằng readFile()

Sai

```javascript
fs.readFile("movie.mp4", ...);
```

Điều này có thể tiêu tốn rất nhiều bộ nhớ.

Đúng

```javascript
fs.createReadStream("movie.mp4");
```

---

### Sai 2 - Quên gọi end()

Sai

```javascript
writeStream.write("Hello");
```

Nếu không gọi:

```javascript
writeStream.end();
```

quá trình ghi sẽ chưa kết thúc.

---

### Sai 3 - Không xử lý lỗi

Sai

```javascript
readStream.on("data", (chunk) => {

});
```

Đúng

```javascript
readStream.on("error", (err) => {

    console.log(err);

});
```

---

### Sai 4 - Nhầm Stream với Buffer

- **Buffer** lưu dữ liệu trong bộ nhớ.
- **Stream** xử lý dữ liệu theo từng chunk.

Thông thường, Stream sử dụng Buffer để lưu trữ từng chunk trong quá trình đọc hoặc ghi.

---

## 📚 Summary

- Stream giúp xử lý dữ liệu theo từng phần nhỏ.
- Có bốn loại Stream:
  - Readable
  - Writable
  - Duplex
  - Transform
- `createReadStream()` tạo Readable Stream.
- `createWriteStream()` tạo Writable Stream.
- Stream giúp tiết kiệm bộ nhớ và tăng hiệu suất khi xử lý dữ liệu lớn.

---

## 📝 Quiz

### Question 1

Ưu điểm lớn nhất của Stream là gì?

A.

```text
Làm chương trình chạy chậm hơn
```

B.

```text
Đọc toàn bộ dữ liệu vào RAM
```

C.

```text
Xử lý dữ liệu theo từng chunk để tiết kiệm bộ nhớ
```

D.

```text
Chỉ hoạt động với file văn bản
```

**Answer: C**

**Giải thích:** Stream xử lý dữ liệu theo từng khối nhỏ thay vì nạp hết vào RAM. Khác biệt cụ thể: đọc một tệp 2GB bằng `readFile` cần 2GB bộ nhớ và có thể làm tiến trình chết; đọc bằng stream chỉ giữ vài chục kilobyte tại một thời điểm.


---

### Question 2

Phương thức nào dùng để tạo Readable Stream từ một tệp?

A.

```javascript
fs.readFile()
```

B.

```javascript
fs.createReadStream()
```

C.

```javascript
fs.open()
```

D.

```javascript
fs.stream()
```

**Answer: B**

**Giải thích:** `fs.createReadStream()` trả về Readable Stream để đọc dần. `fs.readFile()` cũng đọc tệp nhưng nạp toàn bộ vào bộ nhớ rồi mới gọi callback — đúng thứ mà stream sinh ra để tránh.

