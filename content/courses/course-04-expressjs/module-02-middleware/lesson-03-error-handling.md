---
id: express-m2-l3
course: Express.js
module: Middleware
title: Xử lý lỗi
order: 3
difficulty: Intermediate
estimatedTime: 50
---

# Xử lý lỗi

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Viết middleware xử lý lỗi với chữ ký bốn tham số.
- Hiểu vì sao Express 5 tự bắt lỗi từ handler `async` còn v4 thì không.
- Gom toàn bộ lỗi về một chỗ và trả phản hồi có hình dạng thống nhất.
- Tránh làm lộ thông tin nhạy cảm qua thông báo lỗi.

---

## 📖 Definition

Middleware xử lý lỗi là loại đặc biệt: nó nhận **bốn** tham số thay vì ba.

```javascript
(err, req, res, next) => {}
```

Express nhận diện nó **bằng số lượng tham số**, chứ không bằng tên hàm hay vị trí. Tài liệu chính thức nhấn mạnh: *"Even if you don't need to use the `next` object, you must specify it to maintain the signature."* Viết ba tham số là Express coi đó như middleware thường và bỏ qua khi có lỗi.

Lỗi đi vào middleware này theo hai đường:

1. Bạn gọi `next(err)` một cách tường minh.
2. Handler ném lỗi — với điều kiện Express bắt được (xem phần dưới).

---

## ⚙️ Syntax

```javascript
// Phải khai báo SAU tất cả route và middleware khác.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
```

### Example 1 - Chuyển lỗi bằng `next(err)`

```javascript
app.get('/books/:id', (req, res, next) => {
  const book = findBook(req.params.id);

  if (!book) {
    const error = new Error('Không tìm thấy sách');
    error.status = 404;
    return next(error);
  }

  res.json(book);
});
```

Truyền bất kỳ giá trị nào khác `'route'` hoặc `'router'` vào `next()` đều khiến Express bỏ qua mọi middleware còn lại và nhảy thẳng tới nhánh xử lý lỗi.

### Example 2 - Lỗi từ handler `async`: khác biệt lớn nhất giữa v4 và v5

**Express 4** — phải tự bắt, nếu không tiến trình sập:

```javascript
app.get('/user/:id', (req, res, next) => {
  getUserById(req.params.id)
    .then((user) => res.send(user))
    .catch(next); // bắt buộc
});
```

**Express 5** — promise bị reject được chuyển thẳng tới middleware lỗi:

```javascript
app.get('/user/:id', async (req, res) => {
  const user = await getUserById(req.params.id);
  res.send(user);
});
```

Đây là lý do chính đáng nhất để nâng cấp lên Express 5. Ở v4, một hàm `async` ném lỗi mà quên `.catch(next)` sẽ tạo ra unhandled rejection — request treo, và ở Node phiên bản mới thì tiến trình chết hẳn.

### Example 3 - Lớp lỗi riêng

```javascript
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Dùng:
throw new AppError(404, 'BOOK_NOT_FOUND', 'Không tìm thấy sách');
throw new AppError(409, 'EMAIL_TAKEN', 'Email này đã được đăng ký');
```

Trường `code` quan trọng hơn `message`: client rẽ nhánh theo `code` ổn định, còn `message` là chữ cho người đọc và có thể đổi bất cứ lúc nào.

### Example 4 - Middleware lỗi tập trung

```javascript
app.use((err, req, res, next) => {
  // Header đã gửi rồi thì không sửa được nữa — giao lại cho Express đóng kết nối.
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status ?? 500;

  // 5xx là lỗi của mình, cần stack để sửa.
  // 4xx là caller gửi sai, ghi stack cho mỗi cái sẽ nhấn chìm lỗi thật.
  if (status >= 500) {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    code: err.code ?? 'INTERNAL_ERROR',
    // KHÔNG bao giờ trả nguyên văn message của lỗi 5xx: nó có thể chứa
    // câu truy vấn, đường dẫn file hoặc chuỗi kết nối database.
    message: status >= 500 ? 'Đã có lỗi xảy ra phía máy chủ' : err.message,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});
```

### Example 5 - Bắt route không tồn tại

```javascript
// Đặt sau tất cả route, trước middleware lỗi.
app.use((req, res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Không tìm thấy ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);
```

---

## 📌 Notes

- **Middleware lỗi phải khai báo cuối cùng**, sau mọi `app.use()` và route.
- **Bốn tham số là bắt buộc**, kể cả khi không dùng tới `next`.
- **Kiểm tra `res.headersSent`** trước khi gửi phản hồi lỗi.
- Được phép có nhiều middleware lỗi nối tiếp; gọi `next(err)` để chuyển cho cái kế.
- Express có sẵn một trình xử lý lỗi mặc định — nhưng ở chế độ phát triển nó trả về **nguyên cả stack trace cho client**, nên phải thay bằng bản của mình trước khi lên production.

---

## 🌍 Real World Example

Sườn xử lý lỗi hoàn chỉnh cho một API:

