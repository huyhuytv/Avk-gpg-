// src/utils/tagProcessors/eventTagProcessor.ts

import { KnowledgeBase, GameMessage, GameEvent, GameEventType, WorldDate, GameLocation, EventDetail } from '../../types';
import { addDaysToWorldDate, parseDurationString, worldDateToTotalDays } from '../dateUtils';
import { diceCoefficient, normalizeStringForComparison } from '../questUtils';
import * as GameTemplates from '../../templates';

// A high threshold to ensure we only match very similar event titles.
const EVENT_SIMILARITY_THRESHOLD = 0.85;

const findEventByTitle = (events: GameEvent[], title: string): { event: GameEvent, index: number } | null => {
    if (!title) return null;
    let bestMatch = { event: null as GameEvent | null, index: -1, score: 0 };
    const normalizedTitle = normalizeStringForComparison(title);

    events.forEach((event, index) => {
        // Prioritize non-finished events for matching
        if (event.status !== 'Đã kết thúc') {
            const score = diceCoefficient(normalizedTitle, normalizeStringForComparison(event.title));
            if (score > bestMatch.score) {
                bestMatch = { event, index, score };
            }
        }
    });

    if (bestMatch.event && bestMatch.score >= EVENT_SIMILARITY_THRESHOLD) {
        return bestMatch;
    }
    
    console.warn(`EVENT_FIND: Event matching "${title}" not found or similarity too low. Best score: ${bestMatch.score.toFixed(2)}`);
    return null;
};

