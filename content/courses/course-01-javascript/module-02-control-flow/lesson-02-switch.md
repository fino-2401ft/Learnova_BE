---
id: js-m2-l2
course: JavaScript Fundamentals
module: Control Flow
title: Câu lệnh switch
order: 2
difficulty: Beginner
estimatedTime: 25
---

# Câu lệnh switch

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Viết `switch` với `case`, `break` và `default`.
- Hiểu fall-through: khi nào là lỗi, khi nào là chủ ý.
- Biết `switch` so sánh bằng `===`.
- Chọn được giữa `switch`, chuỗi `if` và object tra cứu.

---

## 📖 Definition

`switch` so một giá trị với nhiều trường hợp. Nó dùng **so sánh nghiêm ngặt `===`**, nên `switch (1)` không khớp `case '1'`.

Đặc điểm gây bất ngờ nhất: sau khi khớp một `case`, JavaScript chạy tiếp **xuống tất cả các case bên dưới** cho tới khi gặp `break` hoặc `return`. Hiện tượng đó gọi là **fall-through**.

Fall-through là con dao hai lưỡi: quên `break` là bug, nhưng cố ý bỏ `break` lại là cách gọn nhất để gộp nhiều trường hợp.

---

## ⚙️ Syntax

```javascript
switch (biểu_thức) {
  case giá_trị_1:
    // ...
    break;

  case giá_trị_2:
    // ...
    break;

  default:
    // không case nào khớp
}
```

### Example 1 - Dạng cơ bản

```javascript
function tenThu(so) {
  switch (so) {
    case 1:
      return 'Chủ nhật';
    case 2:
      return 'Thứ hai';
    case 3:
      return 'Thứ ba';
    default:
      return 'Không hợp lệ';
  }
}
```

Dùng `return` thì không cần `break` — hàm thoát luôn.

### Example 2 - Fall-through có chủ ý

```javascript
function loaiNgay(thu) {
  switch (thu) {
    case 'T7':
    case 'CN':
      return 'Cuối tuần';

    case 'T2':
    case 'T3':
    case 'T4':
    case 'T5':
    case 'T6':
      return 'Ngày làm việc';

    default:
      return 'Không xác định';
  }
}
```

Các `case` xếp liền nhau không có thân lệnh sẽ cùng chạy vào khối bên dưới. Đây là cách viết được khuyến khích, không phải mẹo vặt.

### Example 3 - Quên break: lỗi kinh điển

```javascript
function demo(x) {
  let ketQua = '';

  switch (x) {
    case 1:
      ketQua += 'một';
    // thiếu break!
    case 2:
      ketQua += 'hai';
      break;
    case 3:
      ketQua += 'ba';
      break;
  }

  return ketQua;
}

console.log(demo(1)); // 'mộthai'  <- không mong muốn
console.log(demo(2)); // 'hai'
```

Quy tắc: nếu cố ý fall-through, **luôn ghi chú `// fall through`** để người đọc biết đó không phải lỗi.

### Example 4 - `switch` so sánh nghiêm ngặt

```javascript
const x = '1';

switch (x) {
  case 1:
    console.log('số');
    break;
  case '1':
    console.log('chuỗi'); // <- chạy nhánh này
    break;
}
```

Khác với `if (x == 1)`, `switch` không ép kiểu. Dữ liệu từ query string luôn là chuỗi, nên phải ép trước khi `switch` theo số.

### Example 5 - Khi nào nên dùng object thay cho switch

```javascript
// switch: dài dòng khi mỗi nhánh chỉ trả về một giá trị
switch (role) {
  case 'ADMIN': return 'Quản trị viên';
  case 'MENTOR': return 'Giảng viên';
  case 'MENTEE': return 'Học viên';
  default: return 'Không xác định';
}

// object tra cứu: ngắn hơn, thêm vai trò mới chỉ là thêm một dòng
const LABELS = {
  ADMIN: 'Quản trị viên',
  MENTOR: 'Giảng viên',
  MENTEE: 'Học viên',
};

return LABELS[role] ?? 'Không xác định';
```

Chọn `switch` khi mỗi nhánh **làm việc gì đó**; chọn object khi mỗi nhánh chỉ **là một giá trị**.

---

## 📌 Notes

- **`switch (true)`** cho phép viết điều kiện tuỳ ý trong mỗi `case`, nhưng thường `if` sẽ rõ ràng hơn.
- **`let`/`const` khai trong `case`** dùng chung một phạm vi khối của cả `switch` — cần phạm vi riêng thì bọc `case` trong `{ }`.
- **`default` không bắt buộc phải đặt cuối**, nhưng đặt cuối là quy ước ai cũng trông đợi.
- Luôn có nhánh `default`, kể cả khi chỉ để ném lỗi — nó bắt được giá trị ngoài dự kiến.

