---
id: react-hooks-patterns-m2-l1
course: React Hooks & Patterns Nâng Cao
module: Tối ưu và tái sử dụng logic
title: useRef, useMemo & useCallback
order: 1
difficulty: Advanced
estimatedTime: 240
---
# useRef, useMemo & useCallback

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân biệt sự khác nhau giữa **`useRef`** và **`useState`**.
- Sử dụng **`useRef`** để truy cập phần tử DOM trực tiếp và lưu trữ các biến thay đổi không cần re-render.
- Áp dụng **`useMemo`** để lưu lại kết quả tính toán đắt đỏ (Expensive Calculation), tránh tính lại vô ích.
- Sử dụng **`useCallback`** để giữ nguyên tham chiếu hàm Callback (Function Reference), tối ưu hóa Re-render cho Component con.
- Đánh giá thời điểm thực sự cần thiết để áp dụng các Hook tối ưu hóa hiệu năng mà không gây Premature Optimization.

---

## 📖 Definition

### 1. `useRef` — DOM Reference & Persistent Mutable Value
`useRef` trả về một đối tượng ref mutable có thuộc tính `.current` duy nhất.

Đặc điểm cốt lõi của `useRef`:
- **Thay đổi `ref.current` KHÔNG KÍCH HOẠT Re-render của Component.**
- Hai trường hợp sử dụng chính:
  1. Truy cập trực tiếp phần tử DOM của HTML (như `.focus()`, `.scrollIntoView()`, chơi nhạc/video).
  2. Lưu trữ dữ liệu thay đổi xuyên suốt các lượt render mà không muốn Component bị re-render lại (như lưu Timer ID của `setInterval`, giữ giá trị state của lượt render trước).

### 2. `useMemo` — Ghi nhớ kết quả tính toán (Memoize Computed Values)
`useMemo` giúp ghi nhớ (cache) kết quả của một phép tính toán phức tạp tốn nhiều CPU.
- **Cú pháp:** `const cachedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);`
- React chỉ chạy lại hàm tính toán khi một trong các biến trong mảng phụ thuộc `[a, b]` bị thay đổi giá trị. Nếu mảng phụ thuộc giữ nguyên, React sẽ trả về kết quả đã được cache từ lượt render trước.

### 3. `useCallback` — Ghi nhớ tham chiếu hàm (Memoize Function Reference)
Trong JavaScript, mỗi khi một Component re-render, tất cả các hàm khai báo bên trong nó đều được **tạo mới lại một địa chỉ ô nhớ hoàn toàn mới**. Khi truyền hàm này xuống Component con, Component con sẽ coi đó là một Prop mới và bị ép re-render lại.

- `useCallback` giúp giữ nguyên địa chỉ tham chiếu của một hàm giữa các lượt re-render.
- **Cú pháp:** `const memoizedCallback = useCallback(() => { doSomething(a); }, [a]);`

---

## 💻 Syntax

### useRef Syntax (Focus Input & Timer)
```jsx
const inputRef = useRef(null);

// Focus ô input
const handleFocus = () => inputRef.current.focus();

<input ref={inputRef} type="text" />
```

### useMemo & useCallback Syntax
```jsx
// useMemo: Cache kết quả giá trị
const sortedList = useMemo(() => {
  return items.sort((a, b) => a.price - b.price);
}, [items]);

// useCallback: Cache địa chỉ tham chiếu hàm
const handleDelete = useCallback((id) => {
  setItems(prev => prev.filter(item => item.id !== id));
}, []);
```

---

## 📝 Example 1 - Truy cập DOM Element với useRef (Auto-Focus & Smooth Scroll)

```jsx
import { useRef } from "react";

export function AutoFocusSearch() {
  const searchInputRef = useRef(null);
  const bottomSectionRef = useRef(null);

  const handleFocusClick = () => {
    // Truy cập trực tiếp DOM node và gọi phương thức native
    searchInputRef.current.focus();
    searchInputRef.current.style.border = "2px solid #3b82f6";
  };

  const handleScrollToBottom = () => {
    bottomSectionRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="container">
      <button onClick={handleFocusClick}>🔍 Tìm kiếm ngay (Auto-focus)</button>
      <button onClick={handleScrollToBottom}>⬇️ Cuộn xuống cuối trang</button>

      <div style={{ marginTop: "20px" }}>
        <input ref={searchInputRef} type="text" placeholder="Nhập từ khóa..." />
      </div>

      <div style={{ height: "1000px" }}>Khoảng trống cuộn trang...</div>

      <div ref={bottomSectionRef} className="footer-section">
        <h3>📌 Phần chân trang (Bottom Section)</h3>
      </div>
    </div>
  );
}
```

---

## 📝 Example 2 - Tối ưu hóa hiệu năng tính toán với `useMemo`

