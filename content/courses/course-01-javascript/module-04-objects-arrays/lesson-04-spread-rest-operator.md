---
id: js-m4-l4
course: JavaScript Fundamentals
module: Objects & Arrays
title: Spread và Rest
order: 4
difficulty: Beginner
estimatedTime: 30
---

# Spread và Rest

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Phân biệt spread và rest dù cả hai cùng viết là `...`.
- Dùng spread để sao chép và gộp object, mảng.
- Dùng rest để gom tham số và gom thuộc tính còn lại.
- Biết giới hạn của spread khi làm việc với dữ liệu lồng nhau.

---

## 📖 Definition

Cả hai cùng ký hiệu `...`, nhưng làm hai việc **ngược nhau**:

- **Spread** — *trải* một tập hợp ra thành từng phần tử rời. Xuất hiện ở nơi **dùng** giá trị.
- **Rest** — *gom* nhiều phần tử rời thành một tập hợp. Xuất hiện ở nơi **khai báo**.

```javascript
// Spread: trải mảng ra thành từng đối số
Math.max(...[1, 2, 3]);

// Rest: gom các đối số thành mảng
function f(...args) {}
```

Cách phân biệt nhanh: nhìn xem `...` nằm ở vế trái (khai báo, tham số) hay vế phải (biểu thức, lời gọi). Trái là rest, phải là spread.

---

## ⚙️ Syntax

```javascript
// Spread
const b = [...a];               // sao chép mảng
const c = [...a1, ...a2];       // gộp mảng
const o2 = { ...o1 };           // sao chép object
const o3 = { ...o1, x: 1 };     // sao chép rồi ghi đè
f(...args);                     // trải thành đối số

// Rest
function f(...args) {}          // gom đối số
const [first, ...rest] = arr;   // gom phần tử còn lại
const { a, ...others } = obj;   // gom thuộc tính còn lại
```

### Example 1 - Spread với mảng

```javascript
const a = [1, 2];
const b = [3, 4];

const copy = [...a];             // [1, 2] — mảng mới
const merged = [...a, ...b];     // [1, 2, 3, 4]
const inserted = [...a, 99, ...b]; // [1, 2, 99, 3, 4]

// Trải thành đối số
Math.max(...[3, 1, 4]); // 4

// Chuyển thứ giống mảng thành mảng thật
const nodes = [...document.querySelectorAll('div')];
const chars = [...'abc']; // ['a', 'b', 'c']
```

### Example 2 - Spread với object

```javascript
const defaults = { page: 1, limit: 20, sort: 'createdAt' };
const input = { limit: 50 };

// Bên phải ghi đè bên trái
const options = { ...defaults, ...input };
// { page: 1, limit: 50, sort: 'createdAt' }

// Cập nhật bất biến: tạo object mới thay vì sửa cái cũ
const user = { name: 'An', age: 20 };
const older = { ...user, age: 21 }; // user không đổi
```

Cập nhật bất biến là nền tảng của React và mọi thư viện quản lý trạng thái: chúng phát hiện thay đổi bằng cách so sánh tham chiếu, nên sửa tại chỗ sẽ không kích hoạt render lại.

### Example 3 - Rest trong tham số hàm

```javascript
function tong(...so) {
  return so.reduce((s, n) => s + n, 0); // `so` là mảng THẬT
}

tong(1, 2, 3); // 6

// Kết hợp tham số thường và rest
function log(mucDo, ...thongDiep) {
  console.log(`[${mucDo}]`, ...thongDiep); // rest gom vào, spread trải ra
}

// Rest phải đứng CUỐI
function sai(...a, b) {} // SyntaxError
```

Dòng `console.log(...thongDiep)` là ví dụ đẹp: `...` ở tham số là rest (gom), `...` ở lời gọi là spread (trải).

### Example 4 - Rest trong destructuring

```javascript
// Mảng
const [first, second, ...others] = [1, 2, 3, 4, 5];
// first = 1, second = 2, others = [3, 4, 5]

// Object
const { userId, ...profile } = {
  userId: '1',
  name: 'An',
  email: 'an@example.com',
};
// userId = '1', profile = { name, email }
```

### Example 5 - Giới hạn: spread chỉ sao chép nông

```javascript
const original = {
  name: 'An',
  tags: ['a', 'b'],
  address: { city: 'Đà Nẵng' },
};

const copy = { ...original };

copy.name = 'Bình';            // an toàn — chuỗi là nguyên thuỷ
copy.tags.push('c');           // SỬA LUÔN original.tags
copy.address.city = 'Hà Nội';  // SỬA LUÔN original.address

console.log(original.tags);        // ['a', 'b', 'c']
console.log(original.address.city); // 'Hà Nội'
```

Spread sao chép **giá trị** của từng thuộc tính. Với nguyên thuỷ thì đó là bản sao thật; với object và mảng thì thứ được sao chép chỉ là địa chỉ tham chiếu.

```javascript
// Sao chép sâu
const deep = structuredClone(original);

// Hoặc sao chép thủ công từng tầng cần thiết
const partial = {
  ...original,
  tags: [...original.tags],
  address: { ...original.address },
};
```

---

