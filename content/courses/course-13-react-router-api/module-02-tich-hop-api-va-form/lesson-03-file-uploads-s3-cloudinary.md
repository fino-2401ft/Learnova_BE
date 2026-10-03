---
id: react-router-api-m2-l3
course: React Router & API Integration
module: Tích hợp API và form
title: File Uploads, Cloudinary & S3 Integration
order: 3
difficulty: Advanced
estimatedTime: 240
---
# File Uploads, Cloudinary & S3 Integration

## 🎯 Learning Objectives

Sau bài học này, bạn me:
- Nắm vững quy trình tải tệp tin (File Uploads) từ trình duyệt React lên các dịch vụ lưu trữ đám mây **Amazon S3** và **Cloudinary**.
- Khởi tạo đối tượng **`FormData`** và cấu hình Header `Content-Type: multipart/form-data`.
- Theo dõi tiến trình tải tệp tin thời gian thực (**Upload Progress Bar**) bằng sự kiện `onUploadProgress` của Axios.
- Áp dụng kỹ thuật tải trực tiếp lên Cloud với **S3 Presigned URLs** (loại bỏ gánh nặng băng thông cho Máy chủ Backend).
- Kéo thả tệp tin (**Drag and Drop File Upload**) và xem trước ảnh xem trước (`URL.createObjectURL`).
- Validate kích thước tệp tin (Max File Size) và kiểu tập tin (MIME Types Validation) an toàn.

---

## 📖 Definition

### 1. Tại Sao Nên Tải Tệp Trực Tiếp Lên Đám Mây (Direct S3 / Cloudinary Upload)?

Trong kiến trúc ứng dụng cũ, khi người dùng tải ảnh đại diện 10MB:
1. Trình duyệt gửi file 10MB lên Server Backend của bạn.
2. Server Backend nhận file 10MB rồi lại tốn tài nguyên tải 10MB đó lên Amazon S3.

Quy trình này làm tốn gấp đôi băng thông và gây tắc nghẽn CPU của Server Backend.

Trong kiến trúc hiện đại **Direct Upload với Presigned URL**:
1. Client gửi một request cực nhẹ (vài KB) lên Server Backend xin một **Presigned URL** (Đường dẫn có chữ ký kèm hạn dùng 5 phút).
2. Server Backend tạo Presigned URL từ Amazon S3 và trả về cho Client.
3. Client dùng Presigned URL đó để **tải trực tiếp tệp tin 10MB lên thẳng Amazon S3** mà không đi qua Server Backend!

```text
┌────────────────────────────────────────────────────────────────────────┐
│               LUỒNG TẢI FILE TẬP TRUNG PRESIGNED URL (DIRECT S3)       │
└────────────────────────────────────────────────────────────────────────┘

 [ Client ] ───( 1. Xin Presigned URL: filename, fileType )───> [ Backend ]
                                                                      │
 [ Client ] <───( 2. Trả về Presigned Upload URL )────────────────────┘
     │
     └───( 3. PUT trực tiếp file 10MB lên S3 Bucket )─────────> [ Amazon S3 ]
```

---

## 2. Đối Tượng `FormData` và Header `multipart/form-data`

Khi gửi dữ liệu dạng văn bản thông thường, ta dùng `Content-Type: application/json`.

Tuy nhiên, khi gửi tệp tin nhị phân (Binary Files như PNG, JPG, PDF, MP4):
- Bạn bắt buộc phải khởi tạo đối tượng JavaScript **`FormData`**.
- Gắn tệp tin vào bằng `formData.append('file', fileObject)`.
- Thiết lập Header `Content-Type: multipart/form-data`. Axios sẽ tự động thêm tham số `boundary` định ranh giới giữa các khối dữ liệu.

---

## 💻 Syntax

### Axios File Upload With Progress Syntax
```javascript
const formData = new FormData();
formData.append("file", selectedFile);
formData.append("upload_preset", "my_preset");

const response = await axios.post("https://api.cloudinary.com/v1_1/demo/image/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" },
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    console.log(`Tiến trình tải: ${percentCompleted}%`);
  }
});
```

---

## 📝 Example 1 - Component Tải Ảnh Kéo Thả (Drag & Drop) Có Preview Và Thanh Tiến Trình (Upload Progress Bar)

```jsx
// src/components/ImageUploader.jsx
import React, { useState } from "react";
import axios from "axios";

export function ImageUploader() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  // 1. Xử lý khi chọn file hoặc kéo thả
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validate kiểu file (chỉ cho phép ảnh)
    if (!selectedFile.type.startsWith("image/")) {
      alert("❌ Vui lòng chỉ chọn tệp tin hình ảnh!");
      return;
    }

    // Validate kích thước file (tối đa 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("❌ Kích thước tệp tin không được vượt quá 5MB!");
      return;
    }

    setFile(selectedFile);
    // Tạo Blob URL tạm thời để hiển thị Preview ảnh tức thì trong 0ms
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  // 2. Tải ảnh lên Cloudinary
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "educonnect_preset"); // Cloudinary Unsigned Upload Preset

    try {
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/educonnect/image/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          // Bắt sự kiện theo dõi tiến trình nạp %
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(percent);
            }
          }
        }
      );

      setUploadedUrl(res.data.secure_url);
      alert("✅ Upload ảnh lên Cloudinary thành công!");
    } catch (err) {
      alert("❌ Upload thất bại. Kiểm tra lại kết nối mạng!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border shadow-md space-y-4">
      <h3 className="text-xl font-bold text-slate-900">Tải Ảnh Đại Diện</h3>

      {/* Vùng Drag & Drop */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileSelect(e.dataTransfer.files[0]);
        }}
        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-full mx-auto shadow" />
        ) : (
          <div className="space-y-2">
            <p className="text-3xl">📁</p>
            <p className="text-sm font-medium text-slate-700">Kéo thả ảnh vào đây hoặc click để chọn</p>
            <p className="text-xs text-slate-400">PNG, JPG tối đa 5MB</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
          className="hidden"
          id="fileInput"
        />
      </div>

      {file && (
        <button
          onClick={() => document.getElementById("fileInput").click()}
          className="text-xs text-blue-600 font-medium hover:underline block mx-auto"
        >
          Đổi ảnh khác ({file.name})
        </button>
      )}

      {/* Thanh tiến trình Upload Progress */}
      {isUploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>Đang tải lên Cloudinary...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {isUploading ? `⏳ Đang tải (${progress}%)` : "Tải Lên Cloud"}
      </button>

      {uploadedUrl && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg break-all">
          🌐 <strong>URL Cloudinary:</strong> {uploadedUrl}
        </div>
      )}
    </div>
  );
}
```

