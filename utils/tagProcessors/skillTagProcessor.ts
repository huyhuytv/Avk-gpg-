
import { KnowledgeBase, GameMessage, Skill, VectorMetadata } from '../../types';
import * as GameTemplates from '../../templates';
import { PROFICIENCY_EXP_THRESHOLDS, PROFICIENCY_TIERS } from '../../constants';
import { diceCoefficient, normalizeStringForComparison } from '../questUtils';
import { formatSkillForEmbedding } from '../ragUtils';

const SIMILARITY_THRESHOLD = 0.85;

// Helper function to find a skill by fuzzy name matching
const findSkillByName = (skills: Skill[], name: string): { skill: Skill, index: number } | null => {
    if (!name) return null;
    let bestMatch = { skill: null as Skill | null, index: -1, score: 0 };
    const normalizedName = normalizeStringForComparison(name);

    skills.forEach((skill, index) => {
        const score = diceCoefficient(normalizedName, normalizeStringForComparison(skill.name));
        if (score > bestMatch.score) {
            bestMatch = { skill, index, score };
        }
    });

    if (bestMatch.skill && bestMatch.score >= SIMILARITY_THRESHOLD) {
        return bestMatch;
    }

    if(bestMatch.skill) {
        console.warn(`SKILL_FIND: Skill matching "${name}" found, but similarity score ${bestMatch.score.toFixed(2)} is below threshold ${SIMILARITY_THRESHOLD}. Best match: "${bestMatch.skill.name}"`);
    } else {
        console.warn(`SKILL_FIND: Skill matching "${name}" not found.`);
    }

    return null;
}

