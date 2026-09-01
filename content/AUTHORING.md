# Soạn nội dung khoá học

Tài liệu này gồm hai phần: **prompt** để sinh nội dung đúng khuôn, và mô tả **đường đi của dữ liệu** từ file Markdown vào database.

---

## 1. Cấu trúc thư mục

```
content/courses/
└── course-0N-<slug>/                  <- một khoá học
    ├── module-01-<slug>/              <- một chương
    │   ├── lesson-01-<slug>.md        <- một bài học
    │   └── lesson-02-<slug>.md
    └── module-02-<slug>/
        └── lesson-01-<slug>.md
```

Quy tắc bắt buộc:

- Tên thư mục chương **phải** có số: `module-01-...`. Số này quyết định thứ tự chương.
- Tên file bài học nên có số: `lesson-01-...`. Dùng để phá hoà khi hai bài trùng `order`.
- Chỉ đọc file `.md`. File rỗng bị bỏ qua kèm cảnh báo.

Sau khi thêm khoá mới, phải đăng ký nó trong `CATALOG` tại
[prisma/import/courses.ts](../prisma/import/courses.ts) — nếu không importer sẽ không biết tới nó.

---

## 2. Khuôn một bài học

````markdown
---
id: <course>-m<N>-l<N>
course: <Tên khoá, phải GIỐNG HỆT ở mọi bài trong khoá>
module: <Tên chương, phải GIỐNG HỆT ở mọi bài trong chương>
title: <Tiêu đề bài học>
order: <số thứ tự trong chương, bắt đầu từ 1>
difficulty: Beginner | Intermediate | Advanced
estimatedTime: <số phút>
---

# <Tiêu đề bài học>

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- <4 gạch đầu dòng>

---

## 📖 Definition

<2–3 đoạn giải thích khái niệm. Nói VÌ SAO nó tồn tại, không chỉ nói nó là gì.>

---

## ⚙️ Syntax

<Cú pháp tối giản, dạng khối code.>

### Example 1 - <tên ví dụ>

```javascript
// code
```

<Giải thích ngắn.>

### Example 2 - <tên ví dụ>

...

## 📌 Notes

- <4–5 lưu ý. Ưu tiên những thứ dễ vấp mà tài liệu chính thức có nói.>

---

## 🌍 Real World Example

<Một đoạn code như trong dự án thật, kèm giải thích vì sao viết như vậy.>

---

## ⚠️ Common Mistakes

**Sai 1 — <tiêu đề>**

```javascript
// SAI
// ĐÚNG
```

<4–6 lỗi.>

---

## 📋 Summary

- <4–5 gạch đầu dòng chốt lại.>

---

## 📝 Quiz

### Question 1

<Câu hỏi>

A. <lựa chọn>

B. <lựa chọn>

C. <lựa chọn>

D. <lựa chọn>

**Answer: B**

**Giải thích:** <Vì sao đáp án đó đúng, và vì sao các đáp án khác sai.>

---

### Question 2

...
````

### Những chỗ parser bắt buộc phải đúng

| Yêu cầu | Vì sao |
|---|---|
| `id` **duy nhất trong toàn kho** | Trùng thì có cảnh báo; khoá định danh thật lấy theo đường dẫn file nên không mất dữ liệu |
| Tiêu đề mục viết bằng **tiếng Anh** | Parser khớp theo tên tiếng Anh: `Learning Objectives`, `Definition`, `Syntax`, `Example`, `Notes`, `Real World Example`, `Common Mistakes`, `Summary`, `Quiz` |
| Emoji trước tiêu đề mục | Tuỳ chọn — parser tự gỡ trước khi khớp |
| Heading mục ở cấp `##` | Chấp nhận `#`, `##`, `###` |
| `### Question N` | Bắt buộc đúng chữ `Question` kèm số |
| Đúng **4** lựa chọn A–D | Thiếu hoặc thừa thì câu hỏi bị bỏ qua kèm cảnh báo |
| `**Answer: B**` | Cũng chấp nhận `Answer: **B**` |
| `**Giải thích:**` sau dòng đáp án | Tuỳ chọn, nhưng nên có |

