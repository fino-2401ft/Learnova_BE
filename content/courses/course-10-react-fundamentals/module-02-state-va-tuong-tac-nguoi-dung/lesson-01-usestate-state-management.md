---
id: react-fundamentals-m2-l1
course: React Fundamentals
module: State và tương tác người dùng
title: useState — State Management
order: 1
difficulty: Beginner
estimatedTime: 240
---
# useState — State Management

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững bản chất của **State** và lý do tại sao biến thường không thể kích hoạt lại quá trình Re-render của React.
- Sử dụng thành thạo **`useState` Hook** để khởi tạo, đọc và cập nhật dữ liệu bộ nhớ của Component.
- Áp dụng kỹ thuật **Functional Updates** (`setCount(prev => prev + 1)`) để xử lý cập nhật state an toàn.
- Cập nhật đúng chuẩn **Immutability (Không biến đổi trực tiếp)** cho State kiểu Object và Array bằng toán tử Spread (`...`).
- Xây dựng ứng dụng quản lý trạng thái thực tế như Bộ đếm (Counter) và Danh sách việc cần làm (Todo List).

---

## 📖 Definition

### 1. State trong React là gì?
State là bộ nhớ riêng của từng Component instance. Nó chứa dữ liệu có thể thay đổi theo thời gian (do người dùng tương tác, nhận dữ liệu từ server, timer...).

Khi dữ liệu trong **State** thay đổi (thông qua hàm setter), React sẽ tự động kích hoạt quá trình **Re-render** (chạy lại hàm Component) để cập nhật giao diện hiển thị cho phù hợp với trạng thái mới.

### 2. Hook `useState()`
`useState` là một hàm tích hợp sẵn của React (Hook) cho phép thêm State vào Function Component.

- **Cú pháp Destructuring:** `const [state, setState] = useState(initialValue);`
  - `state`: Biến lưu trữ giá trị hiện tại.
  - `setState`: Hàm dùng để cập nhật giá trị mới cho state.
  - `initialValue`: Giá trị khởi tạo ban đầu.

### 3. Nguyên tắc Immutability khi cập nhật State
React sử dụng cơ chế so sánh nông (`===`) để kiểm tra xem State có thực sự thay đổi hay không trước khi quyết định re-render.

- **Đối với Primitive State (Number, String, Boolean):** Bạn truyền trực tiếp giá trị mới: `setCount(5)`.
- **Đối với Reference State (Object, Array):** **TUYỆT ĐỐI KHÔNG MUTATE TRỰC TIẾP** (như `user.age = 20` hay `items.push(newItem)`). Bạn bắt buộc phải **tạo một bản sao Object/Array mới** (thường dùng toán tử Spread `...`) và nạp bản sao đó vào hàm setter.

---

## 💻 Syntax

### Primitive State & Functional Update
```jsx
import { useState } from "react";

const [count, setCount] = useState(0);

// Cập nhật dựa trên state cũ an toàn (Functional Update)
const increment = () => setCount(prevCount => prevCount + 1);
```

### Object State Update
```jsx
const [user, setUser] = useState({ name: "Long", age: 22 });

// Đúng chuẩn Immutability
setUser(prevUser => ({
  ...prevUser, // Sao chép lại các trường cũ
  age: 23     // Ghi đè trường cần đổi
}));
```

### Array State Update
```jsx
const [todos, setTodos] = useState(["Học React", "Build App"]);

// Thêm item mới
setTodos(prevTodos => [...prevTodos, "Bài học mới"]);

// Xóa item bằng filter
setTodos(prevTodos => prevTodos.filter((item, index) => index !== targetIndex));
```

---

## 📝 Example 1 - Bộ đếm Counter với giới hạn giá trị và Reset

```jsx
import { useState } from "react";

export function CounterApp({ initialValue = 0, min = 0, max = 10 }) {
  const [count, setCount] = useState(initialValue);

  const handleIncrement = () => {
    if (count < max) {
      setCount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (count > min) {
      setCount(prev => prev - 1);
    }
  };

  return (
    <div className="counter-box">
      <h2>Giá trị hiện tại: {count}</h2>
      <div className="btn-group">
        <button onClick={handleDecrement} disabled={count <= min}>- Giảm</button>
        <button onClick={() => setCount(initialValue)}>Reset</button>
        <button onClick={handleIncrement} disabled={count >= max}>+ Tăng</button>
      </div>
      {count === max && <p className="warning">⚠️ Đã đạt giới hạn tối đa!</p>}
    </div>
  );
}
```

---

## 📝 Example 2 - Quản lý Object State trong Form Đăng Ký