export const processSkillLearned = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; newVectorMetadata?: VectorMetadata } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let newVectorMetadata: VectorMetadata | undefined = undefined;
    
    const rawSkillName = tagParams.name;
    const skillName = rawSkillName ? rawSkillName.trim() : undefined; // Trimmed name

    const skillTypeRaw = tagParams.skillType || tagParams.type;
    const skillDescription = tagParams.description;
    const detailedEffectContent = tagParams.otherEffects || tagParams.effect || skillDescription; // Use otherEffects, fallback to effect, then description.
    
    const manaCostStr = tagParams.manaCost;
    const baseDamageStr = tagParams.baseDamage;
    const healingAmountStr = tagParams.healingAmount;
    const cooldownStr = tagParams.cooldown;
    const damageMultiplierStr = tagParams.damageMultiplier;
    const healingMultiplierStr = tagParams.healingMultiplier; // Added
    const levelRequirementStr = tagParams.levelRequirement;
    const xpGainOnUseStr = tagParams.xpGainOnUse;


    if (!skillName || !skillTypeRaw || !skillDescription) {
         console.warn("SKILL_LEARNED: Missing name, type, or description.", tagParams);
         systemMessages.push({
            id: 'skill-learn-error-missingparams-' + Date.now(), type: 'system',
            content: `[DEBUG] Lỗi học kỹ năng: Thiếu tham số bắt buộc cho kỹ năng "${skillName || 'Không tên'}".`,
            timestamp: Date.now(), turnNumber: turnForSystemMessages
        });
         return { updatedKb: newKb, systemMessages };
    }
    
    const skillType = (Object.values(GameTemplates.SkillType).includes(skillTypeRaw as GameTemplates.SkillTypeValues) 
                        ? skillTypeRaw 
                        : GameTemplates.SkillType.KHAC) as GameTemplates.SkillTypeValues;
    
    const existingSkillByName = newKb.playerSkills.find(s => s.name.trim().toLowerCase() === skillName.toLowerCase());

    if (!existingSkillByName) {
        const newSkillId = `skill-${skillName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        const existingSkillById = newKb.playerSkills.find(s => s.id === newSkillId);
        if (existingSkillById) {
            console.warn(`SKILL_LEARNED: Generated ID ${newSkillId} for skill "${skillName}" already exists. This should not happen. Skipping.`);
            systemMessages.push({
                id: 'skill-learn-error-idcollision-' + Date.now(), type: 'system',
                content: `[DEBUG] Lỗi học kỹ năng "${skillName}": Trùng ID kỹ năng. Vui lòng thử lại.`,
                timestamp: Date.now(), turnNumber: turnForSystemMessages
            });
            return { updatedKb: newKb, systemMessages };
        }
        
        const manaCost = parseInt(manaCostStr || "0", 10);
        const baseDamage = parseInt(baseDamageStr || "0", 10);
        const healingAmount = parseInt(healingAmountStr || "0", 10);
        const cooldown = parseInt(cooldownStr || "0", 10);
        const damageMultiplier = parseFloat(damageMultiplierStr || "0");
        const healingMultiplier = parseFloat(healingMultiplierStr || "0"); // Added
        const levelRequirement = levelRequirementStr ? parseInt(levelRequirementStr, 10) : undefined;
        const xpGainOnUse = xpGainOnUseStr ? parseInt(xpGainOnUseStr, 10) : undefined;


        const newSkill: Skill = {
            id: newSkillId,
            name: skillName, 
            description: skillDescription,
            skillType: skillType,
            detailedEffect: detailedEffectContent,
            icon: tagParams.icon,
            manaCost: isNaN(manaCost) ? 0 : manaCost,
            baseDamage: isNaN(baseDamage) ? 0 : baseDamage,
            healingAmount: isNaN(healingAmount) ? 0 : healingAmount,
            damageMultiplier: isNaN(damageMultiplier) ? 0 : damageMultiplier,
            healingMultiplier: isNaN(healingMultiplier) ? 0 : healingMultiplier,
            buffsApplied: undefined, 
            debuffsApplied: undefined,
            otherEffects: tagParams.otherEffects ? tagParams.otherEffects.split(';').map(s=>s.trim()).filter(s=>s) : (detailedEffectContent ? [detailedEffectContent] : undefined),
            targetType: tagParams.targetType as GameTemplates.SkillTargetType | undefined,
            cooldown: isNaN(cooldown) ? 0 : cooldown,
            currentCooldown: 0,
            levelRequirement: levelRequirement && !isNaN(levelRequirement) ? levelRequirement : undefined,
            requiredRealm: tagParams.requiredRealm,
            prerequisiteSkillId: tagParams.prerequisiteSkillId,
            isUltimate: tagParams.isUltimate?.toLowerCase() === 'true',
            xpGainOnUse: xpGainOnUse && !isNaN(xpGainOnUse) ? xpGainOnUse : undefined,
            proficiency: 0,
            maxProficiency: 100,
            proficiencyTier: "Sơ Nhập",
            congPhapDetails: undefined,
            linhKiDetails: undefined,
            professionDetails: undefined,
            camThuatDetails: undefined,
            thanThongDetails: undefined,
        };

        // Add details based on skillType from tagParams
        if (skillType === GameTemplates.SkillType.CONG_PHAP_TU_LUYEN) {
            newSkill.congPhapDetails = {
                type: tagParams.congPhapType as GameTemplates.CongPhapType,
                grade: tagParams.congPhapGrade as GameTemplates.CongPhapGrade,
                weaponFocus: tagParams.weaponFocus,
            };
        } else if (skillType === GameTemplates.SkillType.LINH_KI) {
            newSkill.linhKiDetails = {
                category: tagParams.linhKiCategory as GameTemplates.LinhKiCategory,
                activation: tagParams.linhKiActivation as GameTemplates.LinhKiActivationType,
            };
        } else if (skillType === GameTemplates.SkillType.NGHE_NGHIEP) {
            newSkill.professionDetails = {
                type: tagParams.professionType as GameTemplates.ProfessionType,
                grade: tagParams.professionGrade as GameTemplates.ProfessionGrade,
                skillDescription: tagParams.skillDescription,
            };
        } else if (skillType === GameTemplates.SkillType.CAM_THUAT) {
            newSkill.camThuatDetails = {
                sideEffects: tagParams.sideEffects,
            };
        } else if (skillType === GameTemplates.SkillType.THAN_THONG) {
            newSkill.thanThongDetails = {};
        }


        newKb.playerSkills.push(newSkill);
        newVectorMetadata = { entityId: newSkill.id, entityType: 'skill', text: formatSkillForEmbedding(newSkill) };
        systemMessages.push({
            id: 'skill-learned-' + newSkill.id, type: 'system',
            content: `Học được kỹ năng mới: ${skillName}!`,
            timestamp: Date.now(), turnNumber: turnForSystemMessages
        });
    } else {
        console.warn(`SKILL_LEARNED: Skill "${skillName}" already exists. Not adding duplicate.`);
    }
    return { updatedKb: newKb, systemMessages, newVectorMetadata };
};

export const processSkillUpdate = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; updatedVectorMetadata?: VectorMetadata; } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let updatedVectorMetadata: VectorMetadata | undefined = undefined;
    
    const rawCurrentSkillName = tagParams.name;
    const currentSkillName = rawCurrentSkillName ? rawCurrentSkillName.trim() : undefined;


    if (!currentSkillName) {
        console.warn("SKILL_UPDATE: Missing current skill name (name parameter).", tagParams);
        systemMessages.push({
            id: `skill-update-error-noname-${Date.now()}`, type: 'system',
            content: `[DEBUG] Lỗi cập nhật kỹ năng: Thiếu tên kỹ năng hiện tại.`,
            timestamp: Date.now(), turnNumber: turnForSystemMessages
        });
        return { updatedKb: newKb, systemMessages };
    }

    const foundMatch = findSkillByName(newKb.playerSkills, currentSkillName);
    
    if (!foundMatch) {
        console.warn(`SKILL_UPDATE: Skill "${currentSkillName}" not found.`, tagParams);
        systemMessages.push({
            id: `skill-update-error-notfound-${Date.now()}`, type: 'system',
            content: `[DEBUG] Lỗi cập nhật kỹ năng: Không tìm thấy kỹ năng "${currentSkillName}".`,
            timestamp: Date.now(), turnNumber: turnForSystemMessages
        });
        return { updatedKb: newKb, systemMessages };
    }
    
    const { skill: skillToUpdate, index: skillIndex } = foundMatch;
    const originalNameToDisplay = skillToUpdate.name; 
    let updatedFieldsCount = 0;

    if (tagParams.newName) {
        const newTrimmedName = tagParams.newName.trim();
        if (newTrimmedName && newTrimmedName.toLowerCase() !== skillToUpdate.name.trim().toLowerCase()) {
            const collisionExists = newKb.playerSkills.some((s, idx) => 
                idx !== skillIndex && s.name.trim().toLowerCase() === newTrimmedName.toLowerCase()
            );
            if (!collisionExists) {
                skillToUpdate.name = newTrimmedName;
                updatedFieldsCount++;
            } else {
                 console.warn(`SKILL_UPDATE: New name "${newTrimmedName}" for skill "${originalNameToDisplay}" collides with an existing skill. Name not updated.`);
                 systemMessages.push({
                    id: `skill-update-error-namecollision-${Date.now()}`, type: 'system',
                    content: `[DEBUG] Lỗi cập nhật kỹ năng "${originalNameToDisplay}": Tên mới "${newTrimmedName}" đã tồn tại.`,
                    timestamp: Date.now(), turnNumber: turnForSystemMessages
                });
            }
        }
    }
    if (tagParams.description) {
        skillToUpdate.description = tagParams.description;
        updatedFieldsCount++;
    }
    if (tagParams.type || tagParams.skillType) {
        const newType = (tagParams.type || tagParams.skillType) as GameTemplates.SkillTypeValues;
        skillToUpdate.skillType = (Object.values(GameTemplates.SkillType).includes(newType) 
                                    ? newType 
                                    : GameTemplates.SkillType.KHAC) as GameTemplates.SkillTypeValues;
        updatedFieldsCount++;
    }
    if (tagParams.effect || tagParams.otherEffects) {
        const newEffect = tagParams.otherEffects || tagParams.effect;
        skillToUpdate.detailedEffect = newEffect!;
        skillToUpdate.otherEffects = newEffect!.split(';').map(s=>s.trim()).filter(s=>s);
        updatedFieldsCount++;
    }

    const parseAndUpdateNumericField = (paramKey: keyof Skill, fieldName: keyof Skill, parser: (val: string) => number | undefined) => {
        if (tagParams[paramKey as string]) {
            const parsedValue = parser(tagParams[paramKey as string]);
            if (parsedValue !== undefined && !isNaN(parsedValue)) {
                (skillToUpdate as any)[fieldName] = parsedValue;
                updatedFieldsCount++;
            } else {
                console.warn(`SKILL_UPDATE: Invalid numeric value for ${paramKey as string}: "${tagParams[paramKey as string]}"`);
            }
        }
    };
    
    if (tagParams.proficiency && tagParams.proficiency.startsWith("+=")) {
        const change = parseInt(tagParams.proficiency.substring(2), 10);
        if (!isNaN(change) && change > 0) {
            skillToUpdate.proficiency = (skillToUpdate.proficiency || 0) + change;
            let leveledUp = false;
    
            // Loop to handle multiple level-ups from a single EXP gain
            while (skillToUpdate.proficiencyTier !== "Xuất Thần Nhập Hóa" && skillToUpdate.proficiency >= (skillToUpdate.maxProficiency || 100)) {
                const currentTierIndex = PROFICIENCY_TIERS.indexOf(skillToUpdate.proficiencyTier || "Sơ Nhập");
                const nextTierIndex = currentTierIndex + 1;
    
                if (nextTierIndex < PROFICIENCY_TIERS.length) {
                    skillToUpdate.proficiency -= (skillToUpdate.maxProficiency || 100);
                    const nextTier = PROFICIENCY_TIERS[nextTierIndex];
                    skillToUpdate.proficiencyTier = nextTier;
                    const newMaxExp = PROFICIENCY_EXP_THRESHOLDS[nextTier];
                    skillToUpdate.maxProficiency = newMaxExp === null ? skillToUpdate.proficiency : newMaxExp; // If max level, cap exp
                    leveledUp = true;
                     systemMessages.push({
                        id: `skill-levelup-${skillToUpdate.id}-${nextTier}`,
                        type: 'system',
                        content: `Kỹ năng "${originalNameToDisplay}" đã đột phá đến cảnh giới "${nextTier}"!`,
                        timestamp: Date.now(),
                        turnNumber: turnForSystemMessages
                    });
                } else {
                    // Should be Xuất Thần Nhập Hóa, break loop
                    skillToUpdate.proficiency = skillToUpdate.maxProficiency; // Cap EXP
                    break;
                }
            }
            
            // This makes sure that if only proficiency changed, it's still considered an update.
            updatedFieldsCount++;
        }
    }


    parseAndUpdateNumericField('manaCost', 'manaCost', val => parseInt(val, 10));
    parseAndUpdateNumericField('baseDamage', 'baseDamage', val => parseInt(val, 10));
    parseAndUpdateNumericField('healingAmount', 'healingAmount', val => parseInt(val, 10));
    parseAndUpdateNumericField('cooldown', 'cooldown', val => parseInt(val, 10));
    parseAndUpdateNumericField('damageMultiplier', 'damageMultiplier', parseFloat);
    parseAndUpdateNumericField('healingMultiplier', 'healingMultiplier', parseFloat);
    parseAndUpdateNumericField('levelRequirement', 'levelRequirement', val => parseInt(val,10));
    parseAndUpdateNumericField('xpGainOnUse', 'xpGainOnUse', val => parseInt(val,10));

    if (tagParams.icon) { skillToUpdate.icon = tagParams.icon; updatedFieldsCount++; }
    if (tagParams.targetType) { skillToUpdate.targetType = tagParams.targetType as GameTemplates.SkillTargetType; updatedFieldsCount++; }
    if (tagParams.requiredRealm) { skillToUpdate.requiredRealm = tagParams.requiredRealm; updatedFieldsCount++; }
    if (tagParams.prerequisiteSkillId) { skillToUpdate.prerequisiteSkillId = tagParams.prerequisiteSkillId; updatedFieldsCount++; }
    if (tagParams.isUltimate) { skillToUpdate.isUltimate = tagParams.isUltimate.toLowerCase() === 'true'; updatedFieldsCount++; }

    if (updatedFieldsCount > 0) {
        if (!systemMessages.some(msg => msg.id.startsWith('skill-levelup'))) {
            systemMessages.push({
                id: `skill-updated-${skillToUpdate.id}-${Date.now()}`, type: 'system',
                content: `Kỹ năng "${originalNameToDisplay}" đã được cập nhật${skillToUpdate.name !== originalNameToDisplay ? ` thành "${skillToUpdate.name}"` : ""}.`,
                timestamp: Date.now(), turnNumber: turnForSystemMessages
            });
        }
        updatedVectorMetadata = {
            entityId: skillToUpdate.id,
            entityType: 'skill',
            text: formatSkillForEmbedding(skillToUpdate)
        };
    } else if (updatedFieldsCount === 0 && !systemMessages.some(msg => msg.id.includes('error'))) { 
         console.warn(`SKILL_UPDATE: Tag for "${originalNameToDisplay}" received, but no valid fields were updated.`);
         systemMessages.push({
            id: `skill-update-nochange-${skillToUpdate.id}-${Date.now()}`, type: 'system',
            content: `[DEBUG] Tag SKILL_UPDATE cho "${originalNameToDisplay}" không có thay đổi nào được áp dụng.`,
            timestamp: Date.now(), turnNumber: turnForSystemMessages
        });
    }

    return { updatedKb: newKb, systemMessages, updatedVectorMetadata };
};
