
import React, { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { Prisoner, GameScreen } from '../types';
import { VIETNAMESE } from '../constants';
import Button from './ui/Button';
import InputField from './ui/InputField';
import Spinner from './ui/Spinner';
import Modal from './ui/Modal';
import { getDeterministicAvatarSrc } from './../utils/avatarUtils';

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


const PrisonerManagementScreen: React.FC = () => {
    const game = useGame();
    const { 
        knowledgeBase, 
        convertPrisoner, 
        isLoadingApi, 
        prisonerInteractionLog,
        handlePrisonerAction,
        handleExitPrisonerScreen
    } = game;

    const [selectedPrisonerId, setSelectedPrisonerId] = useState<string | null>(
        knowledgeBase.prisoners.length > 0 ? knowledgeBase.prisoners[0].id : null
    );
    const [actionInput, setActionInput] = useState('');
    const [showDebug, setShowDebug] = useState(false);
    const [isExiting, setIsExiting] = useState(false); // New state to track exit process

    const selectedPrisoner = knowledgeBase.prisoners.find(p => p.id === selectedPrisonerId);
    
    const handleActionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionInput.trim() || !selectedPrisoner) return;
        handlePrisonerAction(selectedPrisoner, actionInput.trim());
        setActionInput('');
    };
    
    const canConvertToCompanion = selectedPrisoner && selectedPrisoner.affinity >= 80 && selectedPrisoner.obedience >= 80;

    const handleExit = async () => {
        setIsExiting(true);
        try {
            await handleExitPrisonerScreen(prisonerInteractionLog);
        } catch (e) {
            console.error("Error on exiting prisoner screen:", e);
            // Re-enable button on error if screen doesn't change
            setIsExiting(false);
        }
        // No need to setIsExiting(false) in finally, as the component will unmount on success.
    };

    return (
        <>
        <div className="min-h-screen flex flex-col bg-gray-800 p-4 text-gray-100">
            <header className="mb-4 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-gray-500 to-red-600">
                    {VIETNAMESE.prisonerManagementScreenTitle}
                </h1>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setShowDebug(true)} className="border-yellow-500 text-yellow-300 hover:bg-yellow-700 hover:text-white">
                        Debug
                    </Button>
                    <Button variant="secondary" onClick={handleExit} disabled={isLoadingApi || isExiting} loadingText='Đang thoát...'>
                        {isExiting ? 'Đang thoát...' : VIETNAMESE.goBackButton}
                    </Button>
                </div>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden h-full">
                {/* Left Column (Narrow): Prisoner List */}
                <div className="lg:col-span-1 bg-gray-900 p-3 rounded-lg shadow-xl border border-gray-700 h-full overflow-y-auto custom-scrollbar">
                    <h2 className="text-xl font-semibold text-gray-300 mb-3 border-b border-gray-600 pb-2">Danh Sách Tù Nhân</h2>
                    {knowledgeBase.prisoners.length === 0 ? (
                        <p className="text-gray-400 italic">{VIETNAMESE.noPrisoners}</p>
                    ) : (
                        <ul className="space-y-2">
                            {knowledgeBase.prisoners.map(p => (
                                <li key={p.id}>
                                    <button
                                        onClick={() => setSelectedPrisonerId(p.id)}
                                        className={`w-full text-left p-2 rounded-lg transition-colors ${selectedPrisonerId === p.id ? 'bg-red-800/50 ring-2 ring-red-500' : 'bg-gray-700/70 hover:bg-gray-700'}`}
                                    >
                                        <span className="font-semibold">{p.name}</span>
                                        <span className="text-xs text-gray-400 block">{p.realm}</span>
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
                        {isLoadingApi && prisonerInteractionLog.length === 0 && <Spinner text="Đang xử lý..."/>}
                        {prisonerInteractionLog.length > 0 ? (
                            prisonerInteractionLog.map((log, index) => (
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
                    {selectedPrisoner ? (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-red-400 border-b border-gray-600 pb-2">{selectedPrisoner.name}</h2>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                <img src={getDeterministicAvatarSrc(selectedPrisoner)} alt={selectedPrisoner.name} className="w-24 h-24 rounded-full object-cover border-2 border-red-700 flex-shrink-0" />
                                <p className="text-sm text-gray-300 italic flex-grow">{selectedPrisoner.description}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 p-3 bg-gray-800/50 rounded-lg text-sm">
                                {selectedPrisoner.title && <p><strong className="text-indigo-300">Chức danh:</strong> {selectedPrisoner.title}</p>}
                                {selectedPrisoner.gender && <p><strong className="text-indigo-300">Giới tính:</strong> {selectedPrisoner.gender}</p>}
                                {selectedPrisoner.race && <p><strong className="text-indigo-300">Chủng tộc:</strong> {selectedPrisoner.race}</p>}
                                
                                <div className="col-span-full border-t border-gray-700 my-1"></div>
                                
                                {selectedPrisoner.realm && <p className="col-span-full"><strong className="text-indigo-300">Cảnh giới:</strong> {selectedPrisoner.realm}</p>}
                                {selectedPrisoner.tuChat && <p><strong className="text-indigo-300">Tư chất:</strong> {selectedPrisoner.tuChat}</p>}
                                {selectedPrisoner.spiritualRoot && <p><strong className="text-indigo-300">Linh căn:</strong> {selectedPrisoner.spiritualRoot}</p>}
                                {selectedPrisoner.specialPhysique && <p className="col-span-full"><strong className="text-indigo-300">Thể chất:</strong> {selectedPrisoner.specialPhysique}</p>}
                                
                                <div className="col-span-full border-t border-gray-700 my-1"></div>

                                <p><strong className="text-indigo-300">{VIETNAMESE.statAffinity}:</strong> {selectedPrisoner.affinity}</p>
                                <p><strong className="text-indigo-300">{VIETNAMESE.statWillpower}:</strong> {selectedPrisoner.willpower}</p>
                                <p><strong className="text-indigo-300">{VIETNAMESE.statResistance}:</strong> {selectedPrisoner.resistance}</p>
                                <p><strong className="text-indigo-300">{VIETNAMESE.statObedience}:</strong> {selectedPrisoner.obedience}</p>

                                {selectedPrisoner.stats && (selectedPrisoner.stats.maxSinhLuc != null || selectedPrisoner.stats.sucTanCong != null) && (
                                    <>
                                        <div className="col-span-full border-t border-gray-700 my-1"></div>
                                        {selectedPrisoner.stats.maxSinhLuc != null && <p><strong className="text-indigo-300">Sinh Lực:</strong> {selectedPrisoner.stats.sinhLuc ?? '??'} / {selectedPrisoner.stats.maxSinhLuc}</p>}
                                        {selectedPrisoner.stats.maxLinhLuc != null && selectedPrisoner.stats.maxLinhLuc > 0 && <p><strong className="text-indigo-300">Linh Lực:</strong> {selectedPrisoner.stats.linhLuc ?? '??'} / {selectedPrisoner.stats.maxLinhLuc}</p>}
                                        {selectedPrisoner.stats.sucTanCong != null && <p><strong className="text-indigo-300">Sức Tấn Công:</strong> {selectedPrisoner.stats.sucTanCong}</p>}
                                        {selectedPrisoner.stats.thoNguyen !== undefined && <p className="col-span-full"><strong className="text-indigo-300">Thọ Nguyên:</strong> {Math.floor(selectedPrisoner.stats.thoNguyen)} / {selectedPrisoner.stats.maxThoNguyen}</p>}
                                    </>
                                )}
                            </div>
                            
                            <form onSubmit={handleActionSubmit} className="space-y-2">
                                <InputField
                                    label="Hành động (Trò chuyện, Huấn luyện, Chăm sóc...)"
                                    id="prisonerAction"
                                    value={actionInput}
                                    onChange={(e) => setActionInput(e.target.value)}
                                    placeholder={VIETNAMESE.actionInputPlaceholder}
                                    disabled={isLoadingApi}
                                />
                                <Button type="submit" variant="primary" className="w-full" disabled={isLoadingApi || !actionInput.trim()}>{VIETNAMESE.performAction}</Button>
                            </form>
                            
                            {canConvertToCompanion && (
                                <div className="pt-4 border-t border-gray-700 space-y-2">
                                    <p className="text-sm text-green-400 text-center">Tù nhân này đã hoàn toàn quy phục. Bạn có thể thay đổi thân phận của họ.</p>
                                    <div className="flex gap-4">
                                        <Button onClick={() => convertPrisoner(selectedPrisoner.id, 'slave')} variant="secondary" className="w-full border-gray-500 hover:bg-gray-600">{VIETNAMESE.convertToSlaveButton}</Button>
                                        <Button onClick={() => convertPrisoner(selectedPrisoner.id, 'wife')} variant="secondary" className="w-full border-pink-500 text-pink-300 hover:bg-pink-700">{VIETNAMESE.convertToWifeButton}</Button>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 italic">Chọn một tù nhân để xem chi tiết.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        {showDebug && (
            <DebugModal
                title="Nhật Ký Gỡ Lỗi Tù Nhân"
                prompts={game.sentPrisonerPromptsLog}
                responses={game.receivedPrisonerResponsesLog}
                onClose={() => setShowDebug(false)}
            />
        )}
        </>
    );
};

export default PrisonerManagementScreen;
