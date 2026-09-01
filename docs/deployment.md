# Đưa Learnova lên internet (miễn phí, không cần mua tên miền)

Ba dịch vụ, ba subdomain miễn phí, không tốn đồng nào và không cần tên miền riêng:

| Phần | Dịch vụ | Địa chỉ nhận được |
| ---- | ------- | ----------------- |
| Frontend (React/Vite) | Vercel | `learnova.vercel.app` |
| Backend (NestJS) | Render — Web Service | `learnova-api.onrender.com` |
| PostgreSQL | Neon | (chuỗi kết nối, không lộ ra ngoài) |
| Ảnh chat | Cloudinary | đã dùng sẵn, không đổi gì |

> Hạn mức của các gói miễn phí thay đổi khá thường xuyên. Cấu trúc bên dưới thì ổn
> định, nhưng con số cụ thể (dung lượng, thời gian ngủ) nên xem lại trên trang chính
> chủ trước khi bắt tay làm.

## Vì sao là ba dịch vụ này

**Backend KHÔNG deploy được lên Vercel.** Đây là ràng buộc cứng, không phải sở thích:
chat dùng Socket.IO, tức là một kết nối WebSocket mở liên tục. Serverless function
sinh ra rồi chết theo từng request — nó không giữ được kết nối nào. Render Web Service
là tiến trình Node chạy thật, nên WebSocket sống.

**Database phải là dịch vụ riêng.** Render có Postgres miễn phí nhưng bản miễn phí có
hạn sử dụng rồi bị xoá; Neon không đặt hạn đó. Mất database giữa kỳ thực tập là cái giá
quá đắt cho việc tiết kiệm một bước đăng ký.

**Frontend là file tĩnh** sau khi build, nên host nào cũng được. Vercel hay Cloudflare
Pages đều ổn; hướng dẫn này dùng Vercel.

---

## Bốn cái bẫy trong chính repo này

Đọc trước khi bắt đầu — cả bốn đều làm deploy thất bại theo kiểu khó đoán.

### 1. `NODE_ENV=production` sẽ làm HỎNG bước build

Đây là bẫy khó chịu nhất. `npm install` **bỏ qua devDependencies** khi thấy
`NODE_ENV=production`. Mà trong repo này, những thứ sau đều nằm ở devDependencies:

- `@nestjs/cli` → lệnh `nest build` biến mất
- `typescript`, `prisma`, `ts-node`
- `dotenv` → mà `prisma.config.ts` lại `import 'dotenv/config'` ở dòng đầu

Triệu chứng: build đổ với `nest: not found` hoặc `Cannot find module 'dotenv'`, trong
khi ở máy bạn mọi thứ chạy hoàn hảo.

**Cách xử lý:** ép cài cả devDependencies trong build command:

```
npm ci --include=dev && npx prisma generate && npm run build
```

`--include=dev` là phần bắt buộc, không phải cho chắc.

### 2. Nhưng `NODE_ENV=production` lại BẮT BUỘC lúc chạy

Cookie refresh token được đặt ở [auth.controller.ts](../src/modules/auth/auth.controller.ts):

```ts
secure: this.app.isProduction,
sameSite: this.app.isProduction ? 'none' : 'lax',
```

Frontend ở `vercel.app` còn backend ở `onrender.com` — hai site khác nhau. Trình duyệt
chỉ gửi cookie qua lại giữa hai site khi cookie có `SameSite=None; Secure`. Thiếu
`NODE_ENV=production`, cookie thành `SameSite=Lax` và **đăng nhập sẽ hỏng một cách im
lặng**: login trả 200, nhưng lần refresh kế tiếp là 401 và người dùng bị đá ra.

Nghĩa là: `NODE_ENV=production` phải có lúc chạy, và build command phải tự chống đỡ nó
bằng `--include=dev` như mục 1.

### 3. Vercel cần rewrite cho SPA

App dùng React Router. Vào thẳng `learnova.vercel.app/tin-nhan/<id>` (hoặc chỉ cần F5 ở
trang đó) sẽ ra **404** nếu không có rewrite, vì Vercel đi tìm một file tên `tin-nhan`
mà không có. Tạo `vercel.json` ở gốc thư mục frontend:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 4. `VITE_API_BASE_URL` được nhúng lúc BUILD, không phải lúc chạy

Đổi biến này trên dashboard Vercel thôi là chưa đủ — phải **build lại** thì giá trị mới
đi vào bundle. Sửa biến rồi mà app vẫn gọi `localhost:3000` thì đó là lý do.

