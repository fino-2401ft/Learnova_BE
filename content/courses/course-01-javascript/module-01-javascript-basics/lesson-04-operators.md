---
id: js-m1-l4
course: JavaScript Fundamentals
module: JavaScript Basics
title: Toán tử
order: 4
difficulty: Beginner
estimatedTime: 30
---

# Toán tử

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Dùng thành thạo toán tử số học, so sánh và logic.
- Giải thích vì sao luôn nên dùng `===` thay cho `==`.
- Dùng `??` và `?.` đúng chỗ, phân biệt với `||`.
- Biết giá trị nào là falsy trong JavaScript.

---

## 📖 Definition

Toán tử chia theo nhóm:

| Nhóm | Toán tử |
|---|---|
| Số học | `+` `-` `*` `/` `%` `**` `++` `--` |
| Gán | `=` `+=` `-=` `*=` `/=` `??=` `\|\|=` `&&=` |
| So sánh | `===` `!==` `==` `!=` `>` `<` `>=` `<=` |
| Logic | `&&` `\|\|` `!` |
| Rỗng | `??` (nullish coalescing), `?.` (optional chaining) |
| Ba ngôi | `điều_kiện ? a : b` |

Khái niệm phải nhớ nằm lòng: **falsy**. JavaScript coi đúng **tám** giá trị là falsy, mọi thứ khác đều truthy:

```
false, 0, -0, 0n, '', null, undefined, NaN
```

Đáng chú ý: `'0'`, `'false'`, `[]` và `{}` đều **truthy**.

---

## ⚙️ Syntax

```javascript
a === b     // bằng nhau, KHÔNG ép kiểu — luôn dùng cái này
a == b      // bằng nhau, CÓ ép kiểu — tránh
a ?? b      // a nếu a khác null/undefined, ngược lại b
a?.b        // a.b nếu a khác null/undefined, ngược lại undefined
a || b      // a nếu a truthy, ngược lại b
```

### Example 1 - `===` và `==`

```javascript
console.log(1 === '1');   // false — khác kiểu
console.log(1 == '1');    // true  — '1' được ép thành 1

console.log(0 == false);        // true
console.log('' == false);       // true
console.log(null == undefined); // true
console.log([] == false);       // true  (!)
console.log([] == ![]);         // true  (!!)
```

`==` chạy một bộ quy tắc ép kiểu dài và phản trực giác. **Luôn dùng `===`**, ngoại lệ duy nhất đáng chấp nhận là `x == null` để kiểm tra cả `null` lẫn `undefined` trong một lần.

### Example 2 - `??` khác `||` ở chỗ nào

```javascript
// || lấy giá trị bên phải khi bên trái FALSY
console.log(0 || 100);          // 100  <- hỏng: 0 là giá trị hợp lệ
console.log('' || 'mặc định');  // 'mặc định'

// ?? chỉ lấy bên phải khi bên trái là null hoặc undefined
console.log(0 ?? 100);          // 0    <- đúng
console.log('' ?? 'mặc định');  // ''   <- đúng
console.log(null ?? 100);       // 100
```

Đây là lỗi rất hay gặp khi đặt giá trị mặc định:

```javascript
// SAI: người dùng đặt limit = 0 sẽ bị ghi đè thành 20
const limit = options.limit || 20;

// ĐÚNG
const limit = options.limit ?? 20;
```

### Example 3 - Optional chaining

```javascript
const user = { profile: { name: 'An' } };

console.log(user.profile.name);        // 'An'
console.log(user.address.city);        // TypeError: Cannot read properties of undefined

console.log(user.address?.city);       // undefined — không ném lỗi
console.log(user.getName?.());         // undefined — gọi hàm nếu có
console.log(user.tags?.[0]);           // undefined — truy cập chỉ số nếu có

// Kết hợp với ??
const city = user.address?.city ?? 'Chưa cập nhật';
```

`?.` dừng chuỗi truy cập ngay khi gặp `null` hoặc `undefined` và trả về `undefined`, thay vì ném lỗi.

### Example 4 - Đoản mạch của `&&` và `||`

```javascript
// && trả về toán hạng ĐẦU TIÊN falsy, hoặc toán hạng cuối
console.log(1 && 2 && 3);     // 3
console.log(1 && 0 && 3);     // 0

// || trả về toán hạng ĐẦU TIÊN truthy, hoặc toán hạng cuối
console.log(null || 0 || 'x'); // 'x'

// Ứng dụng: chỉ chạy khi có giá trị
user && sendEmail(user.email);

// Ứng dụng trong React
{isLoading && <Spinner />}
```

Hai toán tử này **không** trả về boolean — chúng trả về chính một trong hai toán hạng.

### Example 5 - Toán tử số dư và luỹ thừa

