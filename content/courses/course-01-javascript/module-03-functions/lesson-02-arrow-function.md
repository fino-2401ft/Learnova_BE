---
id: js-m3-l2
course: JavaScript Fundamentals
module: Functions
title: Arrow function
order: 2
difficulty: Beginner
estimatedTime: 30
---

# Arrow function

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Viết arrow function ở các dạng rút gọn.
- Giải thích arrow function xử lý `this` khác hàm thường ra sao.
- Biết chỗ nào **không** được dùng arrow function.
- Trả về object literal từ arrow function mà không bị lỗi cú pháp.

---

## 📖 Definition

Arrow function (`=>`) là cú pháp ngắn gọn ra đời từ ES2015. Nhưng nó **không chỉ là cú pháp ngắn hơn** — nó khác hàm thường ở bốn điểm bản chất:

1. **Không có `this` riêng.** Nó lấy `this` từ phạm vi bao ngoài tại thời điểm định nghĩa.
2. **Không có `arguments`.**
3. **Không dùng được với `new`.**
4. **Không có `prototype`.**

Điểm đầu tiên là lý do thật sự khiến arrow function tồn tại. Trước ES2015, `this` bên trong callback không trỏ tới object mà ta mong đợi, và mọi người phải viết `const self = this;` để lách.

---

## ⚙️ Syntax

```javascript
// Đầy đủ
const f = (a, b) => {
  return a + b;
};

// Thân là một biểu thức -> tự động return
const g = (a, b) => a + b;

// Một tham số -> bỏ được ngoặc đơn
const h = (x) => x * 2;

// Không tham số -> ngoặc rỗng bắt buộc
const i = () => 42;

// Trả về object -> BỌC TRONG NGOẶC ĐƠN
const j = (id) => ({ id, active: true });
```

### Example 1 - Rút gọn dần

```javascript
const numbers = [1, 2, 3, 4];

numbers.map(function (n) { return n * 2; });  // hàm thường
numbers.map((n) => { return n * 2; });        // arrow, thân đầy đủ
numbers.map((n) => n * 2);                    // arrow, return ngầm
```

### Example 2 - Trả về object literal

```javascript
// SAI: { } bị hiểu là thân hàm, không phải object
const f = (id) => { id: id, active: true };
console.log(f(1)); // undefined

// ĐÚNG: bọc object trong ngoặc đơn
const g = (id) => ({ id, active: true });
console.log(g(1)); // { id: 1, active: true }
```

Đây là lỗi cú pháp gây bối rối nhất với arrow function — nó không báo lỗi, chỉ âm thầm trả về `undefined`.

### Example 3 - `this` trong hàm thường và arrow

```javascript
const counter = {
  count: 0,

  // Hàm thường: `this` phụ thuộc CÁCH GỌI
  startWrong() {
    setInterval(function () {
      this.count++; // `this` là undefined (strict) hoặc global — KHÔNG phải counter
      console.log(this.count); // NaN
    }, 1000);
  },

  // Arrow: `this` lấy từ phạm vi bao ngoài, tức là `counter`
  startRight() {
    setInterval(() => {
      this.count++;
      console.log(this.count); // 1, 2, 3...
    }, 1000);
  },
};
```

`this` trong hàm thường được quyết định lúc **gọi**, không phải lúc **viết**. `setInterval` gọi callback như một hàm độc lập nên `this` mất liên hệ với `counter`. Arrow function không có `this` riêng nên nó dùng luôn `this` của `startRight`, tức là `counter`.

### Example 4 - Chỗ KHÔNG được dùng arrow function

```javascript
// 1. Phương thức của object cần truy cập `this`
const user = {
  name: 'An',
  chaoSai: () => `Xin chào ${this.name}`,   // `this` là module/global -> undefined
  chaoDung() { return `Xin chào ${this.name}`; },
};

// 2. Hàm khởi tạo
const Person = (name) => { this.name = name; };
new Person('An'); // TypeError: Person is not a constructor

// 3. Phương thức trên prototype
Array.prototype.last = () => this[this.length - 1]; // sai

// 4. Cần `arguments`
const f = () => console.log(arguments); // ReferenceError
```

Quy tắc thực dụng: **arrow cho callback, hàm thường cho phương thức của object và class.**

### Example 5 - Chuỗi xử lý dữ liệu

```javascript
const courses = [
  { title: 'NestJS', minutes: 1010, published: true },
  { title: 'Express', minutes: 395, published: true },
  { title: 'Rust', minutes: 0, published: false },
];

const summary = courses
  .filter((c) => c.published)
  .map((c) => ({ title: c.title, hours: Math.round(c.minutes / 60) }))
  .sort((a, b) => b.hours - a.hours);

console.log(summary);
// [{ title: 'NestJS', hours: 17 }, { title: 'Express', hours: 7 }]
```

