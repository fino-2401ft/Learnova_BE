---
id: express-m3-l3
course: Express.js
module: REST API
title: Validation và mã trạng thái
order: 3
difficulty: Intermediate
estimatedTime: 50
---

# Validation và mã trạng thái

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Chọn đúng mã trạng thái HTTP cho từng tình huống.
- Kiểm tra dữ liệu đầu vào bằng schema thay vì bằng chuỗi `if`.
- Thiết kế một hình dạng lỗi thống nhất cho toàn API.
- Phân biệt 400, 401, 403, 404, 409 và 422.

---

## 📖 Definition

Mã trạng thái là thứ **đầu tiên** client đọc. Chọn sai mã thì client phải mò trong body mới biết chuyện gì xảy ra, và mọi thư viện HTTP đều xử lý sai.

Nhóm quan trọng nhất là 4xx — lỗi do phía gọi:

| Mã | Tên | Dùng khi |
|---|---|---|
| `400` | Bad Request | Dữ liệu sai định dạng, thiếu trường bắt buộc |
| `401` | Unauthorized | Chưa đăng nhập, hoặc token sai/hết hạn |
| `403` | Forbidden | Đã biết bạn là ai, nhưng bạn không có quyền |
| `404` | Not Found | Không có tài nguyên đó |
| `409` | Conflict | Xung đột trạng thái: trùng email, xoá bản ghi đang được tham chiếu |
| `422` | Unprocessable Content | Cú pháp đúng nhưng nghiệp vụ không chấp nhận |
| `429` | Too Many Requests | Vượt giới hạn tần suất |

**401 và 403 là cặp hay bị nhầm nhất.** Cách nhớ: 401 nghĩa là *"tôi không biết bạn là ai"* — đăng nhập rồi thử lại có thể được. 403 nghĩa là *"tôi biết bạn là ai, và câu trả lời là không"* — đăng nhập lại cũng vô ích.

---

## ⚙️ Syntax

```javascript
res.status(400).json({ code: 'VALIDATION_FAILED', message: '...' });
res.status(401).json({ code: 'UNAUTHORIZED', message: '...' });
res.status(403).json({ code: 'FORBIDDEN', message: '...' });
res.status(404).json({ code: 'NOT_FOUND', message: '...' });
res.status(409).json({ code: 'EMAIL_TAKEN', message: '...' });
```

### Example 1 - Validation viết tay và giới hạn của nó

```javascript
function validateCreateCourse(body) {
  const errors = [];

  if (!body.title) errors.push('title là bắt buộc');
  else if (body.title.length < 3) errors.push('title phải có ít nhất 3 ký tự');
  else if (body.title.length > 200) errors.push('title không được quá 200 ký tự');

  if (body.level && !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(body.level)) {
    errors.push('level không hợp lệ');
  }

  return errors;
}
```

Cách này chạy được nhưng không mở rộng nổi. Mười trường là ba mươi dòng `if`, và không có gì bảo đảm bạn không quên một trường.

### Example 2 - Validation bằng schema với Zod

```bash
npm install zod
```

```javascript
const { z } = require('zod');

const createCourseSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
});
```

Schema vừa là tài liệu vừa là code kiểm tra. Đọc nó là biết endpoint nhận gì, không cần đọc thân hàm.

### Example 3 - Middleware validation dùng chung

```javascript
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Dữ liệu gửi lên không hợp lệ',
      // Mỗi trường sai một dòng, để giao diện gắn được lỗi vào đúng ô nhập.
      details: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Gán lại bằng dữ liệu ĐÃ chuẩn hoá: trim đã chạy, mặc định đã điền.
  req.body = result.data;
  next();
};

router.post('/courses', validate(createCourseSchema), controller.create);
```

Dùng `safeParse` chứ không `parse`: `parse` ném exception, còn `safeParse` trả về kết quả để mình tự quyết định.

Chi tiết đáng giá nhất là dòng `req.body = result.data`. Sau middleware này, controller nhận dữ liệu đã sạch — đã cắt khoảng trắng, đã điền giá trị mặc định, đã loại bỏ trường lạ.

### Example 4 - Hình dạng lỗi thống nhất

