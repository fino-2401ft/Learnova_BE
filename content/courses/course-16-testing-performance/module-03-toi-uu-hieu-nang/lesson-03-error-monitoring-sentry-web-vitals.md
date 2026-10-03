---
id: testing-performance-m3-l3
course: Testing, Quality Assurance & Performance Optimization
module: Tối ưu hiệu năng
title: Error Monitoring (Sentry) & Core Web Vitals
order: 3
difficulty: Advanced
estimatedTime: 240
---
# Error Monitoring (Sentry) & Core Web Vitals

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích và giám sát bộ 3 chỉ số hiệu năng chuẩn Google **Core Web Vitals**: **LCP (Largest Contentful Paint)**, **INP (Interaction to Next Paint)**, và **CLS (Cumulative Layout Shift)**.
- Khởi tạo và cấu hình hệ thống giám sát lỗi thời gian thực **Sentry (`@sentry/react`)**.
- Bắt và ghi nhận các lỗi giao diện không thể lường trước bằng **React Error Boundary với Sentry Integration**.
- Sử dụng thư viện **`web-vitals`** để đo đạc và gửi chỉ số trải nghiệm người dùng về máy chủ Analytics.
- Thiết lập quy trình khoanh vùng sự cố và cảnh báo tự động (**Incident Response Workflow**).
- Tối ưu hóa chỉ số CLS (dịch chuyển bố cục) với thuộc tính `aspect-ratio` và khung xương chờ (Skeleton Loaders).

---

## 📖 Definition

### 1. Bộ Chỉ Số Trải Nghiệm Người Dùng Google Core Web Vitals

Google đánh giá xếp hạng SEO và trải nghiệm thực tế người dùng của một trang web dựa trên bộ 3 chỉ số **Core Web Vitals** cốt lõi:

1. **LCP (Largest Contentful Paint - Tốc độ nạp phần tử lớn nhất):**
   - Đo thời gian hiển thị của phần tử nội dung lớn nhất trên màn hình (như Banner ảnh chính).
   - *Mục tiêu:* **$\le 2.5\text{ giây}$**.
2. **INP (Interaction to Next Paint - Độ trễ phản hồi tương tác):**
   - Thay thế cho FID cũ từ 2024. Đo độ trễ phản hồi của trang web khi người dùng click, gõ phím hoặc chạm vào màn hình.
   - *Mục tiêu:* **$\le 200\text{ mili giây}$**.
3. **CLS (Cumulative Layout Shift - Độ dịch chuyển bố cục bất ngờ):**
   - Đo mức độ giật/dịch chuyển vị trí bất ngờ của các phần tử trên màn hình khi tài nguyên (ảnh, font) đang nạp.
   - *Mục tiêu:* **$\le 0.1$**.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   BỘ BẢNG ĐIỂM CHUẨN GOOGLE CORE WEB VITALS             │
└────────────────────────────────────────────────────────────────────────┘

 [ LCP ] ─── Tốc độ nạp phần tử lớn nhất ─────> GOOD: ≤ 2.5s
 [ INP ] ─── Độ trễ phản hồi tương tác ────────> GOOD: ≤ 200ms
 [ CLS ] ─── Độ dịch chuyển bố cục ─────────────> GOOD: ≤ 0.1
```

---

## 2. Hệ Thống Giám Sát Lỗi Thời Gian Thực Sentry

Cho dù bạn có viết bao nhiêu bài test, khi ứng dụng chạy thực tế trên triệu thiết bị của người dùng, các lỗi bất ngờ (như lỗi mạng chập chờn, lỗi trình duyệt Safari cũ) vẫn sẽ xảy ra.

**Sentry** là nền tảng giám sát lỗi (Error Monitoring & APM) hàng đầu:
- Tự động bắt mọi ngoại lệ JavaScript Uncaught Exceptions và Unhandled Rejections.
- Báo cáo chính xác tên trình duyệt, hệ điều hành, địa chỉ IP, và các bước tương tác của người dùng trước khi bị lỗi (**Breadcrumbs**).
- Chụp lại dấu vết gọi hàm (Stack Trace với Source Maps) trỏ thẳng về đúng dòng code TypeScript bị lỗi.

---

## 💻 Syntax

### Sentry Initialization Blueprint
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-dsn-key@o0.ingest.sentry.io/0",
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0, // Đo đạc 100% giao dịch trên môi trường Dev
  environment: import.meta.env.MODE
});
```

