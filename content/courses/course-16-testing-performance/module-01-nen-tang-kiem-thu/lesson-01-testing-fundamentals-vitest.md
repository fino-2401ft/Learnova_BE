---
id: testing-performance-m1-l1
course: Testing, Quality Assurance & Performance Optimization
module: Nền tảng kiểm thử
title: Testing Fundamentals & Vitest Setup
order: 1
difficulty: Intermediate
estimatedTime: 240
---
# Testing Fundamentals & Vitest Setup

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích mô hình **Kim Tự Tháp Kiểm Thử (Testing Pyramid)** bao gồm Unit Tests, Integration Tests, và E2E Tests.
- Khởi tạo và cấu hình môi trường kiểm thử siêu tốc **Vitest** trong các dự án React / Vite.
- Áp dụng mẫu thiết kế kiểm thử **AAA Pattern (Arrange - Act - Assert)** chuẩn mực.
- Làm chủ các câu lệnh khẳng định **Expect Assertions** (`toBe`, `toEqual`, `toContain`, `toThrow`).
- Tạo và giả lập các hàm callback với **Mock Functions (`vi.fn()`, `vi.spyOn()`)**.
- Cấu hình môi trường DOM giả lập **`jsdom`** hoặc **`happy-dom`**.

---

## 📖 Definition

### 1. Mô Hình Kim Tự Tháp Kiểm Thử (Testing Pyramid)

Trong kỹ thuật phần mềm doanh nghiệp, một chiến lược kiểm thử cân bằng được biểu diễn qua Kim Tự Tháp Kiểm Thử 3 tầng:

1. **Unit Tests (Kiểm thử đơn vị - Tầng đáy rộng nhất):**
   - Kiểm thử từng hàm, từng utility function nhỏ lẻ một cách cô lập hoàn toàn.
   - *Đặc điểm:* Chạy cực kỳ nhanh (vài mili giây), chi phí thấp, phủ rộng 70-80% mã nguồn.
2. **Integration Tests (Kiểm thử tích hợp - Tầng giữa):**
   - Kiểm thử sự phối hợp tương tác giữa nhiều Component, Hooks, và State Management với nhau.
   - *Đặc điểm:* Đảm bảo các mảnh ghép của hệ thống hoạt động ăn khớp.
3. **E2E Tests (End-to-End Tests - Tầng đỉnh):**
   - Bật trình duyệt thật (Chromium, Firefox) và giả lập thao tác bấm nút, gõ phím như người dùng thật.
   - *Đặc điểm:* Chạy chậm, chi phí cao, nhưng mang lại độ tin cậy tuyệt đối cho các luồng quan trọng (như Thanh toán, Đăng ký).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   KIM TỰ THÁP KIỂM THỬ (TESTING PYRAMID)               │
└────────────────────────────────────────────────────────────────────────┘

                         / \
                        / E2E \          👈 Chạy chậm, độ tin cậy cao nhất (Playwright)
                       /-------\
                      / INTEGR. \        👈 Kiểm thử tích hợp Component & State (RTL)
                     /-----------\
                    /  UNIT TESTS \      👈 Chạy cực nhanh, số lượng nhiều nhất (Vitest)
                   /---------------\
```

---

## 2. Tại Sao Chọn Vitest Thay Cho Jest Trong Dự Án Vite?

Trong các dự án sử dụng Vite, việc dùng **Jest** thường gây ra nhiều phiền phức về cấu hình Babel, ES Modules và tốc độ chạy chậm.

**Vitest** là công cụ kiểm thử thế hệ mới được thiết kế riêng cho Vite:
- Sử dụng chung cấu hình và Pipeline chuyển đổi mã của Vite (`vite.config.ts`).
- Chạy siêu tốc nhờ kiến trúc đa luồng Worker Threads và HMR (Hot Module Replacement) cho Tests.
- Cú pháp tương thích 100% với Jest (dễ dàng dùng `describe`, `it`, `expect`).

---

## 3. Mẫu Thiết Kế Kiểm Thử AAA (Arrange - Act - Assert Pattern)

Mọi bài Test Unit/Integration chuẩn mực đều được cấu trúc theo 3 bước AAA:
1. **Arrange (Chuẩn bị):** Khởi tạo dữ liệu đầu vào, khởi tạo biến và mock functions.
2. **Act (Hành động):** Kích hoạt hàm hoặc hành động cần kiểm thử.
3. **Assert (Khẳng định):** Kiểm tra xem kết quả đầu ra có đúng như kỳ vọng hay không.

---

## 💻 Syntax

### Vitest Standard Test Blueprint
```typescript
import { describe, it, expect, vi } from "vitest";

