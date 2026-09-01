---
id: js-m2-l5
course: JavaScript Fundamentals
module: Control Flow
title: break và continue
order: 5
difficulty: Beginner
estimatedTime: 25
---

# break và continue

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Dùng `break` để thoát vòng lặp và `continue` để bỏ qua một lần lặp.
- Thoát khỏi vòng lặp lồng nhau bằng nhãn (label).
- Biết vì sao `break`/`continue` không dùng được trong `forEach`.
- Chọn được giữa `break` và phương thức mảng như `find`, `some`.

---

## 📖 Definition

Hai câu lệnh điều khiển luồng bên trong vòng lặp:

- **`break`** — thoát hẳn khỏi vòng lặp gần nhất.
- **`continue`** — bỏ qua phần còn lại của lần lặp hiện tại, sang lần kế.

Cả hai chỉ tác dụng lên **một** cấp vòng lặp. Muốn thoát nhiều cấp thì phải dùng nhãn.

Điểm quan trọng: chúng là câu lệnh của **vòng lặp**, không phải của hàm. Vì `forEach` nhận một callback (tức là một hàm), nên `break` bên trong nó là lỗi cú pháp.

---

## ⚙️ Syntax

```javascript
for (...) {
  if (điều_kiện) break;    // thoát vòng lặp
  if (điều_kiện) continue; // sang lần lặp kế
}

nhãn: for (...) {
  for (...) {
    break nhãn;    // thoát cả vòng ngoài
    continue nhãn; // sang lần lặp kế của vòng ngoài
  }
}
```

### Example 1 - `break` để dừng sớm

```javascript
const courses = ['NestJS', 'TypeScript', 'Express', 'Rust'];

for (const course of courses) {
  if (course === 'Express') {
    console.log('Đã tìm thấy, dừng lại');
    break; // không duyệt tiếp 'Rust'
  }
  console.log('Đang xét:', course);
}
```

Giá trị thật sự của `break` là ở dữ liệu lớn: tìm thấy phần tử đầu tiên trong một triệu phần tử thì không có lý do gì phải duyệt hết.

### Example 2 - `continue` để bỏ qua

```javascript
const lessons = [
  { title: 'Bài 1', published: true },
  { title: 'Bài 2', published: false },
  { title: 'Bài 3', published: true },
];

for (const lesson of lessons) {
  if (!lesson.published) continue; // bỏ qua, xét bài kế

  console.log(lesson.title); // 'Bài 1', 'Bài 3'
}
```

`continue` thường làm code phẳng hơn `if` bọc cả thân vòng lặp — cùng ý tưởng với guard clause trong hàm.

### Example 3 - Nhãn để thoát vòng lặp lồng nhau

```javascript
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

// break thường chỉ thoát vòng trong
outer: for (const row of matrix) {
  for (const cell of row) {
    if (cell === 5) {
      console.log('Tìm thấy 5');
      break outer; // thoát CẢ HAI vòng
    }
  }
}
```

Nhãn hiếm khi cần. Thường thì tách thành hàm rồi `return` sẽ rõ ràng hơn:

```javascript
function timTrongMaTran(matrix, target) {
  for (const row of matrix) {
    for (const cell of row) {
      if (cell === target) return true; // return thoát khỏi mọi vòng lặp
    }
  }
  return false;
}
```

### Example 4 - `break` không dùng được trong `forEach`

```javascript
// SyntaxError: Illegal break statement
items.forEach((item) => {
  if (item.id === target) break;
});

// `return` trong forEach chỉ thoát CALLBACK, tương đương continue
items.forEach((item) => {
  if (!item.published) return; // giống continue
  console.log(item.title);
});

// Cần dừng sớm thì dùng for...of
for (const item of items) {
  if (item.id === target) break;
}
```

### Example 5 - Phương thức mảng thay cho break

Nhiều trường hợp dùng `break` thực chất là đang cài đặt lại một phương thức có sẵn:

```javascript
// Thay vì: for + break để tìm phần tử
const found = courses.find((c) => c.title === 'NestJS');

// Thay vì: for + break để kiểm tra tồn tại
const hasUnpublished = courses.some((c) => !c.published);

// Thay vì: for + break để kiểm tra tất cả
const allPublished = courses.every((c) => c.published);

// Thay vì: for + continue để lọc
const published = courses.filter((c) => c.published);
```

`find`, `some` và `every` đều **tự dừng sớm** khi có kết quả, nên không hề chậm hơn vòng lặp thủ công.

---

## 📌 Notes

- **`break` trong `switch`** thoát khỏi `switch`, không thoát vòng lặp bao ngoài.
- **`continue` trong `while`** phải cẩn thận: nếu biến điều kiện cập nhật ở cuối thân vòng lặp thì `continue` sẽ bỏ qua nó và gây treo.
- **Nhãn dùng được cho cả khối `{}`**, không chỉ vòng lặp — nhưng đó là thứ gần như không ai dùng.
- Nhiều `break` rải rác trong một vòng lặp dài là dấu hiệu nên tách hàm.