Hai điều parser **tự xử lý**, không cần lo:

- Heading nằm trong khối ``` bị bỏ qua (dòng `# npm install` trong code không bị nhầm là mục).
- `order` trùng hoặc nhảy cóc được đánh lại thành 1…N liên tục, kèm cảnh báo.

---

## 3. Prompt để sinh nội dung

Dán nguyên khối dưới đây, thay phần trong `<>`:

```text
Soạn một bài học cho nền tảng học lập trình Learnova, xuất ra một file Markdown duy nhất.

CHỦ ĐỀ
- Khoá học: <ví dụ: NestJS>
- Chương: <ví dụ: NestJS Fundamentals>
- Bài học: <ví dụ: Dependency Injection>
- Trình độ: <Beginner | Intermediate | Advanced>
- Thời lượng dự kiến: <25-55> phút

NGUỒN KIẾN THỨC
- Chỉ dùng tài liệu chính thức của công nghệ: <ví dụ: docs.nestjs.com>.
- Kiểm chứng phiên bản hiện hành trước khi viết. Nếu bản mới có thay đổi phá vỡ
  so với bản cũ, đưa vào mục Common Mistakes.
- Không bịa API, không bịa tên phương thức. Không chắc thì bỏ, đừng đoán.

ĐỊNH DẠNG BẮT BUỘC
Bắt đầu bằng frontmatter YAML:
---
id: <slug-khoá>-m<số chương>-l<số bài>
course: <tên khoá, giống hệt mọi bài trong khoá>
module: <tên chương, giống hệt mọi bài trong chương>
title: <tiêu đề bài>
order: <số thứ tự trong chương>
difficulty: <Beginner|Intermediate|Advanced>
estimatedTime: <số phút>
---

Sau đó là H1 tiêu đề bài, rồi CHÍNH XÁC các mục sau, theo đúng thứ tự này,
tiêu đề mục viết bằng TIẾNG ANH ở cấp H2:

## 🎯 Learning Objectives   -> 4 gạch đầu dòng, mở đầu "Sau bài học này, bạn có thể:"
## 📖 Definition            -> 2-3 đoạn. Giải thích VÌ SAO thứ này tồn tại, không chỉ nó là gì.
## ⚙️ Syntax                -> khối code cú pháp tối giản
### Example 1 - <tên>       -> 3-5 ví dụ, mỗi ví dụ một H3 bắt đầu bằng chữ "Example"
## 📌 Notes                 -> 4-5 gạch đầu dòng, ưu tiên thứ dễ vấp
## 🌍 Real World Example    -> code như dự án thật + giải thích vì sao viết vậy
## ⚠️ Common Mistakes       -> 4-6 lỗi, mỗi lỗi có "**Sai N — <tiêu đề>**" và code SAI/ĐÚNG
## 📋 Summary               -> 4-5 gạch đầu dòng
## 📝 Quiz                  -> đúng 2 câu

Mỗi câu quiz theo đúng khuôn:

### Question 1

<câu hỏi, có thể kèm khối code>

A. <lựa chọn>

B. <lựa chọn>

C. <lựa chọn>

D. <lựa chọn>

**Answer: <chữ cái>**

**Giải thích:** <vì sao đúng, và vì sao phương án hấp dẫn nhất lại sai>

---

VĂN PHONG
- Viết bằng tiếng Việt. Giữ nguyên thuật ngữ kỹ thuật tiếng Anh (closure, middleware,
  promise) — đừng dịch chúng.
- Chú thích trong code viết tiếng Việt.
- Giải thích nguyên nhân, không liệt kê tính năng. Mỗi khẳng định đáng ngờ phải kèm lý do.
- Không dùng câu sáo rỗng kiểu "rất mạnh mẽ", "cực kỳ hữu ích".
- Ví dụ phải chạy được thật, không phải giả mã.
- Câu quiz phải kiểm tra sự HIỂU, không kiểm tra trí nhớ. Các phương án sai phải là
  những hiểu nhầm có thật mà người học hay mắc.

CHỈ xuất nội dung file Markdown, không thêm lời dẫn.
```

