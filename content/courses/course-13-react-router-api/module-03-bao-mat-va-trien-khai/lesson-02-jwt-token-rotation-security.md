---
id: react-router-api-m3-l2
course: React Router & API Integration
module: Bảo mật và triển khai
title: JWT Token Rotation & Security
order: 2
difficulty: Advanced
estimatedTime: 240
---
# JWT Token Rotation & Security

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Phân tích cấu trúc của **JSON Web Token (JWT)** bao gồm 3 phần: Header, Payload, và Signature.
- Phân biệt sự khác nhau giữa **Access Token** (Thời gian sống ngắn: 5-15 phút) và **Refresh Token** (Thời gian sống dài: 7-30 ngày).
- Làm chủ kỹ thuật **JWT Token Rotation** giúp loại bỏ nguy cơ bị đánh cắp Token vĩnh viễn.
- Phân tích nguy cơ bảo mật tấn công **XSS (Cross-Site Scripting)** và **CSRF (Cross-Site Request Forgery)** khi lưu trữ Token trong LocalStorage vs Cookie.
- Áp dụng cơ chế lưu trữ Token an toàn nhất với **`httpOnly`, `SameSite=Strict`, `Secure` Cookies**.
- Cấu hình Axios Interceptor tự động làm mới Token ngầm (Silent Token Refresh Queue) chống tắc nghẽn race conditions khi gọi đồng thời nhiều API.

---

## 📖 Definition

### 1. Cấu Trúc JSON Web Token (JWT)

Một chuỗi JWT tiêu chuẩn có dạng `xxxx.yyyy.zzzz` bao gồm 3 phần tách biệt bởi dấu chấm:
1. **Header (Đầu):** Chứa thông tin về thuật toán mã hóa (như `HS256` hay `RS256`).
2. **Payload (Tải trọng):** Chứa dữ liệu claims thực sự (như `userId`, `role`, thời gian hết hạn `exp`). **Lưu ý: Dữ liệu này chỉ được mã hóa Base64URL, ai cũng có thể giải mã và đọc được!**
3. **Signature (Chữ ký điện tử):** Được tạo ra bởi thuật toán mã hóa kết hợp Secret Key trên Server để đảm bảo Token không bị giả mạo.

```text
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJ1c2VySWQiOiIxMDEiLCJyb2xlIjoiYWRtaW4ifQ . SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
  └─────────────────┬────────────────┘   └──────────────────┬──────────────────┘   └───────────────────┬───────────────────┘
                 HEADER                                  PAYLOAD                                 SIGNATURE
```

---

## 2. Kỹ Thuật Token Rotation (Xoay Vòng Refresh Token)

Nếu ứng dụng phát hành một Access Token có hạn dùng vĩnh viễn, khi kẻ gian đánh cắp được token này, tài khoản người dùng sẽ bị chiếm đoạt vĩnh viễn.

Mô hình **Token Rotation** giải quyết bằng 2 loại token:
- **Access Token (Hạn sống ngắn: 15 phút):** Dùng để đính kèm vào mọi request gọi API.
- **Refresh Token (Hạn sống dài: 7 ngày):** Dùng để đổi lấy Access Token mới. Khi Refresh Token được dùng để cấp Access Token mới, **Server sẽ hủy Refresh Token cũ và cấp luôn 1 Refresh Token mới độc nhất (Rotation)**. Nếu Refresh Token cũ bị kẻ gian dùng lại, Server ngay lập tức hủy toàn bộ phiên làm việc của tài khoản đó!

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   QUY TRÌNH REFRESH TOKEN ROTATION                     │
└────────────────────────────────────────────────────────────────────────┘

 [ Client ] ───( 1. HTTP Request với Access Token Hết Hạn )───> [ Server ]
                                                                     │
 [ Client ] <───( 2. Trả về Lỗi 401 Unauthorized )───────────────────┘
     │
     ├───( 3. Gửi Request /auth/refresh với Refresh Token cũ )───> [ Server ]
                                                                        │
 [ Client ] <───( 4. Trả về Access Token MỚI + Refresh Token MỚI )─────┘
```

---

## 3. So Sánh Nơi Lưu Trữ Token: LocalStorage vs HttpOnly Cookie

| Tiêu chí | LocalStorage | HttpOnly Cookie |
|---|---|---|
| **Khả năng truy cập bằng JS** | Có thể đọc qua `localStorage.getItem()` | **KHÔNG THỂ TRUY CẬP** (Chỉ Browser gửi ngầm) |
| **Nguy cơ tấn công XSS** | **CỰC KỲ NGUY HIỂM** (Mã độc JS lấy cắp dễ dàng) | **AN TOÀN 100%** (JS không thể đọc được) |
| **Nguy cơ tấn công CSRF** | An toàn khỏi CSRF | Cần thuộc tính `SameSite=Strict` |
| **Khuyến nghị Doanh Nghiệp** | Chỉ dùng cho dữ liệu công khai | **KHUYÊN DÙNG CHO REFRESH TOKEN & AUTH** |

---

## 💻 Syntax

### Axios Silent Refresh Token Queue Blueprint
```javascript
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};
```

---

## 📝 Example 1 - Giải Mã JWT Payload Không Cần Thư Viện Ở Trình Duyệt

```typescript
// src/utils/jwtHelper.ts

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  exp: number; // Expiration time (unix timestamp seconds)
}

// Giải mã chuỗi Base64URL của JWT Payload
export function parseJwt(token: string): JWTPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Kiểm tra xem Token đã hết hạn chưa (kèm buffer 10 giây)
export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime + 10; // Hết hạn hoặc sắp hết hạn trong 10s
}
```

---

## 📝 Example 2 - Cài Đặt Hàng Đợi Refresh Token Ngầm (Silent Refresh Queue) Trong Axios

```javascript
// src/services/secureApiClient.js
import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const secureApiClient = axios.create({
  baseURL: "https://api.educonnect.vn/api/v1",
  withCredentials: true // 💡 BẮT BUỘC: Cho phép tự động gửi HttpOnly Cookie!
});

secureApiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đã có 1 request khác đang refresh token -> Đẩy request này vào hàng đợi!
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return secureApiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API cấp Token mới (Refresh Token tự gửi qua HttpOnly Cookie)
        const res = await axios.post(
          "https://api.educonnect.vn/api/v1/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.accessToken;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return secureApiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default secureApiClient;
```

---

## 📝 Example 3 - Cấu Hình Secure HttpOnly Cookie Phía Node.js/Express Backend

```javascript
// server.js (Node.js Express Backend Reference)
app.post("/api/v1/auth/login", async (req, res) => {
  const { accessToken, refreshToken } = await generateTokens(user);

  // Gửi Refresh Token về trình duyệt dưới dạng HttpOnly Cookie an toàn 100% khỏi XSS!
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // 💡 Ngăn cản tuyệt đối JavaScript phía client đọc token
    secure: true,   // Chỉ gửi qua HTTPS
    sameSite: "strict", // Chống tấn công CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
  });

  // Trả Access Token về RAM cho Client
  res.json({ accessToken, user });
});
```

---

## ⚠️ Notes

1. **Tuyệt Đối Không Lưu Dữ Liệu Nhạy Cảm Trong JWT Payload:** Payload của JWT chỉ được mã hóa dạng Base64URL chứ **KHÔNG ĐƯỢC MÃ HÓA BẢO MẬT**. Bất kỳ ai cũng có thể decode và xem được thông tin bên trong. Không lưu mật khẩu hay thẻ tín dụng trong JWT Payload.

---

## ❌ Common Mistakes

### Sai 1 - Lưu trữ Refresh Token trong LocalStorage
```javascript
// ❌ SAI TAI HẠI: Lưu Refresh Token vào LocalStorage -> Kẻ gian chỉ cần chèn 1 dòng mã độc XSS là lấy cắp được vĩnh viễn tài khoản!
localStorage.setItem("refresh_token", token);

// ✅ ĐÚNG CHUẨN SECURITY DOANH NGHIỆP:
// Lưu Refresh Token trong HttpOnly Cookie do Server cấp!
```

---

## 📚 Summary

- **JWT** bao gồm 3 phần: Header, Payload (Base64), và Signature.
- **Access Token** có hạn ngắn (15 phút); **Refresh Token** có hạn dài (7 ngày) dùng để cấp lại Access Token mới.
- **JWT Token Rotation** hủy Refresh Token cũ ngay sau khi sử dụng để phòng chống tấn công sử dụng lại Token.
- Lưu Refresh Token trong **HttpOnly Cookie (`SameSite=Strict`)** bảo vệ ứng dụng 100% khỏi tấn công XSS.
- Sử dụng hàng đợi **Silent Refresh Queue** trong Axios Interceptor để xử lý mượt mượt khi nhiều API cùng báo lỗi `401`.

---

## 📝 Quiz

### Question 1
Tại sao việc lưu trữ Refresh Token trong `LocalStorage` lại bị coi là một lỗ hổng bảo mật nghiêm trọng trong các ứng dụng web doanh nghiệp?

A. Vì LocalStorage chạy chậm  
B. Vì bất kỳ mã độc JavaScript nào xuất hiện trên trang web (Tấn công XSS) đều có thể dễ dàng đọc và lấy cắp chuỗi Refresh Token trong LocalStorage  
C. Vì LocalStorage bị xóa mỗi khi đóng trình duyệt  
D. Cả A và C  

**Explanation:**  
Mã JavaScript chạy trên trang web có quyền truy cập 100% vào `localStorage`. Nếu ứng dụng bị dính lỗ hổng XSS, kẻ gian có thể đánh cắp chuỗi Refresh Token trong `localStorage` và chiếm đoạt vĩnh viễn tài khoản người dùng.

**Answer: B**

---

### Question 2
Thuộc tính nào của Cookie khiến cho mã nguồn JavaScript phía Client (như `document.cookie`) **KHÔNG THỂ NÀO TRUY CẬP HAY ĐỌC ĐƯỢC** giá trị Token, bảo vệ ứng dụng khỏi tấn công XSS?

A. `secure: true`  
B. `httpOnly: true`  
C. `sameSite: "lax"`  
D. `path: "/"`  

**Explanation:**  
Khi Cookie được Server gắn cờ `httpOnly: true`, trình duyệt sẽ ẩn hoàn toàn Cookie đó khỏi môi trường thực thi JavaScript (`document.cookie` không đọc được), chỉ có trình duyệt mới được tự động gửi Cookie này ngầm qua các HTTP Requests.

**Answer: B**

---

### Question 3
Cơ chế **JWT Token Rotation** thực hiện hành động quan trọng nào mỗi khi người dùng gửi Refresh Token lên máy chủ để xin cấp một Access Token mới?

A. Server lập tức xóa CSDL  
B. Server cấp Access Token mới đồng thời HỦY Refresh Token cũ và phát hành một Refresh Token MỚI độc nhất  
C. Server bắt người dùng nhập lại mật khẩu  
D. Server đổi màu giao diện  

**Explanation:**  
Trong mô hình Token Rotation, mỗi Refresh Token chỉ được dùng đúng 1 lần. Khi Client gửi Refresh Token cũ lên, Server hủy nó ngay lập tức và cấp lại 1 Refresh Token hoàn toàn mới, giúp phát hiện và vô hiệu hóa ngay nếu kẻ gian cố tình dùng lại Token đã lộ.

**Answer: B**