```jsx
import { useState } from "react";

export function RegisterForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    agreeTerms: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Immutable state update
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dữ liệu gửi đi:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <input 
        type="text" 
        name="username" 
        value={formData.username} 
        onChange={handleChange} 
        placeholder="Tên đăng nhập" 
      />
      <input 
        type="email" 
        name="email" 
        value={formData.email} 
        onChange={handleChange} 
        placeholder="Email" 
      />
      <label>
        <input 
          type="checkbox" 
          name="agreeTerms" 
          checked={formData.agreeTerms} 
          onChange={handleChange} 
        />
        Đồng ý với điều khoản dịch vụ
      </label>
      <button type="submit" disabled={!formData.agreeTerms}>Đăng ký</button>
    </form>
  );
}
```

---

## 📝 Example 3 - Ứng dụng Danh Sách Nhiệm Vụ (Todo List) với Array State

```jsx
import { useState } from "react";

export function SimpleTodoList() {
  const [todos, setTodos] = useState([]);
  const [textInput, setTextInput] = useState("");

  const handleAddTodo = () => {
    if (!textInput.trim()) return;
    
    const newTodo = { id: Date.now(), text: textInput, completed: false };
    setTodos(prev => [...prev, newTodo]);
    setTextInput(""); // Reset input
  };

  const handleToggleComplete = (id) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDeleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  return (
    <div className="todo-container">
      <h3>Danh sách việc cần làm</h3>
      <div className="input-group">
        <input 
          value={textInput} 
          onChange={(e) => setTextInput(e.target.value)} 
          placeholder="Thêm công việc mới..." 
        />
        <button onClick={handleAddTodo}>Thêm</button>
      </div>

      <ul>
        {todos.map(todo => (
          <li key={todo.id} style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
            <span onClick={() => handleToggleComplete(todo.id)}>{todo.text}</span>
            <button onClick={() => handleDeleteTodo(todo.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **State updates có tính chất Asynchronous / Batching:** Hàm setter (`setState`) không ngay lập tức đổi giá trị của biến `state` ở dòng tiếp theo trong hàm hiện tại. Giá trị mới chỉ khả dụng ở lượt re-render tiếp theo.
2. **Luôn dùng Functional Update khi state mới phụ thuộc state cũ:** Viết `setCount(prev => prev + 1)` thay vì `setCount(count + 1)` để tránh bị dính stale state khi thực hiện cập nhật liên tiếp.
3. **Chỉ gọi Hooks ở cấp cao nhất của Component:** Tuyệt đối không gọi `useState` bên trong vòng lặp (`for`), câu điều kiện (`if`), hay các hàm con thông thường.

---

## ❌ Common Mistakes

### Sai 1 - Mutate Object/Array State trực tiếp
```jsx
// ❌ Sai: Thay đổi mảng gốc -> React dùng so sánh === không thấy đổi object ref -> KHÔNG RE-RENDER
const [items, setItems] = useState([1, 2]);
items.push(3);
setItems(items); 

// ✅ Đúng: Tạo mảng mới
setItems([...items, 3]);
```

### Sai 2 - Cố gắng đọc giá trị state ngay sau dòng gọi setter
```jsx
const [name, setName] = useState("An");

const handleClick = () => {
  setName("Bình");
  console.log(name); // ❌ Vẫn in ra "An" ở lượt chạy hiện tại!
};
```

---

## 📚 Summary

- **State** giúp Component lưu giữ bộ nhớ dữ liệu và tự động re-render giao diện khi dữ liệu thay đổi.
- Sử dụng Hook `useState(initialValue)` để khai báo cặp `[state, setState]`.
- Tuân thủ nguyên tắc **Immutability**: Tạo bản sao mới bằng toán tử Spread khi cập nhật Object hoặc Array State.
- Sử dụng **Functional Updates** khi state mới tính toán dựa trên giá trị của state trước đó.

---

## 📝 Quiz

### Question 1
Điều gì xảy ra khi bạn gọi hàm setter của `useState` với một giá trị mới?

A. Mã nguồn file JS sẽ tự động ghi đè lên đĩa cứng  
B. Component sẽ được kích hoạt quá trình Re-render để cập nhật giao diện mới  
C. Trình duyệt reload lại trang web hoàn toàn  
D. Không có chuyện gì xảy ra  

**Answer: B**

---

### Question 2
Cách nào sau đây là chuẩn mực nhất để thêm một phần tử mới vào mảng State mà không làm thay đổi trực tiếp mảng gốc?

A. `items.push(newItem); setItems(items);`  
B. `setItems([...items, newItem]);`  
C. `setItems(items.unshift(newItem));`  
D. `items[items.length] = newItem; setItems(items);`  

**Answer: B**

---

### Question 3
Tại sao bạn nên dùng dạng hàm `setCount(prev => prev + 1)` thay vì `setCount(count + 1)` khi tăng giá trị liên tiếp?

A. Giúp mã chạy nhanh hơn 100 lần  
B. Đảm bảo hàm setter luôn nhận được giá trị state mới nhất và chính xác nhất, tránh hiện tượng Stale State trong Batching  
C. Tránh phải khai báo từ khóa `const`  
D. Bắt buộc bởi trình biên dịch TypeScript  

**Answer: B**
