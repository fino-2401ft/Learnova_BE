import { CourseStatus } from '@prisma/client';

/**
 * Ai được sửa gì, khi nào.
 *
 * Luật trung tâm của module soạn thảo. Tách ra một chỗ vì mọi endpoint ghi đều
 * phải hỏi nó, và một endpoint quên hỏi là một lỗ hổng.
 *
 * HAI TRỤC ĐỘC LẬP, đừng gộp:
 *
 *   1. TRẠNG THÁI KHOÁ  — chỉ `PENDING_APPROVAL` khoá cứng. Sửa trong lúc người
 *      duyệt đang đọc là đổi bài dưới chân họ, và quyết định duyệt sẽ nói về một
 *      bản khác với bản được lưu.
 *
 *   2. TIẾN ĐỘ HỌC VIÊN — thứ thật sự cần bảo vệ. Không nằm ở đây mà ở
 *      `AuthoringService`, vì nó là câu hỏi về TỪNG BÀI chứ không phải về khoá.
 *
 * Bản trước khoá toàn bộ khoá `PUBLISHED`, kể cả sửa một lỗi chính tả trong bài.
 * Đó là nhầm hai trục làm một: sửa nội dung một bài không đụng tới `lessonId` và
 * không đổi tổng số bài, nên tiến độ của học viên không hề suy suyển. Chỉ XOÁ mới
 * phá dữ liệu của họ — và xoá được chặn riêng, theo từng đối tượng.
 */

/** Đang chờ duyệt thì mọi thứ đóng băng. Ngoài ra đều sửa được. */
function unlocked(status: CourseStatus): boolean {
  return status !== CourseStatus.PENDING_APPROVAL;
}

/** Tiêu đề, mô tả, cấp độ, ảnh bìa của khoá. */
export const canEditMetadata = unlocked;

/**
 * Nội dung bài: các mục và bộ câu hỏi.
 *
 * Cho phép cả với khoá đã xuất bản. Sửa chữ trong một bài không đổi `lessonId`,
 * không đổi số bài, nên không học viên nào tụt tiến độ vì việc đó. Đây chính là
 * cách sửa lỗi chính tả và cập nhật nội dung lỗi thời.
 */
export const canEditContent = unlocked;

/**
 * Thêm chương/bài, đổi tên, sắp lại thứ tự.
 *
 * Thêm bài vào khoá đã xuất bản làm phần trăm hoàn thành của mọi học viên tụt
 * xuống — nhưng đó là điều đúng: khoá dài ra thật thì họ học chưa xong thật. Giao
 * diện có trách nhiệm nói trước điều này.
 *
 * Đổi tên và sắp thứ tự thì vô hại hoàn toàn: `lesson_progress` khoá theo
 * `lessonId`, không theo tên hay `orderIndex`.
 */
export const canEditStructure = unlocked;

/** Nộp duyệt. REJECTED nộp lại được sau khi sửa. */
export function canSubmit(status: CourseStatus): boolean {
  return status === CourseStatus.DRAFT || status === CourseStatus.REJECTED;
}

/**
 * Xoá hẳn khoá.
 *
 * Trạng thái chỉ là điều kiện đầu. Điều kiện thật là "chưa ai ghi danh" — kiểm ở
 * service, vì đó là câu hỏi về dữ liệu chứ không phải về trạng thái.
 */
export function canDelete(status: CourseStatus): boolean {
  return unlocked(status);
}

/** Câu giải thích khi khoá bị đóng băng. */
export const LOCK_REASON: Record<CourseStatus, string> = {
  [CourseStatus.DRAFT]: '',
  [CourseStatus.REJECTED]: '',
  [CourseStatus.PUBLISHED]: '',
  [CourseStatus.PENDING_APPROVAL]:
    'Khoá học đang chờ duyệt nên tạm khoá. Chờ kết quả duyệt rồi sửa tiếp.',
};
