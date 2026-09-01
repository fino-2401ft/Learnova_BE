---
id: express-m1-l1
course: Express.js
module: Express Basics
title: Giới thiệu Express
order: 1
difficulty: Beginner
estimatedTime: 30
---

# Giới thiệu Express

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Nói được Express là gì và giải quyết vấn đề gì.
- Cài đặt Express và chạy được server đầu tiên.
- Hiểu vì sao Express được gọi là "minimal and unopinionated".
- Biết Express 5 khác Express 4 ở những điểm nào đáng chú ý.

---

## 📖 Definition

Express là web framework cho Node.js, được mô tả trên trang chủ là *"fast, unopinionated, minimalist"*.

Node.js có sẵn module `http` để dựng server, nhưng làm việc trực tiếp với nó rất vất vả. Bạn phải tự đọc `req.url`, tự so chuỗi để biết client gọi đường dẫn nào, tự gom dữ liệu từ stream để đọc body, tự đặt header. Mỗi ứng dụng lại viết lại đúng những việc đó.

Express bọc lên trên `http` và đưa ra ba thứ:

1. **Định tuyến** — khai báo "đường dẫn này, phương thức này thì chạy hàm kia".
2. **Middleware** — chuỗi hàm chạy tuần tự trên mỗi request.
3. **Tiện ích cho `req` và `res`** — `res.json()`, `res.status()`, `req.params`…

Chữ *unopinionated* nghĩa là Express **không** áp đặt cấu trúc thư mục, không bắt dùng ORM nào, không quy định cách tổ chức tầng. Đó vừa là điểm mạnh vừa là điểm yếu: bạn tự do, nhưng cũng tự chịu trách nhiệm về kiến trúc. Đây chính là chỗ NestJS ra đời để lấp vào.

---

## ⚙️ Syntax

Express 5 yêu cầu **Node.js 18 trở lên**.

```bash
npm install express
```

Một ứng dụng Express tối thiểu gồm ba bước: tạo app, khai báo route, lắng nghe cổng.

```javascript
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);
```

### Example 1 - Server đầu tiên

```javascript
const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Xin chào Learnova!');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
```

**Giải thích**

`express()` trả về một object `app`. Bản thân `app` là một hàm có chữ ký `(req, res)` — đúng thứ mà `http.createServer()` cần. Nói cách khác, `app.listen(3000)` chỉ là cách viết ngắn của:

```javascript
const http = require('node:http');
http.createServer(app).listen(3000);
```

Biết điều này giúp bạn hiểu vì sao có thể gắn cùng một app Express vào server HTTPS, hoặc vào Socket.IO.

### Example 2 - Dùng cú pháp ES Module

```javascript
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Xin chào Learnova!');
});

app.listen(3000);
```

Để dùng được `import`, thêm `"type": "module"` vào `package.json`.

### Example 3 - Trả về JSON thay vì text

```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});
```

`res.json()` làm hai việc: gọi `JSON.stringify()` trên dữ liệu, và đặt header `Content-Type: application/json`. Nếu dùng `res.send()` với một object thì Express cũng tự chuyển sang JSON, nhưng viết `res.json()` thể hiện rõ ý định hơn.

---

## 📌 Notes

- **`app.listen()` không chặn tiến trình.** Nó đăng ký lắng nghe rồi trả về ngay. Mọi thứ sau đó chạy theo cơ chế sự kiện của Node.
- **Thứ tự khai báo route rất quan trọng.** Express duyệt các route theo đúng thứ tự bạn viết và dừng ở cái khớp đầu tiên.
- **Express 5 tự bắt lỗi từ hàm `async`.** Đây là thay đổi lớn nhất so với v4 — sẽ nói kỹ ở bài xử lý lỗi.
- **Đừng đọc cổng bằng số cứng.** Dùng `process.env.PORT` để môi trường triển khai tự quyết định.

---

## 🌍 Real World Example

Một server nhỏ phục vụ thông tin sách, đủ để thấy hình dạng thật của một ứng dụng Express:

