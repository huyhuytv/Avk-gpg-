import { WorldSettings, DIALOGUE_MARKER, AIContextConfig } from '../types';
import * as GameTemplates from '../templates';
import { WEAPON_TYPES_FOR_VO_Y, TU_CHAT_TIERS, ALL_FACTION_ALIGNMENTS, SUB_REALM_NAMES } from '../constants';
import { CONG_PHAP_GRADES, LINH_KI_CATEGORIES, LINH_KI_ACTIVATION_TYPES, PROFESSION_GRADES } from '../templates';
import { continuePromptSystemRules as baseContinuePromptSystemRules } from './systemRulesNormal'; // Renamed to avoid conflict

export const prisonContinuePromptSystemRules = (worldConfig: WorldSettings | null, statusType: 'Tù Nhân' | 'Nô Lệ', mainRealms: string[], config: AIContextConfig ): string => {
    const rules: string[] = [];

    rules.push(`**QUY TẮC BỐI CẢNH (CỰC KỲ QUAN TRỌNG):**`);
    if (config.sendSpecialStatusRules) {
        rules.push(`*   **Tag \\\`[PLAYER_SPECIAL_STATUS_UPDATE: ...]\`\\\` (Cực kỳ quan trọng cho bối cảnh này):**
    *   Sử dụng để cập nhật các chỉ số đặc biệt của thân phận ${statusType}.
    *   **Tham số hợp lệ:** \`willpower\`, \`resistance\`, \`obedience\`, \`fear\`, \`trust\`.
    *   **Cách dùng:** Luôn dùng thay đổi tương đối, ví dụ: \`willpower=+=5\`, \`resistance=-=10\`.`);
        rules.push(`*   **Tag \\\`[MASTER_UPDATE: ...]\`\\\` (Cực kỳ quan trọng cho bối cảnh này):**
    *   Dùng để cập nhật trạng thái và nhu cầu của Chủ Nhân.
    *   **Tham số hợp lệ:** \`mood\`, \`currentGoal\`, \`favor\`, \`affinity\`, \`needs.Dục Vọng\`, \`needs.Tham Vọng\`, v.v.
    *   **Cách dùng:** \`mood='Vui Vẻ'\`, \`favor=+=10\`, \`needs.Dục Vọng=-=50\`.`);
        rules.push(`*   **Tag \\\`[BECOMEFREE]\`\\\`:** Dùng khi người chơi trốn thoát hoặc được trả tự do. Tag này sẽ xóa bỏ thân phận ${statusType} và đối tượng Chủ Nhân.`);
    }

    rules.push('---');
    rules.push('**QUY TẮC CHUNG (BẮT BUỘC ÁP DỤNG CHO MỌI PHẢN HỒI):**');
    
    // Re-use the normal rules function but filter out prison-specific ones if they are duplicated.
    const baseRules = baseContinuePromptSystemRules(worldConfig, mainRealms, config); // Assuming this is now refactored.
    rules.push(baseRules);
    
    return rules.join('\n\n');
};