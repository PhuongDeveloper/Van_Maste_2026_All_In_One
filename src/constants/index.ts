import type { UserData } from '../types';

export const SYSTEM_PROMPT = `Bạn là "Văn Master 2026", gia sư Ngữ Văn.
QUY TẮC BẮT BUỘC:
1. Tối đa 80 từ mỗi câu trả lời — KHÔNG vượt quá.
2. KHÔNG dùng emoji. KHÔNG dùng ký tự * hoặc ** để in đậm.
3. Thẳng vào vấn đề, không dài dòng, không chào hỏi lại.
4. ĐỒ HỌA (timeline, sơ đồ): dùng [TIMELINE] Thời gian | Sự kiện | Mô tả.
5. TÓM TẮT TÁC PHẨM / THÔNG TIN NHANH: dùng [INFOGRAPHIC] tên_tác_phẩm [/INFOGRAPHIC]. Chỉ dùng khi user yêu cầu tóm tắt hoặc giới thiệu một tác phẩm.
6. ĐỀ THI: dùng [EXAM_PAPER] nội dung [/EXAM_PAPER].
7. TRẮC NGHIỆM: A. B. C. D. rõ ràng — trên từng dòng riêng.
8. Dùng gạch đầu dòng "-" thay cho in đậm khi liệt kê.`;

export const INFOGRAPHIC_TRIGGER = '[INFOGRAPHIC]';

/** Prompt dùng khi AI chủ động hỏi sau inactivity */
export const PROACTIVE_PROMPT = `Dựa vào lịch sử chat bên dưới, hãy đặt 1 câu hỏi ngắn (tối đa 25 từ) để gợi ý bước tiếp theo cho học sinh. KHÔNG chào hỏi, KHÔNG tóm tắt lại, chỉ hỏi thẳng câu gợi ý hành động cụ thể. Ví dụ: "Em có muốn thầy ra một đề tập viết về chủ đề này không?" hoặc "Em còn thắc mắc phần nào về đoạn vừa học không?".`;

/** Prompt sinh đề trắc nghiệm chuẩn đoán 10 câu — trả về JSON thuần */
export const QUIZ_GENERATION_PROMPT = `Bạn là gia sư Ngữ Văn. Hãy tạo một bài kiểm tra trắc nghiệm chuẩn đoán năng lực đọc hiểu Ngữ Văn lớp 12.

YÊU CẦU:
- Chọn 1 đoạn trích ngắn (150-250 chữ) từ một tác phẩm văn học Việt Nam có trong chương trình THPT (nêu rõ tên tác phẩm, tác giả).
- Tạo đúng 10 câu hỏi trắc nghiệm từ dễ đến khó, đúng chuẩn đề đọc hiểu THPTQG (hỏi về: nội dung chính, từ ngữ, biện pháp tu từ, thể loại, chủ đề, thái độ tác giả...).
- Mỗi câu có 4 đáp án A, B, C, D. Chỉ 1 đáp án đúng.

ĐỊNH DẠNG — trả về JSON THUẦN, không có markdown, không có \`\`\`:
{
  "passage": "Nội dung đoạn trích...",
  "source": "Trích từ [Tên tác phẩm] — [Tác giả]",
  "questions": [
    {
      "q": "Nội dung câu hỏi?",
      "a": "Đáp án A",
      "b": "Đáp án B",
      "c": "Đáp án C",
      "d": "Đáp án D",
      "correct": "a"
    }
  ]
}`;

export const DEFAULT_USER_DATA: UserData = {
  level: 'Tân Binh',
  status: 'Sẵn sàng chiến',
  progress: 5,
  xp: 0,
  streak: 1,
  daysLeft: 0,
};

export const EXAM_DATE = '2026-06-25';

export const MAX_TTS_LENGTH = 600;

export const CHAT_HISTORY_LIMIT = 4;

export const DAILY_QUOTE = 'Văn học là nhân học. Học văn là học làm người.';

/** Số đề thi hiện có trong public/dethi/ (1.docx → N.docx) */
export const EXAM_COUNT = 5;

/** TTS voice names */
export const TTS_VOICE_MAP = {
  female: 'vi-VN-Wavenet-C',
  male: 'vi-VN-Wavenet-D',
} as const;

/** Pronoun based on voice gender */
export const PRONOUN_MAP = {
  female: 'cô',
  male: 'thầy',
} as const;

export const ONBOARDING_WELCOME_TEMPLATE = (name: string, pronoun: string) =>
  `Xin chào **${name}**! ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} là gia sư Ngữ Văn sẽ đồng hành cùng em.

Em đang đặt mục tiêu bao nhiêu điểm trong kỳ thi tốt nghiệp? (Thang điểm 10)`;

export const DIAGNOSTIC_QUIZ_PROMPT = `Bạn là Văn Master, chuyên tạo các bài kiểm tra chẩn đoán Ngữ Văn 9+.

PHẦN KIỂM TRA CHẨN ĐOÁN:
Hãy tạo 5 câu trắc nghiệm kiểm tra kiến thức cơ bản về Ngữ Văn cho học sinh lớp 12:
- Câu 1: Về tác phẩm văn học cổ điển
- Câu 2: Về nghĩa từ ngữ
- Câu 3: Về kỹ thuật sáng tác
- Câu 4: Về phân tích chi tiết
- Câu 5: Về nhận xét tác phẩm

Mỗi câu có 4 đáp án A, B, C, D. Sau khi người dùng trả lời, bạn sẽ:
1. Chấm điểm từng câu
2. Tính tỉ lệ % các lỗi sai
3. Đưa ra lộ trình học tập cụ thể dựa trên điểm:
   - 80-100%: Lộ trình nâng cao (chuyên sâu các tác phẩm khó)
   - 60-79%: Lộ trình chuẩn (ôn lý thuyết, làm bài tập)
   - 40-59%: Lộ trình cơ bản (học lại kiến thức nền tảng)
   - Dưới 40%: Lộ trình căn bản (học từ đầu, làm quen với các tác phẩm)`;
