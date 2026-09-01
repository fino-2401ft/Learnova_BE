---
id: js-m1-l5
course: JavaScript Fundamentals
module: JavaScript Basics
title: Chuyển đổi kiểu
order: 5
difficulty: Beginner
estimatedTime: 30
---

# Chuyển đổi kiểu

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Phân biệt ép kiểu tường minh và ép kiểu ngầm định.
- Chuyển đổi an toàn giữa chuỗi, số và boolean.
- Đọc được kết quả của những biểu thức ép kiểu kỳ quặc.
- Chọn đúng công cụ: `Number()`, `parseInt()` hay `+`.

---

## 📖 Definition

JavaScript tự chuyển kiểu khi toán tử cần một kiểu khác với thứ nó nhận được. Chuyện đó gọi là **ép kiểu ngầm định** (implicit coercion), và nó là nguồn của phần lớn các biểu thức "kỳ quặc" mà mọi người hay đem ra chế giễu JavaScript.

Ngược lại, **ép kiểu tường minh** (explicit conversion) là khi ta tự gọi `Number()`, `String()`, `Boolean()`.

Nguyên tắc: **luôn ép tường minh.** Code dài hơn vài ký tự nhưng người đọc không phải nhớ bảng quy tắc ép kiểu.

---

## ⚙️ Syntax

```javascript
// Sang số
Number('42');      // 42
parseInt('42px');  // 42
parseFloat('3.14'); // 3.14
+'42';             // 42

// Sang chuỗi
String(42);        // '42'
(42).toString();   // '42'
`${42}`;           // '42'

// Sang boolean
Boolean('');       // false
!!'abc';           // true
```

### Example 1 - Sang số: ba công cụ, ba hành vi

```javascript
Number('42');       // 42
Number('42px');     // NaN     <- toàn bộ chuỗi phải là số
Number('');         // 0       <- chuỗi rỗng thành 0 (!)
Number('  12  ');   // 12      <- bỏ qua khoảng trắng
Number(null);       // 0
Number(undefined);  // NaN
Number(true);       // 1
Number([]);         // 0       (!)
Number([5]);        // 5       (!)
Number([1, 2]);     // NaN
Number({});         // NaN

parseInt('42px');   // 42      <- đọc tới ký tự không hợp lệ thì dừng
parseInt('px42');   // NaN     <- phải bắt đầu bằng số
parseInt('3.9');    // 3       <- cắt phần thập phân
parseFloat('3.9kg'); // 3.9
```

Chọn thế nào:

- Dữ liệu **phải** là số hoàn chỉnh (JSON, query string) → `Number()`.
- Dữ liệu có đơn vị đi kèm (`'16px'`) → `parseInt()` / `parseFloat()`.

### Example 2 - Sang chuỗi

```javascript
String(42);          // '42'
String(null);        // 'null'
String(undefined);   // 'undefined'
String([1, 2, 3]);   // '1,2,3'     <- mảng nối bằng dấu phẩy
String({});          // '[object Object]'

// null và undefined không có phương thức .toString()
null.toString();     // TypeError

// Template literal an toàn hơn
`${null}`;           // 'null'
```

`String({})` cho `'[object Object]'` — chuỗi này xuất hiện trên giao diện nghĩa là ai đó vô tình nối một object vào chuỗi.

### Example 3 - Sang boolean

```javascript
// Tám giá trị falsy
Boolean(false);     Boolean(0);        Boolean(-0);
Boolean(0n);        Boolean('');       Boolean(null);
Boolean(undefined); Boolean(NaN);      // tất cả đều false

// Mọi thứ còn lại là truthy — kể cả những thứ trông "rỗng"
Boolean('0');       // true
Boolean('false');   // true
Boolean([]);        // true
Boolean({});        // true
Boolean(function () {}); // true
```

### Example 4 - Những biểu thức kỳ quặc, và lời giải thích

```javascript
[] + [];        // ''             hai mảng thành hai chuỗi rỗng, nối lại
[] + {};        // '[object Object]'
'5' - 3;        // 2              '-' chỉ làm việc với số
'5' + 3;        // '53'           '+' ưu tiên nối chuỗi
true + true;    // 2              true thành 1
null + 1;       // 1              null thành 0
undefined + 1;  // NaN            undefined thành NaN
[] == false;    // true           cả hai cùng bị ép về 0
```

Không có gì huyền bí: `+` ưu tiên nối chuỗi khi có toán hạng là chuỗi, còn mọi toán tử số học khác ép hết về số. Object bị ép kiểu bằng cách gọi `valueOf()` rồi `toString()`.

Biết để **đọc hiểu code người khác**, không phải để viết như vậy.

---

## 📌 Notes

- **`Number('')` cho `0`**, không phải `NaN`. Chuỗi rỗng từ ô input trống sẽ lặng lẽ thành số 0.
- **`parseInt` nên luôn kèm cơ số**: `parseInt('08', 10)`. Không có nó, một số môi trường cũ đọc `'08'` theo hệ tám.
- **`JSON.stringify(undefined)` trả về `undefined`**, không phải chuỗi `'undefined'`.
- **`NaN` lan truyền**: mọi phép tính có `NaN` đều cho `NaN`.

