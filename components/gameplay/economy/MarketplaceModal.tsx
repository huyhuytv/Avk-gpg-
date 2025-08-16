
import React, { useState, useMemo } from 'react';
import { KnowledgeBase, NPC, Item as ItemType } from '../../../types';
import Modal from '../../ui/Modal';
import { VIETNAMESE } from '../../../constants';
import ItemEntry from './shared/ItemEntry';
import { useGame } from '../../../hooks/useGame'; // Import useGame

interface MarketplaceModalProps {
    knowledgeBase: KnowledgeBase;
    onClose: () => void;
    onBuyItem: (itemId: string, vendorId: string, quantity: number) => void;
    onSellItem: (itemId: string, vendorId: string, sellPrice: number, quantity: number) => void;
    locationId: string; // The ID of this specific marketplace location
}

const MarketplaceModal: React.FC<MarketplaceModalProps> = ({ knowledgeBase, onClose, onBuyItem, onSellItem, locationId }) => {
    const game = useGame(); // Use the game context
    const { discoveredNPCs, inventory, playerStats } = knowledgeBase;

    const vendorsInLocation = useMemo(() => {
        return discoveredNPCs.filter(npc => {
            if (npc.locationId !== locationId) {
                return false;
            }
            // Primary condition: Correct vendorType
            if (npc.vendorType === 'MarketStall') {
                return true;
            }
            // Fallback condition for older/buggy data:
            // If vendorType is missing, but the NPC has a shop inventory, treat them as a stall vendor.
            if (!npc.vendorType && Array.isArray(npc.shopInventory) && npc.shopInventory.length > 0) {
                return true;
            }
            return false;
        });
    }, [discoveredNPCs, locationId]);

    const [activeStallId, setActiveStallId] = useState<string | null>(vendorsInLocation[0]?.id || null);
    const [activeSubTab, setActiveSubTab] = useState<'buy' | 'sell'>('buy');
    
    const currencyName = knowledgeBase.worldConfig?.currencyName || "Tiền";
    const selectedVendor = vendorsInLocation.find(v => v.id === activeStallId);

    const itemsPlayerCanSellToVendor = useMemo(() => {
        if (!selectedVendor) return [];
        if (!selectedVendor.vendorBuysCategories || selectedVendor.vendorBuysCategories.length === 0) {
            // If vendor doesn't specify categories, assume they buy anything (common for marketplace stalls)
            return inventory;
        }
        return inventory.filter(item => selectedVendor.vendorBuysCategories!.includes(item.category));
    }, [inventory, selectedVendor]);

    const handleBuy = (item: ItemType, price: number) => {
        if (playerStats.currency >= price && activeStallId) {
            onBuyItem(item.id, activeStallId, 1); // Assuming buying one at a time for now
        } else {
            game.showNotification(VIETNAMESE.notEnoughMoney, 'error');
        }
    };
    
    const handleSell = (item: ItemType, price: number) => {
        if (activeStallId) {
            onSellItem(item.id, activeStallId, price, 1); // Assuming selling one at a time
        }
    };
    
    const handleStallTabClick = (stallId: string) => {
        setActiveStallId(stallId);
        setActiveSubTab('buy'); // Reset to buy tab on stall change
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={VIETNAMESE.marketplaceTitle}>
            <div className="h-full flex flex-col">
                <p className="text-right text-sm text-amber-300 mb-2">
                    {VIETNAMESE.yourWallet} {playerStats.currency.toLocaleString()} {currencyName}
                </p>
                
                <div className="flex border-b border-gray-600 mb-2 overflow-x-auto custom-scrollbar">
                    {vendorsInLocation.map(stall => (
                        <button 
                            key={stall.id}
                            onClick={() => handleStallTabClick(stall.id)}
                            className={`py-2 px-4 text-sm whitespace-nowrap ${activeStallId === stall.id ? 'text-amber-400 border-b-2 border-amber-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
                        >
                            {stall.name}
                        </button>
                    ))}
                </div>
                {selectedVendor?.vendorSlogan && (
                    <p className="text-center text-sm italic text-gray-400 my-2">"{selectedVendor.vendorSlogan}"</p>
                )}

                {selectedVendor ? (
                    <div className="flex flex-col flex-grow">
                         <div className="flex border-b border-gray-700 mb-2">
                                <button onClick={() => setActiveSubTab('buy')} className={`py-2 px-4 text-sm ${activeSubTab === 'buy' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400'}`}>
                                    {VIETNAMESE.buyTab}
                                </button>
                                <button onClick={() => setActiveSubTab('sell')} className={`py-2 px-4 text-sm ${activeSubTab === 'sell' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400'}`}>
                                    {VIETNAMESE.sellTab}
                                </button>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2">
                             {activeSubTab === 'buy' && (
                                (selectedVendor.shopInventory && selectedVendor.shopInventory.length > 0) ? selectedVendor.shopInventory.map(item => (
                                    <ItemEntry 
                                        key={item.id}
                                        item={item}
                                        price={item.value || 0}
                                        currencyName={currencyName}
                                        actionLabel={VIETNAMESE.buyButton}
                                        onAction={() => handleBuy(item, item.value || 0)}
                                        onItemClick={(item) => game.openEntityModal('item', item)}
                                        disabled={playerStats.currency < (item.value || 0)}
                                    />
                                )) : <p className="text-gray-400 italic">Sạp hàng này không có gì để bán.</p>
                             )}
                              {activeSubTab === 'sell' && (
                                <>
                                {selectedVendor && selectedVendor.vendorBuysCategories && selectedVendor.vendorBuysCategories.length > 0 && (
                                    <div className="text-xs text-center text-cyan-300 bg-cyan-900/30 p-2 rounded-md mb-3 border border-cyan-700">
                                        <strong>{VIETNAMESE.vendorBuysLabel || "Chuyên thu mua:"}</strong> {selectedVendor.vendorBuysCategories.map(cat => VIETNAMESE[`itemCategory_${cat}`] || cat).join(', ')}
                                    </div>
                                )}
                                {itemsPlayerCanSellToVendor.length > 0 ? itemsPlayerCanSellToVendor.map(item => {
                                    const sellPrice = Math.floor((item.value || 0) * 0.7); // Sell for 70% of value
                                    return (
                                        <ItemEntry 
                                            key={item.id}
                                            item={item}
                                            price={sellPrice}
                                            currencyName={currencyName}
                                            actionLabel={VIETNAMESE.sellButton}
                                            onAction={() => handleSell(item, sellPrice)}
                                            onItemClick={(item) => game.openEntityModal('item', item)}
                                        />
                                    )
                                }) : <p className="text-gray-400 italic">Bạn không có vật phẩm nào mà sạp hàng này quan tâm.</p>}
                                </>
                             )}
                        </div>
                    </div>
                ) : <p className="text-gray-400 italic text-center py-8">Không có sạp hàng nào ở đây.</p>}
            </div>
        </Modal>
    );
};

export default MarketplaceModal;