---

## 📝 Example 1 - Khởi Tạo Sentry & Error Boundary Bắt Lỗi Màn Hình Chết (`src/main.tsx`)

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";

// 1. Khởi tạo Sentry SDK
Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false
    })
  ],
  tracesSampleRate: 0.2, // Ghi nhận 20% giao dịch để tiết kiệm quota
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // Quay lại video 100% các phiên bị lỗi!
  environment: import.meta.env.MODE
});

// 2. Component Fallback hiển thị khi dính lỗi màn hình trắng
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-red-600">⚠️ Đã Xảy Ra Sự Cố Không Mong Muốn!</h2>
        <p className="text-sm text-slate-600">
          Hệ thống đã tự động ghi nhận báo cáo lỗi và gửi tới đội ngũ kỹ thuật.
        </p>
        <div className="p-3 bg-red-50 text-red-800 text-xs font-mono rounded-lg break-all">
          {error.message}
        </div>
        <button
          onClick={resetError}
          className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-sm"
        >
          Thử Tải Lại Trang
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 3. Bọc toàn bộ ứng dụng trong Sentry.ErrorBoundary */}
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => <ErrorFallback error={error as Error} resetError={resetError} />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
```

---

## 📝 Example 2 - Đo Đạc Và Gửi Bộ Chỉ Số Core Web Vitals Về Analytics Server (`src/utils/vitals.ts`)

```typescript
// src/utils/vitals.ts
import { onLCP, onINP, onCLS, Metric } from "web-vitals";

