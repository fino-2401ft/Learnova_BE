---
id: js-m1-l1
course: JavaScript Fundamentals
module: JavaScript Basics
title: Giới thiệu JavaScript
order: 1
difficulty: Beginner
estimatedTime: 25
---

# Giới thiệu JavaScript

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Nói được JavaScript là gì và chạy ở đâu.
- Phân biệt JavaScript với ECMAScript.
- Chạy được đoạn JavaScript đầu tiên trong trình duyệt và trong Node.js.
- Hiểu vì sao JavaScript vừa động vừa yếu kiểu.

---

## 📖 Definition

JavaScript là ngôn ngữ lập trình thông dịch, **động kiểu** (dynamically typed), hỗ trợ nhiều mô hình lập trình: hướng đối tượng dựa trên prototype, hàm bậc cao, và lập trình mệnh lệnh.

Có hai tên hay bị lẫn:

- **ECMAScript** là *đặc tả* — bản mô tả ngôn ngữ, do TC39 soạn và cập nhật mỗi năm (ES2015, ES2016…).
- **JavaScript** là *hiện thực* của đặc tả đó, chạy trong một engine cụ thể: V8 (Chrome, Node.js), SpiderMonkey (Firefox), JavaScriptCore (Safari).

Ban đầu JavaScript chỉ chạy trong trình duyệt. Từ 2009, Node.js đem engine V8 ra khỏi trình duyệt, và cùng một ngôn ngữ viết được cả frontend lẫn backend.

**Động kiểu** nghĩa là biến không gắn với một kiểu cố định: hôm nay giữ số, mai giữ chuỗi. **Yếu kiểu** nghĩa là ngôn ngữ tự chuyển kiểu khi cần — `"5" * 2` cho `10`. Hai đặc điểm này khiến JavaScript viết nhanh, nhưng cũng khiến lỗi kiểu chỉ lộ ra lúc chạy. Đó chính là lý do TypeScript ra đời.

---

## ⚙️ Syntax

Câu lệnh kết thúc bằng dấu chấm phẩy (có thể bỏ, nhưng nên giữ cho nhất quán). Chú thích dùng `//` cho một dòng và `/* */` cho nhiều dòng.

```javascript
// Chú thích một dòng

/*
  Chú thích
  nhiều dòng
*/

console.log('Xin chào Learnova');
```

### Example 1 - Chạy trong trình duyệt

```html
<!doctype html>
<html lang="vi">
  <body>
    <h1>Trang thử</h1>

    <!-- Đặt cuối body để HTML đã dựng xong trước khi script chạy -->
    <script>
      console.log('Chào từ trình duyệt');
      document.querySelector('h1').textContent = 'Đã đổi bằng JavaScript';
    </script>
  </body>
</html>
```

Mở trang, bấm F12 → tab Console để thấy kết quả.

### Example 2 - Chạy bằng Node.js

```javascript
// file: hello.js
console.log('Chào từ Node.js');
console.log('Phiên bản Node:', process.version);
```

```bash
node hello.js
```

`process` là object toàn cục **chỉ có trong Node**, không tồn tại trong trình duyệt. Ngược lại `document` và `window` chỉ có trong trình duyệt. Cùng một ngôn ngữ nhưng môi trường chạy cung cấp bộ API khác nhau.

### Example 3 - Động kiểu và yếu kiểu

```javascript
let x = 42;        // số
x = 'bốn hai';     // giờ là chuỗi — hoàn toàn hợp lệ
x = true;          // giờ là boolean

console.log('5' * 2);   // 10   — chuỗi được ép thành số
console.log('5' + 2);   // '52' — số được ép thành chuỗi
console.log(1 + true);  // 2    — true thành 1
```

Toán tử `+` vừa là cộng số vừa là nối chuỗi, nên chỉ cần một toán hạng là chuỗi thì cả biểu thức thành nối chuỗi. Đây là nguồn lỗi kinh điển của người mới.

---

## 📌 Notes

