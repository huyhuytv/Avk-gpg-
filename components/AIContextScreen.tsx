import React, { useState, ChangeEvent, useEffect } from 'react';
import { GameScreen, AIContextConfig } from '../types';
import Button from './ui/Button';
import CollapsibleSection from './ui/CollapsibleSection';
import { useGame } from '../hooks/useGame';
import { VIETNAMESE, SPECIAL_EVENT_INTERVAL_TURNS } from '../constants';
import { DEFAULT_AI_CONTEXT_CONFIG } from '../utils/gameLogicUtils';
import Modal from './ui/Modal';


const ToggleRow = ({ label, description, isEnabled, onToggle, id }: { label: string, description: string, isEnabled: boolean, onToggle: (e: ChangeEvent<HTMLInputElement>) => void, id: string }) => (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg transition-colors hover:bg-gray-800/80">
        <div className="mr-4">
            <label htmlFor={id} className="font-semibold text-gray-200 cursor-pointer block">{label}</label>
            <p className="text-xs text-gray-400">{description}</p>
        </div>
        <div className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input 
                type="checkbox" 
                id={id}
                checked={isEnabled} 
                onChange={onToggle} 
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </div>
    </div>
);

interface AIContextScreenProps {
    onClose: () => void;
}

const AIContextScreen: React.FC<AIContextScreenProps> = ({ onClose }) => {
    const { knowledgeBase, setKnowledgeBase, showNotification } = useGame();
    
    const [settings, setSettings] = useState<AIContextConfig>(
        knowledgeBase.aiContextConfig || DEFAULT_AI_CONTEXT_CONFIG
    );
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setSettings(knowledgeBase.aiContextConfig || DEFAULT_AI_CONTEXT_CONFIG);
    }, [knowledgeBase.aiContextConfig]);

    const handleToggle = (settingKey: keyof AIContextConfig) => {
        setSettings(prev => ({
            ...prev,
            [settingKey]: !prev[settingKey]
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        setKnowledgeBase(prevKb => ({
            ...prevKb,
            aiContextConfig: settings
        }));
        showNotification('Cài đặt Cấu Hình AI đã được lưu!', 'success');
        setHasChanges(false);
        onClose();
    };
    
    const handleReset = () => {
        setSettings(DEFAULT_AI_CONTEXT_CONFIG);
        setHasChanges(true);
    };


    // State for collapsible sections
    const [isContextOpen, setIsContextOpen] = useState(true);
    const [isGuidanceOpen, setIsGuidanceOpen] = useState(true);
    const [isStorytellingOpen, setIsStorytellingOpen] = useState(true);
    const [isRulesOpen, setIsRulesOpen] = useState(false);

    return (
        <Modal isOpen={true} onClose={onClose} title="Cấu Hình Prompt AI">
             <p className="text-sm text-gray-400 mb-4">
                Bật hoặc tắt các phần của bối cảnh (context) và quy tắc được gửi đến AI mỗi lượt. Các thay đổi này chỉ áp dụng cho thế giới hiện tại.
            </p>

            <div className="space-y-3">
                <CollapsibleSection
                    title="Bối Cảnh (Context)"
                    isOpen={isContextOpen}
                    onToggle={() => setIsContextOpen(!isContextOpen)}
                >
                    <div className="space-y-3">
                        <ToggleRow
                            id="toggle-rag"
                            label="Bối cảnh Truy xuất (RAG Context)"
                            description="Gửi các thông tin liên quan từ lịch sử game (trí nhớ dài hạn)."
                            isEnabled={settings.sendRagContext}
                            onToggle={() => handleToggle('sendRagContext')}
                        />
                        <ToggleRow
                            id="toggle-core"
                            label="Bối cảnh Cốt lõi (Core Context)"
                            description="Gửi thông tin hiện tại của người chơi (chỉ số, nhiệm vụ, trạng thái)."
                            isEnabled={settings.sendCoreContext}
                            onToggle={() => handleToggle('sendCoreContext')}
                        />
                        <ToggleRow
                            id="toggle-conversational"
                            label="Bối cảnh Hội thoại (Conversational Context)"
                            description="Gửi các tóm tắt trang trước và diễn biến gần đây."
                            isEnabled={settings.sendConversationalContext}
                            onToggle={() => handleToggle('sendConversationalContext')}
                        />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title="Hướng Dẫn Chính (Primary Guidance)"
                    isOpen={isGuidanceOpen}
                    onToggle={() => setIsGuidanceOpen(!isGuidanceOpen)}
                >
                    <div className="space-y-3">
                        <ToggleRow
                            id="toggle-writing-style"
                            label="Hướng Dẫn Văn Phong"
                            description="Gửi đoạn văn mẫu mà người dùng cung cấp để AI bắt chước."
                            isEnabled={settings.sendWritingStyle}
                            onToggle={() => handleToggle('sendWritingStyle')}
                        />
                        <ToggleRow
                            id="toggle-user-prompts"
                            label="Lời Nhắc Người Dùng"
                            description="Gửi các quy tắc tùy chỉnh mà người dùng đã thêm ở màn hình 'Lời Nhắc'."
                            isEnabled={settings.sendUserPrompts}
                            onToggle={() => handleToggle('sendUserPrompts')}
                        />
                        <ToggleRow
                            id="toggle-event-guidance"
                            label="Hướng Dẫn Về Sự Kiện Thế Giới"
                            description="Gửi thông tin về các sự kiện đang/sắp diễn ra tại địa điểm hiện tại."
                            isEnabled={settings.sendEventGuidance}
                            onToggle={() => handleToggle('sendEventGuidance')}
                        />
                        <ToggleRow
                            id="toggle-difficulty"
                            label="Hướng Dẫn Về Độ Khó"
                            description="Hướng dẫn AI về cách hành xử dựa trên độ khó đã chọn."
                            isEnabled={settings.sendDifficultyGuidance}
                            onToggle={() => handleToggle('sendDifficultyGuidance')}
                        />
                         <ToggleRow
                            id="toggle-nsfw-guidance"
                            label="Hướng Dẫn Nội Dung Người Lớn"
                            description="Gửi các quy tắc chi tiết về việc mô tả nội dung người lớn."
                            isEnabled={settings.sendNsfwGuidance}
                            onToggle={() => handleToggle('sendNsfwGuidance')}
                        />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title="Quy Tắc Kể Chuyện & Thế Giới Động"
                    isOpen={isStorytellingOpen}
                    onToggle={() => setIsStorytellingOpen(!isStorytellingOpen)}
                >
                    <div className="space-y-3">
                        <ToggleRow
                            id="toggle-rule-formatting"
                            label="Quy Tắc Định Dạng & Hội Thoại"
                            description="Bao gồm cấm tag trong lời kể và quy tắc đánh dấu hội thoại bằng dấu ngoặc kép."
                            isEnabled={settings.sendFormattingRules}
                            onToggle={() => handleToggle('sendFormattingRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-show-dont-tell"
                            label="Quy Tắc 'Tả, đừng kể'"
                            description="Yêu cầu AI sử dụng ngũ quan, mô tả chi tiết thay vì kể chung chung, và thể hiện nội tâm nhân vật."
                            isEnabled={settings.sendShowDontTellRule}
                            onToggle={() => handleToggle('sendShowDontTellRule')}
                        />
                         <ToggleRow
                            id="toggle-rule-living-world"
                            label="Quy Tắc 'Thế giới sống động'"
                            description="Yêu cầu AI mô tả các sự kiện nền đang diễn ra xung quanh người chơi."
                            isEnabled={settings.sendLivingWorldRule}
                            onToggle={() => handleToggle('sendLivingWorldRule')}
                        />
                        <ToggleRow
                            id="toggle-rule-proactive-npc"
                            label="Quy Tắc 'NPC chủ động'"
                            description="Yêu cầu AI để ít nhất một NPC thực hiện hành động chủ động trong mỗi cảnh."
                            isEnabled={settings.sendProactiveNpcRule}
                            onToggle={() => handleToggle('sendProactiveNpcRule')}
                        />
                         <ToggleRow
                            id="toggle-rule-rumor-mill"
                            label="Quy Tắc 'Cối xay tin đồn'"
                            description="Yêu cầu AI tạo ra các tin đồn đa dạng (đúng, sai, phóng đại) qua hội thoại của NPC."
                            isEnabled={settings.sendRumorMillRule}
                            onToggle={() => handleToggle('sendRumorMillRule')}
                        />
                        <ToggleRow
                            id="toggle-rule-world-progression"
                            label="Quy Tắc Thế Giới Tự Vận Hành"
                            description="Cho phép AI tự tạo sự kiện phe phái, môi trường và các diễn biến ở xa (sử dụng các tag EVENT_...)."
                            isEnabled={settings.sendWorldProgressionRules}
                            onToggle={() => handleToggle('sendWorldProgressionRules')}
                        />
                         <ToggleRow
                            id="toggle-rule-special-event"
                            label="Hướng Dẫn Sự Kiện Cốt Truyện Đặc Biệt"
                            description={`Kích hoạt một sự kiện lớn, bất ngờ sau mỗi ${SPECIAL_EVENT_INTERVAL_TURNS} lượt chơi.`}
                            isEnabled={settings.sendSpecialEventRules}
                            onToggle={() => handleToggle('sendSpecialEventRules')}
                        />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title="Quy Tắc Tags Chi Tiết (System Tags)"
                    isOpen={isRulesOpen}
                    onToggle={() => setIsRulesOpen(!isRulesOpen)}
                >
                    <div className="space-y-3">
                        <ToggleRow
                            id="toggle-rule-time"
                            label="Quy Tắc Về Thời Gian"
                            description="Hướng dẫn sử dụng tag [CHANGE_TIME]."
                            isEnabled={settings.sendTimeRules}
                            onToggle={() => handleToggle('sendTimeRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-stats"
                            label="Quy Tắc Về Chỉ Số"
                            description="Hướng dẫn sử dụng tag [STATS_UPDATE]."
                            isEnabled={settings.sendStatRules}
                            onToggle={() => handleToggle('sendStatRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-items"
                            label="Quy Tắc Về Vật Phẩm"
                            description="Hướng dẫn sử dụng các tag [ITEM_ACQUIRED], [ITEM_CONSUMED], [ITEM_UPDATE]."
                            isEnabled={settings.sendItemRules}
                            onToggle={() => handleToggle('sendItemRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-skills"
                            label="Quy Tắc Về Kỹ Năng"
                            description="Hướng dẫn sử dụng các tag [SKILL_LEARNED], [SKILL_UPDATE]."
                            isEnabled={settings.sendSkillRules}
                            onToggle={() => handleToggle('sendSkillRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-quests"
                            label="Quy Tắc Về Nhiệm Vụ"
                            description="Hướng dẫn sử dụng các tag [QUEST_...]."
                            isEnabled={settings.sendQuestRules}
                            onToggle={() => handleToggle('sendQuestRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-creation"
                            label="Quy Tắc Về Tạo Mới Thế Giới"
                            description="Hướng dẫn sử dụng các tag [NPC], [YEUTHU], [MAINLOCATION], [FACTION_DISCOVERED], [WORLD_LORE_ADD]."
                            isEnabled={settings.sendCreationRules}
                            onToggle={() => handleToggle('sendCreationRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-update"
                            label="Quy Tắc Về Cập Nhật Thế Giới"
                            description="Hướng dẫn sử dụng các tag [NPC_UPDATE], [LOCATION_CHANGE], [FACTION_UPDATE], v.v."
                            isEnabled={settings.sendUpdateRules}
                            onToggle={() => handleToggle('sendUpdateRules')}
                        />
                         <ToggleRow
                            id="toggle-rule-deletion"
                            label="Quy Tắc Về Xóa Thông Tin"
                            description="Hướng dẫn sử dụng các tag [NPC_REMOVE], v.v."
                            isEnabled={settings.sendDeletionRules}
                            onToggle={() => handleToggle('sendDeletionRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-special-status"
                            label="Quy Tắc Về Thân Phận Đặc Biệt"
                            description="(Chỉ gửi khi người chơi là Tù nhân/Nô lệ) Hướng dẫn về các tag [PLAYER_SPECIAL_STATUS_UPDATE], [MASTER_UPDATE]."
                            isEnabled={settings.sendSpecialStatusRules}
                            onToggle={() => handleToggle('sendSpecialStatusRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-choice"
                            label="Quy Tắc Về Lựa Chọn Mới"
                            description="Hướng dẫn định dạng [CHOICE: '...'] kèm theo tỉ lệ thành công, lợi ích và rủi ro."
                            isEnabled={settings.sendChoiceRules}
                            onToggle={() => handleToggle('sendChoiceRules')}
                        />
                         <ToggleRow
                            id="toggle-rule-turn"
                            label="Quy Tắc Về Lượt Chơi"
                            description="Yêu cầu bắt buộc phải có tag [STATS_UPDATE: turn=+1]."
                            isEnabled={settings.sendTurnRules}
                            onToggle={() => handleToggle('sendTurnRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-status-effect"
                            label="Quy Tắc Về Hiệu Ứng Trạng Thái"
                            description="Hướng dẫn sử dụng các tag [STATUS_EFFECT_APPLY] và [STATUS_EFFECT_REMOVE]."
                            isEnabled={settings.sendStatusEffectRules}
                            onToggle={() => handleToggle('sendStatusEffectRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-combat-start"
                            label="Quy Tắc Bắt Đầu Chiến Đấu"
                            description="Hướng dẫn sử dụng tag [BEGIN_COMBAT] để khởi động trận chiến."
                            isEnabled={settings.sendCombatStartRules}
                            onToggle={() => handleToggle('sendCombatStartRules')}
                        />
                        <ToggleRow
                            id="toggle-rule-simple-companion"
                            label="Quy Tắc Về Đồng Hành (Đơn giản)"
                            description="Hướng dẫn sử dụng các tag [COMPANION_*] cho thú cưng, v.v."
                            isEnabled={settings.sendSimpleCompanionRules}
                            onToggle={() => handleToggle('sendSimpleCompanionRules')}
                        />
                    </div>
                </CollapsibleSection>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <Button variant="danger" onClick={handleReset} className="w-full sm:w-auto">
                    Khôi Phục Mặc Định
                </Button>
                <Button variant="primary" onClick={handleSave} className="w-full sm:w-auto" disabled={!hasChanges}>
                    Lưu & Đóng
                </Button>
            </div>
        </Modal>
    );
};

export default AIContextScreen;