// Gửi metric thu thập được về API Analytics
function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // "good" | "needs-improvement" | "poor"
    delta: metric.delta,
    id: metric.id,
    pageUrl: window.location.href
  });

  // Sử dụng navigator.sendBeacon để gửi dữ liệu ngầm không làm nghẽn trang web
  if (navigator.sendBeacon) {
    navigator.sendBeacon("https://api.educonnect.vn/api/v1/analytics/vitals", body);
  } else {
    fetch("https://api.educonnect.vn/api/v1/analytics/vitals", {
      body,
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export function reportCoreWebVitals() {
  // Lắng nghe bộ 3 chỉ số cốt lõi
  onLCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onCLS(sendToAnalytics);
}
```

---

## 📝 Example 3 - Tối Ưu Hóa Chỉ Số CLS (Cumulative Layout Shift = 0) Với Aspect Ratio & Skeleton

```tsx
// src/components/OptimizedImageCard.tsx
import React, { useState } from "react";

interface OptimizedImageCardProps {
  src: string;
  alt: string;
  title: string;
}

export function OptimizedImageCard({ src, alt, title }: OptimizedImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm max-w-sm">
      {/* 
        💡 TỐI ƯU CLS = 0: 
        Sử dụng aspect-video (16/9) giữ trước khoảng trống ô chứa ảnh TRƯỚC KHI ảnh tải xong!
        Giúp trang web KHÔNG BỊ GIẬT DỊCH CHUYỂN BỐ CỤC khi ảnh hiển thị!
      */}
      <div className="relative aspect-video bg-slate-200 dark:bg-slate-800">
        {!isLoaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-300 dark:bg-slate-700" />
        )}
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <div className="p-4">
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Upload Source Maps Lên Sentry Khi Build Production:** Khi đóng gói mã nguồn, mã JavaScript bị nén rãnh (Minified). Để Sentry có thể báo chính xác dòng lỗi trong file TypeScript gốc, bạn cần cài đặt `@sentry/vite-plugin` để tự động upload Source Maps bí mật lên Sentry Dashboard trong quy trình CI/CD.

---

## ❌ Common Mistakes

### Sai 1 - Để khung chứa ảnh không có kích thước cố định gây đẩy bố cục (CLS > 0.1)
```html
<!-- ❌ SAI: Ảnh chưa nạp có height = 0px, khi ảnh nạp xong nảy lên 300px làm đẩy toàn bộ văn bản phía dưới xuống ➔ Dính lỗi CLS nặng! -->
<img src="banner.jpg" />

<!-- ✅ ĐÚNG CHUẨN TỐI ƯU CLS = 0: -->
<div className="aspect-video">
  <img src="banner.jpg" className="w-full h-full object-cover" />
</div>
```

---

## 📚 Summary

- **Core Web Vitals** gồm 3 chỉ số cốt lõi: **LCP ($\le 2.5\text{s}$)**, **INP ($\le 200\text{ms}$)**, và **CLS ($\le 0.1$)**.
- **Sentry** bắt lỗi JavaScript Uncaught Exceptions và báo cáo Stack Trace kèm Breadcrumbs.
- Sử dụng **`Sentry.ErrorBoundary`** bọc quanh cây React DOM để bắt lỗi giao diện.
- Dùng thư viện **`web-vitals`** và **`navigator.sendBeacon`** để ghi nhận dữ liệu trải nghiệm người dùng thực tế (RUM).
- Giữ chỉ số **CLS = 0** bằng cách đặt kích thước ô chứa cố định qua **`aspect-ratio`**.

---

## 📝 Quiz

### Question 1
Bộ 3 chỉ số cốt lõi trong Google Core Web Vitals được sử dụng để đánh giá trải nghiệm người dùng thực tế bao gồm những chỉ số nào?

A. HTML, CSS, JavaScript  
B. LCP (Tốc độ nạp phần tử lớn nhất $\le 2.5\text{s}$), INP (Độ trễ phản hồi tương tác $\le 200\text{ms}$), và CLS (Độ dịch chuyển bố cục $\le 0.1$)  
C. CPU, RAM, GPU  
D. Cả A và C  

**Explanation:**  
Google Core Web Vitals gồm LCP (Largest Contentful Paint - nạp nội dung chính), INP (Interaction to Next Paint - độ nhạy tương tác thay thế FID từ 2024), và CLS (Cumulative Layout Shift - độ ổn định thị giác bố cục).

**Answer: B**

---

### Question 2
Nền tảng Sentry (`@sentry/react`) mang lại giá trị chiến lược nào cho việc quản lý chất lượng ứng dụng web trên môi trường Production?

A. Tự động mã hóa CSDL  
B. Tự động phát hiện, bắt giữ các lỗi JavaScript Uncaught Exceptions thời gian thực và báo cáo đầy đủ thông tin thiết bị, các bước thao tác (Breadcrumbs), và Stack Trace chỉ rõ dòng code bị lỗi  
C. Tự động làm cho website chạy nhanh hơn 100 lần  
D. Cả A và C  

**Explanation:**  
Sentry hoạt động như một hệ thống báo động lỗi tự động trên Production. Khi người dùng gặp sự cố crash, Sentry gửi báo cáo kèm theo thông tin trình duyệt, các sự kiện gõ/click trước đó, giúp developer sửa lỗi nhanh chóng.

**Answer: B**

---

### Question 3
Kỹ thuật CSS nào được khuyên dùng để cố định tỷ lệ khung hình cho các ô chứa hình ảnh/video, giúp ngăn chặn hiện tượng đẩy giật bố cục bất ngờ (CLS > 0.1) khi tài nguyên đang nạp?

A. `display: none`  
B. `aspect-ratio` (ví dụ `aspect-video` hoặc `aspect-square`)  
C. `position: absolute`  
D. `float: left`  

**Explanation:**  
Thiết lập `aspect-ratio` (ví dụ 16/9) giúp trình duyệt tính toán và giữ trước khung không gian cho bức ảnh ngay cả khi ảnh chưa tải về từ mạng, giữ cho vị trí các văn bản phía dưới hoàn toàn đứng yên (CLS = 0).

**Answer: B**
