---
id: styling-ui-m3-l1
course: Styling, CSS Systems & UI Component Libraries
module: Design system và khả năng tiếp cận
title: Accessible (A11y) Design Systems
order: 1
difficulty: Intermediate
estimatedTime: 240
---
# Accessible (A11y) Design Systems

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Giải thích tầm quan trọng của tiêu chuẩn Khả năng Truy cập Web **A11y (Web Accessibility)** theo hướng dẫn **WCAG 2.1 (Web Content Accessibility Guidelines)**.
- Phân tích và đáp ứng chỉ số **Tỷ lệ Tương phản Màu sắc (Color Contrast Ratio)** đạt chuẩn WCAG Level AA (tối thiểu 4.5:1).
- Làm chủ hệ thống **Thẻ Semantic HTML5** và các thuộc tính bổ trợ **ARIA Roles, States, and Properties**.
- Xây dựng hệ thống điều khiển hoàn toàn bằng Bàn phím (**Keyboard Navigation & Focus Management**).
- Thiết kế hiệu ứng chỉ báo phím bấm **Visible Focus Rings (`focus-visible`)**.
- Kiểm thử tự động khả năng truy cập với công cụ **axe-core** và trình đọc màn hình **Screen Readers (NVDA / VoiceOver)**.

---

## 📖 Definition

### 1. Khái Niệm Accessibility (A11y) Là Gì?

**Accessibility (viết tắt là A11y)** là việc thiết kế trang web sao cho **TẤT CẢ MỌI NGƯỜI** — bao gồm người bị suy giảm thị lực, khiếm thị, khiếm thính, rối loạn khả năng vận động, hoặc chỉ có thể dùng bàn phím mà không dùng chuột — đều có thể truy cập, hiểu và tương tác với trang web một cách bình đẳng.

Theo tiêu chuẩn quốc tế **WCAG 2.1 Level AA**, một Design System đạt chuẩn A11y phải tuân thủ 4 nguyên tắc (POUR):
1. **Perceivable (Có thể Nhận biết):** Nội dung phải hiển thị rõ ràng, độ tương phản chữ và nền tối thiểu **4.5:1** cho văn bản thường.
2. **Operable (Có thể Thao tác):** Mọi chức năng (nút bấm, modal, form) phải thao tác được bằng bàn phím (Phím `Tab`, `Enter`, `Space`, `Esc`, Mũi tên `↑↓←→`).
3. **Understandable (Có thể Hiểu):** Giao diện hoạt động dự đoán được và các ô input có nhãn thông báo lỗi rõ ràng.
4. **Robust (Vững chắc):** Mã nguồn tương thích tốt với các công cụ hỗ trợ người khuyết tật (Screen Readers như VoiceOver, NVDA, JAWS).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   4 NGUYÊN TẮC CỐT LÕI CỦA TIÊU CHUẨN WCAG (POUR)       │
└────────────────────────────────────────────────────────────────────────┘

  [ P ] Perceivable      👉 Tương phản chữ ≥ 4.5:1, Alt text cho ảnh
  [ O ] Operable         👉 Thao tác 100% bằng Keyboard (Phím Tab / Focus Trap)
  [ U ] Understandable   👉 Nhãn Form & Error Message rõ ràng
  [ R ] Robust           👉 ARIA Roles & Screen Reader Friendly
```

---

## 2. Quản Lý Tiêu Điểm Bàn Phím (Keyboard Focus Management & Focus Trap)

Khi một Hộp thoại Modal mở ra trên màn hình:
- **Focus Trap (Bẫy Tiêu Điểm):** Con trỏ bàn phím (Focus) không được phép chạy lọt ra các nút phía sau màn hình mờ. Khi người dùng nhấn `Tab`, focus chỉ được phép di chuyển tuần hoàn bên trong Modal.
- Khi đóng Modal: Con trỏ bàn phím phải tự động nhảy quay trở lại đúng Nút bấm đã kích hoạt Modal trước đó.

---

## 💻 Syntax

### Accessible Component Attributes Pattern
```tsx
// Nút bấm Accessible đầy đủ ARIA và Keyboard Focus
<button
  type="button"
  aria-expanded={isOpen}
  aria-controls="dropdown-menu-1"
  aria-label="Đóng mở Menu Quản Lý"
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
>
  Menu
