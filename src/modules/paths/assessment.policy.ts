/**
 * Mọi con số quyết định cách bài kiểm tra đầu vào hoạt động, gom về một chỗ.
 *
 * Hàm thuần, không I/O, không phụ thuộc Nest — đây là phần dễ bị tranh luận và chỉnh
 * đi chỉnh lại nhất ("80% có chặt quá không?"), nên nó phải đọc được và thử được mà
 * không cần dựng cả module.
 */

/** Số câu hỏi bốc cho mỗi kỹ năng.
 *
 *  Ba là mức ít nhất mà điểm còn phân biệt được: với hai câu, thang điểm chỉ có
 *  0/50/100% và một câu sai vì đọc vội đã kéo người học từ "bỏ qua được" xuống "phải
 *  học lại từ đầu". Với ba câu, ngưỡng 80% nghĩa là phải đúng cả ba. */
export const QUESTIONS_PER_SKILL = 3;

/**
 * Tỷ lệ đúng tối thiểu để được bỏ qua các chương của một kỹ năng.
 *
 * 0.8 với 3 câu nghĩa là ĐÚNG CẢ BA. Chặt có chủ ý: bỏ nhầm một chương người học chưa
 * biết thì họ mất kiến thức nền và không biết mình mất, còn bắt học lại một chương đã
 * biết thì chỉ tốn thời gian và họ tự lướt nhanh được. Hai sai lầm không cân nhau.
 */
export const MASTERY_THRESHOLD = 0.8;

/** Điểm một kỹ năng, dạng 0…1. Kỹ năng không có câu nào tính là 0 — không có bằng
 *  chứng thì không được bỏ qua. */
export function skillRatio(correct: number, total: number): number {
  return total === 0 ? 0 : correct / total;
}

export function hasMastered(correct: number, total: number): boolean {
  return skillRatio(correct, total) >= MASTERY_THRESHOLD;
}

/**
 * Bốc ngẫu nhiên tối đa `count` phần tử.
 *
 * Fisher–Yates trên một bản sao. KHÔNG dùng `sort(() => Math.random() - 0.5)`: hàm so
 * sánh không nhất quán làm thuật toán sắp xếp cho ra phân phối lệch, và với mảng ngắn
 * thì một số phần tử gần như không bao giờ được chọn — nghĩa là vài câu hỏi trong
 * ngân hàng sẽ không bao giờ xuất hiện.
 */
export function pickRandom<T>(items: readonly T[], count: number): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, count);
}
