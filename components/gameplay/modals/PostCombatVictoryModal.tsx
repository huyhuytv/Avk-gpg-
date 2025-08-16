
import React, { useState, useMemo } from 'react';
import { CombatEndPayload, CombatDispositionMap, CombatDisposition, KnowledgeBase, NPC, YeuThu } from '../../../types';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { VIETNAMESE } from '../../../constants';

interface PostCombatVictoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    postCombatState: CombatEndPayload;
    knowledgeBase: KnowledgeBase;
    onConfirm: (dispositions: CombatDispositionMap) => Promise<void>;
    isLoading: boolean;
}

type DefeatedEntity = (NPC & { entityType: 'npc' }) | (YeuThu & { entityType: 'yeuThu' });

const PostCombatVictoryModal: React.FC<PostCombatVictoryModalProps> = ({ isOpen, onClose, postCombatState, knowledgeBase, onConfirm, isLoading }) => {
    const [dispositions, setDispositions] = useState<CombatDispositionMap>({});

    const allDefeatedEntities: DefeatedEntity[] = useMemo(() => {
        return postCombatState.opponentIds
            .map(id => 
                (knowledgeBase.discoveredNPCs.find(n => n.id === id) as NPC | undefined) || 
                (knowledgeBase.discoveredYeuThu.find(y => y.id === id) as YeuThu | undefined)
            )
            .filter((e): e is NPC | YeuThu => e !== undefined && (e.stats?.sinhLuc ?? 1) <= 0)
            .map((e): DefeatedEntity => {
                if ('species' in e) { // This is a YeuThu
                    return { ...e, entityType: 'yeuThu' };
                } else { // This is an NPC
                    return { ...e, entityType: 'npc' };
                }
            });
    }, [postCombatState.opponentIds, knowledgeBase.discoveredNPCs, knowledgeBase.discoveredYeuThu]);

    const defeatedNpcs = allDefeatedEntities.filter((e): e is (NPC & { entityType: 'npc' }) => e.entityType === 'npc');

    if (defeatedNpcs.length === 0) {
        // This case handles victories where only beasts were defeated, no disposition needed.
        // We can auto-confirm and close.
        React.useEffect(() => {
            if (isOpen) {
                onConfirm({});
                onClose();
            }
        }, [isOpen, onConfirm, onClose]);
        return null;
    }

    const setDisposition = (npcId: string, disposition: CombatDisposition) => {
        setDispositions(prev => ({
            ...prev,
            [npcId]: disposition,
        }));
    };

    const handleConfirmAndClose = () => {
        onConfirm(dispositions).finally(() => {
            onClose();
        });
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
                            <Button size="sm" variant={dispositions[npc.id] === 'kill' ? 'primary' : 'secondary'} onClick={() => setDisposition(npc.id, 'kill')}>Kết Liễu</Button>
                            <Button size="sm" variant={dispositions[npc.id] === 'capture' ? 'primary' : 'secondary'} onClick={() => setDisposition(npc.id, 'capture')}>Bắt Giữ</Button>
                            <Button size="sm" variant={dispositions[npc.id] === 'release' ? 'primary' : 'secondary'} onClick={() => setDisposition(npc.id, 'release')}>Thả Đi</Button>
                        </div>
                    </div>
                ))}
                </div>
                 <Button
                    variant="primary"
                    size="lg"
                    className="w-full mt-4"
                    onClick={handleConfirmAndClose}
                    isLoading={isLoading}
                    loadingText="Đang xử lý..."
                >
                    {VIETNAMESE.confirmPostCombatActions}
                </Button>
            </div>
        </Modal>
    );
};

export default PostCombatVictoryModal;