---

## 3b. Quy trình nhanh: 3 lệnh thay cho 93 lần dán

Dán từng bài một cho mô hình rồi tự tạo file là cách chậm nhất. Dùng bộ công cụ
trong `scripts/` để cắt việc đó xuống.

### Bước 1 — Viết đề cương, sinh khung

Một file text mô tả cả khoá:

```text
course: TypeScript
dir: course-02-typescript
slug: ts

module: Type System | module-01-type-system
  Primitive Types | 25 | Beginner
  Union và Intersection | 30 | Beginner

module: Advanced TypeScript | module-03-advanced
  Generic | 40 | Intermediate
```

```bash
npm run course:scaffold -- content/outlines/typescript.txt
```

Sinh toàn bộ file `.md` với frontmatter điền sẵn đúng, thư mục đúng, số thứ tự
đúng, và mọi tiêu đề mục đã có chỗ. **Không bao giờ ghi đè file đã tồn tại**, nên
chạy lại chỉ bổ sung bài mới.

Từ đây trở đi bạn không còn phải gõ frontmatter bằng tay — nguồn sai vặt lớn nhất
biến mất.

### Bước 2 — Sinh nội dung cả module trong một lượt

Dùng prompt dưới đây. Nó bảo mô hình xuất **nhiều bài cùng lúc**, ngăn cách bằng
dòng đánh dấu:

```text
Soạn TOÀN BỘ các bài học dưới đây cho nền tảng Learnova.

KHOÁ: <TypeScript>
CHƯƠNG: <Type System>
NGUỒN: chỉ dùng tài liệu chính thức tại <typescriptlang.org>. Kiểm chứng phiên
bản hiện hành. Không bịa tên API — không chắc thì bỏ.

DANH SÁCH BÀI (đường dẫn | tiêu đề | id | order | phút | độ khó):
course-02-typescript/module-01-type-system/lesson-01-primitive-types.md | Primitive Types | ts-m1-l1 | 1 | 25 | Beginner
course-02-typescript/module-01-type-system/lesson-02-union-intersection.md | Union và Intersection | ts-m1-l2 | 2 | 30 | Beginner
course-02-typescript/module-01-type-system/lesson-03-type-alias.md | Type Alias | ts-m1-l3 | 3 | 25 | Beginner

ĐỊNH DẠNG ĐẦU RA
Mỗi bài mở đầu bằng đúng một dòng đánh dấu, không thụt lề:

=== FILE: <đường dẫn lấy từ danh sách trên> ===

Ngay sau đó là nội dung file, bắt đầu bằng frontmatter:
---
id: <id từ danh sách>
course: <tên khoá, giống hệt mọi bài>
module: <tên chương, giống hệt mọi bài>
title: <tiêu đề từ danh sách>
order: <order từ danh sách>
difficulty: <độ khó từ danh sách>
estimatedTime: <phút từ danh sách>
---

Rồi H1 tiêu đề bài, rồi CHÍNH XÁC các mục sau theo thứ tự này, tiêu đề mục viết
bằng TIẾNG ANH ở cấp H2:

## 🎯 Learning Objectives   -> 4 gạch đầu dòng
## 📖 Definition            -> 2-3 đoạn, giải thích VÌ SAO nó tồn tại
## ⚙️ Syntax                -> khối code cú pháp tối giản
### Example 1 - <tên>       -> 3-5 ví dụ, mỗi ví dụ một H3 mở đầu bằng "Example"
## 📌 Notes                 -> 4-5 gạch đầu dòng
## 🌍 Real World Example    -> code như dự án thật + giải thích
## ⚠️ Common Mistakes       -> 4-6 lỗi, mỗi lỗi có code SAI/ĐÚNG
## 📋 Summary               -> 4-5 gạch đầu dòng
## 📝 Quiz                  -> đúng 2 câu, mỗi câu 4 lựa chọn A-D

Khuôn câu quiz:

### Question 1

<câu hỏi>

A. <lựa chọn>

B. <lựa chọn>

C. <lựa chọn>

D. <lựa chọn>

**Answer: <chữ cái>**

**Giải thích:** <vì sao đúng, và vì sao phương án hấp dẫn nhất lại sai>

VĂN PHONG
- Tiếng Việt, giữ nguyên thuật ngữ kỹ thuật tiếng Anh. Chú thích trong code tiếng Việt.
- Giải thích nguyên nhân, không liệt kê tính năng. Không dùng câu sáo rỗng.
- Ví dụ phải chạy được thật.
- Phương án sai trong quiz phải là hiểu nhầm có thật của người học.

Xuất liên tiếp cả 3 bài trong một lượt trả lời. Không thêm lời dẫn nào.
```

