---
id: testing-performance-m2-l3
course: Testing, Quality Assurance & Performance Optimization
module: Kiểm thử nâng cao
title: E2E Testing with Playwright
order: 3
difficulty: Advanced
estimatedTime: 240
---
# E2E Testing with Playwright

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Giải thích nguyên lý kiểm thử toàn trình **E2E Testing (End-to-End Testing)** và ưu thế vượt trội của **Playwright** so với Cypress/Selenium.
- Khởi tạo và cấu hình tệp **`playwright.config.ts`** hỗ trợ đa trình duyệt (Chromium, Firefox, WebKit Mobile).
- Viết kịch bản kiểm thử giả lập hành vi người dùng thật (`page.goto()`, `page.getByRole()`, `page.fill()`, `page.click()`).
- Sử dụng mô hình thiết kế **Page Object Model (POM)** giúp chuẩn hóa và tái sử dụng mã nguồn kiểm thử E2E.
- Ghi hình video, chụp ảnh màn hình thất bại (Screenshots) và theo dõi dấu vết lỗi qua **Trace Viewer**.
- Tích hợp Playwright E2E Tests vào đường ống **CI/CD GitHub Actions**.

---

## 📖 Definition

### 1. E2E Testing Và Sự Thống Trị Của Playwright

**Kiểm thử toàn trình E2E (End-to-End Testing)** kiểm thử toàn bộ hệ thống ứng dụngweb từ đầu đến cuối: Bật trình duyệt thật (Headless hoặc Headed Browser), nạp giao diện, thao tác gõ phím, bấm nút, và gọi API thực tế tới Cơ sở dữ liệu.

**Microsoft Playwright** là công cụ E2E Testing hiện đại hàng đầu thế giới hiện nay:
- **Hỗ trợ Đa Trình Duyệt Thực Sự:** Chạy song song trên Chromium (Chrome, Edge), Firefox, và WebKit (Safari iOS/macOS).
- **Auto-waiting:** Tự động chờ cho đến khi phần tử sẵn sàng (Visible, Enabled, Stable) trước khi bấm nút, loại bỏ 99% lỗi test chập chờn (Flaky Tests).
- **Tốc độ cực nhanh:** Chạy đa luồng song song (Parallel execution) với isolated browser contexts.
- **Trace Viewer:** Công cụ quay ngược thời gian xem lại từng video, mạng network, và DOM snapshot tại thời điểm test bị lỗi.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   KIẾN TRÚC PLAYWRIGHT E2E EXECUTION                   │
└────────────────────────────────────────────────────────────────────────┘

 [ Playwright Test Runner ]
            │
            ├───> [ Chromium Browser ]  ──> (Thực thi luồng Đăng nhập)
            ├───> [ Firefox Browser ]   ──> (Thực thi luồng Thanh toán)
            └───> [ WebKit Safari ]     ──> (Thực thi luồng Mobile UI)
```

---

## 2. Mô Hình Thiết Kế Page Object Model (POM)

Khi dự án E2E có hàng trăm bài test, nếu bạn viết rải rác các câu lệnh `page.locator('#email').fill(...)` ở mọi nơi, khi giao diện đổi ID ô input, bạn phải sửa ở 50 file test.

**Page Object Model (POM)** tạo ra một lớp Class đại diện cho một trang giao diện (ví dụ `LoginPage`):
- Class chứa tất cả các locator và hàm thao tác (`login(email, pass)`).
- Các bài test chỉ cần gọi hàm từ Class `LoginPage`, giúp mã nguồn cực kỳ dễ bảo trì.

---

## 💻 Syntax

### Playwright Basic Test Blueprint
```typescript
import { test, expect } from "@playwright/test";

test("nên cho phép người dùng đăng nhập thành công", async ({ page }) => {
  // 1. Truy cập URL
  await page.goto("http://localhost:5173/login");

  // 2. Điền form
  await page.getByLabel("Email:").fill("admin@educonnect.vn");
  await page.getByLabel("Mật khẩu:").fill("123456");

  // 3. Click submit
  await page.getByRole("button", { name: /đăng nhập/i }).click();

  // 4. Assert chuyển hướng sang /dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole("heading", { name: /bảng điều khiển/i })).toBeVisible();
});
```

---

## 📝 Example 1 - Cấu Hình Standard `playwright.config.ts` Đa Trình Duyệt & WebServer

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,           // Chạy các bài test song song
  forbidOnly: !!process.env.CI,  // Cấm test.only trên CI
  retries: process.env.CI ? 2 : 0, // Thử lại 2 lần trên CI nếu gặp lỗi flaky
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]], // Báo cáo dạng HTML tương tác

  use: {
    baseURL: "http://localhost:5173", // Base URL ứng dụng
    trace: "on-first-retry",          // Ghi trace khi test bị lỗi lượt 1
    screenshot: "only-on-failure",    // Tự động chụp ảnh khi test thất bại
    video: "retain-on-failure"        // Quay video khi test thất bại
  },

  /* Cấu hình chạy trên nhiều loại trình duyệt */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] } // Giả lập iPhone 13 Safari
    }
  ],

  /* Tự động bật dev server trước khi chạy E2E test */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI
  }
});
```

---

## 📝 Example 2 - Áp Dụng Mô Hình Page Object Model (POM) Cho Trang Đăng Nhập (`e2e/pages/LoginPage.ts`)

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/mật khẩu/i);
    this.submitButton = page.getByRole("button", { name: /đăng nhập/i });
    this.errorMessage = page.locator(".error-toast");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

