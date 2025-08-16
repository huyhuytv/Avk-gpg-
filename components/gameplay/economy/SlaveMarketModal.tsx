import React, { useState, useMemo } from 'react';
import { KnowledgeBase, Slave, NPC } from '../../../types';
import Modal from '../../ui/Modal';
import { VIETNAMESE } from '../../../constants';
import Button from '../../ui/Button';
import { useGame } from '../../../hooks/useGame';
import { getDeterministicAvatarSrc } from '../../../utils/avatarUtils';
import { calculateSlaveValue } from '../../../utils/gameLogicUtils';

interface SlaveEntryProps {
  slave: Slave;
  price: number;
  currencyName: string;
  actionLabel: string;
  onAction: () => void;
  onSlaveClick: (slave: Slave) => void;
  disabled?: boolean;
}

const SlaveEntry: React.FC<SlaveEntryProps> = ({ slave, price, currencyName, actionLabel, onAction, onSlaveClick, disabled }) => {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/80 transition-colors duration-150">
      <div 
        className="flex-grow cursor-pointer flex items-center gap-3"
        onClick={() => onSlaveClick(slave)}
        title={`Xem chi tiết ${slave.name}`}
      >
        <img src={getDeterministicAvatarSrc(slave)} alt={slave.name} className="w-10 h-10 rounded-full object-cover border border-gray-600"/>
        <div>
            <p className="font-semibold text-indigo-300">{slave.name}</p>
            <p className="text-xs text-gray-400">{slave.realm} - Tư chất: {slave.tuChat}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3 flex-shrink-0">
        <p className="text-sm font-semibold text-amber-400">{price.toLocaleString()} {currencyName}</p>
        <Button 
            size="sm" 
            variant="primary" 
            onClick={onAction} 
            className="text-xs"
            disabled={disabled}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};


interface SlaveMarketModalProps {
    knowledgeBase: KnowledgeBase;
    onClose: () => void;
    onBuySlave: (slave: Slave, vendorId: string) => void;
    locationId: string;
}

const SlaveMarketModal: React.FC<SlaveMarketModalProps> = ({ knowledgeBase, onClose, onBuySlave, locationId }) => {
    const game = useGame();
    const { discoveredNPCs, playerStats, slaves } = knowledgeBase;

    const slaveTraders = useMemo(() => {
        return discoveredNPCs.filter(npc => 
            npc.locationId === locationId && npc.vendorType === 'SlaveTrader'
        );
    }, [discoveredNPCs, locationId]);

    const [activeTraderId, setActiveTraderId] = useState<string | null>(slaveTraders[0]?.id || null);
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
    
    const currencyName = knowledgeBase.worldConfig?.currencyName || "Tiền";
    const selectedTrader = slaveTraders.find(v => v.id === activeTraderId);

    const handleBuy = (slave: Slave) => {
        if (playerStats.currency >= (slave.value || 0) && activeTraderId) {
            onBuySlave(slave, activeTraderId);
        } else {
            game.showNotification(VIETNAMESE.notEnoughMoney, 'error');
        }
    };
    
    const handleSell = (slave: Slave) => {
        if(activeTraderId) {
            game.handleSellSlave(slave.id, activeTraderId);
        }
    }

    const handleTraderTabClick = (traderId: string) => {
        setActiveTraderId(traderId);
        setActiveTab('buy'); // Reset to buy tab on trader change
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={VIETNAMESE.slaveMarketTitle || 'Chợ Nô Lệ'}>
            <div className="h-full flex flex-col min-h-[50vh]">
                <p className="text-right text-sm text-amber-300 mb-2">
                    {VIETNAMESE.yourWallet} {playerStats.currency.toLocaleString()} {currencyName}
                </p>
                
                <div className="flex border-b border-gray-600 mb-2 overflow-x-auto custom-scrollbar">
                    {slaveTraders.map(trader => (
                        <button 
                            key={trader.id}
                            onClick={() => handleTraderTabClick(trader.id)}
                            className={`py-2 px-4 text-sm whitespace-nowrap ${activeTraderId === trader.id ? 'text-amber-400 border-b-2 border-amber-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
                        >
                            {trader.name}
                        </button>
                    ))}
                </div>
                {selectedTrader?.vendorSlogan && (
                    <p className="text-center text-sm italic text-gray-400 my-2">"{selectedTrader.vendorSlogan}"</p>
                )}

                {selectedTrader ? (
                    <div className="flex flex-col flex-grow">
                         <div className="flex border-b border-gray-700 mb-2">
                                <button onClick={() => setActiveTab('buy')} className={`py-2 px-4 text-sm ${activeTab === 'buy' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400'}`}>
                                    {VIETNAMESE.buyTab}
                                </button>
                                <button onClick={() => setActiveTab('sell')} className={`py-2 px-4 text-sm ${activeTab === 'sell' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400'}`}>
                                    {VIETNAMESE.sellTab}
                                </button>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2">
                             {activeTab === 'buy' && (
                                (selectedTrader.slavesForSale && selectedTrader.slavesForSale.length > 0) ? selectedTrader.slavesForSale.map(slave => (
                                    <SlaveEntry 
                                        key={slave.id}
                                        slave={slave}
                                        price={slave.value || 0}
                                        currencyName={currencyName}
                                        actionLabel={VIETNAMESE.buyButton}
                                        onAction={() => handleBuy(slave)}
                                        onSlaveClick={(slave) => game.openEntityModal('slave', slave)}
                                        disabled={playerStats.currency < (slave.value || 0)}
                                    />
                                )) : <p className="text-gray-400 italic">Thương nhân này không có nô lệ nào để bán.</p>
                             )}
                              {activeTab === 'sell' && (
                                slaves.length > 0 ? slaves.map(slave => {
                                    const slaveRaceSystem = knowledgeBase.worldConfig?.raceCultivationSystems.find(rs => rs.raceName === slave.race)?.realmSystem || knowledgeBase.realmProgressionList.join(' - ');
                                    const slaveRealmProgression = slaveRaceSystem.split(' - ').map(s => s.trim());
                                    const calculatedValue = calculateSlaveValue(slave, slaveRealmProgression);
                                    const sellPrice = Math.floor(calculatedValue * 0.8);
                                    return (
                                        <SlaveEntry 
                                            key={slave.id}
                                            slave={slave}
                                            price={sellPrice}
                                            currencyName={currencyName}
                                            actionLabel={VIETNAMESE.sellButton}
                                            onAction={() => handleSell(slave)}
                                            onSlaveClick={(slave) => game.openEntityModal('slave', slave)}
                                        />
                                    )
                                }) : <p className="text-gray-400 italic">Bạn không có nô lệ nào để bán.</p>
                             )}
                        </div>
                    </div>
                ) : <p className="text-gray-400 italic text-center py-8">Không có thương nhân nô lệ nào ở đây.</p>}
            </div>
        </Modal>
    );
};

export default SlaveMarketModal;