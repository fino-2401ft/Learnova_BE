---
id: db-m3-l1
course: Database
module: Database Design
title: ERD
order: 1
difficulty: Beginner
estimatedTime: 40
---

# ERD

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- Đọc và vẽ được sơ đồ thực thể – quan hệ (ERD).
- Phân biệt ba loại quan hệ: 1-1, 1-nhiều và nhiều-nhiều.
- Biết khoá ngoại đặt ở bảng nào và vì sao.
- Chuyển một ERD thành schema Prisma.

---

## 📖 Definition

**ERD** (Entity Relationship Diagram) là sơ đồ mô tả dữ liệu gồm những **thực thể** nào và chúng liên hệ với nhau ra sao.

Ba thành phần:

| Thành phần | Ý nghĩa | Ví dụ |
|---|---|---|
| Thực thể (Entity) | Một loại đối tượng cần lưu | `User`, `Course`, `Lesson` |
| Thuộc tính (Attribute) | Dữ liệu của thực thể | `email`, `title`, `createdAt` |
| Quan hệ (Relationship) | Liên hệ giữa hai thực thể | Một mentor dạy nhiều khoá học |

Giá trị thật của ERD không nằm ở tấm hình. Nó nằm ở chỗ **buộc bạn quyết định trước khi viết code**: một khoá học có bao nhiêu mentor? Xoá mentor thì khoá học của họ thành ra sao? Trả lời sai những câu này lúc đầu thì sau khi có dữ liệu thật, sửa lại rất tốn kém.

---

## ⚙️ Syntax

Cách viết phổ biến nhất hiện nay là **crow's foot** (chân quạ), ký hiệu số lượng ở hai đầu đường nối:

```text
|          đúng một
o          không hoặc một
<          nhiều (chân quạ)

User ||──────o< Course      một User có 0..n Course
User ||──────|| Mentor      một User có đúng một hồ sơ Mentor
```

Với Mermaid, ERD viết được ngay trong Markdown:

```text
erDiagram
    USER ||--o{ COURSE : "tạo"
    COURSE ||--o{ CHAPTER : "gồm"
    CHAPTER ||--o{ LESSON : "gồm"
```

### Example 1 - Quan hệ một–nhiều

Loại quan hệ hay gặp nhất. Một mentor có nhiều khoá học; mỗi khoá học thuộc đúng một mentor.

```text
MENTOR ||──────o< COURSE
```

Quy tắc đặt khoá ngoại: **luôn nằm ở phía "nhiều"**.

```sql
CREATE TABLE courses (
  course_id  UUID PRIMARY KEY,
  mentor_id  UUID NOT NULL REFERENCES mentors(user_id),  -- khoá ngoại ở đây
  title      VARCHAR(200) NOT NULL
);
```

Đặt ngược lại — cột `course_id` trong bảng `mentors` — thì một mentor chỉ trỏ được tới một khoá học. Muốn nhiều thì phải nhét danh sách vào một ô, và như vậy là vi phạm 1NF.

### Example 2 - Quan hệ một–một

Ít gặp hơn, dùng khi muốn tách một nhóm thuộc tính chỉ áp dụng cho một phần bản ghi.

```text
USER ||──────|| MENTOR
```

```sql
CREATE TABLE mentors (
  -- Vừa là khoá chính vừa là khoá ngoại: một User không thể có hai hồ sơ mentor.
  user_id          UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  expertise        TEXT[],
  experience_years INT
);
```

Dùng chung một cột cho cả khoá chính và khoá ngoại là cách SQL diễn đạt quan hệ 1-1, và nó tự động chặn việc tạo hai hồ sơ cho cùng một người.

Khi nào nên tách bảng thay vì thêm cột vào `users`: khi các cột đó chỉ có nghĩa với một phần người dùng. Nhét `experience_years` vào `users` nghĩa là mọi học viên cũng mang cột đó với giá trị `NULL`.

### Example 3 - Quan hệ nhiều–nhiều

Một học viên ghi danh nhiều khoá; một khoá có nhiều học viên. SQL **không** biểu diễn trực tiếp được quan hệ này — phải có bảng trung gian.

```text
MENTEE ||──────o< ENROLLMENT >o──────|| COURSE
```

```sql
CREATE TABLE enrollments (
  enrollment_id UUID PRIMARY KEY,
  mentee_id     UUID NOT NULL REFERENCES mentees(user_id),
  course_id     UUID NOT NULL REFERENCES courses(course_id),
  status        VARCHAR(20) NOT NULL,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Chặn ghi danh trùng: một người không vào cùng một khoá hai lần.
  UNIQUE (mentee_id, course_id)
);
```

