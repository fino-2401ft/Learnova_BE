---
id: js-m4-l2
course: JavaScript Fundamentals
module: Objects & Arrays
title: Array
order: 2
difficulty: Beginner
estimatedTime: 35
---

# Array

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Dùng thành thạo `map`, `filter`, `reduce`, `find`, `some`, `every`.
- Phân biệt phương thức làm biến đổi mảng gốc và phương thức trả về mảng mới.
- Chọn đúng phương thức cho từng nhu cầu.
- Sắp xếp mảng đúng cách, kể cả mảng số.

---

## 📖 Definition

Mảng trong JavaScript là object có khoá số và thuộc tính `length`. Nó không cố định kích thước và chứa được nhiều kiểu khác nhau trong cùng một mảng.

Phân loại phương thức theo một tiêu chí quan trọng nhất — **có sửa mảng gốc hay không**:

| Sửa mảng gốc | Trả về mảng mới |
|---|---|
| `push` `pop` `shift` `unshift` | `map` `filter` `slice` `concat` |
| `splice` `sort` `reverse` `fill` | `toSorted` `toReversed` `toSpliced` |

Nhóm bên trái là nguồn của nhiều lỗi khó tìm: một hàm nhận mảng rồi lặng lẽ sửa nó, và người gọi không hề biết.

---

## ⚙️ Syntax

```javascript
const arr = [1, 2, 3];

arr.map((x) => x * 2);        // [2, 4, 6]      — biến đổi
arr.filter((x) => x > 1);     // [2, 3]         — lọc
arr.reduce((s, x) => s + x, 0); // 6            — gộp
arr.find((x) => x > 1);       // 2              — phần tử đầu khớp
arr.some((x) => x > 2);       // true           — có ít nhất một
arr.every((x) => x > 0);      // true           — tất cả
arr.includes(2);              // true
arr.indexOf(2);               // 1
```

### Example 1 - map, filter, reduce

```javascript
const courses = [
  { title: 'NestJS', minutes: 1010, published: true },
  { title: 'Express', minutes: 395, published: true },
  { title: 'Rust', minutes: 0, published: false },
];

// map: biến đổi, số lượng GIỮ NGUYÊN
const titles = courses.map((c) => c.title);
// ['NestJS', 'Express', 'Rust']

// filter: lọc, số lượng GIẢM hoặc giữ nguyên
const published = courses.filter((c) => c.published);
// 2 phần tử

// reduce: gộp về MỘT giá trị
const totalMinutes = courses.reduce((sum, c) => sum + c.minutes, 0);
// 1405
```

Giá trị khởi tạo của `reduce` (số `0` ở trên) nên luôn được truyền: thiếu nó, `reduce` trên mảng rỗng sẽ ném `TypeError`.

### Example 2 - reduce làm được nhiều hơn cộng dồn

```javascript
// Gom nhóm
const byLevel = courses.reduce((acc, c) => {
  (acc[c.level] ??= []).push(c);
  return acc;
}, {});

// Đếm số lần xuất hiện
const words = ['a', 'b', 'a', 'c', 'a'];
const count = words.reduce((acc, w) => {
  acc[w] = (acc[w] ?? 0) + 1;
  return acc;
}, {});
// { a: 3, b: 1, c: 1 }

// Làm phẳng (nhưng flat() dễ đọc hơn)
[[1, 2], [3, 4]].flat();      // [1, 2, 3, 4]
[[1, [2, [3]]]].flat(Infinity); // [1, 2, 3]
```

### Example 3 - Sắp xếp