---

## 🌍 Real World Example

```javascript
/**
 * Đọc số từ query string một cách an toàn.
 *
 * Không dùng `Number(raw) || fallback` được: `Number('0')` cho `0`, mà `0` là
 * falsy nên sẽ bị fallback nuốt mất. Phải kiểm tra NaN một cách tường minh.
 */
function readNumber(raw, fallback) {
  if (raw === undefined || raw === null || raw === '') return fallback;

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : fallback;
}

readNumber('20', 10);    // 20
readNumber('0', 10);     // 0      <- giữ đúng giá trị người dùng gửi
readNumber('abc', 10);   // 10
readNumber('', 10);      // 10
readNumber(undefined, 10); // 10
```

```javascript
/** Chuẩn hoá dữ liệu form: mọi thứ từ HTML input đều là chuỗi. */
function parseCourseForm(form) {
  return {
    title: String(form.title ?? '').trim(),
    durationMinutes: readNumber(form.duration, 0),
    // Checkbox gửi lên chuỗi 'true'/'false', không phải boolean.
    isPublished: form.isPublished === 'true',
    // Chuỗi rỗng nghĩa là "không chọn", không phải "chọn giá trị rỗng".
    level: form.level || null,
  };
}
```

Dùng `Number.isFinite` chứ không `!Number.isNaN`: nó loại luôn `Infinity`, thứ mà `Number('1e999')` sinh ra.

---

## ⚠️ Common Mistakes

**Sai 1 — `Number(input) || mặc_định`**

```javascript
// SAI: người dùng nhập 0 sẽ nhận về giá trị mặc định
const qty = Number(input) || 1;

// ĐÚNG
const n = Number(input);
const qty = Number.isFinite(n) ? n : 1;
```

**Sai 2 — Quên chuỗi rỗng thành số 0**

```javascript
Number(''); // 0 — ô input để trống trở thành số 0 hợp lệ
```

**Sai 3 — Nối object vào chuỗi**

```javascript
const msg = 'Người dùng: ' + user;        // 'Người dùng: [object Object]'
const msg = `Người dùng: ${user.name}`;  // đúng
```

**Sai 4 — So sánh checkbox với boolean**

```javascript
if (form.isPublished) { }  // SAI: chuỗi 'false' là truthy
if (form.isPublished === 'true') { }
```

**Sai 5 — `parseInt` không có cơ số**

```javascript
parseInt('08');     // an toàn ở môi trường hiện đại, nhưng nên viết rõ
parseInt('08', 10); // luôn đúng
```

---

## 📋 Summary

- Luôn ép kiểu tường minh bằng `Number()`, `String()`, `Boolean()`; đừng dựa vào ép kiểu ngầm định.
- `Number()` đòi toàn bộ chuỗi là số; `parseInt()` đọc tới ký tự không hợp lệ thì dừng.
- `Number('')` cho `0` và `Number([])` cho `0` — hai cái bẫy hay gặp nhất.
- Mọi giá trị từ HTML input và query string đều là chuỗi, kể cả checkbox.
- Kiểm tra số hợp lệ bằng `Number.isFinite()`, đừng dùng `|| mặc_định`.

---

## 📝 Quiz

### Question 1

`Number('')` trả về gì?

A. `NaN`

B. `0` — chuỗi rỗng được ép thành số 0.

C. `undefined`

D. Ném `TypeError`.

**Answer: B**

**Giải thích:** Đây là cái bẫy thường gặp: một ô nhập liệu để trống gửi lên chuỗi rỗng, và `Number('')` biến nó thành `0` — một con số hoàn toàn hợp lệ. Nếu đó là số lượng đặt hàng, đơn hàng sẽ có số lượng 0 mà không có cảnh báo nào. Phải kiểm tra chuỗi rỗng trước khi ép kiểu.

---

### Question 2

Vì sao `'5' + 3` cho `'53'` còn `'5' - 3` cho `2`?

A. Vì `-` không hoạt động với chuỗi nên JavaScript bỏ qua chuỗi đó.

B. Vì `+` vừa là cộng vừa là nối chuỗi nên ưu tiên nối khi có chuỗi; còn `-` chỉ có nghĩa với số nên ép cả hai toán hạng về số.

C. Vì `'5'` được ép thành `5` ở cả hai trường hợp, kết quả thứ nhất là lỗi hiển thị.

D. Vì thứ tự ưu tiên toán tử khác nhau.

**Answer: B**

**Giải thích:** `+` là toán tử duy nhất mang hai nghĩa. Khi có ít nhất một toán hạng là chuỗi, nó chọn nghĩa nối chuỗi. Mọi toán tử số học còn lại (`-`, `*`, `/`, `%`) chỉ có một nghĩa nên ép hết về số trước khi tính.
