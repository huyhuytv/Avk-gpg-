
import React, { useState, useMemo } from 'react';
import { useGame } from '../hooks/useGame';
import { GameScreen, KnowledgeBase, WorldSettings, CombatEndPayload, AuctionItem, FindLocationParams, GameMessage, AuctionSlave, Skill, Wife, Prisoner } from '../types';
import Button from './ui/Button';
import { VIETNAMESE, DEFAULT_WORLD_SETTINGS, INITIAL_KNOWLEDGE_BASE, SPECIAL_EVENT_INTERVAL_TURNS, CUSTOM_GENRE_VALUE } from '../constants';
import { PROMPT_FUNCTIONS } from '../prompts';
import { continuePromptSystemRules } from '../constants/systemRulesNormal';
import { prisonContinuePromptSystemRules } from '../constants/systemRulesPrison';
import CollapsibleSection from './ui/CollapsibleSection';
import { DEFAULT_AI_CONTEXT_CONFIG, getWorldDateDifferenceString } from '../utils/gameLogicUtils';
import * as GameTemplates from '../templates';

type PromptCategory = 'story' | 'worldGen' | 'actions' | 'combat' | 'economy' | 'system';

const PromptDisplay: React.FC<{ content: string | React.ReactNode, title?: string }> = ({ content, title }) => (
    <div className="space-y-2">
        {title && <h4 className="text-lg font-semibold text-amber-300">{title}</h4>}
        <div className="text-xs bg-gray-800 p-3 rounded-md whitespace-pre-wrap overflow-auto custom-scrollbar border border-gray-700">
            {content}
        </div>
    </div>
);

// New component to display rules with examples
const RuleDisplayWithExamples: React.FC<{ title: string, rule: string }> = ({ title, rule }) => {
    // A simple parser to format SAI/ĐÚNG examples
    const formattedRule = useMemo(() => {
        return rule.split('\n').map((line, i) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('**SAI (Kể):**') || trimmedLine.startsWith('**SAI:**')) {
                return <React.Fragment key={i}><br /><strong className="text-red-400">{trimmedLine.replace(/\*\*/g, '')}</strong></React.Fragment>;
            }
            if (trimmedLine.startsWith('**ĐÚNG (Tả):**') || trimmedLine.startsWith('**ĐÚNG:**')) {
                return <React.Fragment key={i}><br /><strong className="text-green-400">{trimmedLine.replace(/\*\*/g, '')}</strong></React.Fragment>;
            }
             if (trimmedLine.startsWith('*')) {
                return <React.Fragment key={i}><br/>{line}</React.Fragment>;
            }
            return <React.Fragment key={i}>{line.replace(/\*\*/g, '')}<br/></React.Fragment>;
        });
    }, [rule]);

    return <PromptDisplay title={title} content={<>{formattedRule}</>} />;
};

