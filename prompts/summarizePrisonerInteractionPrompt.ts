
export const generateSummarizePrisonerInteractionPrompt = (log: string[]): string => {
    const logString = log.join('\n---\n');

    return `
Bạn là một AI tóm tắt viên, chuyên nghiệp trong việc chắt lọc những sự kiện chính từ một loạt các tương tác với một nhân vật.
Dưới đây là nhật ký chi tiết về một phiên tương tác với tù nhân.

**NHẬT KÝ CHI TIẾT:**
${logString}

**YÊU CẦU:**
Dựa vào nhật ký trên, hãy viết một đoạn văn **ngắn gọn** (khoảng 2-3 câu) tóm tắt lại kết quả chính của phiên tương tác. Tập trung vào:
1.  Mục tiêu chính của các hành động là gì (tra hỏi, thuyết phục, trừng phạt...).
2.  Kết quả chung (ví dụ: "ý chí của tù nhân đã bị lung lay", "mối quan hệ trở nên căng thẳng hơn", "thu được một vài thông tin hữu ích").

Mục tiêu là tạo ra một bản tóm tắt súc tích để ghi vào nhật ký chính của người chơi.
**QUAN TRỌNG:** Chỉ viết đoạn văn tóm tắt, không thêm lời dẫn, tag, hay tiêu đề nào khác.

**VÍ DỤ:**
Sau một hồi khuyên giải và chăm sóc, thái độ của tù nhân đã có chút thay đổi, sự phản kháng của hắn đã giảm đi và thiện cảm với bạn cũng tăng lên một chút, nhưng hắn vẫn chưa tiết lộ bí mật nào.
`;
};