```javascript
const express = require('express');

const app = express();

// Cho phép đọc JSON từ body của request.
app.use(express.json());

const books = [
  { id: 1, title: 'Clean Code', author: 'Robert C. Martin' },
  { id: 2, title: 'The Pragmatic Programmer', author: 'Andrew Hunt' },
];

app.get('/books', (req, res) => {
  res.json(books);
});

app.get('/books/:id', (req, res) => {
  const book = books.find((item) => item.id === Number(req.params.id));

  if (!book) {
    return res.status(404).json({ message: 'Không tìm thấy sách' });
  }

  res.json(book);
});

app.listen(process.env.PORT || 3000);
```

Ba điểm đáng chú ý: `express.json()` là middleware bắt buộc nếu muốn đọc body; `req.params.id` luôn là **chuỗi** nên phải ép kiểu; và `return` trước `res.status(404)` để hàm dừng lại — thiếu nó thì code chạy tiếp và gửi phản hồi hai lần.

---

## ⚠️ Common Mistakes

**Sai 1 — Quên `return` sau khi đã gửi phản hồi**

```javascript
// SAI: gửi hai lần, Node ném ERR_HTTP_HEADERS_SENT
if (!book) {
  res.status(404).json({ message: 'Không tìm thấy' });
}
res.json(book);
```

`res.json()` không dừng hàm. Phải `return` hoặc dùng `else`.

**Sai 2 — Dùng `res.send(data, status)` theo kiểu Express 4**

```javascript
// SAI ở Express 5
res.send({ name: 'Ruben' }, 200);

// ĐÚNG
res.status(200).send({ name: 'Ruben' });
```

Express 5 đã bỏ dạng truyền status làm tham số thứ hai.

**Sai 3 — Dùng `app.del()`**

Express 5 xoá hẳn `app.del()`. Phải dùng `app.delete()`.

**Sai 4 — Nghĩ rằng `req.params.id` là số**

Mọi giá trị trong `req.params` đều là chuỗi. `req.params.id === 1` luôn `false`.

---

## 📋 Summary

- Express là lớp bọc mỏng trên module `http` của Node, cung cấp định tuyến, middleware và các tiện ích cho `req`/`res`.
- Ba dòng lệnh là đủ để có server: `express()`, `app.METHOD()`, `app.listen()`.
- Express *unopinionated*: bạn tự quyết kiến trúc, và tự chịu hậu quả nếu quyết sai.
- Express 5 cần Node 18+, đã bỏ `app.del()`, bỏ `res.send(body, status)`, và tự bắt lỗi từ handler `async`.

---

## 📝 Quiz

### Question 1

Vì sao `app.listen(3000)` tương đương với `http.createServer(app).listen(3000)`?

A. Vì Express ghi đè module `http` của Node.

B. Vì bản thân `app` là một hàm có chữ ký `(req, res)`, đúng thứ `createServer` cần.

C. Vì `app.listen` mở một tiến trình con chạy server riêng.

D. Vì Express thay thế hoàn toàn tầng TCP của Node.

**Answer: B**

**Giải thích:** `express()` trả về một hàm request handler kèm các thuộc tính bổ sung. Vì nó là hàm `(req, res)` hợp lệ nên truyền thẳng vào `http.createServer()` được, và `app.listen()` chỉ là cách viết tắt của đúng thao tác đó.

---

### Question 2

Đoạn code sau có vấn đề gì?

```javascript
app.get('/books/:id', (req, res) => {
  const book = findBook(req.params.id);
  if (!book) {
    res.status(404).json({ message: 'Không tìm thấy' });
  }
  res.json(book);
});
```

A. Không có vấn đề gì.

B. `req.params.id` phải viết là `req.param('id')`.

C. Thiếu `return`, nên khi không tìm thấy sách server sẽ gửi phản hồi hai lần.

D. `res.status()` phải đặt sau `res.json()`.

**Answer: C**

**Giải thích:** `res.json()` gửi phản hồi nhưng không dừng hàm. Không có `return`, dòng `res.json(book)` vẫn chạy và Node ném lỗi `ERR_HTTP_HEADERS_SENT` vì header đã được gửi đi rồi.
