---
id: styling-ui-m2-l2
course: Styling, CSS Systems & UI Component Libraries
module: Thư viện UI và hiệu ứng
title: UI Animation with Framer Motion
order: 2
difficulty: Intermediate
estimatedTime: 240
---
# UI Animation with Framer Motion

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích ưu điểm vượt trội của **Framer Motion** khi tạo chuyển động hoạt hình (Animations & Micro-interactions) trong React.
- Sử dụng các thẻ mở rộng **`motion`** (`motion.div`, `motion.button`).
- Định nghĩa các trạng thái chuyển động với **`initial`**, **`animate`**, và **`exit`**.
- Xử lý chuyển động khi Component bị xóa khỏi DOM với **`<AnimatePresence />`**.
- Cấu hình hiệu ứng mượt mượt bằng **Variants**, **Transition Types (Spring, Tween)**.
- Xây dựng hiệu ứng chuyển trang mượt mượt (Page Transitions) và kéo thả danh sách.

---

## 📖 Definition

### 1. Tại Sao Chọn Framer Motion Cho React Animations?

Viết hiệu ứng chuyển động bằng CSS thuần (`@keyframes` hoặc `transition`) trong React bộc lộ một hạn chế rất lớn: **Khi một Component unmount (bị xóa khỏi DOM), nó biến mất ngay lập tức trong 0ms**, khiến hiệu ứng biến mất từ từ (Fade out / Slide out) trong CSS thuần **KHÔNG THỂ NÀO THỰC HIỆN ĐƯỢC** nếu không dùng thư viện bổ trợ.

**Framer Motion** là thư viện Animation số 1 thế giới cho React:
- Cú pháp khai báo dạng Declarative cực kỳ tự nhiên: `<motion.div animate={{ opacity: 1 }} />`.
- **`<AnimatePresence />`**: Cho phép giữ Component lại trên DOM cho đến khi hiệu ứng `exit` chạy xong hoàn toàn rồi mới unmount.
- **Physics-based Spring Animations:** Hiệu ứng nảy chân thật mô phỏng vật lý lò xo trong thực tế.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CƠ CHẾ HOẠT ĐỘNG CỦA ANIMATEPRESENCE                 │
└────────────────────────────────────────────────────────────────────────┘

 [ Unmount State Triggered ] ───> [ <AnimatePresence> Giữ Component trên DOM ]
                                                  │
                                                  ▼
                                     [ Thực Thi Hiệu Ứng `exit` ]
                                                  │
                                                  ▼
                                  [ Xóa Component Khỏi DOM! ]
```

---

## 2. Khái Niệm Variants Trong Framer Motion

Khi có nhiều phần tử lồng nhau (như danh sách 10 bài viết xuất hiện lần lượt):
Viết prop `animate={{ opacity: 1 }}` ở từng phần tử sẽ làm mã nguồn cực kỳ lộn xộn.

**Variants** cho phép bạn định nghĩa các trạng thái chuyển động thành các đối tượng JS gom nhóm:
```javascript
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 } // Phần tử con xuất hiện cách nhau 0.1s
  }
};
```

---

## 💻 Syntax

### Framer Motion Basic Blueprint
```tsx
import { motion, AnimatePresence } from "framer-motion";

export function FadeBox({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="p-4 bg-blue-600 text-white rounded-xl"
        >
          Nội dung có hiệu ứng mượt mượt!
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 📝 Example 1 - Danh Sách Bài Học Xuất Hiện Lần Lượt (Staggered Animation) Với Variants

```tsx
// src/components/StaggeredLessonList.tsx
import React from "react";
import { motion } from "framer-motion";

// 1. Container Variant quản lý hiệu ứng nối đuôi staggerChildren
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12, // Mỗi item con xuất hiện trễ hơn item trước 0.12s
      delayChildren: 0.1
    }
  }
};

// 2. Item Variant cho từng thẻ dòng
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const lessons = [
  { id: "1", title: "Bài 1: Giới thiệu Framer Motion", time: "15 phút" },
  { id: "2", title: "Bài 2: Chuyển động với AnimatePresence", time: "20 phút" },
  { id: "3", title: "Bài 3: Sử dụng Spring Physics", time: "18 phút" },
  { id: "4", title: "Bài 4: Staggered List Animations", time: "25 phút" }
];

export function StaggeredLessonList() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-md mx-auto space-y-3 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md"
    >
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Lộ Trình Học Animations</h3>

      {lessons.map((lesson) => (
        <motion.div
          key={lesson.id}
          variants={itemVariants}
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center cursor-pointer transition-colors hover:border-brand-500"
        >
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{lesson.title}</span>
          <span className="text-xs text-slate-400 font-medium">{lesson.time}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

---

## 📝 Example 2 - Modal Dialog AnimatePresence Với Hiệu Ứng Bật Lên Lò Xo Chân Thật (Spring Physics)

```tsx
// src/components/SpringModal.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SpringModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8 text-center">
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl shadow-lg shadow-brand-500/25 transition-all"
      >
        ✨ Mở Hộp Thoại Spring Modal
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay mờ dần */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog nảy lò xo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 50 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25 // Độ nảy vật lý
              }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">🎉 Thông Báo Chúc Mừng!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Bạn đã hoàn thành xuất sắc 80 bài học của lộ trình trở thành Lập trình viên Frontend React chuyên nghiệp!
              </p>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm"
                >
                  Đóng Thông Báo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 📝 Example 3 - Tab Navigation Với Hiệu Ứng Thanh Gạch Chân Chạy Theo Dấu Vết (`layoutId`)

```tsx
// src/components/AnimatedTabs.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";

const tabs = ["Tổng quan", "Bài học", "Thảo luận", "Tài nguyên"];

export function AnimatedTabs() {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="flex space-x-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`relative px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab ? "text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          {/* layoutId="active_indicator" giúp thanh gạch chân trượt mượt mượt giữa các tab! */}
          {activeTab === tab && (
            <motion.div
              layoutId="active_indicator"
              className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-sm -z-10"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          {tab}
        </button>
      ))}
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Bắt Bắt Phải Có Prop `key` Duy Nhất Khi Dùng `<AnimatePresence>`:** Bên trong `<AnimatePresence>`, các phần tử trực tiếp bắt buộc phải có thuộc tính `key` riêng biệt (ví dụ `<motion.div key={item.id} />`) để Framer Motion theo dõi và kích hoạt hiệu ứng `exit` chuẩn xác khi `key` thay đổi.

