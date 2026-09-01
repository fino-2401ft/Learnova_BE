---
id: js-m1-l3
course: JavaScript Fundamentals
module: JavaScript Basics
title: Kiểu dữ liệu
order: 3
difficulty: Beginner
estimatedTime: 30
---

# Kiểu dữ liệu

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Kể đủ bảy kiểu nguyên thuỷ của JavaScript.
- Phân biệt kiểu nguyên thuỷ với kiểu tham chiếu.
- Dùng `typeof` đúng cách, và biết chỗ nó nói dối.
- Hiểu vì sao `Number` mất chính xác với số nguyên lớn.

---

## 📖 Definition

Theo đặc tả, JavaScript có **bảy kiểu nguyên thuỷ** và một kiểu còn lại là **object**.

| Kiểu | `typeof` trả về | Ghi chú |
|---|---|---|
| `String` | `'string'` | Chuỗi ký tự |
| `Number` | `'number'` | Số thực dấu phẩy động 64-bit IEEE 754 |
| `BigInt` | `'bigint'` | Số nguyên lớn tuỳ ý, hậu tố `n` |
| `Boolean` | `'boolean'` | `true` / `false` |
| `Undefined` | `'undefined'` | Chưa được gán giá trị |
| `Null` | **`'object'`** | Lỗi lịch sử — phải kiểm tra bằng `=== null` |
| `Symbol` | `'symbol'` | Giá trị định danh duy nhất |

Khác biệt cốt lõi giữa hai nhóm:

- **Nguyên thuỷ là bất biến và so sánh theo giá trị.** `'abc'` luôn bằng `'abc'`.
- **Object là khả biến và so sánh theo tham chiếu.** Hai object có nội dung y hệt vẫn khác nhau.

---

## ⚙️ Syntax

```javascript
const s = 'chuỗi';
const n = 42;
const big = 9007199254740993n;
const b = true;
const u = undefined;
const nothing = null;
const sym = Symbol('id');

const obj = { a: 1 };
const arr = [1, 2, 3];
```

### Example 1 - typeof và chỗ nó nói dối

```javascript
typeof 'abc';        // 'string'
typeof 42;           // 'number'
typeof true;         // 'boolean'
typeof undefined;    // 'undefined'
typeof Symbol();     // 'symbol'
typeof 10n;          // 'bigint'

typeof null;         // 'object'   <- SAI, nhưng không sửa được vì phải giữ tương thích
typeof [];           // 'object'   <- mảng cũng là object
typeof function () {}; // 'function' <- trường hợp đặc biệt

// Kiểm tra đúng cách
value === null;        // cho null
Array.isArray(value);  // cho mảng
```

`typeof null === 'object'` là lỗi từ bản JavaScript đầu tiên năm 1995. Sửa nó sẽ làm hỏng vô số website đang chạy, nên nó ở lại vĩnh viễn.

### Example 2 - So sánh theo giá trị và theo tham chiếu

```javascript
// Nguyên thuỷ: so theo giá trị
console.log('abc' === 'abc'); // true
console.log(42 === 42);       // true

// Object: so theo tham chiếu
console.log({ a: 1 } === { a: 1 }); // false — hai object khác nhau
console.log([1, 2] === [1, 2]);     // false

const x = { a: 1 };
const y = x;                   // y trỏ tới CÙNG object
console.log(x === y);          // true
y.a = 99;
console.log(x.a);              // 99 — sửa qua y thì x cũng thấy
```

Đây là nguyên nhân của rất nhiều lỗi khó tìm: truyền một object vào hàm rồi hàm đó sửa nó, và người gọi không hề biết.

### Example 3 - Giới hạn chính xác của Number

```javascript
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991

// Vượt ngưỡng an toàn thì mất chính xác
console.log(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2); // true (!)

// BigInt xử lý đúng
console.log(9007199254740992n + 1n === 9007199254740992n + 2n); // false

// Số thực cũng không chính xác tuyệt đối
console.log(0.1 + 0.2);            // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);    // false
console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON); // true — cách so đúng
```

`Number` là số thực 64-bit theo chuẩn IEEE 754, giống `double` của các ngôn ngữ khác. Nó không biểu diễn chính xác được `0.1`, y như hệ thập phân không viết chính xác được `1/3`.

### Example 4 - undefined và null

```javascript
let a;
console.log(a); // undefined — chưa gán gì cả

const b = null; // null — CỐ Ý gán "không có giá trị"

console.log(undefined == null);  // true  — so lỏng, cả hai đều "rỗng"
console.log(undefined === null); // false — khác kiểu
```

Quy ước thực dụng: `undefined` là do hệ thống ("chưa có"), `null` là do lập trình viên ("cố tình để trống").

---

## 📌 Notes

