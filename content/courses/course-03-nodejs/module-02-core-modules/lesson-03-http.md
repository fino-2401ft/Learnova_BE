---
id: node-m2-l3
course: Node.js
module: Core Modules
title: HTTP
order: 3
difficulty: Beginner
estimatedTime: 50
---
# HTTP

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Hiểu HTTP Module là gì.
- Tạo Web Server bằng Node.js.
- Hiểu Request và Response.
- Xử lý các URL khác nhau.
- Gửi dữ liệu về Client.
- Áp dụng HTTP Module trong các ứng dụng thực tế.

---

## 📖 Definition

**HTTP** là một Core Module của Node.js dùng để xây dựng Web Server và xử lý các yêu cầu từ Client.

Module `http` cho phép:

- Tạo HTTP Server.
- Nhận Request từ Client.
- Gửi Response về Client.
- Xử lý nhiều URL khác nhau.
- Xây dựng REST API cơ bản.

Đây là nền tảng của nhiều framework như **Express.js**, **NestJS** và **Fastify**.

---

## 💻 Syntax

### Import HTTP Module

```javascript
const http = require("http");
```

---

### Tạo Server

```javascript
const server = http.createServer((req, res) => {

    res.end("Hello Node.js");

});

server.listen(3000);
```

---

### Truy cập Server

```text
http://localhost:3000
```

---

## 📝 Example 1 - Tạo Web Server

```javascript
const http = require("http");

const server = http.createServer((req, res) => {

    res.end("Hello Node.js");

});

server.listen(3000);

console.log("Server is running...");
```

Output

```text
Server is running...
```

Khi mở trình duyệt:

```text
http://localhost:3000
```

Kết quả

```text
Hello Node.js
```

### Giải thích

`createServer()` tạo một HTTP Server.

Mỗi khi Client gửi Request, callback sẽ được thực thi.

---

## 📝 Example 2 - Xử lý nhiều URL

```javascript
const http = require("http");

const server = http.createServer((req, res) => {

    if (req.url === "/") {

        res.end("Home Page");

    } else if (req.url === "/about") {

        res.end("About Page");

    } else {

        res.statusCode = 404;

        res.end("Page Not Found");

    }

});

server.listen(3000);
```

Kết quả

```text
/          → Home Page
/about     → About Page
/abc       → Page Not Found
```

### Giải thích

Thông qua `req.url`, Server có thể xử lý nhiều đường dẫn khác nhau.

---

## 📝 Example 3 - Trả về dữ liệu JSON

```javascript
const http = require("http");

const server = http.createServer((req, res) => {

    res.setHeader("Content-Type", "application/json");

    const user = {
        id: 1,
        name: "Alice"
    };

    res.end(JSON.stringify(user));

});

server.listen(3000);
```

Output

```json
{
    "id": 1,
    "name": "Alice"
}
```

### Giải thích

`JSON.stringify()` chuyển đổi đối tượng JavaScript thành chuỗi JSON trước khi gửi về Client.

---

## ⚠️ Notes

### 1. createServer()

```javascript
http.createServer((req, res) => {});
```

Tạo một HTTP Server mới.

---

### 2. Request

Đối tượng `req` chứa thông tin của yêu cầu từ Client.

Ví dụ:

```javascript
req.url

req.method

req.headers
```

---

### 3. Response

Đối tượng `res` dùng để gửi dữ liệu về Client.

Ví dụ:

```javascript
res.end("Hello");
```

---

### 4. listen()

```javascript
server.listen(3000);
```

Server sẽ lắng nghe các kết nối tại cổng (port) được chỉ định.

---

### 5. Status Code

Có thể thiết lập mã trạng thái HTTP.

Ví dụ:

```javascript
res.statusCode = 404;
```

Một số mã phổ biến:

```text
200 OK

404 Not Found

500 Internal Server Error
```

---

## 🌍 Real World Example

Một API đơn giản trả về danh sách người dùng:

```javascript
const http = require("http");

const server = http.createServer((req, res) => {

    if (req.url === "/users") {

        res.setHeader("Content-Type", "application/json");

        res.end(JSON.stringify([
            {
                id: 1,
                name: "Alice"
            },
            {
                id: 2,
                name: "Bob"
            }
        ]));

    }

});

server.listen(3000);
```

Client gửi Request:

```text
GET /users
```

Server trả về:

```json
[
    {
        "id": 1,
        "name": "Alice"
    },
    {
        "id": 2,
        "name": "Bob"
    }
]
```

Đây là nguyên lý hoạt động cơ bản của các REST API.

---

## ❌ Common Mistakes

### Sai 1 - Quên gọi listen()

Sai

```javascript
const server = http.createServer(...);
```

Nếu không gọi:

```javascript
server.listen(3000);
```

Server sẽ không hoạt động.

---

### Sai 2 - Quên kết thúc Response

Sai

```javascript
res.write("Hello");
```

Đúng

```javascript
res.end("Hello");
```

`res.end()` kết thúc Response và gửi dữ liệu về Client.

---

### Sai 3 - Không đặt Content-Type

Sai

```javascript
res.end(JSON.stringify(user));
```

Đúng

```javascript
res.setHeader("Content-Type", "application/json");
```

Giúp Client hiểu dữ liệu nhận được là JSON.

---

### Sai 4 - Không xử lý URL không tồn tại

Sai

```javascript
if (req.url === "/") {

    res.end("Home");

}
```

Đúng

```javascript
else {

    res.statusCode = 404;

    res.end("Page Not Found");

}
```

Nên xử lý các URL không hợp lệ để tránh lỗi.

---

## 📚 Summary

- `http` là Core Module dùng để xây dựng Web Server.
- `http.createServer()` tạo một HTTP Server.
- `req` chứa thông tin Request từ Client.
- `res` dùng để gửi Response về Client.
- `server.listen()` giúp Server lắng nghe kết nối.
- Có thể trả về HTML, văn bản hoặc JSON cho Client.

---

## 📝 Quiz

### Question 1

Module nào dùng để tạo Web Server trong Node.js?

A.

```text
fs
```

B.

```text
path
```

C.

```text
http
```

D.

```text
os
```

**Answer: C**

**Giải thích:** `http` là module lõi để tạo server, và cũng là thứ nằm bên dưới Express. Biết điều này giúp hiểu vì sao `app.listen(3000)` của Express chỉ là cách viết ngắn của `http.createServer(app).listen(3000)`.


---

### Question 2

Phương thức nào dùng để bắt đầu lắng nghe các kết nối đến Server?

A.

```javascript
server.run()
```

B.

```javascript
server.listen()
```

C.

```javascript
server.start()
```

D.

```javascript
server.open()
```

**Answer: B**

**Giải thích:** `server.listen()` mở cổng và bắt đầu nhận kết nối. Nó không chặn tiến trình — lệnh trả về ngay, còn việc tiếp nhận kết nối do event loop lo. Đó là lý do code sau `listen()` vẫn chạy bình thường.

