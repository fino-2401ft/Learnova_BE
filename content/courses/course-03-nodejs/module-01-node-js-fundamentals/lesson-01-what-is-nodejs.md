---
id: node-m1-l1
course: Node.js
module: Node.js Fundamentals
title: What is Node.js?
order: 1
difficulty: Beginner
estimatedTime: 30
---
# What is Node.js?

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu Node.js là gì.
- Biết Node.js hoạt động như thế nào.
- Hiểu vai trò của V8 JavaScript Engine.
- Phân biệt Node.js với trình duyệt (Browser).
- Biết các ưu điểm và hạn chế của Node.js.
- Nhận biết các ứng dụng thực tế của Node.js.

---

## 📖 Definition

**Node.js** là một môi trường chạy (Runtime Environment) cho phép chạy mã JavaScript bên ngoài trình duyệt.

Node.js được xây dựng trên **V8 JavaScript Engine** của Google Chrome và sử dụng kiến trúc **Event-Driven** cùng **Non-blocking I/O**, giúp xử lý nhiều tác vụ đồng thời với hiệu suất cao.

Khác với JavaScript trên trình duyệt, Node.js có thể:

- Đọc và ghi file.
- Tạo Web Server.
- Kết nối cơ sở dữ liệu.
- Giao tiếp với hệ điều hành.
- Xây dựng API và Backend.

---

## 💻 Syntax

### Chạy một file Node.js

```bash
node app.js
```

---

### Ví dụ chương trình đầu tiên

```javascript
console.log("Hello Node.js");
```

Chạy chương trình:

```bash
node app.js
```

Output

```text
Hello Node.js
```

---

## 📝 Example 1 - Thực thi JavaScript bằng Node.js

```javascript
let name = "Alice";

console.log("Hello", name);
```

Output

```text
Hello Alice
```

### Giải thích

Node.js thực thi mã JavaScript giống như trình duyệt nhưng không cần mở Browser.

---

## 📝 Example 2 - Sử dụng Module có sẵn

```javascript
const os = require("os");

console.log(os.platform());
```

Output (ví dụ)

```text
win32
```

### Giải thích

Node.js cung cấp nhiều Core Module như:

- fs
- path
- http
- os

để làm việc với hệ điều hành và hệ thống tệp.

---

## 📝 Example 3 - Tạo Web Server đơn giản

```javascript
const http = require("http");

const server = http.createServer((req, res) => {

    res.end("Hello Node.js");

});

server.listen(3000);

console.log("Server running...");
```

Output

```text
Server running...
```

Sau khi mở trình duyệt:

```
http://localhost:3000
```

Kết quả:

```text
Hello Node.js
```

### Giải thích

Node.js có thể tạo Web Server mà không cần cài đặt phần mềm máy chủ như Apache hoặc Nginx.

---

## ⚠️ Notes

### 1. Node.js không phải là ngôn ngữ lập trình

Node.js sử dụng ngôn ngữ JavaScript.

JavaScript mới là ngôn ngữ lập trình.

---

### 2. Node.js là Runtime Environment

Node.js cung cấp môi trường để JavaScript có thể làm việc với:

- File System
- Network
- Database
- Process
- Operating System

---

### 3. Node.js sử dụng V8 Engine

V8 là JavaScript Engine được phát triển bởi Google.

Nó biên dịch JavaScript thành mã máy để tăng tốc độ thực thi.

---

### 4. Node.js sử dụng Event-Driven

Node.js xử lý các sự kiện (Event) thay vì thực hiện tuần tự từng tác vụ.

Điều này giúp chương trình phản hồi nhanh hơn khi xử lý nhiều kết nối.

---

### 5. Non-blocking I/O

Khi Node.js thực hiện các tác vụ như:

- Đọc file
- Gửi HTTP Request
- Truy vấn Database

Chương trình không phải chờ tác vụ hoàn thành mà có thể tiếp tục xử lý các công việc khác.

---

## 🌍 Real World Example

Node.js được sử dụng trong nhiều loại ứng dụng như:

```text
Client

        │

        ▼

Node.js Server

        │

 ┌──────┴──────┐

 ▼             ▼

Database     File System

        │

        ▼

Response
```

Một số ứng dụng phổ biến:

- RESTful API
- Chat Application
- Real-time Dashboard
- Online Game Server
- Streaming Service
- IoT Application

Nhờ khả năng xử lý nhiều kết nối đồng thời, Node.js rất phù hợp cho các hệ thống có lượng truy cập lớn.

---

## ❌ Common Mistakes

### Sai 1 - Nghĩ Node.js là JavaScript

Sai

```text
Node.js là ngôn ngữ lập trình.
```

Đúng

```text
JavaScript là ngôn ngữ lập trình.

Node.js là môi trường chạy JavaScript.
```

---

### Sai 2 - Nghĩ Node.js chỉ dùng để tạo Website

Node.js còn được sử dụng để:

- API Server
- CLI Tool
- Desktop App
- Microservices
- Automation Script
- Game Server

---

### Sai 3 - Nghĩ Node.js thay thế trình duyệt

Node.js không hiển thị HTML như Browser.

Node.js chủ yếu dùng để phát triển Backend và các ứng dụng phía máy chủ.

---

### Sai 4 - Nghĩ Node.js luôn nhanh hơn mọi ngôn ngữ

Node.js rất mạnh trong các tác vụ I/O nhưng không phải lựa chọn tốt cho các tác vụ tính toán nặng (CPU-intensive).

---

## 📚 Summary

- Node.js là môi trường chạy JavaScript ngoài trình duyệt.
- Node.js được xây dựng trên V8 JavaScript Engine.
- Node.js sử dụng kiến trúc Event-Driven và Non-blocking I/O.
- Node.js có thể tạo Web Server, thao tác với File System và kết nối Database.
- Node.js phù hợp để xây dựng Backend, API và các ứng dụng thời gian thực.

---

## 📝 Quiz

### Question 1

Node.js là gì?

A.

```text
Một trình duyệt Web
```

B.

```text
Một ngôn ngữ lập trình
```

C.

```text
Một môi trường chạy JavaScript
```

D.

```text
Một cơ sở dữ liệu
```

**Answer: C**

**Giải thích:** Node.js là **môi trường chạy** (runtime), không phải ngôn ngữ — ngôn ngữ vẫn là JavaScript. Phân biệt này quan trọng: cú pháp do đặc tả ECMAScript quy định, còn những thứ như `fs`, `process` hay `Buffer` là do Node cung cấp thêm và không tồn tại trong trình duyệt.


---

### Question 2

Node.js được xây dựng trên JavaScript Engine nào?

A.

```text
SpiderMonkey
```

B.

```text
V8
```

C.

```text
Java Virtual Machine
```

D.

```text
Chakra UI
```

**Answer: B**

**Giải thích:** V8 là engine của Google, cũng chính là engine trong Chrome. Đó là lý do một tính năng JavaScript mới thường xuất hiện gần như cùng lúc ở Chrome và Node. SpiderMonkey thuộc Firefox, còn Chakra UI chỉ là thư viện giao diện React, không liên quan gì.