</button>
```

---

## 📝 Example 1 - Bảng Màu Đạt Chuẩn Tỷ Lệ Tương Phản WCAG Level AA (Contrast Ratio ≥ 4.5:1)

```css
/* src/styles/accessible-colors.css */

/* ❌ KHÔNG ĐẠT CHUẨN WCAG AA (Tỷ lệ 2.1:1 - Chữ mờ người mắt yếu không đọc được) */
.bad-text {
  background-color: #ffffff;
  color: #94a3b8; /* Slate-400 trên nền Trắng -> THẤT BẠI A11Y! */
}

/* ✅ ĐẠT CHUẨN WCAG LEVEL AA (Tỷ lệ 7.2:1 - Cực kỳ sắc nét) */
.accessible-text-light {
  background-color: #ffffff;
  color: #1e293b; /* Slate-800 trên nền Trắng -> ĐẠT CHUẨN AA & AAA! */
}

/* ✅ ĐẠT CHUẨN WCAG LEVEL AA Ở DARK MODE (Tỷ lệ 9.5:1) */
.accessible-text-dark {
  background-color: #0f172a; /* Slate-900 */
  color: #f8fafc; /* Slate-50 -> ĐẠT CHUẨN! */
}

/* Focus Ring Nổi Bật Dành Cho Người Dùng Bàn Phím */
.focus-ring {
  outline: none;
}
.focus-ring:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

---

## 📝 Example 2 - Modal Dialog Đạt Chuẩn Accessible Với Focus Trap & Keyboard Navigation

```tsx
// src/components/AccessibleModal.tsx
import React, { useEffect, useRef } from "react";

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AccessibleModal({ isOpen, onClose, title, children }: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 1. Lưu lại phần tử đang được focus trước khi mở Modal
      previousFocusRef.current = document.activeElement as HTMLElement;

      // 2. Chuyển focus vào bên trong Modal ngay lập tức
      modalRef.current?.focus();

      // 3. Lắng nghe phím Esc để đóng Modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        // 4. Trả lại Focus về đúng vị trí nút cũ khi đóng Modal!
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Container */}
      <div
        ref={modalRef}
        tabIndex={-1} // Cho phép thẻ div nhận focus qua JS
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 focus-visible:outline-none"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            ✕
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
```

---

## 📝 Example 3 - Accessible Form Input Với `aria-describedby` Cho Error Messages

```tsx
// src/components/AccessibleInput.tsx
import React, { useId } from "react";

interface AccessibleInputProps extends React.ComponentPropsWithoutRef<"input"> {
  label: string;
  error?: string;
  hintText?: string;
}

export function AccessibleInput({ label, error, hintText, className = "", ...props }: AccessibleInputProps) {
  // Tạo ID độc nhất ngầm cho Screen Reader liên kết đúng nhãn và câu thông báo
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1 w-full">
      <label htmlFor={inputId} className="block text-sm font-bold text-slate-800 dark:text-slate-200">
        {label}
      </label>

      {hintText && (
        <p id={hintId} className="text-xs text-slate-500">
          {hintText}
        </p>
      )}

      <input
        id={inputId}
        aria-invalid={!!error}
        // Thẻ Screen Reader tự động đọc câu thông báo lỗi hoặc câu gợi ý khi focus!
        aria-describedby={error ? errorId : hintText ? hintId : undefined}
        className={`w-full border p-2.5 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
          error ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-600"
        } focus:outline-none focus:ring-2 focus:ring-offset-1 ${className}`}
        {...props}
      />

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400 font-semibold flex items-center">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Không Tắt Vòng Chỉ Báo Focus (`outline: none`):** Tuyệt đối không bao giờ viết CSS `*:focus { outline: none; }` mà không cung cấp một vòng chỉ báo thay thế. Việc này khiến người dùng bàn phím hoàn toàn mù hướng không biết mình đang đứng ở nút bấm nào. Hãy luôn dùng `focus-visible:ring-2`.

---

## ❌ Common Mistakes

### Sai 1 - Dùng thẻ `<div>` làm Nút bấm mà không bổ sung `role="button"` và `tabIndex={0}`
```tsx
// ❌ SAI TAI HẠI: Người dùng bàn phím KHÔNG THỂ TAB VÀO NÚT NÀY và Screen Reader không đọc được!
<div onClick={handleClick}>Bấm vào đây</div>