---

## 🌍 Real World Example

```javascript
/** Chuyển trạng thái khoá học theo hành động của người dùng. */
function nextStatus(current, action) {
  switch (action) {
    case 'SUBMIT':
      if (current !== 'DRAFT' && current !== 'REJECTED') {
        throw new Error('Chỉ gửi duyệt được khoá ở trạng thái nháp hoặc bị từ chối');
      }
      return 'PENDING_APPROVAL';

    case 'APPROVE':
      if (current !== 'PENDING_APPROVAL') {
        throw new Error('Chỉ duyệt được khoá đang chờ duyệt');
      }
      return 'PUBLISHED';

    case 'REJECT':
      if (current !== 'PENDING_APPROVAL') {
        throw new Error('Chỉ từ chối được khoá đang chờ duyệt');
      }
      return 'REJECTED';

    case 'UNPUBLISH':
      if (current !== 'PUBLISHED') {
        throw new Error('Khoá học chưa được xuất bản');
      }
      return 'DRAFT';

    default:
      // Bắt được ngay khi ai đó thêm hành động mới mà quên xử lý ở đây.
      throw new Error(`Hành động không hợp lệ: ${action}`);
  }
}
```

Đây là chỗ `switch` hợp hơn object tra cứu: mỗi nhánh vừa kiểm tra điều kiện vừa quyết định kết quả, chứ không chỉ ánh xạ một giá trị.

Nhánh `default` ném lỗi là chi tiết quan trọng — nó biến một lỗi thầm lặng thành lỗi lộ ra ngay lần chạy đầu tiên.

---

## ⚠️ Common Mistakes

**Sai 1 — Quên `break`**

Trường hợp phía sau chạy theo mà không ai để ý.

**Sai 2 — Trông chờ `switch` ép kiểu**

```javascript
switch (req.query.page) {  // luôn là chuỗi
  case 1: // không bao giờ khớp
}

switch (Number(req.query.page)) { }  // đúng
```

**Sai 3 — Khai báo `let` trong `case` mà không bọc khối**

```javascript
switch (x) {
  case 1:
    let a = 1;
    break;
  case 2:
    let a = 2; // SyntaxError: đã khai báo a
    break;
}

// ĐÚNG: mỗi case một khối riêng
switch (x) {
  case 1: {
    let a = 1;
    break;
  }
  case 2: {
    let a = 2;
    break;
  }
}
```

**Sai 4 — Không có `default`**

Giá trị ngoài dự kiến lọt qua âm thầm.

---

## 📋 Summary

- `switch` so sánh bằng `===`, không ép kiểu.
- Không có `break` thì chương trình chạy tiếp xuống các `case` bên dưới; cố ý thì phải ghi chú.
- Nhiều `case` xếp liền nhau là cách gọn để gộp trường hợp.
- Dùng `switch` khi mỗi nhánh làm việc; dùng object tra cứu khi mỗi nhánh chỉ là một giá trị.
- Luôn có `default`, dù chỉ để ném lỗi.

---

## 📝 Quiz

### Question 1

`demo(1)` trả về gì?

```javascript
function demo(x) {
  let r = '';
  switch (x) {
    case 1: r += 'A';
    case 2: r += 'B'; break;
    case 3: r += 'C'; break;
  }
  return r;
}
```

A. `'A'`

B. `'AB'` — `case 1` không có `break` nên chạy tiếp xuống `case 2`.

C. `'ABC'`

D. `''`

**Answer: B**

**Giải thích:** Sau khi khớp `case 1`, JavaScript chạy tiếp mọi câu lệnh bên dưới cho tới khi gặp `break`. Nó không kiểm tra lại điều kiện của `case 2`. Vì `case 2` có `break` nên dừng ở đó, kết quả là `'AB'`.

---

### Question 2

Vì sao `switch (req.query.page) { case 1: ... }` không bao giờ khớp?

A. Vì `switch` không dùng được với giá trị từ query string.

B. Vì mọi giá trị trong query string đều là chuỗi, mà `switch` so bằng `===` nên `'1'` không bằng `1`.

C. Vì `req.query` là getter chỉ đọc.

D. Vì thiếu `break` ở nhánh đầu tiên.

**Answer: B**

**Giải thích:** `switch` dùng so sánh nghiêm ngặt, không ép kiểu như `==`. Query string `?page=1` cho `req.query.page` bằng chuỗi `'1'`, khác kiểu với số `1`. Phải ép trước: `switch (Number(req.query.page))`.
