import { KnowledgeBase, FindLocationParams } from '../types';
import * as GameTemplates from '../templates';

export const generateFindLocationPrompt = (
    kb: KnowledgeBase,
    params: FindLocationParams,
    currentPageMessagesLog: string,
    previousPageSummaries: string[],
    lastNarrationFromPreviousPage?: string
): string => {
    const { playerStats, worldConfig, discoveredLocations, currentLocationId } = kb;
    const currentLocation = discoveredLocations.find(loc => loc.id === currentLocationId);

    const context = `
**BỐI CẢNH HIỆN TẠI:**
- **Thế giới:** Chủ đề "${worldConfig?.theme}", thể loại "${worldConfig?.genre}".
- **Người Chơi:** ${worldConfig?.playerName || 'Người Chơi'}, cảnh giới/cấp độ: ${playerStats.realm}.
- **Vị Trí Hiện Tại:** ${currentLocation?.name || 'Không rõ'} (Tọa độ: ${currentLocation?.mapX}, ${currentLocation?.mapY}).
- **Các địa điểm đã biết ở gần (tọa độ tham khảo):**
${discoveredLocations
    .filter(loc => loc.mapX && loc.mapY)
    .slice(0, 10) // Limit for brevity
    .map(loc => `  - ${loc.name} tại (${loc.mapX}, ${loc.mapY})`)
    .join('\n')}

**DIỄN BIẾN CÂU CHUYỆN GẦN ĐÂY (Để AI hiểu tại sao người chơi tìm kiếm):**
- **Tóm tắt các trang trước:**
${previousPageSummaries.join("\n\n") || "Không có."}
- **Diễn biến gần nhất (lượt trước):**
${lastNarrationFromPreviousPage || "Không có."}
- **Diễn biến chi tiết trang hiện tại:**
${currentPageMessagesLog || "Không có."}
`;

    const request = `
**YÊU CẦU TÌM KIẾM CỦA NGƯỜI CHƠI:**
- **Phương thức tìm kiếm:** "${params.searchMethod}"
- **Loại địa điểm mong muốn:** ${params.locationTypes.length > 0 ? params.locationTypes.join(', ') : 'Bất kỳ'}
- **Đặc tính:** ${params.isSafeZone === null ? 'Bất kỳ' : (params.isSafeZone ? 'Phải là khu an toàn' : 'Không phải là khu an toàn')}
- **Từ khóa mô tả:** "${params.keywords}"
`;

    const instructions = `
**NHIỆM VỤ CỦA BẠN (AI):**
Bạn là một AI kể chuyện kiêm người dẫn đường, giúp người chơi khám phá thế giới game. Dựa vào yêu cầu của người chơi, hãy thực hiện hai việc sau:

1.  **VIẾT LỜI KỂ (BẮT BUỘC):**
    *   Dựa vào **phương thức tìm kiếm** ("${params.searchMethod}"), hãy viết một đoạn văn (3-5 câu) mô tả lại quá trình nhân vật của người chơi thực hiện việc tìm kiếm.
    *   **Ví dụ:**
        *   Nếu phương thức là "Hỏi Thăm Dân Địa Phương", hãy kể về việc người chơi đến quán rượu, hỏi chuyện một lão nông, hoặc nghe ngóng tin đồn trong chợ.
        *   Nếu phương thức là "Tra Cứu Cổ Tịch / Bản Đồ Cũ", hãy kể về việc người chơi dành thời gian trong thư viện, tìm thấy một tấm bản đồ da thú cũ kỹ, hoặc giải mã một câu đố cổ.
        *   Nếu phương thức là "Dùng Thần Thức / Linh Cảm", hãy mô tả cảm nhận của nhân vật về luồng linh khí, sát khí, hoặc một tiếng gọi bí ẩn nào đó.
        *   Nếu phương thức là "Đi Lang Thang Vô Định", hãy kể về một chuyến đi không mục đích và sự tình cờ phát hiện ra điều gì đó.
    *   Lời kể này nên được trả về dưới dạng văn bản bình thường (narration).

2.  **TẠO ĐỊA ĐIỂM MỚI (NẾU TÌM THẤY):**
    *   Dựa trên tất cả các tiêu chí (loại địa điểm, đặc tính, từ khóa), hãy quyết định xem việc tìm kiếm có thành công hay không.
    *   **Nếu thành công:** Hãy tạo ra **1 đến 2** địa điểm MỚI HOÀN TOÀN phù hợp với yêu cầu.
    *   Sử dụng tag **[MAINLOCATION: ...]** cho mỗi địa điểm mới. Đây PHẢI là địa điểm chính (top-level), không phải địa điểm phụ.
    *   **BẮT BUỘC** cung cấp đầy đủ các thuộc tính cho tag: \`name\`, \`description\`, \`locationType\`, \`isSafeZone\`, \`mapX\`, \`mapY\`.
    *   **Logic Tọa Độ:** Tọa độ \`mapX\`, \`mapY\` của địa điểm mới nên hợp lý và ở gần vị trí hiện tại của người chơi (${currentLocation?.mapX || 400}, ${currentLocation?.mapY || 300}), nhưng không quá gần để tránh chồng chéo.
    *   **Nếu tìm kiếm thất bại:** Không tạo bất kỳ tag \`[MAINLOCATION]\` nào. Lời kể của bạn ở bước 1 sẽ mô tả sự thất bại đó (ví dụ: "Sau nhiều ngày hỏi thăm, bạn vẫn không tìm thấy ai biết về một hang động như vậy.").

**QUY TẮC ĐỊNH DẠNG TAG:**
*   Tag Địa Điểm: \`[MAINLOCATION: name="Tên", description="Mô tả", locationType="${Object.values(GameTemplates.LocationType).join('|')}", isSafeZone=true/false, mapX=SỐ, mapY=SỐ]\`

**VÍ DỤ HOÀN CHỈNH (Tìm kiếm thành công):**
(Lời kể bạn viết ra sẽ nằm ở đây, ví dụ:)
Sau nhiều ngày lặn lội trong khu rừng phía bắc, dò theo một luồng linh khí yếu ớt, cuối cùng bạn cũng tìm thấy nó. Ẩn sau một thác nước, một cửa hang động cổ xưa hiện ra, không khí bên trong mát lạnh và tĩnh lặng.

[MAINLOCATION: name="Hang Động Tĩnh Lặng", description="Một hang động ẩm ướt, không khí trong lành, có vẻ chưa từng có ai đặt chân đến.", locationType="${GameTemplates.LocationType.CAVE}", isSafeZone=true, mapX=${(currentLocation?.mapX || 400) + 30}, mapY=${(currentLocation?.mapY || 300) - 50}]
`;

    return `
${context}
${request}
${instructions}
`;
};