const PromptsScreen: React.FC = () => {
    const { setCurrentScreen } = useGame();
    const [activeTab, setActiveTab] = useState<PromptCategory>('story');

    // State to manage collapsible sections for the main story prompt
    const [openSections, setOpenSections] = useState({
        mainGuidance: false,
        nsfwGuidance: false,
        storytellingRules: false,
        systemTags: false,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Create a representative KnowledgeBase and other dummy data to generate example prompts
    const { 
        dummyKb, 
        dummyCombatPayload, 
        dummyAuctionItem, 
        dummyAuctionSlave, 
        dummyFindLocationParams,
        narrationAndVividnessRules,
        writingStyleGuidance,
        userPromptsGuidance,
        worldEventGuidance,
        specialEventGuidance
    } = useMemo(() => {
        const kb = JSON.parse(JSON.stringify(INITIAL_KNOWLEDGE_BASE)) as KnowledgeBase;
        kb.worldConfig = { ...DEFAULT_WORLD_SETTINGS, playerName: 'Nhân Vật Chính', nsfwMode: true, difficulty: 'Khó' };
        kb.playerStats.realm = "Kim Đan Cửu Trọng";
        kb.realmProgressionList = kb.worldConfig.raceCultivationSystems[0].realmSystem.split(' - ').map(s => s.trim());
        kb.aiContextConfig = DEFAULT_AI_CONTEXT_CONFIG;
        kb.userPrompts = ["Luôn mô tả trang phục của NPC một cách chi tiết."];
        kb.gameEvents = [{
            id: 'event-1', title: 'Đại Hội Luyện Đan', description: 'Đại hội luyện đan 5 năm một lần.', type: 'Thi Đấu / Cạnh Tranh', status: 'Sắp diễn ra',
            startDate: { day: 10, month: 1, year: 1, hour: 8, minute: 0 }, endDate: { day: 12, month: 1, year: 1, hour: 18, minute: 0 },
            locationId: 'loc-placeholder', isDiscovered: true, details: []
        }];
        kb.playerStats.playerSpecialStatus = { type: 'prisoner', ownerName: 'Ma Đầu', willpower: 50, resistance: 70, obedience: 20 };
        kb.master = { id: 'npc-madau', name: 'Ma Đầu', description: 'Một kẻ tàn bạo', affinity: -50, mood: 'Bực Bội', needs: { 'Dục Vọng': 80 }, currentGoal: 'Luyện hóa tù nhân' };
        kb.discoveredLocations.push({
            id: 'loc-placeholder', name: 'Thần Thành', description: 'Một thành phố lớn.', locationType: GameTemplates.LocationType.CITY, isSafeZone: true,
            mapX: 100, mapY: 100, visited: true,
        });
        kb.currentLocationId = 'loc-placeholder';
        kb.inventory.push({
            id: 'item-1', name: 'Huyết Long Giáp', category: GameTemplates.ItemCategory.EQUIPMENT, equipmentType: GameTemplates.EquipmentType.GIAP_THAN, description: 'Giáp xịn', quantity: 1, rarity: GameTemplates.ItemRarity.CUC_PHAM, value: 1000,
            statBonuses: {maxSinhLuc: 100}, uniqueEffects: [], slot: 'body', itemRealm: 'Kim Đan'
        });
        kb.playerSkills.push({
            id: 'skill-dummy-1', name: 'Hỏa Cầu Thuật', description: 'Tạo ra quả cầu lửa', skillType: GameTemplates.SkillType.LINH_KI, detailedEffect: 'Gây sát thương hỏa', manaCost: 10, damageMultiplier: 0.5, baseDamage: 20, healingAmount: 0, healingMultiplier: 0,
            congPhapDetails: { type: GameTemplates.CongPhapType.SONG_TU, grade: 'Thiên Phẩm' }
        } as Skill);
        kb.wives.push({
            id: 'wife-dummy-1', name: 'Ngọc Nhi', entityType: 'wife', description: 'Một đạo lữ xinh đẹp', affinity: 100, obedience: 100, willpower: 100, realm: 'Trúc Cơ',
            skills: [], equippedItems: { mainWeapon: null, offHandWeapon: null, head: null, body: null, hands: null, legs: null, artifact: null, pet: null, accessory1: null, accessory2: null }
        });
        kb.slaves.push({
            id: 'slave-1', name: 'Tiểu Vũ', entityType: 'slave', description: 'Một nô lệ xinh đẹp', affinity: 50, obedience: 80, willpower: 40, realm: 'Trúc Cơ',
            skills: [], equippedItems: { mainWeapon: null, offHandWeapon: null, head: null, body: null, hands: null, legs: null, artifact: null, pet: null, accessory1: null, accessory2: null }
        });
        kb.prisoners.push({
            id: 'prisoner-1', name: 'Tên Tù Binh', entityType: 'prisoner', description: 'Một tù binh cứng đầu', affinity: -50, willpower: 80, resistance: 90, obedience: 10, realm: 'Trúc Cơ'
        });
        kb.discoveredNPCs.push({
            id: 'npc-vendor-1', name: 'Lão Trương', description: 'Chủ tiệm tạp hóa', affinity: 10, vendorType: 'MarketStall', personalityTraits: [],
        })
        
        const combatPayload: CombatEndPayload = {
            finalPlayerState: kb.playerStats,
            dispositions: { 'npc-goblin-1': 'kill' },
            summary: 'Bạn đã chiến thắng vẻ vang.',
            outcome: 'victory',
            opponentIds: ['npc-goblin-1']
        };
        const auctionItem = kb.inventory.find(i => i.category === GameTemplates.ItemCategory.EQUIPMENT)! as AuctionItem;
        auctionItem.startingPrice = 100;
        auctionItem.currentBid = 150;
        auctionItem.highestBidderId = 'player';
        
        const auctionSlave = { ...kb.slaves[0] } as AuctionSlave;
        auctionSlave.startingPrice = 1000;
        auctionSlave.currentBid = 1500;
        auctionSlave.highestBidderId = 'player';

        const findParams: FindLocationParams = {
            locationTypes: [GameTemplates.LocationType.CAVE],
            isSafeZone: null,
            keywords: 'linh khí nồng đậm',
            searchMethod: 'Dùng Thần Thức / Linh Cảm'
        };

        // --- Generate full rule texts ---
        const narrationAndVividnessRulesParts: string[] = [];
        if (kb.aiContextConfig.sendShowDontTellRule) {
            narrationAndVividnessRulesParts.push(`*   **A.1. MỆNH LỆNH TỐI THƯỢỢNG: PHONG CÁCH KỂ CHUYỆN ("Tả, đừng kể")**\n    *   **Sử dụng Ngũ quan:** Mô tả những gì nhân vật chính **nhìn thấy**, **nghe thấy**, **ngửi thấy**, **cảm nhận**, và **nếm**.\n    *   **"Tả", không "Kể":** Thay vì dùng những từ ngữ chung chung, hãy mô tả chi tiết để người chơi tự cảm nhận.\n        *   **SAI (Kể):** "Cô gái đó rất xinh đẹp."\n        *   **ĐÚNG (Tả):** "Nàng có làn da trắng như tuyết, đôi mắt phượng cong cong ẩn chứa một làn sương mờ ảo, và đôi môi đỏ mọng như quả anh đào chín. Mỗi khi nàng khẽ cười, hai lúm đồng tiền nhỏ xinh lại hiện lên bên má, khiến người đối diện bất giác ngẩn ngơ."\n        *   **SAI (Kể):** "Hắn ta rất tức giận."\n        *   **ĐÚNG (Tả):** "Hai tay hắn siết chặt thành nắm đấm, những đường gân xanh nổi rõ trên mu bàn tay. Hắn nghiến chặt răng, quai hàm bạnh ra, và đôi mắt đỏ ngầu nhìn chằm chằm vào kẻ thù như muốn ăn tươi nuốt sống."\n    *   **Nội tâm nhân vật:** Mô tả những suy nghĩ, cảm xúc, ký ức thoáng qua của nhân vật chính để làm cho họ trở nên sống động và có chiều sâu.`);
        }
        if (kb.aiContextConfig.sendLivingWorldRule) {
            narrationAndVividnessRulesParts.push(`*   **A.2. MỆNH LỆNH "THẾ GIỚI SỐNG ĐỘNG"**\n    *   Làm cho thế giới cảm thấy đang "sống" và tự vận hành, không chỉ xoay quanh người chơi.\n    *   **QUY TRÌNH KỂ CHUYỆN:** Trong mỗi phản hồi, trước khi mô tả kết quả hành động của người chơi, hãy **luôn mô tả ngắn gọn một sự kiện nền** đang diễn ra xung quanh mà không liên quan trực tiếp đến người chơi.\n    *   **Ví dụ:**\n        *   **Cách làm cũ (SAI):** Người chơi bước vào quán rượu. Bạn mô tả: "Quán rượu đông đúc, ồn ào."\n        *   **Cách làm mới (ĐÚNG):** Người chơi bước vào quán rượu. Bạn mô tả: "**Hai thương nhân ở góc phòng đang lớn tiếng tranh cãi về giá cả của lô vải lụa mới. Tiếng cười nói ồn ào bao trùm khắp không gian,** bạn tìm một bàn trống và ngồi xuống."`);
        }
        if (kb.aiContextConfig.sendProactiveNpcRule) {
            narrationAndVividnessRulesParts.push(`*   **A.3. GIAO THỨC "NPC CHỦ ĐỘNG"**\n    *   Trong mỗi cảnh có sự xuất hiện của các NPC, **BẮT BUỘC phải có ít nhất MỘT NPC thực hiện một hành động chủ động.**\n    *   **Các hành động chủ động bao gồm:** Chủ động tiếp cận và bắt chuyện với người chơi; Bàn tán với một NPC khác về một tin đồn/sự kiện; Đưa ra một lời đề nghị, mời gọi, hoặc giao một nhiệm vụ nhỏ; Thể hiện cảm xúc rõ rệt; Tự mình thực hiện một hành động (lau bàn, rời đi...).\n    *   **TUYỆT ĐỐI KHÔNG** để tất cả NPC chỉ đứng yên và chờ người chơi tương tác.`);
        }
        if (kb.aiContextConfig.sendRumorMillRule) {
            narrationAndVividnessRulesParts.push(`*   **A.4. CHỈ THỊ "CỐI XAY TIN ĐỒN"**\n    *   Khi các NPC nói chuyện, nội dung của họ phải đa dạng về thế giới: chính trị, kinh tế, sự kiện, nhân vật nổi tiếng, chuyện lạ/siêu nhiên.\n    *   **ĐỘ TIN CẬY CỦA TIN ĐỒN:** Các tin đồn mà NPC nói ra có thể là **chính xác**, **bị phóng đại**, hoặc **hoàn toàn sai lệch**. Hãy linh hoạt sử dụng cả ba loại để tạo ra sự mơ hồ và chiều sâu cho thông tin.`);
        }
        const narrationAndVividnessRules = narrationAndVividnessRulesParts.join('\n\n');

        const writingStyleGuidance = `**HƯỚNG DẪN BẮT CHƯỚC VĂN PHONG NGƯỜI DÙNG (CỰC KỲ QUAN TRỌNG):**\nMục tiêu hàng đầu của bạn là tái hiện một cách trung thực nhất văn phong của người dùng dựa vào đoạn văn mẫu sau. Đừng chỉ sao chép từ ngữ, mà hãy nắm bắt và áp dụng đúng **nhịp điệu**, **cách lựa chọn từ vựng**, và **thái độ/cảm xúc** đặc trưng của họ. Lời kể của bạn phải khiến người đọc tin rằng nó do chính người dùng viết ra. TUYỆT ĐỐI không pha trộn giọng văn AI hoặc làm "mềm hóa" văn phong gốc.\n\n**VĂN BẢN MẪU CỦA NGƯỜI DÙNG ĐỂ BẠN BẮT CHƯỚC:**\n"""\n(Văn bản mẫu từ người dùng sẽ được chèn vào đây)\n"""`;
        const userPromptsGuidance = `**LỜI NHẮC TỪ NGƯỜI CHƠI (QUY TẮC BẮT BUỘC TUÂN THỦ):**\nĐây là những quy tắc do người chơi đặt ra. Bạn **BẮT BUỘC PHẢI** tuân theo những lời nhắc này một cách nghiêm ngặt trong mọi phản hồi.\n${kb.userPrompts.map(p => `- ${p}`).join('\n')}`;
        
        let guidanceForEvents = "";
        const effectiveGenreDisplay = (kb.worldConfig!.genre === CUSTOM_GENRE_VALUE && kb.worldConfig!.customGenreName) ? kb.worldConfig!.customGenreName : kb.worldConfig!.genre;
        if (kb.gameEvents.length > 0) {
            guidanceForEvents = `\n**HƯỚNG DẪN VỀ SỰ KIỆN THẾ GIỚI (CỰC KỲ QUAN TRỌNG):**\nBạn đang ở một địa điểm có sự kiện. Hãy tuân thủ nghiêm ngặt các quy tắc sau, diễn tả cho phù hợp với thể loại game ("${effectiveGenreDisplay}"):\n`;
            kb.gameEvents.forEach(event => {
                const timeDiff = getWorldDateDifferenceString(event.startDate, event.endDate, kb.worldDate);
                guidanceForEvents += `\n- **Sự kiện "${event.title}" (Loại: ${event.type}) ${event.status.toUpperCase()} (${timeDiff}).**\n  - ... (Mô tả quy tắc và nhiệm vụ dựa trên trạng thái của sự kiện) ...`;
            });
        }

        let specialEventGuidance = `(Sẽ kích hoạt khi lượt chơi là bội số của ${SPECIAL_EVENT_INTERVAL_TURNS}. Hiện tại lượt chơi của dữ liệu mẫu là ${kb.playerStats.turn})`;
        if (kb.playerStats.turn > 0 && kb.playerStats.turn % SPECIAL_EVENT_INTERVAL_TURNS === 0) {
            specialEventGuidance = `**SỰ KIỆN CỐT TRUYỆN ĐẶC BIỆT:**\nLượt chơi hiện tại là ${kb.playerStats.turn}, đây là một mốc quan trọng! Hãy tạo ra một sự kiện bất ngờ hoặc một bước ngoặt lớn liên quan đến mục tiêu chính của nhân vật (${kb.worldConfig?.playerGoal || 'không rõ'}) hoặc xung đột trung tâm của thế giới. Sự kiện này nên thay đổi cục diện hiện tại và tạo ra những cơ hội hoặc thách thức mới cho người chơi.`;
        }

        return { 
            dummyKb: kb, 
            dummyCombatPayload: combatPayload, 
            dummyAuctionItem: auctionItem, 
            dummyAuctionSlave: auctionSlave, 
            dummyFindLocationParams: findParams,
            narrationAndVividnessRules,
            writingStyleGuidance,
            userPromptsGuidance,
            worldEventGuidance: guidanceForEvents,
            specialEventGuidance
        };
    }, []);

    const renderContent = () => {
        const mainRealms = dummyKb.realmProgressionList;
        switch (activeTab) {
            case 'story':
                return (
                    <div className="space-y-4">
                        <CollapsibleSection title="Lời Nhắc Cốt Truyện Chính (Continue)" isOpen={openSections.mainGuidance} onToggle={() => toggleSection('mainGuidance')}>
                             <div className="space-y-3 p-2 bg-gray-800/50 rounded-md">
                                <PromptDisplay title="Hướng Dẫn Về Độ Khó" content={`Dễ: ${VIETNAMESE.difficultyGuidanceEasy}\n\nThường: ${VIETNAMESE.difficultyGuidanceNormal}\n\nKhó: ${VIETNAMESE.difficultyGuidanceHard}\n\nÁc Mộng: ${VIETNAMESE.difficultyGuidanceNightmare}`} />
                                <PromptDisplay title="Hướng Dẫn Nội Dung Người Lớn (18+)" content={`Hoa Mỹ: ${VIETNAMESE.nsfwGuidanceHoaMy}\n\nTrần Tục: ${VIETNAMESE.nsfwGuidanceTranTuc}\n\n... (và các quy tắc khác)`} />
                                <PromptDisplay title="Hướng Dẫn Về Sự Kiện" content={worldEventGuidance} />
                                <PromptDisplay title={`Hướng Dẫn Sự Kiện Đặc Biệt (mỗi ${SPECIAL_EVENT_INTERVAL_TURNS} lượt)`} content={specialEventGuidance} />
                                <PromptDisplay title="Hướng Dẫn Văn Phong & Lời Nhắc Người Dùng" content={`${writingStyleGuidance}\n${userPromptsGuidance}`} />
                                <RuleDisplayWithExamples title="Quy Tắc Kể Chuyện & Thế Giới Động" rule={narrationAndVividnessRules} />
                                <PromptDisplay title="Quy Tắc Hệ Thống (System Tags)" content={continuePromptSystemRules(dummyKb.worldConfig, mainRealms, dummyKb.aiContextConfig)} />
                            </div>
                        </CollapsibleSection>
                        <PromptDisplay title="Lời Nhắc Bị Giam Giữ (Prison)" content={PROMPT_FUNCTIONS.continuePrison(dummyKb, "Cố gắng lấy lòng chủ nhân.", "action", "default", "", [], undefined, undefined)} />
                        <PromptDisplay title="Lời Nhắc Khởi Tạo (Initial)" content={PROMPT_FUNCTIONS.initial(dummyKb.worldConfig!, dummyKb.aiContextConfig)} />
                    </div>
                );
            case 'worldGen':
                 return (
                    <div className="space-y-4">
                        <PromptDisplay title="Tạo Thế Giới Từ Ý Tưởng" content={PROMPT_FUNCTIONS.generateWorldDetails("Một thế giới tu tiên đen tối", true, 'Tu Tiên (Mặc định)', true, 'Cực Đoan', 'Đen Tối', undefined, 'Mạnh Bạo (BDSM)')} />
                        <PromptDisplay title="Tạo Thế Giới Từ Đồng Nhân" content={PROMPT_FUNCTIONS.generateFanfictionWorldDetails("Phàm Nhân Tu Tiên", false, "Nhân vật chính là một đệ tử Hoàng Phong Cốc.", true, 'Tu Tiên (Mặc định)', true, 'Thực Tế', 'Trung Tính', undefined, 'Hoa Mỹ')} />
                        <PromptDisplay title="Hoàn Thiện Thế Giới" content={PROMPT_FUNCTIONS.completeWorldDetails(dummyKb.worldConfig!, true, 'Tu Tiên (Mặc định)', true, 'Cực Đoan', 'Đen Tối', undefined, 'Mạnh Bạo (BDSM)')} />
                        <PromptDisplay title="Phân Tích Văn Phong" content={PROMPT_FUNCTIONS.analyzeStyle("Văn mẫu...")} />
                    </div>
                );
            case 'actions':
                 return (
                    <div className="space-y-4">
                        <PromptDisplay title="Luyện Chế Vật Phẩm (craftItem)" content={PROMPT_FUNCTIONS.craftItem(GameTemplates.ItemCategory.EQUIPMENT, 'Một thanh kiếm sắc bén', [{name: 'Sắt Huyền', description: 'Một loại sắt hiếm', category: GameTemplates.ItemCategory.MATERIAL, materialType: GameTemplates.MaterialType.KHOANG_THACH}], dummyKb.playerStats, dummyKb.worldConfig, '', [], undefined)} />
                        <PromptDisplay title="Tu Luyện (cultivationSession)" content={PROMPT_FUNCTIONS.cultivationSession(dummyKb, 'method', 10, '', [], undefined, undefined, dummyKb.playerSkills[0], dummyKb.wives[0])} />
                        <PromptDisplay title="Tìm Kiếm Địa Điểm (findLocation)" content={PROMPT_FUNCTIONS.findLocation(dummyKb, dummyFindLocationParams, '', [], undefined)} />
                        <PromptDisplay title="Tương Tác Hậu Cung (companionInteraction)" content={PROMPT_FUNCTIONS.companionInteraction(dummyKb, dummyKb.slaves[0], "Trò chuyện thân mật", '', [], undefined)} />
                        <PromptDisplay title="Tương Tác Tù Nhân (prisonerInteraction)" content={PROMPT_FUNCTIONS.prisonerInteraction(dummyKb, dummyKb.prisoners[0], "Tra hỏi về kẻ thù", '', [], undefined)} />
                    </div>
                );
            case 'combat':
                return (
                    <div className="space-y-4">
                        <PromptDisplay title="Diễn Biến Chiến Đấu (combatTurn)" content={PROMPT_FUNCTIONS.combatTurn(dummyKb, "Tấn công kẻ địch", [], '', [], undefined)} />
                        <PromptDisplay title="Tóm Tắt Chiến Đấu (summarizeCombat)" content={PROMPT_FUNCTIONS.summarizeCombat(['Lượt 1: ...'], 'victory')} />
                        <PromptDisplay title="Hậu Quả Thắng Lợi (generateVictoryConsequence)" content={PROMPT_FUNCTIONS.generateVictoryConsequence(dummyKb, dummyCombatPayload, '', [], undefined)} />
                        <PromptDisplay title="Hậu Quả Thất Bại (generateDefeatConsequence)" content={PROMPT_FUNCTIONS.generateDefeatConsequence(dummyKb, dummyCombatPayload, '', [], undefined)} />
                        <PromptDisplay title="Hậu Quả Gục Ngã (Ngoài CĐ)" content={PROMPT_FUNCTIONS.generateNonCombatDefeatConsequence(dummyKb, '', [], 'Bạn bị trúng độc và ngã quỵ', undefined)} />
                    </div>
                );
            case 'economy':
                return (
                    <div className="space-y-4">
                        <PromptDisplay title="Tạo Địa Điểm Kinh Tế (generateEconomyLocations)" content={PROMPT_FUNCTIONS.generateEconomyLocations(dummyKb.discoveredLocations[0], dummyKb)} />
                        <PromptDisplay title="Tạo Địa Điểm Phụ (generateGeneralSubLocations)" content={PROMPT_FUNCTIONS.generateGeneralSubLocations(dummyKb.discoveredLocations[0], dummyKb)} />
                        <PromptDisplay title="Làm Mới Cửa Hàng (restockVendor)" content={PROMPT_FUNCTIONS.restockVendor(dummyKb.discoveredNPCs[0], dummyKb)} />
                        <PromptDisplay title="Khởi Tạo Đấu Giá (generateAuctionData)" content={PROMPT_FUNCTIONS.generateAuctionData(dummyKb)} />
                        <PromptDisplay title="Xử Lý Lượt Đấu Giá (runAuctionTurn)" content={PROMPT_FUNCTIONS.runAuctionTurn(dummyKb, dummyAuctionItem, 200)} />
                        <PromptDisplay title="Hô Giá (runAuctioneerCall)" content={PROMPT_FUNCTIONS.runAuctioneerCall(dummyKb, dummyAuctionItem, 1)} />
                        <PromptDisplay title="Khởi Tạo Đấu Giá Nô Lệ (generateSlaveAuctionData)" content={PROMPT_FUNCTIONS.generateSlaveAuctionData(dummyKb)} />
                        <PromptDisplay title="Xử Lý Lượt Đấu Giá Nô Lệ (runSlaveAuctionTurn)" content={PROMPT_FUNCTIONS.runSlaveAuctionTurn(dummyKb, dummyAuctionSlave, 2000)} />
                        <PromptDisplay title="Hô Giá Nô Lệ (runSlaveAuctioneerCall)" content={PROMPT_FUNCTIONS.runSlaveAuctioneerCall(dummyKb, dummyAuctionSlave, 1)} />
                    </div>
                );
            case 'system':
                return (
                     <div className="space-y-4">
                        <PromptDisplay title="Tóm Tắt Trang (summarizePage)" content={PROMPT_FUNCTIONS.summarizePage([{id: '1', type: 'narration', content: 'Diễn biến...', turnNumber: 1, timestamp: 0}], 'Theme', 'Player', 'Tu Tiên')} />
                        <PromptDisplay title="Tóm Tắt Tu Luyện (summarizeCultivation)" content={PROMPT_FUNCTIONS.summarizeCultivation(['Log 1...'])} />
                        <PromptDisplay title="Tóm Tắt Tương Tác Hậu Cung (summarizeCompanionInteraction)" content={PROMPT_FUNCTIONS.summarizeCompanionInteraction(['Log 1...'])} />
                        <PromptDisplay title="Tóm Tắt Tương Tác Tù Nhân (summarizePrisonerInteraction)" content={PROMPT_FUNCTIONS.summarizePrisonerInteraction(['Log 1...'])} />
                    </div>
                );
            default:
                return null;
        }
    };

    const tabs: { key: PromptCategory; label: string }[] = [
        { key: 'story', label: 'Cốt Truyện' },
        { key: 'worldGen', label: 'Tạo Thế Giới' },
        { key: 'actions', label: 'Hành Động' },
        { key: 'combat', label: 'Chiến Đấu' },
        { key: 'economy', label: 'Kinh Tế' },
        { key: 'system', label: 'Hậu Trường (Tóm Tắt)' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-800 p-4 sm:p-6 text-gray-100">
            <div className="w-full max-w-4xl mx-auto bg-gray-900 shadow-2xl rounded-xl flex flex-col h-[90vh]">
                <header className="mb-4 flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
                        Thư Viện Lời Nhắc
                    </h1>
                    <Button variant="secondary" onClick={() => setCurrentScreen(GameScreen.Initial)}>
                        {VIETNAMESE.goBackButton}
                    </Button>
                </header>
                
                <div className="flex border-b border-gray-700 flex-shrink-0 px-4 overflow-x-auto custom-scrollbar">
                    {tabs.map(tab => (
                        <button 
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)} 
                            className={`flex-shrink-0 py-2 px-4 text-sm font-semibold whitespace-nowrap ${activeTab === tab.key ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default PromptsScreen;
