---
id: js-m5-l3
course: JavaScript Fundamentals
module: ES6+
title: Promise
order: 3
difficulty: Intermediate
estimatedTime: 35
---

# Promise

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Giải thích ba trạng thái của Promise.
- Tạo và tiêu thụ Promise bằng `then`, `catch`, `finally`.
- Chạy nhiều tác vụ song song bằng `Promise.all` và các biến thể.
- Tránh callback hell và các lỗi nuốt lỗi.

---

## 📖 Definition

**Promise** là một object đại diện cho kết quả của một tác vụ **sẽ hoàn thành trong tương lai** — thành công hoặc thất bại.

Nó có đúng ba trạng thái, và chỉ chuyển đổi **một lần duy nhất**:

| Trạng thái | Ý nghĩa |
|---|---|
| `pending` | Đang chờ, chưa xong |
| `fulfilled` | Xong, có giá trị |
| `rejected` | Hỏng, có lý do |

Đã chuyển sang `fulfilled` hoặc `rejected` thì không quay lại được. Vì vậy `resolve()` gọi lần thứ hai không có tác dụng gì.

Promise ra đời để thay callback lồng nhau. Với callback, xử lý lỗi phải lặp lại ở mọi tầng; với Promise, một `.catch()` ở cuối bắt được lỗi của cả chuỗi.

---

## ⚙️ Syntax

```javascript
const p = new Promise((resolve, reject) => {
  if (thanhCong) resolve(giaTri);
  else reject(new Error('lý do'));
});

p.then((value) => {})
  .catch((error) => {})
  .finally(() => {});
```

### Example 1 - Tạo Promise

```javascript
function doiGiay(giay) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(`Đã đợi ${giay} giây`), giay * 1000);
  });
}

doiGiay(1).then(console.log); // sau 1 giây: 'Đã đợi 1 giây'
```

Thường bạn **không cần** tự tạo Promise: `fetch`, Prisma, `fs.promises` đều đã trả về Promise sẵn. Chỉ tự tạo khi cần bọc một API dùng callback.

```javascript
// Bọc API callback thành Promise
function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
```

### Example 2 - Nối chuỗi

```javascript
fetch('/api/courses/1')
  .then((res) => res.json())          // trả về Promise -> chuỗi đợi tiếp
  .then((course) => {
    console.log(course.title);
    return fetch(`/api/mentors/${course.mentorId}`);
  })
  .then((res) => res.json())
  .then((mentor) => console.log(mentor.username))
  .catch((error) => console.error('Hỏng ở đâu đó trong chuỗi:', error))
  .finally(() => console.log('Xong, dù thành công hay thất bại'));
```

Điểm mạnh: một `.catch()` duy nhất bắt lỗi của **mọi** bước phía trên. Với callback lồng nhau, mỗi tầng phải tự kiểm tra `if (err)`.

Giá trị `return` trong `.then()` trở thành đầu vào của `.then()` kế tiếp. Trả về Promise thì chuỗi tự đợi nó xong.

### Example 3 - Chạy song song

```javascript
// TUẦN TỰ: tổng thời gian = 1 + 2 + 3 = 6 giây
const a = await doiGiay(1);
const b = await doiGiay(2);
const c = await doiGiay(3);

// SONG SONG: tổng thời gian = 3 giây (cái lâu nhất)
const [x, y, z] = await Promise.all([doiGiay(1), doiGiay(2), doiGiay(3)]);
```

Chỉ dùng tuần tự khi bước sau **thật sự cần** kết quả của bước trước. Rất nhiều đoạn code chậm chỉ vì `await` lần lượt những thứ vốn độc lập.

### Example 4 - Bốn biến thể của Promise

```javascript
// all: tất cả thành công -> mảng kết quả; MỘT cái hỏng -> hỏng cả cụm
const [users, courses] = await Promise.all([fetchUsers(), fetchCourses()]);

// allSettled: KHÔNG bao giờ reject, trả trạng thái của từng cái
const results = await Promise.allSettled([fetchA(), fetchB()]);
// [{ status: 'fulfilled', value }, { status: 'rejected', reason }]

// race: lấy cái XONG TRƯỚC, dù thành công hay thất bại
const fastest = await Promise.race([fetchFromCdn(), fetchFromOrigin()]);

// any: lấy cái THÀNH CÔNG đầu tiên, bỏ qua những cái hỏng
const first = await Promise.any([mirror1(), mirror2(), mirror3()]);
```

Chọn thế nào:

- Cần **tất cả** mới làm tiếp được → `all`.
- Muốn biết cái nào hỏng nhưng vẫn xử lý phần còn lại → `allSettled`.
- Cần timeout → `race`.

```javascript
// Timeout bằng Promise.race
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Quá thời gian chờ')), ms),
  );
  return Promise.race([promise, timeout]);
}

await withTimeout(fetch('/api/slow'), 5000);
```

### Example 5 - Xử lý lỗi

```javascript
// .catch() ở giữa chuỗi bắt lỗi rồi cho chuỗi chạy tiếp
fetch('/api/a')
  .then((res) => res.json())
  .catch(() => ({ fallback: true })) // bắt lỗi, trả giá trị dự phòng
  .then((data) => console.log(data)); // vẫn chạy

// fetch KHÔNG reject với mã lỗi HTTP — phải tự kiểm tra
fetch('/api/khong-ton-tai')
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .catch(console.error);
```

`fetch` chỉ reject khi **không kết nối được**. Nhận về 404 hay 500 vẫn là "thành công" theo cách nhìn của nó.

---

## 📌 Notes

