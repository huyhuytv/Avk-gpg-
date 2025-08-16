import { useCallback } from 'react';
import { KnowledgeBase, GameMessage, GameScreen, Item, AuctionItem, AuctionCommentaryEntry, Item as ItemType } from '../../types';
import { generateAuctionData, runAuctionTurn, runAuctioneerCall } from '../../services/geminiService';
import { performTagProcessing, calculateItemValue } from '../../utils/gameLogicUtils';
import { VIETNAMESE } from '../../constants';

interface UseAuctionActionsProps {
  knowledgeBase: KnowledgeBase;
  setKnowledgeBase: React.Dispatch<React.SetStateAction<KnowledgeBase>>;
  isLoadingApi: boolean;
  setIsLoadingApi: React.Dispatch<React.SetStateAction<boolean>>;
  resetApiError: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  setCurrentScreen: (screen: GameScreen) => void;
  setSentEconomyPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedEconomyResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  logNpcAvatarPromptCallback?: (prompt: string) => void;
  setApiErrorWithTimeout: (message: string | null) => void;
  addMessageAndUpdateState: (newMessages: GameMessage[], newKnowledgeBase: KnowledgeBase, callback?: () => void) => void;
}

export const useAuctionActions = ({
    knowledgeBase,
    setKnowledgeBase,
    isLoadingApi,
    setIsLoadingApi,
    resetApiError,
    showNotification,
    setCurrentScreen,
    setSentEconomyPromptsLog,
    setReceivedEconomyResponsesLog,
    logNpcAvatarPromptCallback,
    setApiErrorWithTimeout,
    addMessageAndUpdateState,
}: UseAuctionActionsProps) => {

    const handleStartAuction = useCallback(async (locationId: string, playerItemIds: string[] = []) => {
        setIsLoadingApi(true);
        resetApiError();
        showNotification("Đang chuẩn bị phiên đấu giá...", 'info');
        
        let workingKb = JSON.parse(JSON.stringify(knowledgeBase));
        
        const playerAuctionItems: AuctionItem[] = [];
        if (playerItemIds.length > 0) {
            playerItemIds.forEach(itemId => {
                const item = workingKb.inventory.find((i: ItemType) => i.id === itemId);
                if (item) {
                    const itemValue = calculateItemValue(item, workingKb.realmProgressionList);
                    const playerAuctionItem: AuctionItem = {
                        ...item,
                        ownerId: 'player', 
                        startingPrice: Math.floor(itemValue * 0.5),
                        currentBid: Math.floor(itemValue * 0.5),
                        buyoutPrice: Math.floor(itemValue * 2.5),
                        highestBidderId: undefined,
                    };
                    playerAuctionItems.push(playerAuctionItem);
                }
            });
        }

        workingKb.auctionState = {
            isOpen: true,
            items: [],
            auctionNPCs: [],
            currentItemIndex: 0,
            auctioneerCommentary: [],
            lastBidTime: Date.now(),
            auctioneerCallCount: 0,
            locationId: locationId,
        };

        try {
            const { response, rawText } = await generateAuctionData(
                workingKb,
                (prompt) => setSentEconomyPromptsLog(prev => [prompt, ...prev].slice(0, 10))
            );
            setReceivedEconomyResponsesLog(prev => [rawText, ...prev].slice(0, 10));

            const { newKb, systemMessagesFromTags } = await performTagProcessing(
                workingKb, 
                response.tags, 
                workingKb.playerStats.turn, 
                setKnowledgeBase, 
                logNpcAvatarPromptCallback
            );
            
            workingKb = newKb;
            
            if (workingKb.auctionState) {
                workingKb.auctionState.items.push(...playerAuctionItems);
                workingKb.auctionState.items.sort(() => Math.random() - 0.5); // Shuffle all items
            }

            if (workingKb.auctionState && workingKb.auctionState.items) {
                workingKb.auctionState.items.forEach((item: AuctionItem) => {
                    if (item.ownerId !== 'player') { // Only set prices for AI items
                        const itemValue = item.value || 0;
                        item.startingPrice = Math.floor(itemValue * 0.5);
                        item.currentBid = item.startingPrice;
                        item.buyoutPrice = Math.floor(itemValue * 2.5);
                    }
                });
            }

            if(response.systemMessage) {
                 workingKb.auctionState!.auctioneerCommentary.push({ id: Date.now().toString(), text: response.systemMessage, timestamp: Date.now() });
            }
            
            setKnowledgeBase(workingKb);
            setCurrentScreen(GameScreen.Auction);

        } catch (error) {
            const errorMsg = `Lỗi chuẩn bị đấu giá: ${error instanceof Error ? error.message : String(error)}`;
            setApiErrorWithTimeout(errorMsg);
            setKnowledgeBase(prev => ({...prev, auctionState: null}));
        } finally {
            setIsLoadingApi(false);
        }
    }, [knowledgeBase, setKnowledgeBase, showNotification, setCurrentScreen, setSentEconomyPromptsLog, setReceivedEconomyResponsesLog, logNpcAvatarPromptCallback, setApiErrorWithTimeout, resetApiError, setIsLoadingApi]);

    const handlePlayerAuctionAction = useCallback(async (itemId: string, bidAmount: number) => {
        setIsLoadingApi(true);
        resetApiError();

        const item = knowledgeBase.auctionState?.items.find(i => i.id === itemId);
        if (!item) {
            showNotification("Lỗi: Vật phẩm đấu giá không tồn tại.", 'error');
            setIsLoadingApi(false);
            return;
        }
        
        let workingKb = JSON.parse(JSON.stringify(knowledgeBase));
        
        if (workingKb.auctionState) {
            const itemIndex = workingKb.auctionState.items.findIndex((i: any) => i.id === itemId);
            if (itemIndex > -1) {
                workingKb.auctionState.items[itemIndex].currentBid = bidAmount;
                workingKb.auctionState.items[itemIndex].highestBidderId = 'player';
            }
            workingKb.auctionState.lastBidTime = Date.now();
            workingKb.auctionState.auctioneerCallCount = 0;
            const newCommentary: AuctionCommentaryEntry = {id: Date.now().toString(), text: `Bạn đã ra giá ${bidAmount.toLocaleString()}... Chờ phản hồi...`, timestamp: Date.now()};
            workingKb.auctionState.auctioneerCommentary.push(newCommentary);
        }
        setKnowledgeBase(workingKb);

        try {
            const { response, rawText } = await runAuctionTurn(workingKb, item, bidAmount,
                (prompt) => setSentEconomyPromptsLog(prev => [prompt, ...prev].slice(0, 10))
            );
            setReceivedEconomyResponsesLog(prev => [rawText, ...prev].slice(0, 10));

            const { newKb } = await performTagProcessing(
                workingKb, 
                response.tags, 
                workingKb.playerStats.turn, 
                setKnowledgeBase,
                logNpcAvatarPromptCallback
            );
            workingKb = newKb;

            if (response.systemMessage) {
                workingKb.auctionState!.auctioneerCommentary.push({id: Date.now().toString(), text: response.systemMessage, timestamp: Date.now()});
            }
            
            if (response.tags.some(t => t.toUpperCase().startsWith('[NPC_BID'))) {
                workingKb.auctionState.lastBidTime = Date.now();
                workingKb.auctionState.auctioneerCallCount = 0;
            }
            
            setKnowledgeBase(workingKb);

        } catch (error) {
             const errorMsg = `Lỗi trong lượt đấu giá: ${error instanceof Error ? error.message : String(error)}`;
             setApiErrorWithTimeout(errorMsg);
        } finally {
            setIsLoadingApi(false);
        }

    }, [knowledgeBase, setKnowledgeBase, showNotification, setApiErrorWithTimeout, setIsLoadingApi, setSentEconomyPromptsLog, setReceivedEconomyResponsesLog, logNpcAvatarPromptCallback, resetApiError]);

    const handleAuctioneerCall = useCallback(async () => {
        if (isLoadingApi || !knowledgeBase.auctionState || !knowledgeBase.auctionState.isOpen) return;
    
        setIsLoadingApi(true);
        const { items, currentItemIndex, auctioneerCallCount } = knowledgeBase.auctionState;
        const currentItem = items[currentItemIndex];
        let workingKb = JSON.parse(JSON.stringify(knowledgeBase));
    
        const newCallCount = auctioneerCallCount + 1;
    
        if (newCallCount > 3) {
            const winnerId = currentItem.highestBidderId;
            const finalPrice = currentItem.currentBid;
            let systemMessageContent = "";
            const isPlayerOwner = currentItem.ownerId === 'player';
            const currencyName = workingKb.worldConfig?.currencyName || "Tiền";
    
            if (winnerId === 'player') {
                if (isPlayerOwner) {
                    const fee = Math.floor(finalPrice * 0.15);
                    if (workingKb.playerStats.currency >= fee) {
                        workingKb.playerStats.currency -= fee;
                        systemMessageContent = `Bạn đã mua lại vật phẩm của chính mình "${currentItem.name}" với giá ${finalPrice.toLocaleString()} ${currencyName}. Bạn đã trả một khoản phí 15% là ${fee.toLocaleString()} ${currencyName}.`;
                        showNotification(systemMessageContent, 'warning');
                    } else {
                        const itemIndex = workingKb.inventory.findIndex((i: ItemType) => i.id === currentItem.id);
                        if (itemIndex > -1) workingKb.inventory.splice(itemIndex, 1);
                        systemMessageContent = `Bạn đã thắng đấu giá vật phẩm của mình nhưng không đủ tiền trả phí! Nhà đấu giá đã tịch thu vật phẩm "${currentItem.name}".`;
                        showNotification(systemMessageContent, 'error');
                    }
                } else {
                    if (workingKb.playerStats.currency >= finalPrice) {
                        workingKb.playerStats.currency -= finalPrice;
                        const { startingPrice, currentBid, buyoutPrice, highestBidderId, ownerId, ...baseItem } = currentItem;
                        const newItemForInventory: Item = { ...baseItem, id: `item-${baseItem.name.replace(/\s/g, '-')}-${Date.now()}`};
                        const existingInvItem = workingKb.inventory.find((i: ItemType) => i.name === newItemForInventory.name && i.stackable !== false);
                        if (existingInvItem) {
                            existingInvItem.quantity += newItemForInventory.quantity;
                        } else {
                            workingKb.inventory.push(newItemForInventory);
                        }
                        systemMessageContent = `Chúc mừng! Bạn đã thắng đấu giá vật phẩm ${currentItem.name} với giá ${finalPrice.toLocaleString()} ${currencyName}.`;
                        showNotification(systemMessageContent, 'success');
                    } else {
                         systemMessageContent = `Bạn không đủ tiền để mua ${currentItem.name}. Vật phẩm được bán cho người trả giá cao thứ hai (nếu có) hoặc được giữ lại.`;
                         showNotification(systemMessageContent, 'error');
                    }
                }
            } else if (winnerId) { // An NPC won
                const winnerName = workingKb.auctionState?.auctionNPCs.find((n: any) => n.id === winnerId)?.name || workingKb.discoveredNPCs.find((n: any) => n.id === winnerId)?.name || 'một người mua bí ẩn';
                if (isPlayerOwner) {
                    const profit = Math.floor(finalPrice * 0.85);
                    workingKb.playerStats.currency += profit;
                    const itemIndex = workingKb.inventory.findIndex((i: ItemType) => i.id === currentItem.id);
                    if (itemIndex > -1) workingKb.inventory.splice(itemIndex, 1);
                    systemMessageContent = `Vật phẩm của bạn, "${currentItem.name}", đã được bán cho ${winnerName} với giá ${finalPrice.toLocaleString()} ${currencyName}. Sau khi trừ phí, bạn nhận được ${profit.toLocaleString()} ${currencyName}.`;
                    showNotification(systemMessageContent, 'success');
                } else {
                    systemMessageContent = `Vật phẩm ${currentItem.name} đã được bán cho ${winnerName} với giá ${finalPrice.toLocaleString()} ${currencyName}.`;
                    showNotification(systemMessageContent, 'info');
                }
            } else { // No bids
                if (isPlayerOwner) {
                     systemMessageContent = `Không ai trả giá cho vật phẩm "${currentItem.name}" của bạn. Vật phẩm được trả lại cho bạn.`;
                } else {
                     systemMessageContent = `Không ai trả giá cho ${currentItem.name}. Vật phẩm bị thu hồi.`
                }
                showNotification(systemMessageContent, 'info');
            }
            
            const nextItemIndex = currentItemIndex + 1;
            if (nextItemIndex >= items.length) {
                workingKb.auctionState.isOpen = false;
                workingKb.auctionState.auctioneerCommentary.push({id: Date.now().toString(), text: "Phiên đấu giá đã kết thúc! Cảm ơn quý vị đã tham gia.", timestamp: Date.now()});
            } else {
                workingKb.auctionState.currentItemIndex = nextItemIndex;
                workingKb.auctionState.auctioneerCallCount = 0;
                workingKb.auctionState.lastBidTime = Date.now();
                workingKb.auctionState.auctioneerCommentary.push({id: Date.now().toString(), text: `Tiếp theo là vật phẩm: ${items[nextItemIndex].name}!`, timestamp: Date.now()});
            }
            
            setKnowledgeBase(workingKb); 
            addMessageAndUpdateState([{
                id: `auction-sold-${currentItem.id}`,
                type: 'system',
                content: systemMessageContent,
                timestamp: Date.now(),
                turnNumber: workingKb.playerStats.turn
            }], workingKb);
    
            setIsLoadingApi(false);
            return;
        }
    
        const onPromptConstructedForLog = (prompt: string) => {
            setSentEconomyPromptsLog(prev => [prompt, ...prev].slice(0, 10));
        };

        workingKb.auctionState.auctioneerCallCount = newCallCount;
        setKnowledgeBase(workingKb);
    
        try {
            const { response, rawText } = await runAuctioneerCall(workingKb, currentItem, newCallCount, onPromptConstructedForLog);
            setReceivedEconomyResponsesLog(prev => [rawText, ...prev].slice(0,10));
    
            const { newKb: kbAfterTags, systemMessagesFromTags } = await performTagProcessing(
                workingKb,
                response.tags,
                workingKb.playerStats.turn,
                setKnowledgeBase,
                logNpcAvatarPromptCallback
            );
            workingKb = kbAfterTags;
            
            if (response.tags.some(t => t.toUpperCase().startsWith('[NPC_BID'))) {
                workingKb.auctionState.lastBidTime = Date.now();
                workingKb.auctionState.auctioneerCallCount = 0;
            }
    
            if (response.systemMessage) {
                workingKb.auctionState.auctioneerCommentary.push({id: Date.now().toString(), text: response.systemMessage, timestamp: Date.now()});
            } else {
                workingKb.auctionState.auctioneerCommentary.push({id: Date.now().toString(), text: `Đấu giá sư hô giá lần thứ ${newCallCount}...`, timestamp: Date.now()});
            }
            
            if (systemMessagesFromTags.length > 0) {
                addMessageAndUpdateState(systemMessagesFromTags, workingKb);
            } else {
                setKnowledgeBase(workingKb);
            }
    
        } catch (error) {
             const errorMsg = `Lỗi trong lượt gọi giá của đấu giá sư: ${error instanceof Error ? error.message : String(error)}`;
             setApiErrorWithTimeout(errorMsg);
        } finally {
            setIsLoadingApi(false);
        }
    }, [knowledgeBase, addMessageAndUpdateState, setKnowledgeBase, showNotification, setApiErrorWithTimeout, setIsLoadingApi, setReceivedEconomyResponsesLog, logNpcAvatarPromptCallback, setSentEconomyPromptsLog, isLoadingApi]);
  
    const handleSkipAuctionItem = useCallback(async () => {
        if (isLoadingApi || !knowledgeBase.auctionState || !knowledgeBase.auctionState.isOpen) return;

        setIsLoadingApi(true);

        let workingKb = JSON.parse(JSON.stringify(knowledgeBase)) as KnowledgeBase;
        const { items, currentItemIndex } = workingKb.auctionState!;
        const nextItemIndex = currentItemIndex + 1;

        let systemMessageContent = `Bạn đã bỏ qua vật phẩm "${items[currentItemIndex].name}".`;

        if (nextItemIndex >= items.length) {
            // End of auction
            workingKb.auctionState!.isOpen = false;
            workingKb.auctionState!.auctioneerCommentary.push({ id: Date.now().toString(), text: "Phiên đấu giá đã kết thúc! Cảm ơn quý vị đã tham gia.", timestamp: Date.now() });
            systemMessageContent += " Đây là vật phẩm cuối cùng, phiên đấu giá kết thúc.";
        } else {
            // Move to next item
            workingKb.auctionState!.currentItemIndex = nextItemIndex;
            workingKb.auctionState!.auctioneerCallCount = 0;
            workingKb.auctionState!.lastBidTime = Date.now();
            const nextItem = items[nextItemIndex];
            const commentaryText = `Bỏ qua vật phẩm trước. Tiếp theo là: ${nextItem.name}! Giá khởi điểm ${nextItem.startingPrice.toLocaleString()} ${workingKb.worldConfig?.currencyName || "Tiền"}.`;
            workingKb.auctionState!.auctioneerCommentary.push({ id: Date.now().toString(), text: commentaryText, timestamp: Date.now() });
            systemMessageContent += ` Chuyển sang vật phẩm tiếp theo: ${nextItem.name}.`;
        }
        
        setKnowledgeBase(workingKb); 
        addMessageAndUpdateState([{
            id: `auction-skipped-${items[currentItemIndex].id}`,
            type: 'system',
            content: systemMessageContent,
            timestamp: Date.now(),
            turnNumber: workingKb.playerStats.turn
        }], workingKb);

        setIsLoadingApi(false);

    }, [knowledgeBase, setKnowledgeBase, addMessageAndUpdateState, setIsLoadingApi, isLoadingApi]);
  
  return {
    handleStartAuction,
    handlePlayerAuctionAction,
    handleAuctioneerCall,
    handleSkipAuctionItem,
  };
};
