// src/utils/eventUtils.ts
import { KnowledgeBase, GameMessage, WorldDate, GameEvent } from '../types';

const worldDateToTotalDays = (date: WorldDate): number => {
    return (date.year * 360) + ((date.month - 1) * 30) + date.day;
};

/**
 * Iterates through game events and updates their status based on the current game date.
 * @param kb The current KnowledgeBase.
 * @returns An object containing the updated KnowledgeBase and any system messages generated.
 */
export const updateGameEventsStatus = (kb: KnowledgeBase): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(kb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const currentDate = newKb.worldDate;
    const totalDaysCurrent = worldDateToTotalDays(currentDate);

    newKb.gameEvents.forEach((event: GameEvent) => {
        const totalDaysStart = worldDateToTotalDays(event.startDate);
        const totalDaysEnd = worldDateToTotalDays(event.endDate);
        const oldStatus = event.status;

        let newStatus = oldStatus;

        if (totalDaysCurrent < totalDaysStart) {
            newStatus = 'Sắp diễn ra';
        } else if (totalDaysCurrent >= totalDaysStart && totalDaysCurrent <= totalDaysEnd) {
            newStatus = 'Đang diễn ra';
        } else {
            newStatus = 'Đã kết thúc';
        }

        if (newStatus !== oldStatus) {
            event.status = newStatus;
            // Generate a notification only if the event becomes 'Ongoing' and was discovered by the player
            if (newStatus === 'Đang diễn ra' && event.isDiscovered) {
                systemMessages.push({
                    id: `event-started-${event.id}`,
                    type: 'system',
                    content: `Sự kiện "${event.title}" đã bắt đầu!`,
                    timestamp: Date.now(),
                    turnNumber: newKb.playerStats.turn
                });
            }
        }
    });

    return { updatedKb: newKb, systemMessages };
};