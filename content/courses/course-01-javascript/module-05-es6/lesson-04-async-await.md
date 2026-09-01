---
id: js-m5-l4
course: JavaScript Fundamentals
module: ES6+
title: async và await
order: 4
difficulty: Intermediate
estimatedTime: 35
---

# async và await

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Viết hàm bất đồng bộ bằng `async`/`await`.
- Xử lý lỗi bằng `try/catch` thay vì `.catch()`.
- Giữ được tính song song khi dùng `await`.
- Tránh những cái bẫy phổ biến: `await` trong `forEach`, `await` thừa.

---

## 📖 Definition

`async`/`await` là **cú pháp** viết trên nền Promise, không phải cơ chế mới. Nó cho phép viết code bất đồng bộ trông như code đồng bộ.

Hai quy tắc:

- **`async` trước một hàm** khiến hàm đó luôn trả về Promise. `return 5` thành `Promise.resolve(5)`; `throw` thành Promise bị reject.
- **`await` trước một Promise** tạm dừng hàm cho tới khi Promise xong, rồi trả về giá trị của nó.

`await` chỉ dùng được bên trong hàm `async`, hoặc ở cấp cao nhất của một ES Module (top-level await).

---

## ⚙️ Syntax

```javascript
async function f() {
  const value = await promise;
  return value;
}

// Arrow function
const g = async () => await promise;

// try/catch thay cho .catch()
async function h() {
  try {
    return await risky();
  } catch (error) {
    console.error(error);
  } finally {
    cleanup();
  }
}
```

### Example 1 - Chuyển từ Promise sang async/await

```javascript
// Với .then()
function loadCourse(id) {
  return fetch(`/api/courses/${id}`)
    .then((res) => res.json())
    .then((course) => fetch(`/api/mentors/${course.mentorId}`))
    .then((res) => res.json())
    .catch((error) => console.error(error));
}

// Với async/await — đọc từ trên xuống như code đồng bộ
async function loadCourse(id) {
  try {
    const courseRes = await fetch(`/api/courses/${id}`);
    const course = await courseRes.json();

    const mentorRes = await fetch(`/api/mentors/${course.mentorId}`);
    return await mentorRes.json();
  } catch (error) {
    console.error(error);
  }
}
```

Ở đây `await` tuần tự là **đúng**, vì phải có `course.mentorId` mới gọi được request thứ hai.

### Example 2 - Hàm async luôn trả về Promise

```javascript
async function f() {
  return 5;
}

console.log(f());        // Promise { 5 }, không phải 5
console.log(await f());  // 5

// Ném lỗi trong async = Promise bị reject
async function g() {
  throw new Error('hỏng');
}

g().catch(console.error); // bắt được như Promise bình thường
```

### Example 3 - Giữ tính song song

```javascript
// SAI: chậm gấp ba mà không có lý do
async function slow() {
  const users = await fetchUsers();     // đợi
  const courses = await fetchCourses(); // rồi mới đợi tiếp
  const stats = await fetchStats();
  return { users, courses, stats };
}

// ĐÚNG: khởi động cả ba rồi mới đợi
async function fast() {
  const [users, courses, stats] = await Promise.all([
    fetchUsers(),
    fetchCourses(),
    fetchStats(),
  ]);
  return { users, courses, stats };
}
```

Đây là lỗi hiệu năng phổ biến nhất khi dùng `async/await`: cú pháp trông như đồng bộ khiến người viết quên mất rằng các tác vụ vốn có thể chạy cùng lúc.

### Example 4 - Vòng lặp

```javascript
// SAI: forEach không đợi callback async
items.forEach(async (item) => {
  await process(item); // hàm ngoài chạy tiếp ngay, không chờ
});

// ĐÚNG: tuần tự — dùng khi thứ tự quan trọng hoặc cần giảm tải
for (const item of items) {
  await process(item);
}

// ĐÚNG: song song — dùng khi các phần tử độc lập
await Promise.all(items.map((item) => process(item)));

// Song song có giới hạn: 5 cái một lượt, tránh làm nghẽn database
for (let i = 0; i < items.length; i += 5) {
  await Promise.all(items.slice(i, i + 5).map(process));
}
```

### Example 5 - Xử lý lỗi

```javascript
// try/catch chỉ bắt được lỗi của Promise ĐƯỢC await
async function f() {
  try {
    doSomething(); // KHÔNG await -> lỗi lọt ra ngoài try/catch
  } catch (e) {
    // không bao giờ chạy
  }
}

// Bắt lỗi từng phần
async function g() {
  let user;

  try {
    user = await fetchUser();
  } catch {
    user = null; // lỗi ở đây chấp nhận được, dùng giá trị dự phòng
  }

  // Lỗi ở đây thì để nó nổi lên trên
  const courses = await fetchCourses();

  return { user, courses };
}
```

Có một chỗ `return await` đáng bàn:

```javascript
// return: Promise được trả thẳng ra, try/catch KHÔNG bắt được lỗi của nó
async function a() {
  try {
    return risky();
  } catch (e) {
    console.log('không bao giờ chạy');
  }
}

// return await: hàm đợi Promise xong nên bắt được lỗi
async function b() {
  try {
    return await risky();
  } catch (e) {
    console.log('bắt được');
  }
}
```

Ngoài trong `try/catch`, `return await` là thừa.

---

## 📌 Notes

