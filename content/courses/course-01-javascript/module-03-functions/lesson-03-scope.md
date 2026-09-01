---
id: js-m3-l3
course: JavaScript Fundamentals
module: Functions
title: Phạm vi biến
order: 3
difficulty: Beginner
estimatedTime: 30
---

# Phạm vi biến

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Phân biệt phạm vi toàn cục, phạm vi hàm và phạm vi khối.
- Giải thích chuỗi phạm vi (scope chain) và cách JavaScript tìm biến.
- Hiểu che biến (shadowing) và khi nào nó gây nhầm lẫn.
- Tránh làm ô nhiễm phạm vi toàn cục.

---

## 📖 Definition

**Phạm vi** là vùng code mà một biến có thể được truy cập. JavaScript có ba mức:

| Phạm vi | Tạo bởi | Biến nào |
|---|---|---|
| Toàn cục | Ngoài mọi hàm và khối | Tất cả |
| Hàm | Thân một hàm | Tất cả, kể cả `var` |
| Khối | Cặp `{}` của `if`, `for`, `while`… | Chỉ `let` và `const` |

Khi gặp một tên biến, JavaScript tìm từ phạm vi hiện tại ra ngoài dần cho tới phạm vi toàn cục. Đường đi đó gọi là **chuỗi phạm vi**. Tìm không thấy thì ném `ReferenceError`.

Chiều tìm kiếm chỉ có **một hướng**: từ trong ra ngoài. Hàm ngoài không bao giờ nhìn thấy biến của hàm trong.

---

## ⚙️ Syntax

```javascript
const toanCuc = 'ai cũng thấy';

function ham() {
  const trongHam = 'chỉ trong hàm này';

  if (true) {
    const trongKhoi = 'chỉ trong khối if';
    console.log(toanCuc, trongHam, trongKhoi); // đủ cả ba
  }

  console.log(trongKhoi); // ReferenceError
}
```

### Example 1 - Chuỗi phạm vi

```javascript
const a = 'toàn cục';

function ngoai() {
  const b = 'ngoài';

  function trong() {
    const c = 'trong';
    console.log(a, b, c); // đọc được cả ba: tìm từ trong ra ngoài
  }

  trong();
  console.log(c); // ReferenceError — ngoài không thấy biến của trong
}
```

### Example 2 - Che biến

```javascript
const ten = 'toàn cục';

function f() {
  const ten = 'trong hàm'; // che biến toàn cục
  console.log(ten);        // 'trong hàm'
}

f();
console.log(ten); // 'toàn cục' — biến ngoài không bị ảnh hưởng
```

Che biến hợp lệ về cú pháp nhưng dễ gây nhầm. Đặt tên khác nhau vẫn tốt hơn.

```javascript
// Che biến trong vòng lặp — trường hợp thường gặp và chấp nhận được
const items = [1, 2, 3];

for (const item of items) {
  const items = item * 2; // che `items` bên ngoài — dễ nhầm, nên đổi tên
}
```

### Example 3 - Phạm vi khối chỉ áp cho let/const

```javascript
function f() {
  if (true) {
    var a = 'var';
    let b = 'let';
    const c = 'const';
  }

  console.log(a); // 'var'          — var chỉ biết ranh giới HÀM
  console.log(b); // ReferenceError — let dừng ở khối
  console.log(c); // ReferenceError
}
```

### Example 4 - Ô nhiễm phạm vi toàn cục

```javascript
// Không dùng từ khoá -> tạo biến TOÀN CỤC, dù đang ở trong hàm
function f() {
  x = 10; // rò rỉ ra toàn cục
}

f();
console.log(x); // 10 (!)

// Chế độ strict chặn điều này
'use strict';
function g() {
  y = 10; // ReferenceError: y is not defined
}
```

Module ES tự động ở chế độ strict, nên với `import`/`export` bạn được bảo vệ sẵn.

### Example 5 - Dùng khối để giới hạn phạm vi

```javascript
// Biến tạm chỉ cần trong một đoạn ngắn
{
  const tam = tinhToanNang();
  ketQua = xuLy(tam);
}
// `tam` đã biến mất khỏi phạm vi ở đây

// Trong switch: mỗi case một khối riêng
switch (action) {
  case 'CREATE': {
    const payload = buildPayload();
    return create(payload);
  }
  case 'UPDATE': {
    const payload = buildPatch(); // cùng tên nhưng khác khối -> hợp lệ
    return update(payload);
  }
}
```

---

## 📌 Notes

- **Module có phạm vi riêng.** Biến khai ở cấp cao nhất của một file module không phải là biến toàn cục.
- **`this` không theo quy tắc phạm vi.** Nó được quyết định bởi cách gọi hàm (trừ arrow function).
- **Biến toàn cục trong trình duyệt** gắn vào `window`; trong Node là `globalThis`.
- Càng ít biến ở phạm vi rộng thì càng ít khả năng trùng tên và ghi đè ngoài ý muốn.

