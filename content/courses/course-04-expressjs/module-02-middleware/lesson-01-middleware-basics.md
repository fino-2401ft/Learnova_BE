---
id: express-m2-l1
course: Express.js
module: Middleware
title: Middleware là gì
order: 1
difficulty: Beginner
estimatedTime: 45
---

# Middleware là gì

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Giải thích middleware là gì và vì sao Express xoay quanh khái niệm này.
- Viết middleware với chữ ký `(req, res, next)`.
- Biết khi nào phải gọi `next()` và khi nào không.
- Phân biệt middleware cấp ứng dụng và cấp router.

---

## 📖 Definition

**Middleware** là hàm nằm giữa lúc request đến và lúc phản hồi đi ra.

Express không xử lý request bằng một hàm duy nhất. Nó xếp các hàm thành một **hàng đợi** và cho request đi qua từng hàm một. Mỗi hàm có bốn quyền:

1. Chạy bất kỳ đoạn code nào.
2. Sửa đổi `req` và `res`.
3. **Kết thúc** chu trình bằng cách gửi phản hồi.
4. **Chuyển tiếp** cho hàm kế bằng cách gọi `next()`.

Quy tắc sống còn: **nếu không kết thúc chu trình thì phải gọi `next()`**. Không làm cả hai thì request treo vô thời hạn — client đợi tới lúc timeout, và bạn sẽ không thấy lỗi nào trong log.

Tài liệu chính thức chia middleware thành năm loại:

| Loại | Gắn vào đâu |
|---|---|
| Cấp ứng dụng | `app.use()`, `app.METHOD()` |
| Cấp router | `router.use()`, `router.METHOD()` |
| Xử lý lỗi | `app.use()` với hàm **bốn** tham số |
| Có sẵn | `express.json`, `express.static`… |
| Bên thứ ba | `cors`, `helmet`, `morgan`… |

---

## ⚙️ Syntax

```javascript
(req, res, next) => {
  // làm gì đó
  next();
};
```

Gắn vào ứng dụng:

```javascript
// Chạy cho MỌI request
app.use(middleware);

// Chỉ chạy cho request có đường dẫn bắt đầu bằng /admin
app.use('/admin', middleware);

// Chỉ chạy cho đúng route này
app.get('/profile', middleware, handler);
```

### Example 1 - Middleware ghi log

```javascript
app.use((req, res, next) => {
  console.log('Time:', Date.now());
  next();
});
```

Đặt ở đầu file, trước mọi route, thì mọi request đều đi qua.

### Example 2 - Middleware gắn theo đường dẫn

```javascript
app.use('/user/:id', (req, res, next) => {
  console.log('Request Type:', req.method);
  next();
});
```

### Example 3 - Nhiều middleware cho cùng một đường dẫn

```javascript
app.use(
  '/user/:id',
  (req, res, next) => {
    console.log('Request URL:', req.originalUrl);
    next();
  },
  (req, res, next) => {
    console.log('Request Type:', req.method);
    next();
  },
);
```

Chúng chạy theo đúng thứ tự truyền vào.

### Example 4 - Middleware gắn dữ liệu vào `req`

Đây là cách middleware "nói chuyện" với các hàm phía sau:

```javascript
const attachUser = (req, res, next) => {
  const token = req.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Cần đăng nhập' });
  }

  // Gắn vào req để handler phía sau dùng được.
  req.user = verifyToken(token);
  next();
};

app.get('/profile', attachUser, (req, res) => {
  res.json({ username: req.user.username });
});
```

Chú ý `return` trước `res.status(401)`. Thiếu nó, code chạy tiếp xuống `next()` và request vẫn đi vào handler dù chưa xác thực.

### Example 5 - Middleware cấp router

```javascript
const express = require('express');

const router = express.Router();

router.use((req, res, next) => {
  console.log('Time:', Date.now());
  next();
});

app.use('/', router);
```

Middleware này chỉ áp cho các route thuộc router đó, không ảnh hưởng phần còn lại của ứng dụng.

---

## 📌 Notes

- **Thứ tự là tất cả.** `app.use()` đặt sau khi khai báo route thì middleware không chạy cho route đó.
- **`next()` không dừng hàm.** Sau khi gọi `next()`, phần code còn lại vẫn chạy tiếp. Muốn dừng thì `return next()`.
- **`next('route')`** bỏ qua phần middleware còn lại của route hiện tại, nhảy sang route kế.
- **`next('router')`** thoát khỏi router hiện tại, trả quyền về cho app.
- **Truyền bất kỳ giá trị nào khác vào `next()`** đều bị coi là lỗi và nhảy thẳng tới middleware xử lý lỗi.

