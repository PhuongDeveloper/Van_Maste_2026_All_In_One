import type { UserData } from '../types';

export const SYSTEM_PROMPT = `Bạn là "Văn Master 2026", trợ lý học tập vui tính.
QUY TẮC:
1. ĐỒ HỌA: Dùng định dạng [TIMELINE] Thời gian | Sự kiện | Mô tả.
2. ẢNH: Dùng [GEN_IMAGE] mô tả tiếng Anh.
3. ĐỀ THI: Dùng [EXAM_PAPER] nội dung [/EXAM_PAPER].
4. TRẮC NGHIỆM: A. B. C. D. rõ ràng.`;

export const DEFAULT_USER_DATA: UserData = {
    level: 'Tân Binh',
    status: 'Sẵn sàng chiến',
    progress: 5,
    xp: 0,
    streak: 1,
    daysLeft: 0,
};

export const EXAM_DATE = '2026-06-25';

export const MAX_TTS_LENGTH = 500;

export const CHAT_HISTORY_LIMIT = 2;

export const DAILY_QUOTE = 'Văn học là nhân học. Học văn là học làm người.';

export const WELCOME_MESSAGE = "Yo! Master đây! Mình đã 'tân trang' giao diện cực cháy cho bạn rồi. Thử ngay: 'Tóm tắt bài Vợ Nhặt' để xem đồ họa mới nhé! 🔥";

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
