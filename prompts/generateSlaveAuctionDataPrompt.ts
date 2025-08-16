
import { KnowledgeBase, AuctionItem } from '../types';
import * as GameTemplates from '../templates';
import { AUCTION_NPC_CURRENCY_BY_REALM_TIER, TU_CHAT_TIERS, SUB_REALM_NAMES } from '../constants';

export const generateSlaveAuctionDataPrompt = (kb: KnowledgeBase): string => {
    const { playerStats, worldConfig, realmProgressionList } = kb;
    const currencyName = worldConfig?.currencyName || "Tiền";

    const currencyTableString = realmProgressionList.map((realm, index) => 
        `- **${realm}:** ${AUCTION_NPC_CURRENCY_BY_REALM_TIER[index]?.toLocaleString() || 'Không xác định'} ${currencyName}`
    ).join('\n        ');

    const cultivationSystemContext = `
**BỐI CẢNH HỆ THỐNG TU LUYỆN (CỰC KỲ QUAN TRỌNG):**
- **Các Hệ Thống Tu Luyện Theo Chủng Tộc:**
${worldConfig?.raceCultivationSystems.map(s => `  - ${s.raceName}: ${s.realmSystem}`).join('\n') || '  Không có'}
- **Hệ Thống Tiểu Cảnh Giới:** Mỗi cảnh giới lớn (ví dụ: Luyện Khí, Trúc Cơ) đều có 10 tiểu cảnh giới, theo thứ tự sau: ${SUB_REALM_NAMES.join(', ')}.
- **QUY TẮC BẮT BUỘC:** Khi bạn tạo bất kỳ Nô Lệ Đấu Giá hoặc NPC nào, thuộc tính \`realm\` của họ **PHẢI** là sự kết hợp của một "Cảnh Giới Lớn" và một "Tiểu Cảnh Giới".
  - **VÍ DỤ ĐÚNG:** \`realm="Kim Đan Cửu Trọng"\`, \`realm="Nguyên Anh Đỉnh Phong"\`.
  - **VÍ DỤ SAI:** \`realm="Kim Đan"\`, \`realm="Nguyên Anh Kỳ"\`.
Việc tuân thủ quy tắc này là BẮT BUỘC để hệ thống game có thể tính toán chỉ số chính xác.
`;

    return `
Bạn là một Đấu Giá Sư chuyên điều hành các phiên đấu giá Nô Lệ trong một thế giới game nhập vai. Nhiệm vụ của bạn là khởi tạo một phiên đấu giá hấp dẫn và kịch tính.

**BỐI CẢNH HIỆN TẠI:**
- **Thế Giới:** Chủ đề "${worldConfig?.theme}", thể loại "${worldConfig?.genre}".
- **Người Chơi:** ${worldConfig?.playerName || 'Người Chơi'}, đang có ${playerStats.currency.toLocaleString()} ${currencyName}.
- **Cảnh Giới/Cấp Độ Người Chơi:** ${playerStats.realm}.
${cultivationSystemContext}

**YÊU CẦU:**
1.  **Tạo 3-5 Nô Lệ Đấu Giá Độc Đáo:**
    *   Tạo ra các nô lệ có thân thế, ngoại hình, và tiềm năng (tư chất, linh căn) khác nhau để thu hút người mua. Họ có thể là tù binh chiến tranh, người mang huyết mạch đặc biệt, hoặc những người có số phận bi thảm.
    *   Sử dụng tag **[AUCTION_SLAVE: ...]** cho mỗi nô lệ.
    *   **BẮT BUỘC** cung cấp đầy đủ các thuộc tính để nô lệ có chiều sâu và giá trị.

2.  **Tạo 3-5 NPC Đấu Giá Tạm Thời:**
    *   Tạo ra các NPC chỉ tồn tại trong phiên đấu giá này để làm đối thủ cho người chơi.
    *   Sử dụng tag **[AUCTION_NPC: ...]**.
    *   **BẮT BUỘC** cung cấp các thuộc tính: \`name\` (tên độc đáo), \`realm\` (cảnh giới/cấp độ - PHẢI là một cảnh giới hợp lệ trong hệ thống của một chủng tộc bất kỳ, và theo đúng định dạng "Đại Cảnh Giới + Tiểu Cảnh Giới").
    *   **QUY TẮC VỀ TÀI SẢN (currency):** Dựa vào cảnh giới của NPC, hãy xác định tài sản của họ theo bảng dưới đây, sau đó chọn một con số **ngẫu nhiên từ 60% đến 200%** của giá trị đó. Điều này tạo ra sự đa dạng và khó lường.
        *   **Bảng Giá Trị Tài Sản Chuẩn Theo Cảnh Giới:**
        ${currencyTableString}
    *   Hãy tạo ra các NPC có cảnh giới đa dạng, một số cao hơn và một số thấp hơn người chơi.

3.  **Tạo Lời Chào Mở Đầu:**
    *   Viết một lời chào mừng hấp dẫn từ người điều khiển đấu giá, nhấn mạnh sự đặc biệt của các "món hàng" hôm nay.
    *   Sử dụng tag **[MESSAGE: "Nội dung lời chào"]**.

**QUY TẮC ĐỊNH DẠNG TAG (Rất quan trọng):**

*   **Tag Nô Lệ Đấu Giá \`[AUCTION_SLAVE: ...]\`:**
    *   **LƯU Ý QUAN TRỌNG VỀ GIÁ:** Bạn **KHÔNG CẦN** cung cấp tham số \`value\`. Hệ thống game sẽ tự động tính toán giá trị của nô lệ dựa trên cảnh giới, tư chất và các chỉ số khác bạn cung cấp. **Việc của bạn là cung cấp đầy đủ các chỉ số để hệ thống định giá chính xác.**
    *   **Tham số Bắt Buộc:** \`name\`, \`description\`, \`gender="Nữ"\`, \`race\` (PHẢI là một trong các chủng tộc đã định nghĩa ở trên), \`realm\` (PHẢI là một cảnh giới hợp lệ trong hệ thống của chủng tộc đó, **NẾU LÀ CHỦNG TỘC YÊU TỘC THÌ NHẤT ĐỊNH PHẢI LẤY CẢNH GIỚI TRONG HỆ THỐNG TU LUYỆN CỦA YÊU TỘC, TƯƠNG TỰ VỚI CÁC CHỦNG TỘC KHÁC**, theo đúng định dạng "Đại Cảnh Giới + Tiểu Cảnh Giới"), \`tuChat\`.
    *   **Tham số Khuyến Khích (càng nhiều càng tốt để tăng giá trị):** \`title\`, \`spiritualRoot\`, \`specialPhysique\`, \`affinity\`, \`willpower\`, \`obedience\`, \`statsJSON='{"thoNguyen":X, "maxThoNguyen":Y}'\`.
    *   **Ví dụ (Không có 'value'):** \`[AUCTION_SLAVE: name="Nguyệt Thiền", description="Một Thánh nữ của một giáo phái đã bị diệt vong, dung mạo tuyệt thế.", gender="Nữ", race="Nhân Tộc", realm="Trúc Cơ Cửu Trọng", tuChat="Tiên Phẩm", spiritualRoot="Thái Âm Linh Căn", specialPhysique="Nguyệt Âm Thần Thể", willpower=70, obedience=30, affinity=-20, statsJSON='{"thoNguyen": 150, "maxThoNguyen": 400}']\`

*   **Tag NPC Đấu Giá Tạm Thời \`[AUCTION_NPC: ...]\`:**
    *   **Thuộc tính Bắt Buộc:** \`name\`, \`realm\`, \`currency\`.
    *   Ví dụ: \`[AUCTION_NPC: name="Lý Phú Hộ", realm="Kim Đan Nhất Trọng", currency=150000]\`

**VÍ DỤ HOÀN CHỈNH:**
[MESSAGE: "Chào mừng quý vị đến với buổi đấu giá nô lệ đặc biệt nhất trong một trăm năm qua! Những tuyệt sắc giai nhân, những lò luyện công thượng hạng đang chờ đợi chủ nhân mới của mình!"]

[AUCTION_SLAVE: name="Hỏa Ly", description="Nữ tử của Xích Diễm Tộc, mang trong mình huyết mạch Phượng Hoàng, tính cách nóng bỏng và bất kham.", gender="Nữ", race="Yêu Tộc", realm="Kim Đan Nhị Trọng", tuChat="Cực Phẩm", spiritualRoot="Hỏa Linh Căn", specialPhysique="Ly Hỏa Bất Diệt Thể", affinity=-60, willpower=80, obedience=20]
[AUCTION_SLAVE: name="Lam Tuyết", description="Một tán tu bị bắt giữ, tinh thông cầm kỳ thư họa, khí chất băng thanh ngọc khiết.", gender="Nữ", race="Nhân Tộc", realm="Trúc Cơ Đỉnh Phong", tuChat="Thượng Đẳng", spiritualRoot="Băng Linh Căn", specialPhysique="Bình thường", affinity=-10, willpower=60, obedience=40]

[AUCTION_NPC: name="Vạn Tam Thiên", realm="Kim Đan Viên Mãn", currency=800000]
[AUCTION_NPC: name="Ma công tử", realm="Nguyên Anh Tam Trọng", currency=2500000]

- Chỉ trả về các tag, không có lời dẫn hay giải thích gì thêm.
`;
}
