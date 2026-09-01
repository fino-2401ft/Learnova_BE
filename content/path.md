# Lộ trình học và bài kiểm tra năng lực đầu vào

Tài liệu mô tả cách Learnova xếp lộ trình cho mentee: hỏi gì, chấm thế nào, và dựa
vào đâu để quyết định bỏ qua một chương.

> **Trạng thái.** Danh mục kỹ năng và cột `pathOrder` đã có trong database
> (migration `20260824000000_course_path_order` và `20260824000001_skills`). Ngân
> hàng câu hỏi và module NestJS **chưa xây** — phần đó là đặc tả, chưa phải mô tả
> code đang chạy.

---

## 1. Lộ trình là một dãy cố định

Bảy khoá hiện có chính là lộ trình "NodeJS Backend Developer", xếp theo đúng thứ tự
cần học:

| `pathOrder` | Khoá | Thư mục | Chương | Bài |
|---|---|---|---|---|
| 1 | JavaScript Fundamentals | `course-01-javascript` | 5 | 23 |
| 2 | TypeScript | `course-02-typescript` | 4 | 15 |
| 3 | Node.js | `course-03-nodejs` | 4 | 15 |
| 4 | Express.js | `course-04-expressjs` | 3 | 9 |
| 5 | Database | `course-05-database` | 3 | 11 |
| 6 | NestJS | `course-06-nestjs` | 4 | 15 |
| 7 | Authentication & Security | `course-07-auth-security` | 3 | 14 |

Ngôn ngữ → kiểu tĩnh → runtime → web framework → dữ liệu → framework có kiến trúc →
bảo mật. Khoá Auth đứng cuối vì nội dung của nó viết bằng NestJS (`JwtAuthGuard`,
`PrismaService`), học trước sẽ không hiểu.

**Cá nhân hoá chỉ là bỏ bớt chương.** Không đảo thứ tự, không thêm bớt khoá, không
sinh lộ trình riêng cho từng người. Hệ quả thiết kế:

- `Course.pathOrder Int? @unique` là nguồn sự thật. `null` = khoá ngoài lộ trình
  (khoá nháp, khoá mentor tự soạn).
- **Không có bảng `LearningPath`.** Lộ trình của một người suy ra từ điểm kỹ năng
  của họ ⋈ `skill_chapters`; cả hai đều bất biến nên không cần lưu thêm.
- Số trong tên thư mục trùng với `pathOrder` cho dễ đọc, nhưng **tên thư mục không
  phải nguồn sự thật** — cột kia mới là.

> **Bẫy đã gỡ.** Trước đây `stableId` băm từ `basename(courseDir)`, nên đổi tên thư
> mục là viết lại UUID của toàn bộ khoá, chương, bài, mục, câu hỏi — và xoá sạch
> tiến độ học. Nay `CatalogEntry.key` được ghim tách khỏi `dir`; xem
> [prisma/import/courses.ts](../prisma/import/courses.ts).

---

## 2. Kỹ năng — 16 nhóm, gán ở mức chương

Kỹ năng là đơn vị chấm điểm. Mỗi chương thuộc **đúng một** kỹ năng.

| # | Mã | Kỹ năng | Chương | Bài |
|---|---|---|---|---|
| 1 | `js-core` | JS Cú pháp nền tảng | JavaScript Basics, Control Flow | 10 |
| 2 | `js-func` | JS Hàm & Closure | Functions | 4 |
| 3 | `js-data` | JS Object & Array | Objects & Arrays | 4 |
| 4 | `js-async` | JS Hiện đại & Bất đồng bộ | ES6+ | 5 |
| 5 | `ts-types` | TS Hệ thống kiểu | Type System | 4 |
| 6 | `ts-oop` | TS Hướng đối tượng | OOP | 4 |
| 7 | `ts-advanced` | TS Nâng cao & Dự án | Advanced TS, TS Project | 7 |
| 8 | `node-core` | Node Nền tảng | Node Fundamentals, Core Modules | 8 |
| 9 | `node-async` | Node Bất đồng bộ & Stream | Async Programming, Stream & Buffer | 7 |
| 10 | `http-express` | HTTP, Express & REST | Express Basics, Middleware, REST API | 9 |
| 11 | `sql` | SQL | SQL | 4 |
| 12 | `db-design` | ORM & Thiết kế CSDL | Prisma ORM, Database Design | 7 |
| 13 | `nest-core` | NestJS Kiến trúc | Fundamentals, DI, Database Integration | 10 |
| 14 | `nest-advanced` | NestJS Nâng cao | Advanced NestJS | 5 |
| 15 | `auth` | Xác thực & Phân quyền | Authentication, Authorization | 8 |
| 16 | `appsec` | Bảo mật ứng dụng | Security Best Practices | 6 |