```javascript
// Mọi phản hồi lỗi trong toàn API đều có đúng hình dạng này.
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "Dữ liệu gửi lên không hợp lệ",
  "details": [
    { "field": "title", "message": "String must contain at least 3 character(s)" }
  ],
  "path": "/api/v1/courses",
  "timestamp": "2026-08-23T10:15:03.117Z"
}
```

Client rẽ nhánh theo `code` — chuỗi ổn định. `message` là chữ cho người đọc và có thể đổi bất cứ lúc nào, kể cả đổi ngôn ngữ. Viết `if (error.message === 'Không tìm thấy')` là code sẽ gãy vào ngày ai đó sửa chính tả.

### Example 5 - Chọn mã trạng thái theo tình huống

```javascript
// 400 — cú pháp sai
if (!Number.isInteger(id)) {
  throw new AppError(400, 'VALIDATION_FAILED', 'id phải là số nguyên');
}

// 401 — chưa xác thực
if (!req.user) {
  throw new AppError(401, 'UNAUTHORIZED', 'Cần đăng nhập để tiếp tục');
}

// 403 — đã xác thực nhưng không đủ quyền
if (course.mentorId !== req.user.id) {
  throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền sửa khoá học này');
}

// 404 — không tồn tại
if (!course) {
  throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy khoá học');
}

// 409 — xung đột trạng thái
if (await emailExists(email)) {
  throw new AppError(409, 'EMAIL_TAKEN', 'Email này đã được đăng ký');
}

// 422 — cú pháp đúng, nghiệp vụ từ chối
if (course.status !== 'PENDING_APPROVAL') {
  throw new AppError(422, 'INVALID_STATE', 'Chỉ duyệt được khoá đang chờ duyệt');
}
```

---

## 📌 Notes

- **Ở Express 5, `res.status()` chỉ nhận số nguyên 100–999** và ném lỗi nếu ngoài khoảng. Ở v4 nó âm thầm bỏ qua.
- **Trả 404 thay vì 403 khi không muốn lộ sự tồn tại** của tài nguyên. Trả 403 là đã xác nhận "thứ đó có tồn tại".
- **Validate trước khi chạm database.** Một chuỗi rác không đáng để tốn một round-trip.
- **Không tin bất cứ thứ gì từ client**, kể cả khi frontend đã kiểm tra. Kiểm tra ở frontend là để trải nghiệm; kiểm tra ở backend mới là để đúng.
- `2xx` là thành công, `3xx` là chuyển hướng, `4xx` là lỗi của caller, `5xx` là lỗi của bạn.

---

## 🌍 Real World Example

Endpoint đăng ký hoàn chỉnh với validation và đủ các mã trạng thái:

```javascript
const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  username: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Chỉ gồm chữ, số, dấu chấm, gạch dưới và gạch nối'),
  password: z
    .string()
    // bcrypt cắt âm thầm mọi thứ vượt 72 byte, nên phải chặn ngay từ đây.
    .min(8)
    .max(72)
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Cần chữ thường, chữ hoa và chữ số'),
});

router.post('/auth/register', validate(registerSchema), async (req, res) => {
  const { email, username, password } = req.body; // đã chuẩn hoá

  if (await userRepository.existsByEmail(email)) {
    throw new AppError(409, 'EMAIL_TAKEN', 'Email này đã được đăng ký');
  }

  if (await userRepository.existsByUsername(username)) {
    throw new AppError(409, 'USERNAME_TAKEN', 'Tên đăng nhập này đã có người dùng');
  }

  const user = await userRepository.create({
    email,
    username,
    passwordHash: await hashPassword(password),
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    username: user.username,
  });
});
```

Phản hồi 201 cố tình **không** chứa `passwordHash`, `isActive` hay bất kỳ trường nội bộ nào. Trả nguyên object từ database ra ngoài là cách rò rỉ dữ liệu phổ biến nhất — và nguy hiểm ở chỗ nó không gây lỗi gì cả, nên không ai phát hiện.

Hai lần kiểm tra trùng dữ liệu tách riêng để client biết chính xác trường nào bị trùng, thay vì nhận một câu chung chung "dữ liệu đã tồn tại".

