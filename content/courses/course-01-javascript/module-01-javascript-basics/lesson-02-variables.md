---
id: js-m1-l2
course: JavaScript Fundamentals
module: JavaScript Basics
title: Biến let, const và var
order: 2
difficulty: Beginner
estimatedTime: 30
---

# Biến let, const và var

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Khai báo biến bằng `let` và `const`, và biết vì sao không nên dùng `var`.
- Giải thích phạm vi khối (block scope) khác phạm vi hàm (function scope) ra sao.
- Hiểu hoisting và vùng chết tạm thời (temporal dead zone).
- Biết `const` bảo vệ cái gì và **không** bảo vệ cái gì.

---

## 📖 Definition

JavaScript có ba từ khoá khai báo biến, khác nhau ở ba điểm: phạm vi, khả năng gán lại, và cách hoạt động khi bị dùng trước lúc khai báo.

| | `var` | `let` | `const` |
|---|---|---|---|
| Phạm vi | Hàm | Khối `{}` | Khối `{}` |
| Gán lại | Được | Được | **Không** |
| Khai báo lại cùng phạm vi | Được | Không | Không |
| Dùng trước khi khai báo | `undefined` | Lỗi | Lỗi |

**Quy tắc thực dụng: mặc định dùng `const`, đổi sang `let` khi cần gán lại, và không bao giờ dùng `var`.** `var` vẫn tồn tại chỉ vì JavaScript giữ tương thích ngược.

---

## ⚙️ Syntax

```javascript
const PI = 3.14159;    // không gán lại được
let count = 0;         // gán lại được
count = 1;

var old = 'tránh dùng';
```

### Example 1 - Phạm vi khối so với phạm vi hàm

```javascript
function demo() {
  if (true) {
    var a = 'var';
    let b = 'let';
  }

  console.log(a); // 'var'  — var thoát ra khỏi khối if
  console.log(b); // ReferenceError: b is not defined
}
```

`var` chỉ biết tới ranh giới **hàm**, nên nó rò rỉ ra ngoài khối `if`. `let` và `const` dừng lại đúng ở cặp ngoặc nhọn.

### Example 2 - Cái bẫy kinh điển của var trong vòng lặp

```javascript
// Với var: in ra 3, 3, 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}

// Với let: in ra 0, 1, 2
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);
}
```

Với `var` chỉ tồn tại **một** biến `i` dùng chung; tới lúc `setTimeout` chạy thì vòng lặp đã kết thúc và `i` bằng 3. Với `let`, mỗi vòng lặp tạo một biến `j` mới, nên mỗi callback giữ giá trị riêng của nó.

### Example 3 - Vùng chết tạm thời

```javascript
console.log(a); // undefined  — var được hoisting và gán undefined
var a = 1;

console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 2;
```

Cả `var` và `let` đều được hoisting lên đầu phạm vi. Khác biệt là `var` được khởi tạo sẵn bằng `undefined`, còn `let`/`const` thì chưa — khoảng từ đầu phạm vi tới dòng khai báo gọi là **temporal dead zone**, chạm vào là lỗi.

Lỗi ở đây là điều tốt: nó bắt bạn sửa ngay, thay vì để `undefined` lan đi rồi hỏng ở chỗ khác.

### Example 4 - const bảo vệ tham chiếu, không bảo vệ nội dung

```javascript
const user = { name: 'An' };

user.name = 'Bình';   // ĐƯỢC — sửa thuộc tính bên trong
user.age = 20;        // ĐƯỢC — thêm thuộc tính

user = { name: 'Chi' }; // TypeError: Assignment to constant variable

const list = [1, 2];
list.push(3);         // ĐƯỢC — [1, 2, 3]
list = [];            // TypeError
```

`const` khoá **ràng buộc giữa tên và giá trị**, không khoá bản thân giá trị. Muốn khoá cả nội dung thì dùng `Object.freeze()`:

```javascript
const config = Object.freeze({ port: 3000 });
config.port = 4000;   // âm thầm không có tác dụng (ném lỗi ở chế độ strict)
```

---

## 📌 Notes

- **`Object.freeze()` chỉ đóng băng một tầng.** Object lồng bên trong vẫn sửa được.
- **Biến `const` phải gán giá trị ngay lúc khai báo.** `const x;` là lỗi cú pháp.
- **Khai báo không dùng từ khoá nào** (`x = 5`) tạo ra biến toàn cục — chế độ strict cấm điều này.
- Đặt tên theo `camelCase`; hằng số thật sự cố định thì dùng `UPPER_SNAKE_CASE`.

