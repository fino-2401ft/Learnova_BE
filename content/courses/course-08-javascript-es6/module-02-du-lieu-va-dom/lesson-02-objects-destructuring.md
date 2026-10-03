---
id: javascript-es6-m2-l2
course: JavaScript ES6+ Cơ Bản
module: Dữ liệu và DOM
title: Objects & Destructuring
order: 2
difficulty: Intermediate
estimatedTime: 240
---
# Objects & Destructuring

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững cú pháp tạo và truy cập Object trong JS (Property Shorthand, Computed Property Names).
- Làm chủ kỹ thuật bóc tách dữ liệu (Object & Array Destructuring).
- Thiết lập giá trị mặc định (Default Values) và đổi tên biến (Renaming) khi Destructuring.
- Sử dụng các hàm tiện ích của Object: `Object.keys()`, `Object.values()`, `Object.entries()`, `Object.assign()`, `Object.freeze()`.
- Áp dụng an toàn toán tử Optional Chaining (`?.`) kết hợp Nullish Coalescing (`??`) khi làm việc với cấu trúc dữ liệu lồng nhau phức tạp.

---

## 📖 Definition

### 1. Nâng cấp Object trong ES6+
Đối tượng (Object) trong JavaScript là tập hợp các cặp key-value. Trong ES6+, cú pháp khởi tạo Object được tối ưu hóa với:
- **Property Shorthand:** Khi tên biến trùng với tên key của Object, ta có thể viết ngắn gọn `{ name }` thay vì `{ name: name }`.
- **Computed Property Names:** Cho phép sử dụng biểu thức tính toán trong ngoặc vuông `[expression]` để làm tên key động cho Object.

### 2. Destructuring Assignment (Bóc tách dữ liệu)
Destructuring là một cú pháp cho phép "bóc tách" trực tiếp các giá trị từ Array hoặc thuộc tính từ Object ra các biến riêng biệt một cách ngắn gọn, sạch sẽ. Kỹ thuật này được áp dụng liên tục khi làm việc với props và state trong React.

### 3. Optional Chaining (`?.`)
Khi làm việc với dữ liệu lồng nhau từ API trả về, việc truy cập vào một thuộc tính nằm sâu bên trong một đối tượng bị `null` hoặc `undefined` sẽ gây ra lỗi nghiêm trọng `TypeError: Cannot read properties of undefined`.
Toán tử Optional Chaining (`?.`) giúp kiểm tra ngắn gọn: Nếu đối tượng vế trước là `null` hoặc `undefined`, nó sẽ lập tức ngắt chuỗi lệnh và trả về `undefined` thay vì throw lỗi làm ứng dụng bị vỡ (crash).

---

## 💻 Syntax

### Object Shorthand & Computed Keys
```javascript
const name = "React";
const keyName = "level";

const course = {
  name,                // Property Shorthand
  [keyName]: "Basic"   // Computed Property Name
};
```

### Object & Array Destructuring
```javascript
// Object Destructuring với Alias và Default Value
const { title: courseTitle, rating = 5.0, author: { name: authorName } } = courseData;

// Array Destructuring
const [firstItem, secondItem, ...otherItems] = arrayData;
```

### Optional Chaining & Nullish Coalescing
```javascript
const userCity = response?.data?.user?.address?.city ?? "Chưa cập nhật";
```

---

## 📝 Example 1 - Destructuring lồng nhau và đổi tên biến trong React Props pattern

```javascript
const userProfile = {
  id: "USR-882",
  personalInfo: {
    fullName: "Trần Anh Vũ",
    contact: {
      email: "anhvu@gmail.com",
      phone: "0905123456"
    }
  },
  roles: ["student", "editor"]
};

// Destructuring lấy fullName (đổi tên thành name), email, và vai trò đầu tiên (primaryRole)
const {
  personalInfo: {
    fullName: name,
    contact: { email }
  },
  roles: [primaryRole]
} = userProfile;

console.log(`User: ${name} | Email: ${email} | Role chính: ${primaryRole}`);
```

Output:
```text
User: Trần Anh Vũ | Email: anhvu@gmail.com | Role chính: student
```

---

## 📝 Example 2 - Các phương thức Object.keys(), Object.values(), Object.entries()

```javascript
const scoreBoard = {
  math: 8.5,
  english: 9.0,
  physics: 7.8
};

// 1. Lấy danh sách môn học
const subjects = Object.keys(scoreBoard);
console.log("Danh sách môn:", subjects);

// 2. Tính điểm trung bình tất cả môn
const scores = Object.values(scoreBoard);
const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
console.log("Điểm trung bình:", avgScore.toFixed(2));

// 3. In ra chi tiết môn và điểm dưới dạng chuỗi
Object.entries(scoreBoard).forEach(([subject, score]) => {
  console.log(`Môn ${subject.toUpperCase()}: ${score} điểm`);
});
```

