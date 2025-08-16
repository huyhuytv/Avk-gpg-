import { Item, PlayerStats, WorldSettings, GenreType, NsfwDescriptionStyle, StoryTone, ViolenceLevel, GameMessage } from '../types';
import * as GameTemplates from '../templates';
import { VIETNAMESE, CUSTOM_GENRE_VALUE, DEFAULT_NSFW_DESCRIPTION_STYLE, DEFAULT_STORY_TONE, DEFAULT_VIOLENCE_LEVEL, STAT_POINT_VALUES, SPECIAL_EFFECT_KEYWORDS } from '../constants';

export const generateCraftItemPrompt = (
  desiredItemCategory: GameTemplates.ItemCategoryValues,
  playerRequirements: string,
  materials: Array<{ name: string; description: string; category: GameTemplates.ItemCategoryValues; materialType?: GameTemplates.MaterialTypeValues }>,
  playerStats: PlayerStats,
  worldConfig: WorldSettings | null,
  currentPageMessagesLog: string,
  previousPageSummaries: string[],
  lastNarrationFromPreviousPage: string | undefined
): string => {
  // Destructure properties from worldConfig for easier use
  const playerName = worldConfig?.playerName;
  const genre = worldConfig?.genre;
  const isCultivationEnabled = worldConfig?.isCultivationEnabled;
  const customGenreName = worldConfig?.customGenreName;
  const theme = worldConfig?.theme;
  const settingDescription = worldConfig?.settingDescription;
  const nsfwMode = worldConfig?.nsfwMode || false;
  const nsfwStyle = worldConfig?.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;
  const violenceLevel = worldConfig?.violenceLevel || DEFAULT_VIOLENCE_LEVEL;
  const storyTone = worldConfig?.storyTone || DEFAULT_STORY_TONE;
  
  const playerRaceSystem = worldConfig?.raceCultivationSystems.find(s => s.raceName === (worldConfig.playerRace || 'Nhân Tộc')) || worldConfig?.raceCultivationSystems[0];
  const realmProgressionList = playerRaceSystem?.realmSystem ? playerRaceSystem.realmSystem.split(' - ').map(s => s.trim()) : [];

  const materialsList = materials.map(m => `- ${m.name} (${m.materialType || m.category}): ${m.description || 'Nguyên liệu không có mô tả cụ thể.'}`).join('\n');
  const selectedGenre = genre || "Tu Tiên (Mặc định)";
  const effectiveGenre = (selectedGenre === CUSTOM_GENRE_VALUE && customGenreName) ? customGenreName : selectedGenre;
  const cultivationStatusText = isCultivationEnabled ? "BẬT" : "TẮT";
  const playerRealmOrLevel = isCultivationEnabled ? playerStats.realm : VIETNAMESE.mortalRealmName;
  const playerEnergyStat = isCultivationEnabled ? `Linh Lực: ${playerStats.linhLuc} / ${playerStats.maxLinhLuc}` : `Năng Lượng/Thể Lực: ${playerStats.linhLuc} / ${playerStats.maxLinhLuc}`;

  // NEW LOGIC for target realm instruction
  const playerMainRealm = realmProgressionList.find(r => playerRealmOrLevel.startsWith(r));
  const playerRealmIndex = playerMainRealm ? realmProgressionList.indexOf(playerMainRealm) : -1;

  let targetRealmInstruction = `Tạo ra vật phẩm có cảnh giới tương đương hoặc cao hơn một chút so với cảnh giới hiện tại của người chơi (${playerRealmOrLevel}).`;
  let allowedRealmsForTag: string[] = [];

  if (isCultivationEnabled && playerRealmIndex !== -1 && playerMainRealm) {
      allowedRealmsForTag.push(playerMainRealm); // Current realm
      
      const targetRealmIndex1 = playerRealmIndex + 1;
      const targetRealmIndex2 = playerRealmIndex + 2;

      if (targetRealmIndex1 < realmProgressionList.length) {
          allowedRealmsForTag.push(realmProgressionList[targetRealmIndex1]);
      }
      if (targetRealmIndex2 < realmProgressionList.length) {
          allowedRealmsForTag.push(realmProgressionList[targetRealmIndex2]);
      }
      
      targetRealmInstruction = `Tạo ra vật phẩm có sức mạnh phù hợp với cấp độ/cảnh giới của nhân vật. **Tuy nhiên, bạn được phép tạo ra vật phẩm có \`itemRealm\` cao hơn cảnh giới hiện tại của người chơi tối đa 2 bậc** để tạo ra các vật phẩm đột phá, đáng giá.`;
  } else {
      // Fallback for non-cultivation or if realm not found
      allowedRealmsForTag = realmProgressionList.length > 0 ? [realmProgressionList[0]] : [playerRealmOrLevel];
      targetRealmInstruction = `Tạo ra vật phẩm có cảnh giới phù hợp cho người mới bắt đầu.`;
  }

  // NSFW Guidance Block
  let nsfwGuidanceCombined = "";
  if (nsfwMode) {
      let nsfwStyleGuidance = "";
      switch (nsfwStyle) {
          case 'Hoa Mỹ': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceHoaMy; break;
          case 'Trần Tục': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceTranTuc; break;
          case 'Gợi Cảm': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceGoiCam; break;
          case 'Mạnh Bạo (BDSM)': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceManhBaoBDSM; break;
          default: nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceHoaMy;
      }

      let violenceGuidance = "";
      switch (violenceLevel) {
          case 'Nhẹ Nhàng': violenceGuidance = VIETNAMESE.violenceLevelGuidanceNheNhang; break;
          case 'Thực Tế': violenceGuidance = VIETNAMESE.violenceLevelGuidanceThucTe; break;
          case 'Cực Đoan': violenceGuidance = VIETNAMESE.violenceLevelGuidanceCucDoan; break;
          default: violenceGuidance = VIETNAMESE.violenceLevelGuidanceThucTe;
      }

      let toneGuidance = "";
      switch (storyTone) {
          case 'Tích Cực': toneGuidance = VIETNAMESE.storyToneGuidanceTichCuc; break;
          case 'Trung Tính': toneGuidance = VIETNAMESE.storyToneGuidanceTrungTinh; break;
          case 'Đen Tối': toneGuidance = VIETNAMESE.storyToneGuidanceDenToi; break;
          case 'Dâm Dục': toneGuidance = VIETNAMESE.storyToneGuidanceDamDuc; break;
          case 'Hoang Dâm': toneGuidance = VIETNAMESE.storyToneGuidanceHoangDam; break;
          case 'Dâm Loạn': toneGuidance = VIETNAMESE.storyToneGuidanceDamLoan; break;
          default: toneGuidance = VIETNAMESE.storyToneGuidanceTrungTinh;
      }
      nsfwGuidanceCombined = `
**CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH (QUAN TRỌNG):**
- **Yêu cầu nội dung 18+:** BẬT. Tên và mô tả vật phẩm có thể mang yếu tố người lớn, nhạy cảm.
- **Phong Cách Miêu Tả Tình Dục:** ${nsfwStyle}.
  - ${nsfwStyleGuidance}
- **Mức Độ Miêu Tả Bạo Lực:** ${violenceLevel}.
  - ${violenceGuidance}
- **Tông Màu Câu Chuyện:** ${storyTone}.
  - ${toneGuidance}
Lưu ý: Hãy đảm bảo tên gọi và mô tả của vật phẩm tạo ra phản ánh đúng các cài đặt này. Ví dụ, một vật phẩm trong thế giới "Đen Tối" với bạo lực "Cực Đoan" có thể có tên gọi và công dụng ghê rợn hơn.`;
  } else {
      nsfwGuidanceCombined = "**CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH:** Chế độ Người Lớn đang TẮT. Vui lòng tạo ra các vật phẩm có tên và mô tả phù hợp với mọi lứa tuổi.";
  }
  
  const contextBlock = `
**BỐI CẢNH CÁC SỰ KIỆN GẦN ĐÂY (Để tham khảo và lấy cảm hứng):**
- **Tóm tắt các trang trước:**
${previousPageSummaries.length > 0 ? previousPageSummaries.join("\n\n") : "Không có."}
- **Diễn biến gần nhất (lượt trước):**
${lastNarrationFromPreviousPage || "Không có."}
- **Diễn biến chi tiết trang hiện tại:**
${currentPageMessagesLog || "Không có."}
`;

  return `
Bạn là một Bậc Thầy Chế Tạo trong một thế giới game nhập vai.
Người chơi muốn chế tạo một vật phẩm mới. Dưới đây là yêu cầu, các nguyên liệu họ cung cấp, và thông tin nhân vật hiện tại để bạn tham khảo về bối cảnh và sức mạnh.

**BỐI CẢNH THẾ GIỚI (QUAN TRỌNG):**
- **Chủ đề:** ${theme || 'Chưa xác định'}
- **Bối cảnh chung:** ${settingDescription || 'Chưa xác định'}
- **Hệ Thống Cảnh Giới:** ${realmProgressionList.join(' - ') || 'Không có'}

${nsfwGuidanceCombined}
${contextBlock}

**THÔNG TIN NHÂN VẬT HIỆN TẠI (ĐỂ THAM KHẢO):**
- Tên Nhân Vật: ${playerName || 'Người Chơi'}
- Thể Loại Game: ${effectiveGenre}
- Hệ Thống Tu Luyện/Sức Mạnh Đặc Thù: ${cultivationStatusText}
- Cảnh Giới/Cấp Độ: ${playerRealmOrLevel}
- Sinh Lực: ${playerStats.sinhLuc} / ${playerStats.maxSinhLuc}
- ${playerEnergyStat}
- Sức Tấn Công Cơ Bản (Chưa Tính Trang Bị): ${playerStats.baseSucTanCong}
- Sức Tấn Công Hiệu Quả (Đã Tính Trang Bị): ${playerStats.sucTanCong}

**YÊU CẦU CỦA NGƯỜI CHƠI:**
- Loại Vật Phẩm Mong Muốn: ${desiredItemCategory}
- Mô Tả/Yêu Cầu Cụ Thể: "${playerRequirements || 'Không có yêu cầu cụ thể, tùy bạn sáng tạo dựa trên nguyên liệu.'}"

**NGUYÊN LIỆU SỬ DỤNG (${materials.length} loại):**
${materialsList.length > 0 ? materialsList : "Không có nguyên liệu nào được cung cấp."}

**HƯỚN DẪN CHẾ TẠO CHO BẠN (AI):**
1.  **Phân Tích Nguyên Liệu và Bối Cảnh:** Dựa vào tên, loại, mô tả của các nguyên liệu, yêu cầu của người chơi, THÔNG TIN NHÂN VẬT, và đặc biệt là **BỐI CẢNH THẾ GIỚI**, **SỰ KIỆN GẦN ĐÂY** và **CÀI ĐẶT 18+**, hãy xác định đặc tính, thuộc tính (ngũ hành, công nghệ, phép thuật, v.v.), và tiềm năng của chúng.
2.  **Cân Bằng Sức Mạnh Vật Phẩm:** ${targetRealmInstruction}
3.  **Sáng Tạo Vật Phẩm:**
    *   Tạo ra một vật phẩm MỚI, hợp lý. Vật phẩm phải phù hợp với thể loại "${effectiveGenre}". Ví dụ, nếu thể loại là "Khoa Huyễn" và hệ thống tu luyện TẮT, đừng tạo ra "Linh Kiếm" mà hãy tạo "Súng Laser Thử Nghiệm" hoặc "Chip Cường Hóa Giáp".
    *   Nếu nguyên liệu không phù hợp hoặc yêu cầu quá vô lý, hãy tạo ra một vật phẩm "Phế Phẩm" hoặc cấp thấp, với mô tả hài hước về sự thất bại.
    *   Vật phẩm tạo ra PHẢI tuân theo định dạng tag \`[ITEM_ACQUIRED: ...]\` như mô tả bên dưới.
4.  **Định Dạng Tag Trả Về (BẮT BUỘC CHÍNH XÁC):**
    *   **Tag \\\`[ITEM_ACQUIRED: ...]\`:** Dùng khi người chơi nhận được vật phẩm mới.
        *   **CẤM TUYỆT ĐỐI VỀ VẬT PHẨM TIỀN TỆ:** Đơn vị tiền tệ của thế giới là "${worldConfig?.currencyName || "Tiền"}". Bạn **TUYỆT ĐỐI KHÔNG** được tạo ra bất kỳ vật phẩm nào có chức năng tương tự tiền tệ (ví dụ: "Linh Thạch Hạ Phẩm", "Túi Vàng", "Ngân Phiếu") bằng tag \`[ITEM_ACQUIRED]\`. Việc này sẽ phá vỡ hệ thống kinh tế của game.
        *   **Tham số bắt buộc:** \`name\`, \`type\`, \`description\`, \`quantity\`, \`rarity\`, \`itemRealm\`.
        *   \`type\`: Phải bao gồm **Loại Chính** và **Loại Phụ** (nếu có).
            *   **Loại Chính Hợp Lệ:** ${Object.values(GameTemplates.ItemCategory).join(' | ')}.
            *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.EQUIPMENT}\`, Loại Phụ (\`equipmentType\`) PHẢI là một trong: ${Object.values(GameTemplates.EquipmentType).join(' | ')}.
                *   **Tham số RIÊNG \`equipmentType\` cũng BẮT BUỘC**.
                *   **Tham số RIÊNG \`statBonusesJSON\` BẮT BUỘC** (nếu không có, dùng \`statBonusesJSON='{}'\`). JSON phải hợp lệ. Các khóa trong JSON có thể là: \`${Object.keys(STAT_POINT_VALUES).join(', ')}\`.
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
        *   **\`itemRealm\`: CỰC KỲ QUAN TRỌNG. Cảnh giới của vật phẩm. ${targetRealmInstruction}. Nó PHẢI là một trong các giá trị sau: \`${allowedRealmsForTag.join(' | ')}\`.**
        *   **VÍ DỤ (Đúng):** \\\`[ITEM_ACQUIRED: name="Huyết Long Giáp", type="${GameTemplates.ItemCategory.EQUIPMENT} ${GameTemplates.EquipmentType.GIAP_THAN}", equipmentType="${GameTemplates.EquipmentType.GIAP_THAN}", description="Giáp làm từ vảy Huyết Long, tăng cường sinh lực.", quantity=1, rarity="${GameTemplates.ItemRarity.CUC_PHAM}", value=1000, itemRealm="Hóa Thần", statBonusesJSON='{"maxSinhLuc": 200}', uniqueEffectsList="Phản sát thương 10%;Kháng Hỏa +30", slot="Giáp Thân"]\`
        
5.  **Mô Tả Vật Phẩm (Dành cho Hiển Thị Người Chơi):** SAU KHI bạn đã tạo tag \`[ITEM_ACQUIRED: ...]\`, hãy viết một đoạn văn ngắn (2-4 câu) mô tả vật phẩm vừa được chế tạo một cách đầy thi vị và hấp dẫn, phù hợp với thể loại "${effectiveGenre}". Đoạn văn này KHÔNG được nằm trong bất kỳ tag nào, và phải nằm SAU tag \`[ITEM_ACQUIRED: ...]\`.

6.  **ĐẢM BẢO:** Phản hồi của bạn phải bao gồm MỘT tag \`[ITEM_ACQUIRED: ...]\` duy nhất, theo sau là đoạn văn mô tả (nếu có) ở mục 5. Tag phải ở trước đoạn văn mô tả.
`;
};