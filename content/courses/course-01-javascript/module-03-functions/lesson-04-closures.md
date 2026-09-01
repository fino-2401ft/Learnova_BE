---
id: js-m3-l4
course: JavaScript Fundamentals
module: Functions
title: Closure
order: 4
difficulty: Intermediate
estimatedTime: 35
---

# Closure

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Giải thích closure là gì bằng lời của mình.
- Dùng closure để tạo trạng thái riêng tư.
- Nhận ra closure trong những đoạn code bạn vẫn viết hằng ngày.
- Biết closure có thể gây rò rỉ bộ nhớ ở đâu.

---

## 📖 Definition

**Closure là một hàm cùng với môi trường biến nơi nó được định nghĩa.**

Nói cách khác: khi một hàm được tạo ra bên trong hàm khác, nó **giữ lại quyền truy cập** vào các biến của hàm bao ngoài — kể cả sau khi hàm bao ngoài đã chạy xong và lẽ ra phải bị dọn khỏi bộ nhớ.

Điểm khiến nhiều người bất ngờ: closure giữ **tham chiếu tới biến**, không phải bản sao giá trị. Nếu biến đó thay đổi, closure nhìn thấy giá trị mới.

Bạn đã dùng closure rất nhiều mà không gọi tên nó: mọi callback truy cập biến bên ngoài đều là closure.

---

## ⚙️ Syntax

```javascript
function ngoai() {
  const bienRieng = 'tôi vẫn sống';

  return function trong() {
    return bienRieng; // closure: nhớ được bienRieng
  };
}

const f = ngoai(); // ngoai() đã chạy xong
console.log(f());  // 'tôi vẫn sống' — biến vẫn còn
```

### Example 1 - Bộ đếm có trạng thái riêng tư

```javascript
function taoBoDem() {
  let count = 0; // không ai bên ngoài chạm được

  return {
    tang: () => ++count,
    giam: () => --count,
    xem: () => count,
  };
}

const dem = taoBoDem();
dem.tang(); // 1
dem.tang(); // 2
dem.xem();  // 2

console.log(dem.count); // undefined — thật sự riêng tư
```

Ba hàm trả về cùng chia sẻ **một** biến `count`. Không có cách nào sửa `count` ngoài ba hàm đó — đây là đóng gói dữ liệu mà không cần class hay `#private`.

### Example 2 - Mỗi lần gọi tạo một môi trường mới

```javascript
const a = taoBoDem();
const b = taoBoDem();

a.tang();
a.tang();

console.log(a.xem()); // 2
console.log(b.xem()); // 0 — độc lập hoàn toàn
```

Mỗi lần gọi `taoBoDem()` sinh ra một biến `count` riêng.

### Example 3 - Closure giữ tham chiếu, không giữ bản sao

```javascript
function f() {
  let x = 1;
  const doc = () => x;

  x = 99; // sửa sau khi đã tạo closure

  return doc();
}

console.log(f()); // 99, không phải 1
```

Đây cũng là lời giải cho cái bẫy `var` trong vòng lặp: ba callback cùng đóng lên **một** biến `i`, nên tất cả cùng thấy giá trị cuối cùng.

```javascript
// var: một biến dùng chung -> 3, 3, 3
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));

// let: mỗi vòng một biến mới -> 0, 1, 2
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j));
```

### Example 4 - Closure trong code hằng ngày

```javascript
// 1. Middleware nhớ tham số cấu hình
function requireRole(...roles) {
  return (req, res, next) => {
    // `roles` vẫn sống dù requireRole() đã chạy xong từ lâu
    if (!roles.includes(req.user.role)) return res.status(403).end();
    next();
  };
}

// 2. Callback nhớ biến bên ngoài
function xuLy(items) {
  const prefix = '[LOG]';
  items.forEach((item) => console.log(prefix, item)); // closure trên `prefix`
}

// 3. Hàm ghi nhớ kết quả
function memoize(fn) {
  const cache = new Map(); // sống cùng hàm trả về

  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}
```

### Example 5 - Debounce: closure giữ định danh timer

```javascript
function debounce(fn, delay = 300) {
  let timer; // closure giữ giữa các lần gọi

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const search = debounce((keyword) => {
  fetch(`/api/courses?search=${keyword}`);
}, 500);

// Gõ liên tục chỉ gọi API một lần sau khi ngừng 500ms
input.addEventListener('input', (e) => search(e.target.value));
```

Không có closure, `timer` phải là biến toàn cục — và hai ô tìm kiếm trên cùng trang sẽ xoá timer của nhau.

---

## 📌 Notes

- **Mọi hàm trong JavaScript đều là closure**, chỉ là phần lớn không dùng tới biến bên ngoài.
- **Closure giữ biến sống**, nên biến không bị dọn khỏi bộ nhớ chừng nào closure còn được tham chiếu.
- **Closure không sao chép giá trị** — nó liên kết tới chính ô nhớ đó.
- Trình gỡ lỗi của trình duyệt hiển thị closure trong panel Scope, rất hữu ích khi truy vết.

