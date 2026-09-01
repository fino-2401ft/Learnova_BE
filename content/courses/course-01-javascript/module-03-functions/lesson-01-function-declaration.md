---
id: js-m3-l1
course: JavaScript Fundamentals
module: Functions
title: Khai báo hàm
order: 1
difficulty: Beginner
estimatedTime: 30
---

# Khai báo hàm

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Phân biệt function declaration và function expression.
- Dùng tham số mặc định và tham số rest.
- Hiểu vì sao hàm là "công dân hạng nhất" trong JavaScript.
- Viết hàm nhận và trả về hàm khác.

---

## 📖 Definition

Trong JavaScript, hàm là **giá trị** như mọi giá trị khác: gán vào biến được, truyền làm tham số được, trả về từ hàm khác được. Tính chất đó gọi là *first-class function*, và nó là nền tảng của gần như mọi thứ trong JavaScript hiện đại — callback, promise, middleware.

Có hai cách khai báo, khác nhau ở **hoisting**:

- **Function declaration** (`function tên() {}`) được hoisting **nguyên vẹn** — gọi được trước dòng khai báo.
- **Function expression** (`const tên = function () {}`) chỉ hoisting phần biến, nên gọi trước là lỗi.

---

## ⚙️ Syntax

```javascript
// Declaration
function cong(a, b) {
  return a + b;
}

// Expression
const tru = function (a, b) {
  return a - b;
};

// Tham số mặc định
function chao(ten = 'bạn') {
  return `Xin chào ${ten}`;
}

// Tham số rest: gom phần còn lại thành mảng
function tong(...so) {
  return so.reduce((s, n) => s + n, 0);
}
```

### Example 1 - Hoisting

```javascript
console.log(cong(1, 2)); // 3 — gọi được trước khi khai báo
function cong(a, b) {
  return a + b;
}

console.log(tru(3, 1)); // ReferenceError: Cannot access 'tru' before initialization
const tru = function (a, b) {
  return a - b;
};
```

Nghe thì declaration tiện hơn, nhưng khai báo hàm ở dưới rồi gọi ở trên làm code khó theo dõi. Nhiều nhóm chọn function expression để buộc thứ tự khai báo trùng với thứ tự đọc.

### Example 2 - Tham số mặc định

```javascript
function taoNguoiDung(ten, vaiTro = 'MENTEE', hoatDong = true) {
  return { ten, vaiTro, hoatDong };
}

taoNguoiDung('An');                    // { ten: 'An', vaiTro: 'MENTEE', hoatDong: true }
taoNguoiDung('Bình', 'MENTOR');        // vaiTro được truyền
taoNguoiDung('Chi', undefined, false); // undefined KÍCH HOẠT giá trị mặc định
taoNguoiDung('Dũng', null, false);     // null KHÔNG kích hoạt — vaiTro là null
```

Chỉ `undefined` mới kích hoạt giá trị mặc định. `null`, `0`, `''` đều được coi là giá trị người gọi thật sự truyền vào.

```javascript
// Giá trị mặc định tính được từ tham số trước đó
function taoKhoa(tieuDe, slug = tieuDe.toLowerCase().replace(/\s+/g, '-')) {
  return { tieuDe, slug };
}

taoKhoa('Nhập môn NestJS'); // { tieuDe: '...', slug: 'nhập-môn-nestjs' }
```

### Example 3 - Tham số rest

```javascript
function log(mucDo, ...thongDiep) {
  console.log(`[${mucDo}]`, ...thongDiep);
}

log('INFO', 'Server khởi động', 'cổng 3000');

// Rest phải là tham số CUỐI CÙNG
function sai(...a, b) {} // SyntaxError
```

Rest thay cho `arguments` của JavaScript cũ. Khác biệt: rest là **mảng thật** nên dùng được `map`, `filter`; còn `arguments` chỉ giống mảng.

### Example 4 - Hàm là giá trị

```javascript
// Gán vào biến
const nhanDoi = (x) => x * 2;

// Truyền làm tham số
[1, 2, 3].map(nhanDoi); // [2, 4, 6]

// Trả về từ hàm khác
function taoBoNhan(heSo) {
  return (x) => x * heSo;
}

const nhanBa = taoBoNhan(3);
console.log(nhanBa(5)); // 15

// Lưu trong object
const toanTu = {
  cong: (a, b) => a + b,
  tru: (a, b) => a - b,
};

console.log(toanTu.cong(2, 3)); // 5
```

### Example 5 - Đối tượng tham số cho hàm nhiều đối số