## 📌 Notes

- **Spread object chỉ lấy thuộc tính riêng và enumerable**, không lấy từ prototype.
- **Spread mảng cần đối tượng lặp được**; spread object thì không cần.
- **`{ ...null }` cho `{}`**, không ném lỗi — khác với destructuring.
- Spread một mảng rất lớn thành đối số hàm có thể vượt giới hạn số đối số của engine.

---

## 🌍 Real World Example

```javascript
/**
 * Cập nhật một phần bản ghi mà không sửa object gốc.
 *
 * Chỉ đưa vào những trường thật sự được gửi lên: spread thẳng `patch` sẽ ghi đè
 * cả những trường mà client không hề nhắc tới nhưng vô tình có mặt với giá trị
 * `undefined`.
 */
function applyPatch(course, patch) {
  const changes = {};

  for (const key of ['title', 'description', 'level']) {
    if (patch[key] !== undefined) changes[key] = patch[key];
  }

  return { ...course, ...changes, updatedAt: new Date() };
}
```

```javascript
/** Middleware gom nhiều vai trò bằng rest, rồi trải ra khi ghi log. */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      logger.warn('Từ chối truy cập', {
        required: [...allowedRoles],   // sao chép để log không giữ tham chiếu
        actual: req.user?.role,
      });
      return res.status(403).json({ code: 'FORBIDDEN' });
    }
    next();
  };
}

router.post('/courses', requireRole('MENTOR', 'ADMIN'), createCourse);
```

```javascript
/** Cấu hình nhiều tầng: spread giữ được thứ tự ưu tiên rõ ràng. */
const config = {
  ...BASE_CONFIG,           // mặc định của thư viện
  ...environmentConfig,      // theo môi trường
  ...processEnvOverrides,    // biến môi trường, ưu tiên cao nhất
};
```

Thứ tự trong ví dụ cuối chính là tài liệu: đọc từ trên xuống là biết cái nào ghi đè cái nào.

---

## ⚠️ Common Mistakes

**Sai 1 — Nghĩ spread sao chép sâu**

Mảng và object lồng bên trong vẫn dùng chung.

**Sai 2 — Đặt rest không ở cuối**

Lỗi cú pháp trong cả tham số hàm lẫn destructuring.

**Sai 3 — Sai thứ tự khi gộp**

```javascript
const options = { ...userInput, ...defaults }; // mặc định ghi đè input!
const options = { ...defaults, ...userInput }; // đúng
```

**Sai 4 — Spread object có `undefined` lên bản ghi hiện có**

```javascript
// `title: undefined` sẽ XOÁ tiêu đề đang có
const updated = { ...course, ...patch };
```

**Sai 5 — Spread mảng hàng trăm nghìn phần tử vào lời gọi hàm**

```javascript
Math.max(...hugeArray); // RangeError: Maximum call stack size exceeded
```

---

## 📋 Summary

- Cùng ký hiệu `...`: rest ở vế khai báo (gom lại), spread ở vế biểu thức (trải ra).
- Spread dùng để sao chép và gộp; thuộc tính bên phải ghi đè bên trái nên thứ tự là quan trọng.
- Rest gom đối số thành mảng thật và phải đứng cuối.
- Spread chỉ sao chép nông — object và mảng lồng bên trong vẫn dùng chung tham chiếu.
- Cập nhật bất biến bằng spread là nền tảng của React và các thư viện quản lý trạng thái.

---

## 📝 Quiz

### Question 1

`...` trong `function log(mucDo, ...thongDiep)` là spread hay rest?

A. Spread — nó trải các đối số ra.

B. Rest — nó nằm ở phần khai báo tham số nên gom các đối số còn lại thành một mảng.

C. Tuỳ vào số lượng đối số truyền vào lúc gọi.

D. Không phải cả hai, đây là cú pháp tham số tuỳ chọn.

**Answer: B**

**Giải thích:** Vị trí quyết định ý nghĩa. Ở phần khai báo tham số, `...` gom nhiều đối số rời thành một mảng — đó là rest. Cùng ký hiệu ấy đặt trong lời gọi `console.log(...thongDiep)` lại là spread, vì nó trải mảng ra thành các đối số rời.

---

### Question 2

Sau đoạn code này, `original.tags` bằng gì?

```javascript
const original = { name: 'An', tags: ['a', 'b'] };
const copy = { ...original };
copy.tags.push('c');
```

A. `['a', 'b']` — `copy` là bản sao độc lập.

B. `['a', 'b', 'c']` — spread chỉ sao chép nông, nên `copy.tags` và `original.tags` là cùng một mảng.

C. `undefined`

D. Ném `TypeError` vì không push được vào mảng đã sao chép.

**Answer: B**

**Giải thích:** Spread tạo object mới ở tầng ngoài, nhưng giá trị của `tags` là một tham chiếu, và thứ được sao chép chính là tham chiếu đó. Sửa `copy.name` thì an toàn vì chuỗi là kiểu nguyên thuỷ, còn sửa nội dung mảng thì cả hai đều thấy. Cần tách hẳn thì `{ ...original, tags: [...original.tags] }` hoặc `structuredClone`.
