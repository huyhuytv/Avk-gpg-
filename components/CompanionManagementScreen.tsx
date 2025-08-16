import React, { useState, useMemo } from 'react';
import { useGame } from '../hooks/useGame';
import { Wife, Slave, GameScreen, PlayerStats, ComplexCompanionBase } from '../types';
import { VIETNAMESE, MALE_AVATAR_PLACEHOLDER_URL, FEMALE_AVATAR_BASE_URL, MAX_FEMALE_AVATAR_INDEX, DEFAULT_PLAYER_STATS } from '../constants';
import Button from './ui/Button';
import InputField from './ui/InputField';
import Spinner from './ui/Spinner';
import Modal from './ui/Modal';
import PlayerStatsWithEquipment from './gameplay/equipment/PlayerStatsWithEquipment';
import { calculateEffectiveStats, calculateRealmBaseStats } from '../utils/statsCalculationUtils';
import { getDeterministicAvatarSrc } from '../utils/avatarUtils';

type CompanionEntityType = 'wife' | 'slave';

const DebugModal: React.FC<{ title: string; prompts: string[]; responses: string[]; onClose: () => void; }> = ({ title, prompts, responses, onClose }) => {
    return (
      <Modal isOpen={true} onClose={onClose} title={title}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="text-lg font-semibold text-sky-300 mb-2">Prompt Đã Gửi ({prompts.length})</h3>
            <div className="space-y-2 text-xs bg-gray-900 p-2 rounded-md">
              {prompts.length > 0 ? prompts.map((prompt, index) => (
                <details key={`prompt-${index}`} className="bg-gray-800 rounded group">
                  <summary className="p-1.5 text-sky-200 cursor-pointer text-[11px] group-open:font-semibold">
                    Prompt #{prompts.length - index} (Nhấn để xem)
                  </summary>
                  <pre className="p-1.5 bg-gray-850 text-sky-100 whitespace-pre-wrap break-all text-[10px] leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                    {prompt}
                  </pre>
                </details>
              )) : <p className="text-gray-500 italic">Chưa có prompt nào được gửi.</p>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-lime-300 mb-2">Phản Hồi Nhận Được ({responses.length})</h3>
            <div className="space-y-2 text-xs bg-gray-900 p-2 rounded-md">
              {responses.length > 0 ? responses.map((response, index) => (
                <details key={`resp-${index}`} className="bg-gray-800 rounded group">
                  <summary className="p-1.5 text-lime-200 cursor-pointer text-[11px] group-open:font-semibold">
                    Phản hồi #{responses.length - index} (Nhấn để xem)
                  </summary>
                  <pre className="p-1.5 bg-gray-850 text-lime-100 whitespace-pre-wrap break-all text-[10px] leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                    {response}
                  </pre>
                </details>
              )) : <p className="text-gray-500 italic">Chưa có phản hồi nào được nhận.</p>}
            </div>
          </div>
        </div>
      </Modal>
    );
};

const CompanionManagementScreen: React.FC = () => {
    const game = useGame();
    const { 
        knowledgeBase, 
        setCurrentScreen, 
        handleCompanionAction, 
        handleExitCompanionScreen,
        isLoadingApi,
        companionInteractionLog,
        renameSlave, // NEW: Get rename function from context
    } = game;
    const [activeTab, setActiveTab] = useState<CompanionEntityType>('wife');
    const [selectedCompanionId, setSelectedCompanionId] = useState<string | null>(
        knowledgeBase.wives.length > 0 ? knowledgeBase.wives[0].id : (knowledgeBase.slaves.length > 0 ? knowledgeBase.slaves[0].id : null)
    );
    const [actionInput, setActionInput] = useState('');
    const [showDebug, setShowDebug] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    
    // NEW: State for renaming a slave
    const [renamingSlaveId, setRenamingSlaveId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    const handleTabChange = (tab: CompanionEntityType) => {
        setActiveTab(tab);
        const list = tab === 'wife' ? knowledgeBase.wives : knowledgeBase.slaves;
        setSelectedCompanionId(list.length > 0 ? list[0].id : null);
        handleCancelRename(); // Cancel rename when switching tabs
    };

    const activeList = activeTab === 'wife' ? knowledgeBase.wives : knowledgeBase.slaves;
    const selectedCompanion = activeList.find(c => c.id === selectedCompanionId);
    
    const handleActionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionInput.trim() || !selectedCompanion) return;
        handleCompanionAction(selectedCompanion, actionInput.trim());
        setActionInput('');
    };

    const handleExit = async () => {
        setIsExiting(true);
        try {
            await handleExitCompanionScreen(companionInteractionLog);
        } catch (e) {
            console.error("Error on exiting companion screen:", e);
            setIsExiting(false);
        }
    };

    // NEW: Handlers for rename functionality
    const handleStartRename = (slave: Slave) => {
        setRenamingSlaveId(slave.id);
        setNewName(slave.name);
    };

    const handleCancelRename = () => {
        setRenamingSlaveId(null);
        setNewName('');
    };

    const handleConfirmRename = () => {
        if (!renamingSlaveId || !newName.trim()) return;
        renameSlave(renamingSlaveId, newName);
        handleCancelRename();
    };
    
    const getFullCompanionStats = (companion: ComplexCompanionBase): PlayerStats | null => {
      if (!companion.stats || !companion.realm) return null;
  
      const baseStats = calculateRealmBaseStats(
          companion.realm,
          knowledgeBase.realmProgressionList,
          knowledgeBase.currentRealmBaseStats
      );
      
      const fullStats: PlayerStats = {
          ...DEFAULT_PLAYER_STATS,
          ...baseStats,
          ...companion.stats,
          realm: companion.realm,
          sinhLuc: companion.stats.sinhLuc ?? baseStats.baseMaxSinhLuc,
          maxSinhLuc: companion.stats.maxSinhLuc ?? baseStats.baseMaxSinhLuc,
          linhLuc: companion.stats.linhLuc ?? baseStats.baseMaxLinhLuc,
          maxLinhLuc: companion.stats.maxLinhLuc ?? baseStats.baseMaxLinhLuc,
          sucTanCong: companion.stats.sucTanCong ?? baseStats.baseSucTanCong,
          currency: 0,
          isInCombat: false,
          turn: knowledgeBase.playerStats.turn,
          hieuUngBinhCanh: false,
          activeStatusEffects: [],
          professions: [],
          thoNguyen: companion.stats.thoNguyen ?? 100,
          maxThoNguyen: companion.stats.maxThoNguyen ?? 100,
          spiritualRoot: companion.spiritualRoot || "Không rõ",
          specialPhysique: companion.specialPhysique || "Không rõ",
          tuChat: companion.tuChat, // Pass aptitude
      };
      
      return calculateEffectiveStats(fullStats, companion.equippedItems, knowledgeBase.inventory);
    };
  
    const companionFullStats = selectedCompanion ? getFullCompanionStats(selectedCompanion) : null;

    return (
        <>
        <div className="min-h-screen flex flex-col bg-gray-800 p-4 text-gray-100">
            <header className="mb-4 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600">
                    {VIETNAMESE.companionManagementScreenTitle}
                </h1>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setShowDebug(true)} className="border-yellow-500 text-yellow-300 hover:bg-yellow-700 hover:text-white">
                        Debug
                    </Button>
                    <Button variant="secondary" onClick={handleExit} disabled={isLoadingApi || isExiting} loadingText="Đang thoát...">
                        {isExiting ? 'Đang thoát...' : VIETNAMESE.goBackButton}
                    </Button>
                </div>
            </header>

            <div className="flex border-b border-gray-600 mb-4">
                <button
                    onClick={() => handleTabChange('wife')}
                    className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'wife' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-gray-400 hover:text-white'}`}
                >
                    {VIETNAMESE.daoLuTab} ({knowledgeBase.wives.length})
                </button>
                <button
                    onClick={() => handleTabChange('slave')}
                    className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'slave' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-gray-400 hover:text-white'}`}
                >
                    {VIETNAMESE.nuNoTab} ({knowledgeBase.slaves.length})
                </button>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden h-full">
                {/* Left Column (Narrow): Companion List */}
                <div className="lg:col-span-1 bg-gray-900 p-3 rounded-lg shadow-xl border border-gray-700 h-full overflow-y-auto custom-scrollbar">
                     <h2 className="text-xl font-semibold text-gray-300 mb-3 border-b border-gray-600 pb-2">Danh Sách</h2>
                    {activeList.length === 0 ? (
                        <p className="text-gray-400 italic">{activeTab === 'wife' ? VIETNAMESE.noWives : VIETNAMESE.noSlaves}</p>
                    ) : (
                        <ul className="space-y-2">
                            {activeList.map(c => (
                                <li key={c.id}>
                                    <button
                                        onClick={() => { setSelectedCompanionId(c.id); handleCancelRename(); }}
                                        className={`w-full text-left p-2 rounded-lg transition-colors ${selectedCompanionId === c.id ? 'bg-purple-800/50 ring-2 ring-purple-500' : 'bg-gray-700/70 hover:bg-gray-700'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <img src={getDeterministicAvatarSrc(c)} alt={c.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"/>
                                            <div>
                                                <span className="font-semibold">{c.name}</span>
                                                <span className="text-xs text-gray-400 block">{c.realm}</span>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Center Column (Large): Interaction Log */}
                <div className="lg:col-span-2 bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-700 flex flex-col min-h-0 h-full">
                    <h3 className="text-xl font-semibold text-gray-300 mb-3 border-b border-gray-600 pb-2 flex-shrink-0">Nhật Ký Tương Tác</h3>
                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2">
                        {isLoadingApi && companionInteractionLog.length === 0 && <Spinner text="Đang xử lý..."/>}
                        {companionInteractionLog.length > 0 ? (
                            companionInteractionLog.map((log, index) => (
                                <details key={index} className="bg-gray-800 rounded-lg group">
                                    <summary className="p-3 cursor-pointer text-gray-300 hover:bg-gray-700/50 rounded-md list-none flex justify-between items-center group-open:bg-gray-700/80 group-open:rounded-b-none">
                                        <span>Lượt tương tác #{index + 1}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 transition-transform duration-200 group-open:rotate-180">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </summary>
                                    <div className="p-3 border-t border-gray-700 bg-gray-800/50 rounded-b-lg">
                                        <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">{log}</p>
                                    </div>
                                </details>
                            ))
                        ) : !isLoadingApi && (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500 italic text-sm">Chưa có tương tác nào.</p>
                            </div>
                        )}
                    </div>
                </div>

                 {/* Right Column (Narrow): Details & Interaction */}
                <div className="lg:col-span-1 bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-700 overflow-y-auto custom-scrollbar">
                    {selectedCompanion && companionFullStats ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                {renamingSlaveId === selectedCompanion.id ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <InputField
                                            label=""
                                            id={`rename-slave-input-${selectedCompanion.id}`}
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Tên mới..."
                                            className="!mb-0 flex-grow"
                                        />
                                        <Button size="sm" variant="primary" onClick={handleConfirmRename} disabled={!newName.trim() || newName.trim() === selectedCompanion.name}>Lưu</Button>
                                        <Button size="sm" variant="ghost" onClick={handleCancelRename}>Hủy</Button>
                                    </div>
                                ) : (
                                    <h2 className="text-2xl font-bold text-pink-400">{selectedCompanion.name}</h2>
                                )}
                                
                                {selectedCompanion.entityType === 'slave' && renamingSlaveId !== selectedCompanion.id && (
                                    <Button size="sm" onClick={() => handleStartRename(selectedCompanion as Slave)}>Đổi tên</Button>
                                )}
                            </div>

                             <PlayerStatsWithEquipment
                                personId={selectedCompanion.id}
                                playerStats={companionFullStats}
                                equippedItems={selectedCompanion.equippedItems}
                                inventory={knowledgeBase.inventory}
                                currencyName={knowledgeBase.worldConfig?.currencyName}
                                playerName={selectedCompanion.name}
                                playerGender={selectedCompanion.gender}
                                playerRace={selectedCompanion.race}
                                playerAvatarUrl={selectedCompanion.avatarUrl}
                                isPlayerContext={false}
                                tuChat={selectedCompanion.tuChat}
                            />
                            
                            <form onSubmit={handleActionSubmit} className="space-y-2">
                                <InputField
                                    label={`Tương tác với ${selectedCompanion.name}`}
                                    id="companionAction"
                                    value={actionInput}
                                    onChange={(e) => setActionInput(e.target.value)}
                                    placeholder={VIETNAMESE.actionInputPlaceholder}
                                    disabled={isLoadingApi}
                                />
                                <Button type="submit" variant="primary" className="w-full" disabled={isLoadingApi || !actionInput.trim()}>{VIETNAMESE.performAction}</Button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 italic">Chọn một người để xem chi tiết.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        {showDebug && (
            <DebugModal
                title="Nhật Ký Gỡ Lỗi Hậu Cung"
                prompts={game.sentCompanionPromptsLog}
                responses={game.receivedCompanionResponsesLog}
                onClose={() => setShowDebug(false)}
            />
        )}
        </>
    );
};

export default CompanionManagementScreen;