- **Phân biệt hoa thường.** `myVar` và `myvar` là hai biến khác nhau.
- **`console.log` không phải một phần của ngôn ngữ.** Nó do môi trường cung cấp — trình duyệt và Node đều có, nhưng cách hiển thị khác nhau.
- **Chế độ strict** (`'use strict'`) bật các quy tắc chặt hơn. Module ES tự động ở chế độ này.
- Đặc tả cập nhật hằng năm, nhưng ngôn ngữ **giữ tương thích ngược**: code viết năm 2010 vẫn chạy.

---

## 🌍 Real World Example

Cùng một đoạn logic, chạy được ở cả hai môi trường vì chỉ dùng cú pháp thuần:

```javascript
// utils/format.js — không phụ thuộc môi trường
export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
```

```javascript
// Trong trình duyệt
document.querySelector('#price').textContent = formatCurrency(1500000);

// Trong Node.js
console.log(formatCurrency(1500000)); // 1.500.000 ₫
```

`Intl` thuộc về chuẩn ECMAScript nên có ở cả hai nơi. Còn `document` và `console.log` thì mỗi môi trường một kiểu. Tách logic thuần khỏi phần phụ thuộc môi trường là cách để dùng lại code giữa frontend và backend.

---

## ⚠️ Common Mistakes

**Sai 1 — Nhầm `+` cộng số với `+` nối chuỗi**

```javascript
const a = '10';
const b = 5;
console.log(a + b); // '105', không phải 15

console.log(Number(a) + b); // 15
```

**Sai 2 — Nghĩ Java và JavaScript liên quan tới nhau**

Hai ngôn ngữ hoàn toàn khác nhau. Tên gọi giống nhau chỉ là chuyện tiếp thị năm 1995.

**Sai 3 — Dùng `document` trong Node.js**

```javascript
// ReferenceError: document is not defined
document.getElementById('app');
```

**Sai 4 — Đặt `<script>` ở `<head>` rồi thao tác DOM**

Script chạy trước khi HTML dựng xong nên `querySelector` trả về `null`. Đặt cuối `<body>`, hoặc dùng thuộc tính `defer`.

---

## 📋 Summary

- ECMAScript là đặc tả, JavaScript là hiện thực chạy trong một engine cụ thể.
- Cùng một ngôn ngữ chạy được ở trình duyệt và ở Node.js, nhưng mỗi môi trường cấp một bộ API riêng.
- JavaScript động kiểu (biến đổi kiểu tự do) và yếu kiểu (tự ép kiểu khi cần).
- `+` vừa cộng vừa nối chuỗi — chỉ cần một toán hạng là chuỗi thì cả biểu thức thành chuỗi.

---

## 📝 Quiz

### Question 1

`console.log('5' + 2)` in ra gì?

A. `7`

B. `'52'`

C. `NaN`

D. Ném lỗi vì không cộng được chuỗi với số.

**Answer: B**

**Giải thích:** Toán tử `+` ưu tiên nối chuỗi khi có ít nhất một toán hạng là chuỗi, nên số `2` được ép thành `'2'` rồi nối lại. Ngược lại `'5' * 2` cho `10`, vì `*` chỉ làm việc với số nên chuỗi bị ép sang số.

---

### Question 2

Đâu là khác biệt đúng giữa ECMAScript và JavaScript?

A. ECMAScript chạy trên server, JavaScript chạy trên trình duyệt.

B. ECMAScript là bản cũ, JavaScript là bản mới thay thế.

C. ECMAScript là đặc tả ngôn ngữ do TC39 soạn; JavaScript là hiện thực của đặc tả đó trong một engine.

D. Hai tên gọi hoàn toàn đồng nghĩa, không có khác biệt nào.

**Answer: C**

**Giải thích:** TC39 soạn đặc tả ECMAScript và cập nhật hằng năm. Các engine như V8 hay SpiderMonkey hiện thực đặc tả đó, và thứ chúng ta viết hằng ngày là JavaScript. Vì vậy mới có chuyện một tính năng đã vào đặc tả nhưng engine nào đó chưa hỗ trợ.
