
import { KnowledgeBase, AuctionSlave } from '../types';

export const runSlaveAuctionTurnPrompt = (kb: KnowledgeBase, item: AuctionSlave, playerBid: number): string => {
    const allPotentialBidders = [
        ...(kb.slaveAuctionState?.auctionNPCs || []),
        ...kb.discoveredNPCs.map(n => ({ id: n.id, name: n.name, realm: n.realm, currency: n.stats?.currency || 0 }))
    ];

    const competingBidders = allPotentialBidders.filter(npc => 
        npc.currency > item.currentBid &&
        (kb.slaveAuctionState?.auctionNPCs.some(anpc => anpc.id === npc.id) || (kb.discoveredNPCs.find(dnpc => dnpc.id === npc.id)?.vendorType !== 'Auctioneer'))
    );
    
    const currencyName = kb.worldConfig?.currencyName || "Tiền";
    const playerName = kb.worldConfig?.playerName || 'Người Chơi';

    return `
Bạn là một Đấu Giá Sư chuyên điều hành các phiên đấu giá Nô Lệ. Một lượt đấu giá đang diễn ra.

**BỐI CẢNH PHIÊN ĐẤU GIÁ:**
- **"Vật phẩm":** Nô lệ "${item.name}" (Cảnh giới: ${item.realm}, Tư chất: ${item.tuChat}) - ${item.description}
- **Giá cao nhất trước đó:** ${item.currentBid} ${currencyName}, người giữ giá là ${item.highestBidderId === 'player' ? playerName : (kb.discoveredNPCs.find(n => n.id === item.highestBidderId)?.name || kb.slaveAuctionState?.auctionNPCs.find(n => n.id === item.highestBidderId)?.name || 'Một người mua bí ẩn')}
- **Các đối thủ tiềm năng (NPC):**
    ${competingBidders.map(n => `- ${n.name} (có ${n.currency.toLocaleString()} ${currencyName})`).join('\n    ') || '- Không có đối thủ nào đáng chú ý.'}

**HÀNH ĐỘNG MỚI NHẤT:**
Người chơi **${playerName}** vừa ra một mức giá mới là **${playerBid} ${currencyName}**. Đây hiện là mức giá cao nhất.

**NHIỆM VỤ CỦA BẠN:**
1.  **Tạo Lời Bình Luận Sống Động:**
    *   Viết một lời bình luận hấp dẫn, kịch tính từ người điều khiển đấu giá để phản ứng lại mức giá mới của người chơi.
    *   Hãy để các NPC khác phản ứng. Họ có thể bàn tán, tỏ ra tiếc nuối, hoặc trả giá ngay lập tức.
    *   Sử dụng tag **[MESSAGE: "Nội dung lời bình luận"]**.

2.  **Quyết Định Lượt Đấu Giá CỦA NPC (Tùy chọn):**
    *   Dựa vào giá trị của nô lệ, mức giá hiện tại, và "túi tiền" của các NPC, hãy quyết định xem có NPC nào sẽ **ngay lập tức** trả giá cao hơn không.
    *   Nếu một NPC quyết định trả giá, hãy tạo tag **[NPC_BID: npcName="Tên NPC", bidAmount=SốTiềnMới]**. Mức giá mới phải cao hơn \`${playerBid}\`.
    *   **QUAN TRỌNG:** Chỉ có TỐI ĐA MỘT NPC được trả giá trong lượt này.

3.  **CẤM SỬ DỤNG:** Không được sử dụng tag [AUCTION_SOLD] trong phản hồi này.

**VÍ DỤ KẾT QUẢ 1 (NPC trả giá ngay lập tức):**
[MESSAGE: "${playerName} đã ra giá ${playerBid} ${currencyName}! Một con số ấn tượng cho một tuyệt sắc giai nhân như vậy! ... Khoan đã! Ma công tử ở phòng VIP số 1 đã nhếch mép cười!"]
[NPC_BID: npcName="Ma công tử", bidAmount=${Math.floor(playerBid * 1.2)}]

**VÍ DỤ KẾT QUẢ 2 (Không có NPC nào trả giá ngay):**
[MESSAGE: "${playerBid} ${currencyName}! Một mức giá rất cao! Có vẻ như những người khác đang phải suy nghĩ. Chúng ta sẽ chờ xem..."]
`;
};