```javascript
// sort() mặc định so sánh theo CHUỖI — sai với số
[10, 9, 100].sort();            // [10, 100, 9]  (!)
[10, 9, 100].sort((a, b) => a - b); // [9, 10, 100]

// Chuỗi tiếng Việt cần localeCompare
['Ánh', 'An', 'Âu'].sort();                        // sai thứ tự
['Ánh', 'An', 'Âu'].sort((a, b) => a.localeCompare(b, 'vi')); // đúng

// sort() SỬA mảng gốc
const arr = [3, 1, 2];
const sorted = arr.sort();
console.log(arr === sorted); // true — cùng một mảng!

// toSorted() trả về mảng mới, giữ nguyên mảng gốc
const safe = arr.toSorted((a, b) => a - b);
```

`toSorted`, `toReversed`, `toSpliced` và `with` là bộ phương thức bất biến thêm vào từ ES2023 — có sẵn ở Node 20+ và các trình duyệt hiện đại.

### Example 4 - Tạo và cắt mảng

```javascript
Array.from({ length: 5 }, (_, i) => i);  // [0, 1, 2, 3, 4]
Array.from('abc');                        // ['a', 'b', 'c']
Array.of(7);                              // [7]  (khác new Array(7))
new Array(3).fill(0);                     // [0, 0, 0]

const arr = [1, 2, 3, 4, 5];
arr.slice(1, 3);   // [2, 3]      — KHÔNG sửa gốc
arr.splice(1, 2);  // [2, 3]      — CÓ sửa gốc, arr thành [1, 4, 5]
arr.at(-1);        // phần tử cuối
```

### Example 5 - Loại trùng và tìm kiếm nhanh

```javascript
// Loại trùng bằng Set
const unique = [...new Set([1, 2, 2, 3, 3, 3])]; // [1, 2, 3]

// Set cho tra cứu O(1) thay vì includes() O(n)
const doneIds = new Set(completedLessonIds);

// Chậm với danh sách lớn
lessons.filter((l) => completedLessonIds.includes(l.id));

// Nhanh
lessons.filter((l) => doneIds.has(l.id));
```

---

## 📌 Notes

- **`length` ghi được**: `arr.length = 0` xoá sạch mảng.
- **Mảng thưa**: `[1, , 3]` có lỗ trống; `map` bỏ qua lỗ nhưng `Array.from` thì không.
- **`indexOf` dùng `===`** nên không tìm được `NaN`; `includes` thì tìm được.
- **`find` trả về phần tử, `findIndex` trả về vị trí, `filter` trả về mảng.** Nhầm ba cái này là lỗi rất phổ biến.
- `map`, `filter`, `find`, `some`, `every` đều bỏ qua phần tử đã bị xoá của mảng thưa.

---

## 🌍 Real World Example

```javascript
/** Dựng dữ liệu cho trang danh sách khoá học. */
function buildCourseList(courses, enrollments) {
  // Set cho tra cứu nhanh thay vì lồng hai vòng lặp.
  const enrolledIds = new Set(enrollments.map((e) => e.courseId));

  return courses
    .filter((c) => c.status === 'PUBLISHED')
    .map((c) => ({
      id: c.courseId,
      title: c.title,
      hours: Math.round(c.totalMinutes / 60),
      lessonCount: c.chapters.reduce((n, ch) => n + ch.lessons.length, 0),
      enrolled: enrolledIds.has(c.courseId),
    }))
    // toSorted không có ở đây vì mảng đã là mảng mới do map tạo ra —
    // sort() tại chỗ hoàn toàn an toàn.
    .sort((a, b) => b.hours - a.hours);
}
```

```javascript
/**
 * Tính thống kê trong MỘT lần duyệt.
 *
 * Ba lần filter riêng là ba lần duyệt mảng. Với vài trăm phần tử thì không sao,
 * nhưng reduce nói rõ hơn rằng ta chỉ cần đi qua dữ liệu một lượt.
 */
function stats(enrollments) {
  return enrollments.reduce(
    (acc, e) => {
      acc.total += 1;
      if (e.status === 'COMPLETED') acc.completed += 1;
      if (e.status === 'IN_PROGRESS') acc.inProgress += 1;
      return acc;
    },
    { total: 0, completed: 0, inProgress: 0 },
  );
}
```

