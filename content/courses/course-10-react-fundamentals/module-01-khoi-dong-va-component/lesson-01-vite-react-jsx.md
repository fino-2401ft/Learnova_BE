---
id: react-fundamentals-m1-l1
course: React Fundamentals
module: Khởi động và Component
title: Setup Vite + React & JSX
order: 1
difficulty: Beginner
estimatedTime: 240
---
# Setup Vite + React & JSX

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Khởi tạo dự án React hiện đại bằng **Vite** và nắm vững cấu trúc thư mục tiêu chuẩn.
- Hiểu thấu đáo khái niệm **JSX** (JavaScript XML) và cách JSX được dịch mã thành `React.createElement`.
- Áp dụng các quy tắc cú pháp JSX: Thẻ bọc Root, `Fragment` (`<>...</>`), `className`, `htmlFor`, self-closing tags.
- Nhúng biểu thức JavaScript động vào JSX với cặp dấu ngoặc nhọn `{}`.
- Định kiểu giao diện CSS Inline và CSS Modules trong React.

---

## 📖 Definition

### 1. Vite vs Create-React-App
Trong hệ sinh thái React hiện đại, **Vite** đã thay thế Create-React-App để trở thành công cụ khởi tạo dự án tiêu chuẩn nhờ tốc độ khởi chạy siêu nhanh dựa trên ES Modules chuẩn của trình duyệt và Hot Module Replacement (HMR) tức thì.

### 2. JSX (JavaScript XML) là gì?
JSX là một cú pháp mở rộng (Syntax Extension) cho JavaScript cho phép lập trình viên viết các cấu trúc giống HTML ngay bên trong file JavaScript (`.jsx` / `.tsx`).

Bản chất JSX **không phải là HTML**. Trình biên dịch (Babel hoặc ESBuild trong Vite) sẽ dịch các thẻ JSX thành các lệnh gọi hàm JavaScript `React.createElement(component, props, ...children)` để tạo ra cây DOM ảo (**Virtual DOM**).

### 3. Các quy tắc quan trọng trong JSX
- **Duy nhất một Root Element:** Mỗi component JSX phải trả về duy nhất một phần tử bao bọc ngoài cùng. Sử dụng `<React.Fragment>` hoặc ký hiệu rút gọn `<>...</>` để nhóm nhiều phần tử mà không tạo thêm thẻ `<div>` thừa trên cây DOM.
- **Tên thuộc tính chuẩn JavaScript:** Dùng `className` thay cho `class`, `htmlFor` thay cho `for`, và các sự kiện dùng CamelCase (như `onClick`, `onChange`).
- **Tự đóng thẻ (Self-Closing Tags):** Các thẻ không có nội dung con (như `<img>`, `<input>`, `<br>`) bắt buộc phải có dấu gạch chéo tự đóng `/>`.
- **Nhúng biểu thức với `{}`:** Mọi biểu thức JavaScript hợp lệ (biến, phép toán, gọi hàm, ternary operator) đều có thể nhúng vào JSX bằng ngoặc `{}`.

---

## 💻 Syntax

### Khởi tạo dự án bằng Vite
```bash
npm create vite@latest my-react-app -- --template react
cd my-react-app
npm install
npm run dev
```

### Cú pháp JSX & Fragment
```jsx
function Header() {
  const title = "Hệ thống EduConnect";
  const isLoggedIn = true;

  return (
    <>
      <h1 className="main-title">{title.toUpperCase()}</h1>
      {isLoggedIn ? <button>Dashboard</button> : <button>Đăng nhập</button>}
    </>
  );
}
```

### Styling Object trong JSX
```jsx
const styleObject = {
  backgroundColor: "#1e293b",
  color: "#f8fafc",
  padding: "16px",
  borderRadius: "8px"
};

<div style={styleObject}>Box styled</div>
```

---

## 📝 Example 1 - Tạo Component JSX đầu tiên với Fragment và Inline Style

```jsx
// src/components/WelcomeCard.jsx
export function WelcomeCard() {
  const student = {
    name: "Nguyễn Văn A",
    course: "React Fundamentals",
    score: 9.5
  };

  const cardStyle = {
    border: "1px solid #cbd5e1",
    padding: "20px",
    borderRadius: "12px",
    backgroundColor: "#f8fafc"
  };

  return (
    <div style={cardStyle} className="welcome-card">
      <h2>Xin chào, {student.name}! 👋</h2>
      <p>Bạn đang học khóa: <strong>{student.course}</strong></p>
      <p>Điểm đánh giá: <span style={{ color: student.score >= 8 ? "green" : "red" }}>{student.score}/10</span></p>
      {student.score >= 9.0 && <span className="badge">🎓 Học viên Xuất sắc</span>}
    </div>
  );
}
```

