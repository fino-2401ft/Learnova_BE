---
id: js-m4-l1
course: JavaScript Fundamentals
module: Objects & Arrays
title: Object
order: 1
difficulty: Beginner
estimatedTime: 30
---

# Object

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Tạo, đọc, sửa và xoá thuộc tính của object.
- Duyệt object bằng `Object.keys`, `values`, `entries`.
- Hiểu sao chép nông và sao chép sâu khác nhau.
- Dùng khoá động và thuộc tính rút gọn.

---

## 📖 Definition

Object là tập hợp các cặp **khoá – giá trị**. Khoá luôn là chuỗi hoặc `Symbol`; giá trị thì bất kỳ, kể cả object hay hàm khác.

Object là **kiểu tham chiếu**: biến không giữ object mà giữ địa chỉ tới nó. Hai hệ quả phải nhớ:

1. Gán object cho biến khác không tạo bản sao — cả hai cùng trỏ một chỗ.
2. So sánh object bằng `===` là so địa chỉ, không so nội dung.

---

## ⚙️ Syntax

```javascript
const user = {
  name: 'An',
  age: 20,
  'full name': 'Nguyễn An', // khoá có dấu cách phải đặt trong nháy
  greet() {
    return `Xin chào ${this.name}`;
  },
};

user.name;          // truy cập bằng dấu chấm
user['full name'];  // truy cập bằng ngoặc vuông
delete user.age;    // xoá thuộc tính
'name' in user;     // kiểm tra tồn tại
```

### Example 1 - Đọc, ghi, xoá

```javascript
const course = { title: 'NestJS', minutes: 1010 };

course.level = 'INTERMEDIATE'; // thêm
course.minutes = 900;          // sửa
delete course.minutes;         // xoá

console.log(course.khongTonTai);       // undefined, không ném lỗi
console.log(course.a?.b?.c);           // undefined, an toàn nhiều tầng
console.log('title' in course);        // true
console.log(Object.hasOwn(course, 'title')); // true — không tính prototype
```

### Example 2 - Khoá động và thuộc tính rút gọn

```javascript
const key = 'status';
const value = 'PUBLISHED';

// Khoá tính lúc chạy
const filter = { [key]: value }; // { status: 'PUBLISHED' }

// Rút gọn: tên biến trùng tên khoá
const title = 'NestJS';
const minutes = 1010;

const course = { title, minutes }; // thay cho { title: title, minutes: minutes }
```

### Example 3 - Duyệt object

```javascript
const user = { name: 'An', age: 20, role: 'MENTEE' };

Object.keys(user);    // ['name', 'age', 'role']
Object.values(user);  // ['An', 20, 'MENTEE']
Object.entries(user); // [['name', 'An'], ['age', 20], ['role', 'MENTEE']]

for (const [key, value] of Object.entries(user)) {
  console.log(`${key}: ${value}`);
}

// Biến đổi object: entries -> map -> fromEntries
const upper = Object.fromEntries(
  Object.entries(user).map(([k, v]) => [k, String(v).toUpperCase()]),
);
```

### Example 4 - Sao chép nông và sao chép sâu

```javascript
const original = { name: 'An', address: { city: 'Đà Nẵng' } };

// SAO CHÉP NÔNG: chỉ tầng ngoài cùng là mới
const shallow = { ...original };
shallow.name = 'Bình';              // không ảnh hưởng original
shallow.address.city = 'Hà Nội';    // CÓ ảnh hưởng — cùng trỏ một object

console.log(original.address.city); // 'Hà Nội' (!)

// SAO CHÉP SÂU
const deep = structuredClone(original); // có sẵn từ Node 17 / trình duyệt hiện đại
deep.address.city = 'Huế';
console.log(original.address.city); // 'Hà Nội' — không bị ảnh hưởng
```

`JSON.parse(JSON.stringify(obj))` cũng sao chép sâu nhưng làm mất `Date`, `Map`, `Set`, `undefined` và hàm. Dùng `structuredClone` khi có thể.

### Example 5 - Gộp object

```javascript
const defaults = { page: 1, limit: 20, sort: 'createdAt' };
const userInput = { limit: 50 };

// Thuộc tính bên phải ghi đè bên trái
const options = { ...defaults, ...userInput };
// { page: 1, limit: 50, sort: 'createdAt' }

// Object.assign sửa TRỰC TIẾP đối tượng đầu tiên
Object.assign(defaults, userInput); // defaults bị thay đổi (!)
```

Ưu tiên spread: nó tạo object mới thay vì sửa cái đang có.

---

## 📌 Notes

