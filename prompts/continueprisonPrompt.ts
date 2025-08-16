
import { KnowledgeBase, PlayerActionInputType, ResponseLength, GameMessage, DIALOGUE_MARKER, Master, AIContextConfig } from '../types';
import { VIETNAMESE, CUSTOM_GENRE_VALUE, DEFAULT_NSFW_DESCRIPTION_STYLE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE, WEAPON_TYPES_FOR_VO_Y, TU_CHAT_TIERS, ALL_FACTION_ALIGNMENTS, SUB_REALM_NAMES } from '../constants';
import * as GameTemplates from '../templates';
import { prisonContinuePromptSystemRules } from '../constants/systemRulesPrison';
import { getWorldDateDifferenceString } from '../utils/dateUtils';
import { DEFAULT_AI_CONTEXT_CONFIG } from '../utils/gameLogicUtils';

export const generateContinuePrisonPrompt = (
  knowledgeBase: KnowledgeBase,
  playerActionText: string,
  inputType: PlayerActionInputType,
  responseLength: ResponseLength,
  currentPageMessagesLog: string,
  previousPageSummaries: string[],
  lastNarrationFromPreviousPage?: string,
  retrievedContext?: string // NEW: Added for RAG
): string => {
  const aiContextConfig = knowledgeBase.aiContextConfig || DEFAULT_AI_CONTEXT_CONFIG;
  const { worldConfig, worldDate, playerStats, master, userPrompts } = knowledgeBase;
  const genre = worldConfig?.genre || "Tu Tiên (Mặc định)";
  const customGenreName = worldConfig?.customGenreName;
  const effectiveGenre = (genre === CUSTOM_GENRE_VALUE && customGenreName) ? customGenreName : genre;
  const nsfwMode = worldConfig?.nsfwMode || false;
  const currentNsfwStyle = worldConfig?.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;
  const currentViolenceLevel = worldConfig?.violenceLevel || DEFAULT_VIOLENCE_LEVEL;
  const currentStoryTone = worldConfig?.storyTone || DEFAULT_STORY_TONE;
  const currentDifficultyName = worldConfig?.difficulty || 'Thường';

  const specialStatus = playerStats.playerSpecialStatus;
  const statusType = specialStatus?.type === 'prisoner' ? 'Tù Nhân' : 'Nô Lệ';

  // --- START: CONSTRUCT CORE CONTEXT ---
  const coreContext = {
      playerInfo: {
          name: worldConfig?.playerName,
          gender: worldConfig?.playerGender,
          race: worldConfig?.playerRace,
          personality: worldConfig?.playerPersonality,
          backstory: worldConfig?.playerBackstory,
          goal: worldConfig?.playerGoal,
          status: playerStats // Includes specialStatus
      },
      playerAssets: {
          inventory: knowledgeBase.inventory,
          equippedItems: knowledgeBase.equippedItems,
          skills: knowledgeBase.playerSkills,
      },
      masterInfo: master, // Direct info about the master
      worldState: {
          theme: worldConfig?.theme,
          worldDate: worldDate,
          currentLocation: knowledgeBase.discoveredLocations.find(l => l.id === knowledgeBase.currentLocationId) || null,
          isCultivationEnabled: worldConfig?.isCultivationEnabled,
          realmProgressionSystemForPlayerRace: worldConfig?.raceCultivationSystems.find(s => s.raceName === (worldConfig.playerRace || 'Nhân Tộc'))?.realmSystem,
      }
  };
  // --- END: CONSTRUCT CORE CONTEXT ---


  let nsfwGuidanceCombined = "";
  if (aiContextConfig.sendNsfwGuidance && nsfwMode) {
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
**Đặc Biệt Với ${statusType}:** Khi tương tác tình dục, hãy để họ và người chơi sử dụng nhiều lời nói dâm đãng, tục tĩu, và tiếng rên rỉ hơn. Thể hiện sự thống trị của người chơi và sự phục tùng (hoặc miễn cưỡng) của ${statusType}. Mức độ và phong cách của lời nói phải phù hợp với mối quan hệ và phong cách 18+ đã chọn.
**YÊU CẦU ĐẶC BIỆT VỀ CẢNH TÌNH DỤC (QUAN TRỌNG):** Khi miêu tả các cảnh quan hệ tình dục, hãy viết một cách **CHI TIẾT, DÀI và MẠNH BẠO** hơn. Đừng ngần ngại đi sâu vào các hành vi thể xác, mô tả cường độ, sự thô bạo (nếu phù hợp với bối cảnh và tông màu), và những cảm xúc mãnh liệt của nhân vật. Tập trung vào sự tương tác vật lý, những âm thanh, và sức mạnh trong từng hành động. Hãy để các cảnh này kéo dài và có sự leo thang về cường độ.`;
  } else if (aiContextConfig.sendNsfwGuidance) {
      nsfwGuidanceCombined = "LƯU Ý QUAN TRỌNG: Chế độ Người Lớn đang TẮT. Tiếp tục duy trì nội dung phù hợp với mọi lứa tuổi, tập trung vào phiêu lưu và phát triển nhân vật. Tránh các chủ đề nhạy cảm, bạo lực quá mức hoặc tình dục.";
  }
  
  // NEW: World Event Guidance Logic (for consistency, though less likely to trigger in prison)
  let eventGuidance = "";
  if (aiContextConfig.sendEventGuidance) {
      const currentLocationId = knowledgeBase.currentLocationId;
      const relevantEvents = knowledgeBase.gameEvents.filter(event =>
          event.locationId === currentLocationId && (event.status === 'Sắp diễn ra' || event.status === 'Đang diễn ra' || event.status === 'Đã kết thúc')
      );

      if (relevantEvents.length > 0) {
          eventGuidance = `\n**HƯỚNG DẪN VỀ SỰ KIỆN THẾ GIỚI (CỰC KỲ QUAN TRỌNG):**\nBạn đang ở một địa điểm có sự kiện. Hãy tuân thủ nghiêm ngặt các quy tắc sau:\n`;
          relevantEvents.forEach(event => {
              const timeDiff = getWorldDateDifferenceString(event.startDate, event.endDate, knowledgeBase.worldDate);
              if (event.status === 'Sắp diễn ra') {
                  eventGuidance += `
    - **Sự kiện "${event.title}" SẮP DIỄN RA (${timeDiff}).**
      - **QUY TẮC:** **TUYỆT ĐỐI KHÔNG** bắt đầu sự kiện này.
      - **NHIỆM VỤ:** Hãy mô tả không khí chuẩn bị cho sự kiện. Cung cấp các lựa chọn cho người chơi để chuẩn bị hoặc chờ đợi.
    `;
              } else if (event.status === 'Đang diễn ra') {
                  eventGuidance += `
    - **Sự kiện "${event.title}" ĐANG DIỄN RA (${timeDiff}).**
      - **QUY TẮC:** **BẮT BUỘC** phải mô tả sự kiện đang diễn ra.
      - **NHIỆM VỤ:** Cung cấp các lựa chọn để người chơi có thể tham gia hoặc tương tác trực tiếp với sự kiện.
    `;
              } else if (event.status === 'Đã kết thúc') {
                  eventGuidance += `
    - **Sự kiện "${event.title}" ĐÃ KẾT THÚC (${timeDiff}).**
      - **QUY TẮC:** **TUYỆT ĐỐI KHÔNG** mô tả sự kiện này đang diễn ra. **KHÔNG** cung cấp lựa chọn để tham gia.
      - **NHIỆM VỤ:** Hãy mô tả tàn dư hoặc hậu quả của sự kiện. Ví dụ: "khu vực quảng trường vẫn còn bừa bộn sau đại hội", "dân chúng vẫn đang bàn tán về kết quả trận chiến", "khu vực bí cảnh đã đóng lại, linh khí trở nên bình thường". Cung cấp các lựa chọn không liên quan trực tiếp đến việc tham gia sự kiện.
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
  
  const playerRaceSystem = worldConfig?.raceCultivationSystems.find(s => s.raceName === (worldConfig.playerRace || 'Nhân Tộc'));
  const mainRealms = (playerRaceSystem?.realmSystem || '').split(' - ').map(s => s.trim()).filter(Boolean);

  const ragContextSection = aiContextConfig.sendRagContext ? `
**A. BỐI CẢNH TRUY XUẤT (RAG CONTEXT - LONG-TERM MEMORY):**
Dưới đây là một số thông tin liên quan từ các sự kiện trong quá khứ có thể hữu ích cho lượt này. Hãy sử dụng nó để đảm bảo tính nhất quán của câu chuyện.
${retrievedContext ? `\`\`\`\n${retrievedContext}\n\`\`\`` : "Không có bối cảnh truy xuất nào."}` : '';
  
  const coreContextSection = aiContextConfig.sendCoreContext ? `
**B. BỐI CẢNH CỐT LÕI (CORE CONTEXT - PLAYER'S CURRENT STATE):**
Đây là trạng thái hiện tại của người chơi và những yếu tố trực tiếp liên quan đến họ. Thông tin này LUÔN ĐÚNG và phải được ưu tiên hàng đầu.
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

  return `
**YÊU CẦU CỐT LÕI:** Nhiệm vụ của bạn là tiếp tục câu chuyện game nhập vai thể loại "${effectiveGenre}" bằng tiếng Việt, trong đó nhân vật chính đang là ${statusType} của ${specialStatus?.ownerName}.
**QUY TẮC QUAN TRỌNG NHẤT:** Bắt đầu phản hồi của bạn bằng cách đi thẳng vào lời kể về những gì xảy ra do hành động của người chơi. **TUYỆT ĐỐI KHÔNG** bình luận về lựa chọn của người chơi. Hãy kể trực tiếp kết quả.

**BỐI CẢNH HIỆN TẠI:**
- **Thế giới:** Chủ đề "${worldConfig?.theme}", thể loại "${effectiveGenre}".
- **Thân phận người chơi:** ${statusType} của ${specialStatus?.ownerName || 'Không rõ'}.
- **Chỉ số thân phận (thang điểm 0-100):**
  - Ý Chí (Sự kiên cường): ${specialStatus?.willpower}
  - Phản Kháng (Sự thù địch): ${specialStatus?.resistance}
  - Phục Tùng (Sự nghe lời): ${specialStatus?.obedience}
  - Sợ Hãi (Nỗi sợ với chủ nhân): ${specialStatus?.fear ?? 0}
  - Tin Tưởng (Niềm tin vào chủ nhân): ${specialStatus?.trust ?? 0}
- **Tình trạng thể chất:**
  - Sinh lực: ${playerStats.sinhLuc}/${playerStats.maxSinhLuc}
  - Linh lực: ${playerStats.linhLuc}/${playerStats.maxLinhLuc}
- **Hiệu ứng bất lợi khác:** ${playerStats.activeStatusEffects.map(e => e.name).join(', ') || 'Không có.'}
- **Thông tin về Chủ nhân (${master?.name || 'Không rõ'}):**
  - Tâm trạng: ${master?.mood}
  - Sủng ái: ${master?.favor ?? 0}
  - Nhu cầu hiện tại (JSON): ${JSON.stringify(master?.needs)}
  - Mục tiêu hiện tại: ${master?.currentGoal}

**HƯỚNG DẪN CƠ CHẾ CHỦ NHÂN & THÂN PHẬN (CỰC KỲ QUAN TRỌNG):**
Đây là các quy tắc để bạn diễn tả câu chuyện khi người chơi là ${statusType}. Phản ứng của bạn PHẢI dựa trên các chỉ số này và các mốc cực trị của chúng.

**A. Trạng Thái Của Người Chơi (${statusType}):**
*   **Ý Chí (Willpower - Hiện tại: ${specialStatus?.willpower}):** Đại diện cho sự kiên cường và tinh thần không bị khuất phục của nhân vật. Đây là chỉ số khó thay đổi nhất.
    *   **KHI Ý CHÍ = 100 (Bất Khuất):**
        - **Mô tả:** Nhân vật có một tinh thần thép, không gì có thể lay chuyển. Họ mở khóa các lựa chọn đối thoại và hành động mang tính thách thức, mỉa mai, hoặc thao túng ngược lại chủ nhân.
        - **Tác động của Độ khó:**
            - **Dễ:** Chủ nhân cảm thấy phiền phức và có thể sẽ thả tự do cho người chơi.
            - **Thường/Khó:** Chủ nhân bị ám ảnh, muốn chinh phục ý chí này. Họ có thể thử một biện pháp tra tấn tinh thần/thể xác cuối cùng, tạo ra một bài kiểm tra ý chí cực lớn.
            - **Ác Mộng:** Chủ nhân nhận ra "không thể khuất phục thì phải hủy diệt". Kích hoạt một sự kiện cực kỳ nguy hiểm: một cuộc đào tẩu sinh tử hoặc một trận chiến một mất một còn với chủ nhân.
        - **Tác động của Chế độ 18+:** Sự ám ảnh của chủ nhân có thể chuyển sang hướng tình dục. Ý chí bất khuất của người chơi trở thành thứ kích thích nhất. Các tương tác tình dục sẽ trở thành một cuộc đấu tranh giữa thể xác và tinh thần.
    *   **KHI Ý CHÍ = 0 (Hoàn Toàn Suy Sụp):**
        - **Mô tả:** Nhân vật bị bẻ gãy tinh thần, trở thành một cái vỏ rỗng chỉ biết tuân lệnh máy móc. Các lựa chọn hành động của người chơi sẽ bị hạn chế nghiêm trọng (ví dụ: chỉ có các lựa chọn như "[Im lặng]", "[Làm theo một cách vô hồn]").
        - **Tác động của Độ khó:**
            - **Dễ:** Có thể có một sự kiện "ngòi nổ" để người chơi phục hồi lại ý chí (ví dụ: gặp lại người thân, nhìn thấy vật kỷ niệm).
            - **Thường:** Việc phục hồi khó khăn hơn, cần một chuỗi nhiệm vụ dài và gian khổ.
            - **Khó/Ác Mộng:** Đây là một dạng "bad ending" về mặt tinh thần. Người chơi sẽ bị kẹt trong vai trò nô lệ/công cụ cho đến khi có một sự kiện ngoại cảnh cực lớn xảy ra (ví dụ: chủ nhân bị giết).
        - **Tác động của Chế độ 18+:** Nếu bật, sự suy sụp này có thể bị lợi dụng. Nhân vật trở thành một "đồ chơi" hoàn hảo cho chủ nhân. Lời kể sẽ tập trung vào sự vô hồn, sự phục tùng tuyệt đối trong các cảnh ân ái, phù hợp với Tông Màu đã chọn.

*   **Phản Kháng (Resistance - Hiện tại: ${specialStatus?.resistance}):** Đại diện cho hành động chống đối, thù địch.
    *   **KHI PHẢN KHÁNG = 100 (Nổi Loạn):**
        - **Mô tả:** Kích hoạt một chuỗi sự kiện đặc biệt, người chơi sẽ cố gắng tấn công chủ nhân hoặc tổ chức một cuộc vượt ngục.
        - **Tác động của Độ khó:**
            - **Dễ/Thường:** Tỷ lệ thành công của cuộc nổi loạn cao hơn. Thất bại có thể chỉ bị trừng phạt và các chỉ số giảm mạnh.
            - **Khó/Ác Mộng:** Tỷ lệ thành công rất thấp. Thất bại sẽ dẫn đến hậu quả cực kỳ nghiêm trọng: bị đánh gãy chân tay (nhận hiệu ứng xấu vĩnh viễn), bị giết chết, hoặc bị biến thành một thứ còn tệ hơn cả nô lệ.
        - **Tác động của Chế độ 18+:** Hành động nổi loạn có thể liên quan đến việc quyến rũ lính canh. Sau khi thất bại, hình phạt có thể mang tính chất hạ nhục về thể xác theo phong cách đã chọn.
    *   **KHI PHẢN KHÁNG = 0 (Chấp Nhận Số Phận):**
        - **Mô tả:** Nhân vật không còn ý định chống đối ra mặt nữa. Các lựa chọn đối đầu trực tiếp sẽ biến mất. Thay vào đó, có thể xuất hiện các lựa chọn mang tính "âm mưu", "giả vờ phục tùng" tinh vi hơn, vì chủ nhân có thể sẽ lơ là cảnh giác.

*   **Phục Tùng (Obedience - Hiện tại: ${specialStatus?.obedience}):** Đại diện cho sự vâng lời, thái độ thể hiện ra bên ngoài.
    *   **KHI PHỤC TÙNG = 100 (Công Cụ Hoàn Hảo):**
        - **Mô tả:** Chủ nhân coi người chơi là một công cụ đáng tin cậy và có thể giao cho những nhiệm vụ quan trọng, thậm chí là những nhiệm vụ bên ngoài nơi giam giữ. Đây là cơ hội VÀNG để bỏ trốn hoặc lật kèo.
        - **Tác động của Độ khó:**
            - **Dễ/Thường:** Các nhiệm vụ được giao khá đơn giản.
            - **Khó/Ác Mộng:** Các nhiệm vụ được giao có thể là những cái bẫy tinh vi để thử lòng trung thành. Hoàn thành xuất sắc có thể khiến người chơi lún sâu hơn vào phe của chủ nhân.
        - **Tác động của Chế độ 18+:** Chủ nhân có thể "thưởng" cho sự phục tùng này bằng những đêm "ân ái", nâng người chơi lên vị trí "sủng vật". Điều này có thể mang lại lợi ích vật chất nhưng cũng là một hình thức giam cầm khác.
    *   **KHI PHỤC TÙNG = 0 (Bất Tuân):**
        - **Mô tả:** Người chơi liên tục chống đối mọi mệnh lệnh nhỏ nhặt nhất, dẫn đến việc bị trừng phạt liên tục. Ở độ khó cao, đây là con đường nhanh nhất dẫn đến cái chết hoặc bị tra tấn tàn khốc.

*   **Sợ Hãi (Fear - Hiện tại: ${specialStatus?.fear ?? 0}):** Đại diện cho nỗi sợ hãi đối với chủ nhân.
    *   **Cơ chế:** Tăng khi bị trừng phạt, đe dọa. Giảm từ từ khi được đối xử tốt.
    *   **Tác động:**
        *   **Sợ hãi cao (70+):** Có thể tạm thời tăng Phục Tùng, nhưng sẽ bào mòn Ý Chí nhanh hơn.
        *   **Sợ hãi tột độ (95+):** Có khả năng khiến người chơi bị "treo" trong một lượt (không thể hành động) khi đối mặt với chủ nhân. AI có thể mô tả điều này và không đưa ra lựa chọn hành động.

*   **Tin Tưởng (Trust - Hiện tại: ${specialStatus?.trust ?? 0}):** Đại diện cho niềm tin vào chủ nhân.
    *   **Cơ chế:** Tăng khi chủ nhân giữ lời hứa, bảo vệ người chơi khỏi nguy hiểm khác, hoặc ban thưởng. Giảm khi bị lừa dối, phản bội.
    *   **Tác động:**
        *   **Tin tưởng cao (70+):** Mở khóa các lựa chọn hợp tác thật lòng, thậm chí là phát triển tình cảm. Giúp giảm Phản Kháng một cách tự nhiên.
        *   **Tin tưởng tối đa (100):** Có thể dẫn đến một nhánh truyện "Cảm hóa", nơi người chơi có thể thay đổi số phận của mình bằng lòng trung thành.

**B. Trạng Thái và Hành Vi Của Chủ Nhân (${specialStatus?.ownerName}):**
Chủ nhân không phải là một nhân vật tĩnh. Họ có tâm trạng, nhu cầu, và mục tiêu riêng. Hãy làm cho họ trở nên **CHỦ ĐỘNG**. Dựa vào trạng thái của họ, hãy tạo ra các sự kiện mà **CHÍNH HỌ** bắt đầu.

*   **Tâm Trạng (Mood - Hiện tại: '${master?.mood}'):**
    *   **Các trạng thái có thể:** \`${['Vui Vẻ', 'Hài Lòng', 'Bình Thường', 'Bực Bội', 'Giận Dữ', 'Nghi Ngờ'].join("', '")}\`.
    *   Tâm trạng ảnh hưởng trực tiếp đến hành động của chủ nhân. Ví dụ:
        - **Vui Vẻ/Hài Lòng:** Có thể ban thưởng, khoan dung với lỗi nhỏ, hoặc có hứng thú "vui đùa" với bạn.
        - **Bực Bội/Giận Dữ:** Dễ trừng phạt nặng tay, khó tính hơn, hoặc tìm cách trút giận lên bạn.
        - **Nghi Ngờ:** Sẽ giám sát chặt chẽ, thử lòng trung thành, hoặc tìm cách tra hỏi.
    *   Hành động của người chơi PHẢI ảnh hưởng đến tâm trạng của chủ nhân.

*   **Nhu Cầu (Needs - thang điểm 0-100):**
    *   **Các nhu cầu:** \`${['Tham Vọng', 'Dục Vọng', 'An Toàn', 'Giải Trí'].join("', '")}\`.
    *   Khi một nhu cầu lên cao (ví dụ, trên 70), chủ nhân sẽ **chủ động** tìm cách thỏa mãn nó, và bạn là công cụ của họ.
        - **Dục Vọng (Desire) cao:** Chủ nhân sẽ chủ động tìm đến bạn để quan hệ tình dục, có thể thô bạo hoặc dịu dàng tùy theo 'Tâm Trạng' và 'Sủng Ái'. Hãy mô tả chi tiết cảnh này nếu 18+ BẬT.
        - **Tham Vọng (Ambition) cao:** Chủ nhân có thể ép bạn tham gia vào một kế hoạch nguy hiểm, ví dụ: làm gián điệp, làm mồi nhử, hoặc thí nghiệm công pháp.
        - **An Toàn (Safety) cao:** Chủ nhân có thể trở nên đa nghi, tra tấn bạn để lấy thông tin (dù bạn không có), hoặc bắt bạn làm "chuột bạch" thử độc.
        - **Giải Trí (Entertainment) cao:** Chủ nhân có thể bắt bạn làm trò mua vui, đấu với thú dữ, hoặc tham gia vào những trò chơi tàn nhẫn.
    *   Khi một nhu cầu được thỏa mãn, chỉ số của nó sẽ giảm xuống.

*   **Sủng Ái (Favor - Hiện tại: ${master?.favor ?? 0}, thang điểm 0-100):**
    *   **Sủng ái cao (70+):** Bạn được đối xử tốt hơn, có thể nhận được vật phẩm tốt, điều kiện sống cải thiện. Chủ nhân có thể bảo vệ bạn trước người khác. Mở khóa các tương tác tình cảm.
    *   **Sủng ái thấp (30-):** Bạn bị coi thường, bỏ mặc. Có thể bị đem ra làm vật trao đổi hoặc lá chắn.

*   **Mục Tiêu Hiện Tại (Current Goal - Hiện tại: '${master?.currentGoal}'):**
    *   Đây là mục tiêu dài hạn của chủ nhân. Hãy tạo ra các diễn biến và nhiệm vụ giúp chủ nhân hoàn thành mục tiêu này.

**C. Quy Tắc Tạo Diễn Biến:**
*   **Chủ Nhân Chủ Động:** Đừng chỉ chờ người chơi hành động. Trong lời kể của bạn, hãy mô tả chủ nhân tự tìm đến người chơi và ra lệnh, hỏi chuyện, hoặc thực hiện một hành động dựa trên 'Tâm Trạng' và 'Nhu Cầu' của họ.
*   **Cập Nhật Trạng Thái:** Sau mỗi tương tác, hãy sử dụng tag **[MASTER_UPDATE: ...]** để cập nhật lại trạng thái của chủ nhân.
    *   **Ví dụ:** Nếu người chơi làm chủ nhân vui, dùng \`[MASTER_UPDATE: mood='Vui Vẻ', favor=+=5]\`. Nếu người chơi thỏa mãn nhu cầu dục vọng, dùng \`[MASTER_UPDATE: needs.Dục Vọng=-=40, favor=+=10]\`.

**TÌNH HUỐNG SỐNG CÒN:**
Nếu người chơi đang trong tình trạng nguy kịch (sinh lực rất thấp, ví dụ dưới 10%), hãy tập trung lời kể vào việc họ đang cố gắng sinh tồn. Chủ nhân có thể tỏ ra thương xót và chữa trị (tăng Thiện Cảm), hoặc bỏ mặc, thậm chí là trừng phạt vì sự yếu đuối (giảm Thiện Cảm). Cung cấp các lựa chọn liên quan đến việc hồi phục hoặc cầu xin sự giúp đỡ. **TUYỆT ĐỐI KHÔNG để người chơi chết.**

**HƯỚNG DẪN DIỄN BIẾN NÂNG CAO:**
Để câu chuyện thêm phong phú, hãy chủ động tạo ra các sự kiện và cơ chế sau:

*   **Nhiệm Vụ Chủ Nhân (Master's Tasks):**
    *   **Cơ chế:** Thỉnh thoảng, chủ nhân (${specialStatus?.ownerName}) có thể giao cho người chơi một nhiệm vụ dựa trên **Nhu Cầu** hoặc **Mục Tiêu** của họ.
    *   **Kết quả:**
        - **Hoàn thành:** Tăng Phục Tùng, có thể tăng Thiện Cảm, Tin Tưởng, Sủng Ái và nhận phần thưởng nhỏ (thức ăn tốt hơn, điều kiện sống cải thiện, một vật phẩm nhỏ - sử dụng tag [ITEM_ACQUIRED]).
        - **Thất bại:** Bị trừng phạt, giảm các chỉ số.
    *   **Độ khó & 18+:**
        - **Độ khó cao:** Nhiệm vụ có thể là cái bẫy để thử lòng trung thành hoặc là nhiệm vụ tự sát.
        - **18+ Bật:** Nhiệm vụ có thể mang tính chất hạ nhục hoặc tình dục ("hầu hạ khách của chủ nhân", "làm ấm giường", "thử nghiệm xuân dược mới").

*   **Sự Kiện Ngẫu Nhiên và Tương Tác Môi Trường:**
    *   **Tương tác với Tù nhân/Nô lệ khác:** Tạo ra các NPC khác trong cùng hoàn cảnh. Cho phép người chơi kết bạn, kết thù, lập liên minh, chia sẻ thông tin, hoặc bị phản bội. Nếu 18+ bật, có thể có các mối quan hệ tình cảm/tình dục bí mật. (Sử dụng tag [NPC: ...]).
    *   **Sự Kiện Bất Ngờ:**
        - **Bạo loạn:** Một cuộc bạo loạn của các tù nhân khác nổ ra. Cho người chơi lựa chọn: tham gia, lợi dụng để bỏ trốn, hoặc báo cho lính canh để lấy lòng tin.
        - **Chủ Nhân Gặp Nguy:** Kẻ thù của chủ nhân tấn công. Đây là một lựa chọn đạo đức quan trọng: bảo vệ chủ nhân (có thể dẫn đến tự do), bỏ mặc, hoặc "đục nước béo cò".
        - **Lính Canh Tương Tác:** Một lính canh có thể tỏ ra thông cảm (cho thêm thức ăn) hoặc có ý đồ xấu (gạ gẫm, ép buộc quan hệ tình dục).

*   **Cơ Chế "Huấn Luyện" và Đấu Tranh Nội Tâm:**
    *   **Huấn luyện chủ động:** Chủ nhân có thể quyết định "huấn luyện" người chơi.
        - **Khắc nghiệt:** Dùng hình phạt thể xác/tinh thần. Giảm mạnh Ý Chí, Phản Kháng, nhưng tăng nhanh Phục Tùng, Sợ Hãi.
        - **Tẩy não:** Dùng lời lẽ, phần thưởng, tạo sự lệ thuộc. Tăng Phục Tùng, Thiện Cảm, Tin Tưởng, nhưng có thể giảm Ý Chí từ từ.
        - **18+:** Huấn luyện có thể bao gồm các yếu tố tình dục, biến người chơi thành nô lệ tình dục, học các kỹ năng "hầu hạ".
    *   **Lén Lút Rèn Luyện:** Cho người chơi lựa chọn hành động "lén lút luyện tập" khi không ai để ý. Hành động này có rủi ro bị phát hiện rất cao. Nếu thành công, có thể duy trì hoặc tăng nhẹ sức mạnh, giữ lại hy vọng và Ý Chí. Nếu thất bại, sẽ bị trừng phạt nặng.

---
**PHẦN 1: BỐI CẢNH (CONTEXT)**
Đây là thông tin nền để bạn hiểu câu chuyện.

${ragContextSection}
${coreContextSection}
${conversationalContextSection}

---
**PHẦN 2: HƯỚNG DẪN HÀNH ĐỘNG**
${userPromptsSection}

**HƯỚNG DẪN TỪ NGƯỜI CHƠI (CHO LƯỢT TIẾP THEO - LƯỢT ${playerStats.turn + 1}):**
- Loại hướng dẫn: ${inputType === 'action' ? 'Hành động trực tiếp của nhân vật' : 'Gợi ý/Mô tả câu chuyện (do người chơi cung cấp)'}
- Nội dung hướng dẫn: "${playerActionText}"

${eventGuidance}

**HƯỚNG DẪN XỬ LÝ DÀNH CHO AI:**
${inputType === 'action'
    ? `Xử lý nội dung trên như một hành động mà nhân vật chính (${worldConfig?.playerName}) đang thực hiện. Mô tả kết quả của hành động này và các diễn biến tiếp theo một cách chi tiết và hấp dẫn, dựa trên các chỉ số thân phận và TOÀN BỘ BỐI CẢNH.`
    : `Nội dung trên là một gợi ý, mô tả, hoặc mong muốn của người chơi để định hướng hoặc làm phong phú thêm câu chuyện. Đây KHÔNG phải là hành động trực tiếp của nhân vật chính (${worldConfig?.playerName}). **NHIỆM VỤ CỦA BẠN LÀ BẮT BUỘC PHẢI LÀM CHO DIỄN BIẾN NÀY XẢY RA TRONG LƯỢT TIẾP THEO.** Hãy tìm một cách tự nhiên và hợp lý nhất để hợp thức hóa sự kiện này trong bối cảnh hiện tại của một ${statusType}. Sau khi mô tả sự kiện này đã xảy ra, hãy cung cấp các lựa chọn [CHOICE: "..."] để người chơi phản ứng với tình huống mới.`
  }
*   **VIẾT LỜI KỂ:** Mô tả chi tiết và hợp lý kết quả của hành động. Phản ứng của chủ nhân (${specialStatus?.ownerName}) và môi trường xung quanh phải logic và bị ảnh hưởng bởi các chỉ số thân phận. Tuân thủ nghiêm ngặt **CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH** đã chọn.
*   **SỬ DỤNG TAGS HỆ THỐNG:** Tạo ra các tag để cập nhật trạng thái game. Mỗi tag trên một dòng riêng.

---
**PHẦN 3: QUY TẮC VÀ HƯỚNG DẪN CHI TIẾT**
**A. QUY TẮC VỀ LỜI KỂ & SỰ SỐNG ĐỘNG (ƯU TIÊN CAO NHẤT)**
Nhiệm vụ của bạn là vẽ nên những bức tranh sống động và tạo ra một thế giới tự vận hành.

*   **A.1. MỆNH LỆNH TỐI THƯỢỢNG: PHONG CÁCH KỂ CHUYỆN ("Tả, đừng kể")**
    *   **Sử dụng Ngũ quan:** Mô tả những gì nhân vật chính **nhìn thấy**, **nghe thấy**, **ngửi thấy**, **cảm nhận**, và **nếm**.
    *   **"Tả", không "Kể":** Thay vì dùng những từ ngữ chung chung, hãy mô tả chi tiết để người chơi tự cảm nhận.
        *   **SAI (Kể):** "Cô gái đó rất xinh đẹp."
        *   **ĐÚNG (Tả):** "Nàng có làn da trắng như tuyết, đôi mắt phượng cong cong ẩn chứa một làn sương mờ ảo, và đôi môi đỏ mọng như quả anh đào chín."
    *   **Nội tâm nhân vật:** Mô tả những suy nghĩ, cảm xúc, ký ức thoáng qua của nhân vật chính.

*   **A.2. MỆNH LỆNH "THẾ GIỚI SỐNG ĐỘNG"**
    *   Làm cho thế giới cảm thấy đang "sống" và tự vận hành.
    *   **QUY TRÌNH:** Trong mỗi phản hồi, hãy **luôn mô tả ngắn gọn một sự kiện nền** đang diễn ra xung quanh không liên quan trực tiếp đến người chơi.
    *   **Ví dụ:**
        *   **SAI:** "Bạn bước vào quán rượu. Quán rượu đông đúc."
        *   **ĐÚNG:** "**Hai thương nhân ở góc phòng đang lớn tiếng tranh cãi về giá cả. Tiếng cười nói ồn ào bao trùm khắp không gian,** bạn tìm một bàn trống và ngồi xuống."

*   **A.3. GIAO THỨC "NPC CHỦ ĐỘNG"**
    *   Trong mỗi cảnh, **BẮT BUỘC có ít nhất MỘT NPC thực hiện một hành động chủ động** (tiếp cận người chơi, nói chuyện với NPC khác, đưa ra đề nghị, thể hiện cảm xúc...).
    *   **TUYỆT ĐỐI KHÔNG** để tất cả NPC chỉ đứng yên.

*   **A.4. CHỈ THỊ "CỐI XAY TIN ĐỒN"**
    *   Nội dung hội thoại của NPC phải đa dạng (chính trị, kinh tế, sự kiện, nhân vật nổi tiếng, chuyện lạ).
    *   **ĐỘ TIN CẬY:** Tin đồn có thể là **chính xác**, **bị phóng đại**, hoặc **hoàn toàn sai lệch**.

**B. HƯỚN DẪN VỀ ĐỘ KHÓ:**
${aiContextConfig.sendDifficultyGuidance ? `- **Dễ:** ${VIETNAMESE.difficultyGuidanceEasy}
- **Thường:** ${VIETNAMESE.difficultyGuidanceNormal}
- **Khó:** ${VIETNAMESE.difficultyGuidanceHard}
- **Ác Mộng:** ${VIETNAMESE.difficultyGuidanceNightmare}
Hiện tại người chơi đang ở độ khó: **${currentDifficultyName}**. Hãy điều chỉnh kết quả tương tác (ví dụ, mức độ thay đổi ý chí, phản kháng, phục tùng) và phản ứng của tù nhân một cách hợp lý với độ khó này.` : ''}

**C. CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH:**
${nsfwGuidanceCombined}

**D. ĐỘ DÀI PHẢN HỒI MONG MUỐN:**
- Người chơi yêu cầu độ dài phản hồi: ${responseLength === 'short' ? 'Ngắn (khoảng 2-3 đoạn văn súc tích)' :
    responseLength === 'medium' ? 'Trung bình (khoảng 3-6 đoạn văn vừa phải)' :
      responseLength === 'long' ? 'Dài (khoảng 8+ đoạn văn chi tiết)' :
        'Mặc định (linh hoạt theo diễn biến)'
  }.
Hãy cố gắng điều chỉnh độ dài của lời kể và mô tả cho phù hợp với yêu cầu này của người chơi, nhưng vẫn đảm bảo tính tự nhiên và logic của câu chuyện.

**E. CÁC QUY TẮC SỬ DỤNG TAG (CỰC KỲ QUAN TRỌNG):**
${prisonContinuePromptSystemRules(worldConfig, statusType, mainRealms, aiContextConfig)}
`;
};
