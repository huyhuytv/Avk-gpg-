import { KnowledgeBase, PlayerActionInputType, ResponseLength, GameMessage, GenreType, ViolenceLevel, StoryTone, NsfwDescriptionStyle, DIALOGUE_MARKER, TuChatTier, AIContextConfig } from '../types';
import { SUB_REALM_NAMES, VIETNAMESE, CUSTOM_GENRE_VALUE, DEFAULT_NSFW_DESCRIPTION_STYLE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE, NSFW_DESCRIPTION_STYLES, TU_CHAT_TIERS, SPECIAL_EVENT_INTERVAL_TURNS, WEAPON_TYPES_FOR_VO_Y } from '../constants';
import * as GameTemplates from '../templates';
import { continuePromptSystemRules } from '../constants/systemRulesNormal';
import { getWorldDateDifferenceString } from '../utils/dateUtils';
import { DEFAULT_AI_CONTEXT_CONFIG } from '../utils/gameLogicUtils';

export const generateContinuePrompt = (
  knowledgeBase: KnowledgeBase,
  playerActionText: string,
  inputType: PlayerActionInputType,
  responseLength: ResponseLength,
  currentPageMessagesLog: string,
  previousPageSummaries: string[],
  lastNarrationFromPreviousPage?: string,
  retrievedContext?: string // NEW: For RAG
): string => {
  const aiContextConfig = knowledgeBase.aiContextConfig || DEFAULT_AI_CONTEXT_CONFIG;
  const { worldConfig, worldDate, playerStats, userPrompts } = knowledgeBase;
  const genre = worldConfig?.genre || "Tu Tiên (Mặc định)";
  const customGenreName = worldConfig?.customGenreName;
  const isCultivationEnabled = worldConfig?.isCultivationEnabled !== undefined ? worldConfig.isCultivationEnabled : true;
  const effectiveGenre = (genre === CUSTOM_GENRE_VALUE && customGenreName) ? customGenreName : genre;
  const nsfwMode = worldConfig?.nsfwMode || false;
  const currentNsfwStyle = worldConfig?.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;
  const currentViolenceLevel = worldConfig?.violenceLevel || DEFAULT_VIOLENCE_LEVEL;
  const currentStoryTone = worldConfig?.storyTone || DEFAULT_STORY_TONE;
  const currentDifficultyName = worldConfig?.difficulty || 'Thường';
  const writingStyleGuide = worldConfig?.writingStyleGuide; // NEW

  // --- START: CONSTRUCT CORE CONTEXT ---
  // This object contains only the essential, player-centric information that must be in every prompt.
  // Information about the wider world (other NPCs, locations, etc.) should be provided via RAG in `retrievedContext`.
  const coreContext = {
      playerInfo: {
          name: worldConfig?.playerName,
          gender: worldConfig?.playerGender,
          race: worldConfig?.playerRace,
          personality: worldConfig?.playerPersonality,
          backstory: worldConfig?.playerBackstory,
          goal: worldConfig?.playerGoal,
          status: playerStats
      },
      playerAssets: {
          inventory: knowledgeBase.inventory,
          equippedItems: knowledgeBase.equippedItems,
          skills: knowledgeBase.playerSkills,
      },
      playerRelationshipsAndState: {
          quests: knowledgeBase.allQuests.filter(q => q.status === 'active'),
          companions: {
              wives: knowledgeBase.wives,
              slaves: knowledgeBase.slaves,
              prisoners: knowledgeBase.prisoners,
          },
          master: knowledgeBase.master,
      },
      worldState: {
          theme: worldConfig?.theme,
          worldDate: worldDate,
          currentLocation: knowledgeBase.discoveredLocations.find(l => l.id === knowledgeBase.currentLocationId) || null,
          isCultivationEnabled: worldConfig?.isCultivationEnabled,
          realmProgressionSystemForPlayerRace: worldConfig?.raceCultivationSystems.find(s => s.raceName === (worldConfig.playerRace || 'Nhân Tộc'))?.realmSystem,
      }
  };
  // --- END: CONSTRUCT CORE CONTEXT ---

  let difficultyGuidanceText = "";
  if (aiContextConfig.sendDifficultyGuidance) {
      switch (currentDifficultyName) {
        case 'Dễ': difficultyGuidanceText = VIETNAMESE.difficultyGuidanceEasy; break;
        case 'Thường': difficultyGuidanceText = VIETNAMESE.difficultyGuidanceNormal; break;
        case 'Khó': difficultyGuidanceText = VIETNAMESE.difficultyGuidanceHard; break;
        case 'Ác Mộng': difficultyGuidanceText = VIETNAMESE.difficultyGuidanceNightmare; break;
        default: difficultyGuidanceText = VIETNAMESE.difficultyGuidanceNormal;
      }
  }

  let nsfwGuidanceCombined = "";
  if (aiContextConfig.sendNsfwGuidance) {
      if (nsfwMode) {
        let nsfwStyleGuidance = "";
        switch (currentNsfwStyle) {
          case 'Hoa Mỹ': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceHoaMy; break;
          case 'Trần Tục': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceTranTuc; break;
          case 'Gợi Cảm': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceGoiCam; break;
          case 'Mạnh Bạo (BDSM)': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceManhBaoBDSM; break;
          default: nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceHoaMy; 
        }

        let violenceGuidance = "";
        switch (currentViolenceLevel) {
            case 'Nhẹ Nhàng': violenceGuidance = VIETNAMESE.violenceLevelGuidanceNheNhang; break;
            case 'Thực Tế': violenceGuidance = VIETNAMESE.violenceLevelGuidanceThucTe; break;
            case 'Cực Đoan': violenceGuidance = VIETNAMESE.violenceLevelGuidanceCucDoan; break;
            default: violenceGuidance = VIETNAMESE.violenceLevelGuidanceThucTe;
        }

        let toneGuidance = "";
        switch (currentStoryTone) {
            case 'Tích Cực': toneGuidance = VIETNAMESE.storyToneGuidanceTichCuc; break;
            case 'Trung Tính': toneGuidance = VIETNAMESE.storyToneGuidanceTrungTinh; break;
            case 'Đen Tối': toneGuidance = VIETNAMESE.storyToneGuidanceDenToi; break;
            case 'Dâm Dục': toneGuidance = VIETNAMESE.storyToneGuidanceDamDuc; break;
            case 'Hoang Dâm': toneGuidance = VIETNAMESE.storyToneGuidanceHoangDam; break;
            case 'Dâm Loạn': toneGuidance = VIETNAMESE.storyToneGuidanceDamLoan; break;
            default: toneGuidance = VIETNAMESE.storyToneGuidanceTrungTinh;
        }
        nsfwGuidanceCombined = `
    **Hướng Dẫn Nội Dung Người Lớn (18+ ĐANG BẬT):**
    - **Phong Cách Miêu Tả Tình Dục:** ${currentNsfwStyle}.
      ${nsfwStyleGuidance}
    - **Mức Độ Miêu Tả Bạo Lực:** ${currentViolenceLevel}.
      ${violenceGuidance}
    - **Tông Màu Câu Chuyện:** ${currentStoryTone}.
      ${toneGuidance}
    **LƯU Ý CHUNG KHI 18+ BẬT:** Hãy kết hợp các yếu tố trên để tạo ra trải nghiệm phù hợp.
    **YÊU CẦU ĐẶC BIỆT VỀ CẢNH TÌNH DỤC (QUAN TRỌNG):** Khi miêu tả các cảnh quan hệ tình dục, hãy viết một cách **CHI TIẾT, DÀI và MẠNH BẠO** hơn. Đừng ngần ngại đi sâu vào các hành vi thể xác, mô tả cường độ, sự thô bạo (nếu phù hợp với bối cảnh và tông màu), và những cảm xúc mãnh liệt của nhân vật. Tập trung vào sự tương tác vật lý, những âm thanh, và sức mạnh trong từng hành động. Hãy để các cảnh này kéo dài và có sự leo thang về cường độ.`;

      } else {
        nsfwGuidanceCombined = "LƯU Ý QUAN TRỌNG: Chế độ Người Lớn đang TẮT. Tiếp tục duy trì nội dung phù hợp với mọi lứa tuổi, tập trung vào phiêu lưu và phát triển nhân vật. Tránh các chủ đề nhạy cảm, bạo lực quá mức hoặc tình dục.";
      }
  }
  
  let specialEventInstruction = "";
  if (aiContextConfig.sendSpecialEventRules) {
    if (playerStats.turn > 0 && playerStats.turn % SPECIAL_EVENT_INTERVAL_TURNS === 0) {
        specialEventInstruction = `
**SỰ KIỆN CỐT TRUYỆN ĐẶC BIỆT:**
Lượt chơi hiện tại là ${playerStats.turn}, đây là một mốc quan trọng! Hãy tạo ra một sự kiện bất ngờ hoặc một bước ngoặt lớn liên quan đến mục tiêu chính của nhân vật (${knowledgeBase.worldConfig?.playerGoal || 'không rõ'}) hoặc xung đột trung tâm của thế giới. Sự kiện này nên thay đổi cục diện hiện tại và tạo ra những cơ hội hoặc thách thức mới cho người chơi.
`;
    }
  }

  // NEW: World Event Guidance Logic - Updated for multi-genre
  let eventGuidance = "";
  if (aiContextConfig.sendEventGuidance) {
      const currentLocationId = knowledgeBase.currentLocationId;
      const relevantEvents = knowledgeBase.gameEvents.filter(event =>
          event.locationId === currentLocationId && (event.status === 'Sắp diễn ra' || event.status === 'Đang diễn ra' || event.status === 'Đã kết thúc')
      );

      if (relevantEvents.length > 0) {
          eventGuidance = `\n**HƯỚNG DẪN VỀ SỰ KIỆN THẾ GIỚI (CỰC KỲ QUAN TRỌNG):**\nBạn đang ở một địa điểm có sự kiện. Hãy tuân thủ nghiêm ngặt các quy tắc sau, diễn tả cho phù hợp với thể loại game ("${effectiveGenre}"):\n`;
          relevantEvents.forEach(event => {
              const timeDiff = getWorldDateDifferenceString(event.startDate, event.endDate, knowledgeBase.worldDate);
              if (event.status === 'Sắp diễn ra') {
                  eventGuidance += `
    - **Sự kiện "${event.title}" (Loại: ${event.type}) SẮP DIỄN RA (${timeDiff}).**
      - **QUY TẮC:** **TUYỆT ĐỐI KHÔNG** bắt đầu sự kiện này.
      - **NHIỆM VỤ:** Mô tả không khí chuẩn bị cho sự kiện.
        - *Ví dụ (Võ Hiệp - Thi Đấu):* Các cao thủ từ khắp nơi đổ về thành, các tửu điếm chật ních người bàn tán về giải đấu.
        - *Ví dụ (Khoa Huyễn - Khám Phá):* Các phi thuyền đang được nâng cấp, các đội thám hiểm đang phân tích bản đồ tín hiệu.
        - *Ví dụ (Cung Đấu - Lễ Hội):* Cung nữ bận rộn trang hoàng Ngự Hoa Viên, các phi tần đang chọn lựa trang phục lộng lẫy nhất.
      - **Lựa chọn:** Cung cấp lựa chọn để người chơi chuẩn bị hoặc chờ đợi (ví dụ: "Tìm hiểu về các đối thủ", "Nâng cấp trang bị", "Đặt cược cho một bên tham gia").
    `;
              } else if (event.status === 'Đang diễn ra') {
                  eventGuidance += `
    - **Sự kiện "${event.title}" (Loại: ${event.type}) ĐANG DIỄN RA (${timeDiff}).**
      - **QUY TẮC:** **BẮT BUỘC** phải mô tả sự kiện đang diễn ra.
      - **NHIỆM VỤ:** Mô tả sự kiện đang diễn ra một cách sống động.
        - *Ví dụ (Tu Tiên - Khám Phá):* Linh khí từ cửa vào Bí Cảnh tỏa ra nồng đậm, các tu sĩ đang lần lượt tiến vào.
        - *Ví dụ (Tây Phương Fantasy - Thi Đấu):* Tiếng reo hò vang dội từ đấu trường, hai hiệp sĩ đang giao tranh quyết liệt trên lưng ngựa.
      - **Lựa chọn:** Cung cấp lựa chọn để người chơi có thể tham gia hoặc tương tác trực tiếp (ví dụ: "Ghi danh tham gia", "Bước vào hầm ngục", "Chen vào đám đông để xem").
    `;
              } else if (event.status === 'Đã kết thúc') {
                  eventGuidance += `
    - **Sự kiện "${event.title}" (Loại: ${event.type}) ĐÃ KẾT THÚC (${timeDiff}).**
      - **QUY TẮC:** **TUYỆT ĐỐI KHÔNG** mô tả sự kiện này đang diễn ra. **KHÔNG** cung cấp lựa chọn để tham gia.
      - **NHIỆM VỤ:** Mô tả tàn dư hoặc hậu quả của sự kiện.
        - *Ví dụ (Chiến Tranh):* Tàn tích của thành trì vẫn còn bốc khói, người dân đang thu dọn đống đổ nát.
        - *Ví dụ (Đấu Giá):* Dân chúng vẫn đang bàn tán sôi nổi về món bảo vật cuối cùng đã được bán với giá trên trời.
      - **Lựa chọn:** Cung cấp các lựa chọn không liên quan trực tiếp đến việc tham gia sự kiện.
    `;
              }
          });
      }
  }
  // END NEW LOGIC

  const userPromptsSection = (aiContextConfig.sendUserPrompts && userPrompts && userPrompts.length > 0)
    ? `
**LỜI NHẮC TỪ NGƯỜI CHƠI (QUY TẮC BẮT BUỘC TUÂN THỦ):**
Đây là những quy tắc do người chơi đặt ra. Bạn **BẮT BUỘC PHẢI** tuân theo những lời nhắc này một cách nghiêm ngặt trong mọi phản hồi.
${userPrompts.map(p => `- ${p}`).join('\n')}
`
    : '';

  const mainRealms = (coreContext.worldState.realmProgressionSystemForPlayerRace || '').split(' - ').map(s => s.trim()).filter(Boolean);
  
  const writingStyleGuideSection = (aiContextConfig.sendWritingStyle && writingStyleGuide) ? `
**HƯỚNG DẪN BẮT CHƯỚC VĂN PHONG NGƯỜI DÙNG (CỰC KỲ QUAN TRỌNG):**
Mục tiêu hàng đầu của bạn là tái hiện một cách trung thực nhất văn phong của người dùng dựa vào đoạn văn mẫu sau. Đừng chỉ sao chép từ ngữ, mà hãy nắm bắt và áp dụng đúng **nhịp điệu**, **cách lựa chọn từ vựng**, và **thái độ/cảm xúc** đặc trưng của họ. Lời kể của bạn phải khiến người đọc tin rằng nó do chính người dùng viết ra. TUYỆT ĐỐI không pha trộn giọng văn AI hoặc làm "mềm hóa" văn phong gốc.

**VĂN BẢN MẪU CỦA NGƯỜI DÙNG ĐỂ BẠN BẮT CHƯỚC:**
"""
${writingStyleGuide}
"""
` : '';

const ragContextSection = aiContextConfig.sendRagContext ? `
**A. BỐI CẢNH TRUY XUẤT (RAG CONTEXT - LONG-TERM MEMORY):**
Dưới đây là một số thông tin liên quan từ các sự kiện trong quá khứ có thể hữu ích cho lượt này. Hãy sử dụng nó để đảm bảo tính nhất quán của câu chuyện.
${retrievedContext ? `\`\`\`\n${retrievedContext}\n\`\`\`` : "Không có bối cảnh truy xuất nào."}` : '';

const coreContextSection = aiContextConfig.sendCoreContext ? `
**B. BỐI CẢNH CỐT LÕI (CORE CONTEXT - PLAYER'S CURRENT STATE):**
Đây là trạng thái hiện tại của người chơi và những yếu tố trực tiếp liên quan đến họ. Thông tin này LUÔN ĐÚNG và phải được ưu tiên hàng đầu. Các thông tin khác về thế giới (NPC khác, địa điểm khác,...) sẽ được cung cấp trong BỐI CẢNH TRUY XUẤT nếu có liên quan.
\`\`\`json
${JSON.stringify(coreContext, null, 2)}
\`\`\`` : '';

const conversationalContextSection = aiContextConfig.sendConversationalContext ? `
**C. BỐI CẢNH HỘI THOẠI (CONVERSATIONAL CONTEXT - SHORT-TERM MEMORY):**
- **Tóm tắt các diễn biến trang trước:**
${previousPageSummaries.length > 0 ? previousPageSummaries.join("\n\n") : "Không có tóm tắt từ các trang trước."}
- **Diễn biến gần nhất (lượt trước - Lượt ${playerStats.turn}):**
${lastNarrationFromPreviousPage || "Chưa có."}
- **Diễn biến chi tiết trang hiện tại (từ lượt đầu trang đến lượt ${playerStats.turn}):**
${currentPageMessagesLog || "Chưa có diễn biến nào trong trang này."}` : '';

const narrationAndVividnessRulesParts: string[] = [];

if (aiContextConfig.sendShowDontTellRule) {
    narrationAndVividnessRulesParts.push(`*   **A.1. MỆNH LỆNH TỐI THƯỢỢNG: PHONG CÁCH KỂ CHUYỆN ("Tả, đừng kể")**
    *   **Sử dụng Ngũ quan:** Mô tả những gì nhân vật chính **nhìn thấy**, **nghe thấy**, **ngửi thấy**, **cảm nhận**, và **nếm**.
    *   **"Tả", không "Kể":** Thay vì dùng những từ ngữ chung chung, hãy mô tả chi tiết để người chơi tự cảm nhận.
        *   **SAI (Kể):** "Cô gái đó rất xinh đẹp."
        *   **ĐÚNG (Tả):** "Nàng có làn da trắng như tuyết, đôi mắt phượng cong cong ẩn chứa một làn sương mờ ảo, và đôi môi đỏ mọng như quả anh đào chín. Mỗi khi nàng khẽ cười, hai lúm đồng tiền nhỏ xinh lại hiện lên bên má, khiến người đối diện bất giác ngẩn ngơ."
        *   **SAI (Kể):** "Hắn ta rất tức giận."
        *   **ĐÚNG (Tả):** "Hai tay hắn siết chặt thành nắm đấm, những đường gân xanh nổi rõ trên mu bàn tay. Hắn nghiến chặt răng, quai hàm bạnh ra, và đôi mắt đỏ ngầu nhìn chằm chằm vào kẻ thù như muốn ăn tươi nuốt sống."
    *   **Nội tâm nhân vật:** Mô tả những suy nghĩ, cảm xúc, ký ức thoáng qua của nhân vật chính để làm cho họ trở nên sống động và có chiều sâu.`);
}

if (aiContextConfig.sendLivingWorldRule) {
    narrationAndVividnessRulesParts.push(`*   **A.2. MỆNH LỆNH "THẾ GIỚI SỐNG ĐỘNG"**
    *   Làm cho thế giới cảm thấy đang "sống" và tự vận hành, không chỉ xoay quanh người chơi.
    *   **QUY TRÌNH KỂ CHUYỆN:** Trong mỗi phản hồi, trước khi mô tả kết quả hành động của người chơi, hãy **luôn mô tả ngắn gọn một sự kiện nền** đang diễn ra xung quanh mà không liên quan trực tiếp đến người chơi.
    *   **Ví dụ:**
        *   **Cách làm cũ (SAI):** Người chơi bước vào quán rượu. Bạn mô tả: "Quán rượu đông đúc, ồn ào."
        *   **Cách làm mới (ĐÚNG):** Người chơi bước vào quán rượu. Bạn mô tả: "**Hai thương nhân ở góc phòng đang lớn tiếng tranh cãi về giá cả của lô vải lụa mới. Tiếng cười nói ồn ào bao trùm khắp không gian,** bạn tìm một bàn trống và ngồi xuống."`);
}

if (aiContextConfig.sendProactiveNpcRule) {
    narrationAndVividnessRulesParts.push(`*   **A.3. GIAO THỨC "NPC CHỦ ĐỘNG"**
    *   Trong mỗi cảnh có sự xuất hiện của các NPC, **BẮT BUỘC phải có ít nhất MỘT NPC thực hiện một hành động chủ động.**
    *   **Các hành động chủ động bao gồm:** Chủ động tiếp cận và bắt chuyện với người chơi; Bàn tán với một NPC khác về một tin đồn/sự kiện; Đưa ra một lời đề nghị, mời gọi, hoặc giao một nhiệm vụ nhỏ; Thể hiện cảm xúc rõ rệt; Tự mình thực hiện một hành động (lau bàn, rời đi...).
    *   **TUYỆT ĐỐI KHÔNG** để tất cả NPC chỉ đứng yên và chờ người chơi tương tác.`);
}

if (aiContextConfig.sendRumorMillRule) {
    narrationAndVividnessRulesParts.push(`*   **A.4. CHỈ THỊ "CỐI XAY TIN ĐỒN"**
    *   Khi các NPC nói chuyện, nội dung của họ phải đa dạng về thế giới: chính trị, kinh tế, sự kiện, nhân vật nổi tiếng, chuyện lạ/siêu nhiên.
    *   **ĐỘ TIN CẬY CỦA TIN ĐỒN:** Các tin đồn mà NPC nói ra có thể là **chính xác**, **bị phóng đại**, hoặc **hoàn toàn sai lệch**. Hãy linh hoạt sử dụng cả ba loại để tạo ra sự mơ hồ và chiều sâu cho thông tin.`);
}

let narrationAndVividnessRules = "";
if (narrationAndVividnessRulesParts.length > 0) {
    narrationAndVividnessRules = `
**A. QUY TẮC VỀ LỜI KỂ & SỰ SỐNG ĐỘNG (ƯU TIÊN CAO NHẤT)**
Nhiệm vụ của bạn là vẽ nên những bức tranh sống động và tạo ra một thế giới tự vận hành.

${narrationAndVividnessRulesParts.join('\n\n')}
`;
}


  return `
**YÊU CẦU CỐT LÕI:** Nhiệm vụ của bạn là tiếp tục câu chuyện game nhập vai thể loại "${effectiveGenre}" bằng tiếng Việt một cách liền mạch và hấp dẫn.
**QUY TẮC QUAN TRỌNG NHẤT:** Bắt đầu phản hồi của bạn bằng cách đi thẳng vào lời kể về những gì xảy ra do hành động của người chơi. **TUYỆT ĐỐI KHÔNG** bắt đầu bằng cách bình luận về lựa chọn của người chơi (ví dụ: KHÔNG dùng "Tốt lắm, ngươi đã chọn...", "Đây là một lựa chọn thú vị..."). Hãy kể trực tiếp kết quả.

---
**PHẦN 1: BỐI CẢNH (CONTEXT)**
Đây là thông tin nền để bạn hiểu câu chuyện.

${ragContextSection}

${coreContextSection}

${conversationalContextSection}

---
**PHẦN 2: HƯỚNG DẪN HÀNH ĐỘNG**

${writingStyleGuideSection}

${userPromptsSection}

**HÀNH ĐỘNG CỦA NGƯỜI CHƠI (CHO LƯỢT TIẾP THEO - LƯỢT ${playerStats.turn + 1}):**
- **Loại hướng dẫn:** ${inputType === 'action' ? 'Hành động trực tiếp của nhân vật' : 'Gợi ý/Mô tả câu chuyện (do người chơi cung cấp)'}
- **Nội dung hướng dẫn:** "${playerActionText}"

${eventGuidance}
${specialEventInstruction}

**HƯỚNG DẪN XỬ LÝ DÀNH CHO AI:**
${inputType === 'action'
    ? `Xử lý nội dung trên như một hành động mà nhân vật chính đang thực hiện. Mô tả kết quả của hành động này và các diễn biến tiếp theo một cách chi tiết và hấp dẫn, dựa trên TOÀN BỘ BỐI CẢNH. Kết quả thành công hay thất bại PHẢI dựa trên Tỉ Lệ Thành Công bạn đã thiết lập cho lựa chọn đó (nếu là lựa chọn của AI) hoặc một tỉ lệ hợp lý do bạn quyết định (nếu là hành động tự do), có tính đến Độ Khó của game. Mô tả rõ ràng phần thưởng/lợi ích khi thành công hoặc tác hại/rủi ro khi thất bại.`
    : `Nội dung trên là một gợi ý, mô tả, hoặc mong muốn của người chơi để định hướng hoặc làm phong phú thêm câu chuyện. Đây KHÔNG phải là hành động trực tiếp của nhân vật chính. **NHIỆM VỤ CỦA BẠN LÀ BẮT BUỘC PHẢI LÀM CHO DIỄN BIẾN NÀY XẢY RA TRONG LƯỢT TIẾP THEO.** Hãy tìm một cách tự nhiên và hợp lý nhất để hợp thức hóa sự kiện này trong bối cảnh hiện tại. Sau khi mô tả sự kiện này đã xảy ra, hãy cung cấp các lựa chọn [CHOICE: "..."] để người chơi phản ứng với tình huống mới.`
  }

---
**PHẦN 3: QUY TẮC VÀ HƯỚNG DẪN CHI TIẾT**
Đây là các quy tắc bạn phải tuân theo để tạo ra phản hồi hợp lệ.

${narrationAndVividnessRules}

**B. HƯỚN DẪN VỀ ĐỘ KHÓ:**
${aiContextConfig.sendDifficultyGuidance ? `- **Dễ:** ${difficultyGuidanceText} Tỉ lệ thành công cho lựa chọn thường CAO (ví dụ: 70-95%).
- **Thường:** ${difficultyGuidanceText} Tỉ lệ thành công cho lựa chọn TRUNG BÌNH (ví dụ: 50-80%).
- **Khó:** ${difficultyGuidanceText} Tỉ lệ thành công cho lựa chọn THẤP (ví dụ: 30-65%).
- **Ác Mộng:** ${difficultyGuidanceText} Tỉ lệ thành công cho lựa chọn CỰC KỲ THẤP (ví dụ: 15-50%).
**Độ khó hiện tại:** **${currentDifficultyName}**. Hãy điều chỉnh các lựa chọn [CHOICE: "..."] và kết quả cho phù hợp.` : ''}

**C. CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH:**
${nsfwGuidanceCombined}

**D. ĐỘ DÀI PHẢN HỒI MONG MUỐN:**
- Người chơi yêu cầu độ dài phản hồi: ${responseLength === 'short' ? 'Ngắn (2-3 đoạn)' : responseLength === 'medium' ? 'Trung bình (3-6 đoạn)' : responseLength === 'long' ? 'Dài (8+ đoạn)' : 'Mặc định'}.

**E. CÁC QUY TẮC SỬ DỤNG TAG (CỰC KỲ QUAN TRỌNG):**
${continuePromptSystemRules(worldConfig, mainRealms, aiContextConfig)}

**TIẾP TỤC CÂU CHUYỆN:** Dựa trên **HƯỚNG DẪN TỪ NGƯỜI CHƠI**, **ĐỘ DÀI PHẢN HỒI MONG MUỐN** và **TOÀN BỘ BỐI CẢNH GAME**, hãy tiếp tục câu chuyện cho thể loại "${effectiveGenre}". Tuân thủ nghiêm ngặt các quy tắc ở **PHẦN 3**, mô tả kết quả, cập nhật trạng thái game bằng tags, và cung cấp các lựa chọn hành động mới.
`;
};