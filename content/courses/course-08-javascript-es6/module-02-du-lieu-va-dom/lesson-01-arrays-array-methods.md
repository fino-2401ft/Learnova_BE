---
id: javascript-es6-m2-l1
course: JavaScript ES6+ Cơ Bản
module: Dữ liệu và DOM
title: Arrays & Array Methods
order: 1
difficulty: Intermediate
estimatedTime: 240
---
# Arrays & Array Methods

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững cách khởi tạo và thao tác cơ bản trên mảng (Array).
- Thành thạo các hàm xử lý mảng nâng cao (Higher-Order Methods): `map`, `filter`, `reduce`.
- Phân biệt và ứng dụng chính xác các hàm tìm kiếm: `find`, `findIndex`, `includes`, `some`, `every`.
- Phân biệt các phương thức biến đổi dữ liệu có thay đổi mảng gốc (Mutating) và không làm thay đổi mảng gốc (Immutable).
- Chỗi các phương thức (Method Chaining) để giải quyết các bài toán xử lý danh sách dữ liệu thực tế phức tạp.

---

## 📖 Definition

### 1. Mảng trong JavaScript (Arrays)
Array là một kiểu dữ liệu danh sách có thứ tự (Indexed Collection), trong đó các phần tử được truy cập thông qua chỉ số bắt đầu từ `0`. Mảng trong JavaScript có tính chất linh hoạt: có thể chứa hỗn hợp nhiều kiểu dữ liệu khác nhau và tự động mở rộng kích thước.

### 2. Các phương thức xử lý Mảng cốt lõi (Functional Methods)
Trong lập trình JS hiện đại (đặc biệt là React), việc thao tác dữ liệu theo phong cách **Immutability (Không thay đổi trực tiếp mảng gốc)** là nguyên tắc tối quan trọng:

- **`map(callback)`:** Biến đổi từng phần tử trong mảng theo công thức định sẵn và trả về một **mảng MỚI** có cùng độ dài với mảng ban đầu.
- **`filter(callback)`:** Lọc ra các phần tử thỏa mãn điều kiện (callback trả về `true`) và trả về một **mảng MỚI** chứa các phần tử thỏa mãn.
- **`reduce(callback, initialValue)`:** Tích lũy (thu gọn) mảng thành một giá trị duy nhất (có thể là một số, một chuỗi, một đối tượng hoặc một mảng mới).
- **`find(callback)`:** Trả về phần tử **đầu tiên** thỏa mãn điều kiện. Nếu không thấy, trả về `undefined`.
- **`findIndex(callback)`:** Trả về vị trí (index) của phần tử đầu tiên thỏa mãn điều kiện. Nếu không thấy, trả về `-1`.

### 3. Phân biệt Mutating vs Non-Mutating Methods
- **Mutating Methods (Thay đổi mảng gốc):** `push()`, `pop()`, `shift()`, `unshift()`, `splice()`, `sort()`, `reverse()`.
- **Non-Mutating / Immutable Methods (Trả về mảng/giá trị mới):** `map()`, `filter()`, `reduce()`, `slice()`, `concat()`, `includes()`, `find()`.

---

## 💻 Syntax

### Transform & Filter & Reduce
```javascript
// map
const newArr = arr.map((item, index) => item * 2);

// filter
const filtered = arr.filter(item => item.isPublished);

// reduce
const total = arr.reduce((accumulator, current) => accumulator + current.price, 0);
```

### Search & Validation
```javascript
// find & findIndex
const item = arr.find(x => x.id === targetId);
const index = arr.findIndex(x => x.id === targetId);

// some & every
const hasAdmin = users.some(user => user.role === "admin");
const allAdults = users.every(user => user.age >= 18);
```

---

## 📝 Example 1 - Ứng dụng map() và filter() để chuyển đổi danh sách dữ liệu

```javascript
const rawProducts = [
  { id: 1, name: "Laptop Dell", price: 15000000, category: "tech", inStock: true },
  { id: 2, name: "Chuột không dây", price: 300000, category: "accessory", inStock: false },
  { id: 3, name: "Màn hình Dell 27 inch", price: 6500000, category: "tech", inStock: true },
  { id: 4, name: "Bàn phím cơ", price: 1200000, category: "accessory", inStock: true }
];

// Lọc ra các sản phẩm còn hàng thuộc danh mục "tech" và format lại cấu hình hiển thị
const availableTechItems = rawProducts
  .filter(product => product.inStock && product.category === "tech")
  .map(product => ({
    title: product.name.toUpperCase(),
    formattedPrice: `${product.price.toLocaleString("vi-VN")} VNĐ`
  }));

console.log(availableTechItems);
```

Output:
```text
[
  { title: 'LAPTOP DELL', formattedPrice: '15,000,000 VNĐ' },
  { title: 'MÀN HÌNH DELL 27 INCH', formattedPrice: '6,500,000 VNĐ' }
]
```

---

## 📝 Example 2 - Thống kê dữ liệu nâng cao bằng reduce()

