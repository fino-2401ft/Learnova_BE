---
id: react-fundamentals-m3-l3
course: React Fundamentals
module: Side effect, cơ chế render và form
title: Handling Form Inputs, File Uploads & Multi-step Forms
order: 3
difficulty: Intermediate
estimatedTime: 240
---
# Handling Form Inputs, File Uploads & Multi-step Forms

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:
- Quản lý các loại Form Inputs phức tạp trong React (File Uploads, Checkbox Groups, Radio Buttons).
- Xem trước ảnh (Image Preview) bằng `URL.createObjectURL()` trước khi tải lên máy chủ.
- Xây dựng quy trình Form nhiều bước (**Multi-step Form**) với State chung.
- Xử lý tiến trình gửi dữ liệu kèm tệp tin đa phương tiện (**FormData / Multipart Requests**).
- Xây dựng giao diện Form thân thiện với người dùng (Validation, Error Messaging, Reset State).

---

## 📖 Definition

### 1. Xử lý File Upload trong React
File Input (`<input type="file" />`) là một phần tử thuộc dạng **Uncontrolled Component** trong React do lý do bảo mật của trình duyệt (bạn không thể đặt thuộc tính `value` cho file input bằng một chuỗi tùy ý).

Để quản lý File Upload:
- Lắng nghe sự kiện `onChange` và truy cập tập tin qua `e.target.files[0]`.
- Lưu trữ đối tượng `File` này vào React State.
- Sử dụng `URL.createObjectURL(file)` để tạo một đường dẫn tạm thời xem trước (Preview) bức ảnh ngay trên màn hình.
- Đóng gói dữ liệu bằng đối tượng `FormData` khi gửi API lên server.

### 2. Multi-step Form (Form Nhiều Bước)
Multi-step Form chia một Form đăng ký dài thành nhiều bước nhỏ (Step 1, Step 2, Step 3) giúp tăng tỷ lệ chuyển đổi (Conversion Rate) và nâng cao trải nghiệm người dùng (UX).

Cách xây dựng:
- Khởi tạo một biến State `currentStep` để lưu giữ bước hiện tại.
- Quản lý một đối tượng State tổng `formData` chứa toàn bộ dữ liệu của tất cả các bước.
- Sử dụng Conditional Rendering để hiển thị giao diện tương ứng với `currentStep`.

---

## 💻 Syntax

### File Input & Image Preview Pattern
```jsx
const [selectedFile, setSelectedFile] = useState(null);
const [previewUrl, setPreviewUrl] = useState("");

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // Tạo đường dẫn xem trước
  }
};
```

---

## 📝 Example 1 - Form Tải Ảnh Đại Diện có xem trước (Avatar Upload & Preview)

```jsx
import { useState, useEffect } from "react";

export function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const handleSelectImage = (e) => {
    const pickedFile = e.target.files[0];
    if (pickedFile) {
      setFile(pickedFile);
      setPreview(URL.createObjectURL(pickedFile));
    }
  };

  // ✅ BẮT BUỘC: Dọn dẹp URL tạm thời khi đổi ảnh hoặc unmount để tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleUploadSubmit = async () => {
    if (!file) return alert("Vui lòng chọn 1 bức ảnh!");

    const formData = new FormData();
    formData.append("avatar", file);

    console.log("Đang gửi FormData chứa ảnh:", file.name);
    alert(`Đã gửi ảnh ${file.name} lên máy chủ thành công!`);
  };

  return (
    <div className="upload-box">
      <h3>Cập nhật ảnh đại diện</h3>
      <input type="file" accept="image/*" onChange={handleSelectImage} />

      {preview && (
        <div className="preview-container">
          <p>Xem trước:</p>
          <img src={preview} alt="Avatar Preview" style={{ width: "120px", height: "120px", borderRadius: "50%" }} />
        </div>
      )}

      <button onClick={handleUploadSubmit} disabled={!file}>Tải ảnh lên</button>
    </div>
  );
}
```

---

## 📝 Example 2 - Xây dựng Multi-step Form Khảo sát (Step 1 -> Step 2 -> Summary)