- **`NaN` có kiểu `'number'`** và không bằng chính nó: `NaN === NaN` là `false`. Kiểm tra bằng `Number.isNaN()`.
- **Chuỗi bất biến.** `s[0] = 'X'` không có tác dụng; mọi thao tác chuỗi đều trả về chuỗi mới.
- **Truy cập thuộc tính trên nguyên thuỷ** vẫn được vì JavaScript tự bọc tạm nó vào object rồi bỏ đi ngay sau đó.
- Tiền cần chính xác tuyệt đối thì đừng dùng `Number` — lưu theo đơn vị nhỏ nhất (đồng, xu) dưới dạng số nguyên.

---

## 🌍 Real World Example

```javascript
/**
 * Nhận diện kiểu chính xác hơn typeof.
 *
 * typeof không phân biệt được mảng, null và object thường — cả ba đều trả 'object'.
 */
function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

console.log(typeOf(null));      // 'null'
console.log(typeOf([1, 2]));    // 'array'
console.log(typeOf({}));        // 'object'
console.log(typeOf(NaN));       // 'number'
```

```javascript
// Xử lý tiền: lưu theo đơn vị nhỏ nhất, không dùng số thực.
const priceInDong = 1_500_000;          // số nguyên, chính xác tuyệt đối
const total = priceInDong * 3;

// SAI: cộng dồn số thực sẽ tích luỹ sai số
let wrong = 0;
for (let i = 0; i < 10; i++) wrong += 0.1;
console.log(wrong);            // 0.9999999999999999
console.log(wrong === 1);      // false
```

Nếu đây là hoá đơn, khách hàng sẽ thấy tổng tiền lệch một đồng và không ai giải thích được vì sao.

---

## ⚠️ Common Mistakes

**Sai 1 — Dùng `typeof` để kiểm tra null**

```javascript
// SAI: luôn đúng cho cả object thường
if (typeof value === 'object') { }

// ĐÚNG
if (value === null) { }
```

**Sai 2 — So sánh số thực bằng `===`**

```javascript
// SAI
if (0.1 + 0.2 === 0.3) { }

// ĐÚNG
if (Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON) { }
```

**Sai 3 — Dùng `isNaN()` thay vì `Number.isNaN()`**

```javascript
isNaN('abc');        // true  — ép kiểu trước rồi mới kiểm tra
Number.isNaN('abc'); // false — đúng, vì 'abc' không phải giá trị NaN
```

**Sai 4 — Nghĩ hai object giống nội dung thì bằng nhau**

```javascript
{ a: 1 } === { a: 1 } // false
```

Muốn so nội dung phải tự viết hàm so sánh, hoặc so `JSON.stringify` (chỉ dùng được cho dữ liệu đơn giản).

---

## 📋 Summary

- Bảy kiểu nguyên thuỷ: String, Number, BigInt, Boolean, Undefined, Null, Symbol. Mọi thứ còn lại là object.
- Nguyên thuỷ bất biến và so theo giá trị; object khả biến và so theo tham chiếu.
- `typeof null` trả `'object'` — lỗi lịch sử không sửa được; dùng `=== null`.
- `Number` là số thực 64-bit: mất chính xác ngoài `MAX_SAFE_INTEGER`, và `0.1 + 0.2 !== 0.3`.
- `undefined` là "chưa có", `null` là "cố tình để trống".

---

## 📝 Quiz

### Question 1

`typeof null` trả về gì?

A. `'null'`

B. `'undefined'`

C. `'object'` — một lỗi lịch sử được giữ lại để không phá vỡ code cũ.

D. Ném `TypeError`.

**Answer: C**

**Giải thích:** Đây là lỗi có từ bản JavaScript đầu tiên. Sửa nó sẽ làm hỏng rất nhiều website đang chạy nên đặc tả giữ nguyên vĩnh viễn. Muốn kiểm tra `null` phải so trực tiếp `value === null`.

---

### Question 2

Vì sao `0.1 + 0.2 === 0.3` cho `false`?

A. Vì JavaScript làm tròn sai khi cộng.

B. Vì `Number` là số thực 64-bit IEEE 754, không biểu diễn chính xác được `0.1` và `0.2` ở hệ nhị phân.

C. Vì `===` không so sánh được số thực.

D. Vì phải dùng `BigInt` cho mọi phép cộng.

**Answer: B**

**Giải thích:** `0.1` ở hệ nhị phân là số vô hạn tuần hoàn, giống `1/3` ở hệ thập phân. Kết quả thực tế là `0.30000000000000004`. Đây không phải đặc thù của JavaScript — mọi ngôn ngữ dùng `double` đều vậy. Với tiền tệ, hãy lưu theo đơn vị nhỏ nhất dưới dạng số nguyên.