Tổng **102/102 bài**, không chương nào mồ côi.

### Vì sao gán theo chương chứ không theo bài

Đơn vị mà lộ trình bỏ qua là cả chương. Gán tới từng bài chỉ làm phồng số câu hỏi
phải soạn cho bài kiểm tra đầu vào mà không đổi được điều gì.

Kéo theo: bảng `skill_chapters` chỉ có **26 dòng, khai sao lưu vậy** — không có bước
sinh dữ liệu nào để sai. Truy vấn "bài nào thuộc kỹ năng X" đi qua một join:

```
skills ⋈ skill_chapters ⋈ chapters ⋈ lessons
```

### Kỹ năng trải hai chương vẫn không bị bỏ gộp

`js-core` phủ *JavaScript Basics* + *Control Flow*. Đạt 4/4 chỉ **đề xuất** bỏ cả
hai; cửa xác nhận (mục 5) chạy **độc lập cho từng chương**. Nên không có chuyện bỏ
10 bài bằng một lần may mắn.

Khai báo tại [prisma/import/skills.ts](../prisma/import/skills.ts), dùng tên thư mục
chứ không dùng UUID:

```typescript
{ code: 'js-func', name: 'JS Hàm & Closure', domain: 'JavaScript',
  chapters: ['course-01-javascript/module-03-functions'] }
```

Sai chính tả tên thư mục, hoặc bỏ sót một chương, đều **làm đổ `npm run db:seed`**
kèm tên dòng sai. Chương mồ côi mà chỉ cảnh báo thì bài kiểm tra sẽ không bao giờ
hỏi tới chương đó và không ai phát hiện ra.

---

## 3. Luồng làm bài — sàng lọc hai tầng

16 kỹ năng × 4 câu = 64 câu. Không ai làm hết; thực tế người học bỏ dở sau 25–30
câu. Nên hỏi hai tầng, tầng sau chỉ mở khi tầng trước cho tín hiệu.

```
                    ┌──────────────────────────────┐
                    │  "Tôi mới bắt đầu"  ────────────►  hồ sơ toàn NONE
                    │  (bỏ hẳn test)               │    học từ bài 1
                    └──────────────┬───────────────┘
                                   │ hoặc làm test
                                   ▼
                    ┌──────────────────────────────┐
                    │  THÔNG BÁO TRUNG THỰC        │
                    │  sai và "không biết" đều trừ │
                    └──────────────┬───────────────┘
                                   ▼
        TẦNG 1 — SÀNG THEO KHOÁ      7 khoá × 2 câu dễ = 14 câu
                                   │
                 ┌─────────────────┴─────────────────┐
            sai cả 2                            đúng ≥ 1
                 │                                   │
                 ▼                                   ▼
      mọi kỹ năng của khoá        TẦNG 2 — ĐÀO SÂU THEO KỸ NĂNG
      = NONE, không hỏi thêm      4 câu / kỹ năng
                                   │
                                   ▼
                            4/4  → SKIP
                            3/4  → REVIEW
                            ≤2/4 → LEARN
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │  HỒ SƠ NĂNG LỰC 16 KỸ NĂNG   │
                    │  + lộ trình đã lọc chương    │
                    └──────────────────────────────┘
```

Số câu tầng 2 theo từng khoá:

| Khoá | Kỹ năng | Câu tầng 2 |
|---|---|---|
| JavaScript | 4 | 16 |
| TypeScript | 3 | 12 |
| Node.js | 2 | 8 |
| Express.js | 1 | 4 |
| Database | 2 | 8 |
| NestJS | 2 | 8 |
| Auth & Security | 2 | 8 |

