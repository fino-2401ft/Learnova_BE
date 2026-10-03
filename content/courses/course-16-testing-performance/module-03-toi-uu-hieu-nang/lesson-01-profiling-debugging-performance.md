---
id: testing-performance-m3-l1
course: Testing, Quality Assurance & Performance Optimization
module: Tối ưu hiệu năng
title: Performance Profiling & React DevTools
order: 1
difficulty: Advanced
estimatedTime: 240
---
# Performance Profiling & React DevTools

## 🎯 Learning Objectives

Sau bài học này, bạn me:
- Phân tích nguyên nhân gây ra hiện tượng trễ lag giao diện do **Re-render thừa (Wasted Re-renders)**.
- Sử dụng công cụ **React DevTools Profiler** để ghi lại (Record) và phân tích biểu đồ Flamegraph / Rank chart.
- Bật cờ **"Highlight updates when components render"** để phát hiện tức thì các phần tử bị re-render liên tục.
- Nhúng Component **`<Profiler id="..." onRender={...}>`** của React để đo đạc thời gian render thực tế ở môi trường code.
- Nhận biết và khắc phục các nguyên nhân re-render phổ biến: Khởi tạo Object/Function inline, thiếu `React.memo`, và Prop Drilling.
- Phân tích chỉ số **Long Tasks** (> 50ms) và tối ưu hóaMain Thread.

---

## 📖 Definition

### 1. Nguyên Nhân Gây Ra Hiện Tượng "Wasted Re-render" Trong React

Một trong những vấn đề hiệu năng phổ biến nhất trong các ứng dụng React là hiện tượng **Re-render thừa (Wasted Re-render)**:
- Một Component cha re-render vì State của nó thay đổi.
- Mặc định, **TẤT CẢ** các Component con trực thuộc nó cũng bắt buộc phải re-render lại, bất kể Props của Component con có bị thay đổi hay không!
- Nếu Component con là một danh sách chứa 500 phần tử phức tạp, việc re-render thừa này sẽ làm đơ Main Thread của trình duyệt trong vài trăm mili giây (Long Task).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   LUỒNG LAN TRUYỀN RE-RENDER MẶC ĐỊNH IN REACT          │
└────────────────────────────────────────────────────────────────────────┘

 [ Parent Component (State đổi) ] ───( Kích hoạt Re-render )───┐
                                                                │
     ┌───────────────────────────┬──────────────────────────────┴┐
     ▼                           ▼                               ▼
 [ Child 1 ] (Re-render)    [ Child 2 ] (Re-render)     [ Child 3 ] (Re-render)
 (Dù Props KHÔNG ĐỔI!)      (Dù Props KHÔNG ĐỔI!)       (Dù Props KHÔNG ĐỔI!)
```

---

## 2. Công Cụ React DevTools Profiler

Công cụ **React DevTools Profiler** (Tab "Profiler" trong Chrome DevTools):
1. **Flamegraph Chart:** Hiển thị cây Component theo từng commit. Màu **xám** nghĩa là Component không render; màu **vàng/cam** nghĩa là Component tốn nhiều thời gian render nhất.
2. **Ranked Chart:** Sắp xếp danh sách các Component theo thứ tự thời gian thi hành giảm dần.
3. **Why did this render?:** Hiển thị lý do chính xác tại sao Component bị render (do `props changed`, `state changed`, hay `parent re-rendered`).

---

## 💻 Syntax

### React `<Profiler>` API Blueprint
```tsx
import { Profiler, ProfilerOnRenderCallback } from "react";

const onRenderCallback: ProfilerOnRenderCallback = (
  id, // ID của Profiler tree
  phase, // "mount" hoặc "update"
  actualDuration, // Thời gian render commit hiện tại (ms)
  baseDuration, // Thời gian ước tính nếu không có memoization
  startTime,
  commitTime
) => {
  console.log(`[PROFILER ${id}] Phase: ${phase} | Duration: ${actualDuration}ms`);
};

export function MeasuredApp() {
  return (
    <Profiler id="CourseCatalogTree" onRender={onRenderCallback}>
      <CourseCatalog />
    </Profiler>
  );
}
```

---

## 📝 Example 1 - Đo Đạc Hiệu Năng Render Bằng React `<Profiler>` API

```tsx
// src/components/PerformanceMeasuredList.tsx
import React, { Profiler, ProfilerOnRenderCallback, useState } from "react";

export function PerformanceMeasuredList() {
  const [items, setItems] = useState<string[]>([]);
  const [text, setText] = useState("");

  // Hàm callback đo đạc thời gian render của React Profiler
  const handleRenderMetrics: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration
  ) => {
    // Chỉ ghi log nếu thời gian render vượt quá 16ms (1 frame @ 60fps)
    if (actualDuration > 16) {
      console.warn(
        `⚠️ [PERFORMANCE ALERT] Tree "${id}" (${phase}) tốn ${actualDuration.toFixed(2)}ms (Base: ${baseDuration.toFixed(2)}ms)`
      );
    }
  };

  const handleAddItem = () => {
    if (!text) return;
    setItems((prev) => [...prev, `${text} #${prev.length + 1}`]);
    setText("");
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4 border rounded-2xl bg-white shadow-sm">
      <h3 className="font-bold text-lg">Đo Đạc Hiệu Năng Render</h3>

      <div className="flex space-x-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập tên mục..."
          className="flex-1 border p-2 rounded text-sm"
        />
        <button onClick={handleAddItem} className="bg-blue-600 text-white px-3 py-2 rounded font-medium text-sm">
          + Thêm
        </button>
      </div>

      {/* Bọc danh sách trong <Profiler> để đo đạc chính xác thời gian render */}
      <Profiler id="ItemListProfiler" onRender={handleRenderMetrics}>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={idx} className="p-2 bg-slate-50 border rounded text-xs">
              {item}
            </div>
          ))}
        </div>
      </Profiler>
    </div>
  );
}
```

---

## 📝 Example 2 - Phát Hiện & Khắc Phục Lỗi Truyền Function / Object Inline Làm Phá Hỏng `React.memo`

```tsx
// ❌ SAI: Khởi tạo Object và Function Inline ở mỗi lượt render -> Làm phá hỏng React.memo của MemoizedChild!
function BadParent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {/* Object { color: 'red' } và arrow function () => {} luôn tạo địa chỉ ô nhớ MỚI -> Child luôn bị RE-RENDER! */}
      <MemoizedChild config={{ color: "red" }} onClick={() => console.log("click")} />
    </div>
  );
}