```jsx
import { useState, useMemo } from "react";

// Giả lập phép tính rất tốn CPU
function expensiveFilter(products, category) {
  console.log("⏳ Đang chạy thuật toán lọc sản phẩm tốn CPU...");
  const start = performance.now();
  while (performance.now() - start < 200) {
    // Giả lập nghẽn CPU 200ms
  }
  return products.filter(p => category === "all" || p.category === category);
}

export function ProductFilterApp() {
  const [products] = useState([
    { id: 1, name: "React Pro", category: "frontend", price: 500000 },
    { id: 2, name: "Node.js Expert", category: "backend", price: 400000 },
    { id: 3, name: "Vue.js Guide", category: "frontend", price: 300000 }
  ]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [darkTheme, setDarkTheme] = useState(false);

  // ✅ Dùng useMemo: Phép tính đắt đỏ chỉ chạy lại khi [products, selectedCategory] đổi.
  // Đổi giao diện darkTheme sẽ KHÔNG làm chạy lại phép tính đắt đỏ này!
  const filteredProducts = useMemo(() => {
    return expensiveFilter(products, selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div style={{ backgroundColor: darkTheme ? "#1e293b" : "#fff", color: darkTheme ? "#fff" : "#000" }}>
      <button onClick={() => setDarkTheme(prev => !prev)}>Toggle Dark Theme</button>
      
      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
        <option value="all">Tất cả</option>
        <option value="frontend">Frontend</option>
        <option value="backend">Backend</option>
      </select>

      <ul>
        {filteredProducts.map(p => (
          <li key={p.id}>{p.name} - {p.price} VNĐ</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📝 Example 3 - Giữ vững tham chiếu hàm với `useCallback`

```jsx
import { useState, useCallback, memo } from "react";

// Component con được bọc memo để ngăn re-render nếu props không đổi
const ActionButton = memo(({ onClick, children }) => {
  console.log(`[RE-RENDER] Button ${children} vừa re-render!`);
  return <button onClick={onClick}>{children}</button>;
});

export function ParentComponent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");

  // ✅ Dùng useCallback để giữ cố định địa chỉ tham chiếu của hàm
  const handleResetCount = useCallback(() => {
    setCount(0);
  }, []); // Mảng phụ thuộc rỗng = địa chỉ hàm không bao giờ đổi

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(c => c + 1)}>+ Tăng count</button>

      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Gõ chữ ở đây..." />

      {/* Khi nhập chữ vào input, parent re-render nhưng ActionButton KHÔNG bị re-render lại nhờ useCallback */}
      <ActionButton onClick={handleResetCount}>Reset Count</ActionButton>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **`useRef` không trigger Re-render:** Nếu bạn thay đổi `ref.current = 100`, giao diện hiển thị giá trị đó trên màn hình sẽ **KHÔNG tự động cập nhật** cho đến khi có một State khác trigger re-render Component.
2. **Không tối ưu hóa sớm (Avoid Premature Optimization):** Không nên bọc tất cả các hàm bằng `useCallback` hoặc tất cả các biến bằng `useMemo`. Chi phí quản lý bộ nhớ của React cho `useMemo/useCallback` đôi khi còn tốn kém hơn việc tính toán lại một phép tính nhẹ. Chỉ dùng khi phép tính thực sự đắt hoặc khi truyền callback xuống `React.memo` Child Component.

---

## ❌ Common Mistakes

### Sai 1 - Nhầm lẫn giữa `useRef` và `useState` khi muốn cập nhật giao diện
```jsx
// ❌ Sai: Đổi ref.current không làm re-render giao diện!
const countRef = useRef(0);
const handleClick = () => {
  countRef.current++; // Giao diện vẫn trơ ra không đổi số!
};
```

---

## 📚 Summary

- **`useRef`** lưu giữ tham chiếu DOM hoặc biến mutable có giá trị tồn tại qua các lượt render mà KHÔNG làm re-render Component.
- **`useMemo`** lưu lại (cache) kết quả tính toán phức tạp tốn CPU.
- **`useCallback`** lưu lại địa chỉ tham chiếu của hàm Callback để tránh làm re-render các Component con được bọc `React.memo`.

---

## 📝 Quiz

### Question 1
Điểm khác biệt mấu chốt giữa `useRef` và `useState` là gì?

A. `useRef` chỉ dùng được trên máy tính Mac  
B. Thay đổi giá trị của `useRef.current` không kích hoạt Re-render Component, trong khi `useState` thì có  
C. `useState` không lưu được đối tượng Object  
D. `useRef` chạy bất đồng bộ  

**Answer: B**

---

### Question 2
Hook `useMemo` được thiết kế để giải quyết bài toán nào dưới đây?

A. Tự động gửi API request sau 5 giây  
B. Ghi nhớ (cache) kết quả của một phép tính toán phức tạp, tránh tính lại vô ích khi các biến phụ thuộc không đổi  
C. Thay đổi màu sắc thẻ HTML  
D. Xóa dữ liệu LocalStorage  

**Answer: B**

---

### Question 3
Mục đích chính của việc bọc một hàm callback trong `useCallback` là gì?

A. Tăng tốc độ tải trang từ Server  
B. Giữ cố định địa chỉ tham chiếu của hàm giữa các lượt re-render để tránh làm re-render các Component con được bọc `React.memo`  
C. Tự động sửa lỗi cú pháp trong hàm  
D. Biến hàm đó thành hàm bất đồng bộ `async`  

**Answer: B**
