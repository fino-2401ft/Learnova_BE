---
id: react-hooks-patterns-m3-l1
course: React Hooks & Patterns Nâng Cao
module: Hook nâng cao và mẫu component
title: Advanced Hooks: useImperativeHandle, useLayoutEffect, useId
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Advanced Hooks: useImperativeHandle, useLayoutEffect, useId

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân biệt sự khác nhau về thời điểm thi hành giữa **`useLayoutEffect`** và `useEffect`.
- Khắc phục hiện tượng giật giật màn hình (UI Flicker) khi đo đạc kích thước DOM bằng `useLayoutEffect`.
- Sử dụng **`forwardRef`** kết hợp **`useImperativeHandle`** để tùy biến các phương thức phơi ra ngoài cho Component cha.
- Tạo các định danh ID duy nhất tương thích với Server-Side Rendering (SSR) bằng **`useId`**.
- Xây dựng các UI Component thư viện chuyên nghiệp (như Custom Input, Modal, Drawer).

---

## 📖 Definition

### 1. `useLayoutEffect` vs `useEffect`
Cả hai Hook này có cú pháp hoàn toàn giống hệt nhau, nhưng khác nhau ở **thời điểm thi hành**:

- **`useEffect` (Bất đồng bộ):** Chạy **SAU KHI** trình duyệt đã vẽ xong giao diện (Paint). Giúp tránh làm nghẽn luồng vẽ UI, thích hợp cho 99% tác vụ (gọi API, event listener).
- **`useLayoutEffect` (Đồng bộ):** Chạy **TRƯỚC KHI** trình duyệt kịp vẽ giao diện ra màn hình (sau khi tính DOM nhưng trước Paint). Dùng khi bạn cần đo đạc vị trí/kích thước DOM và thực hiện thay đổi giao diện ngay lập tức để tránh người dùng nhìn thấy màn hình bị chớp/giật (UI Flicker).

### 2. `forwardRef` & `useImperativeHandle`
Mặc định, bạn không thể truyền `ref` vào một Function Component con.

- **`forwardRef`:** Cho phép một Component con nhận `ref` từ Component cha.
- **`useImperativeHandle`:** Giới hạn và tùy chỉnh chính xác các phương thức/thuộc tính mà Component con phơi ra ngoài cho `ref` của cha (thay vì phơi ra toàn bộ DOM node).

### 3. Hook `useId()` (React 18+)
`useId` sinh ra một chuỗi ID duy nhất bền vững xuyên suốt cả ở phía Server lẫn Client. Nó dùng để liên kết thẻ `<label htmlFor={id}>` và `<input id={id}>` cho các Form Component tái sử dụng mà không lo trùng lặp ID khi xuất hiện nhiều lần trên cùng 1 trang.

---

## 💻 Syntax

### forwardRef & useImperativeHandle Pattern
```jsx
import { forwardRef, useImperativeHandle, useRef } from "react";

export const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef(null);

  // Chỉ phơi ra hàm focus() và clear() cho cha
  useImperativeHandle(ref, () => ({
    focusInput: () => inputRef.current.focus(),
    clearInput: () => { inputRef.current.value = ""; }
  }));

  return <input ref={inputRef} {...props} />;
});
```

---

## 📝 Example 1 - Sửa lỗi giật giao diện (UI Flicker) với `useLayoutEffect`

```jsx
import { useState, useLayoutEffect, useRef } from "react";

export function TooltipTooltipDemo() {
  const [show, setShow] = useState(false);
  const [top, setTop] = useState(0);
  const buttonRef = useRef(null);

  // ✅ Dùng useLayoutEffect để đo đạc và tính toán vị trí TRƯỚC KHI trình duyệt vẽ ra màn hình
  useLayoutEffect(() => {
    if (show && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Đặt vị trí Tooltip nằm ngay phía trên nút bấm
      setTop(rect.top - 40);
    }
  }, [show]);

  return (
    <div style={{ padding: "100px" }}>
      <button ref={buttonRef} onClick={() => setShow(prev => !prev)}>
        Rê chuột / Click vào tôi
      </button>

      {show && (
        <div style={{ position: "fixed", top: `${top}px`, backgroundColor: "#333", color: "#fff", padding: "6px" }}>
          📌 Nội dung Tooltip hiển thị mượt mà không bị nảy!
        </div>
      )}
    </div>
  );
}
```

---

