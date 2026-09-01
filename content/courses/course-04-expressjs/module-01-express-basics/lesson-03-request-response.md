---
id: express-m1-l3
course: Express.js
module: Express Basics
title: Request và Response
order: 3
difficulty: Beginner
estimatedTime: 40
---

# Request và Response

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Phân biệt `req.params`, `req.query` và `req.body` — lấy dữ liệu từ đâu, khi nào.
- Chọn đúng phương thức trả về: `res.json()`, `res.send()`, `res.status()`, `res.redirect()`.
- Đọc và đặt header HTTP.
- Tránh lỗi `ERR_HTTP_HEADERS_SENT`.

---

## 📖 Definition

Mỗi handler nhận hai object: `req` (những gì client gửi lên) và `res` (những gì server gửi về).

`req` và `res` của Express **kế thừa** từ `http.IncomingMessage` và `http.ServerResponse` của Node, rồi bổ sung thêm tiện ích. Nghĩa là mọi thứ Node có, Express vẫn có — `req.headers`, `res.end()` đều dùng được.

Dữ liệu client gửi lên nằm ở ba chỗ khác nhau, và lẫn lộn ba chỗ này là lỗi phổ biến nhất của người mới:

| Nguồn | Đến từ đâu | Ví dụ |
|---|---|---|
| `req.params` | Phần động trong đường dẫn | `/users/:id` → `req.params.id` |
| `req.query` | Chuỗi truy vấn sau dấu `?` | `/users?page=2` → `req.query.page` |
| `req.body` | Thân request | JSON gửi kèm POST/PUT/PATCH |

Điểm chung: **cả ba đều là chuỗi** (hoặc mảng chuỗi). `req.body` là ngoại lệ duy nhất — nếu client gửi JSON thì kiểu dữ liệu được giữ nguyên.

---

## ⚙️ Syntax

```javascript
app.post('/users/:id', (req, res) => {
  req.params.id;        // từ đường dẫn
  req.query.sort;       // từ ?sort=...
  req.body.email;       // từ thân request (cần express.json())
  req.get('User-Agent'); // từ header

  res.status(201).json({ ok: true });
});
```

### Example 1 - Ba nguồn dữ liệu trong một request

```javascript
app.use(express.json());

// PATCH /users/42?notify=true
// body: { "email": "an@example.com" }
app.patch('/users/:id', (req, res) => {
  console.log(req.params.id);    // "42"     — chuỗi
  console.log(req.query.notify); // "true"   — chuỗi, KHÔNG phải boolean
  console.log(req.body.email);   // "an@example.com"

  res.json({ updated: true });
});
```

Chú ý `req.query.notify` là chuỗi `"true"`. Viết `if (req.query.notify)` sẽ luôn đúng, kể cả khi client gửi `?notify=false` — vì chuỗi `"false"` vẫn là giá trị truthy.

```javascript
const notify = req.query.notify === 'true';
```

### Example 2 - Các cách gửi phản hồi

```javascript
res.send('Hello');                    // text/html
res.json({ id: 1 });                  // application/json
res.status(201).json({ id: 1 });      // đặt mã trạng thái rồi gửi
res.status(204).end();                // không có nội dung
res.redirect(302, '/login');          // chuyển hướng
res.sendFile('/duong/dan/anh.png');   // gửi file
```

Ở Express 5, `res.status()` chỉ nhận số nguyên trong khoảng **100–999**; ngoài khoảng đó nó ném lỗi thay vì âm thầm bỏ qua.

### Example 3 - Làm việc với header

```javascript
app.get('/download', (req, res) => {
  // Đọc header của request
  const userAgent = req.get('User-Agent');
  const acceptsJson = req.accepts('json');

  // Đặt header cho response
  res.set('Content-Disposition', 'attachment; filename="report.csv"');
  res.set('Cache-Control', 'no-store');

  res.send('id,name\n1,Learnova');
});
```

`req.get()` không phân biệt hoa thường: `req.get('content-type')` và `req.get('Content-Type')` như nhau.

### Example 4 - Phân trang qua query string

```javascript
app.get('/courses', (req, res) => {
  // Query string luôn là chuỗi, phải ép kiểu và chặn giá trị vô lý.
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  res.json({
    page,
    limit,
    items: [],
  });
});
```

Việc chặn `limit` ở 100 không phải cho đẹp: thiếu nó, client gửi `?limit=1000000` sẽ khiến server cố nạp một triệu bản ghi.

---

## 📌 Notes