---

## 🌍 Real World Example

Ba middleware thường thấy trong một ứng dụng thật:

```javascript
const express = require('express');

const app = express();

// 1. Ghi log kèm thời gian xử lý.
app.use((req, res, next) => {
  const startedAt = Date.now();

  // 'finish' phát ra khi phản hồi đã gửi xong — lúc đó mới biết mã trạng thái.
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });

  next();
});

// 2. Gắn mã định danh cho mỗi request, để lần theo trong log.
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.set('X-Request-Id', req.requestId);
  next();
});

// 3. Chỉ cho phép JSON ở các phương thức có body.
app.use((req, res, next) => {
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);

  if (hasBody && !req.is('application/json')) {
    return res.status(415).json({ message: 'Chỉ chấp nhận application/json' });
  }

  next();
});
```

Middleware thứ nhất dùng sự kiện `finish` của `res` thay vì ghi log ngay — vì tại thời điểm middleware chạy, `res.statusCode` chưa có giá trị thật.

---

## ⚠️ Common Mistakes

**Sai 1 — Quên gọi `next()`**

```javascript
// SAI: request treo mãi mãi, không có lỗi nào trong log
app.use((req, res, next) => {
  console.log(req.url);
});
```

**Sai 2 — Gọi `next()` sau khi đã gửi phản hồi**

```javascript
// SAI: middleware kế tiếp chạy và cố gửi phản hồi lần hai
app.use((req, res, next) => {
  res.json({ ok: true });
  next();
});
```

**Sai 3 — Đặt `app.use()` sau route**

```javascript
// SAI: route đã khai báo trước nên không đi qua middleware này
app.get('/users', handler);
app.use(express.json());
```

**Sai 4 — Nghĩ `next()` dừng hàm**

```javascript
// SAI: dòng res.json() vẫn chạy
if (!req.user) {
  next();
}
res.json(req.user); // req.user là undefined

// ĐÚNG
if (!req.user) {
  return next();
}
```

**Sai 5 — Làm việc nặng đồng bộ trong middleware**

Middleware chạy trên mọi request. Một vòng lặp nặng hay `readFileSync` ở đây sẽ chặn event loop và làm chậm toàn bộ ứng dụng.

---

## 📋 Summary

- Middleware là hàm `(req, res, next)` nằm giữa request và response; Express xử lý mọi thứ bằng cách xếp chúng thành hàng đợi.
- Mỗi middleware phải hoặc gửi phản hồi, hoặc gọi `next()`. Không làm gì cả thì request treo.
- `next()` không dừng hàm — dùng `return next()` khi muốn thoát.
- Thứ tự khai báo quyết định thứ tự chạy; `app.use()` phải đặt trước các route mà nó cần bao phủ.
- Middleware giao tiếp với handler phía sau bằng cách gắn thuộc tính vào `req`.

---

## 📝 Quiz

### Question 1

Điều gì xảy ra với middleware dưới đây?

```javascript
app.use((req, res, next) => {
  console.log(req.url);
});
```

A. Request đi tiếp bình thường, vì Express tự gọi `next()` khi hàm kết thúc.

B. Express ném lỗi ngay khi khởi động vì thiếu `next()`.

C. Request bị treo cho tới khi client timeout, và không có lỗi nào được ghi lại.

D. Express trả về 500 cho mọi request.

**Answer: C**

**Giải thích:** Express không tự gọi `next()`. Middleware này không gửi phản hồi cũng không chuyển tiếp, nên chu trình dừng lại tại đó. Đây là kiểu lỗi khó tìm vì log hoàn toàn im lặng — chỉ thấy client báo timeout.

---

### Question 2

Vì sao đoạn code sau vẫn cho request đi vào handler dù chưa có token?

```javascript
const auth = (req, res, next) => {
  if (!req.get('Authorization')) {
    res.status(401).json({ message: 'Cần đăng nhập' });
  }
  next();
};
```

A. Vì `res.status(401)` chỉ đặt mã trạng thái chứ không gửi phản hồi.

B. Vì thiếu `return`, nên `next()` vẫn chạy sau khi đã gửi phản hồi 401.

C. Vì middleware xác thực phải dùng `app.use()` chứ không truyền vào route.

D. Vì `req.get()` không đọc được header `Authorization`.

**Answer: B**

**Giải thích:** `res.json()` gửi phản hồi nhưng không dừng hàm. Không có `return`, `next()` vẫn được gọi và Express chuyển sang handler kế tiếp — handler đó lại cố gửi phản hồi lần nữa và gây `ERR_HTTP_HEADERS_SENT`.
