---
id: express-m1-l2
course: Express.js
module: Express Basics
title: Định tuyến
order: 2
difficulty: Beginner
estimatedTime: 45
---

# Định tuyến

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Khai báo route cho mọi phương thức HTTP.
- Đọc tham số động từ đường dẫn qua `req.params`.
- Tách route ra file riêng bằng `express.Router()`.
- Viết đúng cú pháp đường dẫn của Express 5, vốn đã đổi so với v4.

---

## 📖 Definition

**Định tuyến** là việc quyết định request nào chạy vào hàm xử lý nào.

Một *endpoint* gồm hai phần: **đường dẫn** (URI) và **phương thức HTTP**. `GET /books` và `POST /books` cùng đường dẫn nhưng là hai endpoint hoàn toàn khác nhau, chạy hai hàm khác nhau.

Express duyệt các route **theo đúng thứ tự bạn khai báo** và dừng ở cái khớp đầu tiên. Đây là điều phải nhớ nằm lòng: một route quá tổng quát đặt ở trên sẽ nuốt hết các route cụ thể đặt ở dưới.

---

## ⚙️ Syntax

Dạng chung theo tài liệu chính thức:

```javascript
app.METHOD(PATH, HANDLER);
```

Trong đó:

| Thành phần | Ý nghĩa |
|---|---|
| `app` | Một instance của `express` |
| `METHOD` | Phương thức HTTP viết thường: `get`, `post`, `put`, `delete`, `patch` |
| `PATH` | Đường dẫn trên server |
| `HANDLER` | Hàm chạy khi route khớp |

### Example 1 - Bốn phương thức cơ bản

```javascript
app.get('/user', (req, res) => {
  res.send('Lấy thông tin user');
});

app.post('/user', (req, res) => {
  res.send('Tạo user mới');
});

app.put('/user/:id', (req, res) => {
  res.send(`Cập nhật toàn bộ user ${req.params.id}`);
});

app.delete('/user/:id', (req, res) => {
  res.send(`Xoá user ${req.params.id}`);
});
```

### Example 2 - Tham số động

```javascript
// GET /users/42/posts/7
app.get('/users/:userId/posts/:postId', (req, res) => {
  res.json({
    userId: req.params.userId, // "42" — là CHUỖI
    postId: req.params.postId, // "7"
  });
});
```

Mọi giá trị trong `req.params` đều là chuỗi. Cần số thì phải ép kiểu và kiểm tra:

```javascript
const id = Number(req.params.id);

if (!Number.isInteger(id) || id < 1) {
  return res.status(400).json({ message: 'id không hợp lệ' });
}
```

### Example 3 - Nhiều handler cho một route

```javascript
const checkAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Cần đăng nhập' });
  }
  next();
};

app.get('/profile', checkAuth, (req, res) => {
  res.json({ username: 'learnova' });
});
```

Handler chạy tuần tự. Hàm nào không gửi phản hồi thì phải gọi `next()` để chuyển tiếp.

### Example 4 - Tách route bằng Router

`express.Router()` tạo ra một "mini-app" gom nhóm route, để mỗi nhóm nằm ở một file riêng.

```javascript
// routes/books.js
const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Danh sách sách' });
});

router.get('/:id', (req, res) => {
  res.json({ id: req.params.id });
});

module.exports = router;
```

```javascript
// app.js
const booksRouter = require('./routes/books');

// Mọi route trong booksRouter được gắn tiền tố /books
app.use('/books', booksRouter);
```

Kết quả: `GET /books` và `GET /books/:id`. Bên trong router bạn viết đường dẫn tương đối, tiền tố do `app.use()` quyết định — đổi tiền tố chỉ phải sửa một dòng.

### Example 5 - Cú pháp đường dẫn của Express 5

Express 5 đổi bộ so khớp đường dẫn. Ba điểm thường gặp:

```javascript
// Ký tự đại diện BẮT BUỘC phải có tên
app.get('/*splat', (req, res) => {
  // GET /foo/bar  ->  req.params.splat = ['foo', 'bar']  (là MẢNG)
  res.json(req.params.splat);
});

// Muốn khớp cả đường dẫn gốc thì bọc trong { }
app.get('/{*splat}', handler);

// Tham số tuỳ chọn dùng { }, không dùng dấu ?
app.get('/:file{.:ext}', handler);

// Không dùng được ký tự regex trong chuỗi — truyền mảng đường dẫn thay thế
app.get(['/discussion/:slug', '/page/:slug'], handler);
```

---

## 📌 Notes

- **Thứ tự route quyết định tất cả.** `/books/new` phải khai báo TRƯỚC `/books/:id`, nếu không `:id` sẽ nuốt luôn chuỗi `"new"`.
- **Ở Express 5, tham số không khớp bị bỏ hẳn** khỏi `req.params`, chứ không còn là `undefined` như v4.
- **`req.params` có null prototype** với đường dẫn dạng chuỗi. Đừng gọi `req.params.hasOwnProperty(...)`.
- **`app.all()`** khớp mọi phương thức — hữu ích cho middleware gắn theo đường dẫn.
- Router lồng được vào nhau: một router có thể `use()` một router khác.