Bảng trung gian thường **không chỉ là bảng nối** — nó mang dữ liệu riêng như `status` và `enrolled_at`. Đó là lý do nên đặt cho nó một cái tên nghiệp vụ (`enrollments`) thay vì tên ghép máy móc (`mentee_courses`).

### Example 4 - Chuyển ERD sang Prisma

```prisma
model User {
  userId String @id @default(uuid(7))
  email  String @unique

  // Quan hệ 1-1, phía tuỳ chọn
  mentor Mentor?
}

model Mentor {
  // Khoá chính đồng thời là khoá ngoại
  userId String @id
  user   User   @relation(fields: [userId], references: [userId], onDelete: Cascade)

  courses Course[]   // 1-nhiều, phía "một"
}

model Course {
  courseId String @id @default(uuid(7))
  mentorId String                        // khoá ngoại ở phía "nhiều"
  title    String

  mentor      Mentor       @relation(fields: [mentorId], references: [userId], onDelete: Restrict)
  enrollments Enrollment[]
}

model Enrollment {
  enrollmentId String @id @default(uuid(7))
  menteeId     String
  courseId     String
  status       String

  mentee Mentee @relation(fields: [menteeId], references: [userId], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [courseId], onDelete: Restrict)

  @@unique([courseId, menteeId])
}
```

Đọc từ ERD sang Prisma khá thẳng: phía "nhiều" giữ khoá ngoại và khai `@relation(fields:, references:)`; phía "một" chỉ khai một mảng.

### Example 5 - Quyết định `onDelete`

ERD nói *có* quan hệ; `onDelete` nói **chuyện gì xảy ra khi xoá**. Đây là phần hay bị bỏ qua nhất, và cũng là phần gây mất dữ liệu nhiều nhất.

```prisma
// Cascade: xoá cha thì con biến mất theo.
// Dùng khi con KHÔNG có ý nghĩa độc lập.
chapters Chapter[]   // xoá khoá học -> xoá luôn chương

// Restrict: chặn xoá cha nếu còn con.
// Dùng khi việc xoá sẽ làm mất dữ liệu người khác quan tâm.
enrollments Enrollment[]  // còn học viên ghi danh -> không cho xoá khoá học

// SetNull: giữ con lại, xoá liên kết.
// Dùng khi quan hệ là tuỳ chọn.
reviewedBy User?     // xoá admin -> khoá học vẫn còn, chỉ mất thông tin ai duyệt
```

Chọn sai `Cascade` ở chỗ đáng lẽ `Restrict` là kiểu lỗi tệ nhất: nó không báo gì cả, chỉ lặng lẽ xoá dữ liệu.

---

## 📌 Notes

- **Vẽ ERD trước khi viết migration.** Sửa sơ đồ mất năm phút; sửa bảng đã có dữ liệu thật thì tốn hơn nhiều.
- **Quan hệ nhiều–nhiều luôn cần bảng trung gian** — SQL không có cách nào khác.
- **Khoá ngoại luôn ở phía "nhiều"**, không có ngoại lệ.
- **Đặt tên bảng số nhiều, cột dạng `snake_case`** — quy ước của Postgres, giúp SQL viết tay không phải bọc dấu nháy.
- Mermaid vẽ ERD ngay trong file Markdown, nên sơ đồ đi cùng mã nguồn và không bị lạc hậu như ảnh chụp.

---

## 🌍 Real World Example

Phần cốt lõi trong ERD của Learnova:

```text
erDiagram
    USER     ||--o| MENTOR     : "có hồ sơ"
    USER     ||--o| MENTEE     : "có hồ sơ"
    MENTOR   ||--o{ COURSE     : "tạo"
    COURSE   ||--o{ CHAPTER    : "gồm"
    CHAPTER  ||--o{ LESSON     : "gồm"
    LESSON   ||--o{ SECTION    : "gồm"
    MENTEE   ||--o{ ENROLLMENT : "ghi danh"
    COURSE   ||--o{ ENROLLMENT : "nhận"
    ENROLLMENT ||--o{ PROGRESS : "theo dõi"
    LESSON   ||--o{ PROGRESS   : "được ghi nhận"
```

Ba quyết định trong sơ đồ này đáng giải thích:

**`USER ||--o| MENTOR`** — dùng quan hệ 1-1 tuỳ chọn thay vì nhét cột `expertise` và `experience_years` vào `users`. Học viên chiếm phần lớn số bản ghi, và họ không có lý do gì phải mang hai cột luôn `NULL`.

**`PROGRESS` gắn với `ENROLLMENT`, không gắn với `MENTEE`** — nghe qua thì gắn thẳng vào học viên có vẻ gọn hơn. Nhưng khi một người rời khoá rồi ghi danh lại, tiến độ cũ sẽ dính vào lượt học mới. Khoá theo `enrollment` khiến mỗi lượt ghi danh có tiến độ riêng.

