---
id: react-fundamentals-m2-l2
course: React Fundamentals
module: State và tương tác người dùng
title: Events & Controlled Inputs
order: 2
difficulty: Beginner
estimatedTime: 240
---
# Events & Controlled Inputs

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững cách lắng nghe và xử lý sự kiện trong React với **SyntheticEvent**.
- Phân biệt **Controlled Components** (Form do React quản lý state) và **Uncontrolled Components**.
- Quản lý dữ liệu ô nhập liệu (Input, Textarea, Select, Checkbox, Radio) bằng State.
- Bắt và xử lý sự kiện nộp Form (`onSubmit`) kết hợp ngăn ngừa reload trang mặc định `e.preventDefault()`.
- Xây dựng Form xác thực dữ liệu cơ bản (Form Validation) và hiển thị thông báo lỗi giao diện.

---

## 📖 Definition

### 1. SyntheticEvent trong React
Khi bạn gắn một hàm lắng nghe sự kiện trong React (như `onClick`, `onChange`), React không sử dụng trực tiếp đối tượng sự kiện thuần của trình duyệt. Thay vào đó, React bọc nó trong một đối tượng đại diện gọi là **`SyntheticEvent`**.

`SyntheticEvent` đảm bảo tính nhất quán về thuộc tính và phương thức xử lý sự kiện trên tất cả các trình duyệt khác nhau (Cross-browser compatibility). Bạn vẫn sử dụng các hàm chuẩn như `e.preventDefault()` hay `e.stopPropagation()`.

### 2. Controlled Components (Thành phần được kiểm soát)
Trong HTML truyền thống, các phần tử Form như `<input>`, `<textarea>`, `<select>` tự duy trì trạng thái riêng dựa trên thao tác người dùng.

Trong React, **Controlled Component** là mô hình mà giá trị hiển thị của ô input bị kiểm soát hoàn toàn bởi **React State**:
- Thuộc tính `value` của input được gán cố định bằng một biến State.
- Mỗi khi người dùng gõ phím, sự kiện `onChange` kích hoạt hàm nạp lại giá trị mới vào State.
- State thay đổi khiến Component re-render và hiển thị giá trị mới lên input.
=> React trở thành "Single Source of Truth" (Nguồn chân lý duy nhất).

---

## 💻 Syntax

### SyntheticEvent Handling
```jsx
function ButtonClick() {
  const handleClick = (event) => {
    event.preventDefault();
    console.log("Target element:", event.target);
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### Controlled Input Pattern
```jsx
const [text, setText] = useState("");

<input 
  type="text" 
  value={text} 
  onChange={(e) => setText(e.target.value)} 
/>
```

### Controlled Select Pattern
```jsx
const [category, setCategory] = useState("react");

<select value={category} onChange={(e) => setCategory(e.target.value)}>
  <option value="react">React Pro</option>
  <option value="node">Node.js Expert</option>
</select>
```

---

## 📝 Example 1 - Truyền tham số tùy chỉnh vào Event Handler

```jsx
export function CourseListActions() {
  const handleRemoveCourse = (courseId, courseTitle, event) => {
    event.preventDefault();
    console.log(`Đã chọn xóa khóa học [ID: ${courseId}] - Tên: ${courseTitle}`);
  };

  return (
    <div className="action-list">
      <button onClick={(e) => handleRemoveCourse(101, "React Basics", e)}>
        Xóa khóa React
      </button>
      <button onClick={(e) => handleRemoveCourse(102, "Vue Basics", e)}>
        Xóa khóa Vue
      </button>
    </div>
  );
}
```

---

## 📝 Example 2 - Quản lý Form Đăng Nhập chuẩn Controlled Component

```jsx
import { useState } from "react";

export function ControlledLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // Ngăn hành vi reload lại trang web mặc định
    
    // Kiểm tra validate đơn giản
    if (!email.includes("@")) {
      setErrorMessage("Địa chỉ Email không đúng định dạng!");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải từ 6 ký tự trở lên!");
      return;
    }

    setErrorMessage("");
    console.log("Gửi dữ liệu đăng nhập:", { email, password });
    alert("Đăng nhập thành công!");
  };

  return (
    <form onSubmit={handleSubmit} className="login-card">
      <h2>Đăng Nhập</h2>
      {errorMessage && <div className="error-alert">{errorMessage}</div>}

      <div className="field">
        <label>Email:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="name@example.com" 
        />
      </div>

      <div className="field">
        <label>Mật khẩu:</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>

      <button type="submit">Đăng nhập</button>
    </form>
  );
}
```

---

## 📝 Example 3 - Dynamic Multi-Field Form với chung một Handler

```jsx
import { useState } from "react";

