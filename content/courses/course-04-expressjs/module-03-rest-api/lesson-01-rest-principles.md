---
id: express-m3-l1
course: Express.js
module: REST API
title: Nguyên tắc thiết kế REST
order: 1
difficulty: Intermediate
estimatedTime: 40
---

# Nguyên tắc thiết kế REST

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Đặt tên đường dẫn theo tài nguyên thay vì theo hành động.
- Chọn đúng phương thức HTTP cho từng thao tác.
- Giải thích tính idempotent và vì sao nó quan trọng.
- Thiết kế đường dẫn cho tài nguyên lồng nhau.

---

## 📖 Definition

**REST** là một kiểu kiến trúc, không phải một chuẩn có văn bản bắt buộc. Ý tưởng cốt lõi: mọi thứ trong hệ thống đều là **tài nguyên**, được định danh bằng URL, và thao tác lên tài nguyên đó thể hiện qua **phương thức HTTP**.

Hệ quả thực tế: **đường dẫn là danh từ, phương thức là động từ.**

```
SAI                              ĐÚNG
GET  /getAllCourses              GET    /courses
POST /createCourse               POST   /courses
POST /updateCourse?id=5          PUT    /courses/5
POST /deleteCourse?id=5          DELETE /courses/5
```

Khi đường dẫn đã chứa động từ, bạn sẽ nhanh chóng có `/getCourse`, `/getCourseById`, `/fetchCourse`, `/loadCourse` — bốn cái tên cho cùng một việc. Còn với REST, `GET /courses/5` chỉ có đúng một cách viết.

---

## ⚙️ Syntax

Bộ endpoint chuẩn cho một tài nguyên:

| Phương thức | Đường dẫn | Việc | Idempotent |
|---|---|---|---|
| `GET` | `/courses` | Danh sách | Có |
| `GET` | `/courses/:id` | Chi tiết một mục | Có |
| `POST` | `/courses` | Tạo mới | **Không** |
| `PUT` | `/courses/:id` | Thay thế toàn bộ | Có |
| `PATCH` | `/courses/:id` | Sửa một phần | Không bắt buộc |
| `DELETE` | `/courses/:id` | Xoá | Có |

**Idempotent** nghĩa là gọi một lần hay mười lần đều cho cùng một kết quả trên server. `DELETE /courses/5` gọi lại lần hai thì khoá học vẫn không tồn tại — trạng thái không đổi. Còn `POST /courses` gọi hai lần tạo ra **hai** khoá học.

Tính chất này không phải lý thuyết suông: nó quyết định thao tác nào an toàn để tự động thử lại khi mạng chập chờn.

### Example 1 - Tài nguyên lồng nhau

```javascript
// Chương thuộc về khoá học
router.get('/courses/:courseId/chapters', listChapters);
router.post('/courses/:courseId/chapters', createChapter);

// Bài học thuộc về chương
router.get('/chapters/:chapterId/lessons', listLessons);
```

Quy tắc thực dụng: **lồng tối đa một cấp**. `/courses/1/chapters/2/lessons/3/sections/4` vừa dài vừa khó bảo trì. Khi tài nguyên con đã có ID riêng duy nhất, cho nó truy cập trực tiếp:

```javascript
router.get('/lessons/:lessonId', getLesson);  // thay vì lồng ba cấp
```

### Example 2 - PUT và PATCH khác nhau ra sao

```javascript
// PUT — thay thế TOÀN BỘ. Trường không gửi lên sẽ bị xoá.
// PUT /courses/5  { "title": "NestJS", "level": "BEGINNER", "description": "..." }
router.put('/courses/:id', replaceCourse);

// PATCH — chỉ sửa trường được gửi. Phần còn lại giữ nguyên.
// PATCH /courses/5  { "title": "NestJS nâng cao" }
router.patch('/courses/:id', updateCourse);
```

Đa số API thực tế chỉ cần `PATCH`. `PUT` đòi client gửi lại toàn bộ object, và quên một trường nghĩa là xoá dữ liệu đó.

### Example 3 - Lọc, sắp xếp, phân trang qua query string

Đây là những thứ **không** phải tài nguyên riêng, nên đặt ở query string:

```
GET /courses?status=PUBLISHED&level=BEGINNER
GET /courses?sort=-publishedAt
GET /courses?page=2&limit=20
GET /courses?search=nestjs
```

```javascript
router.get('/courses', (req, res) => {
  const { status, level, search } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  res.json({
    data: findCourses({ status, level, search, page, limit }),
    meta: { page, limit, total: countCourses({ status, level, search }) },
  });
});
```

Trả kèm `meta` để client biết còn bao nhiêu trang — thiếu nó, giao diện phân trang không vẽ được.

### Example 4 - Khi hành động không ứng với CRUD

Không phải thao tác nào cũng nhét vừa khuôn CRUD. "Xuất bản một khoá học" không phải là tạo, cũng không hẳn là sửa. Hai cách chấp nhận được:

```javascript
// Cách 1: coi trạng thái là tài nguyên con
router.put('/courses/:id/status', changeStatus);  // body: { "status": "PUBLISHED" }

// Cách 2: endpoint hành động, đặt ở cấp tài nguyên con
router.post('/courses/:id/publish', publishCourse);
```

Cách 2 đi lệch khỏi REST thuần, nhưng nó nói rõ ý định và ai đọc cũng hiểu. Đừng cố ép mọi thứ vào CRUD tới mức API trở nên khó hiểu.

---

## 📌 Notes

