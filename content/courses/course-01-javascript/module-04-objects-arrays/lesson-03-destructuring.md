---
id: js-m4-l3
course: JavaScript Fundamentals
module: Objects & Arrays
title: Destructuring
order: 3
difficulty: Beginner
estimatedTime: 30
---

# Destructuring

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Bóc tách giá trị từ object và mảng vào biến riêng.
- Đặt tên mới và giá trị mặc định khi bóc tách.
- Bóc tách trong tham số hàm.
- Tránh lỗi khi bóc tách từ `undefined`.

---

## 📖 Definition

**Destructuring** là cú pháp lấy giá trị từ object hoặc mảng ra thành các biến riêng, thay vì gán từng dòng.

```javascript
// Không destructuring
const name = user.name;
const email = user.email;
const role = user.role;

// Có destructuring
const { name, email, role } = user;
```

Với object thì khớp theo **tên khoá**; với mảng thì khớp theo **vị trí**.

---

## ⚙️ Syntax

```javascript
// Object
const { a, b } = obj;
const { a: doiTen } = obj;          // đổi tên biến
const { a = 10 } = obj;             // giá trị mặc định
const { a: x = 10 } = obj;          // vừa đổi tên vừa mặc định
const { a, ...conLai } = obj;       // rest

// Mảng
const [x, y] = arr;
const [, , thuBa] = arr;            // bỏ qua phần tử
const [dau, ...duoi] = arr;         // rest
const [p = 1, q = 2] = arr;         // mặc định
```

### Example 1 - Object cơ bản

```javascript
const user = { name: 'An', email: 'an@example.com', role: 'MENTEE', age: 20 };

const { name, email } = user;
console.log(name, email); // 'An' 'an@example.com'

// Đổi tên khi trùng với biến đã có
const { name: userName } = user;

// Mặc định khi khoá không tồn tại
const { avatar = '/default.png' } = user;
console.log(avatar); // '/default.png'
```

Như tham số mặc định, giá trị mặc định ở đây **chỉ kích hoạt khi giá trị là `undefined`**, không kích hoạt với `null`.

### Example 2 - Lồng nhau

```javascript
const course = {
  title: 'NestJS',
  mentor: { user: { username: 'mentor.linh' } },
};

const {
  title,
  mentor: {
    user: { username },
  },
} = course;

console.log(title, username); // 'NestJS' 'mentor.linh'

// Lồng nhau + mặc định cho tầng giữa để không ném lỗi
const { mentor: { bio = 'Chưa cập nhật' } = {} } = course;
```

Lưu ý: `mentor: { user: ... }` **không** tạo biến `mentor` — nó chỉ là đường đi. Cần cả hai thì viết `const { mentor, mentor: { user } } = course;`.

### Example 3 - Mảng và hoán đổi

```javascript
const colors = ['đỏ', 'xanh', 'vàng'];

const [first, second] = colors;
const [, , third] = colors;        // bỏ qua hai phần tử đầu
const [head, ...tail] = colors;    // head = 'đỏ', tail = ['xanh', 'vàng']

// Hoán đổi hai biến không cần biến tạm
let a = 1;
let b = 2;
[a, b] = [b, a];

// Nhận nhiều giá trị trả về
function minMax(arr) {
  return [Math.min(...arr), Math.max(...arr)];
}
const [min, max] = minMax([3, 1, 4]);
```

### Example 4 - Trong tham số hàm

```javascript
// Thay vì đọc từng thuộc tính trong thân hàm
function taoKhoa(options) {
  const title = options.title;
  const level = options.level ?? 'BEGINNER';
}

// Bóc tách ngay ở tham số — chữ ký hàm nói rõ nó cần gì
function taoKhoa({ title, level = 'BEGINNER', mentorId }) {
  return { title, level, mentorId };
}

// `= {}` để gọi không đối số vẫn chạy
function phanTrang({ page = 1, limit = 20 } = {}) {
  return { page, limit };
}

phanTrang(); // { page: 1, limit: 20 }
```

### Example 5 - Rest để loại bỏ trường

```javascript
const user = {
  userId: '1',
  username: 'an',
  email: 'an@example.com',
  passwordHash: '$2b$12$...',
  internalNotes: 'ghi chú nội bộ',
};

// Lấy mọi thứ TRỪ hai trường nhạy cảm
const { passwordHash, internalNotes, ...publicUser } = user;

console.log(publicUser); // { userId, username, email }
```

Cách này ngắn, nhưng có một điểm yếu: thêm cột nhạy cảm mới vào database thì nó **tự động lọt ra ngoài**. An toàn hơn là liệt kê tường minh những trường được phép trả về.

### Example 6 - Trong vòng lặp

```javascript
const entries = [['a', 1], ['b', 2]];

for (const [key, value] of entries) {
  console.log(key, value);
}

// Với Object.entries
for (const [key, value] of Object.entries(user)) { }

// Trong callback
courses.map(({ title, minutes }) => `${title}: ${minutes} phút`);
```