describe("Math Utility Functions", () => {
  it("nên tính tổng 2 số chính xác", () => {
    // 1. Arrange
    const num1 = 10;
    const num2 = 20;

    // 2. Act
    const result = num1 + num2;

    // 3. Assert
    expect(result).toBe(30);
  });
});
```

---

## 📝 Example 1 - Cấu Hình Vitest Và Environment `jsdom` Trong `vite.config.ts`

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,                // Cho phép dùng describe, it, expect mà không cần import
    environment: "jsdom",         // Giả lập môi trường DOM trình duyệt cho React
    setupFiles: "./src/test/setup.ts", // File cấu hình mở rộng
    coverage: {
      provider: "v8",             // Báo cáo độ phủ mã nguồn (Code Coverage)
      reporter: ["text", "json", "html"]
    }
  }
});
```

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom"; // Mở rộng các matchers như toBeInTheDocument()
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Tự động dọn dẹp DOM sau mỗi bài test
afterEach(() => {
  cleanup();
});
```

---

## 📝 Example 2 - Viết Unit Test Cho Hàm Xử Lý Giỏ Hàng Theo Chuẩn AAA Pattern (`cartUtils.test.ts`)

```typescript
// src/utils/cartUtils.ts
export interface CartItem {
  id: string;
  price: number;
  quantity: number;
}

export function calculateSubtotal(items: CartItem[]): number {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function applyDiscount(subtotal: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error("Phần trăm giảm giá phải nằm trong khoảng từ 0 đến 100");
  }
  const discountAmount = (subtotal * discountPercent) / 100;
  return Math.max(0, subtotal - discountAmount);
}
```

```typescript
// src/utils/cartUtils.test.ts
import { describe, it, expect } from "vitest";
import { calculateSubtotal, applyDiscount, CartItem } from "./cartUtils";

describe("Unit Tests: cartUtils", () => {
  describe("calculateSubtotal()", () => {
    it("nên trả về 0 khi danh sách giỏ hàng rỗng", () => {
      // Arrange
      const items: CartItem[] = [];

      // Act
      const result = calculateSubtotal(items);

      // Assert
      expect(result).toBe(0);
    });

    it("nên tính tổng tiền chính xác khi có nhiều sản phẩm", () => {
      // Arrange
      const items: CartItem[] = [
        { id: "1", price: 100000, quantity: 2 }, // 200,000
        { id: "2", price: 150000, quantity: 1 }  // 150,000
      ];

      // Act
      const result = calculateSubtotal(items);

      // Assert
      expect(result).toBe(350000);
    });
  });

  describe("applyDiscount()", () => {
    it("nên áp dụng giảm giá 20% chính xác", () => {
      // Arrange & Act
      const finalPrice = applyDiscount(100000, 20);

      // Assert
      expect(finalPrice).toBe(80000);
    });

    it("nên ném ngoại lệ khi truyền phần trăm giảm giá không hợp lệ", () => {
      // Assert ngoại lệ ném ra
      expect(() => applyDiscount(100000, 150)).toThrow("Phần trăm giảm giá phải nằm trong khoảng từ 0 đến 100");
    });
  });
});
```

---

## 📝 Example 3 - Kiểm Thử Callback Function Với Mock Functions (`vi.fn()`)

```typescript
// src/services/notificationService.ts
export function triggerNotification(userId: string, callback: (msg: string) => void) {
  if (!userId) return;
  const message = `Thông báo mới dành cho user: ${userId}`;
  callback(message);
}
```

```typescript
// src/services/notificationService.test.ts
import { describe, it, expect, vi } from "vitest";
import { triggerNotification } from "./notificationService";

