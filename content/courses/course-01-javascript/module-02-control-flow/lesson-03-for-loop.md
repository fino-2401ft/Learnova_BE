---
id: js-m2-l3
course: JavaScript Fundamentals
module: Control Flow
title: Vòng lặp for
order: 3
difficulty: Beginner
estimatedTime: 30
---

# Vòng lặp for

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Viết `for` cổ điển, `for...of` và `for...in`.
- Chọn đúng loại vòng lặp cho từng tình huống.
- Biết vì sao không nên dùng `for...in` với mảng.
- Dùng các phương thức mảng (`map`, `filter`, `reduce`) thay cho vòng lặp khi hợp lý.

---

## 📖 Definition

JavaScript có ba dạng `for`, khác nhau ở thứ chúng duyệt:

| Dạng | Duyệt cái gì | Dùng khi |
|---|---|---|
| `for (let i = 0; ...)` | Chỉ số, do bạn điều khiển | Cần chỉ số, cần bước nhảy khác 1, cần lặp ngược |
| `for...of` | **Giá trị** của đối tượng lặp được | Duyệt mảng, chuỗi, `Map`, `Set` |
| `for...in` | **Khoá** của object | Duyệt thuộc tính object |

Quy tắc thực dụng: **`for...of` cho mảng, `for...in` cho object.** Dùng ngược lại là nguồn lỗi.

---

## ⚙️ Syntax

```javascript
for (khởi_tạo; điều_kiện; cập_nhật) { }

for (const giá_trị of mảng) { }

for (const khoá in object) { }
```

### Example 1 - `for` cổ điển

```javascript
for (let i = 0; i < 5; i++) {
  console.log(i); // 0 1 2 3 4
}

// Lặp ngược
for (let i = arr.length - 1; i >= 0; i--) { }

// Bước nhảy 2
for (let i = 0; i < 10; i += 2) { }
```

Dùng `let` chứ không `var`: mỗi vòng lặp tạo một biến mới, nên callback bất đồng bộ bên trong giữ đúng giá trị.

### Example 2 - `for...of` cho mảng và chuỗi

```javascript
const courses = ['NestJS', 'TypeScript', 'Express'];

for (const course of courses) {
  console.log(course);
}

// Cần cả chỉ số thì dùng entries()
for (const [index, course] of courses.entries()) {
  console.log(`${index + 1}. ${course}`);
}

// Chuỗi cũng lặp được, và xử lý đúng ký tự Unicode nhiều byte
for (const ch of 'Học') {
  console.log(ch); // H ọ c
}
```

### Example 3 - `for...in` chỉ dành cho object

```javascript
const user = { name: 'An', age: 20, role: 'MENTEE' };

for (const key in user) {
  console.log(`${key}: ${user[key]}`);
}

// Cách hiện đại hơn, rõ ràng hơn:
for (const [key, value] of Object.entries(user)) {
  console.log(`${key}: ${value}`);
}
```

### Example 4 - Vì sao không dùng `for...in` với mảng

```javascript
const arr = ['a', 'b', 'c'];

for (const i of arr) console.log(i);   // 'a' 'b' 'c'  — giá trị
for (const i in arr) console.log(i);   // '0' '1' '2'  — CHỈ SỐ, và là CHUỖI

// Tệ hơn: for...in duyệt cả thuộc tính được thêm vào
arr.total = 3;
for (const i in arr) console.log(i);   // '0' '1' '2' 'total'  (!)

// Và không bảo đảm thứ tự với khoá không phải số
```

Ba lý do để tránh: trả về chuỗi thay vì số, duyệt cả thuộc tính lạ, và không cam kết thứ tự.

### Example 5 - Khi phương thức mảng tốt hơn vòng lặp

```javascript
const courses = [
  { title: 'NestJS', minutes: 1010, published: true },
  { title: 'Express', minutes: 395, published: true },
  { title: 'Rust', minutes: 0, published: false },
];

// Biến đổi
const titles = courses.map((c) => c.title);

// Lọc
const published = courses.filter((c) => c.published);

// Gộp
const totalMinutes = courses.reduce((sum, c) => sum + c.minutes, 0);

// Tìm
const nestjs = courses.find((c) => c.title === 'NestJS');

// Kiểm tra
const hasEmpty = courses.some((c) => c.minutes === 0);
const allNamed = courses.every((c) => c.title.length > 0);
```

Mỗi phương thức nói rõ **ý định**. `map` nghĩa là "biến đổi từng phần tử, số lượng giữ nguyên"; `filter` nghĩa là "giữ lại một phần". Còn `for` thì phải đọc hết thân vòng lặp mới biết nó làm gì.

Vẫn nên dùng `for...of` khi: cần `break` sớm, hoặc thân vòng lặp có `await`.

---

## 📌 Notes