Lưu kết quả vào `drafts/module-01.txt` rồi:

```bash
npm run course:split -- drafts/module-01.txt
```

Script cắt thành từng file và ghi vào đúng đường dẫn. **1 lần dán thay cho 3-5 lần.**

### Bước 3 — Kiểm tra trước khi import

```bash
npm run course:check -- content/courses/course-02-typescript
```

Chạy bằng **chính parser mà importer dùng**, nên đạt ở đây thì seed cũng đạt.
Không chạm database, chạy được cả khi Postgres đang tắt.

Nó bắt: thiếu mục bắt buộc, quiz không đủ 4 lựa chọn, số đáp án đúng khác 1, còn
sót `TODO` chưa điền, mục quá ngắn, thiếu phần giải thích. Có lỗi thì thoát mã 1
nên gắn được vào CI.

### Tổng kết quy trình

| | Cách cũ | Cách mới |
|---|---|---|
| Gõ frontmatter | 93 lần, dễ sai | 0 — `scaffold` sinh sẵn |
| Dán cho mô hình | 93 lần | ~22 lần, mỗi lần một module |
| Tạo file thủ công | 93 lần | 0 — `split` tự ghi |
| Biết file có đúng format không | chạy `db:seed` rồi đoán | `course:check`, vài giây |

---

## 4. Dữ liệu đi từ file `.md` vào database như thế nào

Toàn bộ nằm ở hai file:

- [prisma/import/markdown.ts](../prisma/import/markdown.ts) — chỉ đọc và bóc tách, **không chạm database**.
- [prisma/import/courses.ts](../prisma/import/courses.ts) — nhận kết quả bóc tách rồi ghi vào các bảng.

Tách đôi như vậy để chạy thử phần phân tích mà không cần Postgres, và để mọi lỗi định dạng lộ ra **trước** khi có lệnh ghi nào.

### 4.1 Bảng ánh xạ

| Nguồn trong file `.md` | Bảng | Cột |
|---|---|---|
| Tên thư mục khoá | `courses` | `course_id` (băm từ tên thư mục) |
| `course:` trong frontmatter | `courses` | `title` |
| `description` trong CATALOG | `courses` | `description` |
| `coverSlug` trong CATALOG | `courses` | `cover_image_url` |
| `difficulty:` của mọi bài, lấy mức đa số | `courses` | `level` |
| `mentorEmail` trong CATALOG | `courses` | `mentor_id` |
| Tên thư mục chương | `chapters` | `chapter_id` (băm), `order_index` (số trong tên) |
| `module:` trong frontmatter | `chapters` | `title` |
| Đường dẫn file bài học | `lessons` | `lesson_id` (băm) |
| `title:` | `lessons` | `title` |
| `order:` (đã đánh lại 1…N) | `lessons` | `order_index` |
| `estimatedTime:` | `lessons` | `duration_minutes` |
| Mỗi mục `## ...` | `lesson_sections` | một dòng: `kind`, `heading`, `content_md`, `order_index` |
| Mỗi `### Question N` | `quiz_questions` | `prompt_md`, `order_index` |
| `**Giải thích:**` | `quiz_questions` | `explanation_md` |
| Mỗi lựa chọn `A.` … `D.` | `quiz_options` | `label`, `content_md`, `is_correct` |
| `**Answer: X**` | `quiz_options` | đặt `is_correct = true` cho đúng nhãn X |

### 4.2 Các bước chạy

