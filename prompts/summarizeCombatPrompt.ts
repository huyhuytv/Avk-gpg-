
import { VIETNAMESE } from '../constants';

export const generateSummarizeCombatPrompt = (
    combatLog: string[],
    outcome: 'victory' | 'defeat' | 'escaped' | 'surrendered'
): string => {
  const outcomeText = 
    outcome === 'victory' ? "Thắng Lợi" :
    outcome === 'defeat' ? "Thất Bại" :
    outcome === 'escaped' ? "Bỏ Chạy" : "Đầu Hàng";
    
  const logString = combatLog.join('\n---\n');

  return `
Bạn là một người kể chuyện bậc thầy, chuyên tóm tắt lại những trận chiến hoành tráng trong một game nhập vai.
Dưới đây là nhật ký chi tiết của một trận đấu vừa kết thúc.

**KẾT QUẢ CUỐI CÙNG:** ${outcomeText}

**NHẬT KÝ CHI TIẾT TRẬN ĐẤU:**
${logString}

**YÊU CẦU:**
Dựa vào nhật ký trên, hãy viết một đoạn văn (khoảng 5-10 câu) tóm tắt lại toàn bộ diễn biến trận đấu một cách hấp dẫn, kịch tính và súc tích. Tập trung vào những khoảnh khắc quan trọng nhất:
- Ai đã ra đòn quyết định?
- Trận đấu diễn ra căng thẳng hay một chiều?
- Có sự kiện bất ngờ nào xảy ra không?
- Cảm xúc chung sau trận chiến là gì (hào hùng, bi tráng, may mắn, v.v.)?

**QUAN TRỌNG:** Chỉ viết đoạn văn tóm tắt. KHÔNG thêm bất kỳ lời dẫn, tag, hay tiêu đề nào khác.
`;
};