Output:
```text
Danh sách môn: [ 'math', 'english', 'physics' ]
Điểm trung bình: 8.43
Môn MATH: 8.5 điểm
Môn ENGLISH: 9 điểm
Môn PHYSICS: 7.8 điểm
```

---

## 📝 Example 3 - Xử lý an toàn dữ liệu bất định với Optional Chaining (`?.`)

```javascript
// Giả lập API response lúc thành công, lúc thiếu trường thông tin
const apiResponse = {
  status: 200,
  data: {
    user: {
      id: 1,
      displayName: "Nguyễn Long"
      // Trường address bị đứt gãy hoặc null
    }
  }
};

// Truy cập an toàn không sợ crash app
const streetName = apiResponse?.data?.user?.address?.street ?? "Không tìm thấy đường";
const zipCode = apiResponse?.data?.user?.address?.getZipCode?.() ?? "N/A";

console.log("Địa chỉ đường:", streetName);
console.log("Mã bưu điện:", zipCode);
```

Output:
```text
Địa chỉ đường: Không tìm thấy đường
Mã bưu điện: N/A
```

---

## ⚠️ Notes

1. **Destructuring biến đã khai báo trước:** Khi bóc tách Object cho các biến đã được khai báo từ trước, bạn phải bọc toàn bộ câu lệnh trong ngoặc tròn `()`. Ví dụ: `({ a, b } = obj);` (nếu không bọc, JS sẽ hiểu `{}` ở đầu dòng là 1 Block Code).
2. **`Object.freeze()` chỉ đóng frozen ở tầng ngoài cùng (Shallow Freeze):** Nếu đối tượng có chứa đối tượng lồng nhau (nested object), các thuộc tính bên trong vẫn có thể bị chỉnh sửa trừ khi bạn đóng băng đệ quy (Deep Freeze).
3. **Thứ tự phần tử khi Destructuring Array vs Object:**
   - Array Destructuring phụ thuộc vào **vị trí/thứ tự** phần tử (`[a, b]`).
   - Object Destructuring phụ thuộc vào **tên của thuộc tính (Key)** (`{ name, age }`).

---

## ❌ Common Mistakes

### Sai 1 - Destructuring từ `null` hoặc `undefined`
```javascript
const user = null;
const { name } = user; // ❌ TypeError: Cannot destructure property 'name' of 'null' as it is null.

// Khắc phục: Gán giá trị mặc định trước khi bóc tách
const { name } = user || {}; // ✅ name sẽ là undefined, không throw error
```

### Sai 2 - Đổi tên biến (Alias) nhầm cú pháp với gán giá trị mặc định
```javascript
const config = { port: 8080 };

// ❌ Nhầm lẫn: Đang tạo biến tên là 3000 chứ không phải đổi tên
const { port = serverPort } = config; 

// ✅ Đúng: Đổi tên port thành serverPort và gán default value là 3000
const { port: serverPort = 3000 } = config;
```

### Sai 3 - Lạm dụng Optional Chaining cho tất cả biến gây khó debug
Chỉ dùng `?.` ở những nơi dữ liệu thực sự có rủi ro bị thiếu (ví dụ từ API bên ngoài). Việc đặt `?.` khắp nơi có thể che giấu các lỗi logic thật sự trong mã nguồn.

---

## 📚 Summary

- Property Shorthand và Computed Property Names giúp tạo Object linh hoạt hơn.
- Destructuring hỗ trợ bóc tách thuộc tính từ Object/Array gọn gàng; hỗ trợ alias (`key: alias`) và default values.
- `Object.keys()`, `values()`, `entries()` hỗ trợ duyệt và thao tác trên Object dễ dàng.
- Optional Chaining `?.` ngăn chặn crash ứng dụng khi truy cập thuộc tính sâu từ dữ liệu chưa xác định (`null/undefined`).

---

## 📝 Quiz

### Question 1
Cho đoạn code sau:
```javascript
const person = { name: "Nam", age: 25 };
const { name: fullName, gender = "Nam" } = person;
console.log(fullName, gender);
```
Kết quả in ra console là gì?

A. `Nam Nam`  
B. `fullName Nam`  
C. `Nam gender`  
D. `undefined Nam`  

**Answer: A**

---

### Question 2
Khi thực hiện dòng lệnh `console.log(data?.user?.getAvatar?.())` với `data = { user: null }`, kết quả thu được là gì?

A. `TypeError: Cannot read properties of null`  
B. `null`  
C. `undefined`  
D. `ReferenceError`  

**Answer: C**

---

### Question 3
Hàm nào dưới đây trả về một mảng chứa các cặp danh sách `[key, value]` từ một Object?

A. `Object.keys()`  
B. `Object.values()`  
C. `Object.entries()`  
D. `Object.assign()`  

**Answer: C**
