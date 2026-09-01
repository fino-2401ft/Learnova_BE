---
id: node-m4-l1
course: Node.js
module: Stream & Buffer
title: Buffer
order: 1
difficulty: Beginner
estimatedTime: 45
---
# Buffer

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Buffer là gì.
- Biết tại sao Node.js sử dụng Buffer.
- Tạo và thao tác với Buffer.
- Chuyển đổi giữa String và Buffer.
- Hiểu một số phương thức phổ biến của Buffer.
- Áp dụng Buffer trong các ứng dụng Node.js.

---

## 📖 Definition

**Buffer** là một đối tượng (Object) của Node.js dùng để lưu trữ dữ liệu nhị phân (Binary Data).

Trong JavaScript, dữ liệu thường được xử lý dưới dạng chuỗi (String) hoặc đối tượng (Object). Tuy nhiên, khi làm việc với:

- File
- Hình ảnh
- Âm thanh
- Video
- Socket
- Stream

dữ liệu được truyền dưới dạng **byte**, và Buffer được sử dụng để lưu trữ những byte đó.

Buffer được cấp phát trực tiếp trong bộ nhớ ngoài V8 Heap nên có hiệu suất rất cao.

---

## 💻 Syntax

### Tạo Buffer từ String

```javascript
const buffer = Buffer.from("Hello");
```

---

### Tạo Buffer với kích thước cố định

```javascript
const buffer = Buffer.alloc(10);
```

---

### Chuyển Buffer thành String

```javascript
buffer.toString();
```

---

## 📝 Example 1 - Tạo Buffer từ String

```javascript
const buffer = Buffer.from("Hello");

console.log(buffer);
```

Output

```text
<Buffer 48 65 6c 6c 6f>
```

### Giải thích

Mỗi ký tự được lưu dưới dạng mã ASCII hoặc UTF-8.

---

## 📝 Example 2 - Chuyển Buffer thành String

```javascript
const buffer = Buffer.from("Node.js");

console.log(buffer.toString());
```

Output

```text
Node.js
```

### Giải thích

`toString()` chuyển dữ liệu nhị phân trở lại chuỗi.

---

## 📝 Example 3 - Buffer.alloc()

```javascript
const buffer = Buffer.alloc(5);

console.log(buffer);
```

Output

```text
<Buffer 00 00 00 00 00>
```

### Giải thích

`Buffer.alloc()` tạo Buffer với kích thước xác định và khởi tạo tất cả byte bằng `0`.

---

## 📝 Example 4 - Ghi dữ liệu vào Buffer

```javascript
const buffer = Buffer.alloc(10);

buffer.write("Node");

console.log(buffer.toString());
```

Output

```text
Node
```

### Giải thích

`write()` ghi dữ liệu chuỗi vào Buffer.

---

## ⚠️ Notes

### 1. Buffer.from()

```javascript
Buffer.from("Hello");
```

Tạo Buffer từ:

- String
- Array
- ArrayBuffer

---

### 2. Buffer.alloc()

```javascript
Buffer.alloc(20);
```

Tạo Buffer với kích thước cố định.

Các byte được khởi tạo bằng `0`.

---

### 3. Buffer.byteLength()

```javascript
Buffer.byteLength("Hello");
```

Output

```text
5
```

Trả về số byte của dữ liệu.

---

### 4. Buffer.toString()

```javascript
buffer.toString();
```

Chuyển Buffer thành chuỗi.

---

### 5. Encoding

Mặc định Buffer sử dụng:

```text
utf8
```

Ngoài ra còn hỗ trợ:

- ascii
- base64
- hex
- utf16le

Ví dụ:

```javascript
Buffer.from("Hello", "utf8");
```

---

## 🌍 Real World Example

Đọc một file ảnh:

```javascript
const fs = require("fs");

const image = fs.readFileSync("logo.png");

console.log(image);
```

Output

```text
<Buffer 89 50 4e 47 ...>
```

`image` là một Buffer chứa toàn bộ dữ liệu nhị phân của file.

Buffer cũng được sử dụng khi:

- Upload file.
- Download file.
- Truyền dữ liệu qua TCP Socket.
- Đọc và ghi Stream.
- Mã hóa dữ liệu.

---

## ❌ Common Mistakes

### Sai 1 - Nghĩ Buffer là String

Sai

```javascript
const buffer = Buffer.from("Hello");

console.log(buffer + " World");
```

Buffer không phải là chuỗi.

Muốn nối chuỗi cần chuyển sang String trước.

```javascript
console.log(buffer.toString() + " World");
```

---

### Sai 2 - Dùng allocUnsafe() khi không cần

Sai

```javascript
Buffer.allocUnsafe(100);
```

`allocUnsafe()` nhanh hơn nhưng vùng nhớ chưa được khởi tạo.

Trong hầu hết trường hợp nên dùng:

```javascript
Buffer.alloc(100);
```

---

### Sai 3 - Quên Encoding

Sai

```javascript
buffer.toString();
```

Nếu dữ liệu không phải UTF-8 có thể cho kết quả sai.

Có thể chỉ định encoding:

```javascript
buffer.toString("base64");
```

---

### Sai 4 - Nhầm số ký tự với số byte

Ví dụ:

```javascript
Buffer.byteLength("Xin chào");
```

Số byte có thể lớn hơn số ký tự vì UTF-8 sử dụng nhiều byte cho các ký tự có dấu.

---

## 📚 Summary

- Buffer dùng để lưu trữ dữ liệu nhị phân.
- `Buffer.from()` tạo Buffer từ String hoặc Array.
- `Buffer.alloc()` tạo Buffer với kích thước cố định.
- `toString()` chuyển Buffer thành String.
- Buffer được sử dụng trong File System, Stream, Network và các ứng dụng xử lý dữ liệu nhị phân.

---

## 📝 Quiz

### Question 1

Buffer được sử dụng để lưu trữ loại dữ liệu nào?

A.

```text
JSON
```

B.

```text
Binary Data
```

C.

```text
HTML
```

D.

```text
CSS
```

**Answer: B**

**Giải thích:** Buffer là vùng nhớ thô để chứa dữ liệu nhị phân — ảnh, video, tệp nén. Nó tồn tại vì chuỗi JavaScript được thiết kế cho văn bản và sẽ làm hỏng dữ liệu nhị phân khi mã hoá lại.


---

### Question 2

Phương thức nào dùng để tạo Buffer từ một chuỗi?

A.

```javascript
Buffer.alloc()
```

B.

```javascript
Buffer.from()
```

C.

```javascript
Buffer.create()
```

D.

```javascript
Buffer.new()
```

**Answer: B**

**Giải thích:** `Buffer.from()` tạo buffer từ dữ liệu có sẵn (chuỗi, mảng, buffer khác). `Buffer.alloc()` thì cấp phát vùng nhớ trống có kích thước cho trước. Đừng dùng `Buffer.allocUnsafe()` nếu chưa hiểu rõ: nó nhanh hơn nhưng trả về vùng nhớ chưa xoá, có thể còn dữ liệu cũ của tiến trình.