- **Khoá số bị chuyển thành chuỗi**: `{ 1: 'a' }` có khoá `'1'`.
- **Thứ tự khoá**: khoá số nguyên xếp tăng dần trước, rồi tới khoá chuỗi theo thứ tự thêm vào.
- **`Object.freeze()` chỉ đóng băng một tầng.**
- Cần khoá không phải chuỗi, hoặc cần biết số lượng phần tử, thì dùng `Map` thay vì object.

---

## 🌍 Real World Example

```javascript
/**
 * Dựng DTO từ bản ghi database.
 *
 * Chọn từng trường một cách tường minh thay vì `{ ...user }`: bản ghi chứa
 * passwordHash và các cột nội bộ, và spread sẽ đẩy hết chúng ra ngoài.
 */
function toUserDto(user) {
  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}
```

```javascript
/** Gom danh sách phẳng thành object nhóm theo một khoá. */
function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const group = item[key];
    // Khoá động: tên nhóm chỉ biết được lúc chạy.
    acc[group] = acc[group] ?? [];
    acc[group].push(item);
    return acc;
  }, {});
}

const courses = [
  { title: 'NestJS', level: 'INTERMEDIATE' },
  { title: 'Express', level: 'BEGINNER' },
  { title: 'Node.js', level: 'BEGINNER' },
];

groupBy(courses, 'level');
// { INTERMEDIATE: [...], BEGINNER: [..., ...] }
```

Hàm `toUserDto` là ví dụ điển hình cho việc **liệt kê tường minh an toàn hơn spread**. Ngày ai đó thêm cột `internalNotes` vào bảng users, hàm này vẫn không lộ nó ra ngoài.

---

## ⚠️ Common Mistakes

**Sai 1 — Nghĩ spread sao chép sâu**

```javascript
const copy = { ...original };
copy.nested.x = 1; // vẫn sửa original.nested
```

**Sai 2 — So sánh object bằng `===`**

```javascript
{ a: 1 } === { a: 1 } // false
```

**Sai 3 — Spread nguyên bản ghi database ra API**

Lộ `passwordHash`, `deletedAt` và mọi cột nội bộ khác.

**Sai 4 — Dùng `JSON.parse(JSON.stringify())` cho dữ liệu có `Date`**

`Date` biến thành chuỗi và không quay lại được.

**Sai 5 — Dùng object làm từ điển với khoá do người dùng nhập**

Khoá như `__proto__` hoặc `constructor` gây hành vi lạ. Dùng `Map` hoặc `Object.create(null)`.

---

## 📋 Summary

- Object là tập cặp khoá–giá trị; khoá luôn là chuỗi hoặc Symbol.
- Object là kiểu tham chiếu: gán không tạo bản sao, và `===` so địa chỉ chứ không so nội dung.
- Spread và `Object.assign` chỉ sao chép nông; cần sâu thì dùng `structuredClone`.
- `Object.keys/values/entries` để duyệt; `Object.fromEntries` để dựng lại sau khi biến đổi.
- Dựng DTO bằng cách liệt kê tường minh, đừng spread cả bản ghi database.

---

## 📝 Quiz

### Question 1

Sau đoạn code này, `original.address.city` bằng gì?

```javascript
const original = { name: 'An', address: { city: 'Đà Nẵng' } };
const copy = { ...original };
copy.address.city = 'Hà Nội';
```

A. `'Đà Nẵng'` — spread đã tạo bản sao độc lập.

B. `'Hà Nội'` — spread chỉ sao chép nông, `copy.address` và `original.address` vẫn trỏ cùng một object.

C. `undefined`

D. Ném `TypeError` vì object đã bị sao chép.

**Answer: B**

**Giải thích:** Spread tạo object mới ở tầng ngoài cùng, nhưng giá trị của mỗi thuộc tính được sao chép nguyên xi. Với `address` thì thứ được sao chép là **địa chỉ tham chiếu**, nên cả hai object cùng trỏ tới một `address`. Muốn tách hẳn phải dùng `structuredClone`.

---

### Question 2

Vì sao nên viết `toUserDto` liệt kê từng trường thay vì `return { ...user }`?

A. Vì spread chậm hơn khi object có nhiều thuộc tính.

B. Vì bản ghi database chứa cả những cột không được lộ ra ngoài như `passwordHash`, và spread sẽ đẩy hết chúng vào phản hồi API.

C. Vì spread không hoạt động với object trả về từ Prisma.

D. Vì DTO bắt buộc phải là class chứ không phải object literal.

**Answer: B**

**Giải thích:** Đây là kiểu rò rỉ dữ liệu nguy hiểm vì nó không gây lỗi nào cả — API vẫn trả 200 và không ai để ý. Nguy hiểm hơn nữa là nó xảy ra *sau này*: hôm nay bảng chỉ có cột an toàn, nhưng ngày ai đó thêm một cột nhạy cảm thì nó tự động lọt ra ngoài mà không cần sửa dòng code nào.