- **Promise chạy ngay khi được tạo**, không đợi `.then()`.
- **Không `.catch()` thì lỗi thành unhandled rejection** — Node phiên bản mới sẽ kết thúc tiến trình.
- **`.finally()` không nhận đối số** và không đổi giá trị đi qua nó.
- **Callback trong `new Promise` chạy đồng bộ**; chỉ `.then()` mới là bất đồng bộ.
- Promise được xếp vào microtask queue, chạy trước `setTimeout`.

---

## 🌍 Real World Example

```javascript
/**
 * Nạp dữ liệu cho trang chi tiết khoá học.
 *
 * Ba truy vấn độc lập nhau nên chạy song song. Viết tuần tự thì thời gian phản
 * hồi bằng tổng ba lượt đi database thay vì lượt lâu nhất.
 */
async function loadCoursePage(courseId, userId) {
  const [course, chapters, enrollment] = await Promise.all([
    repository.findCourse(courseId),
    repository.findChapters(courseId),
    repository.findEnrollment(courseId, userId),
  ]);

  if (!course) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy khoá học');

  return { course, chapters, enrolled: Boolean(enrollment) };
}
```

```javascript
/**
 * Gửi email cho nhiều học viên.
 *
 * Dùng allSettled chứ không all: một địa chỉ email hỏng không được phép làm
 * hỏng cả đợt gửi. Sau đó ghi log riêng những trường hợp thất bại.
 */
async function notifyStudents(students, message) {
  const results = await Promise.allSettled(
    students.map((s) => emailService.send(s.email, message)),
  );

  const failed = results
    .map((r, i) => ({ result: r, student: students[i] }))
    .filter(({ result }) => result.status === 'rejected');

  if (failed.length > 0) {
    logger.warn(`Gửi thất bại ${failed.length}/${students.length}`, {
      emails: failed.map(({ student }) => student.email),
    });
  }

  return { sent: results.length - failed.length, failed: failed.length };
}
```

Đây là chỗ khác biệt giữa `all` và `allSettled` trở nên rõ ràng: với `all`, một email sai định dạng sẽ khiến 99 email còn lại không bao giờ được gửi.

---

## ⚠️ Common Mistakes

**Sai 1 — `await` tuần tự những thứ độc lập**

```javascript
// 3 lượt chờ nối tiếp
const a = await fetchA();
const b = await fetchB();

// 1 lượt chờ
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

**Sai 2 — Quên `.catch()`**

Unhandled rejection; ở Node mới thì tiến trình chết.

**Sai 3 — Nghĩ `fetch` reject khi gặp lỗi HTTP**

```javascript
const res = await fetch(url);
if (!res.ok) throw new Error(`HTTP ${res.status}`); // phải tự kiểm tra
```

**Sai 4 — Quên `return` trong `.then()`**

```javascript
.then((res) => { res.json(); })   // trả về undefined
.then((res) => res.json())        // đúng
```

**Sai 5 — Tạo Promise bọc quanh thứ vốn đã là Promise**

```javascript
// Thừa
return new Promise((resolve) => fetch(url).then(resolve));

// Đủ
return fetch(url);
```

---

## 📋 Summary

- Promise có ba trạng thái và chỉ chuyển đổi một lần: `pending` → `fulfilled` hoặc `rejected`.
- Một `.catch()` ở cuối chuỗi bắt lỗi của mọi bước phía trên — đó là lợi thế lớn nhất so với callback.
- `Promise.all` cần tất cả thành công; `allSettled` không bao giờ reject; `race` lấy cái xong trước; `any` lấy cái thành công đầu tiên.
- Chỉ `await` tuần tự khi bước sau thật sự cần kết quả bước trước.
- `fetch` chỉ reject khi không kết nối được — mã 404 và 500 vẫn là "thành công".

---

## 📝 Quiz

### Question 1

Đoạn nào chạy nhanh hơn, và nhanh hơn bao nhiêu?

```javascript
// A
const x = await doiGiay(1);
const y = await doiGiay(2);

// B
const [x, y] = await Promise.all([doiGiay(1), doiGiay(2)]);
```

A. A nhanh hơn vì không phải tạo mảng.

B. B nhanh hơn: A mất 3 giây (1 + 2) còn B mất 2 giây (thời gian của tác vụ lâu nhất).

C. Cả hai như nhau vì JavaScript chạy đơn luồng.

D. B chậm hơn vì phải chờ cả hai cùng xong.

**Answer: B**

**Giải thích:** `await` tuần tự bắt tác vụ thứ hai đợi tác vụ thứ nhất kết thúc, dù chúng không liên quan gì tới nhau. `Promise.all` khởi động cả hai ngay lập tức nên tổng thời gian bằng tác vụ lâu nhất. JavaScript đơn luồng nhưng tác vụ I/O chờ bên ngoài, nên chạy song song hoàn toàn có ý nghĩa.

---

### Question 2

`fetch('/api/khong-ton-tai')` nhận về 404. Điều gì xảy ra?

A. Promise bị reject và `.catch()` chạy.

B. Promise **fulfilled** bình thường với `res.ok === false` — `fetch` chỉ reject khi không kết nối được tới server.

C. `fetch` ném lỗi đồng bộ ngay lập tức.

D. Promise ở trạng thái pending mãi mãi.

**Answer: B**

**Giải thích:** Theo thiết kế, `fetch` coi mọi phản hồi HTTP nhận được là thành công — kể cả 404 hay 500 — vì nó đã hoàn thành đúng việc của mình là gửi và nhận. Nó chỉ reject khi lỗi mạng, DNS hỏng hoặc bị CORS chặn. Vì vậy luôn phải tự kiểm tra `res.ok` và ném lỗi nếu cần.