Số câu thực tế phải làm:

| Người học | Số câu | |
|---|---|---|
| Mới hoàn toàn | **14** | trượt hết vòng sàng, xong ngay |
| Biết JavaScript | **30** | 14 + 16 |
| Dev Node 2 năm | **50** | 14 + 36 (qua 3 khoá đầu) |
| Biết cả 7 khoá | **78** | người này vốn không cần lộ trình |

Người mới — đối tượng đông nhất — chỉ làm 14 câu. Không bắt ai làm 78 câu chỉ để
nghe kết luận "bạn cần học tất cả".

Vẫn thuần rule-base: chỉ thêm một luật về việc *có hỏi tiếp hay không*.

---

## 4. Cách chấm

Mỗi câu 5 lựa chọn: **A B C D + "Tôi không biết"**.

```
Đúng           +1
Sai            −1/3
"Không biết"   −1/3

điểm = max(0, tổng) / 4 × 100
```

| Kết quả | Điểm | Quyết định | Nghĩa là |
|---|---|---|---|
| 4 đúng | 100% | **SKIP** | đề xuất bỏ qua chương |
| 3 đúng | 67% | **REVIEW** | ôn nhanh |
| 2 đúng | 33% | LEARN | học đầy đủ |
| ≤1 đúng | 0% | LEARN | học đầy đủ |

Trừ điểm câu sai làm **kỳ vọng của việc đoán bừa bằng 0**, nên không cần thêm bước
hiệu chỉnh đoán mò kiểu `(thô − 25) / 75`.

**Bắt buộc 4/4 mới được đề xuất bỏ qua.** Đoán mò trúng cả bốn là `0.25⁴ = 0.39%`.
Với người đào sâu 9 nhóm, rủi ro bỏ nhầm ít nhất một nhóm là 3.5% — so với 13.2%
nếu chỉ hỏi 3 câu.

### `REVIEW` là gì

Bài ở chế độ ôn nhanh chỉ hiện mục `SUMMARY`, `MISTAKES` và `Quiz`; bỏ lý thuyết và
ví dụ. Bài 30 phút rút còn ~5 phút. Sai quiz thì mở lại bài đầy đủ.

Trạng thái thứ ba này chỉ tồn tại được vì nội dung đã tách thành `LessonSection`.
Nếu vẫn lưu markdown nguyên khối thì chỉ có hai lựa chọn: học hoặc bỏ.

### Một đánh đổi đã được quyết

Vì `"không biết"` cũng bị trừ `−1/3` như câu sai, người trung thực bị thiệt hơn
người đoán bừa ở cùng trình độ:

```
Biết 2/4 câu, bấm "không biết" hai lần   →  33%  →  LEARN
Biết 2/4 câu, đoán bừa hai lần           →  kỳ vọng 50%  →  REVIEW
```

Nút "Tôi không biết" do đó phạt đúng hành vi mà thông báo đầu bài khuyến khích. Đây
là lựa chọn có ý thức, không phải sơ suất. Muốn đổi thì sửa đúng một hằng số: cho
`"không biết"` bằng `0`.

### Thông báo bắt buộc trước khi làm bài

Hiển thị trước câu hỏi đầu tiên:

> **Bài kiểm tra này để xếp lộ trình cho bạn, không phải để chấm điểm.**
>
> Trả lời trung thực thì lộ trình mới đúng. Chọn bừa mà may trúng sẽ khiến bạn bị bỏ
> qua bài mình chưa nắm.
>
> Câu sai và câu *"Tôi không biết"* đều bị trừ điểm.

---

## 5. Hai cửa chặn đoán mò

Bài đầu vào **chỉ đề xuất** bỏ qua, chưa bỏ thật. Người học phải chứng minh thêm một
lần nữa, ngay lúc chạm tới chương đó trong lộ trình.

