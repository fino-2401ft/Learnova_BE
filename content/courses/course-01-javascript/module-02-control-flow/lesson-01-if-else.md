---
id: js-m2-l1
course: JavaScript Fundamentals
module: Control Flow
title: Câu lệnh if - else
order: 1
difficulty: Beginner
estimatedTime: 25
---

# Câu lệnh if - else

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Viết rẽ nhánh bằng `if`, `else if`, `else`.
- Dùng toán tử ba ngôi đúng chỗ.
- Hiểu điều kiện được đánh giá theo truthy/falsy chứ không chỉ boolean.
- Viết điều kiện phẳng thay vì lồng nhau nhiều tầng.

---

## 📖 Definition

`if` chạy một khối lệnh khi điều kiện **truthy**. Điểm quan trọng: điều kiện không cần là boolean — JavaScript ép mọi giá trị về truthy hoặc falsy.

```javascript
if (0) { }        // không chạy
if ('') { }       // không chạy
if ([]) { }       // CÓ chạy — mảng rỗng là truthy
if ('false') { }  // CÓ chạy — chuỗi khác rỗng là truthy
```

Kỹ thuật thì đơn giản. Cái khó là **giữ cho code dễ đọc** khi số nhánh tăng lên.

---

## ⚙️ Syntax

```javascript
if (điều_kiện) {
  // chạy khi truthy
} else if (điều_kiện_khác) {
  // chạy khi điều kiện trên sai và cái này truthy
} else {
  // còn lại
}

// Toán tử ba ngôi: một biểu thức, không phải câu lệnh
const nhãn = tuổi >= 18 ? 'Người lớn' : 'Trẻ em';
```

### Example 1 - Rẽ nhánh nhiều tầng

```javascript
function xepLoai(diem) {
  if (diem >= 9) return 'Xuất sắc';
  if (diem >= 8) return 'Giỏi';
  if (diem >= 6.5) return 'Khá';
  if (diem >= 5) return 'Trung bình';
  return 'Yếu';
}
```

Dùng `return` sớm thay vì `else if` nối dài: mỗi dòng đọc độc lập, và không phải theo dõi xem mình đang ở nhánh nào.

### Example 2 - Trả về sớm để tránh lồng sâu

```javascript
// KHÓ ĐỌC: bốn tầng lồng nhau
function xuLy(user) {
  if (user) {
    if (user.isActive) {
      if (user.role === 'ADMIN') {
        return 'Cho phép';
      } else {
        return 'Không đủ quyền';
      }
    } else {
      return 'Tài khoản bị khoá';
    }
  } else {
    return 'Không tìm thấy';
  }
}

// DỄ ĐỌC: xử lý điều kiện loại trừ trước, phần chính nằm phẳng ở cuối
function xuLy(user) {
  if (!user) return 'Không tìm thấy';
  if (!user.isActive) return 'Tài khoản bị khoá';
  if (user.role !== 'ADMIN') return 'Không đủ quyền';

  return 'Cho phép';
}
```

Kỹ thuật này gọi là **guard clause**. Nó biến độ sâu lồng nhau thành một danh sách phẳng.

### Example 3 - Toán tử ba ngôi

```javascript
// Tốt: ngắn, một tầng
const trangThai = isActive ? 'Đang hoạt động' : 'Đã khoá';

// Xấu: lồng ba ngôi là dấu hiệu nên dùng if hoặc bảng tra
const nhan = a ? (b ? 'x' : 'y') : c ? 'z' : 'w';

// Ba ngôi là BIỂU THỨC nên dùng được trong template literal
console.log(`Có ${n} mục${n > 1 ? 's' : ''}`);
```

### Example 4 - Bảng tra thay cho chuỗi if dài

```javascript
// Thay vì 5 nhánh if so sánh cùng một biến...
const NHAN_VAI_TRO = {
  ADMIN: 'Quản trị viên',
  MENTOR: 'Giảng viên',
  MENTEE: 'Học viên',
};

const nhan = NHAN_VAI_TRO[user.role] ?? 'Không xác định';
```

Khi mọi nhánh chỉ khác nhau ở một giá trị trả về, một object tra cứu vừa ngắn hơn vừa dễ mở rộng.

---

## 📌 Notes

- **Luôn dùng ngoặc nhọn**, kể cả với một câu lệnh. Bỏ ngoặc là mảnh đất màu mỡ cho lỗi khi thêm dòng thứ hai.
- **`if` không tạo phạm vi cho `var`** nhưng có tạo cho `let`/`const`.
- Điều kiện phức tạp nên tách thành biến có tên rõ nghĩa: `const coTheXuatBan = ...`.
- So sánh trong điều kiện nên dùng `===`.