- **`await` một giá trị không phải Promise** vẫn hợp lệ — nó bọc lại thành Promise đã hoàn thành.
- **Top-level await** dùng được trong ES Module, không dùng được trong CommonJS.
- **`await` không chặn luồng chính**; nó chỉ tạm dừng hàm chứa nó và trả quyền cho event loop.
- Express 5 tự bắt lỗi từ handler `async`; Express 4 thì không.

---

## 🌍 Real World Example

```javascript
/**
 * Nạp trang danh sách khoá học.
 *
 * Chia làm hai giai đoạn: những gì độc lập thì chạy song song, những gì phụ
 * thuộc kết quả trước thì mới đợi tuần tự.
 */
async function listCourses(req, res) {
  const { page, limit, skip } = normalizePagination(req.query);
  const where = { status: 'PUBLISHED' };

  // Giai đoạn 1: hai truy vấn độc lập -> song song
  const [courses, total] = await Promise.all([
    repository.findMany({ where, skip, take: limit }),
    repository.count({ where }),
  ]);

  // Giai đoạn 2: cần danh sách id từ giai đoạn 1 -> buộc phải tuần tự
  const enrolledIds = req.user
    ? await repository.findEnrolledIds(req.user.id, courses.map((c) => c.courseId))
    : [];

  const enrolled = new Set(enrolledIds);

  res.json({
    data: courses.map((c) => ({ ...toDto(c), enrolled: enrolled.has(c.courseId) })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
```

```javascript
/**
 * Import khoá học theo lô có giới hạn.
 *
 * Không dùng Promise.all trên toàn bộ danh sách: 100 khoá học nghĩa là 100 kết
 * nối database mở cùng lúc, vượt xa kích thước connection pool và làm mọi request
 * khác phải xếp hàng.
 */
async function importAll(courseDirs, concurrency = 3) {
  const results = [];

  for (let i = 0; i < courseDirs.length; i += concurrency) {
    const batch = courseDirs.slice(i, i + concurrency);
    results.push(...(await Promise.all(batch.map(importOne))));
  }

  return results;
}
```

Ví dụ thứ hai minh hoạ điều mà "song song hoá tối đa" hay bỏ qua: song song không phải lúc nào cũng tốt hơn. Giới hạn số việc chạy đồng thời thường là lựa chọn đúng khi tài nguyên phía sau có hạn.

---

## ⚠️ Common Mistakes

**Sai 1 — `await` tuần tự những thứ độc lập**

Lỗi hiệu năng phổ biến nhất.

**Sai 2 — `await` trong `forEach`**

`forEach` bỏ qua Promise mà callback trả về.

**Sai 3 — Quên `await`**

```javascript
const user = fetchUser();   // Promise, không phải user
console.log(user.name);     // undefined
```

**Sai 4 — `try/catch` quanh lời gọi không có `await`**

Lỗi lọt ra ngoài khối `try`.

**Sai 5 — `Promise.all` trên danh sách rất lớn**

Mở hàng nghìn kết nối cùng lúc. Chia lô.

**Sai 6 — Nghĩ `await` chặn cả server**

Nó chỉ tạm dừng hàm hiện tại; event loop vẫn phục vụ request khác.

---

## 📋 Summary

- `async`/`await` là cú pháp viết trên nền Promise, không thay thế Promise.
- Hàm `async` luôn trả về Promise; `throw` bên trong tương đương Promise bị reject.
- `await` tuần tự chỉ đúng khi bước sau cần kết quả bước trước — còn lại dùng `Promise.all`.
- `forEach` không đợi callback `async`; dùng `for...of` cho tuần tự hoặc `Promise.all` cho song song.
- `try/catch` chỉ bắt được lỗi của Promise có `await`; `return await` cần thiết khi ở trong `try`.

---

## 📝 Quiz

### Question 1

`console.log(f())` in ra gì?

```javascript
async function f() {
  return 5;
}
```

A. `5`

B. `Promise { 5 }` — hàm `async` luôn trả về Promise, dù thân hàm trả về giá trị thường.

C. `undefined`

D. Ném lỗi vì thiếu `await`.

**Answer: B**

**Giải thích:** Từ khoá `async` bọc giá trị trả về vào một Promise đã hoàn thành. Muốn lấy `5` phải `await f()` hoặc `f().then(...)`. Đây cũng là lý do quên `await` khi gọi hàm `async` cho ra một Promise thay vì dữ liệu, và mọi truy cập thuộc tính sau đó đều `undefined`.

---

### Question 2

Vì sao `try/catch` trong hàm sau không bắt được lỗi?

```javascript
async function f() {
  try {
    return risky(); // risky() là hàm async
  } catch (e) {
    console.log('bắt được');
  }
}
```

A. Vì `risky()` phải được khai báo bằng `function` thường.

B. Vì không có `await`, Promise được trả thẳng ra ngoài trước khi nó reject — lúc đó hàm đã kết thúc và khối `try` không còn hiệu lực.

C. Vì `try/catch` không hoạt động trong hàm `async`.

D. Vì thiếu khối `finally`.

**Answer: B**

**Giải thích:** `return risky()` chuyển quyền sở hữu Promise cho người gọi ngay lập tức; hàm `f` kết thúc trước khi Promise đó có kết quả. Viết `return await risky()` buộc hàm đợi kết quả **bên trong** khối `try`, nhờ đó `catch` bắt được. Đây là ngoại lệ duy nhất mà `return await` không thừa.
