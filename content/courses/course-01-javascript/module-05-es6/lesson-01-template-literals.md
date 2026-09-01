---
id: js-m5-l1
course: JavaScript Fundamentals
module: ES6+
title: Template literals
order: 1
difficulty: Beginner
estimatedTime: 20
---

# Template literals

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Nhúng biểu thức vào chuỗi bằng `${}`.
- Viết chuỗi nhiều dòng mà không cần `\n`.
- Dùng tagged template và biết nó giải quyết vấn đề gì.
- Tránh lỗ hổng khi ghép chuỗi cho SQL hoặc HTML.

---

## 📖 Definition

Template literal dùng dấu backtick `` ` `` thay cho nháy đơn hoặc nháy kép. Nó cho ba thứ mà chuỗi thường không có:

1. **Nội suy biểu thức** bằng `${...}`.
2. **Chuỗi nhiều dòng** giữ nguyên xuống dòng.
3. **Tagged template** — cho phép một hàm xử lý phần chuỗi và phần giá trị riêng biệt.

Điểm thứ ba ít người dùng nhưng chính là nền tảng của các thư viện truy vấn an toàn và CSS-in-JS.

---

## ⚙️ Syntax

```javascript
const ten = 'An';

`Xin chào ${ten}`;              // nội suy
`Tổng: ${1 + 2}`;               // biểu thức bất kỳ
`Dòng 1
Dòng 2`;                        // nhiều dòng
tag`Chuỗi ${giaTri}`;           // tagged template
```

### Example 1 - Nội suy

```javascript
const user = { name: 'An', age: 20 };

// Cách cũ
const msg1 = 'Xin chào ' + user.name + ', bạn ' + user.age + ' tuổi';

// Template literal
const msg2 = `Xin chào ${user.name}, bạn ${user.age} tuổi`;

// Biểu thức bất kỳ, kể cả lời gọi hàm và toán tử ba ngôi
const n = 3;
console.log(`Có ${n} mục${n > 1 ? '' : ' duy nhất'}`);
console.log(`Tổng: ${items.reduce((s, x) => s + x.price, 0).toLocaleString('vi-VN')} đ`);
```

### Example 2 - Chuỗi nhiều dòng

```javascript
// Cách cũ
const sql1 = 'SELECT *\n' + 'FROM courses\n' + 'WHERE status = $1';

// Template literal — xuống dòng thật được giữ nguyên
const sql2 = `
  SELECT *
  FROM courses
  WHERE status = $1
`;
```

Chú ý: khoảng trắng đầu dòng cũng nằm trong chuỗi. Với SQL thì không sao, nhưng với nội dung hiển thị cho người dùng thì cần `.trim()` hoặc viết sát lề.

### Example 3 - Lồng nhau

```javascript
const courses = [
  { title: 'NestJS', published: true },
  { title: 'Rust', published: false },
];

const html = `
  <ul>
    ${courses
      .map((c) => `<li class="${c.published ? 'published' : 'draft'}">${c.title}</li>`)
      .join('')}
  </ul>
`;
```

Lồng được nhiều tầng, nhưng quá hai tầng thì nên tách thành hàm riêng.

### Example 4 - Tagged template

Hàm tag nhận **phần chuỗi tĩnh** và **các giá trị** thành hai đối số riêng biệt:

```javascript
function highlight(strings, ...values) {
  // strings: ['Khoá ', ' có ', ' bài']
  // values:  ['NestJS', 15]
  return strings.reduce(
    (result, str, i) => result + str + (values[i] !== undefined ? `<b>${values[i]}</b>` : ''),
    '',
  );
}

const title = 'NestJS';
const count = 15;

highlight`Khoá ${title} có ${count} bài`;
// 'Khoá <b>NestJS</b> có <b>15</b> bài'
```

Điều quan trọng: hàm tag **biết được đâu là chuỗi do lập trình viên viết, đâu là giá trị đến từ bên ngoài**. Đó chính là thứ cho phép nó thoát ký tự an toàn.

### Example 5 - Vì sao tagged template quan trọng với SQL

```javascript
// NGUY HIỂM: nội suy thẳng vào câu truy vấn -> SQL injection
const userInput = "'; DROP TABLE users; --";
const bad = `SELECT * FROM users WHERE name = '${userInput}'`;