---

## 🌍 Real World Example

```javascript
/**
 * Giới hạn tần suất gọi theo từng khoá, dùng closure giữ trạng thái.
 *
 * Không dùng biến toàn cục: mỗi lần gọi createRateLimiter() sinh một bộ đếm
 * riêng, nên endpoint đăng nhập và endpoint gửi email không chia sẻ hạn mức.
 */
function createRateLimiter({ limit = 5, windowMs = 60_000 } = {}) {
  const hits = new Map(); // khoá -> mảng dấu thời gian

  return function isAllowed(key) {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }

    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}

const loginLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
const emailLimiter = createRateLimiter({ limit: 3, windowMs: 3_600_000 });

// Hai bộ đếm hoàn toàn độc lập
loginLimiter('192.168.1.1'); // true
emailLimiter('192.168.1.1'); // true — không ảnh hưởng lẫn nhau
```

Có một vấn đề thật trong đoạn trên: `hits` **không bao giờ được dọn**. Mỗi IP mới thêm một khoá và khoá đó ở lại vĩnh viễn. Trên server chạy nhiều tháng, đó là rò rỉ bộ nhớ. Bản dùng thật cần định kỳ xoá khoá đã hết hạn — hoặc dùng thư viện đã giải quyết chuyện này.

---

## ⚠️ Common Mistakes

**Sai 1 — Nghĩ closure chụp lại giá trị tại thời điểm tạo**

```javascript
let x = 1;
const f = () => x;
x = 2;
console.log(f()); // 2, không phải 1
```

**Sai 2 — Dùng `var` trong vòng lặp có callback**

Tất cả callback cùng đóng lên một biến.

**Sai 3 — Closure giữ object lớn khiến không giải phóng được bộ nhớ**

```javascript
function f() {
  const duLieuLon = new Array(1_000_000);
  // Closure này giữ nguyên cả `duLieuLon` dù chỉ cần độ dài
  return () => duLieuLon.length;
}

// Tốt hơn: chỉ giữ thứ thật sự cần
function g() {
  const duLieuLon = new Array(1_000_000);
  const len = duLieuLon.length;
  return () => len;
}
```

**Sai 4 — Cache trong closure không có giới hạn**

`Map` cứ lớn dần cho tới khi hết bộ nhớ.

**Sai 5 — Nghĩ closure là tính năng nâng cao ít dùng**

Mỗi callback bạn viết đều là closure.

---

## 📋 Summary

- Closure là hàm cộng với môi trường biến nơi nó được định nghĩa; nó giữ biến sống sau khi hàm bao ngoài kết thúc.
- Closure giữ **tham chiếu** tới biến, không giữ bản sao — đó là lời giải cho cái bẫy `var` trong vòng lặp.
- Mỗi lần gọi hàm bao ngoài tạo ra một môi trường độc lập.
- Dùng closure để đóng gói trạng thái riêng tư mà không cần class: bộ đếm, debounce, memoize, rate limiter.
- Closure giữ biến sống, nên cache hoặc dữ liệu lớn nằm trong closure có thể thành rò rỉ bộ nhớ.

---

## 📝 Quiz

### Question 1

`f()` trả về gì?

```javascript
function f() {
  let x = 1;
  const doc = () => x;
  x = 99;
  return doc();
}
```

A. `1` — closure chụp lại giá trị tại lúc hàm được tạo.

B. `99` — closure giữ tham chiếu tới biến, nên nó thấy giá trị mới nhất.

C. `undefined`

D. Ném `ReferenceError`.

**Answer: B**

**Giải thích:** Closure liên kết tới chính ô nhớ của biến, không sao chép giá trị. Khi `doc()` được gọi, nó đọc giá trị hiện tại của `x` là `99`. Chính đặc điểm này giải thích vì sao vòng lặp dùng `var` khiến mọi callback thấy cùng một giá trị cuối.

---

### Question 2

Vì sao `taoBoDem()` gọi hai lần cho ra hai bộ đếm độc lập?

```javascript
function taoBoDem() {
  let count = 0;
  return { tang: () => ++count, xem: () => count };
}
```

A. Vì `let` tự động tạo biến mới cho mỗi lời gọi hàm.

B. Vì mỗi lần gọi hàm tạo ra một môi trường biến mới, và closure trả về gắn với đúng môi trường của lần gọi đó.

C. Vì object trả về là hai object khác nhau nên `count` cũng khác nhau.

D. Vì `++count` tạo bản sao của biến.

**Answer: B**

**Giải thích:** Mỗi lời gọi hàm sinh ra một môi trường thực thi riêng với biến `count` riêng. Các closure tạo ra trong lần gọi đó gắn với đúng môi trường ấy. Đây cũng là lý do `tang` và `xem` của cùng một bộ đếm chia sẻ được `count`, còn hai bộ đếm khác nhau thì không.
