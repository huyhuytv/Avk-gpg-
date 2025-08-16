



import { KnowledgeBase, AuctionItem } from '../types';

export const runAuctionTurnPrompt = (kb: KnowledgeBase, item: AuctionItem, playerBid: number): string => {
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

    return `
Bạn là một Đấu Giá Sư bậc thầy trong một game nhập vai. Một lượt đấu giá đang diễn ra.

**BỐI CẢNH PHIÊN ĐẤU GIÁ:**
- **Vật phẩm:** "${item.name}" (${item.rarity}) - ${item.description} (Ký gửi bởi: ${item.ownerId === 'player' ? playerName : 'Nhà Đấu Giá'})
- **Giá cao nhất trước đó:** ${item.currentBid} ${currencyName}, người giữ giá là ${item.highestBidderId === 'player' ? playerName : (kb.discoveredNPCs.find(n => n.id === item.highestBidderId)?.name || kb.auctionState?.auctionNPCs.find(n => n.id === item.highestBidderId)?.name || 'Một người mua bí ẩn')}
- **Các đối thủ tiềm năng (NPC):**
    ${competingBidders.map(n => `- ${n.name} (có ${n.currency.toLocaleString()} ${currencyName})`).join('\n    ') || '- Không có đối thủ nào đáng chú ý.'}

**HÀNH ĐỘNG MỚI NHẤT:**
Người chơi **${playerName}** vừa ra một mức giá mới là **${playerBid} ${currencyName}**. Đây hiện là mức giá cao nhất.

**NHIỆM VỤ CỦA BẠN:**
1.  **Tạo Lời Bình Luận Sống Động:**
    *   Viết một lời bình luận hấp dẫn, kịch tính từ người điều khiển đấu giá để phản ứng lại mức giá mới của người chơi.
    *   Hãy để các NPC khác phản ứng quyết liệt! Họ có thể trả giá ngay lập tức để thể hiện sự quan tâm hoặc để dọa người chơi.
    *   Sử dụng tag **[MESSAGE: "Nội dung lời bình luận"]**. Lời bình luận có thể thể hiện sự ngạc nhiên, khích lệ, hoặc tạo áp lực cho các người mua khác.

2.  **Quyết Định Lượt Đấu Giá CỦA NPC (Tùy chọn):**
    *   Dựa vào giá trị vật phẩm, mức giá hiện tại, và "túi tiền" của các NPC, hãy quyết định xem có NPC nào sẽ **ngay lập tức** trả giá cao hơn không.
    *   **Logic gợi ý:** NPC có thể trả giá ngay nếu mức giá mới của người chơi vẫn còn rất hời. NPC có nhiều tiền và tính cách "Khoe khoang" hoặc "Quyết đoán" sẽ dễ trả giá hơn.
    *   Nếu một NPC quyết định trả giá, hãy tạo tag **[NPC_BID: npcName="Tên NPC", bidAmount=SốTiềnMới]**. Mức giá mới phải cao hơn \`${playerBid}\` một cách hợp lý (ví dụ: tăng 5-15%).
    *   **QUAN TRỌNG:** Chỉ có TỐI ĐA MỘT NPC được trả giá trong lượt này. Nếu không có NPC nào trả giá ngay, AI sẽ chờ hệ thống gọi giá sau 20 giây.

3.  **CẤM SỬ DỤNG:** Không được sử dụng tag [AUCTION_SOLD] trong phản hồi này.

**VÍ DỤ KẾT QUẢ 1 (NPC trả giá ngay lập tức):**
[MESSAGE: "Một mức giá đáng kinh ngạc từ ${playerName}! ${playerBid} ${currencyName}! Liệu có ai dám theo không? ... Khoan đã! Lý Phú Hộ không chút do dự giơ bảng của mình lên!"]
[NPC_BID: npcName="Lý Phú Hộ", bidAmount=${Math.floor(playerBid * 1.1)}]

**VÍ DỤ KẾT QUẢ 2 (Không có NPC nào trả giá ngay):**
[MESSAGE: "${playerBid} ${currencyName}! Một mức giá rất cao! Có vẻ như những người khác đang phải suy nghĩ. Chúng ta sẽ chờ xem..."]
`;
};