**`ENROLLMENT` có `UNIQUE(course_id, mentee_id)`** — ràng buộc này nằm ở database chứ không chỉ ở tầng ứng dụng. Kiểm tra bằng code luôn có khe hở: hai request đồng thời đều thấy "chưa ghi danh" rồi cùng ghi. Chỉ ràng buộc ở database mới chặn được thật.

---

## ⚠️ Common Mistakes

**Sai 1 — Đặt khoá ngoại ở phía "một"**

```sql
-- SAI: một mentor chỉ trỏ được tới một khoá học
CREATE TABLE mentors (
  user_id   UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(course_id)
);
```

**Sai 2 — Nhét danh sách vào một ô để né bảng trung gian**

```sql
-- SAI: vi phạm 1NF, không JOIN được, không đánh index được
CREATE TABLE courses (
  student_ids TEXT  -- 'u1,u2,u3'
);
```

**Sai 3 — Bỏ qua `onDelete`**

Mặc định của Postgres là `NO ACTION`: bạn sẽ nhận lỗi khoá ngoại vào lúc không ngờ nhất, giữa lúc production đang chạy.

**Sai 4 — Dùng `Cascade` ở mọi nơi cho tiện**

Xoá một mentor mà kéo theo toàn bộ khoá học lẫn tiến độ của hàng trăm học viên là thảm hoạ. Nghĩ kỹ từng quan hệ.

**Sai 5 — Vẽ ERD xong rồi bỏ đó**

Sơ đồ không khớp với database thật còn tệ hơn không có sơ đồ, vì nó khiến người đọc tin vào thứ sai. Dùng Mermaid trong repo hoặc sinh lại từ schema.

**Sai 6 — Chỉ ràng buộc duy nhất ở tầng ứng dụng**

Hai request đồng thời sẽ lách qua. Ràng buộc thật phải nằm ở database.

---

## 📋 Summary

- ERD mô tả thực thể, thuộc tính và quan hệ; giá trị của nó là buộc bạn quyết định cấu trúc trước khi viết code.
- Ba loại quan hệ: 1-1 (dùng chung khoá chính), 1-nhiều (khoá ngoại ở phía "nhiều"), nhiều-nhiều (bắt buộc có bảng trung gian).
- Bảng trung gian thường mang dữ liệu riêng, nên đặt tên theo nghiệp vụ chứ đừng ghép tên hai bảng.
- `onDelete` là phần quan trọng nhất và hay bị bỏ qua nhất: `Cascade` khi con không có nghĩa độc lập, `Restrict` khi việc xoá làm mất dữ liệu, `SetNull` khi quan hệ tuỳ chọn.
- Ràng buộc duy nhất phải đặt ở database; kiểm tra bằng code luôn có khe hở với request đồng thời.

---

## 📝 Quiz

### Question 1

Trong quan hệ một–nhiều giữa `MENTOR` và `COURSE`, khoá ngoại đặt ở bảng nào?

A. Bảng `mentors`, cột `course_id`.

B. Bảng `courses`, cột `mentor_id` — khoá ngoại luôn nằm ở phía "nhiều".

C. Một bảng trung gian nối hai bảng.

D. Cả hai bảng đều phải có khoá ngoại trỏ tới nhau.

**Answer: B**

**Giải thích:** Mỗi khoá học thuộc về đúng một mentor, nên một cột `mentor_id` trong `courses` là đủ diễn đạt. Đặt ngược lại thì mỗi mentor chỉ trỏ được tới một khoá học duy nhất, và muốn nhiều thì phải nhét danh sách vào một ô — vi phạm 1NF. Bảng trung gian chỉ cần cho quan hệ nhiều–nhiều.

---

### Question 2

Vì sao bảng `lesson_progress` nên tham chiếu tới `enrollment` thay vì tham chiếu thẳng tới `mentee`?

A. Vì `enrollment` có khoá chính ngắn hơn nên truy vấn nhanh hơn.

B. Vì gắn vào `mentee` sẽ vi phạm chuẩn 1NF.

C. Vì một người có thể rời khoá rồi ghi danh lại; khoá theo `enrollment` giúp lượt học mới không thừa hưởng tiến độ của lượt cũ.

D. Vì Prisma không cho phép một bảng tham chiếu tới hai bảng khác nhau.

**Answer: C**

**Giải thích:** Gắn tiến độ vào `mentee` thì mỗi người chỉ có đúng một bản ghi tiến độ cho mỗi bài học, bất kể họ ghi danh mấy lần. Người bỏ giữa chừng rồi học lại sẽ thấy khoá học đã hoàn thành sẵn 60%. Khoá theo `enrollment` khiến mỗi lượt ghi danh là một lần học độc lập — đúng với cách người dùng hiểu.
