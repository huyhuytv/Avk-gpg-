

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { KnowledgeBase, AuctionItem, PlayerStats, Item } from './../types';
import Button from './ui/Button';
import InputField from './ui/InputField';
import Spinner from './ui/Spinner';
import { VIETNAMESE } from './../constants';
import * as GameTemplates from './../templates';
import Modal from './ui/Modal';
import { useGame } from '../hooks/useGame';
import { calculateItemValue } from '../utils/statsCalculationUtils';

interface AuctionScreenProps {
  knowledgeBase: KnowledgeBase;
  onPlaceBid: (itemId: string, bidAmount: number) => void;
  onAuctioneerCall: () => void;
  onSkipItem: () => void;
  onLeave: () => void;
  isLoading: boolean;
  sentEconomyPromptsLog: string[];
  receivedEconomyResponsesLog: string[];
}

const DebugModal: React.FC<{ prompts: string[]; responses: string[]; onClose: () => void; }> = ({ prompts, responses, onClose }) => {
    return (
      <Modal isOpen={true} onClose={onClose} title="Nhật Ký Gỡ Lỗi Đấu Giá">
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


// Helper function to render detailed item stats
const renderStatBonuses = (bonuses: Partial<PlayerStats>) => {
    const relevantBonuses = Object.entries(bonuses).filter(
        (entry): entry is [string, number] => {
            const [key, value] = entry;
            return !key.startsWith('base') && typeof value === 'number' && value !== 0;
        }
    );

    if (relevantBonuses.length === 0) return null;

    const statLabels: Record<string, string> = {
        sinhLuc: "Sinh Lực Hiện Tại", maxSinhLuc: "Sinh Lực Tối Đa",
        linhLuc: "Linh Lực Hiện Tại", maxLinhLuc: "Linh Lực Tối Đa",
        sucTanCong: "Sức Tấn Công",
        kinhNghiem: "Kinh Nghiệm", maxKinhNghiem: "Kinh Nghiệm Tối Đa",
    };

    return (
        <div className="mt-2">
            <strong className="text-gray-300">Chỉ số cộng thêm:</strong>
            <ul className="list-disc list-inside pl-4 text-xs">
                {relevantBonuses.map(([key, value]) => (
                    <li key={key}>
                        <span className="text-gray-300">{statLabels[key] || key}: </span>
                        <span className={value > 0 ? "text-green-400" : "text-red-400"}>
                            {value > 0 ? `+${value}` : value}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const AuctionScreen: React.FC<AuctionScreenProps> = ({ knowledgeBase, onPlaceBid, onAuctioneerCall, onSkipItem, onLeave, isLoading, sentEconomyPromptsLog, receivedEconomyResponsesLog }) => {
  const { auctionState, playerStats } = knowledgeBase;
  const [isAuctionStarted, setIsAuctionStarted] = useState(false);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [countdown, setCountdown] = useState(20);
  const [showDebug, setShowDebug] = useState(false);
  const [playerItemsForAuction, setPlayerItemsForAuction] = useState<Set<string>>(new Set());
  const game = useGame();
  
  const commentaryEndRef = useRef<HTMLDivElement>(null);
  const auctioneerCallTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const currentItem = auctionState?.items[auctionState.currentItemIndex];
  
  const eligibleItemsForPlayerAuction = useMemo(() => {
    const rarities: GameTemplates.EquipmentRarity[] = [
        GameTemplates.ItemRarity.QUY_BAU,
        GameTemplates.ItemRarity.CUC_PHAM,
        GameTemplates.ItemRarity.THAN_THOAI,
        GameTemplates.ItemRarity.CHI_TON,
    ];
    return knowledgeBase.inventory.filter(item => rarities.includes(item.rarity));
  }, [knowledgeBase.inventory]);

  const handleToggleAuctionItem = (itemId: string) => {
      setPlayerItemsForAuction(prev => {
          const newSet = new Set(prev);
          if (newSet.has(itemId)) {
              newSet.delete(itemId);
          } else {
              newSet.add(itemId);
          }
          return newSet;
      });
  };

  const handleStartAuctionWithPlayerItems = () => {
      if (!auctionState) return;
      game.handleStartAuction(auctionState.locationId, Array.from(playerItemsForAuction));
      setIsAuctionStarted(true);
  };

  useEffect(() => {
    if (!isAuctionStarted) {
        if (auctioneerCallTimerRef.current) clearTimeout(auctioneerCallTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        return;
    }

    if (!auctionState?.isOpen || !currentItem || isLoading) {
      return;
    }

    // Set a new 20-second timer to call the auctioneer
    auctioneerCallTimerRef.current = window.setTimeout(() => {
      onAuctioneerCall();
    }, 20000);

    // Set a new 1-second interval for the visual countdown
    setCountdown(20);
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    // Cleanup function
    return () => {
      if (auctioneerCallTimerRef.current) clearTimeout(auctioneerCallTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [auctionState?.currentItemIndex, auctionState?.lastBidTime, auctionState?.isOpen, isLoading, onAuctioneerCall, currentItem, isAuctionStarted]);

  useEffect(() => {
      commentaryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [auctionState?.auctioneerCommentary]);


  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem && bidAmount) {
      const amount = parseInt(bidAmount, 10);
      if (!isNaN(amount) && amount > currentItem.currentBid && amount <= playerStats.currency) {
        onPlaceBid(currentItem.id, amount);
        setBidAmount('');
      } else if (amount <= currentItem.currentBid) {
          alert("Giá đặt phải cao hơn giá hiện tại!");
      } else if (amount > playerStats.currency) {
          alert(VIETNAMESE.notEnoughMoney);
      }
    }
  };

  const getBidderName = (bidderId?: string) => {
    if (!bidderId) return 'Chưa có';
    if (bidderId === 'player') return 'Bạn';
    const tempNpc = auctionState?.auctionNPCs.find(n => n.id === bidderId);
    if (tempNpc) return tempNpc.name;
    return knowledgeBase.discoveredNPCs.find(n => n.id === bidderId)?.name || 'Người mua bí ẩn';
  };

  const callText =
    auctionState?.auctioneerCallCount === 1 ? 'LẦN THỨ NHẤT!' :
    auctionState?.auctioneerCallCount === 2 ? 'LẦN THỨ HAI!' :
    auctionState?.auctioneerCallCount === 3 ? 'LẦN CUỐI CÙNG!' : '';

  if (!auctionState || (!isAuctionStarted && (!auctionState.items || auctionState.items.length === 0) && eligibleItemsForPlayerAuction.length === 0)) {
    return (
        <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold text-gray-400 mb-4">Không có vật phẩm nào để đấu giá.</h2>
            <Button onClick={onLeave}>{VIETNAMESE.returnToGame || "Quay Lại Cuộc Phiêu Lưu"}</Button>
        </div>
    );
  }
  
  const currencyName = knowledgeBase.worldConfig?.currencyName || "Tiền";
  
  if (!isAuctionStarted) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-800 p-4 text-gray-100">
            <header className="mb-4 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-600">
                    Sảnh Đấu Giá
                </h1>
                 <Button variant="danger" onClick={onLeave}>
                      {VIETNAMESE.leaveButton || "Rời Đi"}
                  </Button>
            </header>
            <div className="flex-grow bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-700 overflow-y-auto custom-scrollbar space-y-6">
                
                {/* AI Items */}
                <div>
                    <h2 className="text-xl font-semibold text-amber-300 mb-2">Vật Phẩm Sắp Đấu Giá (Từ Nhà Đấu Giá)</h2>
                    <div className="space-y-3">
                        {auctionState.items.length > 0 ? auctionState.items.map(item => (
                            <div key={item.id} className="p-3 bg-gray-800 rounded-md hover:bg-gray-700/50 cursor-pointer" onClick={() => game.openEntityModal('item', item)}>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-indigo-300">{item.name}</span>
                                    <span className="text-xs text-gray-400">{item.rarity}</span>
                                </div>
                                <p className="text-sm text-amber-400 mt-1">Giá khởi điểm: {item.startingPrice.toLocaleString()} {currencyName}</p>
                            </div>
                        )) : <p className="text-gray-400 italic">Nhà đấu giá chưa chuẩn bị vật phẩm nào.</p>}
                    </div>
                </div>

                 {/* Player Items */}
                 <div className="border-t border-gray-700 pt-6">
                    <h2 className="text-xl font-semibold text-green-300 mb-2">Ký Gửi Vật Phẩm Của Bạn (Độ hiếm Quý Báu+)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Eligible Items List */}
                        <div>
                            <h3 className="text-lg text-gray-300 mb-2">Vật phẩm trong túi</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar bg-gray-800/50 p-2 rounded-md">
                                {eligibleItemsForPlayerAuction.length > 0 ? eligibleItemsForPlayerAuction.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-700 rounded-md">
                                        <div onClick={() => game.openEntityModal('item', item)} className="cursor-pointer">
                                            <p className="font-medium text-gray-200">{item.name}</p>
                                            <p className="text-xs text-gray-400">{item.rarity}</p>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => handleToggleAuctionItem(item.id)}>
                                            {playerItemsForAuction.has(item.id) ? 'Bỏ' : 'Chọn'}
                                        </Button>
                                    </div>
                                )) : <p className="text-gray-400 italic p-2">Không có vật phẩm đủ điều kiện.</p>}
                            </div>
                        </div>

                        {/* Selected Items List */}
                        <div>
                             <h3 className="text-lg text-gray-300 mb-2">Vật phẩm đã chọn đấu giá</h3>
                             <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar bg-gray-800/50 p-2 rounded-md">
                                {Array.from(playerItemsForAuction).map(itemId => {
                                    const item = knowledgeBase.inventory.find(i => i.id === itemId);
                                    if (!item) return null;
                                    const estimatedValue = calculateItemValue(item, knowledgeBase.realmProgressionList);
                                    return (
                                        <div key={item.id} className="p-2 bg-green-900/30 rounded-md">
                                            <p className="font-medium text-green-300">{item.name}</p>
                                            <p className="text-xs text-gray-400">Giá khởi điểm (ước tính): ~{(estimatedValue * 0.5).toLocaleString()} {currencyName}</p>
                                        </div>
                                    )
                                })}
                                {playerItemsForAuction.size === 0 && <p className="text-gray-400 italic p-2">Chưa chọn vật phẩm nào.</p>}
                             </div>
                        </div>
                    </div>
                </div>

            </div>
            <div className="mt-4 flex-shrink-0">
                <Button variant="primary" size="lg" className="w-full" onClick={handleStartAuctionWithPlayerItems}>
                    Bắt Đầu Đấu Giá
                </Button>
            </div>
        </div>
    );
  }
  
  if (!auctionState.isOpen || !currentItem) {
    return (
        <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold text-gray-400 mb-4">{VIETNAMESE.auctionEnded}</h2>
            <p className="text-gray-500 mb-6">Phiên đấu giá đã kết thúc hoặc không có sẵn vật phẩm.</p>
            <Button onClick={onLeave}>{VIETNAMESE.returnToGame || "Quay Lại Cuộc Phiêu Lưu"}</Button>
        </div>
    );
  }

  return (
    <>
    <div className="h-screen w-screen bg-gray-900 flex flex-col p-2 sm:p-4 text-gray-100 font-sans">
      <header className="mb-3 flex justify-between items-center flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-600">
          {VIETNAMESE.auctionHouseTitle} ({auctionState.currentItemIndex + 1}/{auctionState.items.length})
        </h1>
        <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowDebug(true)} className="border-yellow-500 text-yellow-300 hover:bg-yellow-700 hover:text-white">
                Debug
            </Button>
            <Button variant="danger" onClick={onLeave} disabled={isLoading}>
                {VIETNAMESE.leaveButton || "Rời Đi"}
            </Button>
        </div>
      </header>

      <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left Panel: Auction Log */}
        <div className="md:w-3/5 lg:w-2/3 flex flex-col bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <h2 className="text-xl font-semibold text-cyan-300 p-3 border-b border-gray-600 flex-shrink-0">Diễn biến đấu giá</h2>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-3">
                {auctionState.auctioneerCommentary.map(entry => (
                    <div key={entry.id} className="text-sm text-cyan-200/90 italic border-l-2 border-cyan-700 pl-2">
                        {entry.text}
                    </div>
                ))}
                {isLoading && <div className="flex justify-center pt-4"><Spinner text={"Đang chờ diễn biến..."} /></div>}
                <div ref={commentaryEndRef} />
            </div>
        </div>

        {/* Right Panel: Item Details & Bidding */}
        <div className="md:w-2/5 lg:w-1/3 flex flex-col bg-gray-800 rounded-lg border-2 border-amber-500 shadow-xl p-4 overflow-y-auto custom-scrollbar">
            <div className="flex-shrink-0 pb-2 border-b border-gray-600">
                <h2 className="text-xl sm:text-2xl font-bold text-amber-300">{currentItem.name}</h2>
                <p className="text-sm text-gray-400 italic">{currentItem.rarity}</p>
                 {currentItem.ownerId === 'player' && <p className="text-xs text-green-400 bg-green-900/50 rounded-full px-2 py-0.5 inline-block mt-1">Vật phẩm của bạn</p>}
            </div>
            <div className="my-3 flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-3">
                <p className="text-sm text-gray-200 leading-relaxed">{currentItem.description}</p>
                {currentItem.category === GameTemplates.ItemCategory.EQUIPMENT && renderStatBonuses((currentItem as GameTemplates.EquipmentTemplate).statBonuses)}
                {currentItem.category === GameTemplates.ItemCategory.EQUIPMENT && (currentItem as GameTemplates.EquipmentTemplate).uniqueEffects.length > 0 &&
                    <div className="mt-2"><strong className="text-gray-300">Hiệu ứng đặc biệt:</strong> <span className="text-cyan-300 text-xs">{(currentItem as GameTemplates.EquipmentTemplate).uniqueEffects.join('; ')}</span></div>
                }
                {currentItem.category === GameTemplates.ItemCategory.POTION && (currentItem as GameTemplates.PotionTemplate).effects.length > 0 &&
                    <div className="mt-2"><strong className="text-gray-300">Công dụng:</strong> <span className="text-cyan-300 text-xs">{(currentItem as GameTemplates.PotionTemplate).effects.join('; ')}</span></div>
                }
            </div>
            <div className="flex-shrink-0 pt-3 border-t border-gray-600 space-y-3">
                 <div className="text-sm space-y-2">
                    <p><strong className="text-gray-400">{VIETNAMESE.startingPriceLabel}:</strong> {currentItem.startingPrice.toLocaleString()} {currencyName}</p>
                    <p><strong className="text-gray-400">{VIETNAMESE.currentBidLabel}:</strong> <span className="font-bold text-2xl text-amber-300">{currentItem.currentBid.toLocaleString()}</span> {currencyName}</p>
                    <p><strong className="text-gray-400">{VIETNAMESE.highestBidderLabel}:</strong> {getBidderName(currentItem.highestBidderId)}</p>
                </div>
                <div className="space-y-2">
                    <form onSubmit={handleBidSubmit}>
                        <InputField 
                            label={`${VIETNAMESE.yourBidLabel} (của bạn: ${playerStats.currency.toLocaleString()} ${currencyName})`}
                            id="bidAmount"
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={`> ${currentItem.currentBid}`}
                            min={currentItem.currentBid + 1}
                            disabled={isLoading}
                            className="mb-2"
                        />
                        <Button type="submit" className="w-full" disabled={isLoading || !bidAmount}>
                            {VIETNAMESE.placeBidButton}
                        </Button>
                    </form>
                    <div className="flex gap-2 pt-1">
                        <Button onClick={onAuctioneerCall} className="w-full" variant="secondary" disabled={isLoading} title="Bỏ qua chờ đợi, xem ngay diễn biến tiếp theo">
                            Bỏ qua chờ
                        </Button>
                        <Button onClick={onSkipItem} className="w-full" variant="secondary" disabled={isLoading} title="Bỏ qua vật phẩm này và chuyển sang vật phẩm tiếp theo">
                            Bỏ qua vật phẩm
                        </Button>
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

export default AuctionScreen;