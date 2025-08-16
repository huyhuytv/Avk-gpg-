




import { KnowledgeBase, AuctionItem } from '../types';

export const runAuctioneerCallPrompt = (kb: KnowledgeBase, item: AuctionItem, callCount: number): string => {
    // Combine temporary auction NPCs and real discovered NPCs into a single list of potential bidders
    const allPotentialBidders = [
        ...(kb.auctionState?.auctionNPCs || []),
        ...kb.discoveredNPCs.map(n => ({ id: n.id, name: n.name, realm: n.realm, currency: n.stats?.currency || 0}))
    ];
    
    const competingBidders = allPotentialBidders.filter(npc => 
        npc.currency > item.currentBid &&
        (kb.auctionState?.auctionNPCs.some(anpc => anpc.id === npc.id) || (kb.discoveredNPCs.find(dnpc => dnpc.id === npc.id)?.vendorType !== 'Auctioneer'))
    );
    const currencyName = kb.worldConfig?.currencyName || "Tiền";
    const playerName = kb.worldConfig?.playerName || 'Người Chơi';

    const callText = callCount === 1 ? "lần thứ nhất" : callCount === 2 ? "lần thứ hai" : "lần cuối cùng";

    return `
Bạn là một Đấu Giá Sư bậc thầy trong một game nhập vai. Đã 20 giây trôi qua mà không có ai trả giá thêm. Bạn cần phải hô giá để thúc đẩy phiên đấu giá.

**BỐI CẢNH PHIÊN ĐẤU GIÁ:**
- **Vật phẩm:** "${item.name}" (${item.rarity}) - ${item.description} (Ký gửi bởi: ${item.ownerId === 'player' ? playerName : 'Nhà Đấu Giá'})
- **Giá cao nhất hiện tại:** ${item.currentBid} ${currencyName}, người giữ giá là **${item.highestBidderId === 'player' ? playerName : (kb.discoveredNPCs.find(n => n.id === item.highestBidderId)?.name || kb.auctionState?.auctionNPCs.find(n => n.id === item.highestBidderId)?.name || 'Một người mua bí ẩn')}**.
- **Lần hô giá này là:** ${callText} (Lần hô thứ ${callCount}/3).
- **Các đối thủ tiềm năng (NPC) còn lại:**
    ${competingBidders.map(n => `- ${n.name} (có ${n.currency.toLocaleString()} ${currencyName})`).join('\n    ') || '- Không có đối thủ nào đáng chú ý.'}

**NHIỆM VỤ CỦA BẠN:**
1.  **Tạo Lời Hô Giá Kịch Tính:**
    *   Viết một lời hô giá kịch tính, tạo cảm giác gấp rút. Đây là cơ hội cuối cùng! Một trong các NPC có thể quyết định ra giá vào phút chót để giành lấy bảo vật.
    *   Sử dụng tag **[MESSAGE: "Nội dung lời hô giá"]**. Ví dụ: "Vậy giá hiện tại là ${item.currentBid} ${currencyName}, đi ${callText}!... Có ai trả giá cao hơn không?"

2.  **Quyết Định Lượt Đấu Giá CỦA NPC (Tùy chọn, CƠ HỘI CUỐI CÙNG):**
    *   Nếu một NPC quyết định trả giá, hãy tạo tag **[NPC_BID: npcName="Tên NPC", bidAmount=SốTiềnMới]**. Mức giá mới phải cao hơn \`${item.currentBid}\`.
    *   Nếu không có NPC nào trả giá, chỉ cần trả về tag [MESSAGE].

3.  **CẤM SỬ DỤNG:** Không được sử dụng tag [AUCTION_SOLD] trong phản hồi này. Hệ thống sẽ tự xử lý việc bán vật phẩm nếu đây là lần gọi cuối cùng mà không có ai trả giá.

**VÍ DỤ KẾT QUẢ 1 (NPC trả giá vào phút chót):**
[MESSAGE: "Giá hiện tại là ${item.currentBid} ${currencyName}, đi ${callText}!... Khoan đã! Ở góc phòng, một vị khách bí ẩn vừa ra giá!"]
[NPC_BID: npcName="Hắc Y Nhân", bidAmount=${Math.floor(item.currentBid * 1.05)}]

**VÍ DỤ KẾT QUẢ 2 (Không có NPC nào trả giá):**
[MESSAGE: "Vậy ${item.currentBid} ${currencyName}, ${callText}! Không còn ai sao? Một bảo vật sắp có chủ mới!"]
`;
};