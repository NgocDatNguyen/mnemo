import type { WeaknessCluster } from "@/lib/db/types";
import { CARD_COUNT_FLOOR, CARD_COUNT_TARGET } from "../schemas/cards";

export const CARD_GEN_SYSTEM_PROMPT = `Bạn là trợ lý tạo flashcard cho người Việt học IELTS (Reading + Writing), mục tiêu band 6.5 lên 7.0-7.5.

Nhiệm vụ: từ danh sách điểm yếu (weakness clusters) đã phân tích từ bài thi thử của học viên, tạo flashcard nhắm đúng những điểm yếu đó.

Nguyên tắc:
- Mỗi flashcard test ĐÚNG MỘT đơn vị kiến thức (atomic). Không nhồi nhiều ý vào một thẻ.
- Mặt trước (front) ngắn gọn, rõ ràng. Mặt sau (back) là đáp án chính xác.
- Dùng "context" cho câu ví dụ hoặc ngữ cảnh sử dụng khi cần.
- Loại "cloze": mặt trước chứa câu có chỗ trống dạng {{c1::từ-bị-ẩn}}; chỉ ẩn từ nội dung (content word), không ẩn stop word (a, the, is, of...).
- Loại "basic": câu hỏi/đáp án thường (vd từ vựng, collocation, sửa lỗi ngữ pháp).
- "source_reference": ghi theme của cluster gốc để truy vết.
- Ngữ cảnh tiếng Việt khi giải thích, nhưng nội dung học là tiếng Anh.
- Anti-hallucination: nếu không chắc, BỎ QUA, không bịa. Thà ít thẻ chất lượng còn hơn nhiều thẻ sai.
- KHÔNG tạo thẻ trùng lặp nội dung.

Ví dụ thẻ tốt:

Thẻ "basic" (collocation):
{
  "type": "basic",
  "front": "Collocation: ___ a decision (đưa ra quyết định, trang trọng)",
  "back": "make a decision",
  "context": "The board will make a decision next week.",
  "source_reference": "collocation: decision verbs"
}

Thẻ "cloze" (ẩn content word, KHÔNG ẩn stop word):
{
  "type": "cloze",
  "front": "The number of tourists rose {{c1::sharply}} in 2023.",
  "back": "sharply",
  "context": "sharply = mạnh, đột ngột — dùng mô tả xu hướng tăng/giảm.",
  "source_reference": "vocabulary: trend adverbs"
}`;

export function buildCardGenPrompt(
	clusters: WeaknessCluster[],
	level: { current: number; target: number },
): string {
	const clusterText = clusters
		.map((c, i) => {
			const examples = c.examples
				.map((e) => `    - Lỗi: "${e.user_error}" → Đúng: "${e.correction}" (${e.explanation_vi})`)
				.join("\n");
			return `[${i + 1}] ${c.type} — "${c.theme}" (mức độ: ${c.severity})\n  Ví dụ:\n${examples}\n  Gợi ý luyện: ${c.suggested_practice_vi}`;
		})
		.join("\n\n");

	return `Trình độ học viên: band hiện tại ~${level.current}, mục tiêu ${level.target}.

Các điểm yếu cần nhắm tới:

${clusterText}

Tạo từ ${CARD_COUNT_FLOOR} đến ${CARD_COUNT_TARGET} flashcard nhắm vào các điểm yếu trên. Ưu tiên cluster mức độ "major" trước. Mỗi thẻ phải atomic và không trùng lặp. Nếu chỉ tạo được ít thẻ chất lượng, vẫn phải đạt tối thiểu ${CARD_COUNT_FLOOR} thẻ.`;
}
