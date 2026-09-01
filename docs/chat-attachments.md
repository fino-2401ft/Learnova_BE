# Gửi ảnh / video / file trong chat

Tài liệu cho phía frontend. Phần "vì sao" của từng quyết định nằm trong comment ở
`src/modules/storage/` và `src/modules/chat/`; ở đây chỉ là hợp đồng giữa hai bên.

## Mô hình

**Một message mang đúng một file.** Gửi ba ảnh là ba message, đúng như cách Messenger
và Zalo xếp bong bóng chat. Với message đính kèm thì `content` **chính là link** của
file, còn tên/kích thước/MIME nằm trong `attachment` — vì URL kết thúc bằng UUID nên tự
nó không nói lên file tên gì.

| `messageType` | Lưu ở đâu        | Trần dung lượng | Trạng thái                     |
| ------------- | ---------------- | --------------- | ------------------------------ |
| `TEXT`        | —                | 4000 ký tự      | đang chạy                      |
| `IMAGE`       | Cloudinary       | 10 MB           | đang chạy, giao diện đã có nút |
| `VIDEO`       | Cloudinary       | 100 MB          | backend sẵn sàng, FE chưa mở   |
| `FILE`        | Supabase Storage | 25 MB           | cần bật Supabase trong `.env`  |

**Hiện tại chỉ gửi ảnh.** `VIDEO` dùng chung đường Cloudinary với ảnh nên không cần cấu
hình gì thêm — mở ở frontend là chạy. `FILE` cần ba biến `SUPABASE_*` trong `.env`; chưa
có thì bước 1 trả **503** kèm lời nhắn "Gửi file đính kèm chưa được bật trên máy chủ
này", không phải lỗi hệ thống.

Frontend **không** chọn provider, cũng không chọn `messageType` — server suy ra từ MIME
type và trả về trong bước 1. Danh sách định dạng được chấp nhận nằm trong
`src/modules/storage/attachment.policy.ts`.

`MessageDto` giờ có thêm trường `attachment`:

```jsonc
{
  "messageId": "...",
  "conversationId": "...",
  "content": "https://res.cloudinary.com/.../learnova/chat/<convId>/<uuid>.jpg",
  "messageType": "IMAGE",
  "isDeleted": false,
  "sender": { "userId": "...", "username": "...", "avatarUrl": null },
  "attachment": {
    "fileName": "so-do-lop.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 284913,
    "thumbnailUrl": "https://res.cloudinary.com/.../w_480,h_480,c_limit/..."
  }
}
```

`attachment` là `null` với message `TEXT` và với mọi message đã bị thu hồi (lúc đó
`content` cũng `null`). Message đến qua socket `message:new` có đúng shape này.

Hiển thị: dùng `thumbnailUrl` trong danh sách và khung chat, chỉ tải `content` khi người
dùng bấm mở. Với `FILE` thì `thumbnailUrl` luôn `null` — vẽ icon theo `mimeType`.

## Luồng gửi: 3 bước

Byte của file **không đi qua API này**. Trình duyệt upload thẳng lên Cloudinary hoặc
Supabase, nên server không tốn băng thông cho một video 100MB.

```
FE                          Learnova API                Cloudinary / Supabase
 │                                │                              │
 ├─ 1. POST .../sign ────────────►│                              │
 │◄──── uploadTicket + upload ────┤                              │
 │                                │                              │
 ├─ 2. upload file ───────────────┼─────────────────────────────►│
 │                                │                              │
 ├─ 3. POST .../attachments ─────►│                              │
 │      { uploadTicket }          ├─ hỏi lại file thật ─────────►│
 │◄──── MessageDto ───────────────┤                              │
```

### Bước 1 — xin chỗ đặt file

```http
POST /api/v1/conversations/:conversationId/attachments/sign
Authorization: Bearer <access token>

{ "fileName": "Báo cáo cuối kỳ.pdf", "mimeType": "application/pdf", "sizeBytes": 1048576 }
```

Trả về:

```jsonc
{
  "uploadTicket": "eyJhbGciOi...",   // giữ nguyên, nộp lại ở bước 3
  "expiresAt": "2026-09-01T10:45:00.000Z",
  "provider": "SUPABASE",
  "messageType": "FILE",
  "fileName": "Bao-cao-cuoi-ky.pdf", // đã làm sạch — hiển thị tên NÀY, không phải tên gốc
  "upload": { /* khác nhau theo provider, xem dưới */ }
}
```

Ticket sống **15 phút**. Hết hạn thì phải xin lại từ bước 1, không chữa được ở bước 3.

### Bước 2 — upload

Hai provider có hai cách. Đọc `upload.provider` để rẽ nhánh.

