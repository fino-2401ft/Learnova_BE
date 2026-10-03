---
id: nextjs-fullstack-m4-l2
course: Next.js, Full-stack React & Enterprise System Architecture
module: Kiến trúc và triển khai
title: Production Deployment, Vercel/Docker Setup, CDN, Caching & Security OWASP
order: 2
difficulty: Advanced
estimatedTime: 240
---
# Production Deployment, Vercel/Docker Setup, CDN, Caching & Security OWASP

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Thực hiện Triển Khai (**Production Deployment**) ứng dụng Next.js lên Vercel Cloud và hạ tầng Docker Containerize.
- Viết file **`Dockerfile` mười bước tối ưu hóa dung lượng Multi-stage Build (Standalone output)**.
- Khái quát bảo mật Frontend theo tiêu chuẩn **OWASP Top 10** (XSS, CSRF, Clickjacking, CORS, Security Headers).
- Cấu hình các **HTTP Security Headers** (`Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`).
- Quản lý mạng phân phối nội dung **CDN & Edge Caching** đạt đỉnh hiệu năng.

---

## 📖 Definition

### 1. Triển khai với Docker Multi-Stage Build & Standalone Output
Khi triển khai ứng dụng Next.js lên hạ tầng server riêng (VPS/AWS EC2/Kubernetes), file Docker mặc định có thể nặng tới 1.5GB do chứa toàn bộ `node_modules` phát triển.

Bằng cách sử dụng cấu hình **Standalone Output (`output: 'standalone'`)** trong `next.config.js` kết hợp **Docker Multi-stage Build**:
- Next.js tự động chỉ lọc đúng các file code và thư viện thực sự cần thiết để chạy Production.
- Kích thước Docker Image được nén gọn từ **1.5GB xuống chỉ còn ~100MB**!

### 2. Tiêu chuẩn Bảo mật Frontend OWASP
- **Content-Security-Policy (CSP):** Ngăn chặn tấn công XSS bằng cách chỉ định chính xác các tên miền được phép nạp script/ảnh.
- **X-Frame-Options: DENY:** Ngăn chặn tấn công Clickjacking (ngăn người khác nhúng trang web của bạn vào thẻ `<iframe>` lừa đảo).
- **Strict-Transport-Security (HSTS):** Bắt buộc trình duyệt luôn sử dụng kết nối mã hóa HTTPS.

---

## 💻 Syntax

### Standalone Output Configuration (`next.config.js`)
```javascript
// next.config.js
/** @type {import('next').NextStyle} */
const nextConfig = {
  output: "standalone", // Bật chế độ đóng gói siêu nhẹ cho Docker
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

---

## 📝 Example 1 - File `Dockerfile` Multi-Stage Build Chuẩn Production cho Next.js (~100MB)

```dockerfile
# ----- STAGE 1: Dependencies -----
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ----- STAGE 2: Builder -----
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ----- STAGE 3: Runner (Siêu nhẹ) -----
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy kết quả standalone tối ưu
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

---

## 📝 Example 2 - Cấu hình Security Headers OWASP Chống XSS & Clickjacking

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on"
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-Frame-Options",
    value: "DENY" // Chống chèn <iframe> lừa đảo Clickjacking
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff" // Ngăn trình duyệt đoán sai MIME type
  },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google-analytics.com; object-src 'none';"
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
```

---

## 📝 Example 3 - Quy trình Triển Khai Sản Phẩm và Kiểm Tra Pre-flight Checklist

```text
┌──────────────────────────────────────────────────────────┐
│          CHECKLIST TRƯỚC KHU PUSH CODE LÊN PRODUCTION     │
└──────────────────────────────────────────────────────────┘
  1. [ ] Chạy `npm run lint` kiểm tra sạch sẽ lỗi mã nguồn.
  2. [ ] Chạy `tsc --noEmit` xác nhận 100% không có lỗi Type.
  3. [ ] Khai báo đầy đủ các biến môi trường Production trên Vercel / Docker.
  4. [ ] Kiểm tra các file `.env` chứa SECRET đã nằm trong `.gitignore`.
  5. [ ] Xóa bỏ toàn bộ các câu lệnh `console.log()` thừa.
  6. [ ] Đảm bảo chỉ số Core Web Vitals đạt chuẩn (LCP < 2.5s, CLS < 0.1).
```

---

## ⚠️ Notes

1. **Bảo mật biến môi trường `NEXT_PUBLIC_`:** Tất cả các biến môi trường có tiền tố `NEXT_PUBLIC_` sẽ được Next.js nhúng thẳng giá trị vào file JS gửi xuống trình duyệt. Tuyệt đối **KHÔNG BAO GIỜ** đặt API Keys bí mật hay DB Passwords vào biến có tiền tố `NEXT_PUBLIC_`.

---

## ❌ Common Mistakes

### Sai 1 - Triển khai file Docker không bật chế độ `output: 'standalone'`
Nếu không bật `output: 'standalone'`, bạn bắt buộc phải copy toàn bộ thư mục `node_modules` vào Docker Image làm dung lượng file nạp tăng vọt từ 100MB lên 1.5GB, khiến tốc độ deploy bị chậm trễ kéo dài.

---

## 📚 Summary

- **`output: 'standalone'`** trong Next.js giúp đóng gói Docker Image siêu nhẹ (~100MB).
- **Multi-Stage Build** trong Docker phân tách giai đoạn cài đặt dependencies, build và runner riêng biệt.
- Áp dụng các **Security Headers (CSP, X-Frame-Options, HSTS)** chống tấn công XSS và Clickjacking theo chuẩn OWASP.
- Phân biệt biến môi trường bí mật (Server Only) và biến công khai (`NEXT_PUBLIC_`).

---

## 📝 Quiz

### Question 1
Tùy chọn cấu hình nào trong `next.config.js` cho phép Next.js tự động gom nhóm và lọc ra chỉ những file mã nguồn cần thiết nhất để đóng gói Docker Image siêu nhẹ (~100MB)?

A. `output: 'standalone'`  
B. `build: 'docker'`  
C. `export: 'static'`  
D. `compress: true`  

**Answer: A**

---

### Question 2
Header bảo mật HTTP nào được sử dụng để ngăn chặn các trang web lừa đảo khác chèn trang web của bạn vào bên trong một thẻ `<iframe>` (Tấn công Clickjacking)?

A. `Content-Type`  
B. `X-Frame-Options: DENY`  
C. `Accept-Encoding`  
D. `Cache-Control`  

**Answer: B**

---

### Question 3
Tiền tố nào được thêm vào tên của một biến môi trường trong file `.env` khi bạn muốn cho phép mã nguồn JavaScript chạy dưới trình duyệt Client truy cập được giá trị đó?

A. `SERVER_`  
B. `NEXT_PUBLIC_`  
C. `ENV_`  
D. `SECRET_`  

**Answer: B**
