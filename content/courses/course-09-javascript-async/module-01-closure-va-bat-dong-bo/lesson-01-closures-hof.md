---
id: javascript-async-m1-l1
course: JavaScript Nâng Cao & Async
module: Closure và bất đồng bộ
title: Closures & Higher-Order Functions
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Closures & Higher-Order Functions

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Hiểu thấu đáo bản chất của **Closure** thông qua Execution Context và Lexical Environment.
- Áp dụng Closure để đóng gói dữ liệu riêng tư (Private Data / Encapsulation) và tạo hàm Memoization (caching).
- Định nghĩa và xây dựng các hàm bậc cao (Higher-Order Functions - HOF).
- Làm chủ hai kỹ thuật tối ưu hóa hiệu năng ứng dụng giao diện cực kỳ quan trọng: **Debounce** và **Throttle**.
- Áp dụng các mẫu thiết kế Functional Programming nâng cao như Currying và Partial Application.

---

## 📖 Definition

### 1. Bản chất chuyên sâu của Closure
**Closure** xuất hiện khi một hàm được tạo ra và giữ lại tham chiếu tới môi trường từ vựng (Lexical Environment) nơi nó được định nghĩa — ngay cả khi hàm cha chứa nó đã hoàn tất lượt thi hành và bị xóa khỏi Call Stack.

Mỗi khi một hàm được gọi, một **Execution Context** mới được khởi tạo bao gồm Variable Environment. Khi một hàm con lồng bên trong được trả về ra ngoài, nó mang theo một mối nối (Scope Chain) tham chiếu đến biến của hàm cha. Nhờ đó, các biến này không bị dọn dẹp bởi cơ chế Garbage Collection.

**Ứng dụng cốt lõi của Closure:**
- **Data Privacy:** Giấu kín các biến để bên ngoài không thể can thiệp trực tiếp (chỉ có thể tương tác qua các phương thức được phơi ra).
- **Function Factory:** Tạo ra các hàm tùy biến có cấu hình riêng.
- **Memoization:** Lưu giữ kết quả tính toán đắt đỏ dựa trên đối số đầu vào để tái sử dụng.

### 2. Higher-Order Functions (HOF - Hàm bậc cao)
Một hàm được gọi là Higher-Order Function khi nó đạt **ít nhất một** trong hai điều kiện:
- Nhận một hoặc nhiều hàm khác làm tham số đầu vào (ví dụ: callbacks trong `map`, `filter`, `addEventListener`).
- Trả về kết quả là một hàm mới.

### 3. Debounce vs Throttle
Đây là hai HOF nâng cao áp dụng Closure để kiểm soát tần suất thực thi của một hàm:
- **Debounce:** Trì hoãn việc thi hành hàm cho đến khi một khoảng thời gian yên lặng trôi qua kể từ lần kích hoạt cuối cùng. Thích hợp cho: Ô tìm kiếm gợi ý (Auto-complete search input), kiểm tra trùng lặp email khi đang gõ.
- **Throttle:** Giới hạn hàm chỉ được thực thi **tối đa 1 lần** trong một khoảng thời gian cố định, dù sự kiện có bị kích hoạt liên tục. Thích hợp cho: Lắng nghe sự kiện cuộn trang (`window.onscroll`), kéo giãn cửa sổ (`window.onresize`).

---

## 💻 Syntax

### Closure Encapsulation Pattern
```javascript
function createStore(initialData) {
  let state = initialData; // Private variable

  return {
    getState: () => state,
    setState: (newState) => { state = newState; }
  };
}
```

### Debounce Pattern
```javascript
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

### Throttle Pattern
```javascript
function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

---

## 📝 Example 1 - Đóng gói dữ liệu riêng tư (Private State & Encapsulation)

```javascript
function createBankAccount(ownerName, initialBalance = 0) {
  let balance = initialBalance; // Biến bí mật
  const transactionHistory = []; // Nhật ký giao dịch private

  return {
    deposit(amount) {
      if (amount <= 0) return "Số tiền nạp không hợp lệ";
      balance += amount;
      transactionHistory.push({ type: "DEPOSIT", amount, date: new Date().toLocaleTimeString() });
      return `Nạp thành công ${amount}. Số dư mới: ${balance}`;
    },

    withdraw(amount) {
      if (amount > balance) return "Số dư không đủ!";
      balance -= amount;
      transactionHistory.push({ type: "WITHDRAW", amount, date: new Date().toLocaleTimeString() });
      return `Rút thành công ${amount}. Số dư còn lại: ${balance}`;
    },

    getHistory: () => [...transactionHistory] // Trả về bản sao an toàn
  };
}

const myAccount = createBankAccount("Nguyễn Long", 1000);
console.log(myAccount.deposit(500));
console.log(myAccount.withdraw(200));

// Thử truy cập trực tiếp biến balance
console.log(myAccount.balance); // Output: undefined (Không thể truy cập hoặc sửa đổi từ bên ngoài!)
```

Output:
```text
Nạp thành công 500. Số dư mới: 1500
Rút thành công 200. Số dư còn lại: 1300
undefined
```

---

## 📝 Example 2 - Tối ưu hiệu năng với Memoization

