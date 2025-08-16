
export const generateSummarizeCompanionInteractionPrompt = (log: string[]): string => {
    const logString = log.join('\n---\n');

    return `
Bạn là một AI tóm tắt viên, chuyên nghiệp trong việc chắt lọc những sự kiện chính từ một loạt các tương tác tình cảm.
Dưới đây là nhật ký chi tiết về một phiên tương tác với một người bạn đồng hành (đạo lữ/nô lệ).

**NHẬT KÝ CHI TIẾT:**
${logString}

**YÊU CẦU:**
Dựa vào nhật ký trên, hãy viết một đoạn văn **ngắn gọn** (khoảng 2-3 câu) tóm tắt lại kết quả chính của phiên tương tác. Tập trung vào:
1.  Bản chất của các hành động là gì (tâm sự, tặng quà, thân mật...).
2.  Sự thay đổi trong mối quan hệ (ví dụ: "tình cảm càng thêm sâu đậm", "hiểu nhau hơn", "có chút ghen tuông nhẹ").

Mục tiêu là tạo ra một bản tóm tắt súc tích để ghi vào nhật ký chính của người chơi.
**QUAN TRỌNG:** Chỉ viết đoạn văn tóm tắt, không thêm lời dẫn, tag, hay tiêu đề nào khác.

**VÍ DỤ:**
Bạn đã có một khoảng thời gian ấm áp bên cạnh đạo lữ của mình, cùng nhau trò chuyện và tặng quà, khiến cho tình cảm của cả hai càng thêm bền chặt.
`;
};