---

## ⚠️ Common Mistakes

**Sai 1 — Trả 200 cho mọi thứ**

```javascript
// SAI: client phải đọc body mới biết thành công hay không
res.status(200).json({ success: false, message: 'Không tìm thấy' });
```

**Sai 2 — Nhầm 401 với 403**

- Chưa đăng nhập → `401`.
- Đã đăng nhập nhưng không đủ quyền → `403`.

Trả 403 cho người chưa đăng nhập khiến client không biết nên đưa họ tới trang đăng nhập.

**Sai 3 — Trả nguyên object database ra ngoài**

```javascript
// SAI: lộ passwordHash, internalNotes, deletedAt...
res.json(user);

// ĐÚNG: chọn đúng trường cần trả
res.json({ id: user.id, email: user.email, username: user.username });
```

**Sai 4 — Chỉ validate ở frontend**

Bất kỳ ai cũng gọi thẳng API bằng `curl`. Frontend kiểm tra để người dùng đỡ khó chịu; backend kiểm tra để dữ liệu đúng.

**Sai 5 — Rẽ nhánh theo `message` thay vì `code`**

```javascript
// SAI: gãy ngay khi ai đó sửa chính tả hoặc đổi ngôn ngữ
if (error.message === 'Không tìm thấy khoá học') { }

// ĐÚNG
if (error.code === 'NOT_FOUND') { }
```

**Sai 6 — Thông báo lỗi tiết lộ quá nhiều**

```javascript
// SAI: biến endpoint đăng nhập thành công cụ dò email có tồn tại hay không
if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Email này chưa đăng ký');
if (!match) throw new AppError(401, 'WRONG_PASSWORD', 'Sai mật khẩu');

// ĐÚNG: một thông báo chung cho cả hai trường hợp
throw new AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
```

---

## 📋 Summary

- Mã trạng thái là thứ đầu tiên client đọc — chọn sai là buộc client phải mò trong body.
- 401 = "không biết bạn là ai"; 403 = "biết rồi, nhưng không được phép".
- Validation bằng schema (Zod, Joi) thay cho chuỗi `if`: vừa ngắn hơn, vừa là tài liệu sống.
- Gán `req.body = result.data` để controller luôn nhận dữ liệu đã chuẩn hoá.
- Một hình dạng lỗi duy nhất cho toàn API, và client rẽ nhánh theo `code` chứ không theo `message`.
- Không bao giờ trả nguyên object database ra ngoài; chọn đúng trường cần trả.

---

## 📝 Quiz

### Question 1

Người dùng đã đăng nhập hợp lệ, nhưng cố sửa khoá học của người khác. Mã trạng thái nào đúng?

A. `401 Unauthorized`

B. `403 Forbidden`

C. `400 Bad Request`

D. `409 Conflict`

**Answer: B**

**Giải thích:** `401` dành cho trường hợp server chưa xác định được danh tính — thiếu token, token sai hoặc hết hạn. Ở đây danh tính đã rõ, chỉ là người này không có quyền với tài nguyên đó, nên đúng mã là `403`. Đăng nhập lại cũng không giải quyết được gì.

---

### Question 2

Vì sao endpoint đăng nhập nên trả cùng một lỗi `INVALID_CREDENTIALS` cho cả hai trường hợp sai email và sai mật khẩu?

A. Để tiết kiệm băng thông.

B. Vì chuẩn HTTP quy định như vậy.

C. Vì phân biệt hai trường hợp sẽ biến endpoint thành công cụ dò xem email nào có trong hệ thống.

D. Vì Express không phân biệt được hai loại lỗi này.

**Answer: C**

**Giải thích:** Trả `USER_NOT_FOUND` riêng và `WRONG_PASSWORD` riêng cho phép kẻ tấn công thử hàng loạt email để lọc ra danh sách tài khoản có thật — dữ liệu đó dùng cho lừa đảo hoặc dò mật khẩu. Ngoài thông báo giống nhau, còn nên cho hai nhánh tốn thời gian như nhau, vì chênh lệch thời gian phản hồi cũng tiết lộ đúng thông tin đó.