---

## 🌍 Real World Example

```javascript
/** Kiểm tra một khoá học có được phép xuất bản không. */
function canPublish(course, user) {
  // Guard clause: loại trừ hết trường hợp không hợp lệ trước.
  if (!course) {
    return { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy khoá học' };
  }

  if (course.mentorId !== user.id && user.role !== 'ADMIN') {
    return { ok: false, code: 'FORBIDDEN', message: 'Không phải khoá học của bạn' };
  }

  if (course.status !== 'PENDING_APPROVAL') {
    return { ok: false, code: 'INVALID_STATE', message: 'Khoá học chưa được gửi duyệt' };
  }

  // Tách điều kiện phức tạp ra biến có tên, thay vì nhét cả vào if.
  const hasContent = course.chapters.length > 0;
  const everyChapterHasLesson = course.chapters.every((c) => c.lessons.length > 0);

  if (!hasContent || !everyChapterHasLesson) {
    return { ok: false, code: 'EMPTY_CONTENT', message: 'Khoá học chưa có đủ bài học' };
  }

  return { ok: true };
}
```

Hàm này có năm nhánh nhưng đọc như một danh sách kiểm tra, không có tầng lồng nào. Thêm điều kiện thứ sáu chỉ là thêm một khối ba dòng ở giữa.

---

## ⚠️ Common Mistakes

**Sai 1 — Dùng `=` thay vì `===`**

```javascript
if (status = 'active') { }  // GÁN rồi luôn truthy
if (status === 'active') { }
```

**Sai 2 — Nghĩ mảng rỗng là falsy**

```javascript
if (list) { }         // luôn đúng, kể cả list = []
if (list.length) { }  // đúng ý
```

**Sai 3 — Bỏ ngoặc nhọn**

```javascript
// Chỉ dòng đầu thuộc if; dòng thứ hai LUÔN chạy
if (x)
  doA();
  doB();
```

**Sai 4 — Lồng quá sâu**

Quá ba tầng là dấu hiệu nên tách hàm hoặc dùng guard clause.

**Sai 5 — Lồng toán tử ba ngôi**

Khó đọc hơn `if` mà không ngắn hơn bao nhiêu.

---

## 📋 Summary

- Điều kiện `if` đánh giá theo truthy/falsy, không cần là boolean.
- Guard clause (trả về sớm) biến lồng nhau nhiều tầng thành danh sách phẳng.
- Toán tử ba ngôi là biểu thức — dùng cho lựa chọn một tầng, đừng lồng.
- Chuỗi `if` so sánh cùng một biến thường nên thay bằng object tra cứu.
- Luôn dùng ngoặc nhọn và `===`.

---

## 📝 Quiz

### Question 1

Đoạn code sau in ra gì?

```javascript
if ([]) console.log('A');
if ([].length) console.log('B');
```

A. Cả `A` và `B`.

B. Chỉ `A` — mảng rỗng là truthy, nhưng `[].length` bằng `0` nên falsy.

C. Chỉ `B`.

D. Không in gì cả.

**Answer: B**

**Giải thích:** Mọi object đều truthy, và mảng cũng là object — kể cả mảng rỗng. Muốn kiểm tra "mảng có phần tử không" phải xét `length`. Đây là lý do `if (list)` gần như không bao giờ là điều bạn thực sự muốn kiểm tra.

---

### Question 2

Vì sao guard clause được ưa dùng hơn `if/else` lồng nhau?

A. Vì nó chạy nhanh hơn về mặt hiệu năng.

B. Vì nó xử lý các trường hợp loại trừ trước rồi thoát ngay, nên phần logic chính nằm phẳng ở cuối và độ sâu lồng nhau không tăng theo số điều kiện.

C. Vì `else` đã bị loại khỏi JavaScript hiện đại.

D. Vì nó bắt buộc phải dùng khi hàm trả về giá trị.

**Answer: B**

**Giải thích:** Với `if/else` lồng nhau, mỗi điều kiện mới thêm một tầng thụt lề và người đọc phải nhớ mình đang ở nhánh nào. Guard clause đảo ngược điều đó: mỗi điều kiện là một dòng độc lập kiểu "sai thì thoát", và phần xử lý chính luôn ở mức thụt lề ngoài cùng.