---

## 📝 Example 2 - Quy Trình Direct Upload Tệp Tin Lên Amazon S3 Với Presigned URL

```javascript
// src/services/s3UploadService.js
import axios from "axios";
import apiClient from "./apiClient";

export async function uploadFileDirectToS3(file) {
  // BƯỚC 1: Xin Presigned URL từ Backend của bạn
  const { uploadUrl, fileKey } = await apiClient.post("/s3/presigned-url", {
    fileName: file.name,
    fileType: file.type
  });

  // BƯỚC 2: Tải trực tiếp file 100MB lên Amazon S3 qua PUT Request (Không qua Backend!)
  await axios.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type
    }
  });

  // BƯỚC 3: Trả về đường dẫn công khai trên S3
  return `https://my-bucket.s3.amazonaws.com/${fileKey}`;
}
```

---

## ⚠️ Notes

1. **Giải Phóng Bộ Nhớ Blob URL (`URL.revokeObjectURL`):** Khi dùng `URL.createObjectURL(file)` để preview ảnh, tập tin tạm sẽ chiếm dụng RAM trình duyệt. Hãy gọi `URL.revokeObjectURL(previewUrl)` khi component unmount để giải phóng rác bộ nhớ.

---

## ❌ Common Mistakes

### Sai 1 - Gửi tệp tin nhị phân qua dạng JSON string
```javascript
// ❌ SAI TAI HẠI: Không thể gửi file nhị phân qua JSON.stringify()!
axios.post("/upload", { file: fileObject });

// ✅ ĐÚNG CHUẨN: Sử dụng FormData và Header multipart/form-data
const formData = new FormData();
formData.append("file", fileObject);
axios.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
```

---

## 📚 Summary

- **FormData** và **`Content-Type: multipart/form-data`** bắt buộc phải sử dụng để tải tệp nhị phân.
- Sử dụng **`URL.createObjectURL(file)`** để tạo ảnh Preview xem trước tức thì 0ms.
- Sự kiện **`onUploadProgress`** của Axios theo dõi phần trăm % tiến trình tải tệp tin.
- Mô hình **Direct S3 Upload với Presigned URL** loại bỏ gánh nặng băng thông cho máy chủ Backend.
- Luôn kiểm tra kích thước (Max File Size) và loại định dạng (MIME Types) tệp tin trước khi tải lên.

---

## 📝 Quiz

### Question 1
Đối tượng JavaScript nào bắt buộc phải được khởi tạo để chứa tệp tin nhị phân (như ảnh PNG, video MP4) trước khi gửi qua API bằng Axios?

A. `JSON.stringify()`  
B. `FormData`  
C. `ArrayBuffer`  
D. `String`  

**Explanation:**  
Đối tượng `FormData` trong JavaScript cung cấp cú pháp `formData.append('key', file)` chuyên biệt để đóng gói dữ liệu dạng tệp nhị phân nhãn `multipart/form-data` gửi lên máy chủ web.

**Answer: B**

---

### Question 2
Sự kiện cấu hình nào trong Axios cho phép bạn đăng ký hàm callback nhận số bytes đã tải để tính toán ra phần trăm % tiến trình Upload hiển thị lên thanh Progress Bar?

A. `onDownloadProgress`  
B. `onUploadProgress`  
C. `onProgressState`  
D. `onLoadPercent`  

**Explanation:**  
Tham số `onUploadProgress: (progressEvent) => { ... }` trong config của Axios sẽ tự động được kích hoạt liên tục trong quá trình gửi bytes qua mạng, giúp bạn tính phần trăm: `(loaded * 100) / total`.

**Answer: B**

---

### Question 3
Lợi ích vượt trội mấu chốt của quy trình **Direct S3 Upload với Presigned URL** so với cách tải tệp tin truyền thống qua Server Backend là gì?

A. Tải tệp tin không cần mạng Internet  
B. Client tải tệp tin trực tiếp lên thẳng Amazon S3 Cloud, giúp tiết kiệm 100% tài nguyên CPU và băng thông cho máy chủ Backend  
C. Tự động đổi màu ảnh  
D. Tự động mã hóa CSDL  

**Explanation:**  
Với Presigned URL, máy chủ Backend chỉ tốn vài KB để ký một đường dẫn chữ ký an toàn. Client sẽ đẩy trực tiếp tập tin dung lượng lớn (100MB+) lên thẳng hạ tầng đám mây S3, triệt tiêu nguy cơ nghẽn mạng cho Backend.

**Answer: B**
