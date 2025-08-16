// src/prompts/analyzeStylePrompt.ts

export const generateAnalyzeStylePrompt = (textToAnalyze: string): string => {
  return `
Bạn là một chuyên gia phân tích văn học và là một kỹ sư prompt cho AI. Nhiệm vụ của bạn là phân tích sâu đoạn văn bản dưới đây và cung cấp hai phần kết quả rõ ràng.

**VĂN BẢN CẦN PHÂN TÍCH:**
"""
${textToAnalyze}
"""

**YÊU CẦU:**
Hãy trả về kết quả theo ĐÚNG định dạng sau, không thêm bất kỳ lời dẫn hay giải thích nào khác:

[ANALYSIS_START]
**Phân Tích Chi Tiết Văn Phong:**
*   **Tông màu & Cảm xúc:** (Ví dụ: Lạnh lùng, bi tráng, hài hước, châm biếm, lãng mạn...)
*   **Nhịp điệu & Tốc độ:** (Ví dụ: Nhanh, dồn dập, chậm rãi, khoan thai, lúc nhanh lúc chậm...)
*   **Từ vựng sử dụng:** (Ví dụ: Giàu hình ảnh, sử dụng nhiều từ Hán Việt, ngôn ngữ đời thường, từ ngữ cổ trang, thuật ngữ chuyên ngành...)
*   **Cấu trúc câu:** (Ví dụ: Câu ngắn, súc tích; câu dài, phức tạp, nhiều mệnh đề phụ; câu đảo ngữ...)
*   **Góc nhìn & Giọng văn:** (Ví dụ: Ngôi thứ nhất, nội tâm sâu sắc; ngôi thứ ba toàn tri, giọng văn khách quan; giọng văn mỉa mai...)
[ANALYSIS_END]

[SUMMARY_PROMPT_START]
(Đây là một đoạn prompt ngắn gọn, súc tích, được viết để ra lệnh cho một AI khác bắt chước văn phong đã phân tích. Bắt đầu bằng "Hãy viết theo văn phong..." và mô tả các đặc điểm cốt lõi nhất.)
[SUMMARY_PROMPT_END]
`;
};
