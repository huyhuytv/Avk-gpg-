import { KnowledgeBase, GameLocation } from '../types';
import * as GameTemplates from '../templates';
import { TU_CHAT_TIERS, SUB_REALM_NAMES } from '../constants';

export const generateEconomyLocationsPrompt = (city: GameLocation, kb: KnowledgeBase): string => {
    const { worldConfig, playerStats, realmProgressionList } = kb;
    const currencyName = worldConfig?.currencyName || "Tiền";

    // Xác định loại địa điểm để văn bản prompt linh hoạt hơn
    let locationTypeString = "đô thị";
    if (city.locationType === GameTemplates.LocationType.TOWN) {
        locationTypeString = "thị trấn";
    } else if (city.locationType === GameTemplates.LocationType.CITY) {
        locationTypeString = "thành phố";
    } else if (city.locationType === GameTemplates.LocationType.CAPITAL) {
        locationTypeString = "thủ đô";
    }

    // Gợi ý quy mô kinh tế dựa trên loại địa điểm
    let economySuggestion = `Ví dụ: một "Phường Thị" (chợ trời) và một "Cửa Hàng Tạp Hóa".`;
    if (city.locationType === GameTemplates.LocationType.CITY || city.locationType === GameTemplates.LocationType.CAPITAL) {
        economySuggestion = `Ví dụ: một "Phường Thị" (chợ trời), một "Thương Thành" (trung tâm mua sắm), và có thể có cả "Đấu Giá Hội".`
    }
    
    const cultivationSystemContext = `
**BỐI CẢNH HỆ THỐNG TU LUYỆN (CỰC KỲ QUAN TRỌNG):**
- **Các Hệ Thống Tu Luyện Theo Chủng Tộc:**
${worldConfig?.raceCultivationSystems.map(s => `  - ${s.raceName}: ${s.realmSystem}`).join('\n') || '  Không có'}
- **Hệ Thống Tiểu Cảnh Giới:** Mỗi cảnh giới lớn (ví dụ: Luyện Khí, Trúc Cơ) đều có 10 tiểu cảnh giới, theo thứ tự sau: ${SUB_REALM_NAMES.join(', ')}.
- **QUY TẮC BẮT BUỘC:** Khi bạn tạo bất kỳ NPC hoặc Nô Lệ nào, thuộc tính \`realm\` của họ **PHẢI** là sự kết hợp của một "Cảnh Giới Lớn" và một "Tiểu Cảnh Giới".
  - **VÍ DỤ ĐÚNG:** \`realm="Kim Đan Cửu Trọng"\`, \`realm="Nguyên Anh Đỉnh Phong"\`.
  - **VÍ DỤ SAI:** \`realm="Kim Đan"\`, \`realm="Nguyên Anh Kỳ"\`.
Việc tuân thủ quy tắc này là BẮT BUỘC để hệ thống game có thể tính toán chỉ số chính xác.
`;

    const nsfwInstructions = worldConfig?.nsfwMode ? `
**YÊU CẦU ĐẶC BIỆT (CHẾ ĐỘ 18+ ĐANG BẬT):**
*   **Tạo Địa Điểm Nhạy Cảm:** Ngoài các địa điểm kinh tế thông thường, hãy tạo ra các địa điểm như **"${GameTemplates.EconomyLocationType.SLAVE_MARKET}"** và **"${GameTemplates.EconomyLocationType.SLAVE_AUCTION}"**.
    *   Sử dụng tag \`[SUBLOCATION: ...]\` với \`locationType="${GameTemplates.EconomyLocationType.SLAVE_MARKET}"\` hoặc \`locationType="${GameTemplates.EconomyLocationType.SLAVE_AUCTION}"\`.
*   **Tạo NPC Đặc Thù:**
    *   Trong "Chợ Nô Lệ", hãy tạo các NPC thương nhân có \`vendorType="SlaveTrader"\`. Họ sẽ là người mua bán nô lệ.
*   **Tạo "Hàng Hóa" Đặc Biệt:**
    *   Sử dụng tag mới **[SLAVE_FOR_SALE: ...]** để thêm nô lệ vào danh sách bán của các \`SlaveTrader\`.
    *   **Tham số:** Cung cấp đầy đủ các thuộc tính như một NPC thông thường, cộng với các chỉ số của nô lệ.
        *   **Bắt Buộc:** \`parentId\` (tên của SlaveTrader), \`name\`, \`description\`, \`gender="Nữ"\`, \`race\` (PHẢI là một trong các chủng tộc đã định nghĩa ở trên), \`realm\` (PHẢI là một cảnh giới hợp lệ trong hệ thống của chủng tộc đó, theo đúng định dạng "Đại Cảnh Giới + Tiểu Cảnh Giới"), \`value=SỐ\`.
        *   **Khuyến Khích (để nô lệ có chiều sâu):** \`title\`, \`affinity\`, \`willpower\`, \`obedience\`, \`tuChat\`, \`spiritualRoot\`, \`specialPhysique\`, \`statsJSON='{"thoNguyen":X, "maxThoNguyen":Y}'\`.
    *   \`value\`: Giá trị nô lệ mà bạn đề xuất. **Lưu ý:** Hệ thống game sẽ tính toán lại giá cuối cùng dựa trên tất cả các chỉ số (cảnh giới, tư chất, etc.), nhưng giá trị bạn cung cấp sẽ là một tham khảo quan trọng.
    *   **Ví dụ:** \`[SLAVE_FOR_SALE: parentId="Mụ Tú Bà", name="A Liên", description="Một thiếu nữ Yêu Tộc có dung mạo xinh đẹp.", gender="Nữ", race="Yêu Tộc", realm="Trúc Cơ Đỉnh Phong", affinity=-50, willpower=40, obedience=60, value=5000, tuChat="Thượng Đẳng", spiritualRoot="Băng Linh Căn", specialPhysique="Băng Cơ Ngọc Cốt", statsJSON='{"thoNguyen": 180, "maxThoNguyen": 200}']\`
` : '';

    const itemTagInstructions = `
**3. Tag Vật Phẩm Cửa Hàng \`[SHOP_ITEM: ...]\` (Mới):**
    *   **CẤM TUYỆT ĐỐI VỀ VẬT PHẨM TIỀN TỆ:** Đơn vị tiền tệ của thế giới là "${worldConfig.currencyName}". Bạn **TUYỆT ĐỐI KHÔNG** được tạo ra bất kỳ vật phẩm nào có chức năng tương tự tiền tệ (ví dụ: "Linh Thạch Hạ Phẩm", "Túi Vàng", "Ngân Phiếu") bằng tag \`[ITEM_ACQUIRED]\`. Việc này sẽ phá vỡ hệ thống kinh tế của game.
    *   **Tham số Bắt Buộc:** \`parentId\`, \`name\`, \`type\`, \`description\`, \`quantity\`, \`rarity\`, \`value\`, \`itemRealm\`.
    *   **QUAN TRỌNG:** \`parentId\` PHẢI là tên chính xác của NPC thương nhân mà bạn đã tạo ở trên.
    *   \`type\`: Phải bao gồm **Loại Chính** và **Loại Phụ** (nếu có).
        *   **Loại Chính Hợp Lệ:** ${Object.values(GameTemplates.ItemCategory).join(' | ')}.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.EQUIPMENT}\`, Loại Phụ (\`equipmentType\`) PHẢI là một trong: ${Object.values(GameTemplates.EquipmentType).join(' | ')}.
            *   **Tham số RIÊNG \`equipmentType\` cũng BẮT BUỘC**.
            *   **Tham số RIÊNG \`statBonusesJSON\` BẮT BUỘC** (nếu không có, dùng \`statBonusesJSON='{}'\`). JSON phải hợp lệ.
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
Bạn là một AI kiến tạo thế giới game nhập vai, chuyên xây dựng các khu vực kinh tế sống động.
Người chơi vừa đến ${locationTypeString} tên là **${city.name}**. Hãy tạo ra các địa điểm kinh tế, các thương nhân, và các mặt hàng họ bán cho nơi này.

**BỐI CẢNH:**
- **Địa điểm:** ${city.name} (ID: ${city.id}, Loại: ${city.locationType || 'Không rõ'}, Mô tả: ${city.description})
- **Thế giới:** Chủ đề "${worldConfig?.theme}", thể loại "${worldConfig?.genre}".
- **Tiền tệ:** ${currencyName}
${cultivationSystemContext}

**YÊU CẦU:**
1.  **Tạo các Địa Điểm Phụ (Sub-Location) Kinh Tế Mới:**
    *   Tạo ra các địa điểm con bên trong ${city.name}. ${economySuggestion}
    *   Sử dụng tag **[SUBLOCATION: ...]**.
    *   **CỰC KỲ QUAN TRỌNG:** Thuộc tính \`parentLocationId\` PHẢI sử dụng giá trị chính xác sau đây: \`parentLocationId="${city.id}"\`. **KHÔNG** được tự ý thay đổi, đoán, hay tạo mới giá trị này.
    *   **BẮT BUỘC** phải có thuộc tính \`locationType\` là một trong các loại sau: \`${Object.values(GameTemplates.EconomyLocationType).join(' | ')}\`.
    
2.  **Tạo 3-5 NPC Thương Nhân:**
    *   Tạo ra các NPC bán hàng để đặt vào các địa điểm phụ vừa tạo (Không tạo NPC cho đấu giá hội).
    *   Sử dụng tag **[NPC: ...]**.
    *   **BẮT BUỘC** phải có các thuộc tính: \`locationId\` (tên chính xác của địa điểm phụ bạn đã tạo), \`vendorType\` (\`MarketStall\` hoặc \`SpecializedShop\`), \`vendorSlogan\`, \`vendorBuysCategories\`, \`name\`, \`gender\`, \`race\` (PHẢI là một trong các chủng tộc đã định nghĩa ở trên), và \`realm\` (PHẢI là một cảnh giới hợp lệ trong hệ thống của chủng tộc đó, **NẾU LÀ CHỦNG TỘC YÊU TỘC THÌ NHẤT ĐỊNH PHẢI LẤY CẢNH GIỚI TRONG HỆ THỐNG TU LUYỆN CỦA YÊU TỘC, TƯƠNG TỰ VỚI CÁC CHỦNG TỘC KHÁC**, theo đúng định dạng "Đại Cảnh Giới + Tiểu Cảnh Giới").

${itemTagInstructions}
${nsfwInstructions}

**VÍ DỤ KẾT QUẢ:**

[SUBLOCATION: name="Phường Thị Nam Thành", description="Một khu chợ trời nhộn nhịp ở phía nam ${locationTypeString} ${city.name}, nơi các thương nhân nhỏ lẻ tụ tập.", locationType="${GameTemplates.EconomyLocationType.MARKETPLACE}", parentLocationId="${city.id}", isSafeZone=true]
[SUBLOCATION: name="Vạn Bảo Lâu", description="Một thương thành 3 tầng bề thế ở trung tâm ${locationTypeString} ${city.name}, chuyên bán các vật phẩm cao cấp.", locationType="${GameTemplates.EconomyLocationType.SHOPPING_CENTER}", parentLocationId="${city.id}", isSafeZone=true]
${worldConfig?.nsfwMode ? `[SUBLOCATION: name="Chợ Nô Lệ Hắc Ám", description="Một góc khuất của thành phố, nơi những món hàng sống được mua bán.", locationType="${GameTemplates.EconomyLocationType.SLAVE_MARKET}", parentLocationId="${city.id}", isSafeZone=false]` : ''}


[NPC: name="Lão Trương Bán Thảo Dược", gender="Nam", race="Nhân Tộc", realm="Phàm Nhân Nhất Trọng", description="Một lão nông khắc khổ chuyên bán các loại linh thảo bình dân hái từ ngọn núi phía đông.", personality="Thật thà, Hiền lành", affinity=10, locationId="Phường Thị Nam Thành", vendorType="MarketStall", vendorSlogan="Linh thảo tươi mới, giá cả phải chăng!", vendorBuysCategories="Material"]
[NPC: name="Lý Thiết Tượng", gender="Nam", race="Nhân Tộc", realm="Trúc Cơ Tam Trọng", description="Một thợ rèn với cánh tay to như cột đình, chuyên bán các loại vũ khí và giáp sắt tự rèn.", personality="Cộc cằn, Tay nghề cao", affinity=0, locationId="Vạn Bảo Lâu", vendorType="SpecializedShop", vendorBuysCategories="Equipment,Material", vendorSlogan="Thần binh lợi khí, chém sắt như chém bùn!"]
${worldConfig?.nsfwMode ? `[NPC: name="Mụ Tú Bà", gender="Nữ", race="Nhân Tộc", realm="Kim Đan Nhất Trọng", description="Một người phụ nữ trung niên với ánh mắt sắc như dao, chuyên buôn bán nô lệ.", personality="Tàn nhẫn, Mưu mô", affinity=-20, locationId="Chợ Nô Lệ Hắc Ám", vendorType="SlaveTrader", vendorSlogan="Hàng tuyển, đảm bảo khiến các đại gia hài lòng.", vendorBuysCategories=""]` : ''}

**//---- VẬT PHẨM BÁN ----//**
[SHOP_ITEM: parentId="Lão Trương Bán Thảo Dược", name="Huyết Tinh Thảo", type="${GameTemplates.ItemCategory.MATERIAL} ${GameTemplates.MaterialType.LINH_THAO}", materialType="${GameTemplates.MaterialType.LINH_THAO}", description="Loại linh thảo sơ cấp dùng để luyện chế đan dược hồi máu.", quantity=20, rarity="${GameTemplates.ItemRarity.PHO_THONG}", value=15, itemRealm="Luyện Khí"]
[SHOP_ITEM: parentId="Lý Thiết Tượng", name="Thiết Kiếm", type="${GameTemplates.ItemCategory.EQUIPMENT} ${GameTemplates.EquipmentType.VU_KHI}", equipmentType="${GameTemplates.EquipmentType.VU_KHI}", description="Một thanh kiếm sắt bền chắc, dành cho các mạo hiểm giả mới vào nghề.", quantity=1, rarity="${GameTemplates.ItemRarity.PHO_THONG}", value=100, itemRealm="Luyện Khí", statBonusesJSON='{"sucTanCong": 5}', uniqueEffectsList="Không có gì đặc biệt", slot="Vũ Khí Chính"]
[SHOP_ITEM: parentId="Lý Thiết Tượng", name="Bách Luyện Giáp", type="${GameTemplates.ItemCategory.EQUIPMENT} ${GameTemplates.EquipmentType.GIAP_THAN}", equipmentType="${GameTemplates.EquipmentType.GIAP_THAN}", description="Áo giáp được rèn trăm lần, phòng ngự vững chắc.", quantity=1, rarity="${GameTemplates.ItemRarity.HIEM}", value=500, itemRealm="Trúc Cơ", statBonusesJSON='{"maxSinhLuc": 50}', uniqueEffectsList="Giảm 5% sát thương vật lý", slot="Giáp Thân"]
${worldConfig?.nsfwMode ? `[SLAVE_FOR_SALE: parentId="Mụ Tú Bà", name="Tiểu Thúy", description="Một thiếu nữ 16 tuổi, dung mạo thanh tú nhưng ánh mắt luôn sợ sệt.", gender="Nữ", race="Nhân Tộc", realm="Phàm Nhân Cửu Trọng", affinity=-50, willpower=20, obedience=80, value=1000, tuChat="Hạ Đẳng", spiritualRoot="Phàm Căn", specialPhysique="Bình thường", statsJSON='{"thoNguyen": 64, "maxThoNguyen": 80}']` : ''}


**LƯU Ý QUAN TRỌNG:**
- Chỉ trả về các tag, không có lời dẫn hay giải thích gì thêm.
`};