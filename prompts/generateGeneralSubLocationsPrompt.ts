
import { KnowledgeBase, GameLocation } from '../types';
import * as GameTemplates from '../templates';

export const generateGeneralSubLocationsPrompt = (mainLocation: GameLocation, kb: KnowledgeBase): string => {
    const { worldConfig } = kb;

    let locationTypeString = "địa điểm";
    if (mainLocation.locationType === GameTemplates.LocationType.TOWN) {
        locationTypeString = "thị trấn";
    } else if (mainLocation.locationType === GameTemplates.LocationType.CITY) {
        locationTypeString = "thành phố";
    } else if (mainLocation.locationType === GameTemplates.LocationType.CAPITAL) {
        locationTypeString = "thủ đô";
    } else if (mainLocation.locationType === GameTemplates.LocationType.SECT_CLAN) {
        locationTypeString = "tông môn/gia tộc";
    } else if (mainLocation.locationType === GameTemplates.LocationType.VILLAGE) {
        locationTypeString = "làng mạc";
    }

    // Suggest relevant non-economic sub-locations based on the main location type
    let suggestion = `Ví dụ: Một "Quảng trường trung tâm", một "Thư viện cổ", một "Phủ thành chủ", hoặc một "Khu dân cư đông đúc".`;
    if (mainLocation.locationType === GameTemplates.LocationType.SECT_CLAN) {
        suggestion = `Ví dụ: "Đại điện nghị sự", "Tàng Kinh Các", "Khu ở của đệ tử", "Luyện võ trường", "Đan phòng".`
    } else if (mainLocation.locationType === GameTemplates.LocationType.FOREST) {
        suggestion = `Ví dụ: "Con suối trong vắt", "Cây cổ thụ nghìn năm", "Bãi đất trống bí ẩn".`
    } else if (mainLocation.locationType === GameTemplates.LocationType.DUNGEON) {
         suggestion = `Ví dụ: "Sảnh chính", "Ngã ba đường hầm", "Phòng chứa báu vật (trống rỗng)", "Bàn thờ cổ".`
    }


    return `Bạn là một AI kiến tạo thế giới game nhập vai, chuyên tạo ra các chi tiết và địa điểm thú vị để làm cho thế giới trở nên sống động.
Người chơi vừa lần đầu tiên đặt chân đến **${mainLocation.name}**, một ${locationTypeString}. Hãy tạo ra các khu vực phụ **phi kinh tế** đặc trưng cho nơi này.

**BỐI CẢNH:**
- **Địa Điểm Chính:** ${mainLocation.name} (ID: ${mainLocation.id}, Loại: ${mainLocation.locationType || 'Không rõ'}, Mô tả: ${mainLocation.description})
- **Thế Giới:** Chủ đề "${worldConfig?.theme}", thể loại "${worldConfig?.genre}".

**YÊU CẦU:**
1.  **Tạo 2-4 Địa Điểm Phụ (Sub-Location) Đặc Trưng:**
    *   Tạo ra các địa điểm con **phi kinh tế** bên trong **${mainLocation.name}**. ${suggestion}
    *   **KHÔNG** tạo các địa điểm kinh tế như Cửa Hàng, Chợ, Thương Thành, Đấu Giá Hội ở đây. Chúng đã được tạo riêng.
    *   Sử dụng tag **[SUBLOCATION: ...]** cho mỗi địa điểm.
    *   **CỰC KỲ QUAN TRỌNG:** Thuộc tính \`parentLocationId\` PHẢI sử dụng giá trị chính xác sau đây: \`parentLocationId="${mainLocation.id}"\`. **KHÔNG** được tự ý thay đổi, đoán, hay tạo mới giá trị này.
    *   **BẮT BUỘC** phải có thuộc tính \`locationType\` là một trong các loại sau: \`${Object.values(GameTemplates.SubLocationType).join(' | ')}\`.
    *   Mô tả của địa điểm phụ nên độc đáo và phù hợp với bối cảnh chung của **${mainLocation.name}**.

**VÍ DỤ KẾT QUẢ (Nếu địa điểm chính là một Thành Phố):**

[SUBLOCATION: name="Quảng trường trung tâm", description="Nơi đông đúc nhất thành phố, với một đài phun nước lớn và tượng của vị thành chủ đầu tiên.", locationType="${GameTemplates.SubLocationType.PLAZA}", parentLocationId="${mainLocation.id}", isSafeZone=true]
[SUBLOCATION: name="Phủ Thành Chủ", description="Một dinh thự uy nghiêm được canh gác cẩn mật, là nơi ở và làm việc của thành chủ hiện tại.", locationType="${GameTemplates.SubLocationType.GOVERNMENT_BUILDING}", parentLocationId="${mainLocation.id}", isSafeZone=true]
[SUBLOCATION: name="Tháp Canh Phía Đông", description="Một tháp canh cũ kỹ nhưng vẫn vững chãi, từ đây có thể nhìn bao quát cả một vùng rộng lớn bên ngoài thành.", locationType="${GameTemplates.SubLocationType.TOWER}", parentLocationId="${mainLocation.id}", isSafeZone=true]

**LƯU Ý QUAN TRỌNG:**
- Chỉ trả về các tag, không có lời dẫn hay giải thích gì thêm.
`;
};
