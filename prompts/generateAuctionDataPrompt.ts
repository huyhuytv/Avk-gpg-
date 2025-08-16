import { KnowledgeBase, AuctionItem } from '../types';
import * as GameTemplates from '../templates';
import { AUCTION_NPC_CURRENCY_BY_REALM_TIER } from '../constants';

export const generateAuctionDataPrompt = (kb: KnowledgeBase): string => {
    const { playerStats, worldConfig, realmProgressionList } = kb;
    const currencyName = worldConfig?.currencyName || "Tiền";

    const currencyTableString = realmProgressionList.map((realm, index) => 
        `- **${realm}:** ${AUCTION_NPC_CURRENCY_BY_REALM_TIER[index]?.toLocaleString() || 'Không xác định'} ${currencyName}`
    ).join('\n        ');


    return `
Bạn là một Đấu Giá Sư bậc thầy trong một thế giới game nhập vai. Nhiệm vụ của bạn là khởi tạo một phiên đấu giá hấp dẫn.

**BỐI CẢNH HIỆN TẠI:**
- **Thế Giới:** Chủ đề "${worldConfig?.theme}", thể loại "${worldConfig?.genre}".
- **Người Chơi:** ${worldConfig?.playerName || 'Người Chơi'}, đang có ${playerStats.currency.toLocaleString()} ${currencyName}.
- **Cảnh Giới/Cấp Độ Người Chơi:** ${playerStats.realm}.

**YÊU CẦU:**
1.  **Tạo 3-5 Vật Phẩm Đấu Giá Độc Đáo:**
    *   Tạo ra các vật phẩm hiếm, mạnh mẽ, hoặc có câu chuyện thú vị, phù hợp với bối cảnh và cấp độ của người chơi. Các vật phẩm phải có độ hiếm từ "${GameTemplates.ItemRarity.QUY_BAU}" trở lên.
    *   Sử dụng tag **[AUCTION_ITEM: ...]** cho mỗi vật phẩm.
    *   **BẮT BUỘC** cung cấp đầy đủ các thuộc tính cho vật phẩm như \`name\`, \`type\`, \`equipmentType\` (nếu là trang bị), \`description\`, \`statBonusesJSON\`, \`uniqueEffectsList\`, v.v. để vật phẩm có giá trị thực sự. Hệ thống sẽ tự động tính toán giá trị và giá khởi điểm.

2.  **Tạo 3-5 NPC Đấu Giá Tạm Thời:**
    *   Tạo ra các NPC chỉ tồn tại trong phiên đấu giá này để làm đối thủ cho người chơi.
    *   Sử dụng tag **[AUCTION_NPC: ...]**.
    *   **BẮT BUỘC** cung cấp các thuộc tính: \`name\` (tên độc đáo), \`realm\` (cảnh giới/cấp độ).
    *   **QUY TẮC VỀ TÀI SẢN (currency):** Dựa vào cảnh giới của NPC, hãy xác định tài sản của họ theo bảng dưới đây, sau đó chọn một con số **ngẫu nhiên từ 60% đến 200%** của giá trị đó. Điều này tạo ra sự đa dạng và khó lường.
        *   **Bảng Giá Trị Tài Sản Chuẩn Theo Cảnh Giới:**
        ${currencyTableString}
    *   **Ví dụ:** Nếu NPC ở cảnh giới "${realmProgressionList[3] || 'Kim Đan'}" (giá trị chuẩn ${AUCTION_NPC_CURRENCY_BY_REALM_TIER[3]?.toLocaleString() || '100,000'}), tài sản của họ có thể là 65,000, 150,000, hoặc 198,000.
    *   Hãy tạo ra các NPC có cảnh giới đa dạng, một số cao hơn và một số thấp hơn người chơi, để tạo ra sự cạnh tranh thú vị.

3.  **Tạo Lời Chào Mở Đầu:**
    *   Viết một lời chào mừng hấp dẫn từ người điều khiển đấu giá.
    *   Sử dụng tag **[MESSAGE: "Nội dung lời chào"]**.

**QUY TẮC ĐỊNH DẠNG TAG (Rất quan trọng):**

*   **Tag Vật Phẩm Đấu Giá \`[AUCTION_ITEM: ...]\`:**
    *   **CẤM TUYỆT ĐỐI VỀ VẬT PHẨM TIỀN TỆ:** Đơn vị tiền tệ của thế giới là "${worldConfig?.currencyName || "Tiền"}". Bạn **TUYỆT ĐỐI KHÔNG** được tạo ra bất kỳ vật phẩm nào có chức năng tương tự tiền tệ (ví dụ: "Linh Thạch Hạ Phẩm", "Túi Vàng", "Ngân Phiếu"). Hệ thống sẽ tự động quản lý tiền tệ.
    *   **Tham số Bắt Buộc:** \`name\`, \`type\`, \`description\`, \`quantity=1\`, \`rarity\`, \`itemRealm\`.
    *   \`type\`: Phải bao gồm **Loại Chính** và **Loại Phụ** (nếu có).
        *   **Loại Chính Hợp Lệ:** ${Object.values(GameTemplates.ItemCategory).join(' | ')}.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.EQUIPMENT}\`, Loại Phụ (\`equipmentType\`) PHẢI là một trong: ${Object.values(GameTemplates.EquipmentType).join(' | ')}.
            *   **Tham số RIÊNG \`equipmentType\` cũng BẮT BUỘC**.
            *   **Tham số RIÊNG \`statBonusesJSON\` BẮT BUỘC** (ví dụ: \`statBonusesJSON='{"sucTanCong": 150}'\`. Nếu không có, dùng \`statBonusesJSON='{}'\`).
            *   **Tham số RIÊNG \`uniqueEffectsList\` BẮT BUỘC** (ví dụ: \`uniqueEffectsList="Hút máu 10%;+15% sát thương lên mục tiêu đang chảy máu"\`. Nếu không có, dùng \`uniqueEffectsList="Không có gì đặc biệt"\`).
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.POTION}\`, Loại Phụ (\`potionType\`) PHẢI là một trong: ${Object.values(GameTemplates.PotionType).join(' | ')}.
            *   **Tham số RIÊNG \`potionType\` cũng BẮT BUỘC**.
            *   **Tham số RIÊNG \`effectsList\` BẮT BUỘC**.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.MATERIAL}\`, Loại Phụ (\`materialType\`) PHẢI là một trong: ${Object.values(GameTemplates.MaterialType).join(' | ')}.
            *   **Tham số RIÊNG \`materialType\` cũng BẮT BUỘC**.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.CONG_PHAP}\`, thêm các tham số bắt buộc \`congPhapType\` và \`expBonusPercentage\`.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.LINH_KI}\`, thêm tham số bắt buộc \`skillToLearnJSON\`.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.PROFESSION_SKILL_BOOK}\`, thêm tham số bắt buộc \`professionToLearn\`.
    *   **\`itemRealm\`: BẮT BUỘC. Cảnh giới của vật phẩm. PHẢI là một trong các cảnh giới lớn của thế giới: \`${realmProgressionList.join(' | ')}\`.**

*   **Tag NPC Đấu Giá Tạm Thời \`[AUCTION_NPC: ...]\`:**
    *   **Thuộc tính Bắt Buộc:** \`name\`, \`realm\`, \`currency\`.
    *   Ví dụ: \`[AUCTION_NPC: name="Lý Phú Hộ", realm="Kim Đan Kỳ", currency=150000]\`

**VÍ DỤ HOÀN CHỈNH:**
[MESSAGE: "Chào mừng quý vị đến với Đấu Giá Hội Hoàng Kim! Hôm nay, chúng ta có những kỳ trân dị bảo sẽ khiến cả tu chân giới phải kinh ngạc!"]

[AUCTION_ITEM: name="Huyết Ma Kiếm", type="Equipment Vũ Khí", equipmentType="Vũ Khí", description="Thanh kiếm rèn từ máu của một con ác ma cổ đại, tỏa ra sát khí kinh người.", quantity=1, rarity="Cực Phẩm", itemRealm="Hóa Thần", statBonusesJSON='{"sucTanCong": 150}', uniqueEffectsList="Hút máu 10%;+15% sát thương lên mục tiêu đang chảy máu", slot="Vũ Khí Chính"]
[AUCTION_ITEM: name="Linh Lung Tâm Đan", type="Potion Đặc Biệt", potionType="Đặc Biệt", description="Một viên đan dược quý hiếm giúp thanh tẩy tâm ma, tăng cường ngộ tính trong 1 giờ.", quantity=1, rarity="Quý Báu", itemRealm="Nguyên Anh", effectsList="Tâm trí minh mẫn trong 60 lượt", durationTurns=60]
[AUCTION_ITEM: name="Bích Ngọc Thanh Tâm Quyết", type="CongPhap", description="Một bộ công pháp tâm pháp giúp định thần, giảm khả năng tẩu hỏa nhập ma khi đột phá cảnh giới.", quantity=1, rarity="Quý Báu", itemRealm="Nguyên Anh", congPhapType="Khí Tu", expBonusPercentage=5]

[AUCTION_NPC: name="Lý Phú Hộ", realm="Kim Đan Kỳ", currency=150000]
[AUCTION_NPC: name="Tam Trưởng Lão", realm="Nguyên Anh Sơ Kỳ", currency=600000]
[AUCTION_NPC: name="Yêu Nữ Áo Đỏ", realm="Trúc Cơ Đỉnh Phong", currency=18000]

- Chỉ trả về các tag, không có lời dẫn hay giải thích gì thêm.
`};