```
npm run db:seed
  │
  ├─ 1. Tạo user / mentor / mentee   (seed.ts)
  │     └─ dựng map email -> userId, để bước sau gán mentor cho khoá
  │
  ├─ 2. importCourses()              (import/courses.ts)
  │     └─ với mỗi mục trong CATALOG:
  │         ├─ readCourse()          (import/markdown.ts)
  │         │    ├─ duyệt thư mục chương, đọc file .md
  │         │    ├─ bóc frontmatter
  │         │    ├─ cắt thân bài thành các mục theo heading
  │         │    │    (bỏ qua heading nằm trong khối code)
  │         │    ├─ bóc phần Quiz thành câu hỏi + 4 lựa chọn + đáp án đúng
  │         │    └─ đánh lại order_index cho liên tục 1…N
  │         │
  │         ├─ upsert courses
  │         ├─ xoá chương không còn trong tài liệu
  │         ├─ đẩy tạm order_index sang vùng âm  <- tránh va chạm UNIQUE
  │         ├─ upsert chapters
  │         │    ├─ xoá bài không còn trong tài liệu
  │         │    ├─ đẩy tạm order_index sang vùng âm
  │         │    └─ upsert lessons
  │         │         ├─ XOÁ sạch lesson_sections cũ rồi tạo lại
  │         │         └─ XOÁ sạch quiz_questions cũ rồi tạo lại (kéo theo options)
  │         └─ trả về danh sách lessonId theo đúng thứ tự học
  │
  └─ 3. Dựng dữ liệu phụ thuộc       (seed.ts)
        ├─ enrollments  -> gán mentee vào các khoá vừa import
        ├─ lesson_progress -> dùng lessonId trả về ở bước 2
        ├─ conversations, messages
        └─ meeting_rooms, meeting_participants
```

### 4.3 Ba quyết định thiết kế đáng biết

**Khoá chính sinh tất định, không để database tự sinh.**
`stableId('lesson', '<đường dẫn file>')` băm SHA-256 rồi ép về định dạng UUID. Nhờ vậy chạy
seed mười lần vẫn ra đúng một bộ ID, và `upsert` nhận ra hàng cũ thay vì tạo bản trùng.

Khoá định danh bài học lấy theo **đường dẫn file**, không lấy theo `id` trong frontmatter —
vì kho tài liệu ngoài từng có hai bài dùng chung một `id`, và hai bài cùng UUID nghĩa là bài
sau ghi đè bài trước, mất nội dung mà không có lỗi nào.

**Mục và quiz thì xoá-rồi-tạo-lại, không upsert.**
`upsert` biết thêm và sửa nhưng không biết dọn. Sửa một bài từ chín mục xuống bảy mục thì hai
mục cũ vẫn nằm lại database. Vì mục và câu hỏi thuộc hoàn toàn về bài học do importer sở hữu
nên xoá là an toàn.

**`order_index` được đẩy tạm sang vùng âm trước khi gán lại.**
Ràng buộc `@@unique([chapterId, orderIndex])` được Postgres kiểm tra ngay sau mỗi câu lệnh,
không hoãn tới cuối giao dịch. Đổi chỗ hai bài cho nhau sẽ khiến câu `UPDATE` đầu tiên đụng
ngay số mà bài kia còn giữ. Phép `-x - 1` biến mọi số không âm phân biệt thành số âm phân
biệt, nên bước dọn chỗ không tự đụng chính nó.

### 4.4 Kiểm tra sau khi thêm nội dung

```bash
# 1. Chỉ chạy phần phân tích, không đụng database
npx ts-node -e "
  const { readCourse } = require('./prisma/import/markdown');
  const w = [];
  const c = readCourse('content/courses/course-0N-slug', w);
  console.log(JSON.stringify({ title: c.title, chapters: c.chapters.length }, null, 2));
  console.log('cảnh báo:', w);
"

# 2. Nạp vào database
npm run db:seed
```

Cảnh báo cần để ý: `không cắt được mục nội dung nào`, `tìm thấy N lựa chọn, cần đúng 4`,
`không tìm thấy dòng đáp án đúng`. Cảnh báo `đánh lại số thứ tự` thì bình thường.