```
Lúc làm bài đầu vào
   js-func 4/4  →  "Bạn có thể bỏ qua chương Functions"

        ⋮  (vài ngày hoặc vài tuần sau, học tới đó)

Khi mở chương Functions
   ┌─────────────────────────────────────────┐
   │ Chương này bạn có thể bỏ qua            │
   │ Làm 3 câu để xác nhận?  [Làm] [Học đủ]  │
   └─────────────────────────────────────────┘
        ↓ bấm "Làm"
   3 câu lấy từ chính quiz của chương đó
        ↓
   Đúng 3/3  →  đánh dấu hoàn thành, sang chương sau
   Sai       →  mở chương bình thường
                "Câu về closure còn chưa chắc — nên học phần này."
```

| | Cửa 1 | Cửa 2 |
|---|---|---|
| Khi nào | lúc làm bài đầu vào | lúc chạm chương đó |
| Bao nhiêu câu | 4 | 3 |
| Nguồn câu hỏi | ngân hàng đánh giá | quiz chương **có sẵn** |
| Điều kiện qua | 4/4 | 3/3 |

Ba lý do đáng làm:

- **Không tốn công soạn** — dùng chính 204 câu quiz bài học đã có.
- **Không làm bài đầu vào dài thêm** — việc xác nhận rải theo lộ trình.
- **Hai lần lấy mẫu độc lập** — may ở cửa 1 (0.39%) rồi may tiếp ở cửa 2, xác suất
  còn dưới 0.01%.

Về trải nghiệm cũng hợp lý hơn: *"chứng minh đi rồi bỏ"* dễ chấp nhận hơn *"máy bảo
bạn biết rồi"*.

---

## 6. Đo tiến bộ: đầu vào ↔ đầu ra

Hai mốc đo, hai đề song song:

```
ENTRY  →  đề A  →  hồ sơ năng lực đầu vào  →  lộ trình
                          ⋮  học
EXIT   →  đề B  →  hồ sơ năng lực đầu ra   →  so sánh
```

Mỗi kỹ năng có `form: A` và `form: B` với **cùng số câu, cùng phân bố độ khó**, soạn
theo cùng đặc tả.

**Không có mốc "kiểm tra sau mỗi khoá".** Nếu có, nó phải dùng chung đề B với EXIT,
nên người học kiểm tra sau khoá JavaScript rồi đến cuối lộ trình sẽ gặp lại đúng bốn
câu đó — điểm EXIT bị thổi lên và con số tiến bộ mất giá trị. Sau mỗi khoá dùng
**quiz chương có sẵn**, hiển thị riêng, không tính vào hồ sơ.

### Hai con số hiển thị

```
delta = post − pre                   // trực giác: "tăng 35 điểm"
gain  = (post − pre) / (100 − pre)   // công bằng: "lấp được 70% khoảng thiếu"
```

`gain` cần thiết vì `delta` thô đối xử bất công với người xuất phát cao: từ 90 lên
95 chỉ được 5 điểm nhưng thực ra rất đáng kể.

Biên: `pre >= 100` → `gain = null`, hiển thị "đã thạo từ đầu". `post < pre` → `gain`
âm, vẫn hiển thị vì đó là tín hiệu thật.

### Sai số phải xây vào từ đầu

Với 4 câu mỗi kỹ năng và `p ≈ 0.5`, sai số chuẩn khoảng **25 điểm**. Sai số của hiệu
hai lần đo còn lớn hơn.

**API không được trình bày chênh lệch nhỏ hơn ~15 điểm như là "tiến bộ".** Trả về
`deltaSignificance: NOT_MEASURABLE | LIKELY | CLEAR` để giao diện nói "chưa đo được
thay đổi" thay vì "+8 điểm".

Báo cáo "+8 điểm" như một thành tích chính là thứ khiến người chấm mất tin vào cả
tính năng.

### Hai đề khó ngang nhau chỉ là giả định

Không kiểm chứng được trước khi có dữ liệu thật. Giảm nhẹ: mỗi câu ghi `timesAsked`
/ `timesCorrect` ngay từ đầu, sau vài chục lượt thi so `pValue` giữa hai đề sẽ biết
chúng lệch bao nhiêu. Ở phạm vi đồ án **không hiệu chỉnh**, chỉ ghi dữ liệu và nêu
rõ giới hạn khi báo cáo.

---

## 7. Ngân hàng câu hỏi

