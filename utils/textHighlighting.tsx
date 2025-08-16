
import React from 'react';
import { KnowledgeBase, StyleSettings, DIALOGUE_MARKER } from '../types';
import KeywordSpan from '../components/ui/KeywordSpan';
import type { GameEntity, GameEntityType } from '../hooks/types';

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const parseAndHighlightText = (
    textInput: string,
    kb: KnowledgeBase,
    styleSettings: StyleSettings,
    onKeywordClick: (event: React.MouseEvent<HTMLSpanElement>, entity: GameEntity, entityType: GameEntityType) => void
): React.ReactNode[] => {
    const text = textInput ? String(textInput) : "";
    if (!text) return [""];

    const finalNodes: React.ReactNode[] = [];
    
    const dialogueHighlightStyle: React.CSSProperties = {};
    const dialogueSettings = styleSettings.dialogueHighlight;
    if (dialogueSettings) {
        if (dialogueSettings.textColor) dialogueHighlightStyle.color = dialogueSettings.textColor;
        if (dialogueSettings.fontFamily && dialogueSettings.fontFamily !== 'inherit') dialogueHighlightStyle.fontFamily = dialogueSettings.fontFamily;
        if (dialogueSettings.fontSize && dialogueSettings.fontSize !== 'inherit') dialogueHighlightStyle.fontSize = dialogueSettings.fontSize;
        if (dialogueSettings.backgroundColor && dialogueSettings.backgroundColor !== 'transparent') dialogueHighlightStyle.backgroundColor = dialogueSettings.backgroundColor;
    }
    
    const keywordHighlightStyle: React.CSSProperties = {};
    const keywordSettings = styleSettings.keywordHighlight;
    if (keywordSettings) {
        if (keywordSettings.textColor) keywordHighlightStyle.color = keywordSettings.textColor;
        if (keywordSettings.fontFamily && keywordSettings.fontFamily !== 'inherit') keywordHighlightStyle.fontFamily = keywordSettings.fontFamily;
        if (keywordSettings.fontSize && keywordSettings.fontSize !== 'inherit') keywordHighlightStyle.fontSize = keywordSettings.fontSize;
        if (keywordSettings.backgroundColor && keywordSettings.backgroundColor !== 'transparent') keywordHighlightStyle.backgroundColor = keywordSettings.backgroundColor;
    }

    const segments = text.split(DIALOGUE_MARKER);

    segments.forEach((segment, index) => {
        if (index % 2 === 1) {
            if (segment.length > 0) {
                finalNodes.push(<span key={`dialogue-${finalNodes.length}`} style={dialogueHighlightStyle}>{DIALOGUE_MARKER + segment + DIALOGUE_MARKER}</span>);
            }
        } else {
            if (segment.length > 0) {
                const allKeywords: Array<{ name: string; type: GameEntityType; entity: GameEntity;}> = [];
                kb.inventory.forEach(e => { if (typeof e.name === 'string' && e.name.trim().length > 2) allKeywords.push({ name: e.name.trim(), type: 'item', entity: e }); });
                kb.playerSkills.forEach(e => { if (typeof e.name === 'string' && e.name.trim().length > 2) allKeywords.push({ name: e.name.trim(), type: 'skill', entity: e }); });
                kb.allQuests.filter(q => q.status === 'active').forEach(e => { if (typeof e.title === 'string' && e.title.trim().length > 2) allKeywords.push({ name: e.title.trim(), type: 'quest', entity: e }); });
                kb.discoveredNPCs.forEach(e => { if (typeof e.name === 'string' && e.name.trim().length > 2) allKeywords.push({ name: e.name.trim(), type: 'npc', entity: e }); });
                kb.discoveredYeuThu.forEach(e => { if (typeof e.name === 'string' && e.name.trim().length > 2) allKeywords.push({ name: e.name.trim(), type: 'yeuThu', entity: e }); });
                kb.wives.forEach(e => { if (typeof e.name === 'string' && e.name.trim().length > 2) allKeywords.push({ name: e.name.trim(), type: 'wife', entity: e }); });
                kb.slaves.forEach(e => { if (typeof e.name === 'string' && e.name.trim().length > 2) allKeywords.push({ name: e.name.trim(), type: 'slave', entity: e }); });
                kb.discoveredLocations.forEach(e => { if (typeof e.name === 'string' && e.name.trim().length > 2) allKeywords.push({ name: e.name.trim(), type: 'location', entity: e }); });
                kb.worldLore.forEach(e => { if (typeof e.title === 'string' && e.title.trim().length > 2) allKeywords.push({ name: e.title.trim(), type: 'lore', entity: e }); });
                kb.discoveredFactions.forEach(e => { if (typeof e.name === 'string' && e.name.trim().length > 2) allKeywords.push({ name: e.name.trim(), type: 'faction', entity: e }); });

                if (allKeywords.length === 0) {
                    finalNodes.push(segment);
                } else {
                    allKeywords.sort((a, b) => b.name.length - a.name.length);
                    const keywordMap = new Map<string, { type: GameEntityType; entity: GameEntity }>();
                    allKeywords.forEach(kw => { if (!keywordMap.has(kw.name.toLowerCase())) keywordMap.set(kw.name.toLowerCase(), { type: kw.type, entity: kw.entity }); });
                    const uniqueNamesForRegex = Array.from(new Set(allKeywords.map(kw => escapeRegExp(kw.name))));

                    if (uniqueNamesForRegex.length === 0) {
                        finalNodes.push(segment);
                    } else {
                        const pattern = `\\b(${uniqueNamesForRegex.join('|')})\\b`;
                        const regex = new RegExp(pattern, 'gi');
                        
                        let lastIndex = 0;
                        let match;
                        while ((match = regex.exec(segment)) !== null) {
                            const keywordText = match[0];
                            const keywordInfo = keywordMap.get(keywordText.toLowerCase());
                            if (match.index > lastIndex) {
                                finalNodes.push(segment.substring(lastIndex, match.index));
                            }
                            if (keywordInfo) {
                                finalNodes.push(
                                <KeywordSpan
                                    key={`keyword-${keywordInfo.type}-${(keywordInfo.entity as any).id}-${finalNodes.length}`}
                                    keyword={keywordText}
                                    entityType={keywordInfo.type}
                                    entity={keywordInfo.entity}
                                    onClick={onKeywordClick}
                                    style={keywordHighlightStyle}
                                />
                                );
                            } else {
                                finalNodes.push(keywordText); 
                            }
                            lastIndex = regex.lastIndex;
                        }
                        if (lastIndex < segment.length) {
                            finalNodes.push(segment.substring(lastIndex));
                        }
                    }
                }
            }
        }
    });
    return finalNodes.length > 0 ? finalNodes : [""];
};