---

## 📝 Example 2 - Phân biệt giữa `class` vs `className` và Render có điều kiện

```jsx
// src/components/LoginForm.jsx
export function LoginForm() {
  const isMaintenance = false;

  if (isMaintenance) {
    return <div className="alert-warning">⚠️ Hệ thống đang bảo trì!</div>;
  }

  return (
    <form className="form-container">
      <div className="form-group">
        <label htmlFor="emailInput">Địa chỉ Email:</label>
        <input 
          type="email" 
          id="emailInput" 
          className="input-control" 
          placeholder="user@example.com" 
        />
      </div>
      <button type="submit" className="btn btn-primary">Xác nhận</button>
    </form>
  );
}
```

---

## 📝 Example 3 - Nhúng biểu thức JavaScript phức tạp vào JSX

```jsx
export function CourseStatus() {
  const lessons = [
    { id: 1, title: "Cấu trúc Vite", completed: true },
    { id: 2, title: "Cú pháp JSX", completed: true },
    { id: 3, title: "Component & Props", completed: false }
  ];

  const completedCount = lessons.filter(l => l.completed).length;

  return (
    <div className="status-box">
      <h3>Tiến độ học tập</h3>
      <p>Đã hoàn thành: {completedCount}/{lessons.length} bài học</p>
      <div className="progress-bar">
        Trạng thái: {completedCount === lessons.length ? "🎉 Hoàn thành khóa học" : "📖 Đang học"}
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **JSX bắt buộc phải có 1 phần tử bao ngoài:** Không thể trả về trực tiếp `return (<h1>A</h1> <h2>B</h2>)` mà không bọc chúng trong thẻ `<div>` hoặc `<Fragment>`.
2. **Comment trong JSX:** Để viết ghi chú/comment bên trong JSX, bạn phải dùng cú pháp `{/* comment ở đây */}`.
3. **Các giá trị Boolean, null, undefined không hiển thị lên giao diện:** Khi nhúng `{true}`, `{false}`, `{null}`, `{undefined}` vào JSX, React sẽ tự động bỏ qua không render ra chữ gì (rất hữu ích cho conditional rendering với `&&`).

---

## ❌ Common Mistakes

### Sai 1 - Dùng thuộc tính HTML truyền thống `class` thay vì `className`
```jsx
// ❌ Cảnh báo Warning trong Developer Console
<div class="box">Content</div> 

// ✅ Đúng chuẩn JSX
<div className="box">Content</div>
```

### Sai 2 - Viết thuộc tính CSS Inline kiểu chuỗi thay vì Object
```jsx
// ❌ SyntaxError
<div style="color: red; font-size: 16px;"></div> 

// ✅ Đúng chuẩn (Dùng CamelCase cho tên thuộc tính)
<div style={{ color: "red", fontSize: "16px" }}></div>
```

### Sai 3 - Quên tự đóng thẻ cho `<img>` hoặc `<input>`
```jsx
// ❌ SyntaxError trong JSX
<img src="logo.png"> 

// ✅ Đúng
<img src="logo.png" />
```

---

## 📚 Summary

- Vite là công cụ tạo dự án React tốc độ cao tiêu chuẩn hiện nay.
- JSX giúp viết giao diện khai báo (Declarative UI) bằng cú pháp tương tự HTML ngay trong mã JavaScript.
- Luôn bọc các phần tử JSX trong duy nhất một root element hoặc `<React.Fragment>`.
- Dùng `className`, `htmlFor`, và ngoặc `{}` để nhúng logic JavaScript vào giao diện.

---

## 📝 Quiz

### Question 1
JSX được dịch mã (transpile) thành lời gọi hàm JavaScript tiêu chuẩn nào sau đây trước khi chạy trên trình duyệt?

A. `document.createElement()`  
B. `React.createElement()`  
C. `React.renderDOM()`  
D. `JSX.compile()`  

**Answer: B**

---

### Question 2
Thuộc tính nào dưới đây được sử dụng để gán class CSS cho một thẻ trong JSX?

A. `class`  
B. `classList`  
C. `className`  
D. `cssClass`  

**Answer: C**

---

### Question 3
Thẻ `<React.Fragment>` hoặc ký hiệu rút gọn `<>...</>` có tác dụng gì trong JSX?

A. Tăng tốc độ gọi API  
B. Nhóm nhiều phần tử JSX lại mà không thêm node thẻ HTML thừa vào cây DOM  
C. Tự động mã hóa dữ liệu đầu vào  
D. Tạo hiệu ứng chuyển động animation  

**Answer: B**