// ✅ ĐÚNG CHUẨN A11Y: Sử dụng thẻ semantic HTML <button>
<button type="button" onClick={handleClick}>Bấm vào đây</button>
```

---

## 📚 Summary

- **WCAG 2.1 Level AA** yêu cầu Tỷ lệ tương phản chữ và nền tối thiểu **4.5:1**.
- Mọi chức năng phải thao tác được 100% bằng **Bàn phím (Keyboard Navigation)**.
- Sử dụng **Semantic HTML5** (`<button>`, `<main>`, `<nav>`) thay vì lạm dụng `<div>`.
- Liên kết nhãn và thông báo lỗi bằng **`aria-describedby`** và **`aria-invalid`**.
- Luôn hiển thị đường viền tiêu điểm nổi bật bằng **`focus-visible`**.

---

## 📝 Quiz

### Question 1
Tỷ lệ tương phản màu sắc (Color Contrast Ratio) tối thiểu được yêu cầu theo tiêu chuẩn WCAG 2.1 Level AA cho văn bản kích thước thông thường là bao nhiêu?

A. 2:1  
B. 4.5:1  
C. 10:1  
D. 1:1  

**Explanation:**  
Tiêu chuẩn WCAG 2.1 Level AA quy định văn bản thông thường (nhỏ hơn 18pt) phải đạt tỷ lệ tương phản tối thiểu 4.5:1 so với màu nền để đảm bảo người có thị lực kém vẫn có thể đọc được dễ dàng.

**Answer: B**

---

### Question 2
Hành động nào trong CSS bị coi là vi phạm nghiêm trọng khả năng truy cập (A11y) dành cho người dùng điều khiển bằng Bàn phím?

A. Tăng kích thước chữ  
B. Xóa bỏ hoàn toàn chỉ báo tiêu điểm `outline: none` trên các nút bấm mà không cung cấp chỉ báo `focus-visible` thay thế  
C. Dùng màu xanh dương  
D. Bật Dark Mode  

**Explanation:**  
Khi xóa bỏ `outline: none` mà không có vòng `focus-visible` thay thế, người dùng điều hướng bằng phím `Tab` sẽ hoàn toàn "mù hướng" vì không thể nhìn thấy con trỏ tiêu điểm đang đứng ở phần tử nào trên màn hình.

**Answer: B**

---

### Question 3
Thuộc tính ARIA nào được sử dụng để liên kết một ô nhập liệu `<input>` với một thẻ `<p>` chứa thông báo lỗi, giúp trình đọc màn hình (Screen Reader) tự động đọc câu thông báo lỗi đó khi ô input được tiêu điểm?

A. `aria-label`  
B. `aria-describedby`  
C. `aria-hidden`  
D. `aria-expanded`  

**Explanation:**  
Thuộc tính `aria-describedby="error-id"` cho phép các trình đọc màn hình (Screen Readers) đọc bổ sung mô tả hoặc câu thông báo lỗi từ thẻ có id trùng khớp ngay sau khi người dùng di chuyển tiêu điểm vào ô input đó.

**Answer: B**