## 📝 Example 2 - Sử dụng `forwardRef` & `useImperativeHandle` tạo Custom Video Player Component

```jsx
import { useRef, forwardRef, useImperativeHandle } from "react";

// Component con phơi ra các API điều khiển Video tùy chỉnh
const CustomVideoPlayer = forwardRef((props, ref) => {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    playVideo: () => videoRef.current.play(),
    pauseVideo: () => videoRef.current.pause(),
    restartVideo: () => {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }));

  return <video ref={videoRef} src={props.src} width="300" />;
});

// Component cha gọi các lệnh điều khiển
export function ParentVideoController() {
  const playerRef = useRef(null);

  return (
    <div>
      <CustomVideoPlayer ref={playerRef} src="https://www.w3schools.com/html/mov_bbb.mp4" />
      <div>
        <button onClick={() => playerRef.current.playVideo()}>▶ Play</button>
        <button onClick={() => playerRef.current.pauseVideo()}>⏸ Pause</button>
        <button onClick={() => playerRef.current.restartVideo()}>🔄 Restart</button>
      </div>
    </div>
  );
}
```

---

## 📝 Example 3 - Sử dụng `useId` cho Form Accessible

```jsx
import { useId } from "react";

function FormField({ label, type = "text" }) {
  const id = useId(); // Sinh ra ID duy nhất chuẩn SSR (vd: ":r1:")

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} />
    </div>
  );
}

export function AccessibleForm() {
  return (
    <form>
      {/* Mỗi FormField sẽ có ID duy nhất riêng biệt mà không lo trùng lặp */}
      <FormField label="Tên người dùng" />
      <FormField label="Địa chỉ Email" type="email" />
    </form>
  );
}
```

---

## ⚠️ Notes

1. **`useLayoutEffect` có thể làm chậm hiệu năng:** Do `useLayoutEffect` chặn luồng vẽ UI của trình duyệt cho đến khi nó thực thi xong, hãy hạn chế viết các tác vụ tính toán nặng bên trong nó.
2. **Cảnh báo SSR với `useLayoutEffect`:** Trong môi trường Node.js (Next.js Server Side Rendering), `useLayoutEffect` sẽ ném cảnh báo vì phía server không có giao diện trình duyệt thực tế.

---

## ❌ Common Mistakes

### Sai 1 - Lạm dụng `useImperativeHandle` phá vỡ tư duy Declarative của React
Chỉ sử dụng `useImperativeHandle` cho các thao tác lệnh trực tiếp không thể tránh khỏi (như focus input, scroll, play media). Tránh dùng nó để thay thế luồng truyền Props/State chuẩn của React.

---

## 📚 Summary

- **`useLayoutEffect`** chạy đồng bộ trước khi trình duyệt Paint, chuyên dùng đo đạc DOM ngăn giật UI.
- **`forwardRef` + `useImperativeHandle`** giúp Component con tùy biến các hàm phơi ra ngoài cho Component cha điều khiển.
- **`useId`** tạo ID duy nhất chuẩn SSR cho Accessibility Form.

---

## 📝 Quiz

### Question 1
Điểm khác biệt mấu chốt về thời điểm thi hành giữa `useLayoutEffect` và `useEffect` là gì?

A. `useLayoutEffect` chạy sau khi trình duyệt đã vẽ xong UI  
B. `useLayoutEffect` chạy đồng bộ ngay sau khi tính toán DOM nhưng TRƯỚC KHI trình duyệt kịp vẽ giao diện ra màn hình (Paint)  
C. `useLayoutEffect` chạy trước khi khởi tạo State  
D. Cả hai chạy cùng lúc  

**Answer: B**

---

### Question 2
Bộ đôi Hook/HOC nào được sử dụng để cho phép Component cha gọi các hàm điều khiển tùy biến được phơi ra từ Component con thông qua `ref`?

A. `useState` và `useEffect`  
B. `forwardRef` và `useImperativeHandle`  
C. `useContext` và `useReducer`  
D. `useMemo` và `useCallback`  

**Answer: B**

---

### Question 3
Hook `useId()` trong React 18 giải quyết bài toán nào khi xây dựng các Form Component tái sử dụng?

A. Tự động mã hóa mật khẩu  
B. Sinh ra các chuỗi ID duy nhất an toàn và đồng nhất cả ở phía Server (SSR) lẫn Client cho liên kết label và input  
C. Tự động kiểm tra định dạng Email  
D. Thay thế `useState`  

**Answer: B**