```javascript
const cartItems = [
  { id: "P1", name: "Áo sơ mi", qty: 2, price: 250000 },
  { id: "P2", name: "Quần Jeans", qty: 1, price: 450000 },
  { id: "P3", name: "Tất cổ ngắn", qty: 5, price: 30000 }
];

// Tính tổng số lượng món hàng và tổng tiền đơn hàng bằng 1 lệnh reduce
const cartSummary = cartItems.reduce(
  (summary, item) => {
    summary.totalItems += item.qty;
    summary.totalPrice += item.qty * item.price;
    return summary;
  },
  { totalItems: 0, totalPrice: 0 }
);

console.log("Thống kê giỏ hàng:", cartSummary);
```

Output:
```text
Thống kê giỏ hàng: { totalItems: 8, totalPrice: 1100000 }
```

---

## 📝 Example 3 - Tìm kiếm và Kiểm tra dữ liệu (find, findIndex, some, every)

```javascript
const students = [
  { id: 101, name: "An", score: 8.5 },
  { id: 102, name: "Bình", score: 4.0 },
  { id: 103, name: "Chi", score: 9.2 }
];

// Tìm student có score < 5
const failedStudent = students.find(s => s.score < 5.0);
console.log("Học sinh cần phụ đạo:", failedStudent?.name); // Output: Bình

// Kiểm tra xem tất cả có đạt điểm trung bình (>= 5) không
const isClassPassed = students.every(s => s.score >= 5.0);
console.log("Cả lớp đều qua môn?:", isClassPassed); // Output: false

// Kiểm tra xem có học sinh xuất sắc (>= 9) không
const hasTopStudent = students.some(s => s.score >= 9.0);
console.log("Có học sinh xuất sắc?:", hasTopStudent); // Output: true
```

Output:
```text
Học sinh cần phụ đạo: Bình
Cả lớp đều qua môn?: false
Có học sinh xuất sắc?: true
```

---

## ⚠️ Notes

1. **Truyền `initialValue` cho `reduce`:** Luôn khai báo giá trị khởi tạo (initialValue) cho hàm `reduce`. Nếu mảng rỗng và không có initialValue, `reduce` sẽ ném lỗi `TypeError: Reduce of empty array with no initial value`.
2. **`sort()` làm biến đổi mảng gốc (Mutation):** Hàm `sort()` trong JS sắp xếp trực tiếp trên mảng hiện tại và mặc định chuyển giá trị về String để so sánh. Để sắp xếp số hoặc mảng object một cách an toàn mà không biến đổi mảng gốc, hãy dùng toán tử spread trước: `[...arr].sort((a, b) => a - b)`.
3. **Phân biệt `map` và `forEach`:** `forEach` chỉ dùng để thực thi một tác dụng phụ (side-effect) trên từng phần tử và trả về `undefined`. Ngược lại, `map` luôn trả về một mảng mới. Không dùng `map` nếu bạn không sử dụng mảng kết quả trả về.

---

## ❌ Common Mistakes

### Sai 1 - Dùng `sort()` cho số mà không truyền compare function
```javascript
const numbers = [10, 5, 100, 2];
numbers.sort();
console.log(numbers); // ❌ [10, 100, 2, 5] (Sắp xếp theo thứ tự bảng chữ cái)

// Đúng:
numbers.sort((a, b) => a - b); // ✅ [2, 5, 10, 100]
```

### Sai 2 - Quên return trong callback của `map()` hoặc `filter()` khi viết khối lệnh `{}`
```javascript
const doubleNums = [1, 2, 3].map(n => {
  n * 2; // ❌ Quên từ khóa return
});
console.log(doubleNums); // [undefined, undefined, undefined]
```

### Sai 3 - Nhầm lẫn giữa `find` và `filter`
```javascript
const users = [{ id: 1, name: "A" }, { id: 2, name: "B" }];
const user = users.filter(u => u.id === 1); 
// ❌ filter trả về mảng [{ id: 1, name: "A" }] chứ không phải đối tượng { id: 1, name: "A" }
```

---

## 📚 Summary

- `map()` biến đổi phần tử trả về mảng mới; `filter()` lọc các phần tử thỏa mãn trả về mảng mới.
- `reduce()` thu gọn mảng thành 1 giá trị tích lũy (luôn nhớ truyền giá trị khởi tạo).
- `find()` lấy phần tử đầu tiên thỏa mãn; `some()` / `every()` kiểm tra điều kiện Boolean.
- Hãy cẩn thận với các phương thức biến đổi mảng gốc như `sort()`, `splice()`. Hãy sao chép mảng bằng Spread `[...arr]` trước khi sắp xếp.

---

## 📝 Quiz

### Question 1
Phương thức nào dưới đây tạo ra mảng mới chỉ chứa các phần tử thỏa mãn một điều kiện nhất định?

A. `map()`  
B. `reduce()`  
C. `filter()`  
D. `forEach()`  

**Answer: C**

---

### Question 2
Đoạn mã sau sẽ in ra kết quả gì trong console?
```javascript
const nums = [1, 2, 3, 4];
const result = nums.reduce((acc, curr) => acc + curr, 10);
console.log(result);
```

A. `10`  
B. `20`  
C. `14`  
D. `Error`  

**Answer: B**

---

### Question 3
Phương thức mảng nào dưới đây làm thay đổi trực tiếp mảng gốc (Mutating Method)?

A. `map()`  
B. `slice()`  
C. `sort()`  
D. `filter()`  

**Answer: C**
