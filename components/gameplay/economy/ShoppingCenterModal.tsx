
import React, { useState, useMemo } from 'react';
import { KnowledgeBase, NPC, Item as ItemType } from '../../../types';
import Modal from '../../ui/Modal';
import { VIETNAMESE } from '../../../constants';
import ItemEntry from './shared/ItemEntry';
import { useGame } from '../../../hooks/useGame';

interface ShoppingCenterModalProps {
    knowledgeBase: KnowledgeBase;
    onClose: () => void;
    onBuyItem: (itemId: string, vendorId: string, quantity: number) => void;
    onSellItem: (itemId: string, vendorId: string, sellPrice: number, quantity: number) => void;
    locationId: string; // The ID of this specific shopping center location
}

const ShoppingCenterModal: React.FC<ShoppingCenterModalProps> = ({ knowledgeBase, onClose, onBuyItem, onSellItem, locationId }) => {
    const game = useGame();
    const { discoveredNPCs, inventory, playerStats } = knowledgeBase;
    
    const shopsInLocation = useMemo(() => {
        return discoveredNPCs.filter(npc => {
            if (npc.locationId !== locationId) {
                return false;
            }
            // Primary condition: Correct vendorType
            if (npc.vendorType === 'SpecializedShop') {
                return true;
            }
            // Fallback condition for older/buggy data:
            // If vendorType is missing, but the NPC has a shop inventory, treat them as a shop.
            if (!npc.vendorType && Array.isArray(npc.shopInventory) && npc.shopInventory.length > 0) {
                return true;
            }
            return false;
        });
    }, [discoveredNPCs, locationId]);

    const [activeShopId, setActiveShopId] = useState<string | null>(shopsInLocation[0]?.id || null);
    const [activeSubTab, setActiveSubTab] = useState<'buy' | 'sell'>('buy');

    const currencyName = knowledgeBase.worldConfig?.currencyName || "Tiền";
    const selectedShop = shopsInLocation.find(s => s.id === activeShopId);
    
    const handleBuy = (item: ItemType, price: number) => {
        if (playerStats.currency >= price && activeShopId) {
            onBuyItem(item.id, activeShopId, 1);
        } else {
            game.showNotification(VIETNAMESE.notEnoughMoney, 'error');
        }
    };
    
    const handleSell = (item: ItemType, price: number) => {
        if (activeShopId) {
            onSellItem(item.id, activeShopId, price, 1);
        }
    };

    const handleShopTabClick = (shopId: string) => {
        setActiveShopId(shopId);
        setActiveSubTab('buy'); // Reset to buy tab on shop change
    };
    
    const itemsPlayerCanSellToShop = useMemo(() => {
        if (!selectedShop || !selectedShop.vendorBuysCategories) {
            return []; // Shop doesn't buy anything
        }
        return inventory.filter(item => selectedShop.vendorBuysCategories!.includes(item.category));
    }, [inventory, selectedShop]);


    return (
        <Modal isOpen={true} onClose={onClose} title={VIETNAMESE.shoppingCenterTitle}>
             <div className="h-full flex flex-col">
                 <p className="text-right text-sm text-amber-300 mb-2">
                    {VIETNAMESE.yourWallet} {playerStats.currency.toLocaleString()} {currencyName}
                </p>
                <div className="flex border-b border-gray-600 mb-2 overflow-x-auto custom-scrollbar">
                    {shopsInLocation.map(shop => (
                        <button 
                            key={shop.id}
                            onClick={() => handleShopTabClick(shop.id)}
                            className={`py-2 px-4 text-sm whitespace-nowrap ${activeShopId === shop.id ? 'text-amber-400 border-b-2 border-amber-400 font-semibold' : 'text-gray-400 hover:text-white'}`}
                        >
                            {shop.name}
                        </button>
                    ))}
                </div>
                {selectedShop?.vendorSlogan && (
                    <p className="text-center text-sm italic text-gray-400 my-2">"{selectedShop.vendorSlogan}"</p>
                )}

                {selectedShop ? (
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
                                (selectedShop.shopInventory && selectedShop.shopInventory.length > 0) ? selectedShop.shopInventory.map(item => (
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
                                )) : <p className="text-gray-400 italic">Cửa hàng này hiện không có mặt hàng nào.</p>
                             )}
                              {activeSubTab === 'sell' && (
                                <>
                                {selectedShop && selectedShop.vendorBuysCategories && selectedShop.vendorBuysCategories.length > 0 && (
                                    <div className="text-xs text-center text-cyan-300 bg-cyan-900/30 p-2 rounded-md mb-3 border border-cyan-700">
                                        <strong>{VIETNAMESE.vendorBuysLabel || "Chuyên thu mua:"}</strong> {selectedShop.vendorBuysCategories.map(cat => VIETNAMESE[`itemCategory_${cat}`] || cat).join(', ')}
                                    </div>
                                )}
                                {itemsPlayerCanSellToShop.length > 0 ? itemsPlayerCanSellToShop.map(item => {
                                    const sellPrice = Math.floor((item.value || 0) * 0.9); // Sell for 90% of value in specialized shop
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
                                }) : <p className="text-gray-400 italic">Bạn không có vật phẩm nào mà cửa hàng này quan tâm.</p>}
                                </>
                             )}
                        </div>
                    </div>
                ) : <p className="text-gray-400 italic text-center py-8">Không có cửa hàng nào ở đây.</p>}
             </div>
        </Modal>
    );
};

export default ShoppingCenterModal;