---

## 🌍 Real World Example

```javascript
/**
 * Kiểm tra một tệp tải lên có hợp lệ không.
 *
 * Dừng ngay ở lỗi đầu tiên: người dùng chỉ cần biết một lý do để sửa, và các
 * bước kiểm tra sau có thể tốn kém (đọc nội dung tệp, gọi dịch vụ quét virus).
 */
function validateUpload(files, limits) {
  let totalSize = 0;

  for (const file of files) {
    // continue: bỏ qua tệp rỗng, không tính vào tổng
    if (file.size === 0) continue;

    if (!limits.allowedTypes.includes(file.type)) {
      return { ok: false, message: `${file.name}: định dạng không được hỗ trợ` };
    }

    totalSize += file.size;

    // break không cần thiết ở đây vì return đã thoát hàm
    if (totalSize > limits.maxTotalSize) {
      return { ok: false, message: 'Tổng dung lượng vượt quá giới hạn' };
    }
  }

  return { ok: true, totalSize };
}
```

```javascript
/** Tìm bài học kế tiếp chưa hoàn thành — dừng ngay khi thấy. */
function nextLesson(chapters, completedIds) {
  const done = new Set(completedIds);

  for (const chapter of chapters) {
    for (const lesson of chapter.lessons) {
      if (!done.has(lesson.id)) {
        return { chapter: chapter.title, lesson }; // thoát cả hai vòng
      }
    }
  }

  return null; // đã hoàn thành hết
}
```

Ví dụ thứ hai cho thấy vì sao nhãn hiếm khi cần: tách thành hàm riêng thì `return` làm được đúng việc của `break outer`, mà lại rõ nghĩa hơn.

---

## ⚠️ Common Mistakes

**Sai 1 — Dùng `break` trong `forEach`**

Lỗi cú pháp. Chuyển sang `for...of`.

**Sai 2 — Nghĩ `return` trong `forEach` là `break`**

Nó chỉ kết thúc lần gọi callback đó, tương đương `continue`.

**Sai 3 — `continue` trong `while` bỏ qua bước cập nhật**

```javascript
let i = 0;
while (i < 5) {
  if (i === 2) continue; // TREO: i không bao giờ tăng nữa
  console.log(i);
  i++;
}
```

**Sai 4 — Nghĩ `break` trong `switch` thoát cả vòng lặp**

```javascript
for (const x of items) {
  switch (x.type) {
    case 'STOP':
      break; // chỉ thoát switch, vòng for vẫn chạy tiếp
  }
}
```

**Sai 5 — Viết `for` + `break` khi đã có `find`**

Dài hơn mà không nhanh hơn.

---

## 📋 Summary

- `break` thoát vòng lặp gần nhất, `continue` sang lần lặp kế; cả hai chỉ tác dụng một cấp.
- Nhãn thoát được nhiều cấp, nhưng tách hàm rồi `return` thường rõ hơn.
- `break`/`continue` không dùng được trong `forEach`; `return` ở đó chỉ tương đương `continue`.
- `find`, `some`, `every` đã tự dừng sớm — không cần tự cài lại bằng `for` + `break`.
- `continue` trong `while` dễ gây treo nếu biến điều kiện cập nhật ở cuối thân vòng lặp.

---

## 📝 Quiz

### Question 1

`return` bên trong callback của `forEach` tương đương với gì?

A. `break` — dừng toàn bộ vòng lặp.

B. `continue` — chỉ kết thúc lần gọi callback hiện tại, các phần tử còn lại vẫn được duyệt.

C. Ném lỗi vì `forEach` không cho phép `return`.

D. Trả giá trị đó ra làm kết quả của `forEach`.

**Answer: B**

**Giải thích:** `forEach` gọi callback một lần cho mỗi phần tử. `return` kết thúc lần gọi đó và `forEach` tiếp tục với phần tử kế, đúng như `continue`. Giá trị trả về bị bỏ qua hoàn toàn. Muốn dừng hẳn phải dùng `for...of` với `break`.

---

### Question 2

Vòng lặp sau bị treo. Vì sao?

```javascript
let i = 0;
while (i < 5) {
  if (i === 2) continue;
  console.log(i);
  i++;
}
```

A. Vì `continue` không dùng được trong `while`.

B. Vì khi `i` bằng 2, `continue` nhảy về đầu vòng lặp và bỏ qua dòng `i++`, nên `i` mãi bằng 2.

C. Vì điều kiện phải là `i <= 5`.

D. Vì `console.log` chặn vòng lặp.

**Answer: B**

**Giải thích:** Trong `for`, bước cập nhật `i++` nằm ở phần khai báo nên `continue` vẫn chạy qua nó. Trong `while` thì bước cập nhật là một câu lệnh bình thường trong thân vòng lặp, và `continue` bỏ qua mọi thứ phía sau nó. Đây là lý do nên tăng biến đếm ngay đầu thân vòng lặp `while`, hoặc dùng `for`.
