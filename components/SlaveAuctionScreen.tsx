import React, { useState, useEffect, useRef, useMemo } from 'react';
import { KnowledgeBase, AuctionSlave, PlayerStats, Slave, Item } from './../types';
import Button from './ui/Button';
import InputField from './ui/InputField';
import Spinner from './ui/Spinner';
import { VIETNAMESE } from './../constants';
import Modal from './ui/Modal';
import { useGame } from '../hooks/useGame';
import { getDeterministicAvatarSrc } from '../utils/avatarUtils';
import { calculateSlaveValue } from '../utils/gameLogicUtils';


interface SlaveAuctionScreenProps {
  knowledgeBase: KnowledgeBase;
  onPlaceBid: (slaveId: string, bidAmount: number) => void;
  onAuctioneerCall: () => void;
  onSkipItem: () => void;
  onLeave: () => void;
  isLoading: boolean;
  sentEconomyPromptsLog: string[];
  receivedEconomyResponsesLog: string[];
}

const DebugModal: React.FC<{ prompts: string[]; responses: string[]; onClose: () => void; }> = ({ prompts, responses, onClose }) => {
    return (
      <Modal isOpen={true} onClose={onClose} title="Nhật Ký Gỡ Lỗi Đấu Giá Nô Lệ">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Prompt and Response logs would go here, same as in AuctionScreen */}
        </div>
      </Modal>
    );
};