- **Dùng danh từ số nhiều**: `/courses` chứ không `/course`. Nhất quán quan trọng hơn là chọn phương án nào.
- **Đường dẫn viết thường, nối bằng gạch nối**: `/meeting-rooms` chứ không `/meetingRooms`.
- **Gắn phiên bản ngay từ đầu**: `/api/v1/courses`. Thêm về sau khi đã có client đang chạy là rất phiền.
- **`GET` không được thay đổi dữ liệu.** Trình duyệt và proxy có thể gọi lại `GET` bất cứ lúc nào.
- Một tài nguyên có thể có nhiều đường dẫn hợp lệ; miễn là nhất quán trong toàn API.

---

## 🌍 Real World Example

Bộ endpoint của module khoá học trong Learnova:

```javascript
const express = require('express');

const router = express.Router();

// --- Khoá học ---
router.get('/courses', listCourses);              // ?status=&level=&search=&page=&limit=
router.get('/courses/:id', getCourse);
router.post('/courses', createCourse);            // chỉ MENTOR
router.patch('/courses/:id', updateCourse);       // chỉ chủ sở hữu
router.delete('/courses/:id', deleteCourse);

// --- Quy trình duyệt: hành động không ứng với CRUD ---
router.post('/courses/:id/submit', submitForApproval);  // MENTOR gửi duyệt
router.post('/courses/:id/approve', approveCourse);     // ADMIN duyệt
router.post('/courses/:id/reject', rejectCourse);       // ADMIN từ chối, kèm lý do

// --- Tài nguyên con: lồng đúng một cấp ---
router.get('/courses/:id/chapters', listChapters);
router.post('/courses/:id/chapters', createChapter);

// Chương đã có ID riêng nên truy cập thẳng, không lồng qua khoá học.
router.get('/chapters/:id/lessons', listLessons);
router.get('/lessons/:id', getLesson);

// --- Ghi danh: nhìn từ phía học viên ---
router.post('/courses/:id/enrollments', enroll);
router.get('/me/enrollments', listMyEnrollments);

module.exports = router;
```

Ba quyết định đáng chú ý: quy trình duyệt dùng endpoint hành động vì "duyệt" không phải là sửa dữ liệu thuần tuý; `chapters` truy cập trực tiếp thay vì lồng ba cấp; và `/me/enrollments` dùng `me` thay cho `:userId` — server tự lấy danh tính từ token, client không cần và cũng không nên tự khai mình là ai.

---

## ⚠️ Common Mistakes

**Sai 1 — Nhét động từ vào đường dẫn**

```
SAI:  POST /api/createNewCourse
ĐÚNG: POST /api/courses
```

**Sai 2 — Dùng `GET` cho thao tác thay đổi dữ liệu**

```
SAI:  GET /courses/5/delete
ĐÚNG: DELETE /courses/5
```

Trình duyệt prefetch link, proxy cache lại `GET`. Một ngày đẹp trời dữ liệu tự biến mất.

**Sai 3 — Trả về 200 cho mọi trường hợp**

```javascript
// SAI: client buộc phải đọc body mới biết thành công hay thất bại
res.status(200).json({ success: false, message: 'Không tìm thấy' });
```

**Sai 4 — Lồng tài nguyên quá sâu**

`/courses/1/chapters/2/lessons/3/quiz/4/options/5` — không ai muốn viết client cho API này.

**Sai 5 — Nhận `userId` từ client**

```
SAI:  GET /users/:userId/enrollments   (client tự khai mình là ai → xem được dữ liệu người khác)
ĐÚNG: GET /me/enrollments              (server lấy danh tính từ token)
```

---

## 📋 Summary

- Đường dẫn là danh từ số nhiều, phương thức HTTP là động từ.
- `GET` và `DELETE` idempotent, `POST` thì không — điều này quyết định thao tác nào an toàn để tự động thử lại.
- `PUT` thay thế toàn bộ, `PATCH` sửa một phần; phần lớn API thực tế chỉ cần `PATCH`.
- Lọc, sắp xếp, phân trang thuộc về query string, không phải đường dẫn.
- Lồng tối đa một cấp; hành động không ứng với CRUD thì dùng endpoint riêng thay vì bẻ cong mô hình.

---

## 📝 Quiz

### Question 1

Endpoint nào **không** idempotent?

A. `DELETE /courses/5`

B. `GET /courses/5`

C. `POST /courses`

D. `PUT /courses/5`

**Answer: C**

**Giải thích:** `POST /courses` gọi hai lần sẽ tạo ra hai khoá học khác nhau, nên trạng thái server thay đổi theo số lần gọi. `DELETE` gọi lại vẫn cho kết quả "khoá học không tồn tại", `PUT` ghi đè cùng một nội dung, `GET` không đổi gì cả. Đây là lý do client chỉ được tự động thử lại `GET`, `PUT`, `DELETE` chứ không được thử lại `POST`.

---

### Question 2

Vì sao nên thiết kế `GET /me/enrollments` thay vì `GET /users/:userId/enrollments`?

A. Vì đường dẫn ngắn hơn nên request nhanh hơn.

B. Vì với `:userId`, client tự khai mình là ai — nếu server không kiểm tra kỹ, đổi số trong URL là xem được dữ liệu người khác.

C. Vì Express không hỗ trợ tham số động ở giữa đường dẫn.

D. Vì REST cấm dùng ID người dùng trong đường dẫn.

**Answer: B**

**Giải thích:** Với `/me`, danh tính lấy từ access token nên client không thể mạo nhận. Còn dạng `:userId` mở ra lỗ hổng IDOR (Insecure Direct Object Reference): quên một lần kiểm tra quyền là bất kỳ ai cũng đổi số trong URL để đọc dữ liệu người khác.