```
Sàng lọc:  7 khoá   × 2 câu × 2 đề (A/B)  =  28
Đào sâu:  16 kỹ năng × 4 câu × 2 đề       = 128
                                    tổng  = 156 câu
```

Lựa chọn thứ năm ("Tôi không biết") **không lưu thành dòng** — nó ứng với
`optionId = null` khi trả lời.

Soạn dưới dạng Markdown trong `content/assessments/`, một file mỗi kỹ năng, chứa cả
form A và B. Dùng lại pipeline đã có cho khoá học: parser, `stableId` + upsert, và
bộ `scripts/`.

Lý do không làm qua UI admin: đây là **nội dung của nền tảng, không phải của mentor**
— khác với khoá học, thứ mentor tự soạn và cần giao diện. Đề đánh giá do đội ngũ
Learnova kiểm soát, nên version-control trong repo là đúng chỗ, và soát duyệt qua
pull request thay vì sửa thẳng trên production.

### Về việc "chỉ đổi số liệu để đáp án khác đi"

Kỹ thuật này cho khả năng so sánh **tốt nhất có thể** — hai đề giống hệt cấu trúc nên
chắc chắn khó ngang nhau. Nhưng đo trên 204 câu quiz hiện có:

```
Câu có khối code trong đề     31/204  (15%)  → đổi số được
Câu hỏi "X nào..." ghi nhớ    73/204  (36%)  → không có số nào để đổi
Câu khái niệm, "vì sao"      100/204  (49%)  → không đổi số được
```

Chỉ 15% áp dụng được. Cách thực dụng cho phần còn lại:

| Nhóm | Cách tạo đề B |
|---|---|
| Có code (15%) | đổi số liệu |
| Ghi nhớ (36%) | **hỏi ngược** — `implements` dùng để làm gì? ↔ Từ khoá nào triển khai interface? |
| Khái niệm (49%) | soạn câu mới cùng khái niệm |

Đảo thứ tự A/B/C/D **không tính** — người ta nhớ nội dung đáp án, không nhớ chữ cái.

### Cạm bẫy nghiêm trọng nhất

Importer khoá học hiện **xoá sạch rồi tạo lại** `quiz_questions` mỗi lần seed. Nếu
importer đề đánh giá chép nguyên khuôn đó, ràng buộc `onDelete: Restrict` trên câu
trả lời sẽ khiến **`npm run db:seed` đổ ngay khi đã có một lượt làm bài** — kể cả
trên máy demo, giữa lúc đang demo.

Quy tắc bắt buộc:

- **Chỉ `upsert`, không bao giờ `deleteMany`.**
- Câu bị gỡ khỏi Markdown thì đặt `isRetired = true`, không xoá dòng.
- Importer **không được ghi** `timesAsked` / `timesCorrect` — đó là dữ liệu hệ thống
  tích luỹ, Markdown không sở hữu.
- Mỗi câu có `externalKey` dạng `js-func-a-02` để `stableId` bám vào một định danh
  sống sót qua mọi lần sửa nội dung.

---

## 8. Quy tắc toàn vẹn

- **Chấm điểm hoàn toàn ở server.** Client chỉ gửi `optionId`.
- **Không endpoint nào trả `isCorrect` khi bài chưa nộp.**
- **Giấu hết phản hồi ở bài đầu vào** — không hiện đúng/sai từng câu, không hiện
  giải thích, không hiện đáp án. Chỉ trả hồ sơ năng lực và lộ trình.

  Hiện giải thích ở đầu vào tức là đã dạy chính bài kiểm tra sẽ dùng để đo. Bài đầu
  vào là dụng cụ đo, không phải bài học — phản hồi đã có ở quiz từng bài.

- **Một lượt `ENTRY` cho mỗi mentee**, chặn ở cả hai tầng: service kiểm tra, và một
  partial unique index viết tay:

  ```sql
  CREATE UNIQUE INDEX assessment_attempts_one_submitted_entry
    ON assessment_attempts (mentee_id)
    WHERE kind = 'ENTRY' AND status = 'SUBMITTED';
  ```

- **Câu hỏi lấy ngẫu nhiên từ pool của kỹ năng**, nhưng cố định ngay khi tạo lượt —
  tải lại trang không đổi đề.