const SlaveAuctionScreen: React.FC<SlaveAuctionScreenProps> = ({
  knowledgeBase,
  onPlaceBid,
  onAuctioneerCall,
  onSkipItem,
  onLeave,
  isLoading,
  sentEconomyPromptsLog,
  receivedEconomyResponsesLog
}) => {
  const game = useGame();
  const { slaveAuctionState, playerStats, inventory } = knowledgeBase;
  const [isAuctionStarted, setIsAuctionStarted] = useState(false);
  const [playerSlavesForAuction, setPlayerSlavesForAuction] = useState<Set<string>>(new Set());
  const [bidAmount, setBidAmount] = useState<string>('');
  const [countdown, setCountdown] = useState(20);
  const [showDebug, setShowDebug] = useState(false);
  
  const commentaryEndRef = useRef<HTMLDivElement>(null);
  const auctioneerCallTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const currentItem = slaveAuctionState?.items[slaveAuctionState.currentItemIndex];
  
  const eligibleSlavesForPlayerAuction = useMemo(() => {
    return knowledgeBase.slaves;
  }, [knowledgeBase.slaves]);

  const handleToggleAuctionSlave = (slaveId: string) => {
      setPlayerSlavesForAuction(prev => {
          const newSet = new Set(prev);
          if (newSet.has(slaveId)) {
              newSet.delete(slaveId);
          } else {
              newSet.add(slaveId);
          }
          return newSet;
      });
  };

  const handleStartAuctionWithPlayerSlaves = () => {
      if (!slaveAuctionState) return;
      game.handleStartSlaveAuction(slaveAuctionState.locationId, Array.from(playerSlavesForAuction));
      setIsAuctionStarted(true);
  };

  useEffect(() => {
    if (!isAuctionStarted || !slaveAuctionState?.isOpen || !currentItem || isLoading) {
      if (auctioneerCallTimerRef.current) clearTimeout(auctioneerCallTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }
    auctioneerCallTimerRef.current = window.setTimeout(() => { onAuctioneerCall(); }, 20000);
    setCountdown(20);
    countdownIntervalRef.current = window.setInterval(() => { setCountdown(prev => Math.max(0, prev - 1)); }, 1000);
    return () => {
      if (auctioneerCallTimerRef.current) clearTimeout(auctioneerCallTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [slaveAuctionState?.currentItemIndex, slaveAuctionState?.lastBidTime, slaveAuctionState?.isOpen, isLoading, onAuctioneerCall, currentItem, isAuctionStarted]);

  useEffect(() => {
    commentaryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [slaveAuctionState?.auctioneerCommentary]);


  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem && bidAmount) {
      const amount = parseInt(bidAmount, 10);
      if (!isNaN(amount) && amount > currentItem.currentBid && amount <= playerStats.currency) {
        onPlaceBid(currentItem.id, amount);
        setBidAmount('');
      } else if (amount <= currentItem.currentBid) {
          alert("Giá đặt phải cao hơn giá hiện tại!");
      } else {
          alert(VIETNAMESE.notEnoughMoney);
      }
    }
  };

  const getBidderName = (bidderId?: string) => {
    if (!bidderId) return 'Chưa có';
    if (bidderId === 'player') return 'Bạn';
    const npc = slaveAuctionState?.auctionNPCs.find(n => n.id === bidderId);
    return npc?.name || 'Người mua bí ẩn';
  };
  
  const currencyName = knowledgeBase.worldConfig?.currencyName || "Tiền";
  
  if (!slaveAuctionState || (!isAuctionStarted && (!slaveAuctionState.items || slaveAuctionState.items.length === 0) && eligibleSlavesForPlayerAuction.length === 0)) {
    return (
        <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold text-gray-400 mb-4">Không có nô lệ nào để đấu giá.</h2>
            <Button onClick={onLeave}>{VIETNAMESE.returnToGame || "Quay Lại Cuộc Phiêu Lưu"}</Button>
        </div>
    );
  }

  if (!isAuctionStarted) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-800 p-4 text-gray-100">
            <header className="mb-4 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-600">
                    Sảnh Đấu Giá Nô Lệ
                </h1>
                 <Button variant="danger" onClick={onLeave}>
                      {VIETNAMESE.leaveButton || "Rời Đi"}
                  </Button>
            </header>
            <div className="flex-grow bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-700 overflow-y-auto custom-scrollbar space-y-6">
                
                <div>
                    <h2 className="text-xl font-semibold text-amber-300 mb-2">Nô Lệ Sắp Đấu Giá (Từ Nhà Đấu Giá)</h2>
                    <div className="space-y-3">
                        {slaveAuctionState.items.length > 0 ? slaveAuctionState.items.map(slave => (
                            <div key={slave.id} className="p-3 bg-gray-800 rounded-md hover:bg-gray-700/50 cursor-pointer" onClick={() => game.openEntityModal('slave', slave)}>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-indigo-300">{slave.name}</span>
                                    <span className="text-xs text-gray-400">{slave.realm}</span>
                                </div>
                                <p className="text-sm text-amber-400 mt-1">Giá khởi điểm: {slave.startingPrice.toLocaleString()} {currencyName}</p>
                            </div>
                        )) : <p className="text-gray-400 italic">Nhà đấu giá chưa chuẩn bị nô lệ nào.</p>}
                    </div>
                </div>

                 <div className="border-t border-gray-700 pt-6">
                    <h2 className="text-xl font-semibold text-green-300 mb-2">Ký Gửi Nô Lệ Của Bạn</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg text-gray-300 mb-2">Nô lệ của bạn</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar bg-gray-800/50 p-2 rounded-md">
                                {eligibleSlavesForPlayerAuction.length > 0 ? eligibleSlavesForPlayerAuction.map(slave => (
                                    <div key={slave.id} className="flex items-center justify-between p-2 bg-gray-700 rounded-md">
                                        <div onClick={() => game.openEntityModal('slave', slave)} className="cursor-pointer">
                                            <p className="font-medium text-gray-200">{slave.name}</p>
                                            <p className="text-xs text-gray-400">{slave.realm} - Tư chất: {slave.tuChat}</p>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => handleToggleAuctionSlave(slave.id)}>
                                            {playerSlavesForAuction.has(slave.id) ? 'Bỏ' : 'Chọn'}
                                        </Button>
                                    </div>
                                )) : <p className="text-gray-400 italic p-2">Bạn không có nô lệ nào.</p>}
                            </div>
                        </div>

                        <div>
                             <h3 className="text-lg text-gray-300 mb-2">Đã chọn đấu giá</h3>
                             <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar bg-gray-800/50 p-2 rounded-md">
                                {Array.from(playerSlavesForAuction).map(slaveId => {
                                    const slave = knowledgeBase.slaves.find(s => s.id === slaveId);
                                    if (!slave) return null;
                                    const slaveRaceSystem = knowledgeBase.worldConfig?.raceCultivationSystems.find(rs => rs.raceName === slave.race)?.realmSystem || knowledgeBase.realmProgressionList.join(' - ');
                                    const slaveRealmProgression = slaveRaceSystem.split(' - ').map(s => s.trim());
                                    const estimatedValue = calculateSlaveValue(slave, slaveRealmProgression);
                                    return (
                                        <div key={slave.id} className="p-2 bg-green-900/30 rounded-md">
                                            <p className="font-medium text-green-300">{slave.name}</p>
                                            <p className="text-xs text-gray-400">Giá khởi điểm (ước tính): ~{(estimatedValue * 0.5).toLocaleString()} {currencyName}</p>
                                        </div>
                                    )
                                })}
                                {playerSlavesForAuction.size === 0 && <p className="text-gray-400 italic p-2">Chưa chọn nô lệ nào.</p>}
                             </div>
                        </div>
                    </div>
                </div>

            </div>
            <div className="mt-4 flex-shrink-0">
                <Button variant="primary" size="lg" className="w-full" onClick={handleStartAuctionWithPlayerSlaves}>
                    Bắt Đầu Đấu Giá
                </Button>
            </div>
        </div>
    );
  }
  
  if (!slaveAuctionState.isOpen || !currentItem) {
    return (
        <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold text-gray-400 mb-4">{VIETNAMESE.auctionEnded}</h2>
            <p className="text-gray-500 mb-6">Phiên đấu giá đã kết thúc hoặc không có nô lệ nào.</p>
            <Button onClick={onLeave}>{VIETNAMESE.returnToGame}</Button>
        </div>
    );
  }

  const callText =
    slaveAuctionState.auctioneerCallCount === 1 ? 'LẦN THỨ NHẤT!' :
    slaveAuctionState.auctioneerCallCount === 2 ? 'LẦN THỨ HAI!' :
    slaveAuctionState.auctioneerCallCount === 3 ? 'LẦN CUỐI CÙNG!' : '';

  return (
    <>
    <div className="h-screen w-screen bg-gray-900 flex flex-col p-2 sm:p-4 text-gray-100 font-sans">
      <header className="mb-3 flex justify-between items-center flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-600">
          {VIETNAMESE.slaveAuctionTitle} ({slaveAuctionState.currentItemIndex + 1}/{slaveAuctionState.items.length})
        </h1>
        <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowDebug(true)} className="border-yellow-500 text-yellow-300 hover:bg-yellow-700 hover:text-white">Debug</Button>
            <Button variant="danger" onClick={onLeave} disabled={isLoading}>{VIETNAMESE.leaveButton}</Button>
        </div>
      </header>

      <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left Panel: Auction Log */}
        <div className="md:w-3/5 lg:w-2/3 flex flex-col bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <h2 className="text-xl font-semibold text-cyan-300 p-3 border-b border-gray-600 flex-shrink-0">Diễn biến đấu giá</h2>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-3">
                {slaveAuctionState.auctioneerCommentary.map(entry => (
                    <div key={entry.id} className="text-sm text-cyan-200/90 italic border-l-2 border-cyan-700 pl-2">{entry.text}</div>
                ))}
                {isLoading && <div className="flex justify-center pt-4"><Spinner text={"Đang chờ diễn biến..."} /></div>}
                <div ref={commentaryEndRef} />
            </div>
        </div>

        {/* Right Panel: Slave Details & Bidding */}
        <div className="md:w-2/5 lg:w-1/3 flex flex-col bg-gray-800 rounded-lg border-2 border-amber-500 shadow-xl p-4 overflow-y-auto custom-scrollbar">
             <div 
                className="flex-shrink-0 pb-2 border-b border-gray-600 flex items-center gap-4 cursor-pointer hover:bg-gray-700/50 rounded-md p-2 -m-2"
                onClick={() => game.openEntityModal('slave', currentItem)}
                title={`Xem chi tiết ${currentItem.name}`}
             >
                <img src={getDeterministicAvatarSrc(currentItem)} alt={currentItem.name} className="w-20 h-20 rounded-full object-cover border-2 border-indigo-400"/>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-amber-300">{currentItem.name}</h2>
                    <p className="text-sm text-gray-400 italic">{currentItem.realm} - {currentItem.race}</p>
                </div>
            </div>
            <div className="my-3 flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-3">
                <p className="text-sm text-gray-200 leading-relaxed">{currentItem.description}</p>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                    <p><strong className="text-gray-400">Tư chất:</strong> {currentItem.tuChat}</p>
                    <p><strong className="text-gray-400">Linh căn:</strong> {currentItem.spiritualRoot || 'Không rõ'}</p>
                 </div>
            </div>
            <div className="flex-shrink-0 pt-3 border-t border-gray-600 space-y-3">
                 <div className="text-sm space-y-2">
                    <p><strong className="text-gray-400">{VIETNAMESE.startingPriceLabel}:</strong> {currentItem.startingPrice.toLocaleString()} {currencyName}</p>
                    <p><strong className="text-gray-400">{VIETNAMESE.currentBidLabel}:</strong> <span className="font-bold text-2xl text-amber-300">{currentItem.currentBid.toLocaleString()}</span> {currencyName}</p>
                    <p><strong className="text-gray-400">{VIETNAMESE.highestBidderLabel}:</strong> {getBidderName(currentItem.highestBidderId)}</p>
                </div>
                <div className="space-y-2">
                    <form onSubmit={handleBidSubmit}>
                        <InputField label={`${VIETNAMESE.yourBidLabel} (của bạn: ${playerStats.currency.toLocaleString()} ${currencyName})`} id="bidAmount" type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder={`> ${currentItem.currentBid}`} min={currentItem.currentBid + 1} disabled={isLoading} className="mb-2"/>
                        <Button type="submit" className="w-full" disabled={isLoading || !bidAmount}>{VIETNAMESE.placeBidButton}</Button>
                    </form>
                    <div className="flex gap-2 pt-1">
                        <Button onClick={onAuctioneerCall} className="w-full" variant="secondary" disabled={isLoading}>Bỏ qua chờ</Button>
                        <Button onClick={onSkipItem} className="w-full" variant="secondary" disabled={isLoading}>Bỏ qua</Button>
                    </div>
                </div>
                 <div className="text-center flex-shrink-0 bg-gray-900 p-2 rounded-lg border border-red-500/50">
                    <div className="text-xs text-red-300">Hô giá sau:</div>
                    <div className="text-2xl font-bold text-red-400 tabular-nums">{countdown}s</div>
                    {callText && <div className="text-xs font-bold text-yellow-300 animate-pulse">{callText}</div>}
                </div>
            </div>
        </div>
      </div>
    </div>
    {showDebug && (
        <DebugModal 
            prompts={sentEconomyPromptsLog} 
            responses={receivedEconomyResponsesLog} 
            onClose={() => setShowDebug(false)}
        />
    )}
    </>
  );
};

export default SlaveAuctionScreen;