---
id: express-m3-l2
course: Express.js
module: REST API
title: Xây dựng endpoint CRUD
order: 2
difficulty: Intermediate
estimatedTime: 55
---

# Xây dựng endpoint CRUD

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Viết đủ năm endpoint CRUD cho một tài nguyên.
- Tách route, controller và tầng dữ liệu ra khỏi nhau.
- Cài đặt phân trang có trả về thông tin tổng số.
- Xử lý đúng trường hợp không tìm thấy và trùng dữ liệu.

---

## 📖 Definition

**CRUD** là bốn thao tác cơ bản trên một tài nguyên: Create, Read, Update, Delete. Trong REST, "Read" tách thành hai endpoint riêng — đọc danh sách và đọc chi tiết — nên thực tế có năm.

Điều quan trọng hơn danh sách endpoint là **cách chia lớp**. Nhét hết vào một file `app.js` thì chạy được, nhưng tới bài thứ ba bạn sẽ không tìm nổi thứ mình cần. Cách chia tối thiểu:

```
routes/       khai báo đường dẫn, gắn middleware
controllers/  đọc req, gọi service, dựng res
services/     nghiệp vụ
repositories/ truy vấn dữ liệu
```

Với dự án nhỏ có thể gộp service vào controller. Nhưng **route và truy vấn dữ liệu thì không nên nằm chung một chỗ** — đó là ranh giới đáng giữ nhất.

---

## ⚙️ Syntax

```javascript
router.get('/', list);          // GET    /courses
router.get('/:id', getOne);     // GET    /courses/:id
router.post('/', create);       // POST   /courses
router.patch('/:id', update);   // PATCH  /courses/:id
router.delete('/:id', remove);  // DELETE /courses/:id
```

### Example 1 - Đọc danh sách có phân trang

```javascript
// GET /courses?page=2&limit=20&status=PUBLISHED
async function list(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const { status } = req.query;

  const where = status ? { status } : {};

  // Đếm và lấy dữ liệu song song, thay vì chờ lần lượt.
  const [items, total] = await Promise.all([
    repository.findMany({ where, skip: (page - 1) * limit, take: limit }),
    repository.count({ where }),
  ]);

  res.json({
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

`Promise.all` ở đây tiết kiệm đúng một lượt round-trip xuống database. Với endpoint danh sách được gọi liên tục, khác biệt đó tích lại rất nhanh.

### Example 2 - Đọc chi tiết

```javascript
async function getOne(req, res) {
  const id = Number(req.params.id);

  // Kiểm tra ID TRƯỚC khi chạm database. Chuỗi rác không đáng để tốn một truy vấn.
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'VALIDATION_FAILED', 'id phải là số nguyên dương');
  }

  const course = await repository.findById(id);

  if (!course) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy khoá học');
  }

  res.json(course);
}
```

### Example 3 - Tạo mới

```javascript
async function create(req, res) {
  const { title, description, level } = req.body ?? {};

  if (!title || title.trim().length < 3) {
    throw new AppError(400, 'VALIDATION_FAILED', 'title phải có ít nhất 3 ký tự');
  }

  const course = await repository.create({
    title: title.trim(),
    description,
    level: level ?? 'BEGINNER',
    mentorId: req.user.id, // lấy từ token, KHÔNG lấy từ body
  });

  // 201 kèm Location trỏ tới tài nguyên vừa tạo.
  res.status(201).location(`/api/v1/courses/${course.id}`).json(course);
}
```

`mentorId` lấy từ `req.user` chứ không từ `req.body`. Nhận nó từ body nghĩa là bất kỳ ai cũng tạo được khoá học đứng tên người khác.

### Example 4 - Cập nhật một phần

```javascript
async function update(req, res) {
  const id = Number(req.params.id);
  const course = await repository.findById(id);

  if (!course) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy khoá học');
  }

  // Kiểm tra quyền sở hữu: tìm thấy tài nguyên không có nghĩa là được sửa nó.
  if (course.mentorId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền sửa khoá học này');
  }

  // PATCH: chỉ nhận những trường được gửi lên.
  const patch = {};
  if (req.body.title !== undefined) patch.title = req.body.title.trim();
  if (req.body.description !== undefined) patch.description = req.body.description;
  if (req.body.level !== undefined) patch.level = req.body.level;

  if (Object.keys(patch).length === 0) {
    throw new AppError(400, 'VALIDATION_FAILED', 'Không có trường nào để cập nhật');
  }

  res.json(await repository.update(id, patch));
}
```

Dùng `!== undefined` chứ không dùng `if (req.body.title)`. Với cách viết thứ hai, client gửi `description: ""` để xoá mô tả sẽ không có tác dụng gì.

### Example 5 - Xoá

```javascript
async function remove(req, res) {
  const id = Number(req.params.id);
  const course = await repository.findById(id);

  if (!course) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy khoá học');
  }

  if (course.mentorId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền xoá khoá học này');
  }

  if (await repository.hasEnrollments(id)) {
    throw new AppError(409, 'CONFLICT', 'Khoá học đã có học viên ghi danh, không thể xoá');
  }

  await repository.remove(id);

  // 204: xoá thành công, không có nội dung trả về.
  res.status(204).end();
}
```

---

## 📌 Notes

- **`POST` trả 201**, không phải 200, và kèm header `Location`.
- **`DELETE` trả 204** với thân rỗng. Dùng `res.status(204).end()`, không dùng `res.json()`.
- **Kiểm tra ID trước khi truy vấn** — chuỗi rác không đáng để tốn một round-trip.
- **Tìm thấy ≠ được phép.** Luôn kiểm tra quyền sau khi tìm thấy tài nguyên.
- Mọi trường định danh người dùng phải lấy từ token, không bao giờ từ body.

---

## 🌍 Real World Example

Module khoá học hoàn chỉnh, chia ba file:

```javascript
// repositories/course.repository.js
const prisma = require('../db');