// AN TOÀN: Prisma dùng tagged template, giá trị đi qua tham số
await prisma.$queryRaw`SELECT * FROM users WHERE name = ${userInput}`;
```

Hai dòng nhìn gần giống nhau nhưng hoàn toàn khác về bản chất. Dòng đầu ghép chuỗi trước rồi mới gửi đi — cơ sở dữ liệu nhận được một câu lệnh đã bị sửa. Dòng sau gửi câu lệnh và giá trị **tách rời**, nên `userInput` chỉ có thể là dữ liệu, không bao giờ trở thành lệnh.

---

## 📌 Notes

- **`${}` chấp nhận mọi biểu thức**, nhưng không chấp nhận câu lệnh (`if`, `for`).
- **Object trong `${}` thành `'[object Object]'`** — nhớ chọn thuộc tính cụ thể.
- **`String.raw`** giữ nguyên chuỗi thoát: `` String.raw`a\nb` `` cho `'a\\nb'`.
- Template literal luôn trả về chuỗi, kể cả khi chỉ nội suy một con số.

---

## 🌍 Real World Example

```javascript
/** Dựng thông báo lỗi có ngữ cảnh. */
function formatError(error, req) {
  return `
[${new Date().toISOString()}] ${error.code ?? 'UNKNOWN'}
  ${req.method} ${req.originalUrl}
  user: ${req.user?.username ?? 'khách'}
  message: ${error.message}
`.trim();
}
```

```javascript
/** Sinh nội dung email từ dữ liệu khoá học. */
function enrollmentEmail({ user, course }) {
  const hours = Math.round(course.totalMinutes / 60);

  return {
    subject: `Bạn đã ghi danh khoá "${course.title}"`,
    html: `
      <h1>Chào ${user.username},</h1>
      <p>
        Bạn vừa ghi danh khoá <strong>${escapeHtml(course.title)}</strong>
        gồm ${course.lessonCount} bài học, tổng thời lượng khoảng ${hours} giờ.
      </p>
      <a href="${process.env.PUBLIC_BASE_URL}/courses/${course.id}">Bắt đầu học</a>
    `,
  };
}
```

`escapeHtml` quanh `course.title` không thừa: tiêu đề khoá học do mentor nhập, và một tiêu đề chứa `<script>` sẽ chạy được trong hộp thư của người nhận. Template literal **không** tự thoát ký tự — nó chỉ ghép chuỗi.

---

## ⚠️ Common Mistakes

**Sai 1 — Ghép chuỗi cho SQL**

```javascript
// SQL injection
db.query(`SELECT * FROM users WHERE id = ${id}`);

// Dùng tham số hoặc tagged template của thư viện
db.query('SELECT * FROM users WHERE id = $1', [id]);
```

**Sai 2 — Nội suy dữ liệu người dùng vào HTML mà không thoát ký tự**

Mở đường cho XSS.

**Sai 3 — Nội suy nguyên object**

```javascript
`User: ${user}`      // 'User: [object Object]'
`User: ${user.name}` // đúng
```

**Sai 4 — Quên khoảng trắng đầu dòng nằm trong chuỗi**

```javascript
const s = `
  Xin chào
`;
console.log(s.length); // lớn hơn bạn nghĩ — nhớ .trim()
```

**Sai 5 — Dùng nháy đơn thay backtick**

```javascript
const s = 'Xin chào ${name}'; // chuỗi nguyên văn, không nội suy
```

---

## 📋 Summary

- Template literal dùng backtick, cho nội suy `${}`, chuỗi nhiều dòng và tagged template.
- `${}` nhận mọi **biểu thức**, không nhận câu lệnh.
- Tagged template tách phần chuỗi tĩnh khỏi phần giá trị — nền tảng để chống SQL injection.
- Template literal **không** tự thoát ký tự: ghép dữ liệu người dùng vào HTML hay SQL vẫn nguy hiểm như trước.
- Khoảng trắng và xuống dòng trong chuỗi nhiều dòng đều được giữ nguyên.

---

## 📝 Quiz

### Question 1

`` `User: ${user}` `` với `user = { name: 'An' }` cho kết quả gì?

A. `'User: An'`

B. `'User: { name: "An" }'`

C. `'User: [object Object]'` — object bị ép sang chuỗi bằng `toString()` mặc định.

D. Ném `TypeError`.

**Answer: C**

**Giải thích:** `${}` ép giá trị sang chuỗi, và `Object.prototype.toString()` mặc định trả về `'[object Object]'`. Muốn thấy nội dung phải chọn thuộc tính cụ thể (`user.name`) hoặc dùng `JSON.stringify(user)`. Chuỗi `'[object Object]'` xuất hiện trên giao diện luôn là dấu hiệu của lỗi này.

---

### Question 2

Vì sao `` prisma.$queryRaw`SELECT * FROM users WHERE name = ${input}` `` an toàn còn `` db.query(`SELECT * FROM users WHERE name = '${input}'`) `` thì không?

A. Vì Prisma tự động lọc từ khoá SQL nguy hiểm khỏi chuỗi.

B. Vì `$queryRaw` là tagged template: nó nhận phần chuỗi tĩnh và giá trị riêng biệt, rồi gửi giá trị xuống database dưới dạng tham số nên nó không bao giờ được hiểu là lệnh.

C. Vì Prisma mã hoá giá trị trước khi gửi đi.

D. Vì hai câu lệnh giống nhau, cả hai đều an toàn.

**Answer: B**

**Giải thích:** Ở dòng thứ hai, chuỗi được ghép **trước** khi gửi đi, nên database nhận về một câu lệnh đã bị người dùng sửa nội dung. Với tagged template, hàm nhận được `['SELECT * FROM users WHERE name = ', '']` và `[input]` như hai thứ tách biệt, rồi gửi xuống dạng câu lệnh có tham số. Ranh giới giữa lệnh và dữ liệu không bao giờ bị xoá nhoà.