Chú ý dòng `.sort()` trong ví dụ đầu: nó an toàn vì `map` phía trên đã tạo ra mảng mới. Nếu gọi `.sort()` thẳng trên `courses` thì mảng do người gọi truyền vào sẽ bị sắp xếp lại — một tác dụng phụ mà không ai mong đợi.

---

## ⚠️ Common Mistakes

**Sai 1 — `sort()` không có hàm so sánh**

```javascript
[10, 9, 100].sort(); // [10, 100, 9] — so sánh theo chuỗi
```

**Sai 2 — Quên `sort()` và `reverse()` sửa mảng gốc**

```javascript
function topThree(items) {
  return items.sort((a, b) => b.score - a.score).slice(0, 3); // sửa mảng của người gọi!
}

function topThree(items) {
  return items.toSorted((a, b) => b.score - a.score).slice(0, 3);
}
```

**Sai 3 — `reduce` không có giá trị khởi tạo**

```javascript
[].reduce((a, b) => a + b);    // TypeError trên mảng rỗng
[].reduce((a, b) => a + b, 0); // 0
```

**Sai 4 — Dùng `map` khi không cần giá trị trả về**

```javascript
items.map((x) => console.log(x)); // tạo mảng undefined vô ích
items.forEach((x) => console.log(x));
```

**Sai 5 — `includes` trong vòng lặp trên dữ liệu lớn**

Độ phức tạp thành O(n²). Dùng `Set`.

---

## 📋 Summary

- `map` biến đổi, `filter` lọc, `reduce` gộp, `find` lấy một phần tử — chọn theo ý định, không theo thói quen.
- Ghi nhớ phương thức nào sửa mảng gốc: `push`, `splice`, `sort`, `reverse`. Bản bất biến là `toSorted`, `toReversed`, `toSpliced`.
- `sort()` mặc định so sánh theo chuỗi — luôn truyền hàm so sánh khi sắp xếp số.
- `reduce` luôn nên có giá trị khởi tạo, nếu không sẽ ném lỗi với mảng rỗng.
- Tra cứu nhiều lần trên danh sách lớn thì dùng `Set` thay cho `includes`.

---

## 📝 Quiz

### Question 1

`[10, 9, 100].sort()` cho kết quả gì?

A. `[9, 10, 100]`

B. `[10, 100, 9]` — `sort()` mặc định chuyển phần tử thành chuỗi rồi so sánh theo thứ tự từ điển.

C. `[100, 10, 9]`

D. Ném `TypeError` vì thiếu hàm so sánh.

**Answer: B**

**Giải thích:** Không có hàm so sánh, `sort()` chuyển mọi phần tử thành chuỗi rồi so sánh theo thứ tự Unicode. Chuỗi `'10'` đứng trước `'100'`, và cả hai đứng trước `'9'` vì ký tự `'1'` nhỏ hơn `'9'`. Sắp xếp số phải viết `sort((a, b) => a - b)`.

---

### Question 2

Hàm sau có vấn đề gì?

```javascript
function topThree(items) {
  return items.sort((a, b) => b.score - a.score).slice(0, 3);
}
```

A. `slice` phải gọi trước `sort`.

B. `sort` sửa trực tiếp mảng mà người gọi truyền vào, nên mảng gốc của họ bị sắp xếp lại như một tác dụng phụ không mong đợi.

C. Thiếu giá trị khởi tạo cho `sort`.

D. Không có vấn đề gì.

**Answer: B**

**Giải thích:** `sort` là phương thức sửa tại chỗ — nó trả về chính mảng đó chứ không tạo mảng mới. Người gọi `topThree(danhSach)` sẽ thấy `danhSach` của mình bị đổi thứ tự, và đó là loại lỗi rất khó truy vết. Dùng `toSorted()`, hoặc sao chép trước bằng `[...items].sort(...)`.