```javascript
function memoize(fn) {
  const cache = new Map(); // Lưu giữ kết quả đã tính

  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log(`[CACHE HIT] Lấy kết quả từ bộ nhớ cho đầu vào: ${key}`);
      return cache.get(key);
    }
    
    console.log(`[CALCULATING] Đang tính toán kết quả mới cho: ${key}`);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Hàm tính lũy thừa nặng
const power = (base, exp) => Math.pow(base, exp);
const memoizedPower = memoize(power);

console.log(memoizedPower(2, 10)); // Lần 1: Tính toán
console.log(memoizedPower(2, 10)); // Lần 2: Lấy ngay từ Cache
```

Output:
```text
[CALCULATING] Đang tính toán kết quả mới cho: [2,10]
1024
[CACHE HIT] Lấy kết quả từ bộ nhớ cho đầu vào: [2,10]
1024
```

---

## 📝 Example 3 - Xây dựng hàm Debounce cho ô tìm kiếm (Search Input)

```javascript
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer); // Hủy hẹn giờ cũ nếu user gõ tiếp
    timer = setTimeout(() => {
      fn.apply(this, args); // Chạy hàm sau khi đã ngừng gõ đủ delay ms
    }, delay);
  };
}

// Giả lập sự kiện gõ phím của người dùng
const onSearch = (query) => {
  console.log(`[API CALL] Tìm kiếm từ khóa: "${query}"`);
};

const debouncedSearch = debounce(onSearch, 500);

// Giả lập người dùng gõ liên tục: "r" -> "re" -> "rea" -> "react"
debouncedSearch("r");
debouncedSearch("re");
debouncedSearch("rea");
debouncedSearch("react"); // Chỉ gọi API duy nhất với từ khóa này sau 500ms
```

Output (Sau 500ms):
```text
[API CALL] Tìm kiếm từ khóa: "react"
```

---

## ⚠️ Notes

1. **Rò rỉ bộ nhớ (Memory Leaks) do Closure:** Vì Closure giữ lại các biến ở môi trường bên ngoài, nếu bạn vô tình giữ tham chiếu tới hàm closure quá lâu (ví dụ trong biến global hoặc event listener chưa unbind), các đối tượng lớn được tham chiếu sẽ không thể giải phóng khỏi bộ nhớ Heap.
2. **Ngữ cảnh `this` trong Debounce/Throttle:** Khi viết hàm Debounce/Throttle, bắt buộc phải lưu giữ ngữ cảnh `this` và tham số `args` bằng cách sử dụng `fn.apply(this, args)` để tránh làm mất binding `this` gốc của hàm callback.

---

## ❌ Common Mistakes

### Sai 1 - Nhầm lẫn giữa Debounce và Throttle
- **Debounce:** Thích hợp khi bạn chỉ quan tâm đến **kết quả cuối cùng** sau khi chuỗi hành động kết thúc (vd: dừng gõ phím).
- **Throttle:** Thích hợp khi bạn muốn hành động diễn ra **đều đặn theo chu kỳ** trong suốt quá trình người dùng liên tục thao tác (vd: cuộn trang).

### Sai 2 - Tạo mới hàm Debounce bên trong render loop / callback
```javascript
// ❌ Sai trong React: Mỗi lần re-render sẽ tạo 1 timer độc lập mới, khiến Debounce vô tác dụng!
input.addEventListener("input", (e) => {
  debounce(() => apiCall(e.target.value), 500)();
});
```

---

## 📚 Summary

- **Closure** cho phép hàm con truy cập môi trường vựng của hàm cha ngay cả khi hàm cha đã kết thúc thi hành.
- **Higher-Order Functions (HOF)** là hàm nhận tham số là hàm hoặc trả về một hàm.
- **Debounce** hoãn thực thi đến khi dừng thao tác đủ thời gian; **Throttle** giới hạn tần suất thực thi theo chu kỳ cố định.
- **Memoization** tận dụng Closure lưu lại bộ đệm (cache) giúp tối ưu các phép tính lặp lại phức tạp.

---

## 📝 Quiz

### Question 1
Kỹ thuật nào dưới đây phù hợp nhất để ngăn việc gửi hàng trăm API request liên tục khi người dùng đang gõ phím vào ô tìm kiếm?

A. Memoization  
B. Throttle  
C. Debounce  
D. Currying  

**Answer: C**

---

### Question 2
Điều gì giúp một hàm Closure có thể truy cập được các biến của hàm cha ngay cả khi hàm cha đã hoàn tất lượt thi hành?

A. Global Storage  
B. Lexical Scope Chain  
C. Event Loop Queue  
D. Garbage Collector  

**Answer: B**

---

### Question 3
Kỹ thuật Throttle khác Debounce ở điểm mấu chốt nào?

A. Throttle hủy tất cả các cuộc gọi cũ, Debounce thực thi liên tục  
B. Throttle giới hạn tần suất thực thi tối đa 1 lần trong chu kỳ cố định, Debounce chờ hoãn đến khi ngừng thao tác  
C. Throttle chỉ dành cho API request, Debounce chỉ dành cho DOM event  
D. Cả hai hoàn toàn giống nhau  

**Answer: B**