**Cloudinary** (`IMAGE`, `VIDEO`) — POST multipart, đúng các field này:

```js
const { uploadUrl, apiKey, timestamp, publicId, signature } = res.upload;

const form = new FormData();
form.append('file', file);
form.append('api_key', apiKey);
form.append('timestamp', String(timestamp));
form.append('public_id', publicId);
form.append('signature', signature);

await fetch(uploadUrl, { method: 'POST', body: form });
```

Không thêm field nào khác: chữ ký chỉ ký `public_id` và `timestamp`, thừa field là
Cloudinary từ chối.

**Supabase** (`FILE`) — PUT thẳng vào signed URL:

```js
const { uploadUrl } = res.upload;

await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file,
});
```

Hoặc nếu FE đã có `@supabase/supabase-js` (dùng anon key là đủ):

```js
const { path, token, bucket } = res.upload;
await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file);
```

Signed URL dùng được **một lần**. Upload hỏng giữa chừng thì quay lại bước 1.

### Bước 3 — biến upload thành message

```http
POST /api/v1/conversations/:conversationId/attachments
Authorization: Bearer <access token>

{ "uploadTicket": "eyJhbGciOi..." }
```

Chỉ có mỗi ticket. Storage key, người gửi, cuộc trò chuyện và loại file đều nằm sẵn
trong chữ ký của ticket, nên không có chỗ nào cho client trỏ vào file của người khác.

Trả về `MessageDto` (201). Message cũng được đẩy qua socket `message:new` tới mọi người
trong phòng, y như một tin nhắn chữ — không cần tự chèn vào danh sách.

## Lỗi

Tất cả theo format lỗi chung của API (`{ code, message }`).

| `code`                        | HTTP | Ý nghĩa và cách xử lý ở FE                                     |
| ----------------------------- | ---- | -------------------------------------------------------------- |
| `ATTACHMENT_TYPE_NOT_ALLOWED` | 400  | Định dạng không nằm trong allowlist. Báo ngay ở bước 1.        |
| `ATTACHMENT_TOO_LARGE`        | 400  | Vượt trần. `message` có ghi rõ mức trần.                        |
| `UPLOAD_TICKET_INVALID`       | 400  | Ticket sai hoặc hết hạn → cho người dùng chọn lại file.         |
| `UPLOAD_INCOMPLETE`           | 400  | Bước 3 gọi mà file chưa lên tới nơi → thử upload lại.           |
| `NOT_A_PARTICIPANT`           | 403  | Không thuộc cuộc trò chuyện này.                                |
| `DB_UNIQUE_VIOLATION`         | 409  | Nộp lại một ticket đã dùng rồi. Message đã tồn tại, đừng gửi nữa. |
| `SERVICE_UNAVAILABLE`         | 503  | Gửi file thường nhưng Supabase chưa bật. Ảnh/video không dính.   |

Rate limit: 30 lần/phút cho mỗi bước.

## Thu hồi

`DELETE /api/v1/messages/:messageId` không đổi. Với message đính kèm, nó xoá luôn file
trên Cloudinary/Supabase — hàng trong DB ở lại làm bia mộ, `content` và `attachment`
thành `null` với mọi người đọc.

Một lưu ý đã kiểm chứng bằng thực nghiệm: file biến mất khỏi Cloudinary ngay lập tức
(Admin API trả 404), nhưng **URL trực tiếp vẫn xem được thêm vài phút** vì các node CDN
còn giữ bản cache — lệnh `invalidate` chạy bất đồng bộ. Trong ứng dụng thì không ai thấy
điều này: bong bóng chat thành bia mộ ngay với tất cả mọi người. Nó chỉ có ý nghĩa với
người đã kịp sao chép URL gốc ra ngoài trước khi tin bị thu hồi.

## Ghi chú vận hành

**Bucket Supabase phải là PUBLIC.** URL được lưu thẳng vào `messages.content` và đọc lại
nhiều tháng sau, trong khi mọi signed URL của Supabase đều có hạn — bucket private sẽ để
lại một database đầy link chết. Tính khó đoán đến từ UUID trong đường dẫn, giống hệt cách
Cloudinary phục vụ ảnh. Muốn siết hơn thì đổi bucket sang private rồi thêm một endpoint
kiểm tra quyền và 302 sang signed URL sinh tại chỗ — nhưng khi đó `<img src>` cũng phải
đi qua endpoint đó.

**File mồ côi.** Ai đó có thể upload xong rồi không bao giờ gọi bước 3 (đóng tab, mất
mạng). File nằm lại mà không có message nào trỏ tới. Với quy mô hiện tại thì bỏ qua được;
lúc cần dọn, một job định kỳ đối chiếu `messages.storage_key` với danh sách object trong
bucket là đủ.