- **`for...of` cần đối tượng lặp được** (iterable). Object thường không phải iterable — dùng `Object.entries()`.
- **`break` và `continue` không dùng được trong `forEach`.** Cần thoát sớm thì dùng `for...of`.
- **`await` trong `forEach` không hoạt động** như mong đợi — callback chạy song song và không ai chờ.
- Vòng lặp `for` cổ điển vẫn là nhanh nhất, nhưng khác biệt chỉ đáng kể với hàng trăm nghìn phần tử.

---

## 🌍 Real World Example

```javascript
/** Tính tiến độ học của một học viên trong một khoá. */
function tinhTienDo(chapters, completedLessonIds) {
  const done = new Set(completedLessonIds); // Set: tra cứu O(1) thay vì includes() O(n)

  let total = 0;
  let completed = 0;

  for (const chapter of chapters) {
    for (const lesson of chapter.lessons) {
      total += 1;
      if (done.has(lesson.id)) completed += 1;
    }
  }

  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
```

```javascript
/** Xử lý tuần tự có await — đây là chỗ forEach KHÔNG dùng được. */
async function importCourses(dirs) {
  const results = [];

  for (const dir of dirs) {
    // Mỗi khoá ghi xong mới sang khoá tiếp theo, tránh làm nghẽn database.
    results.push(await importOne(dir));
  }

  return results;
}
```

Dùng `Set` cho `completedLessonIds` không phải để khoe kỹ thuật: với khoá 15 bài và 4 học viên thì `includes()` cũng chạy tốt, nhưng khi danh sách lên hàng nghìn thì mỗi lần `includes()` phải quét lại toàn mảng.

---

## ⚠️ Common Mistakes

**Sai 1 — Dùng `for...in` với mảng**

Nhận về chỉ số dạng chuỗi, và duyệt cả thuộc tính lạ.

**Sai 2 — Dùng `await` trong `forEach`**

```javascript
// SAI: hàm ngoài không chờ, results luôn rỗng
items.forEach(async (item) => {
  await process(item);
});

// ĐÚNG: tuần tự
for (const item of items) await process(item);

// ĐÚNG: song song
await Promise.all(items.map((item) => process(item)));
```

**Sai 3 — Sửa mảng trong lúc đang duyệt nó**

```javascript
// Bỏ sót phần tử vì chỉ số dịch chuyển khi splice
for (let i = 0; i < arr.length; i++) {
  if (arr[i] < 0) arr.splice(i, 1);
}

// ĐÚNG
const cleaned = arr.filter((x) => x >= 0);
```

**Sai 4 — Gọi `arr.length` trong điều kiện với mảng rất lớn**

Không sai, nhưng lưu vào biến sẽ rõ ràng hơn khi mảng không đổi.

**Sai 5 — Dùng `var` trong vòng lặp có callback**

Tất cả callback cùng nhìn một biến; kết quả gần như luôn sai.

---

## 📋 Summary

- `for...of` duyệt giá trị (mảng, chuỗi, Map, Set); `for...in` duyệt khoá của object.
- Không dùng `for...in` với mảng: chỉ số ra dạng chuỗi, và nó duyệt cả thuộc tính thêm vào.
- `map`/`filter`/`reduce` nói rõ ý định hơn `for`; dùng `for...of` khi cần `break` hoặc `await`.
- `await` không hoạt động trong `forEach` — dùng `for...of` cho tuần tự, `Promise.all` cho song song.
- Đừng sửa mảng trong lúc đang duyệt nó.

---

## 📝 Quiz

### Question 1

`for (const i in ['a', 'b'])` cho `i` những giá trị nào?

A. `'a'` và `'b'`

B. `0` và `1` (kiểu số)

C. `'0'` và `'1'` (kiểu **chuỗi**), vì `for...in` duyệt khoá của object và khoá luôn là chuỗi.

D. Không chạy vòng nào vì mảng không dùng được với `for...in`.

**Answer: C**

**Giải thích:** `for...in` duyệt khoá thuộc tính, mà khoá object trong JavaScript luôn là chuỗi. Với mảng, các chỉ số cũng là khoá nên bạn nhận về `'0'`, `'1'`. Điều này gây lỗi khi đem cộng: `'0' + 1` cho `'01'`. Muốn lấy giá trị thì dùng `for...of`.

---

### Question 2

Vì sao đoạn code sau in ra mảng rỗng?

```javascript
const results = [];
items.forEach(async (item) => {
  results.push(await process(item));
});
console.log(results);
```

A. Vì `push` không hoạt động bên trong `forEach`.

B. Vì `forEach` không chờ callback bất đồng bộ — nó gọi hết rồi trả về ngay, còn các promise vẫn đang chạy khi `console.log` thực thi.

C. Vì `results` phải khai bằng `let`.

D. Vì `await` chỉ dùng được ở cấp cao nhất của module.

**Answer: B**

**Giải thích:** `forEach` bỏ qua giá trị trả về của callback, mà callback `async` trả về một promise. Nó gọi cả ba callback rồi kết thúc ngay, không chờ promise nào. Muốn tuần tự thì dùng `for...of` với `await`; muốn song song thì `await Promise.all(items.map(...))`.
