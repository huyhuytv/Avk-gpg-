
import { KnowledgeBase, GameMessage, GameLocation, VectorMetadata } from '../../types';
import * as GameTemplates from '../../templates';
import { handleLocationEntryEvents } from '../locationEvents';
import { formatLocationForEmbedding } from '../ragUtils';

// Helper function for fuzzy matching location IDs by normalizing their name part.
const normalizeForIdComparison = (str: string): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        // Decompose accented letters into base letters and combining marks
        .normalize("NFD")
        // Remove combining diacritical marks
        .replace(/[\u0300-\u036f]/g, "")
        // Special case for the letter 'đ'
        .replace(/đ/g, "d")
        // Remove all non-alphanumeric characters (spaces, hyphens, etc.)
        .replace(/[^a-z0-9]/g, '');
};

export const processMainLocation = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; newVectorMetadata?: VectorMetadata } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let newVectorMetadata: VectorMetadata | undefined = undefined;

    const name = tagParams.name;
    const description = tagParams.description;
    const locationType = tagParams.locationType as GameTemplates.LocationTypeValues | undefined;

    if (!name || !description) {
        console.warn("MAINLOCATION: Missing name or description.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    if (!newKb.discoveredLocations.find(l => l.name === name)) {
        const newLocation: GameLocation = {
            id: `loc-${name.replace(/\s+/g, '-')}-${Date.now()}`,
            name: name,
            description: description,
            isSafeZone: tagParams.isSafeZone?.toLowerCase() === 'true',
            regionId: tagParams.regionId || undefined,
            mapX: tagParams.mapX ? parseInt(tagParams.mapX, 10) : undefined,
            mapY: tagParams.mapY ? parseInt(tagParams.mapY, 10) : undefined,
            visited: false,
            locationType: locationType && Object.values(GameTemplates.LocationType).includes(locationType) ? locationType : GameTemplates.LocationType.DEFAULT,
        };
        newKb.discoveredLocations.push(newLocation);
        newVectorMetadata = { entityId: newLocation.id, entityType: 'location', text: formatLocationForEmbedding(newLocation) };
        
        systemMessages.push({
            id: 'location-discovered-' + newLocation.id,
            type: 'system',
            content: `Địa điểm mới được khám phá: ${name}.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    }

    return { updatedKb: newKb, systemMessages, newVectorMetadata };
};

export const processSubLocation = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; newVectorMetadata?: VectorMetadata; } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let newVectorMetadata: VectorMetadata | undefined = undefined;

    const name = tagParams.name;
    const description = tagParams.description;
    let parentLocationId = tagParams.parentLocationId;
    const locationType = tagParams.locationType as GameTemplates.AnyLocationType | undefined;

    if (!name || !description || !parentLocationId) {
        console.warn("SUBLOCATION: Missing name, description, or parentLocationId.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    let parentLocation = newKb.discoveredLocations.find(l => l.id === parentLocationId);

    if (!parentLocation) {
        let correctedParentFound = false;
        const aiIdParts = parentLocationId.split('-');
        if (aiIdParts.length > 2) {
            const aiNamePart = aiIdParts.slice(1, -1).join('-');
            const normalizedAiName = normalizeForIdComparison(aiNamePart);
            for (const potentialParent of newKb.discoveredLocations) {
                const existingIdParts = potentialParent.id.split('-');
                if (existingIdParts.length > 2) {
                    const existingNamePart = existingIdParts.slice(1, -1).join('-');
                    const normalizedExistingName = normalizeForIdComparison(existingNamePart);

                    if (normalizedAiName === normalizedExistingName) {
                        const originalIdFromAI = parentLocationId;
                        parentLocationId = potentialParent.id;
                        parentLocation = potentialParent;
                        correctedParentFound = true;
                        console.log(`[DEBUG] Đã tự động sửa lỗi ID của địa điểm cha cho "${name}". ID gốc từ AI: "${originalIdFromAI}", ID đã sửa: "${parentLocationId}".`);
                        break;
                    }
                }
            }
        }
        if (!correctedParentFound) {
            console.warn(`SUBLOCATION: Parent location with ID "${tagParams.parentLocationId}" not found for sub-location "${name}" (fuzzy match also failed).`);
            systemMessages.push({
                id: `parent-id-fail-${Date.now()}`,
                type: 'system',
                content: `[DEBUG] Lỗi tạo địa điểm phụ "${name}": Không tìm thấy địa điểm cha với ID "${tagParams.parentLocationId}", kể cả sau khi đã cố gắng sửa lỗi.`,
                timestamp: Date.now(),
                turnNumber: turnForSystemMessages
            });
            return { updatedKb: newKb, systemMessages };
        }
    }

    if (!newKb.discoveredLocations.find(l => l.name === name && l.parentLocationId === parentLocationId)) {
        const newLocation: GameLocation = {
            id: `loc-${name.replace(/\s+/g, '-')}-${Date.now()}`,
            name: name,
            description: description,
            isSafeZone: tagParams.isSafeZone?.toLowerCase() === 'true',
            parentLocationId: parentLocationId,
            locationType: locationType && (Object.values(GameTemplates.LocationType).includes(locationType as any) || Object.values(GameTemplates.EconomyLocationType).includes(locationType as any) || Object.values(GameTemplates.SubLocationType).includes(locationType as any))
                ? locationType
                : GameTemplates.SubLocationType.OTHER,
        };
        newKb.discoveredLocations.push(newLocation);
        newVectorMetadata = { entityId: newLocation.id, entityType: 'location', text: formatLocationForEmbedding(newLocation) };

        systemMessages.push({
            id: 'sublocation-discovered-' + newLocation.id,
            type: 'system',
            content: `Khu vực mới trong ${parentLocation!.name} được khám phá: ${name}.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    }

    return { updatedKb: newKb, systemMessages, newVectorMetadata };
};

export const processLocationUpdate = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; updatedVectorMetadata?: VectorMetadata; } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const name = tagParams.name;
    const newName = tagParams.newName;
    const description = tagParams.description;
    const isSafeZone = tagParams.isSafeZone;
    const mapX = tagParams.mapX;
    const mapY = tagParams.mapY;
    const locationType = tagParams.locationType as GameTemplates.LocationTypeValues | undefined;
    let updatedVectorMetadata: VectorMetadata | undefined = undefined;

    if (!name) {
        console.warn("LOCATION_UPDATE: Missing name.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    const locIndex = newKb.discoveredLocations.findIndex(l => l.name === name);
    if (locIndex > -1) {
        const locToUpdate = newKb.discoveredLocations[locIndex];
        if (newName) locToUpdate.name = newName;
        if (description) locToUpdate.description = description;
        if (isSafeZone !== undefined) locToUpdate.isSafeZone = isSafeZone.toLowerCase() === 'true';
        if (mapX !== undefined && !isNaN(parseInt(mapX,10))) locToUpdate.mapX = parseInt(mapX, 10);
        if (mapY !== undefined && !isNaN(parseInt(mapY,10))) locToUpdate.mapY = parseInt(mapY, 10);
        if (locationType && Object.values(GameTemplates.LocationType).includes(locationType)) {
            locToUpdate.locationType = locationType;
        }
        systemMessages.push({
            id: 'location-updated-' + locToUpdate.id,
            type: 'system',
            content: `Thông tin về địa điểm ${name} đã được cập nhật.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
        updatedVectorMetadata = {
            entityId: locToUpdate.id,
            entityType: 'location',
            text: formatLocationForEmbedding(locToUpdate)
        };
    } else {
        console.warn(`LOCATION_UPDATE: Location "${name}" not found.`);
    }

    return { updatedKb: newKb, systemMessages, updatedVectorMetadata };
};

export const processLocationChange = async (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): Promise<{ updatedKb: KnowledgeBase; systemMessages: GameMessage[] }> => {
    let newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const locationName = tagParams.name;

    if (!locationName) {
        console.warn("LOCATION_CHANGE: Missing location name.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    const targetLocationIndex = newKb.discoveredLocations.findIndex(l => l.name === locationName);

    if (targetLocationIndex > -1) {
        const targetLocation = newKb.discoveredLocations[targetLocationIndex];
        const locationChanged = newKb.currentLocationId !== targetLocation.id;
        
        if (locationChanged) {
            newKb.currentLocationId = targetLocation.id;
            systemMessages.push({
                id: 'location-changed-' + targetLocation.id,
                type: 'system',
                content: `Bạn đã di chuyển đến: ${locationName}.`,
                timestamp: Date.now(),
                turnNumber: turnForSystemMessages
            });

            const { updatedKb: kbAfterEvents, systemMessages: eventMessages } = await handleLocationEntryEvents(newKb, targetLocation, turnForSystemMessages);
            newKb = kbAfterEvents;
            systemMessages.push(...eventMessages);
        }
    } else {
        console.warn(`LOCATION_CHANGE: Location "${locationName}" not found in discovered locations.`);
        systemMessages.push({
            id: 'location-change-error-' + Date.now(),
            type: 'system',
            content: `[DEBUG] Lỗi di chuyển: Không tìm thấy địa điểm "${locationName}".`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    }

    return { updatedKb: newKb, systemMessages };
};