---

## 🌍 Real World Example

Cấu trúc route của một API quản lý khoá học:

```javascript
// routes/courses.js
const express = require('express');

const router = express.Router();

// Middleware áp cho MỌI route trong router này.
router.use((req, res, next) => {
  console.log(`[courses] ${req.method} ${req.originalUrl}`);
  next();
});

// QUAN TRỌNG: đường dẫn cụ thể phải đứng trước đường dẫn có tham số.
router.get('/popular', (req, res) => {
  res.json({ courses: ['NestJS', 'TypeScript'] });
});

router.get('/', (req, res) => {
  const page = Number(req.query.page) || 1;
  res.json({ page, courses: [] });
});

router.get('/:courseId', (req, res) => {
  res.json({ courseId: req.params.courseId });
});

router.get('/:courseId/lessons', (req, res) => {
  res.json({ courseId: req.params.courseId, lessons: [] });
});

module.exports = router;
```

Nếu đảo `/popular` xuống dưới `/:courseId`, request `GET /courses/popular` sẽ rơi vào route tham số với `courseId = "popular"` — và bạn sẽ mất khá lâu để hiểu vì sao.

---

## ⚠️ Common Mistakes

**Sai 1 — Đặt route tổng quát lên trước**

```javascript
// SAI
app.get('/books/:id', handlerChiTiet);
app.get('/books/featured', handlerNoiBat); // không bao giờ chạy tới

// ĐÚNG
app.get('/books/featured', handlerNoiBat);
app.get('/books/:id', handlerChiTiet);
```

**Sai 2 — Dùng `req.param('id')`**

Express 5 đã xoá hẳn phương thức này. Phải nói rõ lấy từ đâu: `req.params.id`, `req.query.id` hay `req.body.id`.

**Sai 3 — Dùng cú pháp wildcard của Express 4**

```javascript
// SAI ở Express 5
app.get('/*', handler);

// ĐÚNG
app.get('/*splat', handler);
```

**Sai 4 — Gán lại `req.query`**

```javascript
// SAI ở Express 5: req.query giờ là getter chỉ đọc
req.query.page = 1;
```

Muốn giá trị mặc định thì gán vào biến riêng, đừng ghi đè `req.query`.

**Sai 5 — So sánh tham số với số**

```javascript
// SAI: req.params.id là chuỗi "1", không bao giờ bằng số 1
if (req.params.id === 1) { }

// ĐÚNG
if (Number(req.params.id) === 1) { }
```

---

## 📋 Summary

- Route được khai báo theo dạng `app.METHOD(PATH, HANDLER)`; một endpoint là cặp (đường dẫn, phương thức).
- Express khớp route theo thứ tự khai báo — đường dẫn cụ thể phải đứng trước đường dẫn có tham số.
- `req.params` luôn chứa **chuỗi**, phải tự ép kiểu và kiểm tra.
- `express.Router()` gom nhóm route thành module độc lập, gắn vào app qua `app.use(prefix, router)`.
- Express 5 đổi cú pháp đường dẫn: wildcard phải có tên (`/*splat`), tham số tuỳ chọn dùng `{}`, và không dùng được ký tự regex trong chuỗi.

---

## 📝 Quiz

### Question 1

Với hai route khai báo theo thứ tự dưới đây, request `GET /books/featured` sẽ chạy vào đâu?

```javascript
app.get('/books/:id', (req, res) => res.send('chi tiết'));
app.get('/books/featured', (req, res) => res.send('nổi bật'));
```

A. Route `/books/featured`, vì đường dẫn cụ thể luôn được ưu tiên.

B. Route `/books/:id`, với `req.params.id` bằng `"featured"`.

C. Cả hai route đều chạy, phản hồi sau ghi đè phản hồi trước.

D. Express báo lỗi vì hai route xung đột nhau.

**Answer: B**

**Giải thích:** Express duyệt route theo đúng thứ tự khai báo và dừng ở cái khớp đầu tiên, không hề xếp hạng theo độ cụ thể. `/books/:id` đứng trước nên nó khớp trước, và chuỗi `"featured"` bị nhận làm giá trị của `:id`.

---

### Question 2

Ở Express 5, cách khai báo wildcard nào là đúng?

A.

```javascript
app.get('/*', handler);
```

B.

```javascript
app.get('/*splat', handler);
```

C.

```javascript
app.get('/(.*)', handler);
```

D.

```javascript
app.get('/:*', handler);
```

**Answer: B**

**Giải thích:** Express 5 bắt buộc wildcard phải có tên. Giá trị bắt được trả về dưới dạng **mảng** trong `req.params.splat` — ví dụ `GET /foo/bar` cho `req.params.splat = ['foo', 'bar']`.