// ✅ ĐÚNG CHUẨN OPTIMIZED: Dùng useMemo và useCallback để bảo toàn địa chỉ ô nhớ
function GoodParent() {
  const [count, setCount] = useState(0);

  // Bảo toàn địa chỉ Object
  const config = useMemo(() => ({ color: "red" }), []);

  // Bảo toàn địa chỉ Function
  const handleClick = useCallback(() => {
    console.log("click");
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {/* MemoizedChild KHÔNG BỊ RE-RENDER KHI COUNT THAY ĐỔI! */}
      <MemoizedChild config={config} onClick={handleClick} />
    </div>
  );
}
```

---

## 📝 Example 3 - Phân Tích Chỉ Số Long Tasks Với Performance Observer API

```typescript
// src/utils/performanceMonitor.ts

export function initLongTaskMonitor() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  // Lắng nghe các Long Tasks (Những tác vụ chiếm dụng Main Thread > 50ms gây đơ lag)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        console.warn(
          `🔴 [LONG TASK DETECTED] Tác vụ chiếm dụng Main Thread trong ${entry.duration.toFixed(2)}ms!`,
          entry
        );
      }
    }
  });

  try {
    observer.observe({ entryTypes: ["longtask"] });
  } catch (e) {
    // Trình duyệt không hỗ trợ longtask entry type
  }
}
```

---

## ⚠️ Notes

1. **Bật Cờ "Highlight updates when components render":** Trong Cài đặt của React DevTools, hãy bật cờ này. Mỗi khi một Component re-render, trình duyệt sẽ tự động vẽ một khung hình nhật màu xanh/vàng nhấp nháy xung quanh phần tử đó, giúp bạn phát hiện ngay các vùng bị re-render liên tục.

---

## ❌ Common Mistakes

### Sai 1 - Đo đạc hiệu năng ứng dụng ở chế độ React Development Mode
React ở chế độ Development Mode bổ sung rất nhiều kiểm tra cảnh báo và code debug ngầm, khiến thời gian render chậm hơn từ 2 đến 8 lần so với thực tế. Hãy luôn đo đạc hiệu năng trên bản **Production Build (`npm run build` & `npm run preview`)**.

---

## 📚 Summary

- **Wasted Re-renders** xảy ra khi Component con bị re-render thừa dù Props không hề thay đổi.
- Dùng **React DevTools Profiler** để ghi lại và phân tích biểu đồ Flamegraph / Ranked Chart.
- Bật **Highlight updates** để phát hiện các vùng nhấp nháy render thừa.
- Sử dụng **`useMemo`** và **`useCallback`** để giữ nguyên địa chỉ ô nhớ của Object/Function khi truyền vào `React.memo`.
- Dùng thẻ **`<Profiler>`** để đo đạc thời gian `actualDuration` của cây Component.
- Đo đạc chỉ số **Long Tasks** (> 50ms) trên Main Thread.

---

## 📝 Quiz

### Question 1
Hiện tượng "Wasted Re-render" trong React được định nghĩa như thế nào?

A. Khi ứng dụng bị dính virus  
B. Khi một Component con bị bắt buộc re-render lại chỉ vì Component cha của nó re-render, mặc dù Props truyền vào Component con hoàn toàn KHÔNG THAY ĐỔI  
C. Khi file CSS bị lỗi  
D. Cả A và C  

**Explanation:**  
Mặc định trong React, khi Component cha re-render, tất cả các Component con trực thuộc nó cũng sẽ bị re-render theo, bất kể Props của con có đổi hay không. Nếu Component con đắt đỏ, đây chính là hiện tượng Wasted Re-render gây trễ lag.

**Answer: B**

---

### Question 2
Trong công cụ React DevTools Profiler, biểu đồ Flamegraph hiển thị các Component tốn nhiều thời gian render nhất trong lượt commit bằng tông màu nổi bật nào?

A. Màu xanh lá cây  
B. Màu vàng / da cam (Màu càng đậm nghĩa là thời gian render càng tốn nhiều ms)  
C. Màu xám  
D. Màu trắng  

**Explanation:**  
Trong biểu đồ Flamegraph của React DevTools, màu xám nghĩa là Component không render, màu xanh nhạt nghĩa là render rất nhanh, và các tông màu Vàng/Cam đậm chỉ ra các Component tốn thời gian render lâu nhất.

**Answer: B**

---

### Question 3
Một Long Task (Tác vụ kéo dài gây đóng băng Main Thread trình duyệt và trễ phản hồi thao tác người dùng) được định nghĩa có thời gian thực thi vượt quá bao nhiêu mili giây?

A. > 5ms  
B. > 50ms  
C. > 500ms  
D. > 5000ms  

**Explanation:**  
Theo tiêu chuẩn W3C và Core Web Vitals, bất kỳ tác vụ JavaScript nào chiếm dụng Main Thread liên tục vượt quá **50ms** đều được coi là một Long Task, gây ra tình trạng giật lag giao diện (Input Delay).

**Answer: B**