exports.findMany = ({ where, skip, take }) =>
  prisma.course.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });

exports.count = ({ where }) => prisma.course.count({ where });
exports.findById = (id) => prisma.course.findUnique({ where: { id } });
exports.create = (data) => prisma.course.create({ data });
exports.update = (id, data) => prisma.course.update({ where: { id }, data });
exports.remove = (id) => prisma.course.delete({ where: { id } });
exports.hasEnrollments = async (id) =>
  (await prisma.enrollment.count({ where: { courseId: id } })) > 0;
```

```javascript
// controllers/course.controller.js
const repository = require('../repositories/course.repository');
const { AppError } = require('../errors');

exports.list = async (req, res) => { /* như Example 1 */ };
exports.getOne = async (req, res) => { /* như Example 2 */ };
exports.create = async (req, res) => { /* như Example 3 */ };
exports.update = async (req, res) => { /* như Example 4 */ };
exports.remove = async (req, res) => { /* như Example 5 */ };
```

```javascript
// routes/course.routes.js
const express = require('express');
const controller = require('../controllers/course.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Đọc: ai cũng xem được.
router.get('/', controller.list);
router.get('/:id', controller.getOne);

// Ghi: phải đăng nhập, và phải là MENTOR hoặc ADMIN.
router.post('/', requireAuth, requireRole('MENTOR', 'ADMIN'), controller.create);
router.patch('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;
```

File route đọc như một bản mục lục: nhìn qua là biết endpoint nào cần đăng nhập, endpoint nào cần vai trò gì. Đó là lợi ích lớn nhất của việc tách lớp — không phải vì "kiến trúc sạch" mà vì đọc nhanh hơn.

---

## ⚠️ Common Mistakes

**Sai 1 — Trả 200 cho thao tác tạo mới**

```javascript
// SAI
res.json(course);

// ĐÚNG
res.status(201).location(`/api/v1/courses/${course.id}`).json(course);
```

**Sai 2 — Lấy ID người dùng từ body**

```javascript
// SAI: ai cũng tạo được khoá học đứng tên người khác
const course = await repository.create({ ...req.body, mentorId: req.body.mentorId });

// ĐÚNG
const course = await repository.create({ ...data, mentorId: req.user.id });
```

**Sai 3 — Kiểm tra tồn tại nhưng quên kiểm tra quyền**

Tìm thấy khoá học không có nghĩa là người gọi được sửa nó.

**Sai 4 — Dùng `if (req.body.field)` trong PATCH**

Chuỗi rỗng, số `0` và `false` đều là falsy. Client không xoá được mô tả, không đặt được giá bằng 0.

**Sai 5 — Trả về toàn bộ bảng, không phân trang**

Lúc phát triển có 20 bản ghi nên chạy nhanh. Lên production với 200.000 bản ghi thì endpoint đó làm sập server.

**Sai 6 — Đếm và lấy dữ liệu tuần tự**

```javascript
// Chậm gấp đôi không cần thiết
const items = await repository.findMany(...);
const total = await repository.count(...);

// ĐÚNG
const [items, total] = await Promise.all([...]);
```

---

## 📋 Summary

- Một tài nguyên REST có năm endpoint: danh sách, chi tiết, tạo, sửa, xoá.
- Tách route / controller / repository — ranh giới đáng giữ nhất là giữa khai báo route và truy vấn dữ liệu.
- `POST` trả 201 kèm `Location`; `DELETE` trả 204 với thân rỗng.
- Phân trang phải có trần cho `limit` và trả kèm `meta` để client vẽ được giao diện.
- Luôn kiểm tra quyền sau khi tìm thấy tài nguyên, và luôn lấy danh tính từ token chứ không từ body.

---

## 📝 Quiz

### Question 1

Vì sao đoạn PATCH dưới đây không cho phép client xoá mô tả bằng cách gửi `description: ""`?

```javascript
if (req.body.description) patch.description = req.body.description;
```

A. Vì `req.body` ở Express 5 là chỉ đọc.

B. Vì chuỗi rỗng là giá trị falsy nên điều kiện không bao giờ đúng.

C. Vì PATCH không được phép gửi chuỗi rỗng theo chuẩn HTTP.

D. Vì phải dùng `req.body.get('description')`.

**Answer: B**

**Giải thích:** `""` là falsy, cũng như `0` và `false`. Muốn phân biệt "không gửi trường này" với "gửi giá trị rỗng", phải kiểm tra `req.body.description !== undefined`.

---

### Question 2

Mã trạng thái nào đúng cho một endpoint `DELETE` xoá thành công và không trả về nội dung?

A. `200` kèm body `{ "success": true }`

B. `201` kèm header `Location`

C. `204` với thân rỗng, gửi bằng `res.status(204).end()`

D. `202` kèm body chứa bản ghi vừa xoá

**Answer: C**

**Giải thích:** `204 No Content` nghĩa là thao tác thành công và cố tình không có thân phản hồi. Phải dùng `res.status(204).end()` chứ không phải `res.json()` — gửi kèm body sẽ mâu thuẫn với chính mã trạng thái đó.