export const processEventTriggered = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];

    const { title, description, type, timeToStart, duration, locationName } = tagParams;

    if (!title || !description || !type || !timeToStart || !duration || !locationName) {
        console.warn("EVENT_TRIGGERED: Missing required parameters.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    let location = newKb.discoveredLocations.find(l => l.name === locationName);
    
    if (!location) {
        // Location not found, so let's create it on the fly.
        console.log(`EVENT_TRIGGERED: Location "${locationName}" not found. Creating a new placeholder location.`);
        const newPlaceholderLocation: GameLocation = {
            id: `loc-${locationName.replace(/\s+/g, '-')}-${Date.now()}`,
            name: locationName,
            description: `Một địa điểm bạn nghe nói đến qua tin đồn, liên quan đến sự kiện "${title}".`,
            isSafeZone: false, // Assume not safe until visited
            visited: false,
            // We don't know the type, coordinates, or region yet.
            locationType: GameTemplates.LocationType.DEFAULT,
        };
        newKb.discoveredLocations.push(newPlaceholderLocation);
        location = newPlaceholderLocation; // Use the newly created location for the event.

        systemMessages.push({
            id: `location-discovered-via-event-${newPlaceholderLocation.id}`,
            type: 'system',
            content: `Bạn vừa nghe nói về một địa điểm mới: ${locationName}.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    }
    
    if (!location) { // Failsafe
        console.error(`EVENT_TRIGGERED: Critical error, location is null even after creation attempt for "${locationName}".`);
        return { updatedKb: newKb, systemMessages };
    }


    const normalizedNewTitle = normalizeStringForComparison(title);
    const isDuplicate = newKb.gameEvents.some(existingEvent => 
        existingEvent.locationId === location!.id &&
        existingEvent.status !== 'Đã kết thúc' &&
        diceCoefficient(normalizedNewTitle, normalizeStringForComparison(existingEvent.title)) >= EVENT_SIMILARITY_THRESHOLD
    );

    if (isDuplicate) {
        console.warn(`EVENT_TRIGGERED: Duplicate event detected and ignored: "${title}" at "${locationName}".`);
        return { updatedKb: newKb, systemMessages };
    }

    const currentDate = newKb.worldDate;
    const daysToStart = parseDurationString(timeToStart).days;
    const durationInDays = parseDurationString(duration).days;
    
    if (daysToStart < 0 || durationInDays <= 0) {
        console.warn(`EVENT_TRIGGERED: Invalid time parameters.`, { timeToStart, duration });
        return { updatedKb: newKb, systemMessages };
    }

    const startDate = addDaysToWorldDate(currentDate, daysToStart);
    const endDate = addDaysToWorldDate(startDate, durationInDays - 1);

    const newEvent: GameEvent = {
        id: `event-${title.replace(/\s+/g, '-')}-${Date.now()}`,
        title,
        description,
        type: type as GameEventType,
        status: 'Sắp diễn ra',
        startDate,
        endDate,
        locationId: location.id,
        isDiscovered: true,
        details: [],
    };

    newKb.gameEvents.push(newEvent);

    systemMessages.push({
        id: `event-triggered-${newEvent.id}`,
        type: 'system',
        content: `Bạn vừa biết được một sự kiện mới: "${title}".`,
        timestamp: Date.now(),
        turnNumber: turnForSystemMessages,
    });

    return { updatedKb: newKb, systemMessages };
};

export const processEventUpdate = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];

    const eventTitle = tagParams.eventTitle;
    if (!eventTitle) {
        console.warn("EVENT_UPDATE: Missing eventTitle parameter.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    const foundMatch = findEventByTitle(newKb.gameEvents, eventTitle);
    if (!foundMatch) return { updatedKb: newKb, systemMessages };

    const { event, index } = foundMatch;
    const eventToUpdate = newKb.gameEvents[index];
    let updateMessages: string[] = [];

    // Update simple fields
    if (tagParams.newTitle) {
        updateMessages.push(`tên được đổi thành "${tagParams.newTitle}"`);
        eventToUpdate.title = tagParams.newTitle;
    }
    if (tagParams.newDescription) {
        updateMessages.push(`mô tả được cập nhật`);
        eventToUpdate.description = tagParams.newDescription;
    }
    if (tagParams.isCancelled) {
        eventToUpdate.isCancelled = tagParams.isCancelled.toLowerCase() === 'true';
        updateMessages.push(eventToUpdate.isCancelled ? `đã bị hủy` : `được tiếp tục`);
    }

    // *** NEW: Update dates logic ***
    if (tagParams.newStartDate) {
        const daysToStart = parseDurationString(tagParams.newStartDate).days;
        const newStartDate = addDaysToWorldDate(newKb.worldDate, daysToStart);
        
        let durationInDays: number;
        if (tagParams.newDuration) {
            durationInDays = parseDurationString(tagParams.newDuration).days;
        } else {
            // Preserve old duration if new duration is not provided
            durationInDays = (worldDateToTotalDays(eventToUpdate.endDate) - worldDateToTotalDays(eventToUpdate.startDate)) + 1;
        }

        eventToUpdate.startDate = newStartDate;
        // Calculate new end date based on new start date and duration.
        // Duration is inclusive, so a 1-day duration means start and end dates are the same. We add duration - 1.
        eventToUpdate.endDate = addDaysToWorldDate(newStartDate, Math.max(0, durationInDays - 1));
        
        updateMessages.push(`thời gian đã thay đổi`);
    }


    // Update location
    if (tagParams.newLocationName) {
        const newLocationName = tagParams.newLocationName;
        let newLocation = newKb.discoveredLocations.find(l => normalizeStringForComparison(l.name) === normalizeStringForComparison(newLocationName));

        if (!newLocation && tagParams.createLocationIfNeeded?.toLowerCase() === 'true') {
            const parentLocation = newKb.discoveredLocations.find(l => l.id === eventToUpdate.locationId);
            if (parentLocation) {
                const newSubLocation: GameLocation = {
                    id: `loc-${newLocationName.replace(/\s+/g, '-')}-${Date.now()}`,
                    name: newLocationName,
                    description: `Một địa điểm mới được phát hiện ở ${parentLocation.name}, liên quan đến sự kiện "${eventToUpdate.title}".`,
                    parentLocationId: parentLocation.id,
                    isSafeZone: parentLocation.isSafeZone, // Inherit safety
                    locationType: GameTemplates.SubLocationType.OTHER,
                    visited: false,
                };
                newKb.discoveredLocations.push(newSubLocation);
                newLocation = newSubLocation;
                systemMessages.push({ id: `loc-created-${newSubLocation.id}`, type: 'system', content: `Địa điểm mới được khám phá: ${newLocationName}.`, timestamp: Date.now(), turnNumber: turnForSystemMessages });
            }
        }

        if (newLocation) {
            eventToUpdate.specificLocationId = newLocation.id;
            updateMessages.push(`địa điểm cụ thể được cập nhật thành "${newLocationName}"`);
        } else {
            console.warn(`EVENT_UPDATE: Could not find or create location "${newLocationName}".`);
        }
    }

    if (updateMessages.length > 0) {
        systemMessages.push({
            id: `event-updated-${eventToUpdate.id}`,
            type: 'system',
            content: `Sự kiện "${eventTitle}" đã được cập nhật: ${updateMessages.join(', ')}.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    }

    return { updatedKb: newKb, systemMessages };
};

export const processEventDetailRevealed = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];

    const { eventTitle, detail } = tagParams;
    if (!eventTitle || !detail) {
        console.warn("EVENT_DETAIL_REVEALED: Missing eventTitle or detail.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    const foundMatch = findEventByTitle(newKb.gameEvents, eventTitle);
    if (!foundMatch) return { updatedKb: newKb, systemMessages };

    const { event, index } = foundMatch;
    const eventToUpdate = newKb.gameEvents[index];

    const newDetail: EventDetail = {
        id: `detail-${eventToUpdate.id}-${Date.now()}`,
        text: detail,
        turnDiscovered: turnForSystemMessages
    };

    if (!eventToUpdate.details) {
        eventToUpdate.details = [];
    }
    eventToUpdate.details.push(newDetail);

    systemMessages.push({
        id: `event-detail-revealed-${newDetail.id}`,
        type: 'system',
        content: `Bạn đã biết thêm một chi tiết mới về sự kiện "${eventToUpdate.title}".`,
        timestamp: Date.now(),
        turnNumber: turnForSystemMessages
    });

    return { updatedKb: newKb, systemMessages };
};