

import { KnowledgeBase, GameLocation, GameMessage, NPC, Item } from '../types';
import { generateVendorRestock as generateVendorRestockPrompt, parseAiResponseText, generateVendorRestock } from '../services/geminiService';
import { createItemFromParams } from './tagProcessors/itemTagProcessor';
import { parseTagValue } from './parseTagValue';

export async function handleLocationEntryEvents(
    kb: KnowledgeBase,
    location: GameLocation,
    turn: number
): Promise<{ updatedKb: KnowledgeBase; systemMessages: GameMessage[] }> {
    const newKb = JSON.parse(JSON.stringify(kb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const currentYear = newKb.worldDate.year;

    // --- 1. Shop Restocking Logic ---
    const vendorsInLocation = newKb.discoveredNPCs.filter(npc =>
        npc.locationId === location.id &&
        (npc.vendorType === 'MarketStall' || npc.vendorType === 'SpecializedShop')
    );

    const vendorsToRestock = vendorsInLocation.filter(vendor =>
        currentYear > (vendor.lastRestockYear || 0)
    );

    if (vendorsToRestock.length > 0) {
        systemMessages.push({
            id: `restock-notice-${location.id}-${Date.now()}`,
            type: 'system',
            content: `Các cửa hàng tại ${location.name} đã được làm mới hàng hóa.`,
            timestamp: Date.now(),
            turnNumber: turn
        });

        for (const vendor of vendorsToRestock) {
            try {
                // Find the vendor in our mutable KB copy
                const vendorInKb = newKb.discoveredNPCs.find(n => n.id === vendor.id);
                if (!vendorInKb) continue;

                // Clear old inventory
                vendorInKb.shopInventory = [];

                // Generate new inventory
                const { response, rawText } = await generateVendorRestock(vendorInKb, newKb);
                
                // Manually process the [SHOP_ITEM] tags
                if (response.tags && response.tags.length > 0) {
                    for (const tag of response.tags) {
                        const mainMatch = tag.match(/\[(.*?):(.*)\]/s);
                        if (!mainMatch) continue;
                        
                        const tagName = mainMatch[1].trim().toUpperCase();
                        const rawTagParameterString = mainMatch[2] ? mainMatch[2].trim() : '';

                        if (tagName === 'SHOP_ITEM') {
                            const parsedParams = parseTagValue(rawTagParameterString);
                            if (parsedParams.parentId === vendorInKb.name) {
                                const newItem = createItemFromParams(parsedParams, newKb);
                                if (newItem) {
                                    if (!vendorInKb.shopInventory) vendorInKb.shopInventory = [];
                                    vendorInKb.shopInventory.push(newItem as Item);
                                }
                            }
                        }
                    }
                }
                
                // Update restock year
                vendorInKb.lastRestockYear = currentYear;
                
            } catch (error) {
                console.error(`Failed to restock vendor ${vendor.name}:`, error);
                systemMessages.push({
                    id: `restock-error-${vendor.id}-${Date.now()}`,
                    type: 'error',
                    content: `Lỗi khi làm mới hàng hóa cho ${vendor.name}.`,
                    timestamp: Date.now(),
                    turnNumber: turn
                });
            }
        }
    }

    return { updatedKb: newKb, systemMessages };
}