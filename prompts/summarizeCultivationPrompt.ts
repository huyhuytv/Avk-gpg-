
export const generateSummarizeCultivationPrompt = (cultivationLog: string[]): string => {
    const logString = cultivationLog.join('\n---\n');

    return `
Bạn là một AI tóm tắt viên, chuyên nghiệp trong việc chắt lọc những sự kiện chính từ một quá trình tu luyện dài.
Dưới đây là nhật ký chi tiết về một phiên tu luyện của người chơi.

**NHẬT KÝ CHI TIẾT BUỔI TU LUYỆN:**
${logString}

**YÊU CẦU:**
Dựa vào nhật ký trên, hãy viết một đoạn văn **ngắn gọn** (khoảng 2-3 câu) tóm tắt lại kết quả chính của buổi tu luyện. Tập trung vào:
1.  Mục tiêu tu luyện là gì (tăng kinh nghiệm hay luyện kỹ năng).
2.  Kết quả đạt được (ví dụ: "tu vi tăng mạnh", "kỹ năng ... trở nên thuần thục hơn", "mối quan hệ với ... càng thêm thân thiết").
3.  Cảm nhận chung (ví dụ: "thu hoạch颇丰", "tiến triển chậm chạp", "gặp chút trở ngại nhưng đã vượt qua").

Mục tiêu là tạo ra một bản tóm tắt súc tích để ghi vào nhật ký chính của người chơi.
**QUAN TRỌNG:** Chỉ viết đoạn văn tóm tắt, không thêm lời dẫn, tag, hay tiêu đề nào khác.

**VÍ DỤ:**
Sau một thời gian bế quan, bạn cảm thấy linh lực trong cơ thể trở nên tinh thuần hơn, tu vi cũng có chút tiến triển. Kỹ năng "Hỏa Cầu Thuật" đã được bạn nắm vững hơn một bậc.
`;
};