```javascript
console.log(10 % 3);   // 1
console.log(-7 % 3);   // -1  — dấu theo số bị chia, không giống toán học
console.log(2 ** 10);  // 1024

// Kiểm tra chẵn lẻ
const isEven = (n) => n % 2 === 0;

// Xoay vòng chỉ số mảng
const next = (i, length) => (i + 1) % length;
```

---

## 📌 Notes

- **`++i` và `i++` khác nhau ở giá trị trả về**, không khác ở tác dụng lên `i`.
- **`typeof` cũng là toán tử**, không phải hàm — `typeof x` chứ không cần ngoặc.
- **Không trộn `??` với `||`/`&&` mà không có ngoặc** — đó là lỗi cú pháp, do đặc tả cố ý buộc viết rõ ý.
- `+chuỗi` là cách ép sang số nhanh: `+'42'` cho `42`.

---

## 🌍 Real World Example

```javascript
/** Chuẩn hoá tham số phân trang từ query string. */
function normalizePagination(query) {
  // ?? chứ không phải ||: page=0 là giá trị người dùng gửi, cần được xử lý
  // như số 0 rồi bị chặn về 1, chứ không bị coi như "không gửi".
  const rawPage = query.page ?? '1';
  const rawLimit = query.limit ?? '20';

  const page = Math.max(1, Number(rawPage) || 1);
  const limit = Math.min(100, Math.max(1, Number(rawLimit) || 20));

  return { page, limit, skip: (page - 1) * limit };
}
```

```javascript
/** Lấy tên hiển thị, đi qua nhiều tầng có thể thiếu. */
function displayName(user) {
  return (
    user?.profile?.fullName ??
    user?.username ??
    user?.email?.split('@')[0] ??
    'Người dùng ẩn danh'
  );
}
```

Không có `?.` và `??`, hàm trên phải viết thành mười dòng `if` lồng nhau. Chuỗi này đọc từ trên xuống đúng như cách ta nói: "lấy tên đầy đủ, không có thì lấy username, không có nữa thì lấy phần trước @".

---

## ⚠️ Common Mistakes

**Sai 1 — Dùng `||` để đặt mặc định cho số hoặc chuỗi**

```javascript
// SAI: count = 0 bị biến thành 10
const count = input.count || 10;

// ĐÚNG
const count = input.count ?? 10;
```

**Sai 2 — Dùng `==`**

```javascript
if (userInput == 0) { } // '' và '0' và false đều lọt vào
if (userInput === 0) { }
```

**Sai 3 — Nghĩ `[]` và `{}` là falsy**

```javascript
if ([]) console.log('chạy');  // CÓ chạy — mảng rỗng là truthy
if ([].length) console.log(); // cách kiểm tra đúng
```

**Sai 4 — Nghĩ `&&` trả về boolean**

```javascript
const result = 'a' && 'b';
console.log(result); // 'b', không phải true
```

**Sai 5 — Nhầm số dư của số âm**

```javascript
console.log(-7 % 3); // -1, không phải 2
```

---

## 📋 Summary

- Luôn dùng `===`; `==` chạy bộ quy tắc ép kiểu phản trực giác.
- Tám giá trị falsy: `false`, `0`, `-0`, `0n`, `''`, `null`, `undefined`, `NaN`. `[]` và `{}` là truthy.
- `??` chỉ thay thế khi giá trị là `null`/`undefined`; `||` thay thế mọi giá trị falsy — dùng `??` cho giá trị mặc định.
- `?.` dừng chuỗi truy cập khi gặp `null`/`undefined` thay vì ném lỗi.
- `&&` và `||` trả về một trong hai toán hạng, không trả về boolean.

---

## 📝 Quiz

### Question 1

`const limit = options.limit || 20;` sai ở đâu khi người dùng gửi `limit = 0`?

A. Không sai gì, `limit` sẽ bằng `0`.

B. `0` là falsy nên `||` bỏ qua và trả về `20`, làm mất giá trị người dùng thật sự gửi.

C. Ném `TypeError` vì không so sánh được số với số.

D. `limit` sẽ bằng `undefined`.

**Answer: B**

**Giải thích:** `||` thay thế mọi giá trị falsy, mà `0` nằm trong danh sách đó. Kết quả là người dùng gửi `0` cũng bị đối xử như không gửi gì. Dùng `??` để chỉ thay thế khi giá trị là `null` hoặc `undefined`.

---

### Question 2

`console.log(1 && 0 && 3)` in ra gì?

A. `true`

B. `false`

C. `0` — vì `&&` trả về toán hạng falsy đầu tiên mà nó gặp.

D. `3`

**Answer: C**

**Giải thích:** `&&` đoản mạch tại toán hạng falsy đầu tiên và trả về **chính giá trị đó**, không phải boolean. Ở đây `1` truthy nên đi tiếp, gặp `0` là falsy nên dừng và trả `0`. Tương tự `||` trả về toán hạng truthy đầu tiên.
