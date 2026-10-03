---
id: react-fundamentals-m3-l1
course: React Fundamentals
module: Side effect, cơ chế render và form
title: useEffect & Side Effects
order: 1
difficulty: Beginner
estimatedTime: 240
---
# useEffect & Side Effects

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Nắm vững khái niệm **Side Effect** và vòng đời của Component trong React.
- Sử dụng **`useEffect` Hook** để đồng bộ dữ liệu với các hệ thống bên ngoài (API, DOM, Timers, LocalStorage).
- Kiểm soát thời điểm thi hành của Effect thông qua **Mảng phụ thuộc (Dependency Array)**.
- Viết các hàm dọn dẹp tài nguyên (**Cleanup Function**) để ngăn ngừa lỗi Rò rỉ bộ nhớ (Memory Leak).
- Gọi API an toàn và tự động hủy request không cần thiết với `AbortController`.

---

## 📖 Definition

### 1. Side Effect là gì?
Trong React, nhiệm vụ chính của Component là nhận Props/State và trả về JSX (Pure Rendering). Tất cả các thao tác nằm ngoài luồng render thuần túy này được gọi là **Side Effect (Tác dụng phụ)**.

Ví dụ về Side Effect:
- Gửi HTTP Request lấy dữ liệu từ Backend API.
- Tương tác trực tiếp với cây DOM thuần (như đổi `document.title`, lắng nghe `window.onscroll`).
- Cài đặt hẹn giờ (`setTimeout`, `setInterval`).
- Ghi/đọc dữ liệu từ `localStorage` / `sessionStorage`.

### 2. Hook `useEffect()`
`useEffect` là Hook cho phép bạn thực thi các Side Effect sau khi React đã hoàn tất quá trình render và cập nhật DOM thật.

**Cấu trúc:** `useEffect(setupFunction, dependencyArray)`

### 3. Quy tắc của Dependency Array (Mảng phụ thuộc)
Mảng phụ thuộc quyết định khi nào callback trong `useEffect` được gọi lại:
1. **Không truyền Dependency Array (`useEffect(fn)`):** Chạy lại sau **MỌI lượt render** của Component.
2. **Truyền mảng rỗng `[]` (`useEffect(fn, [])`):** Chỉ chạy đúng **1 LẦN duy nhất** ngay sau lần Render đầu tiên (Mounting phase).
3. **Truyền danh sách biến `[a, b]` (`useEffect(fn, [a, b])`):** Chạy ở lần render đầu tiên, và chạy lại mỗi khi bất kỳ biến nào trong mảng `[a, b]` bị thay đổi giá trị.

### 4. Cleanup Function (Hàm dọn dẹp)
Nếu callback trong `useEffect` trả về một hàm con (`return () => { ... }`), hàm con này được gọi là **Cleanup Function**.

React sẽ tự động gọi Cleanup Function:
- Ngay **trước khi** Effect chạy lại ở lượt re-render tiếp theo.
- Ngay khi Component bị hủy bỏ khỏi giao diện (**Unmount**).
Dùng Cleanup Function để: Hủy kết nối Event Listener, xóa timer (`clearInterval`), hủy API request (`abort()`).

---

## 💻 Syntax

### useEffect Basic Structure & Cleanup
```jsx
import { useEffect } from "react";

useEffect(() => {
  console.log("Effect thi hành sau khi render");

  // Cleanup function (Tùy chọn)
  return () => {
    console.log("Dọn dẹp tài nguyên trước khi unmount/re-effect");
  };
}, [dependency1, dependency2]);
```

### Fetch Data Pattern
```jsx
useEffect(() => {
  let isMounted = true;

  async function getData() {
    const res = await fetch("/api/data");
    const data = await res.json();
    if (isMounted) setData(data);
  }

  getData();

  return () => { isMounted = false; };
}, []);
```

---

## 📝 Example 1 - Đồng bộ Document Title và Lưu vào LocalStorage

```jsx
import { useState, useEffect } from "react";

export function CounterWithTitle() {
  const [count, setCount] = useState(() => {
    // Khởi tạo state từ localStorage
    const saved = localStorage.getItem("app_count");
    return saved ? Number(saved) : 0;
  });

  // Effect 1: Đổi Document Title mỗi khi count thay đổi
  useEffect(() => {
    document.title = `Số lần click: ${count}`;
  }, [count]);

  // Effect 2: Lưu count vào LocalStorage mỗi khi count thay đổi
  useEffect(() => {
    localStorage.setItem("app_count", count.toString());
  }, [count]);

  return (
    <div className="box">
      <h2>Bạn đã click {count} lần</h2>
      <button onClick={() => setCount(prev => prev + 1)}>+ Click me</button>
    </div>
  );
}
```

---

## 📝 Example 2 - Lắng nghe sự kiện Window Resize với Cleanup Function