```javascript
// KHÓ DÙNG: người gọi phải nhớ đúng thứ tự
function taoKhoaHoc(tieuDe, moTa, capDo, trangThai, mentorId) { }
taoKhoaHoc('NestJS', '', 'BEGINNER', 'DRAFT', 'u1'); // đối số thứ ba là gì?

// DỄ DÙNG: gọi tên rõ ràng, thứ tự không quan trọng
function taoKhoaHoc({ tieuDe, moTa = '', capDo = 'BEGINNER', trangThai = 'DRAFT', mentorId }) {
  return { tieuDe, moTa, capDo, trangThai, mentorId };
}

taoKhoaHoc({ tieuDe: 'NestJS', mentorId: 'u1' });
```

Quy tắc thực dụng: quá ba tham số thì chuyển sang nhận một object.

---

## 📌 Notes

- **Hàm không có `return` trả về `undefined`.**
- **JavaScript không kiểm tra số lượng đối số.** Thừa thì bị bỏ qua, thiếu thì thành `undefined`.
- **`function.length`** cho biết số tham số **trước** tham số có mặc định hoặc rest.
- Hàm nên làm đúng một việc và có tên nói rõ việc đó. Tên có chữ "và" thường là dấu hiệu nên tách.

---

## 🌍 Real World Example

```javascript
/**
 * Tạo middleware kiểm tra vai trò.
 *
 * Đây là hàm trả về hàm: `requireRole('ADMIN')` chạy một lần lúc khai báo route
 * và trả về middleware thật, còn middleware đó chạy trên mỗi request.
 */
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN' });
    }

    next();
  };
}

// Dùng:
router.post('/courses', requireRole('MENTOR', 'ADMIN'), createCourse);
router.delete('/users/:id', requireRole('ADMIN'), deleteUser);
```

Tham số rest cho phép gọi với số vai trò tuỳ ý, và middleware trả về vẫn "nhớ" được danh sách đó — đây chính là closure, chủ đề của bài sau.

```javascript
/** Hàm nhận object tham số, có mặc định cho từng trường. */
function buildPagination({ page = 1, limit = 20, maxLimit = 100 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(maxLimit, Math.max(1, Number(limit) || 20));

  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

buildPagination();                  // gọi không đối số vẫn chạy nhờ `= {}`
buildPagination({ page: 3 });
```

Dấu `= {}` ở cuối rất quan trọng: không có nó, gọi `buildPagination()` sẽ ném lỗi vì không destructure được `undefined`.

---

## ⚠️ Common Mistakes

**Sai 1 — Nghĩ `null` kích hoạt giá trị mặc định**

```javascript
function f(x = 10) { return x; }
f(null); // null, không phải 10
```

**Sai 2 — Destructure tham số mà quên `= {}`**

```javascript
function f({ a }) { }
f(); // TypeError: Cannot destructure property 'a' of undefined

function f({ a } = {}) { } // đúng
f(); // chạy được
```

**Sai 3 — Đặt rest không ở cuối**

Lỗi cú pháp.

**Sai 4 — Quên `return`**

```javascript
function cong(a, b) {
  a + b; // tính rồi vứt đi
}
cong(1, 2); // undefined
```

**Sai 5 — Hàm nhận quá nhiều tham số cùng kiểu**

`f(true, false, true)` — không ai đọc code mà đoán được ba giá trị đó nghĩa là gì.

---

## 📋 Summary

- Hàm là giá trị: gán, truyền, trả về đều được — đó là nền tảng của callback và middleware.
- Function declaration hoisting nguyên vẹn; function expression thì không.
- Chỉ `undefined` kích hoạt tham số mặc định; `null` và `0` thì không.
- Tham số rest là mảng thật và phải đứng cuối.
- Quá ba tham số thì nhận một object, và nhớ `= {}` để gọi không đối số vẫn chạy.

---

## 📝 Quiz

### Question 1

`f(null)` trả về gì?

```javascript
function f(x = 10) {
  return x;
}
```

A. `10` — vì `null` được coi là không truyền gì.

B. `null` — chỉ `undefined` mới kích hoạt giá trị mặc định.

C. `undefined`

D. Ném `TypeError`.

**Answer: B**

**Giải thích:** Tham số mặc định chỉ áp dụng khi đối số là `undefined` — tức là không truyền, hoặc truyền thẳng `undefined`. Mọi giá trị khác, kể cả `null`, `0`, `''` và `false`, đều được coi là giá trị người gọi cố ý truyền vào.

---

### Question 2

Vì sao `buildPagination()` gọi không đối số lại ném lỗi nếu khai báo là `function buildPagination({ page = 1 })`?

A. Vì `page` phải là tham số bắt buộc.

B. Vì không truyền gì thì đối số là `undefined`, và không thể destructure thuộc tính từ `undefined`.

C. Vì hàm destructure luôn cần ít nhất một đối số.

D. Vì `page = 1` không phải cú pháp hợp lệ.

**Answer: B**

**Giải thích:** Giá trị mặc định `page = 1` chỉ áp dụng cho thuộc tính bên trong object, chứ không tạo ra object khi không có object nào. Phải thêm mặc định cho chính tham số: `function buildPagination({ page = 1 } = {})`.