export function FeedbackForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    rating: "5",
    comment: "",
    subscribeNewsletter: true
  });

  // Một handler chung xử lý cho tất cả các field
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  return (
    <div className="feedback-container">
      <h3>Gửi Đánh Giá Khóa Học</h3>
      
      <div className="form-group">
        <label>Họ và tên:</label>
        <input 
          type="text" 
          name="fullName" 
          value={formData.fullName} 
          onChange={handleInputChange} 
        />
      </div>

      <div className="form-group">
        <label>Đánh giá sao:</label>
        <select name="rating" value={formData.rating} onChange={handleInputChange}>
          <option value="5">⭐⭐⭐⭐⭐ (Xuất sắc)</option>
          <option value="4">⭐⭐⭐⭐ (Tốt)</option>
          <option value="3">⭐⭐⭐ (Bình thường)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Ý kiến đóng góp:</label>
        <textarea 
          name="comment" 
          value={formData.comment} 
          onChange={handleInputChange} 
        />
      </div>

      <div className="form-group">
        <label>
          <input 
            type="checkbox" 
            name="subscribeNewsletter" 
            checked={formData.subscribeNewsletter} 
            onChange={handleInputChange} 
          />
          Nhận thông báo bài viết mới qua Email
        </label>
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Quên `e.preventDefault()` trên sự kiện `onSubmit`:** Mặc định thẻ `<form>` trong HTML khi submit sẽ phát một HTTP GET/POST request reload lại trang. Trong SPA React, bạn bắt buộc phải gọi `e.preventDefault()` ở dòng đầu của hàm submit handler.
2. **Luôn gắn `onChange` khi gắn `value`:** Nếu bạn truyền `value={state}` cho ô input nhưng không gắn `onChange={(e) => setState(e.target.value)}`, ô input đó sẽ trở thành ô Read-Only không thể gõ được gì và React sẽ bắn cảnh báo Warning.

---

## ❌ Common Mistakes

### Sai 1 - Tự kích hoạt hàm Event Handler ngay khi render thay vì truyền tham chiếu hàm
```jsx
// ❌ Sai: Hàm handleClick() sẽ bị gọi LẬP TỨC ngay khi vừa render component chứ không chờ click!
<button onClick={handleClick()}>Click me</button> 

// ✅ Đúng: Truyền tham chiếu hàm
<button onClick={handleClick}>Click me</button>
// ✅ Hoặc dùng Arrow Function wrap lại nếu cần truyền đối số
<button onClick={() => handleClick(id)}>Click me</button>
```

### Sai 2 - Gán giá trị `value` cho Controlled Input là `undefined` hoặc `null`
Nếu giá trị ban đầu của state là `undefined` hoặc `null`, ô input sẽ chuyển sang trạng thái Uncontrolled. Khi state sau này chuyển thành chuỗi, React sẽ báo lỗi `A component is changing an uncontrolled input to be controlled`.

---

## 📚 Summary

- **SyntheticEvent** bọc sự kiện trình duyệt giúp tương thích trên mọi nền tảng.
- **Controlled Components** dùng React State quản lý trực tiếp thuộc tính `value` của các thẻ nhập liệu Form.
- Luôn sử dụng `e.preventDefault()` trong hàm xử lý `onSubmit` của Form để chặn hành vi reload lại trang.
- Sử dụng thuộc tính `name` của input kết hợp Computed Property `[name]: value` để viết gọn hàm xử lý Form nhiều ô nhập liệu.

---

## 📝 Quiz

### Question 1
Controlled Component trong React là mô hình mà dữ liệu của ô nhập liệu Form được quản lý bởi thành phần nào?

A. Bộ nhớ LocalStorage của trình duyệt  
B. Thuộc tính `value` bị chi phối trực tiếp bởi React State  
C. Thuộc tính tự nhiên của cây DOM HTML  
D. CSDL backend  

**Answer: B**

---

### Question 2
Phương thức nào trên đối tượng `SyntheticEvent` được dùng để ngăn chặn hành vi reload lại trang web mặc định khi nộp Form?

A. `e.stopImmediatePropagation()`  
B. `e.preventDefault()`  
C. `e.stopPropagation()`  
D. `e.cancelBubble()`  

**Answer: B**

---

### Question 3
Điều gì sẽ xảy ra nếu bạn truyền thuộc tính `value="Hello"` vào một thẻ `<input>` nhưng không khai báo hàm xử lý `onChange`?

A. Ô input vẫn hoạt động gõ bình thường  
B. Ô input trở thành Read-only (không thể nhập hay sửa đổi văn bản) và React bắn cảnh báo  
C. Trình duyệt bị lỗi crash  
D. Tự động reload lại trang  

**Answer: B**