- **Điểm kỹ năng lưu dạng ảnh chụp bất biến.** Mỗi câu trả lời lưu kèm bản chụp
  `skillId` tại thời điểm được hỏi; phần chấm chỉ đọc cột đó, không join sang câu
  hỏi. Nếu không, gắn lại nhãn cho một câu sẽ viết lại điểm của mọi lượt thi cũ.
- **Mức (`NONE`/`BASIC`/`SOLID`) phải lưu, không tính lại lúc đọc** — đó là thứ người
  học đã được nói, chỉnh ngưỡng về sau không được phép viết lại lịch sử.

### Hướng gian lận thật sự

Lo "làm lại bài đầu vào sau khi đã học" là sai hướng — làm vậy chỉ nâng điểm nền và
**thu hẹp** mức tiến bộ.

Hướng tấn công thật là **cố tình trả lời sai ở đầu vào để thổi phồng độ tiến bộ**. Về
bản chất không chặn được. Ba lớp giảm nhẹ, xếp theo hiệu quả:

1. **Đừng cho người học biết sẽ có con số "tiến bộ"** trước khi làm bài đầu vào.
   Miễn phí, và triệt tiêu động cơ với phần lớn người dùng.
2. **Phát hiện điểm dưới mức đoán mò.** Được 1/28 khi sàn đoán mò là 25% *khó hơn*
   được 7/28. Tính xác suất đuôi nhị thức lúc chấm, gắn cờ `suspectedLowEffort` khi
   dưới ~1%, loại khỏi thống kê nhưng vẫn trả kết quả cho người học.
3. **Thời gian trả lời.** Trung vị dưới ~3 giây/câu kèm điểm dưới mức đoán mò gần như
   là kết luận chắc chắn.

---

## 9. Quiz bài học không tính vào hồ sơ

| | Quiz bài học (204 câu, đã có) | Bài đánh giá (156 câu, chưa soạn) |
|---|---|---|
| Mục đích | Củng cố sau khi đọc bài | Đo năng lực |
| Thời điểm | Ngay sau bài học | Đầu vào / cuối lộ trình |
| Đáp án | Xem được sau khi nộp | Không bao giờ lộ |
| Cách hỏi | Nhớ nội dung bài vừa đọc | Làm được việc đó không |

Trộn vào nhau phá vỡ khả năng so sánh: quiz bài học làm ngay sau khi đọc, mở sách,
làm lại được — điểm luôn cao một cách giả tạo.

**Nhưng vẫn nên ghi lại lượt làm quiz bài học.** Hiện **không có bảng nào** lưu việc
người dùng trả lời quiz, nên 204 câu đó mới chỉ là nội dung để đọc, chưa phải tính
năng. Thêm `LessonQuizAttempt` + `LessonQuizAnswer` (khoá theo `enrollmentId`, giống
`LessonProgress`) mở khoá ba thứ:

1. Phản hồi cho người học — vốn là mục đích của quiz.
2. Cửa xác nhận ở mục 5 phụ thuộc vào bảng này.
3. Luật hậu kiểm: *"bạn bỏ qua chương này nhưng làm sai quiz của nó — có muốn học
   lại không?"*

---

## 10. Còn lại phải làm

| GĐ | Nội dung | Trạng thái |
|---|---|---|
| 1 | `Skill` + `SkillChapter`, 16 kỹ năng, 26 chương, `pathOrder` | ✅ xong |
| 2 | Ngân hàng câu hỏi: schema, 1 kỹ năng mẫu, importer, `check-assessment` | chưa |
| 3 | `grading.service` + unit test (không cần DB) | chưa |
| 4 | Module NestJS + API, luật phân nhánh hai tầng | chưa |
| 5 | Soạn nốt 15 kỹ năng (~148 câu) | chưa |
| 6 | Lượt EXIT + endpoint so sánh tiến bộ | chưa |
| 7 | `LessonQuizAttempt` + luật hậu kiểm | chưa |

Giai đoạn 2–3 không phụ thuộc module Course. Giai đoạn 4 trở đi cần có module Course
trước để trang khoá học hiển thị được gợi ý bỏ qua.