```jsx
import { useState } from "react";

export function MultiStepSurvey() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    experience: "beginner",
    agreeTerms: false
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="wizard-card">
      <h2>Đăng ký Khóa học - Bước {step}/3</h2>

      {/* Bước 1: Thông tin cá nhân */}
      {step === 1 && (
        <div className="step-content">
          <input 
            value={formData.fullName} 
            onChange={(e) => updateField("fullName", e.target.value)} 
            placeholder="Họ và tên" 
          />
          <input 
            value={formData.email} 
            onChange={(e) => updateField("email", e.target.value)} 
            placeholder="Email liên hệ" 
          />
          <button onClick={() => setStep(2)} disabled={!formData.fullName || !formData.email}>
            Tiếp theo ➔
          </button>
        </div>
      )}

      {/* Bước 2: Kinh nghiệm lập trình */}
      {step === 2 && (
        <div className="step-content">
          <label>Trình độ hiện tại:</label>
          <select value={formData.experience} onChange={(e) => updateField("experience", e.target.value)}>
            <option value="beginner">Chưa biết gì (Beginner)</option>
            <option value="intermediate">Đã biết HTML/CSS (Intermediate)</option>
            <option value="advanced">Đã từng làm React (Advanced)</option>
          </select>
          
          <div className="btn-row">
            <button onClick={() => setStep(1)}>⬅ Quay lại</button>
            <button onClick={() => setStep(3)}>Tiếp theo ➔</button>
          </div>
        </div>
      )}

      {/* Bước 3: Xác nhận thông tin */}
      {step === 3 && (
        <div className="step-content">
          <h3>Xác nhận thông tin đăng ký:</h3>
          <p>Họ tên: {formData.fullName}</p>
          <p>Email: {formData.email}</p>
          <p>Trình độ: {formData.experience}</p>
          
          <button onClick={() => setStep(2)}>⬅ Quay lại</button>
          <button onClick={() => alert("Đăng ký thành công!")}>Xác nhận nộp Form</button>
        </div>
      )}
    </div>
  );
}
```

---

## ⚠️ Notes

1. **Dọn dẹp Memory Leak khi dùng `URL.createObjectURL()`:** Mỗi đường dẫn tạm thời được tạo bởi `URL.createObjectURL(file)` sẽ giữ một tham chiếu đến bức ảnh trên bộ nhớ RAM. Hãy nhớ gọi `URL.revokeObjectURL(url)` trong Cleanup function của `useEffect` khi xem trước xong.
2. **`type="file"` không hỗ trợ gán `value` cố định:** Tránh viết `value={file}` trên thẻ `<input type="file" />`.

---

## ❌ Common Mistakes

### Sai 1 - Cố tình đọc đối tượng file qua `e.target.value` thay vì `e.target.files`
```jsx
// ❌ Sai: e.target.value chỉ trả về chuỗi giả đường dẫn "C:\fakepath\image.png"
const file = e.target.value; 

// ✅ Đúng: Lấy tập tin qua mảng files
const file = e.target.files[0];
```

---

## 📚 Summary

- File Input lấy dữ liệu tập tin qua `e.target.files[0]`.
- Tạo link xem trước ảnh xem ngay bằng **`URL.createObjectURL(file)`** (nhớ hủy bằng `URL.revokeObjectURL()`).
- **Multi-step Form** dùng State `step` điều khiển luồng Conditional Rendering từng bước.
- Đóng gói dữ liệu file trong đối tượng **`FormData`** khi gửi API lên server.

---

## 📝 Quiz

### Question 1
Thuộc tính nào của đối tượng sự kiện `e.target` chứa danh sách các tập tin thực tế được người dùng chọn từ thẻ `<input type="file" />`?

A. `e.target.value`  
B. `e.target.files`  
C. `e.target.data`  
D. `e.target.src`  

**Answer: B**

---

### Question 2
Hàm nào được sử dụng để tạo ra một đường dẫn URL tạm thời trong trình duyệt phục vụ tính năng xem trước ảnh (Image Preview) trước khi upload?

A. `URL.createObjectURL(file)`  
B. `JSON.stringify(file)`  
C. `file.toURL()`  
D. `String.fromCodePoint(file)`  

**Answer: A**

---

### Question 3
Đối tượng JavaScript chuẩn nào được sử dụng để đóng gói tập tin đa phương tiện và dữ liệu form khi gửi một HTTP Multi-part Request lên Server?

A. `JSON`  
B. `FormData`  
C. `BlobData`  
D. `HeaderMap`  

**Answer: B**