describe("Mock Function Tests: triggerNotification", () => {
  it("nên gọi callback 1 lần với nội dung thông báo chính xác", () => {
    // Arrange: Tạo một Mock Function giả lập
    const mockCallback = vi.fn();

    // Act
    triggerNotification("USR-101", mockCallback);

    // Assert
    expect(mockCallback).toHaveBeenCalledTimes(1); // Kiểm tra hàm được gọi đúng 1 lần
    expect(mockCallback).toHaveBeenCalledWith("Thông báo mới dành cho user: USR-101"); // Kiểm tra tham số truyền vào
  });

  it("KHÔNG ĐƯỢC gọi callback nếu userId bị rỗng", () => {
    // Arrange
    const mockCallback = vi.fn();

    // Act
    triggerNotification("", mockCallback);

    // Assert
    expect(mockCallback).not.toHaveBeenCalled(); // Khẳng định hàm không bao giờ được gọi
  });
});
```

---

## ⚠️ Notes

1. **Phân Biên `toBe` và `toEqual` trong Assertions:**
   - **`toBe(val)`**: Sử dụng phép so sánh strict equality `===` (Dùng cho các kiểu dữ liệu nguyên thủy: `number`, `string`, `boolean`).
   - **`toEqual(obj)`**: So sánh sâu giá trị các thuộc tính bên trong Objects và Arrays. Nếu so sánh 2 Object `{ a: 1 }` và `{ a: 1 }`, `toBe` sẽ **THẤT BẠI** (do khác địa chỉ ô nhớ), còn `toEqual` sẽ **THÀNH CÔNG**!

---

## ❌ Common Mistakes

### Sai 1 - Dùng `toBe()` để so sánh 2 đối tượng Object hoặc Array
```typescript
// ❌ SAI: Phép so sánh === thất bại do 2 Object nằm ở 2 ô nhớ khác nhau!
expect({ name: "Long" }).toBe({ name: "Long" }); 

// ✅ ĐÚNG CHUẨN: Dùng toEqual() để so sánh giá trị bên trong Object
expect({ name: "Long" }).toEqual({ name: "Long" });
```

---

## 📚 Summary

- **Kim Tự Tháp Kiểm Thử** bao gồm Unit Tests (nhiều nhất, nhanh nhất), Integration Tests, và E2E Tests.
- **Vitest** là công cụ kiểm thử siêu tốc tích hợp hoàn hảo với Vite.
- Viết bài test chuẩn mực theo mô hình **AAA Pattern (Arrange - Act - Assert)**.
- Dùng **`toBe()`** cho primitives và **`toEqual()`** cho Objects/Arrays.
- Dùng **`vi.fn()`** để giả lập và kiểm tra sự kiện gọi callback functions.

---

## 📝 Quiz

### Question 1
Mô hình Kim Tự Tháp Kiểm Thử (Testing Pyramid) khuyến nghị tỷ lệ số lượng bài test giữa 3 tầng (Unit Tests, Integration Tests, E2E Tests) nên được phân bổ như thế nào?

A. E2E Tests nhiều nhất, Unit Tests ít nhất  
B. Unit Tests chiếm số lượng nhiều nhất ở tầng đáy (chạy nhanh nhất), tiếp theo là Integration Tests, và E2E Tests chiếm số lượng ít nhất ở đỉnh pyramid  
C. Cả 3 tầng có số lượng bằng nhau  
D. Không cần viết Unit Tests  

**Explanation:**  
Unit Tests chạy cực kỳ nhanh và tốn ít chi phí maintenance, do đó nó chiếm tầng đáy rộng nhất của Kim Tự Tháp. E2E Tests chạy chậm và tốn tài nguyên nhất nên chỉ tập trung kiểm thử các luồng quan trọng nhất ở đỉnh pyramid.

**Answer: B**

---

### Question 2
Sự khác nhau cốt lõi trong Vitest giữa hai câu lệnh khẳng định `expect(a).toBe(b)` và `expect(a).toEqual(b)` là gì?

A. `toBe` dùng cho String, `toEqual` dùng cho Number  
B. `toBe` sử dụng phép so sánh strict equality `===` (thích hợp cho Primitives), trong khi `toEqual` thực hiện so sánh sâu (Deep Comparison) nội dung bên trong Objects và Arrays  
C. Cả hai hoàn toàn giống nhau  
D. `toBe` chạy nhanh hơn 100 lần  

**Explanation:**  
`toBe()` so sánh địa chỉ ô nhớ (`===`), do đó 2 Object có cùng nội dung vẫn bị coi là khác nhau. `toEqual()` duyệt sâu từng thuộc tính bên trong Object/Array để so sánh giá trị thực tế.

**Answer: B**

---

### Question 3
Mẫu thiết kế kiểm thử AAA Pattern viết tắt của 3 bước thực thi chuẩn mực nào trong một bài Unit Test?

A. Always - Automatic - Action  
B. Arrange (Chuẩn bị) - Act (Hành động) - Assert (Khẳng định kết quả)  
C. Add - Apply - Accept  
D. Api - Async - Await  

**Explanation:**  
AAA Pattern (Arrange - Act - Assert) chia bài test thành 3 bước rành mạch: 1. Arrange (Chuẩn bị dữ liệu/mocks), 2. Act (Thi hành hàm cần test), 3. Assert (Khẳng định kết quả trả về đúng như kỳ vọng).

**Answer: B**