```typescript
// e2e/auth.spec.ts (Sử dụng Page Object Model trong bài test)
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("E2E Test: Luồng Đăng Nhập Hệ Thống", () => {
  test("nên báo lỗi khi đăng nhập với mật khẩu sai", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login("admin@educonnect.vn", "sai-mat-khau");

    await loginPage.expectErrorMessage("Thông tin đăng nhập không chính xác");
  });

  test("nên điều hướng thành công vào /dashboard khi thông tin chuẩn", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login("admin@educonnect.vn", "123456");

    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

---

## 📝 Example 3 - E2E Test Luồng Thêm Khóa Học Mới Và Kiểm Tra Dữ Liệu Tự Động Renders

```typescript
// e2e/create-course.spec.ts
import { test, expect } from "@playwright/test";

test.describe("E2E Test: Luồng Tạo Khóa Học Mới", () => {
  test.beforeEach(async ({ page }) => {
    // Đăng nhập trước mỗi bài test
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@educonnect.vn");
    await page.getByLabel(/mật khẩu/i).fill("123456");
    await page.getByRole("button", { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("nên cho phép admin tạo khóa học mới và hiển thị ngay trên danh sách", async ({ page }) => {
    const courseTitle = `Khóa học Playwright E2E #${Date.now()}`;

    // 1. Mở Modal Thêm mới
    await page.getByRole("button", { name: /\+ tạo khóa học/i }).click();

    // 2. Điền Form
    await page.getByLabel(/tên khóa học/i).fill(courseTitle);
    await page.getByLabel(/giá tiền/i).fill("990000");

    // 3. Submit Form
    await page.getByRole("button", { name: /lưu khóa học/i }).click();

    // 4. Khẳng định khóa học mới vừa tạo hiển thị thành công trên UI!
    await expect(page.getByText(courseTitle)).toBeVisible();
  });
});
```

---

## ⚠️ Notes

1. **Ưu Tiên Sử Dụng Playwright Locators Cho A11y:** Luôn dùng `page.getByRole()`, `page.getByLabel()`, `page.getByText()` thay vì dùng CSS selector cứng `page.locator('.btn-primary > div')`.

---

## ❌ Common Mistakes

### Sai 1 - Viết `page.waitForTimeout(5000)` cứng (Hardcoded Delays)
```typescript
// ❌ SAI TAI HẠI: Tự ngắt cứng 5 giây làm bài test chạy cực kỳ chậm và dễ bị flaky!
await page.waitForTimeout(5000); 

// ✅ ĐÚNG CHUẨN PLAYWRIGHT: Tận dụng Auto-waiting của expect()
await expect(page.getByText("Nạp xong")).toBeVisible();
```

---

## 📚 Summary

- **Playwright** hỗ trợ E2E Testing đa trình duyệt (Chromium, Firefox, Safari WebKit) với khả năng **Auto-waiting** phòng chống flaky test.
- Sử dụng mô hình **Page Object Model (POM)** để đóng gói locators và thao tác trang.
- Tự động bật dev server qua cờ **`webServer`** trong config.
- Không dùng `waitForTimeout()`, hãy tận dụng **`expect(locator).toBeVisible()`**.
- Tích hợp công cụ **Trace Viewer** để xem lại video và snapshot khi test bị lỗi.

---

## 📝 Quiz

### Question 1
Tính năng **Auto-waiting** của Playwright mang lại lợi ích đột phá nào giúp khắc phục nhược điểm của các công cụ E2E cũ như Selenium?

A. Tự động mã hóa mật khẩu  
B. Tự động chờ đợi cho đến khi phần tử sẵn sàng (Visible, Enabled, Stable) trước khi thực hiện bấm nút hay điền form, loại bỏ 99% hiện tượng test bị lỗi chập chờn (Flaky Tests)  
C. Tự động tắt máy tính  
D. Cả A và C  

**Explanation:**  
Auto-waiting trong Playwright tự động kiểm tra hàng loạt điều kiện (Element Visible, Enabled, Receiving Events) trước khi thực hiện thao tác click/fill, giúp bài test chạy ổn định mà không cần viết các lệnh chờ thủ công.

**Answer: B**

---

### Question 2
Mô hình kiến trúc **Page Object Model (POM)** trong kiểm thử E2E đóng vai trò gì trong việc bảo trì mã nguồn?

A. Đóng gói các Locators và thao tác của từng trang vào một Class riêng biệt, giúp khi giao diện HTML thay đổi bạn chỉ cần sửa ở 1 nơi duy nhất thay vì sửa rải rác ở hàng trăm file test  
B. Tự động đổi màu giao diện  
C. Tự động nạp CSDL  
D. Cả B và C  

**Explanation:**  
Page Object Model giúp phân tách giữa Logic bài Test và Cấu trúc UI của Trang. Khi ID hay class ô input thay đổi, bạn chỉ cần sửa trong file Page Class mà không làm ảnh hưởng đến kịch bản bài test.

**Answer: A**

---

### Question 3
Công cụ nào của Playwright cho phép bạn xem lại video ghi hình, lịch sử request mạng (Network), và ảnh chụp DOM Snapshot tại chính xác thời điểm bài test bị ném lỗi trên môi trường CI/CD?

A. Playwright Inspector  
B. Playwright Trace Viewer  
C. Playwright Generator  
D. Playwright Console  

**Explanation:**  
Playwright Trace Viewer là công cụ debug E2E cực kỳ mạnh mẽ. Nó ghi lại toàn bộ dấu vết của lượt chạy test (video, network log, console errors, DOM snapshot), cho phép bạn tua lại từng bước để tìm chính xác nguyên nhân gây lỗi.

**Answer: B**
