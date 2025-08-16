import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { KnowledgeBase, NPC, PlayerStats, Item, Skill, AiChoice, StatusEffect, CombatDispositionMap, CombatDisposition, Prisoner, YeuThu, CombatEndPayload, GameMessage } from '../types';
import { VIETNAMESE, FEMALE_AVATAR_BASE_URL, MAX_FEMALE_AVATAR_INDEX, MALE_AVATAR_PLACEHOLDER_URL } from '../constants';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { generateCombatTurn } from '../services/geminiService';
import CombatDebugPanel from './gameplay/CombatDebugPanel';
import OpponentStatsPanel from './gameplay/OpponentStatsPanel';
import Modal from './ui/Modal'; // Import Modal

// --- TYPE DEFINITIONS FOR COMBATANTS ---
type DefeatedEntity = (NPC & { entityType: 'npc' }) | (YeuThu & { entityType: 'yeuThu' });
type Combatant = (NPC & { entityType: 'npc' }) | (YeuThu & { entityType: 'yeuThu' }) | (PlayerStats & { entityType: 'player', id: 'player', name: string });

// --- SUB-COMPONENTS ---
const PlayerCombatPanel: React.FC<{ 
    player: Combatant | undefined, 
    kb: KnowledgeBase, 
    onStatusEffectClick: (effect: StatusEffect) => void,
    onSkillClick: (skill: Skill) => void,
    onItemClick: (item: Item) => void
}> = ({ player, kb, onStatusEffectClick, onSkillClick, onItemClick }) => {
    const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'items'>('stats');

    if (!player || player.entityType !== 'player') {
        return (
            <div className="p-3 bg-gray-800 rounded-lg flex-grow flex flex-col">
                <h4 className="font-semibold text-green-400 border-b border-gray-600 pb-1 mb-2">{VIETNAMESE.playerPanelTitle}</h4>
                <p className="text-gray-400 italic">Lỗi tải dữ liệu người chơi.</p>
            </div>
        );
    }
    
    const getStatusEffectTypeColor = (type: StatusEffect['type']) => {
        switch (type) {
        case 'buff': return 'text-green-300 border-green-500';
        case 'debuff': return 'text-red-300 border-red-500';
        case 'neutral': return 'text-gray-300 border-gray-500';
        default: return 'text-gray-200 border-gray-500';
        }
    };


    return (
        <div className="p-3 bg-gray-800 rounded-lg flex-grow flex flex-col">
            <h4 className="font-semibold text-green-400 border-b border-gray-600 pb-1 mb-2">{VIETNAMESE.playerPanelTitle}</h4>
            <div className="flex border-b border-gray-700 mb-2">
                <button onClick={() => setActiveTab('stats')} className={`flex-1 py-1 text-xs ${activeTab === 'stats' ? 'text-green-300 border-b-2 border-green-400' : 'text-gray-400'}`}>{VIETNAMESE.playerCombatStatsTab}</button>
                <button onClick={() => setActiveTab('skills')} className={`flex-1 py-1 text-xs ${activeTab === 'skills' ? 'text-green-300 border-b-2 border-green-400' : 'text-gray-400'}`}>{VIETNAMESE.playerCombatSkillsTab}</button>
                <button onClick={() => setActiveTab('items')} className={`flex-1 py-1 text-xs ${activeTab === 'items' ? 'text-green-300 border-b-2 border-green-400' : 'text-gray-400'}`}>{VIETNAMESE.playerCombatItemsTab}</button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar text-xs max-h-32">
                {activeTab === 'stats' && (
                    <div className="space-y-1">
                        <p><strong>HP:</strong> {player.sinhLuc} / {player.maxSinhLuc}</p>
                        <p><strong>MP:</strong> {player.linhLuc} / {player.maxLinhLuc}</p>
                        <p><strong>ATK:</strong> {player.sucTanCong}</p>
                        {player.activeStatusEffects && player.activeStatusEffects.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-700/50">
                                <h5 className="font-semibold mb-1">Hiệu ứng:</h5>
                                <ul className="space-y-1">
                                    {player.activeStatusEffects.map(effect => (
                                        <li key={effect.id} onClick={() => onStatusEffectClick(effect)} className={`p-1 text-xs rounded border cursor-pointer ${getStatusEffectTypeColor(effect.type)}`}>
                                            {effect.name} ({effect.durationTurns > 0 ? `${effect.durationTurns} lượt` : 'Vĩnh viễn'})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'skills' && (
                    kb.playerSkills.length > 0 ?
                    <ul className="space-y-1">
                        {kb.playerSkills.map(s => <li key={s.id} onClick={() => onSkillClick(s)} className="p-1 rounded hover:bg-gray-700 cursor-pointer" title={s.name}>{s.name}</li>)}
                    </ul> : <p className="text-gray-400 italic">{VIETNAMESE.noSkillsAvailable}</p>
                )}
                {activeTab === 'items' && (
                     kb.inventory.filter(i => i.category === 'Potion').length > 0 ?
                    <ul className="space-y-1">
                       {kb.inventory.filter(i => i.category === 'Potion').map(i => <li key={i.id} onClick={() => onItemClick(i)} className="p-1 rounded hover:bg-gray-700 cursor-pointer" title={`${i.name} (x${i.quantity})`}>{i.name} (x{i.quantity})</li>)}
                    </ul> : <p className="text-gray-400 italic">{VIETNAMESE.noItemsAvailable}</p>
                )}
            </div>
        </div>
    );
};

const CombatLog: React.FC<{ messages: string[], isLoading: boolean, onLogClick: () => void, isReaderMode: boolean }> = ({ messages, isLoading, onLogClick, isReaderMode }) => {
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div 
            className={`bg-gray-800 rounded-lg shadow-inner p-4 flex-grow overflow-y-auto custom-scrollbar h-full transition-all duration-300 ${isReaderMode ? 'absolute inset-0 z-10' : ''}`}
            onClick={onLogClick}
        >
            <h3 className="text-xl font-bold text-center text-gray-300 mb-4">{VIETNAMESE.combatLog}</h3>
            <div className="space-y-3 text-sm">
                {messages.map((msg, index) => (
                    <p key={index} className="whitespace-pre-wrap leading-relaxed">{msg}</p>
                ))}
                {isLoading && <div className="flex justify-center pt-4"><Spinner text={VIETNAMESE.turnProcessing} /></div>}
            </div>
            <div ref={logEndRef}></div>
        </div>
    );
};


const CombatInput: React.FC<{
    onAction: (action: string) => void;
    isLoading: boolean;
    suggestions: AiChoice[];
}> = ({ onAction, isLoading, suggestions }) => {
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onAction(input.trim());
            setInput('');
        }
    };

    return (
        <div className="bg-gray-800 p-3 rounded-lg space-y-3 flex flex-col">
             <div className="flex justify-between items-center border-b border-gray-600 pb-1 flex-shrink-0">
                <h4 className="font-semibold text-indigo-300">{VIETNAMESE.aiActionSuggestions}</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(!showSuggestions)} className="text-xs !p-1">
                    {showSuggestions ? 'Ẩn' : 'Hiện'}
                </Button>
             </div>
            {showSuggestions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto custom-scrollbar flex-grow max-h-32">
                    {suggestions.map((choice, index) => (
                        <Button key={index} variant="secondary" onClick={() => onAction(choice.text)} disabled={isLoading} className="text-xs justify-start text-left whitespace-normal h-auto py-1.5">
                        {choice.text}
                        </Button>
                    ))}
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex-shrink-0 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={VIETNAMESE.enterCombatAction}
                    disabled={isLoading}
                    className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 text-white"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                    {VIETNAMESE.sendInputButton || "Gửi"}
                </Button>
            </form>
        </div>
    );
};

// --- POST COMBAT MODAL ---
const PostCombatDecisionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    defeatedNpcs: (NPC & { entityType: 'npc' })[];
    onConfirm: (dispositions: CombatDispositionMap) => void;
    isLoading: boolean;
}> = ({ isOpen, onClose, defeatedNpcs, onConfirm, isLoading }) => {
    const [localDispositions, setLocalDispositions] = useState<CombatDispositionMap>({});

    const setDisposition = (npcId: string, disposition: CombatDisposition) => {
        setLocalDispositions(prev => ({
            ...prev,
            [npcId]: disposition,
        }));
    };

    const handleConfirm = () => {
        onConfirm(localDispositions);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Kết Quả Trận Đấu">
            <div className="p-4 space-y-4">
                <h3 className="text-2xl font-bold text-center text-green-400">CHIẾN THẮNG!</h3>
                <p className="text-center text-gray-300">Quyết định số phận của kẻ địch đã bị đánh bại:</p>
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar p-2">
                    {defeatedNpcs.map(npc => (
                        <div key={npc.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-700 p-2 rounded-md gap-2">
                            <span className="font-semibold">{npc.name} ({npc.realm})</span>
                            <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                                <Button size="sm" variant={localDispositions[npc.id] === 'kill' ? 'danger' : 'secondary'} onClick={() => setDisposition(npc.id, 'kill')}>Kết Liễu</Button>
                                <Button size="sm" variant={localDispositions[npc.id] === 'capture' ? 'primary' : 'secondary'} onClick={() => setDisposition(npc.id, 'capture')}>Bắt Giữ</Button>
                                <Button size="sm" variant={localDispositions[npc.id] === 'release' ? 'secondary' : 'secondary'} onClick={() => setDisposition(npc.id, 'release')}>Thả Đi</Button>
                            </div>
                        </div>
                    ))}
                </div>
                 <Button
                    variant="primary"
                    size="lg"
                    className="w-full mt-4"
                    onClick={handleConfirm}
                    isLoading={isLoading}
                    loadingText="Đang xử lý..."
                >
                    {VIETNAMESE.confirmPostCombatActions}
                </Button>
            </div>
        </Modal>
    );
};


// --- MAIN COMBAT SCREEN COMPONENT ---
interface CombatScreenProps {
  knowledgeBase: KnowledgeBase;
  onCombatEnd: (result: CombatEndPayload) => Promise<void>;
  currentPageMessagesLog: string;
  previousPageSummaries: string[];
  lastNarrationFromPreviousPage?: string;
}

interface StatUpdateNotification {
  id: string;
  message: React.ReactNode;
}


const CombatScreen: React.FC<CombatScreenProps> = ({
  knowledgeBase,
  onCombatEnd,
  currentPageMessagesLog,
  previousPageSummaries,
  lastNarrationFromPreviousPage,
}) => {
    const [combatants, setCombatants] = useState<Combatant[]>([]);
    const [combatMessages, setCombatMessages] = useState<string[]>([]);
    const [suggestedActions, setSuggestedActions] = useState<AiChoice[]>([]);
    const [isLoading, setIsLoading] = useState(true); 
    const [isProcessingEnd, setIsProcessingEnd] = useState(false);
    const [combatEnded, setCombatEnded] = useState<'victory' | 'defeat' | 'escaped' | 'surrendered' | null>(null);
    const initialActionFired = useRef(false);
    const [statNotifications, setStatNotifications] = useState<StatUpdateNotification[]>([]);
    const [isReaderMode, setIsReaderMode] = useState(false);
    const [selectedStatusEffect, setSelectedStatusEffect] = useState<StatusEffect | null>(null);
    const [selectedSkillForDetail, setSelectedSkillForDetail] = useState<Skill | null>(null);
    const [selectedItemForDetail, setSelectedItemForDetail] = useState<Item | null>(null);
    const [isDispositionModalOpen, setIsDispositionModalOpen] = useState(false);
    
    // Debug states
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [sentCombatPrompts, setSentCombatPrompts] = useState<string[]>([]);
    const [rawCombatResponses, setRawCombatResponses] = useState<string[]>([]);

    useEffect(() => {
        const timers = statNotifications.map((notif, index) => 
            setTimeout(() => {
                setStatNotifications(prev => prev.filter(n => n.id !== notif.id));
            }, 3000 + index * 100)
        );
        return () => timers.forEach(clearTimeout);
    }, [statNotifications]);

    const handleCombatAction = useCallback(async (action: string) => {
        setIsLoading(true);
        const kbForPrompt = { ...knowledgeBase, combatants: combatants };
        try {
            const { response: parsedResponse, rawText } = await generateCombatTurn(
                kbForPrompt, action, combatMessages, currentPageMessagesLog, previousPageSummaries, lastNarrationFromPreviousPage,
                (prompt) => setSentCombatPrompts(prev => [prompt, ...prev].slice(0, 20))
            );
            setRawCombatResponses(prev => [rawText, ...prev].slice(0, 20));
            setCombatMessages(prev => [...prev, parsedResponse.narration]);
            
            const newNotifications: StatUpdateNotification[] = [];
            parsedResponse.statUpdates.forEach(update => {
                const target = combatants.find(c => c.id === update.targetId);
                if (target) {
                    const statLabel = update.stat === 'sinhLuc' ? 'HP' : (update.stat === 'linhLuc' ? 'MP' : update.stat);
                    const change = update.change;
                    const symbol = change > 0 ? '+' : '';
                    const colorClass = change > 0 ? 'text-green-300' : 'text-red-400';
                    const message = (<span><span className={colorClass}>{`${symbol}${change} ${statLabel}`}</span><span className="text-yellow-100"> cho </span><span className="font-bold text-white">{target.name}</span></span>);
                    newNotifications.push({ id: `${update.targetId}-${update.stat}-${Date.now()}-${Math.random()}`, message });
                }
            });
            if(newNotifications.length > 0) {
                setStatNotifications(prev => [...prev, ...newNotifications]);
            }

            setCombatants(prevCombatants => {
                const newCombatants = JSON.parse(JSON.stringify(prevCombatants));
                parsedResponse.statUpdates.forEach(update => {
                    const targetIndex = newCombatants.findIndex((c: Combatant) => c.id === update.targetId);
                    if (targetIndex !== -1) {
                        const combatantToUpdate = newCombatants[targetIndex];
                        if (combatantToUpdate.entityType === 'npc' || combatantToUpdate.entityType === 'yeuThu') {
                            if (!combatantToUpdate.stats) combatantToUpdate.stats = {};
                            const statKey = update.stat as keyof PlayerStats;
                            if (typeof (combatantToUpdate.stats as any)[statKey] === 'number') {
                                (combatantToUpdate.stats as any)[statKey] += update.change;
                            } else if (typeof (combatantToUpdate.stats as any)[statKey] === 'undefined') {
                                (combatantToUpdate.stats as any)[statKey] = update.change;
                            }
                            if (combatantToUpdate.stats.sinhLuc !== undefined) combatantToUpdate.stats.sinhLuc = Math.max(0, combatantToUpdate.stats.sinhLuc);
                        } else if (combatantToUpdate.entityType === 'player') {
                            const statKey = update.stat as keyof PlayerStats;
                            if (statKey in combatantToUpdate && typeof (combatantToUpdate as any)[statKey] === 'number') {
                                (combatantToUpdate as any)[statKey] += update.change;
                                combatantToUpdate.sinhLuc = Math.max(0, combatantToUpdate.sinhLuc);
                            }
                        }
                    }
                });
                return newCombatants;
            });

            setSuggestedActions(parsedResponse.choices);
            if (parsedResponse.combatEnd) setCombatEnded(parsedResponse.combatEnd);
        } catch (error) {
            setCombatMessages(prev => [...prev, `Lỗi: ${error instanceof Error ? error.message : "Lỗi không xác định"}`]);
        } finally {
            setIsLoading(false);
        }
    }, [knowledgeBase, combatants, combatMessages, currentPageMessagesLog, previousPageSummaries, lastNarrationFromPreviousPage]);

    useEffect(() => {
        if (knowledgeBase.pendingCombat) {
            const playerCombatant: Combatant = { ...knowledgeBase.playerStats, entityType: 'player', id: 'player', name: knowledgeBase.worldConfig?.playerName || 'Người Chơi' };
            const opponentCombatants = knowledgeBase.pendingCombat.opponentIds
                .map(id => (knowledgeBase.discoveredNPCs.find(n => n.id === id) || knowledgeBase.discoveredYeuThu.find(yt => yt.id === id)))
                .filter((c): c is NPC | YeuThu => !!c)
                .map((e): DefeatedEntity => {
                    if ('species' in e) {
                        return { ...e, entityType: 'yeuThu' };
                    }
                    return { ...e, entityType: 'npc' };
                });
            
            setCombatants([playerCombatant, ...opponentCombatants]);
            setCombatMessages([`${VIETNAMESE.combatBegins} Bạn đối đầu với ${opponentCombatants.map(o => o.name).join(', ')}!`]);
            initialActionFired.current = false;
        }
    }, [knowledgeBase.pendingCombat, knowledgeBase.playerStats, knowledgeBase.discoveredNPCs, knowledgeBase.discoveredYeuThu, knowledgeBase.worldConfig?.playerName]);

    useEffect(() => {
        if (combatants.length > 0 && !initialActionFired.current) {
            initialActionFired.current = true;
            handleCombatAction("Bắt đầu chiến đấu");
        }
    }, [combatants, handleCombatAction]);
    
    useEffect(() => {
        if (isLoading || combatEnded) return;
        const player = combatants.find(c => c.entityType === 'player');
        const opponents = combatants.filter((c): c is DefeatedEntity => c.entityType !== 'player');
        if (opponents.length > 0 && opponents.every(o => (o.stats?.sinhLuc ?? 1) <= 0)) {
            setCombatEnded('victory');
            setCombatMessages(prev => [...prev, '\n---\nTất cả đối thủ đã bị đánh bại!\n---']);
        } else if (player && 'sinhLuc' in player && player.sinhLuc <= 0) {
            setCombatEnded('defeat');
            setCombatMessages(prev => [...prev, '\n---\nBạn đã gục ngã trong trận chiến!\n---']);
        }
    }, [combatants, isLoading, combatEnded]);

    const finalizeCombat = useCallback(async (dispositions: CombatDispositionMap) => {
        setIsProcessingEnd(true);
        const player = combatants.find(c => c.entityType === 'player') as PlayerStats | undefined;
        if (!player || !combatEnded) {
            console.error("Player data not found or combat not ended at finalization.");
            setIsProcessingEnd(false);
            return;
        }
        await onCombatEnd({
            outcome: combatEnded,
            summary: combatMessages.join('\n'),
            finalPlayerState: player,
            dispositions,
            opponentIds: combatants.filter(c => c.id !== 'player').map(c => c.id)
        });
    }, [combatants, combatEnded, combatMessages, onCombatEnd]);
    
    const handleEndCombatClick = useCallback(() => {
        const defeatedNpcs = combatants.filter(
            c => c.entityType === 'npc' && (c.stats?.sinhLuc ?? 1) <= 0
        ) as (NPC & { entityType: 'npc' })[];
    
        if (combatEnded === 'victory' && defeatedNpcs.length > 0) {
            setIsDispositionModalOpen(true);
        } else {
            finalizeCombat({});
        }
    }, [combatEnded, combatants, finalizeCombat]);
    

    return (
        <>
            <div className="h-screen w-screen bg-gray-900/95 flex flex-col p-2 sm:p-4 text-gray-100 font-sans">
                <header className="mb-2 flex justify-between items-center flex-shrink-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">
                        {VIETNAMESE.combatScreenTitle}
                    </h1>
                    <div className="flex items-center gap-2">
                        {combatEnded && (
                            <Button variant="danger" onClick={handleEndCombatClick} isLoading={isProcessingEnd} loadingText="Đang xử lý...">
                                Kết Thúc
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => setShowDebugPanel(p => !p)} className="border-yellow-500 text-yellow-300 hover:bg-yellow-700 hover:text-white">
                            Debug
                        </Button>
                    </div>
                </header>

                <div className="flex flex-col gap-3 flex-grow overflow-hidden relative">
                    <div className="flex-shrink-0"><OpponentStatsPanel opponents={combatants.filter(c => c.entityType !== 'player') as (NPC | YeuThu)[]} /></div>
                    <div className="flex-grow min-h-0 relative"><CombatLog messages={combatMessages} isLoading={isLoading} onLogClick={() => setIsReaderMode(p => !p)} isReaderMode={isReaderMode} /></div>
                    {!isReaderMode && !combatEnded && (
                        <div className="flex-shrink-0 grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <div className="lg:col-span-1"><PlayerCombatPanel player={combatants.find(c => c.entityType === 'player') as Combatant | undefined} kb={knowledgeBase} onStatusEffectClick={setSelectedStatusEffect} onSkillClick={setSelectedSkillForDetail} onItemClick={setSelectedItemForDetail} /></div>
                            <div className="lg:col-span-2"><CombatInput onAction={handleCombatAction} isLoading={isLoading || !!combatEnded} suggestions={suggestedActions} /></div>
                        </div>
                    )}
                </div>
                 <div aria-live="polite" aria-atomic="true" className="absolute top-1/2 -translate-y-1/2 left-4 z-50 pointer-events-none space-y-2">
                    {statNotifications.map(notif => (
                        <div key={notif.id} className="animate-fade-in-out bg-black/70 px-3 py-1.5 rounded-lg text-sm shadow-lg border border-gray-700">{notif.message}</div>
                    ))}
                </div>
            </div>

            {selectedStatusEffect && (<Modal isOpen={!!selectedStatusEffect} onClose={() => setSelectedStatusEffect(null)} title={`Chi Tiết Hiệu Ứng: ${selectedStatusEffect.name}`}><p>{selectedStatusEffect.description}</p></Modal>)}
            {selectedSkillForDetail && (<Modal isOpen={!!selectedSkillForDetail} onClose={() => setSelectedSkillForDetail(null)} title={`Chi Tiết Kỹ Năng: ${selectedSkillForDetail.name}`}><p>{selectedSkillForDetail.description}</p><p>Hiệu ứng: {selectedSkillForDetail.detailedEffect}</p></Modal>)}
            {selectedItemForDetail && (<Modal isOpen={!!selectedItemForDetail} onClose={() => setSelectedItemForDetail(null)} title={`Chi Tiết Vật Phẩm: ${selectedItemForDetail.name}`}><p>{selectedItemForDetail.description}</p></Modal>)}
            
            {isDispositionModalOpen && (
                <PostCombatDecisionModal
                    isOpen={isDispositionModalOpen}
                    onClose={() => setIsDispositionModalOpen(false)}
                    defeatedNpcs={combatants.filter(c => c.entityType === 'npc' && (c.stats?.sinhLuc ?? 1) <= 0) as (NPC & { entityType: 'npc' })[]}
                    onConfirm={(dispositions) => {
                        setIsDispositionModalOpen(false);
                        finalizeCombat(dispositions);
                    }}
                    isLoading={isProcessingEnd}
                />
            )}
            {showDebugPanel && <CombatDebugPanel sentPrompts={sentCombatPrompts} rawResponses={rawCombatResponses} onClose={() => setShowDebugPanel(false)} />}
        </>
    );
};

export default CombatScreen;