---

## 📌 Notes

- **Bóc tách từ `null`/`undefined` ném `TypeError`.** Dùng `= {}` hoặc `?? {}` để phòng.
- **Rest phải đứng cuối** trong cả object và mảng.
- **Gán destructuring không có `const`** phải bọc trong ngoặc đơn: `({ a } = obj)`.
- Bóc tách quá sâu (từ ba tầng trở lên) làm code khó đọc hơn là dễ hơn.

---

## 🌍 Real World Example

```javascript
/**
 * Controller đọc dữ liệu từ ba nguồn của request.
 *
 * Bóc tách ngay đầu hàm làm rõ hàm này phụ thuộc vào những gì, thay vì rải
 * `req.body.x` khắp thân hàm.
 */
async function updateCourse(req, res) {
  const { id } = req.params;
  const { includeChapters = 'false' } = req.query;
  const { title, description, level } = req.body ?? {};
  const { userId, role } = req.user;

  const course = await repository.findById(id);

  if (!course) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy khoá học');
  if (course.mentorId !== userId && role !== 'ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'Không có quyền sửa khoá học này');
  }

  const updated = await repository.update(id, { title, description, level });

  res.json(includeChapters === 'true' ? updated : toDto(updated));
}
```

`req.body ?? {}` là chi tiết quan trọng: ở Express 5, `req.body` là `undefined` khi client không gửi JSON, và bóc tách từ `undefined` sẽ ném `TypeError` trước cả khi validation kịp chạy.

```javascript
/** Cấu hình có nhiều tầng mặc định. */
function createClient({
  baseUrl,
  timeout = 5000,
  retry: { attempts = 3, delay = 200 } = {},
  headers = {},
} = {}) {
  return { baseUrl, timeout, attempts, delay, headers };
}

createClient({ baseUrl: '/api' });
createClient({ baseUrl: '/api', retry: { attempts: 5 } });
```

---

## ⚠️ Common Mistakes

**Sai 1 — Bóc tách từ `undefined`**

```javascript
const { a } = undefined; // TypeError
const { a } = obj ?? {};  // an toàn
```

**Sai 2 — Quên `= {}` cho tham số hàm**

```javascript
function f({ a }) { }
f(); // TypeError
```

**Sai 3 — Nghĩ `null` kích hoạt giá trị mặc định**

```javascript
const { a = 10 } = { a: null };
console.log(a); // null, không phải 10
```

**Sai 4 — Nghĩ bóc tách lồng nhau tạo biến cho tầng giữa**

```javascript
const { mentor: { user } } = course;
console.log(mentor); // ReferenceError — chỉ có biến `user`
```

**Sai 5 — Dựa vào rest để lọc trường nhạy cảm**

Cột nhạy cảm thêm sau này sẽ tự động lọt ra ngoài.

---

## 📋 Summary

- Object bóc tách theo tên khoá, mảng bóc tách theo vị trí.
- Đặt tên mới bằng `{ a: b }`, giá trị mặc định bằng `{ a = 10 }` — chỉ kích hoạt với `undefined`.
- Bóc tách trong tham số hàm làm chữ ký nói rõ hàm cần gì; nhớ `= {}` để gọi không đối số vẫn chạy.
- Bóc tách từ `null`/`undefined` ném `TypeError` — luôn có mặc định phòng hờ.
- Rest bóc tách gọn nhưng đừng dùng nó để lọc trường nhạy cảm.

---

## 📝 Quiz

### Question 1

`console.log(a)` in ra gì?

```javascript
const { a = 10 } = { a: null };
```

A. `10` — vì `null` nghĩa là không có giá trị.

B. `null` — giá trị mặc định chỉ áp dụng khi thuộc tính là `undefined`.

C. `undefined`

D. Ném `TypeError`.

**Answer: B**

**Giải thích:** Giống tham số mặc định của hàm, giá trị mặc định trong destructuring chỉ kích hoạt khi giá trị là `undefined` — tức là khoá không tồn tại hoặc được gán thẳng `undefined`. `null` là một giá trị hợp lệ mà ai đó cố ý đặt vào, nên nó được giữ nguyên.

---

### Question 2

Vì sao `const { mentor: { user } } = course;` không tạo ra biến `mentor`?

A. Vì `mentor` là từ khoá dành riêng.

B. Vì cú pháp `mentor: { ... }` chỉ mô tả đường đi để tới `user`, không phải khai báo biến `mentor`.

C. Vì `mentor` là object nên không bóc tách thành biến được.

D. Vì thiếu giá trị mặc định cho `mentor`.

**Answer: B**

**Giải thích:** Trong destructuring, dấu hai chấm mang nghĩa "đi vào trong" hoặc "đổi tên", chứ không tạo biến cho khoá bên trái. Cần cả hai thì phải viết `const { mentor, mentor: { user } } = course;`.