---

## 🌍 Real World Example

```javascript
// config.js — phạm vi module, không phải toàn cục
const DEFAULTS = Object.freeze({ port: 3000, host: 'localhost' });

// Biến này chỉ file này thấy; file khác import cũng không chạm được.
let cached = null;

export function getConfig() {
  // Chỉ đọc biến môi trường một lần rồi nhớ lại.
  if (cached) return cached;

  cached = {
    port: Number(process.env.PORT) || DEFAULTS.port,
    host: process.env.HOST || DEFAULTS.host,
  };

  return cached;
}

export function resetConfig() {
  cached = null; // dùng trong test
}
```

`cached` là trạng thái riêng của module: `getConfig` và `resetConfig` cùng đọc ghi được nó, nhưng không file nào khác chạm tới. Đây là cách đóng gói trạng thái mà không cần class.

```javascript
/** Phạm vi khối giúp tái sử dụng tên biến an toàn. */
function buildReport(courses) {
  const lines = [];

  {
    const total = courses.length;
    lines.push(`Tổng số khoá: ${total}`);
  }

  {
    const total = courses.filter((c) => c.published).length; // cùng tên, khác khối
    lines.push(`Đã xuất bản: ${total}`);
  }

  return lines.join('\n');
}
```

---

## ⚠️ Common Mistakes

**Sai 1 — Gán biến không khai báo**

Tạo biến toàn cục ngoài ý muốn, và hai phần code khác nhau có thể ghi đè lẫn nhau.

**Sai 2 — Nghĩ `var` có phạm vi khối**

```javascript
for (var i = 0; i < 3; i++) { }
console.log(i); // 3 — i vẫn tồn tại sau vòng lặp
```

**Sai 3 — Che biến rồi tưởng đã sửa biến ngoài**

```javascript
let count = 0;
function f() {
  let count = 10; // biến MỚI, không phải biến ngoài
}
f();
console.log(count); // 0
```

**Sai 4 — Nghĩ biến cấp cao nhất của module là toàn cục**

Mỗi module có phạm vi riêng; muốn chia sẻ thì phải `export`.

**Sai 5 — Khai báo mọi thứ ở phạm vi rộng nhất**

Biến chỉ dùng trong một vòng lặp thì khai trong vòng lặp đó.

---

## 📋 Summary

- Ba mức phạm vi: toàn cục, hàm, khối. `var` chỉ biết phạm vi hàm; `let`/`const` biết phạm vi khối.
- Chuỗi phạm vi tìm biến từ trong ra ngoài, không bao giờ ngược lại.
- Che biến hợp lệ nhưng dễ gây nhầm — đặt tên khác nhau vẫn tốt hơn.
- Gán biến không khai báo tạo ra biến toàn cục; chế độ strict và module ES chặn điều này.
- Mỗi module có phạm vi riêng, nên đây là chỗ tốt để giữ trạng thái nội bộ.

---

## 📝 Quiz

### Question 1

Đoạn code sau in ra gì?

```javascript
let count = 0;
function f() {
  let count = 10;
  count += 5;
}
f();
console.log(count);
```

A. `15`

B. `10`

C. `0` — `let count` bên trong hàm tạo một biến MỚI che biến ngoài, mọi thay đổi chỉ tác dụng lên biến mới.

D. Ném `SyntaxError` vì khai báo trùng tên.

**Answer: C**

**Giải thích:** Đây là che biến (shadowing). Biến `count` bên trong hàm hoàn toàn độc lập với biến cùng tên bên ngoài. Muốn sửa biến ngoài thì đừng khai báo lại — chỉ viết `count += 5`.

---

### Question 2

Vì sao `console.log(i)` sau vòng lặp `for (var i = 0; i < 3; i++)` in ra `3` thay vì báo lỗi?

A. Vì JavaScript giữ lại biến của vòng lặp cuối cùng để tiện gỡ lỗi.

B. Vì `var` có phạm vi hàm chứ không phải phạm vi khối, nên `i` tồn tại trong cả hàm bao quanh vòng lặp.

C. Vì `i` tự động trở thành biến toàn cục.

D. Vì vòng lặp `for` không tạo phạm vi cho bất kỳ loại biến nào.

**Answer: B**

**Giải thích:** `var` chỉ nhận ranh giới hàm. Khai báo trong phần đầu của `for` cũng như khai báo ở đầu hàm, nên sau vòng lặp biến vẫn còn và giữ giá trị khiến điều kiện dừng — ở đây là `3`. Đổi sang `let` thì `i` chỉ tồn tại trong vòng lặp và dòng `console.log` sẽ ném `ReferenceError`.
