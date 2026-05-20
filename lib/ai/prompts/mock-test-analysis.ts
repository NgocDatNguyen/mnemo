/**
 * Prompt templates for mock test analysis.
 *
 * The system prompt anchors role. The per-test-type prompt steers what to look
 * for in Reading vs Writing. We keep them short — long prompts increase token
 * cost and rarely improve Gemini 2.5 Flash output quality on this task. The
 * Zod-typed output schema does most of the constraining work.
 */

export const SYSTEM_PROMPT =
	"Bạn là chuyên gia IELTS phân tích bài thi của học viên Việt Nam (đang ở band 6.5, mục tiêu 7.0–7.5). Mục tiêu của bạn: tạo phân tích cấu trúc giúp học viên hiểu điểm yếu và luyện tập có hiệu quả. Trả lời theo schema được cung cấp. Các trường tiếng Việt phải dùng tiếng Việt; thuật ngữ IELTS giữ tiếng Anh (ví dụ: 'collocation', 'task response', 'matching headings').";

const READING_INSTRUCTIONS = `Phân tích bài thi IELTS Reading sau:

1. Trích xuất nội dung bài làm (extracted_text): câu trả lời học viên ghi cho từng câu hỏi, kèm số câu nếu có.
2. Xác định total_questions (tổng câu hỏi trong bài) và correct_count (số câu đúng). Nếu ảnh không cho thấy đáp án chuẩn, đặt correct_count = 0 và thêm quality_warning type "partial_answers".
3. Với mỗi câu sai, suy luận lý do (gap từ vựng, miss skimming, sai inference, hiểu sai paraphrase, v.v.).
4. Nhóm lỗi thành tối đa 8 cluster theo type:
   - vocabulary: gap từ vựng / hiểu sai nghĩa
   - grammar: cấu trúc câu, thì, đại từ
   - collocation: cụm từ đi kèm
   - reading_skill: skimming, scanning, inference, paraphrase recognition
5. Mỗi cluster phải có 1–5 examples với user_error (đáp án của học viên), correction (đáp án đúng), và explanation_vi (giải thích ngắn gọn bằng tiếng Việt tại sao lỗi này xảy ra).
6. Mỗi cluster cần suggested_practice_vi: 1–2 câu hướng dẫn ôn tập cụ thể bằng tiếng Việt.
7. band_estimate: ước tính band 0–9 nếu suy luận được từ correct_count/total_questions; null nếu không đủ dữ liệu.
8. Nếu ảnh mờ, chữ viết khó đọc, hoặc bài không phải tiếng Anh, thêm quality_warning phù hợp.
9. test_type_confirmed phải là "reading".`;

const WRITING_INSTRUCTIONS = `Phân tích bài thi IELTS Writing sau:

1. Xác định task: Task 1 (mô tả biểu đồ / quy trình / thư) hoặc Task 2 (essay luận điểm).
2. Trích xuất nội dung học viên đã viết vào extracted_text (giữ nguyên lỗi).
3. total_questions = 1 (mỗi bài Writing là một task). correct_count = 0 (Writing không chấm theo đáp án đúng/sai).
4. Liệt kê lỗi cụ thể theo type:
   - grammar: lỗi ngữ pháp (article, tense, agreement, word form, v.v.)
   - vocabulary: từ dùng sai nghĩa, từ lặp, lexical resource yếu
   - collocation: cụm từ đi kèm không tự nhiên
   - writing_skill: coherence, cohesion, paragraphing, linking
   - task_response: trả lời lệch đề, thiếu argument, thiếu support
5. Tối đa 8 cluster, ưu tiên cluster ảnh hưởng band nhất.
6. Mỗi cluster cần 1–5 examples (user_error là cụm/câu cụ thể học viên viết, correction là sửa lại, explanation_vi giải thích bằng tiếng Việt).
7. Mỗi cluster cần suggested_practice_vi.
8. band_estimate: ước tính band 0–9 dựa trên Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy; null nếu bài quá ngắn để chấm.
9. Nếu chữ viết tay khó đọc hoặc bài không phải tiếng Anh, thêm quality_warning phù hợp.
10. test_type_confirmed phải là "writing".`;

export function buildAnalysisUserPrompt(testType: "reading" | "writing"): string {
	return testType === "reading" ? READING_INSTRUCTIONS : WRITING_INSTRUCTIONS;
}
