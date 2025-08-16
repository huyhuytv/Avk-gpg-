



import { KnowledgeBase, GameMessage, Item, AuctionItem, AuctionNPC } from '../../types';
import { VIETNAMESE } from '../../constants';
import { createItemFromParams } from './itemTagProcessor'; // Reusing the item creation helper

export const processAuctionItem = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];

    const baseItem = createItemFromParams(tagParams, currentKb);
    if (!baseItem) {
        console.warn("AUCTION_ITEM: Failed to create base item from params.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    if (!newKb.auctionState) {
        newKb.auctionState = { 
            isOpen: true, 
            items: [], 
            auctionNPCs: [], 
            auctioneerCommentary: [], 
            currentItemIndex: 0, 
            lastBidTime: Date.now(), 
            auctioneerCallCount: 0, 
            locationId: newKb.currentLocationId || '' 
        };
    }

    // Prices will be calculated and set by the system in `useAuctionActions` after all items are created.
    // We use placeholders here.
    const auctionItem: AuctionItem = {
        ...baseItem,
        startingPrice: 0,
        currentBid: 0,
        buyoutPrice: 0,
        highestBidderId: undefined, // Initially no bidder
    };

    newKb.auctionState.items.push(auctionItem);
    
    systemMessages.push({
        id: `auction-item-added-${auctionItem.id}`, type: 'system',
        content: `Vật phẩm đấu giá mới được thêm: ${auctionItem.name}.`,
        timestamp: Date.now(), turnNumber: turnForSystemMessages
    });

    return { updatedKb: newKb, systemMessages };
};


export const processNpcBid = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    
    const npcName = tagParams.npcName;
    const bidAmountStr = tagParams.bidAmount;
    const itemName = tagParams.itemName; // AI might specify which item is being bid on

    if (!newKb.auctionState || !newKb.auctionState.isOpen) {
        console.warn("NPC_BID: Received bid but auction is not active.");
        return { updatedKb: newKb, systemMessages };
    }

    // Find bidder in either temporary or permanent NPC list
    const tempNpc = newKb.auctionState.auctionNPCs.find(n => n.name === npcName);
    const permanentNpc = newKb.discoveredNPCs.find(n => n.name === npcName);
    const bidder = tempNpc || permanentNpc;

    if (!bidder) {
        console.warn(`NPC_BID: Bidding NPC "${npcName}" not found in either auction or discovered lists.`);
        return { updatedKb: newKb, systemMessages };
    }

    const bidAmount = parseInt(bidAmountStr, 10);
    if (isNaN(bidAmount)) {
        console.warn(`NPC_BID: Invalid bid amount "${bidAmountStr}".`);
        return { updatedKb: newKb, systemMessages };
    }
    
    // Find the item being bid on
    let itemToUpdate = itemName 
        ? newKb.auctionState.items.find(i => i.name === itemName)
        : newKb.auctionState.items[newKb.auctionState.currentItemIndex]; // Target the current item
    
    if (itemToUpdate && bidAmount > itemToUpdate.currentBid) {
        itemToUpdate.currentBid = bidAmount;
        itemToUpdate.highestBidderId = bidder.id; // Use the found bidder's ID
    } else {
        console.warn("NPC_BID: No item found to apply bid or bid is not higher.");
    }

    return { updatedKb: newKb, systemMessages };
};

export const processAuctionNpc = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];

    const name = tagParams.name;
    const realm = tagParams.realm;
    const currencyStr = tagParams.currency;

    if (!name || !realm || !currencyStr) {
        console.warn("AUCTION_NPC: Missing required parameters (name, realm, currency).", tagParams);
        return { updatedKb: newKb, systemMessages };
    }
    
    const currency = parseInt(currencyStr, 10);
    if (isNaN(currency)) {
        console.warn(`AUCTION_NPC: Invalid currency for NPC "${name}".`, tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    if (!newKb.auctionState) {
        newKb.auctionState = { 
            items: [], 
            auctionNPCs: [], 
            auctioneerCommentary: [], 
            currentItemIndex: 0, 
            lastBidTime: Date.now(), 
            auctioneerCallCount: 0, 
            isOpen: true, 
            locationId: newKb.currentLocationId || '' 
        };
    }
    
    if (!newKb.auctionState.auctionNPCs) {
        newKb.auctionState.auctionNPCs = [];
    }

    const newAuctionNpc: AuctionNPC = {
        id: `auction_npc-${name.replace(/\s+/g, '-')}-${Date.now()}`,
        name,
        realm,
        currency
    };

    newKb.auctionState.auctionNPCs.push(newAuctionNpc);
    
    systemMessages.push({
        id: `auction-npc-added-${newAuctionNpc.id}`, type: 'system',
        content: `NPC đấu giá tạm thời được thêm: ${name}.`,
        timestamp: Date.now(), turnNumber: turnForSystemMessages
    });

    return { updatedKb: newKb, systemMessages };
};
