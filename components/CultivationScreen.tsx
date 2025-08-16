

import React, { useState, useMemo, useEffect } from 'react';
import { KnowledgeBase, GameScreen, Skill, NPC, Wife, Slave } from './../types';
import Button from './ui/Button';
import InputField from './ui/InputField';
import Spinner from './ui/Spinner';
import { VIETNAMESE } from './../constants';
import * as GameTemplates from './../templates';
import { useGame } from '../hooks/useGame';
import Modal from './ui/Modal';

interface CultivationScreenProps {
  knowledgeBase: KnowledgeBase;
  onStartCultivation: (
    type: 'skill' | 'method',
    duration: number,
    targetId?: string,
    partnerId?: string
  ) => Promise<string[]>;
  onExit: (cultivationLog: string[], totalDuration: { days: number; months: number; years: number; }) => void;
  isLoading: boolean;
  setCurrentScreen: (screen: GameScreen) => void;
}

const DebugModal: React.FC<{ prompts: string[]; responses: string[]; onClose: () => void; }> = ({ prompts, responses, onClose }) => {
    return (
      <Modal isOpen={true} onClose={onClose} title="Nhật Ký Gỡ Lỗi Tu Luyện">
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


const CultivationScreen: React.FC<CultivationScreenProps> = ({
  knowledgeBase,
  onStartCultivation,
  onExit,
  isLoading,
  setCurrentScreen
}) => {
  const game = useGame();
  const [activeTab, setActiveTab] = useState<'skill' | 'method'>('method');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'solo' | 'dual'>('solo');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [duration, setDuration] = useState({ days: 1, months: 0, years: 0 });
  const [totalAccumulatedDuration, setTotalAccumulatedDuration] = useState({ days: 0, months: 0, years: 0 });
  const [cultivationLog, setCultivationLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const { playerSkills, wives, slaves } = knowledgeBase;

  const cultivatableSkills = useMemo(() => {
    return playerSkills.filter(skill => skill.skillType === GameTemplates.SkillType.LINH_KI);
  }, [playerSkills]);

  const soloCultivationMethods = useMemo(() => {
    return playerSkills.filter(skill => skill.skillType === GameTemplates.SkillType.CONG_PHAP_TU_LUYEN && skill.congPhapDetails?.type !== GameTemplates.CongPhapType.SONG_TU);
  }, [playerSkills]);

  const dualCultivationMethods = useMemo(() => {
    return playerSkills.filter(skill => skill.skillType === GameTemplates.SkillType.CONG_PHAP_TU_LUYEN && skill.congPhapDetails?.type === GameTemplates.CongPhapType.SONG_TU);
  }, [playerSkills]);

  const dualCultivationPartners = useMemo(() => {
    return [...wives, ...slaves];
  }, [wives, slaves]);

  useEffect(() => {
    // This effect auto-selects the first available option for the user
    // when the relevant list appears or changes, improving UX and preventing
    // the "start" button from being disabled when a valid option exists.
    if (activeTab === 'method') {
      const currentMethods = selectedMethod === 'solo' ? soloCultivationMethods : dualCultivationMethods;
      const isMethodSelectionValid = currentMethods.some(m => m.id === selectedMethodId);

      if (currentMethods.length > 0 && !isMethodSelectionValid) {
        setSelectedMethodId(currentMethods[0].id);
      } else if (currentMethods.length === 0 && selectedMethodId) {
        setSelectedMethodId('');
      }

      // Auto-select partner for 'dual' method
      if (selectedMethod === 'dual') {
        const isPartnerSelectionValid = dualCultivationPartners.some(p => p.id === selectedPartnerId);
        if (dualCultivationPartners.length > 0 && !isPartnerSelectionValid) {
          setSelectedPartnerId(dualCultivationPartners[0].id);
        } else if (dualCultivationPartners.length === 0 && selectedPartnerId) {
          setSelectedPartnerId('');
        }
      }
    }
  }, [activeTab, selectedMethod, soloCultivationMethods, dualCultivationMethods, dualCultivationPartners, selectedMethodId, selectedPartnerId]);

  const handleDurationChange = (field: 'days' | 'months' | 'years', value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setDuration(prev => ({
      ...prev,
      [field]: Math.max(0, numValue)
    }));
  };

  const handleStart = async () => {
    setError(null);
    try {
      // Assuming 1 day = 1 turn for simplicity in the prompt
      const totalTurns = duration.days + (duration.months * 30) + (duration.years * 360);
      const targetId = activeTab === 'skill' ? selectedSkillId : selectedMethodId;
      
      const log = await onStartCultivation(
        activeTab,
        totalTurns,
        targetId,
        (activeTab === 'method' && selectedMethod === 'dual') ? selectedPartnerId : undefined
      );
      
      setCultivationLog(prev => [...prev, ...log]);
      setTotalAccumulatedDuration(prev => ({
          days: prev.days + duration.days,
          months: prev.months + duration.months,
          years: prev.years + duration.years,
      }));
      setDuration({ days: 1, months: 0, years: 0 });

    } catch (e) {
      setError(e instanceof Error ? e.message : VIETNAMESE.errorCultivating);
    }
  };

  const handleExit = () => {
    onExit(cultivationLog, totalAccumulatedDuration);
  };
  
  const canStartCultivation = () => {
    if (isLoading) return false;
    const isDurationValid = duration.days > 0 || duration.months > 0 || duration.years > 0;
    if (!isDurationValid) return false;

    if (activeTab === 'skill') return !!selectedSkillId;
    if (activeTab === 'method') {
      if (!selectedMethodId) return false;
      if (selectedMethod === 'solo') return true;
      if (selectedMethod === 'dual') return !!selectedPartnerId && dualCultivationMethods.length > 0;
    }
    return false;
  }

  return (
    <>
    <div className="min-h-screen flex flex-col bg-gray-800 p-4 text-gray-100">
      <header className="mb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">
          {VIETNAMESE.cultivationScreenTitle}
        </h1>
        <div className="flex items-center gap-2">
            <Button onClick={() => setShowDebug(true)} variant="ghost" className="border-yellow-500 text-yellow-300 hover:bg-yellow-700 hover:text-white">
                Debug
            </Button>
            <Button onClick={handleExit} variant="secondary" disabled={isLoading}>
                {VIETNAMESE.exitCultivationButton}
            </Button>
        </div>
      </header>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel: Options */}
        <div className="lg:col-span-1 bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-700 flex flex-col space-y-4">
          <div className="flex border-b border-gray-600">
            <button onClick={() => setActiveTab('method')} className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'method' ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>{VIETNAMESE.methodCultivationTab}</button>
            <button onClick={() => setActiveTab('skill')} className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'skill' ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>{VIETNAMESE.skillCultivationTab}</button>
          </div>

          {activeTab === 'skill' && (
            <div className="space-y-3">
               <label htmlFor="selectSkill" className="block text-sm font-medium text-gray-300">{VIETNAMESE.selectSkillToCultivate}</label>
               <select
                  id="selectSkill"
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100"
               >
                  <option value="">-- Chọn Linh Kĩ --</option>
                  {cultivatableSkills.map(skill => (
                     <option key={skill.id} value={skill.id}>{skill.name} ({skill.proficiencyTier})</option>
                  ))}
               </select>
               {cultivatableSkills.length === 0 && <p className="text-xs text-yellow-400 italic">{VIETNAMESE.noSkillsToCultivate}</p>}
            </div>
          )}

          {activeTab === 'method' && (
            <div className="space-y-3">
              <InputField
                label={VIETNAMESE.selectCultivationMethod}
                id="selectMethod"
                type="select"
                options={[VIETNAMESE.closedDoorCultivation, VIETNAMESE.dualCultivation]}
                value={selectedMethod === 'solo' ? VIETNAMESE.closedDoorCultivation : VIETNAMESE.dualCultivation}
                onChange={(e) => {
                  setSelectedMethodId('');
                  setSelectedMethod(e.target.value === VIETNAMESE.closedDoorCultivation ? 'solo' : 'dual')
                }}
              />
              
              {selectedMethod === 'solo' && (
                <InputField
                  label="Chọn Công Pháp Bế Quan"
                  id="select-solo-method"
                  type="select"
                  options={soloCultivationMethods.map(m => m.name) || []}
                  value={soloCultivationMethods.find(m=>m.id === selectedMethodId)?.name || ''}
                  onChange={(e) => setSelectedMethodId(soloCultivationMethods.find(m=>m.name === e.target.value)?.id || '')}
                  disabled={soloCultivationMethods.length === 0}
                />
              )}

              {selectedMethod === 'dual' && (
                <>
                  <InputField
                    label="Chọn Công Pháp Song Tu"
                    id="select-dual-method"
                    type="select"
                    options={dualCultivationMethods.map(m => m.name) || []}
                    value={dualCultivationMethods.find(m=>m.id === selectedMethodId)?.name || ''}
                    onChange={(e) => setSelectedMethodId(dualCultivationMethods.find(m=>m.name === e.target.value)?.id || '')}
                    disabled={dualCultivationMethods.length === 0}
                  />
                  {dualCultivationMethods.length === 0 && <p className="text-xs text-yellow-400 italic">{VIETNAMESE.noDualCultivationMethod}</p>}
                  {dualCultivationPartners.length === 0 && <p className="text-xs text-yellow-400 italic">{VIETNAMESE.noDualCultivationPartnerAvailable}</p>}
                  
                  {dualCultivationMethods.length > 0 && (
                     <InputField
                        label={VIETNAMESE.selectDualCultivationPartner}
                        id="selectPartner"
                        type="select"
                        options={dualCultivationPartners.map(p => p.name)}
                        value={dualCultivationPartners.find(p=>p.id === selectedPartnerId)?.name || ''}
                        onChange={(e) => setSelectedPartnerId(dualCultivationPartners.find(p=>p.name === e.target.value)?.id || '')}
                        disabled={dualCultivationPartners.length === 0}
                     />
                  )}
                </>
              )}
            </div>
          )}

          <fieldset>
             <legend className="block text-sm font-medium text-gray-300 mb-2">{VIETNAMESE.cultivationDurationLabel}</legend>
             <div className="grid grid-cols-3 gap-2">
                <InputField label="Năm" id="duration-years" type="number" min={0} value={duration.years} onChange={(e) => handleDurationChange('years', e.target.value)} />
                <InputField label="Tháng" id="duration-months" type="number" min={0} value={duration.months} onChange={(e) => handleDurationChange('months', e.target.value)} />
                <InputField label="Ngày" id="duration-days" type="number" min={0} value={duration.days} onChange={(e) => handleDurationChange('days', e.target.value)} />
             </div>
          </fieldset>
            
          {totalAccumulatedDuration.days > 0 || totalAccumulatedDuration.months > 0 || totalAccumulatedDuration.years > 0 ? (
            <div className="text-xs text-center text-cyan-300 bg-cyan-900/30 p-2 rounded-md border border-cyan-700">
                Tổng thời gian đã tu luyện: {totalAccumulatedDuration.years} năm, {totalAccumulatedDuration.months} tháng, {totalAccumulatedDuration.days} ngày.
            </div>
          ) : null}

          <Button onClick={handleStart} variant="primary" isLoading={isLoading} loadingText={VIETNAMESE.cultivatingMessage} disabled={!canStartCultivation()}>
            {VIETNAMESE.startCultivationButton}
          </Button>
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-2 bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-700 flex flex-col">
          <h2 className="text-xl font-semibold text-cyan-300 mb-3 border-b border-gray-600 pb-2">{VIETNAMESE.cultivationResultTitle}</h2>
          <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
            {isLoading && cultivationLog.length === 0 && <Spinner text={VIETNAMESE.cultivatingMessage} />}
            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
            {cultivationLog.length > 0 ? (
              <div className="space-y-3 text-sm whitespace-pre-wrap leading-relaxed">
                {cultivationLog.map((logEntry, index) => (
                  <p key={index}>{logEntry}</p>
                ))}
              </div>
            ) : (
                !isLoading && <p className="text-gray-500 italic">Hãy chọn phương thức và bắt đầu tu luyện để xem kết quả.</p>
            )}
          </div>
        </div>
      </div>
    </div>
    {showDebug && (
        <DebugModal 
            prompts={game.sentCultivationPromptsLog} 
            responses={game.receivedCultivationResponsesLog} 
            onClose={() => setShowDebug(false)}
        />
    )}
    </>
  );
};

export default CultivationScreen;