---

## 🌍 Real World Example

```javascript
// Hằng cấu hình: không bao giờ đổi
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = Object.freeze(['image/png', 'image/jpeg']);

function validateFiles(files) {
  // Biến đếm thay đổi qua từng vòng lặp -> let
  let totalSize = 0;
  const errors = []; // const: mảng được push nhưng không bao giờ gán lại

  for (const file of files) {
    totalSize += file.size;

    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: định dạng không được hỗ trợ`);
    }

    if (totalSize > MAX_UPLOAD_SIZE) {
      errors.push('Tổng dung lượng vượt quá 5MB');
      break;
    }
  }

  return errors;
}
```

`errors` khai `const` dù nội dung liên tục thay đổi — vì bản thân biến không bao giờ trỏ sang mảng khác. Đọc `const` là biết ngay "chỗ này không gán lại", giảm một thứ phải theo dõi trong đầu.

---

## ⚠️ Common Mistakes

**Sai 1 — Nghĩ `const` làm object bất biến**

```javascript
const arr = [1, 2, 3];
arr.push(4); // ĐƯỢC, arr giờ là [1, 2, 3, 4]
```

**Sai 2 — Dùng `var` trong vòng lặp có callback bất đồng bộ**

Kết quả gần như luôn sai. Dùng `let`.

**Sai 3 — Khai báo biến mà quên từ khoá**

```javascript
function f() {
  x = 10; // tạo biến TOÀN CỤC, rò rỉ ra ngoài hàm
}
```

**Sai 4 — Dùng `let` cho mọi thứ**

Không sai về kỹ thuật, nhưng mất đi thông tin. `const` nói với người đọc rằng biến này không đổi.

---

## 📋 Summary

- Mặc định `const`, cần gán lại thì `let`, không dùng `var`.
- `let`/`const` có phạm vi khối; `var` có phạm vi hàm và rò rỉ ra khỏi `if`, `for`.
- `var` hoisting kèm giá trị `undefined`; `let`/`const` hoisting nhưng nằm trong vùng chết tạm thời, chạm vào là lỗi.
- `const` khoá ràng buộc tên–giá trị, không khoá nội dung object hay mảng.
- Mỗi vòng lặp `let` tạo một biến mới — đó là lý do callback bất đồng bộ giữ đúng giá trị.

---

## 📝 Quiz

### Question 1

Đoạn code sau in ra gì?

```javascript
const user = { name: 'An' };
user.name = 'Bình';
console.log(user.name);
```

A. `'An'` — vì `const` ngăn mọi thay đổi.

B. `'Bình'` — `const` chỉ ngăn gán lại biến, không ngăn sửa thuộc tính bên trong.

C. Ném `TypeError` ngay tại dòng gán.

D. `undefined`

**Answer: B**

**Giải thích:** `const` khoá ràng buộc giữa tên biến và giá trị, tức là `user` không thể trỏ sang object khác. Bản thân object vẫn thay đổi được. Muốn khoá cả nội dung phải dùng `Object.freeze()`, và nó cũng chỉ đóng băng một tầng.

---

### Question 2

Vì sao vòng lặp dùng `var` in ra `3, 3, 3` còn dùng `let` in ra `0, 1, 2`?

```javascript
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
```

A. Vì `var` chậm hơn `let` nên callback chạy sau khi vòng lặp kết thúc.

B. Vì `var` tạo một biến duy nhất dùng chung cho cả vòng lặp; tới lúc callback chạy thì nó đã là 3. `let` tạo biến mới mỗi vòng.

C. Vì `setTimeout` không hoạt động được với `let`.

D. Vì `var` tự động ép giá trị về số lớn nhất của vòng lặp.

**Answer: B**

**Giải thích:** `var` có phạm vi hàm nên cả ba callback cùng tham chiếu một biến `i`. Callback của `setTimeout` chỉ chạy sau khi ngăn xếp hiện tại trống, lúc đó vòng lặp đã kết thúc và `i` bằng 3. Với `let`, mỗi lần lặp tạo một ràng buộc mới nên mỗi callback bắt được giá trị riêng.
