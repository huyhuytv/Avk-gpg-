import { KnowledgeBase, GameMessage } from '../../types';

export const processChangeTime = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];

    const daysToAdd = parseInt(tagParams.ngay || "0", 10);
    const monthsToAdd = parseInt(tagParams.thang || "0", 10);
    const yearsToAdd = parseInt(tagParams.nam || "0", 10);
    const hoursToAdd = parseInt(tagParams.gio || "0", 10);
    const minutesToAdd = parseInt(tagParams.phut || "0", 10);

    if (isNaN(daysToAdd) || isNaN(monthsToAdd) || isNaN(yearsToAdd) || isNaN(hoursToAdd) || isNaN(minutesToAdd) || (daysToAdd <= 0 && monthsToAdd <= 0 && yearsToAdd <= 0 && hoursToAdd <= 0 && minutesToAdd <= 0)) {
        console.warn("CHANGE_TIME: Invalid or no time change specified.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    let { day, month, year, hour, minute } = newKb.worldDate;

    // --- Calculate total minutes passed for lifespan reduction ---
    let totalMinutesPassed = minutesToAdd + (hoursToAdd * 60) + (daysToAdd * 24 * 60) + (monthsToAdd * 30 * 24 * 60) + (yearsToAdd * 360 * 24 * 60);
    
    if (totalMinutesPassed <= 0) {
        return { updatedKb: newKb, systemMessages }; // No time actually passed
    }

    // --- Update date and time ---
    minute += minutesToAdd;
    hour += hoursToAdd + Math.floor(minute / 60);
    minute %= 60;

    day += daysToAdd + Math.floor(hour / 24);
    hour %= 24;
    
    month += monthsToAdd;
    year += yearsToAdd;

    // Normalize date (handle overflows)
    while (day > 30) {
        day -= 30;
        month += 1;
    }
    while (month > 12) {
        month -= 12;
        year += 1;
    }
    
    newKb.worldDate = { day, month, year, hour, minute };

    // --- Lifespan Reduction ---
    const daysPassedForLifespan = totalMinutesPassed / (24 * 60);
    if (daysPassedForLifespan > 0) {
        const yearsPassed = daysPassedForLifespan / 360.0;
        
        // Player
        if (newKb.playerStats.thoNguyen !== undefined) {
            newKb.playerStats.thoNguyen -= yearsPassed;
            if (newKb.playerStats.thoNguyen <= 0) {
                newKb.playerStats.thoNguyen = 0;
                systemMessages.push({ id: `player-lifespan-depleted-${Date.now()}`, type: 'error', content: `Thọ nguyên đã cạn! Sinh mệnh của bạn đã đến hồi kết.`, timestamp: Date.now(), turnNumber: turnForSystemMessages });
            }
        }
        // NPCs, Wives, Slaves, Prisoners...
        [...newKb.discoveredNPCs, ...newKb.wives, ...newKb.slaves, ...newKb.prisoners].forEach(char => {
            if (char.stats?.thoNguyen !== undefined) {
                char.stats.thoNguyen -= yearsPassed;
                if (char.stats.thoNguyen <= 0) {
                    char.stats.thoNguyen = 0;
                }
            }
        });
    }

    // --- Generate System Message ---
    const timePassedParts: string[] = [];
    if (yearsToAdd > 0) timePassedParts.push(`${yearsToAdd} năm`);
    if (monthsToAdd > 0) timePassedParts.push(`${monthsToAdd} tháng`);
    if (daysToAdd > 0) timePassedParts.push(`${daysToAdd} ngày`);
    if (hoursToAdd > 0) timePassedParts.push(`${hoursToAdd} giờ`);
    if (minutesToAdd > 0) timePassedParts.push(`${minutesToAdd} phút`);
    
    const timePassedMessage = `Thời gian đã trôi qua: ${timePassedParts.join(', ')}.`;
    systemMessages.push({ id: `time-changed-${Date.now()}`, type: 'system', content: timePassedMessage, timestamp: Date.now(), turnNumber: turnForSystemMessages });

    return { updatedKb: newKb, systemMessages };
};