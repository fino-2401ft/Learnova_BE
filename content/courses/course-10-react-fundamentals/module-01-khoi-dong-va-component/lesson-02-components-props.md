---
id: react-fundamentals-m1-l2
course: React Fundamentals
module: Khởi động và Component
title: Components & Props
order: 2
difficulty: Beginner
estimatedTime: 240
---
# Components & Props

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững khái niệm **Function Component** và tư duy chia nhỏ giao diện thành các thành phần tái sử dụng được.
- Hiểu và ứng dụng **Props** để truyền dữ liệu từ Component cha xuống Component con.
- Sử dụng thuộc tính đặc biệt **`children` prop** để xây dựng các Layout Wrapper Component linh hoạt.
- Đặt giá trị mặc định cho Props (Default Props) và giải nén Props ngắn gọn (Props Destructuring).
- Tổ chức và tái cấu trúc giao diện theo tư duy Component Composition.

---

## 📖 Definition

### 1. Function Component trong React
Component là khối xây dựng cơ bản nhất của ứng dụng React. Một Function Component đơn giản là một hàm JavaScript nhận vào đối tượng **Props** và trả về giao diện JSX.

**Quy tắc đặt tên:** Tên của Component **bắt buộc phải viết hoa chữ cái đầu tiên (PascalCase)** (ví dụ: `Button`, `UserProfileCard`). Nếu bạn viết thường (`<button />`), React sẽ hiểu đó là thẻ HTML tiêu chuẩn của trình duyệt.

### 2. Props (Properties) là gì?
Props là cơ chế truyền dữ liệu **một chiều từ trên xuống dưới (Unidirectional Data Flow)**, từ Component cha (Parent) sang Component con (Child).

- Props là đối tượng **Read-Only (Chỉ đọc)**. Component con tuyệt đối không được tự ý chỉnh sửa giá trị của Props được truyền vào từ cha (nguyên tắc Pure Function).
- Props có thể chứa bất kỳ kiểu dữ liệu nào: Chuỗi, Số, Boolean, Array, Object, hoặc hàm Callback (`onClick`, `onSelect`).

### 3. `children` Prop
`children` là một Prop đặc biệt được React tự động truyền vào mọi Component. Nó đại diện cho toàn bộ nội dung JSX nằm **giữa thẻ đóng và thẻ mở** của Component đó khi được gọi: `<Card><h2>Nội dung nằm trong children</h2></Card>`. Kỹ thuật này giúp tạo ra các Container Component linh hoạt (như Modal, Card, Layout).

---

## 💻 Syntax

### Khai báo Component & Destructuring Props
```jsx
// Khai báo với Props Destructuring và Default Values
function UserBadge({ username, role = "Học viên", avatarUrl }) {
  return (
    <div className="user-badge">
      <img src={avatarUrl || "/default-avatar.png"} alt={username} />
      <span>{username} ({role})</span>
    </div>
  );
}
```

### Children Prop Wrapper
```jsx
function ContainerCard({ title, children }) {
  return (
    <div className="card-box">
      <h3 className="card-header">{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}
```

---

## 📝 Example 1 - Xây dựng Reusable CourseCard Component với Props

```jsx
// src/components/CourseCard.jsx
export function CourseCard({ title, instructor, price, isFeatured }) {
  const formattedPrice = price === 0 
    ? "Miễn phí" 
    : `${price.toLocaleString("vi-VN")} VNĐ`;

  return (
    <div className={`course-card ${isFeatured ? "featured" : ""}`}>
      {isFeatured && <span className="badge-hot">🔥 Nổi bật</span>}
      <h3 className="title">{title}</h3>
      <p className="instructor">Giảng viên: {instructor}</p>
      <p className="price">Học phí: {formattedPrice}</p>
      <button className="btn-enroll">Đăng ký ngay</button>
    </div>
  );
}

// Sử dụng trong App Component
export function CourseList() {
  return (
    <div className="courses-grid">
      <CourseCard 
        title="React Fundamentals" 
        instructor="Nguyễn Long" 
        price={500000} 
        isFeatured={true} 
      />
      <CourseCard 
        title="HTML & CSS Nhập môn" 
        instructor="Trần Vũ" 
        price={0} 
      />
    </div>
  );
}
```

---

## 📝 Example 2 - Sử dụng `children` Prop để tạo Modal Dialog tái sử dụng