Đây là chỗ arrow function toả sáng: chuỗi biến đổi đọc gần như một câu tiếng Anh, không bị `function` và `return` chen vào giữa.

---

## 📌 Notes

- **Arrow function luôn là expression**, nên không được hoisting.
- **Không có `arguments`**, nhưng dùng được tham số rest `(...args) => {}`.
- **Trong class field**, arrow function tự gắn `this` vào instance — cách phổ biến để truyền phương thức làm callback.
- Arrow không phải luôn ngắn hơn: `(a, b) => { ... }` nhiều dòng thì lợi thế biến mất.

---

## 🌍 Real World Example

```javascript
class CourseService {
  constructor(repository) {
    this.repository = repository;
  }

  // Phương thức thường: `this` đúng khi gọi qua instance.
  async list(filters) {
    const courses = await this.repository.findMany(filters);

    // Arrow function bên trong: `this` vẫn là instance,
    // nên gọi được this.toDto mà không cần bind.
    return courses.map((course) => this.toDto(course));
  }

  toDto(course) {
    return {
      id: course.courseId,
      title: course.title,
      hours: Math.round(course.totalMinutes / 60),
    };
  }
}
```

Nếu dòng `courses.map` viết bằng `function (course) { return this.toDto(course); }` thì `this` sẽ là `undefined` và ném lỗi ngay. Trước ES2015 người ta phải viết `.map(function (c) { ... }.bind(this))` hoặc `const self = this;`.

```javascript
// Class field với arrow: dùng khi phương thức được truyền đi làm callback
class Timer {
  seconds = 0;

  // Arrow field: `this` gắn chặt vào instance, truyền đi đâu cũng đúng.
  tick = () => {
    this.seconds += 1;
  };

  start() {
    setInterval(this.tick, 1000); // truyền thẳng, không cần .bind(this)
  }
}
```

---

## ⚠️ Common Mistakes

**Sai 1 — Trả về object mà quên ngoặc đơn**

```javascript
const f = (x) => { value: x };  // trả về undefined
const f = (x) => ({ value: x }); // đúng
```

**Sai 2 — Dùng arrow làm phương thức object**

```javascript
const o = { name: 'An', greet: () => this.name }; // undefined
```

**Sai 3 — Dùng arrow làm hàm khởi tạo**

`new` với arrow function ném `TypeError`.

**Sai 4 — Gắn arrow vào `prototype`**

`this` không trỏ tới instance.

**Sai 5 — Dùng `arguments` trong arrow**

Không tồn tại; dùng tham số rest thay thế.

---

## 📋 Summary

- Arrow function không có `this` riêng — nó dùng `this` của phạm vi bao ngoài tại nơi được viết.
- Đó là lý do arrow phù hợp cho callback, và không phù hợp cho phương thức object hay hàm khởi tạo.
- Thân là biểu thức thì tự động `return`; trả về object literal phải bọc trong ngoặc đơn.
- Arrow không có `arguments` và không dùng được với `new`.
- Quy tắc: arrow cho callback, hàm thường cho phương thức.

---

## 📝 Quiz

### Question 1

`f(1)` trả về gì?

```javascript
const f = (id) => { id: id, active: true };
```

A. `{ id: 1, active: true }`

B. `undefined` — cặp `{ }` bị hiểu là thân hàm chứ không phải object literal.

C. Ném `SyntaxError`.

D. `1`

**Answer: B**

**Giải thích:** Sau `=>`, cặp ngoặc nhọn luôn được hiểu là thân hàm. Bên trong, `id:` trở thành một nhãn (label) chứ không phải khoá của object, và hàm không có `return` nên trả về `undefined`. Phải viết `(id) => ({ id, active: true })`.

---

### Question 2

Vì sao `setInterval(function () { this.count++ }, 1000)` bên trong một phương thức object lại không tăng được `count`?

A. Vì `setInterval` không hỗ trợ hàm thường.

B. Vì `this` trong hàm thường được quyết định bởi cách gọi; `setInterval` gọi callback như hàm độc lập nên `this` không còn trỏ tới object.

C. Vì `count` phải khai báo bằng `let`.

D. Vì `++` không hoạt động với thuộc tính object.

**Answer: B**

**Giải thích:** Hàm thường nhận `this` tại thời điểm gọi, không phải thời điểm viết. `setInterval` gọi callback mà không gắn ngữ cảnh nào nên `this` là `undefined` ở chế độ strict. Arrow function không có `this` riêng nên nó lấy `this` từ phạm vi bao ngoài — đúng object mà ta mong đợi.