---

## ❌ Common Mistakes

### Sai 1 - Đặt `<AnimatePresence>` bên trong câu lệnh điều kiện `{isOpen && ...}`
```tsx
// ❌ SAI TAI HẠI: AnimatePresence bị unmount cùng lúc với Modal -> Hiệu ứng exit KHÔNG BAO GIỜ CHẠY!
{isOpen && (
  <AnimatePresence>
    <motion.div exit={{ opacity: 0 }} />
  </AnimatePresence>
)}

// ✅ ĐÚNG CHUẨN FRAMER MOTION:
<AnimatePresence>
  {isOpen && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>
```

---

## 📚 Summary

- **Framer Motion** hỗ trợ tạo hiệu ứng chuyển động mượt mượt dạng Declarative bằng thẻ **`motion`**.
- **`<AnimatePresence />`** giữ phần tử trên DOM cho đến khi hiệu ứng **`exit`** hoàn tất.
- **Variants** gom nhóm các trạng thái chuyển động và hỗ trợ hiệu ứng nối đuôi **`staggerChildren`**.
- Hỗ trợ **Spring Physics** (Vật lý lò xo) cho chuyển động nảy chân thật.
- Sử dụng **`layoutId`** để tạo hiệu ứng thanh chỉ báo trượt mượt mượt giữa các phần tử.

---

## 📝 Quiz

### Question 1
Thẻ bọc nào của Framer Motion bắt buộc phải được sử dụng để giữ phần tử trên DOM cho đến khi hiệu ứng `exit` (Fade out / Slide out) chạy xong hoàn toàn trước khi unmount khỏi cây React DOM?

A. `<AnimateContainer />`  
B. `<AnimatePresence />`  
C. `<MotionScope />`  
D. `<TransitionGroup />`  

**Explanation:**  
`<AnimatePresence />` theo dõi các con trực tiếp của nó. Khi một phần tử bị gỡ khỏi cây React Component, `<AnimatePresence />` hoãn việc gỡ DOM cho đến khi hiệu ứng `exit` khai báo trên `<motion.div>` chạy xong hoàn toàn.

**Answer: B**

---

### Question 2
Thuộc tính nào của Framer Motion được truyền vào đối tượng `transition` để kích hoạt mô hình chuyển động vật lý lò xo nảy chân thực thay cho các đường cong thời gian Tween tuyến tính?

A. `type: "spring"`  
B. `type: "bounce"`  
C. `type: "elastic"`  
D. `type: "gravity"`  

**Explanation:**  
Cấu hình `transition={{ type: "spring", stiffness: 300, damping: 25 }}` áp dụng mô hình mô phỏng lò xo vật lý trong thực tế, giúp các nút bấm hay modal có độ nảy tự nhiên và chân thật.

**Answer: A**

---

### Question 3
Thuộc tính đặc biệt nào của thẻ `<motion.div layoutId="...">` cho phép Framer Motion tự động tính toán vị trí và trượt mượt mượt phần tử giao diện giữa các vị trí khác nhau (ví dụ thanh chỉ báo tab đang chọn)?

A. `magicId`  
B. `layoutId`  
C. `animateId`  
D. `sharedKey`  

**Explanation:**  
Thuộc tính `layoutId` cho phép 2 phần tử ở hai lượt render khác nhau chia sẻ chung một nhận diện khung hình. Framer Motion sẽ tự động nội suy tọa độ và thực hiện hiệu ứng chuyển động trượt mượt mượt giữa chúng.

**Answer: B**