```jsx
// src/components/Modal.jsx
export function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        <div className="modal-body">
          {children} {/* Render nội dung linh hoạt được truyền vào */}
        </div>
      </div>
    </div>
  );
}

// Sử dụng Modal
export function ParentView() {
  return (
    <Modal isOpen={true} title="Xác nhận đăng ký" onClose={() => console.log("Close")}>
      <p>Bạn có chắc chắn muốn đăng ký khóa học này không?</p>
      <button className="btn-confirm">Đồng ý</button>
    </Modal>
  );
}
```

---

## 📝 Example 3 - Truyền hàm Callback qua Props để gửi dữ liệu ngược lên cha

```jsx
// Component con: Ô tìm kiếm
export function SearchBar({ onSearchSubmit }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearchSubmit(e.target.value); // Gọi callback function của cha
    }
  };

  return (
    <input 
      type="text" 
      placeholder="Nhập từ khóa và ấn Enter..." 
      onKeyDown={handleKeyDown} 
    />
  );
}

// Component cha: Nhận từ khóa tìm kiếm
export function HeaderSection() {
  const handleSearch = (keyword) => {
    console.log("Đã nhận từ khóa từ con:", keyword);
  };

  return (
    <header>
      <h1>EduConnect Search</h1>
      <SearchBar onSearchSubmit={handleSearch} />
    </header>
  );
}
```

---

## ⚠️ Notes

1. **Props mang tính chất Read-Only (Immutable):** Tuyệt đối không viết `props.title = "Tên mới"` bên trong Component con. Nếu muốn thay đổi dữ liệu theo thời gian, bạn bắt buộc phải dùng **State**.
2. **Luôn đặt tên Component theo PascalCase:** Tên file và tên hàm component phải bắt đầu bằng chữ cái hoa (ví dụ: `Header.jsx`, `function Header()`).
3. **Boolean Props ngắn gọn:** Khi truyền prop kiểu boolean có giá trị `true`, bạn có thể viết ngắn gọn `<CourseCard isFeatured />` thay vì `<CourseCard isFeatured={true} />`.

---

## ❌ Common Mistakes

### Sai 1 - Cố tình chỉnh sửa giá trị của Props trong Component con
```jsx
// ❌ Cấm làm điều này trong React!
function UserCard(props) {
  props.name = props.name.toUpperCase(); // TypeError: Cannot assign to read only property
  return <div>{props.name}</div>;
}
```

### Sai 2 - Viết thường chữ cái đầu của Component khiến React hiểu nhầm thành thẻ HTML
```jsx
// ❌ React sẽ coi <userCard /> là một thẻ HTML không hợp lệ
function userCard() { return <div>User</div>; }
```

---

## 📚 Summary

- **Function Component** nhận Props và trả về giao diện JSX, tên luôn bắt đầu bằng chữ hoa.
- **Props** truyền dữ liệu 1 chiều từ cha xuống con và không thể bị sửa đổi bởi component con (Read-only).
- **`children` prop** giúp bóc tách và chèn các đoạn JSX linh hoạt vào bên trong Component.
- Có thể truyền hàm Callback qua Props để gửi thông điệp/dữ liệu từ con ngược lên cha.

---

## 📝 Quiz

### Question 1
Tính chất quan trọng nhất của Props trong React là gì?

A. Props có thể thay đổi trực tiếp bất kỳ lúc nào từ Component con  
B. Props mang tính chất Read-Only (chỉ đọc) và truyền dữ liệu 1 chiều từ cha xuống con  
C. Props chỉ chấp nhận kiểu dữ liệu Chuỗi (String)  
D. Props tự động lưu vào LocalStorage  

**Answer: B**

---

### Question 2
Thuộc tính `children` trong Props của một Component đại diện cho điều gì?

A. Danh sách các biến cục bộ  
B. Toàn bộ nội dung JSX nằm giữa thẻ mở và thẻ đóng của Component đó khi được gọi  
C. Số lượng component con trong cây DOM  
D. Đường dẫn API của component  

**Answer: B**

---

### Question 3
Tại sao tên của một React Component bắt buộc phải viết hoa chữ cái đầu tiên (PascalCase)?

A. Để làm mã nguồn trông đẹp hơn  
B. Để trình biên dịch JSX phân biệt giữa thẻ HTML tiêu chuẩn (chữ thường) và React Component (chữ hoa)  
C. Để kết nối tự động với CSDL  
D. Bắt buộc bởi ngôn ngữ JavaScript  

**Answer: B**