```javascript
const express = require('express');

const app = express();
app.use(express.json());

class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Express 5 bắt được lỗi ném ra từ hàm async — không cần try/catch ở đây.
app.get('/api/courses/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'VALIDATION_FAILED', 'id phải là số nguyên dương');
  }

  const course = await db.course.findById(id);

  if (!course) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy khoá học');
  }

  res.json(course);
});

// Không route nào khớp.
app.use((req, res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Không tìm thấy ${req.method} ${req.originalUrl}`));
});

// Điểm cuối cùng: mọi lỗi đều đi qua đây và ra cùng một hình dạng.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err instanceof AppError ? err.status : 500;

  if (status >= 500) {
    console.error(`${req.method} ${req.originalUrl}`, err.stack);
  }

  res.status(status).json({
    success: false,
    code: err.code ?? 'INTERNAL_ERROR',
    message: status >= 500 ? 'Đã có lỗi xảy ra phía máy chủ' : err.message,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

app.listen(3000);
```

Giá trị của kiểu tổ chức này: handler chỉ việc `throw` rồi thôi. Không có `try/catch` rải rác, không có chỗ nào tự chế ra một hình dạng lỗi riêng.

---

## ⚠️ Common Mistakes

**Sai 1 — Viết middleware lỗi với ba tham số**

```javascript
// SAI: Express coi đây là middleware thường, không bao giờ nhận lỗi
app.use((err, req, res) => {
  res.status(500).json({ message: err.message });
});
```

**Sai 2 — Đặt middleware lỗi trước route**

Lỗi chỉ chảy xuôi. Middleware lỗi khai báo trước route sẽ không bao giờ nhận được gì.

**Sai 3 — Quên `.catch(next)` khi còn dùng Express 4**

```javascript
// SAI ở Express 4: unhandled rejection, request treo
app.get('/user', async (req, res) => {
  const user = await getUser(); // nếu ném lỗi thì không ai bắt
  res.json(user);
});
```

Ở Express 5 đoạn này lại đúng. Phải biết mình đang dùng bản nào.

**Sai 4 — Trả nguyên văn lỗi hệ thống cho client**

```javascript
// SAI: lộ tên bảng, câu truy vấn, có khi cả chuỗi kết nối
res.status(500).json({ message: err.message });
```

**Sai 5 — Dùng trình xử lý lỗi mặc định của Express trên production**

Ở chế độ phát triển nó trả cả stack trace về cho client — bản đồ chi tiết của mã nguồn dành cho kẻ tấn công.

---

## 📋 Summary

- Middleware xử lý lỗi có **bốn** tham số `(err, req, res, next)`; Express nhận diện nó bằng số tham số.
- Phải khai báo cuối cùng, sau mọi route và middleware khác.
- Express 5 tự chuyển promise bị reject vào nhánh lỗi; Express 4 thì phải tự `.catch(next)`.
- Gom lỗi về một chỗ để mọi phản hồi lỗi có cùng hình dạng, và rẽ nhánh theo `code` chứ không theo `message`.
- Không bao giờ trả nguyên văn lỗi 5xx cho client — ghi vào log, còn client chỉ nhận một câu chung chung.

---

## 📝 Quiz

### Question 1

Vì sao Express không bao giờ gọi middleware dưới đây khi có lỗi?

```javascript
app.use((err, req, res) => {
  res.status(500).json({ message: err.message });
});
```

A. Vì thiếu `await` trước `res.status()`.

B. Vì Express nhận diện middleware lỗi bằng **số lượng tham số**, và hàm này chỉ có ba nên bị coi là middleware thường.

C. Vì tên tham số phải đúng là `error` chứ không phải `err`.

D. Vì phải đăng ký bằng `app.useError()` thay vì `app.use()`.

**Answer: B**

**Giải thích:** Express phân biệt middleware lỗi hoàn toàn dựa trên `fn.length`. Hàm ba tham số được xếp vào hàng đợi middleware thường, nên khi có lỗi Express bỏ qua nó và rơi xuống trình xử lý mặc định. Phải khai đủ bốn tham số kể cả khi không dùng tới `next`.

---

### Question 2

Đoạn code sau chạy đúng ở phiên bản Express nào?

```javascript
app.get('/user/:id', async (req, res) => {
  const user = await getUserById(req.params.id);
  res.json(user);
});
```

A. Cả Express 4 và 5 đều xử lý lỗi như nhau.

B. Chỉ Express 4, vì v5 đã bỏ hỗ trợ handler `async`.

C. Chỉ Express 5 — v5 tự chuyển promise bị reject tới middleware lỗi, còn v4 thì sinh unhandled rejection.

D. Không bản nào, vì handler `async` luôn phải bọc trong `try/catch`.

**Answer: C**

**Giải thích:** Đây là một trong những cải tiến đáng giá nhất của Express 5. Ở v4, `getUserById` ném lỗi sẽ tạo unhandled promise rejection: middleware lỗi không nhận được gì, request treo, và ở Node phiên bản mới thì tiến trình chết. Ở v5, Express bắt được và chuyển thẳng vào nhánh xử lý lỗi.
