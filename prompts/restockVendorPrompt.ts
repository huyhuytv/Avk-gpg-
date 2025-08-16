
import { KnowledgeBase, NPC } from '../types';
import * as GameTemplates from '../templates';
import { STAT_POINT_VALUES } from '../constants';

export const generateRestockVendorPrompt = (vendor: NPC, kb: KnowledgeBase): string => {
    const { worldConfig, playerStats, realmProgressionList } = kb;
    const currencyName = worldConfig?.currencyName || "Tiền";
    const shopType = vendor.vendorType === 'MarketStall' ? 'Sạp Hàng ở Phường Thị' : 'Cửa Hàng Chuyên Biệt';
    const buysCategories = vendor.vendorBuysCategories?.join(', ') || 'đa dạng';

    const itemTagInstructions = `
**QUY TẮC ĐỊNH DẠNG TAG (Rất Quan Trọng):**
*   **Tag Vật Phẩm Cửa Hàng \`[SHOP_ITEM: ...]\`:**
    *   **CẤM TUYỆT ĐỐI VỀ VẬT PHẨM TIỀN TỆ:** Đơn vị tiền tệ của thế giới là "${worldConfig.currencyName}". Bạn **TUYỆT ĐỐI KHÔNG** được tạo ra bất kỳ vật phẩm nào có chức năng tương tự tiền tệ (ví dụ: "Linh Thạch Hạ Phẩm", "Túi Vàng", "Ngân Phiếu") bằng tag \`[ITEM_ACQUIRED]\`. Việc này sẽ phá vỡ hệ thống kinh tế của game.
    *   **Tham số Bắt Buộc:** \`parentId\`, \`name\`, \`type\`, \`description\`, \`quantity\`, \`rarity\`, \`value\`, \`itemRealm\`.
    *   **QUAN TRỌNG:** \`parentId\` PHẢI là tên chính xác của NPC thương nhân được cung cấp: \`parentId="${vendor.name}"\`.
    *   \`type\`: Phải bao gồm **Loại Chính** và **Loại Phụ** (nếu có).
        *   **Loại Chính Hợp Lệ:** ${Object.values(GameTemplates.ItemCategory).join(' | ')}.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.EQUIPMENT}\`, Loại Phụ (\`equipmentType\`) PHẢI là một trong: ${Object.values(GameTemplates.EquipmentType).join(' | ')}.
            *   **Tham số RIÊNG \`equipmentType\` cũng BẮT BUỘC**.
            *   **Tham số RIÊNG \`statBonusesJSON\` BẮT BUỘC** (nếu không có, dùng \`statBonusesJSON='{}'\`). JSON phải hợp lệ. Các khóa hợp lệ là: \`${Object.keys(STAT_POINT_VALUES).join(', ')}\`.
            *   **Tham số RIÊNG \`uniqueEffectsList\` BẮT BUỘC** (nếu không có, dùng \`uniqueEffectsList="Không có gì đặc biệt"\`).
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.POTION}\`, Loại Phụ (\`potionType\`) PHẢI là một trong: ${Object.values(GameTemplates.PotionType).join(' | ')}.
            *   **Tham số RIÊNG \`potionType\` cũng BẮT BUỘC**.
            *   **Tham số RIÊNG \`effectsList\` BẮT BUỘC**.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.MATERIAL}\`, Loại Phụ (\`materialType\`) PHẢI là một trong: ${Object.values(GameTemplates.MaterialType).join(' | ')}.
            *   **Tham số RIÊNG \`materialType\` cũng BẮT BUỘC**.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.CONG_PHAP}\`, thêm các tham số bắt buộc \`congPhapType\` và \`expBonusPercentage\`.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.LINH_KI}\`, thêm tham số bắt buộc \`skillToLearnJSON\`.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.PROFESSION_SKILL_BOOK}\`, thêm tham số bắt buộc \`professionToLearn\`.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.PROFESSION_TOOL}\`, thêm tham số bắt buộc \`professionRequired\`.
    *   \`itemRealm\`: BẮT BUỘC. Cảnh giới của vật phẩm. PHẢI là một trong các cảnh giới lớn của thế giới: \`${realmProgressionList.join(' | ')}\`.
    `;

    return `
Bạn là một AI quản lý kinh tế trong một thế giới game nhập vai. Nhiệm vụ của bạn là làm mới hàng hóa cho một cửa hàng sau một thời gian dài.

**BỐI CẢNH:**
- **Thế Giới:** Chủ đề "${worldConfig?.theme}", thể loại "${worldConfig?.genre}".
- **Người Chơi:** ${worldConfig?.playerName || 'Người Chơi'}, cảnh giới/cấp độ hiện tại: ${playerStats.realm}.
- **Cửa Hàng Cần Tái Cung Cấp:**
  - Tên chủ cửa hàng: **${vendor.name}**
  - Loại cửa hàng: ${shopType}
  - Chuyên bán/mua các mặt hàng loại: ${buysCategories}
  - Mô tả: ${vendor.description}

**YÊU CẦU:**
1.  **Xóa Sạch Hàng Tồn Kho Cũ:** Hệ thống đã tự động xóa hết hàng cũ. Bạn không cần làm gì cho bước này.
2.  **Tạo 5-10 Vật Phẩm MỚI:**
    *   Dựa vào chuyên môn của cửa hàng (${buysCategories}), hãy tạo ra một danh sách hàng hóa hoàn toàn mới.
    *   Các vật phẩm nên có độ hiếm và sức mạnh phù hợp với cấp độ hiện tại của người chơi (${playerStats.realm}) và bối cảnh thế giới, để mang lại cảm giác mới mẻ và hữu ích.
    *   Sử dụng tag **[SHOP_ITEM: ...]** cho mỗi vật phẩm.
    *   Đảm bảo cung cấp đầy đủ các thuộc tính bắt buộc cho mỗi vật phẩm, bao gồm cả các thuộc tính riêng cho từng loại (ví dụ: \`equipmentType\` cho trang bị).

${itemTagInstructions}

**VÍ DỤ (Nếu cửa hàng chuyên bán trang bị):**
[SHOP_ITEM: parentId="${vendor.name}", name="Trường Đao Bách Chiến", type="Equipment Vũ Khí", equipmentType="Vũ Khí", description="Một thanh trường đao đã kinh qua trăm trận, lưỡi đao vẫn còn sắc bén.", quantity=1, rarity="Hiếm", value=1500, itemRealm="Trúc Cơ", statBonusesJSON='{"sucTanCong": 25, "maxSinhLuc": 20}', uniqueEffectsList="Tăng 5% tốc độ tấn công", slot="Vũ Khí Chính"]
[SHOP_ITEM: parentId="${vendor.name}", name="Giáp Da Yêu Lang", type="Equipment Giáp Thân", equipmentType="Giáp Thân", description="Làm từ da của Yêu Lang, nhẹ và bền chắc.", quantity=1, rarity="Hiếm", value=1200, itemRealm="Trúc Cơ", statBonusesJSON='{"maxSinhLuc": 70}', uniqueEffectsList="Tăng 10% kháng độc", slot="Giáp Thân"]

**LƯU Ý QUAN TRỌNG:**
- Chỉ trả về các tag **[SHOP_ITEM: ...]**, mỗi tag trên một dòng.
- Không thêm bất kỳ lời dẫn hay giải thích gì khác.
`;
};