---

## Các bước

### Bước 1 — Database trên Neon

1. Đăng ký ở neon.tech, tạo project.
2. Copy **connection string** (chọn bản có pooling), dạng:
   `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`
3. Chạy migration từ máy bạn:

```bash
cd Learnova_BE
DATABASE_URL="<chuỗi-neon>" npx prisma migrate deploy
```

4. Nạp dữ liệu mẫu (tuỳ chọn, nhưng nên có để demo):

```bash
DATABASE_URL="<chuỗi-neon>" npm run db:seed
```

Seed chạy từ máy bạn chứ không chạy trên Render — nó cần `ts-node` và chỉ nên chạy một
lần, không phải mỗi lần deploy.

### Bước 2 — Backend trên Render

Push code lên GitHub trước (repo hiện chưa phải git repo — cần `git init`).

Trên Render → **New → Web Service** → trỏ vào repo:

| Trường | Giá trị |
| ------ | ------- |
| Root Directory | thư mục chứa `Learnova_BE` |
| Runtime | Node |
| Build Command | `npm ci --include=dev && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && node dist/main` |
| Instance Type | Free |

Biến môi trường (Environment):

```
NODE_ENV=production
CORS_ORIGIN=https://<tên-app>.vercel.app
PUBLIC_BASE_URL=https://<tên-api>.onrender.com
DATABASE_URL=<chuỗi-neon>
JWT_ACCESS_SECRET=<sinh chuỗi MỚI, xem bên dưới>
JWT_ACCESS_TTL=900
REFRESH_TTL=2592000
REFRESH_COOKIE_NAME=learnova_rt
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Không đặt `PORT` — Render tự đặt, và app đã đọc `process.env.PORT` sẵn.

Sinh secret mới cho production, đừng dùng lại secret ở máy dev:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Ba biến `SUPABASE_*` cứ để trống: chỉ ảnh và video mới cần, và cả hai đi Cloudinary.
Xem [chat-attachments.md](chat-attachments.md).

### Bước 3 — Frontend trên Vercel

Thêm `vercel.json` như mục bẫy số 3, rồi trên Vercel → **Add New → Project**:

| Trường | Giá trị |
| ------ | ------- |
| Root Directory | thư mục chứa `Learnova_FE` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Biến môi trường:

```
VITE_API_BASE_URL=https://<tên-api>.onrender.com/api/v1
```

Có `/api/v1` ở cuối. Socket.IO tự lấy phần origin từ biến này (xem
`Learnova_FE/src/chat/socket.ts`) nên không cần khai riêng địa chỉ WebSocket.

### Bước 4 — Nối hai đầu

Deploy Vercel xong mới biết địa chỉ thật, nên quay lại Render sửa `CORS_ORIGIN` cho khớp
`https://<tên-app>.vercel.app`, rồi deploy lại backend. Sai một ký tự ở đây là mọi
request bị trình duyệt chặn với lỗi CORS.

---

## Kiểm tra sau khi deploy

Theo đúng thứ tự này — mỗi bước hỏng chỉ ra một nguyên nhân khác nhau:

1. `https://<api>.onrender.com/api/v1/health` trả 200 → server sống.
2. Đăng nhập trên web → nếu login được nhưng F5 phát là văng ra: cookie sai, kiểm tra
   `NODE_ENV=production` (bẫy số 2).
3. Vào thẳng `https://<app>.vercel.app/tin-nhan` rồi F5 → 404 nghĩa là thiếu
   `vercel.json` (bẫy số 3).
4. Mở một cuộc trò chuyện, gửi tin nhắn → nếu tin không tự hiện mà phải F5: WebSocket
   không nối được, kiểm tra `CORS_ORIGIN`.
5. Gửi một ảnh → kiểm tra Cloudinary.

## Điều cần biết về gói miễn phí của Render

Web service miễn phí **ngủ sau một quãng không có request**, và lần đánh thức đầu tiên
mất khoảng gần một phút. Với đồ án thì chấp nhận được, nhưng khi demo nên **mở web
trước vài phút** cho nó thức dậy — người chấm bấm vào thấy trang treo gần một phút là ấn
tượng đầu tiên rất tệ.

Socket.IO tự nối lại sau khi server ngủ dậy (`Learnova_FE/src/chat/socket.ts` đã lo
phần đó), nên không cần làm gì thêm.