- **`req.body` là `undefined` khi chưa parse.** Ở Express 4 nó là `{}`; Express 5 đổi thành `undefined`, nên `req.body.email` sẽ ném `TypeError` thay vì trả `undefined`.
- **Phải gắn `express.json()`** thì mới đọc được body JSON.
- **`req.query` ở Express 5 là getter chỉ đọc**, không gán lại được.
- **`req.host` giờ đã bao gồm cả cổng**, khác với Express 4.
- Một request chỉ được gửi **một** phản hồi. Gửi lần thứ hai là lỗi.

---

## 🌍 Real World Example

Endpoint tạo người dùng, xử lý đầy đủ ba nguồn dữ liệu và các mã trạng thái:

```javascript
const express = require('express');

const app = express();
app.use(express.json());

app.post('/api/users', (req, res) => {
  // Express 5: req.body là undefined nếu client không gửi JSON hợp lệ.
  const { email, username } = req.body ?? {};

  if (!email || !username) {
    return res.status(400).json({
      code: 'VALIDATION_FAILED',
      message: 'email và username là bắt buộc',
    });
  }

  if (isEmailTaken(email)) {
    return res.status(409).json({
      code: 'EMAIL_TAKEN',
      message: 'Email này đã được đăng ký',
    });
  }

  const user = createUser({ email, username });

  // 201 kèm header Location trỏ tới tài nguyên vừa tạo.
  res
    .status(201)
    .location(`/api/users/${user.id}`)
    .json({ id: user.id, email: user.email, username: user.username });
});
```

Ba chi tiết đáng học: `req.body ?? {}` phòng trường hợp body rỗng; mỗi nhánh lỗi đều `return`; và phản hồi 201 kèm `Location` — đúng chuẩn HTTP cho thao tác tạo mới.

---

## ⚠️ Common Mistakes

**Sai 1 — Quên `express.json()` rồi đọc `req.body`**

```javascript
// Thiếu app.use(express.json())
app.post('/users', (req, res) => {
  console.log(req.body.email); // TypeError: Cannot read properties of undefined
});
```

**Sai 2 — Coi query string là boolean**

```javascript
// SAI: "false" là chuỗi, và mọi chuỗi khác rỗng đều truthy
if (req.query.active) { }

// ĐÚNG
if (req.query.active === 'true') { }
```

**Sai 3 — Gửi phản hồi hai lần**

```javascript
// SAI: ERR_HTTP_HEADERS_SENT
res.json({ ok: true });
res.status(500).send('lỗi');
```

**Sai 4 — Nhầm `req.query` với `req.params`**

`/users/:id` cho giá trị ở `req.params.id`. `/users?id=1` cho giá trị ở `req.query.id`. Nhầm chỗ thì luôn nhận `undefined`.

**Sai 5 — Không giới hạn tham số phân trang**

Nhận thẳng `req.query.limit` mà không chặn trần là mở cửa cho một request làm sập server.

---

## 📋 Summary

- `req.params` lấy từ đường dẫn, `req.query` lấy từ chuỗi truy vấn, `req.body` lấy từ thân request — ba chỗ khác nhau, đừng nhầm.
- `req.params` và `req.query` luôn là chuỗi; phải tự ép kiểu và kiểm tra biên.
- `express.json()` là bắt buộc để đọc body JSON; thiếu nó `req.body` là `undefined` ở Express 5.
- Chọn đúng phương thức phản hồi: `res.json()` cho dữ liệu, `res.status().end()` cho 204, `res.redirect(status, url)` cho chuyển hướng.
- Mỗi request chỉ được một phản hồi — luôn `return` sau khi đã gửi.

---

## 📝 Quiz

### Question 1

Với request `GET /courses/12?includeLessons=false`, giá trị của `req.query.includeLessons` là gì?

A. Giá trị boolean `false`.

B. Chuỗi `"false"`.

C. `undefined`, vì query string chỉ đọc được sau khi gắn `express.json()`.

D. Số `0`.

**Answer: B**

**Giải thích:** Mọi giá trị trong query string đều là chuỗi. Vì `"false"` là chuỗi khác rỗng nên nó **truthy** — viết `if (req.query.includeLessons)` sẽ luôn đúng. Phải so sánh tường minh: `req.query.includeLessons === 'true'`.

---

### Question 2

Ở Express 5, `req.body` bằng gì khi client gửi POST mà server chưa gắn middleware parse body?

A. `{}` — một object rỗng, giống Express 4.

B. `null`.

C. `undefined`, nên truy cập thuộc tính sẽ ném `TypeError`.

D. Chuỗi rỗng.

**Answer: C**

**Giải thích:** Đây là một thay đổi phá vỡ của Express 5. Ở v4, `req.body` mặc định là `{}` nên `req.body.email` trả về `undefined` một cách im lặng. Ở v5 nó là `undefined`, nên `req.body.email` ném `TypeError` ngay — lỗi lộ ra sớm hơn, nhưng code viết theo thói quen v4 sẽ gãy.