```jsx
import { useState, useEffect } from "react";

export function WindowSizeTracker() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Đăng ký event listener trên window
    window.addEventListener("resize", handleResize);
    console.log("Đã đăng ký Event Listener resize");

    // ✅ BẮT BUỘC: Cleanup function hủy bỏ listener khi unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      console.log("Đã dọn dẹp Event Listener resize");
    };
  }, []); // Mảng rỗng = chỉ đăng ký 1 lần khi mount

  return (
    <div className="tracker-card">
      <h3>Kích thước màn hình hiện tại: {windowWidth}px</h3>
      <p>{windowWidth < 768 ? "📱 Giao diện Mobile" : "💻 Giao diện Desktop"}</p>
    </div>
  );
}
```

---

## 📝 Example 3 - Tải dữ liệu từ API và Hủy Request với `AbortController`

```jsx
import { useState, useEffect } from "react";

export function CourseDetailFetcher({ courseId }) {
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    async function fetchCourseDetail() {
      try {
        const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${courseId}`, {
          signal: controller.signal // Gắn signal hủy
        });
        const data = await response.json();
        setCourse(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Lỗi tải dữ liệu:", err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchCourseDetail();

    // Cleanup: Hủy request cũ nếu courseId thay đổi hoặc component unmount
    return () => {
      controller.abort();
    };
  }, [courseId]); // Chạy lại mỗi khi courseId đổi

  if (isLoading) return <div>⏳ Đang tải chi tiết khóa học...</div>;
  if (!course) return <div>Không có dữ liệu!</div>;

  return (
    <div className="detail-card">
      <h2>{course.title}</h2>
      <p>{course.body}</p>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Không quên mảng phụ thuộc (Dependency Array):** Nếu bạn không truyền dependency array, `useEffect` sẽ chạy sau **tất cả** các lần render. Nếu trong `useEffect` có lệnh `setState`, nó sẽ gây ra **Vòng lặp vô tận (Infinite Re-render Loop)** làm treo ứng dụng!
2. **Khai báo đầy đủ các biến phụ thuộc:** Bất kỳ biến State hoặc Prop nào được sử dụng bên trong callback của `useEffect` đều bắt buộc phải được khai báo trong mảng phụ thuộc `[deps]`.

---

## ❌ Common Mistakes

### Sai 1 - Tạo vòng lặp vô tận do update State trong `useEffect` mà thiếu Dependency Array
```jsx
// ❌ Thảm họa: Component render -> Effect chạy -> setState -> Component re-render -> Effect chạy tiếp...
useEffect(() => {
  setCount(count + 1); 
}); 

// ✅ Khắc phục: Khai báo mảng phụ thuộc đúng
useEffect(() => {
  setCount(count + 1);
}, []); // Hoặc điều kiện cụ thể
```

### Sai 2 - Quên dọn dẹp Timer (`setInterval`) gây rò rỉ bộ nhớ
```jsx
useEffect(() => {
  const timer = setInterval(() => console.log("Tick"), 1000);
  // ❌ Quên return () => clearInterval(timer); -> Timer vẫn tiếp tục chạy ngầm vĩnh viễn cả sau khi component unmount!
}, []);
```

---

## 📚 Summary

- **`useEffect`** dùng để thực hiện các Side Effects (API calls, DOM mutation, Timers) sau khi render.
- **Dependency Array** kiểm soát thời điểm Effect chạy lại: `no deps` (mọi render), `[]` (1 lần khi mount), `[a, b]` (khi `a` hoặc `b` đổi).
- Trả về một **Cleanup Function** trong `useEffect` để hủy bỏ listener, timer hoặc request không còn dùng tới.

---

## 📝 Quiz

### Question 1
Thời điểm nào callback bên trong `useEffect(fn, [])` (với mảng phụ thuộc rỗng) sẽ được thi hành?

A. Trước khi Component render  
B. Đúng 1 lần duy nhất sau khi Component hoàn tất lượt Render đầu tiên (Mounting)  
C. Sau mỗi lần State thay đổi  
D. Mỗi khi người dùng cuộn chuột  

**Answer: B**

---

### Question 2
Hàm Cleanup Function (`return () => {}`) bên trong `useEffect` được tự động gọi vào thời điểm nào?

A. Ngay khi trang web khởi chạy  
B. Ngay trước khi Effect chạy lại ở lượt re-render tiếp theo hoặc khi Component bị Unmount khỏi giao diện  
C. Khi trình duyệt tải xong file CSS  
D. Khi có lỗi JavaScript xảy ra  

**Answer: B**

---

### Question 3
Điều gì sẽ xảy ra nếu bạn gọi `setState` bên trong `useEffect` mà không truyền mảng phụ thuộc (Dependency Array)?

A. Ứng dụng chạy mượt hơn  
B. Gây ra vòng lặp Re-render vô tận (Infinite Loop) khiến trang web bị đóng băng  
C. State sẽ bị xóa khỏi bộ nhớ  
D. Trình duyệt tự động chuyển hướng trang  

**Answer: B**
