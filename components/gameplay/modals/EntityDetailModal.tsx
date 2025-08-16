
import React from 'react';
import { GameEntity, GameEntityType } from '../../../hooks/types';
import { KnowledgeBase, PlayerStats, Item, Skill, Quest, NPC, GameLocation, WorldLoreEntry, Companion, Faction, YeuThu, Wife, Slave, Prisoner } from '../../../types';
import * as GameTemplates from '../../../templates';
import Modal from '../../ui/Modal';
import { VIETNAMESE, PROFICIENCY_DMG_HEAL_MULTIPLIERS, PROFICIENCY_COST_COOLDOWN_MULTIPLIERS } from '../../../constants';
import { getDeterministicAvatarSrc } from '../../../utils/avatarUtils';

interface EntityDetailModalProps {
    selectedEntity: { type: GameEntityType; entity: GameEntity } | null;
    isOpen: boolean;
    onClose: () => void;
    knowledgeBase: KnowledgeBase;
    onUpdateNpcAvatar: (npcId: string, newAvatarUrl: string) => void; 
    isUploadingAvatar: boolean;
}

const renderStatBonuses = (bonuses: Partial<PlayerStats>) => {
    const relevantBonuses = Object.entries(bonuses).filter(
        (entry): entry is [string, number] => {
            const [key, value] = entry;
            return !key.startsWith('base') && typeof value === 'number' && value !== 0;
        }
    );
    if (relevantBonuses.length === 0) return <p className="text-xs text-gray-400">Không có chỉ số cộng thêm.</p>;
    const statLabels: Record<string, string> = {
        sinhLuc: "Sinh Lực Hiện Tại", maxSinhLuc: "Sinh Lực Tối Đa",
        linhLuc: "Linh Lực Hiện Tại", maxLinhLuc: "Linh Lực Tối Đa",
        sucTanCong: "Sức Tấn Công",
        kinhNghiem: "Kinh Nghiệm", maxKinhNghiem: "Kinh Nghiệm Tối Đa",
    };
    return (
        <ul className="list-disc list-inside pl-4 text-xs">
            {relevantBonuses.map(([key, value]) => ( 
                <li key={key}>
                    <span className="text-gray-300">{statLabels[key] || key}: </span>
                    <span className={value > 0 ? "text-green-400" : "text-red-400"}>
                        {value > 0 ? `+${value}` : value}
                    </span>
                </li>
            ))}
        </ul>
    );
};

// Helper component for cleaner layout in the person detail view
const StatField = ({ label, value, valueClassName = "text-gray-200" }: { label: string; value: React.ReactNode; valueClassName?: string }) => (
    <div>
        <p className="text-sm text-indigo-300">{label}</p>
        <p className={`font-semibold ${valueClassName}`}>{value || 'Không rõ'}</p>
    </div>
);

const EntityDetailModal: React.FC<EntityDetailModalProps> = ({ selectedEntity, isOpen, onClose, knowledgeBase }) => {
    if (!isOpen || !selectedEntity) return null;

    const { type, entity } = selectedEntity;
    let title = "Chi Tiết";
    let content: React.ReactNode = null;

    switch (type) {
        case 'item': {
            const item = entity as Item;
            title = VIETNAMESE.itemDetails;
            const categoryLabel = VIETNAMESE[`itemCategory_${item.category}` as keyof typeof VIETNAMESE] || item.category;
            content = (
                <div className="space-y-2">
                    <p><strong className="text-indigo-300">Tên:</strong> {item.name}</p>
                    <p><strong className="text-indigo-300">Phân loại:</strong> {typeof categoryLabel === 'string' ? categoryLabel : item.category}</p>
                    {item.itemRealm && <p><strong className="text-indigo-300">Cảnh Giới Vật Phẩm:</strong> {item.itemRealm}</p>}
                    {item.category === GameTemplates.ItemCategory.EQUIPMENT && (item as GameTemplates.EquipmentTemplate).equipmentType && <p><strong className="text-indigo-300">Loại Trang Bị:</strong> {(item as GameTemplates.EquipmentTemplate).equipmentType}</p>}
                    {item.category === GameTemplates.ItemCategory.POTION && (item as GameTemplates.PotionTemplate).potionType && <p><strong className="text-indigo-300">Loại Đan Dược:</strong> {(item as GameTemplates.PotionTemplate).potionType}</p>}
                    {item.category === GameTemplates.ItemCategory.MATERIAL && (item as GameTemplates.MaterialTemplate).materialType && <p><strong className="text-indigo-300">Loại Nguyên Liệu:</strong> {(item as GameTemplates.MaterialTemplate).materialType}</p>}
                    {item.category === GameTemplates.ItemCategory.CONG_PHAP && (item as GameTemplates.CongPhapTemplate).congPhapType && <p><strong className="text-indigo-300">Loại Công Pháp:</strong> {(item as GameTemplates.CongPhapTemplate).congPhapType}</p>}
                    {item.category === GameTemplates.ItemCategory.PROFESSION_SKILL_BOOK && (item as GameTemplates.ProfessionSkillBookTemplate).professionToLearn && <p><strong className="text-indigo-300">Học Nghề:</strong> {(item as GameTemplates.ProfessionSkillBookTemplate).professionToLearn}</p>}
                    {item.category === GameTemplates.ItemCategory.PROFESSION_TOOL && (item as GameTemplates.ProfessionToolTemplate).professionRequired && <p><strong className="text-indigo-300">Yêu Cầu Nghề:</strong> {(item as GameTemplates.ProfessionToolTemplate).professionRequired}</p>}
                    <p><strong className="text-indigo-300">Độ hiếm:</strong> {item.rarity}</p>
                    <p><strong className="text-indigo-300">Số lượng:</strong> {item.quantity}</p>
                    {item.description && <p><strong className="text-indigo-300">Mô tả:</strong> {item.description}</p>}
                    {item.value !== undefined && <p><strong className="text-indigo-300">Giá trị:</strong> {item.value}</p>}

                    {item.category === GameTemplates.ItemCategory.EQUIPMENT && (
                        <>
                            {(item as GameTemplates.EquipmentTemplate).slot && <p><strong className="text-indigo-300">Vị trí:</strong> {(item as GameTemplates.EquipmentTemplate).slot}</p>}
                            {(item as GameTemplates.EquipmentTemplate).statBonuses && Object.keys((item as GameTemplates.EquipmentTemplate).statBonuses).length > 0 && (
                                <div><strong className="text-indigo-300">Chỉ số cộng thêm:</strong> {renderStatBonuses((item as GameTemplates.EquipmentTemplate).statBonuses)}</div>
                            )}
                            {(item as GameTemplates.EquipmentTemplate).uniqueEffects && (item as GameTemplates.EquipmentTemplate).uniqueEffects.length > 0 && <p><strong className="text-indigo-300">Hiệu ứng đặc biệt:</strong> {(item as GameTemplates.EquipmentTemplate).uniqueEffects.join(', ')}</p>}
                        </>
                    )}
                    {item.category === GameTemplates.ItemCategory.POTION && (
                        <>
                            {(item as GameTemplates.PotionTemplate).effects && (item as GameTemplates.PotionTemplate).effects.length > 0 && <p><strong className="text-indigo-300">Hiệu ứng:</strong> {(item as GameTemplates.PotionTemplate).effects.join(', ')}</p>}
                            {(item as GameTemplates.PotionTemplate).durationTurns !== undefined && <p><strong className="text-indigo-300">Thời gian hiệu lực:</strong> {(item as GameTemplates.PotionTemplate).durationTurns} lượt</p>}
                        </>
                    )}
                    {item.category === GameTemplates.ItemCategory.CONG_PHAP && (item as GameTemplates.CongPhapTemplate).expBonusPercentage && <p><strong className="text-indigo-300">Tăng Kinh Nghiệm Tu Luyện:</strong> +{(item as GameTemplates.CongPhapTemplate).expBonusPercentage}%</p>}
                    {item.category === GameTemplates.ItemCategory.LINH_KI && (item as GameTemplates.LinhKiTemplate).skillToLearnJSON && <p className="text-xs italic text-gray-400">Vật phẩm này có thể dạy một Linh Kĩ mới.</p>}
                </div>
            );
            break;
        }
        case 'skill': {
            const skill = entity as Skill;
            title = `${VIETNAMESE.skillDetails}: ${skill.name}`;
            
            const tier = skill.proficiencyTier || "Sơ Nhập";
            const dmgHealMultiplier = PROFICIENCY_DMG_HEAL_MULTIPLIERS[tier] || 1.0;
            const costCdMultiplier = PROFICIENCY_COST_COOLDOWN_MULTIPLIERS[tier] || 1.0;
        
            const renderCombatStats = (s: Skill) => (
                <div className="space-y-1">
                    {s.manaCost > 0 && <p><strong className="text-indigo-300">Tiêu hao Linh lực:</strong> {Math.ceil(s.manaCost * costCdMultiplier)} <span className="text-xs text-gray-400">(gốc: {s.manaCost})</span></p>}
                    {s.cooldown !== undefined && s.cooldown > 0 && <p><strong className="text-indigo-300">Thời gian hồi:</strong> {Math.ceil(s.cooldown * costCdMultiplier)} lượt <span className="text-xs text-gray-400">(gốc: {s.cooldown})</span></p>}
                    {s.baseDamage > 0 && <p><strong className="text-indigo-300">Sát thương cơ bản:</strong> {Math.round(s.baseDamage * dmgHealMultiplier)} <span className="text-xs text-gray-400">(gốc: {s.baseDamage})</span></p>}
                    {s.damageMultiplier > 0 && <p><strong className="text-indigo-300">Hệ số Sức Tấn Công:</strong> x{(s.damageMultiplier * dmgHealMultiplier).toFixed(2)} <span className="text-xs text-gray-400">(gốc: x{s.damageMultiplier})</span></p>}
                    {s.healingAmount > 0 && <p><strong className="text-indigo-300">Hồi phục cơ bản:</strong> {Math.round(s.healingAmount * dmgHealMultiplier)} <span className="text-xs text-gray-400">(gốc: {s.healingAmount})</span></p>}
                    {s.healingMultiplier > 0 && <p><strong className="text-indigo-300">Hệ số Hồi phục:</strong> x{(s.healingMultiplier * dmgHealMultiplier).toFixed(2)} <span className="text-xs text-gray-400">(gốc: x{s.healingMultiplier})</span></p>}
                    {s.otherEffects && s.otherEffects.length > 0 && <p><strong className="text-indigo-300">Hiệu ứng đặc biệt:</strong> {s.otherEffects.join('; ')}</p>}
                </div>
            );
        
            content = (
                 <div className="space-y-2">
                    <p><strong className="text-indigo-300">Tên:</strong> {skill.name}</p>
                    <p><strong className="text-indigo-300">Loại:</strong> {skill.skillType}</p>
                    {skill.proficiencyTier && <p><strong className="text-indigo-300">{VIETNAMESE.skillProficiencyLabel || "Độ Thuần Thục"}:</strong> {skill.proficiencyTier} ({skill.proficiency || 0} / {skill.maxProficiency || 100})</p>}
                    {skill.description && <p className="italic text-gray-400 mt-1 mb-2">{skill.description}</p>}
                    
                    <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-1">
                        {skill.skillType === GameTemplates.SkillType.CONG_PHAP_TU_LUYEN && skill.congPhapDetails && (
                            <>
                                {skill.congPhapDetails.type && <p><strong className="text-indigo-300">Loại Công Pháp:</strong> {skill.congPhapDetails.type}</p>}
                                {skill.congPhapDetails.grade && <p><strong className="text-indigo-300">Phẩm Chất:</strong> {skill.congPhapDetails.grade}</p>}
                                {skill.congPhapDetails.weaponFocus && <p><strong className="text-indigo-300">Chuyên Tu Vũ Khí:</strong> {skill.congPhapDetails.weaponFocus}</p>}
                            </>
                        )}
                        
                        {skill.skillType === GameTemplates.SkillType.LINH_KI && skill.linhKiDetails && (
                            <>
                                {skill.linhKiDetails.category && <p><strong className="text-indigo-300">Phân Loại:</strong> {skill.linhKiDetails.category}</p>}
                                {skill.linhKiDetails.activation && <p><strong className="text-indigo-300">Kích Hoạt:</strong> {skill.linhKiDetails.activation}</p>}
                                {skill.linhKiDetails.activation === 'Chủ động' && renderCombatStats(skill)}
                            </>
                        )}
        
                        {skill.skillType === GameTemplates.SkillType.THAN_THONG && renderCombatStats(skill)}
        
                        {skill.skillType === GameTemplates.SkillType.CAM_THUAT && (
                            <>
                                {skill.camThuatDetails?.sideEffects && <p><strong className="text-red-400">Tác Dụng Phụ:</strong> {skill.camThuatDetails.sideEffects}</p>}
                                {renderCombatStats(skill)}
                            </>
                        )}
        
                        {skill.skillType === GameTemplates.SkillType.NGHE_NGHIEP && skill.professionDetails && (
                            <>
                                {skill.professionDetails.type && <p><strong className="text-indigo-300">Nghề Nghiệp:</strong> {skill.professionDetails.type}</p>}
                                {skill.professionDetails.grade && <p><strong className="text-indigo-300">Cấp Bậc Nghề:</strong> {skill.professionDetails.grade}</p>}
                                {skill.professionDetails.skillDescription && <p><strong className="text-indigo-300">Mô Tả Kỹ Năng:</strong> {skill.professionDetails.skillDescription}</p>}
                            </>
                        )}
                        
                        {skill.detailedEffect && <p className="mt-2 pt-2 border-t border-gray-700/50"><strong className="text-indigo-300">Mô tả hiệu ứng:</strong> {skill.detailedEffect}</p>}
                    </div>
                </div>
            );
            break;
        }
        case 'quest': {
            const quest = entity as Quest;
            title = VIETNAMESE.questDetails;
            content = (
                 <div className="space-y-2">
                    <p><strong className="text-indigo-300">Tên:</strong> {quest.title}</p>
                    <p><strong className="text-indigo-300">Trạng thái:</strong> {quest.status === 'active' ? "Đang làm" : quest.status === 'completed' ? <span className="text-green-400 font-semibold">Hoàn thành</span> : <span className="text-red-400 font-semibold">Thất bại</span>}</p>
                    {quest.description && <p><strong className="text-indigo-300">Mô tả:</strong> {quest.description}</p>}
                    <p className="font-semibold text-indigo-300 mt-2">Mục tiêu:</p>
                    {quest.objectives.length > 0 ? <ul className="list-disc list-inside pl-4">{quest.objectives.map(obj => <li key={obj.id} className={obj.completed ? 'text-gray-500 line-through' : ''}>{obj.text}</li>)}</ul> : <p>Không có mục tiêu.</p>}
                </div>
            );
            break;
        }
        case 'npc':
        case 'prisoner':
        case 'wife':
        case 'slave': {
            const person = entity as NPC | Prisoner | Wife | Slave;
            const personTypeLabel = ('entityType' in person && person.entityType)
                ? (person.entityType === 'wife' ? 'Đạo Lữ' : person.entityType === 'slave' ? 'Nô Lệ' : 'Tù Nhân')
                : 'NPC';
            title = `Chi Tiết ${personTypeLabel}`;
        
            content = (
                <div className="space-y-4">
                    <div className="text-center">
                        <img src={getDeterministicAvatarSrc(person)} alt={person.name} className="w-32 h-32 rounded-lg object-cover mx-auto mb-3 border-2 border-pink-500 shadow-md" />
                        <h3 className="text-2xl font-bold">{person.name}</h3>
                        <p className="text-md text-gray-400">{person.race || 'Không rõ'}</p>
                        {person.title && <p className="text-sm text-gray-500">{person.title}</p>}
                    </div>
            
                    <div className="bg-gray-900/40 p-3 rounded-lg">
                        <h4 className="font-semibold text-lg text-indigo-300 border-b border-gray-600 pb-2 mb-3">Tu Luyện</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <StatField label="Giới tính" value={person.gender} />
                            <StatField label="Cảnh giới" value={person.realm} valueClassName="text-amber-400 font-bold"/>
                            <StatField label="Tư chất" value={person.tuChat} />
                            <StatField label="Linh Căn" value={person.spiritualRoot} />
                            <div className="col-span-2">
                                <StatField label="Thể Chất" value={person.specialPhysique} />
                            </div>
                        </div>
                    </div>
                    
                    {('affinity' in person || 'willpower' in person || 'obedience' in person || 'resistance' in person) && (
                        <div className="bg-gray-900/40 p-3 rounded-lg">
                             <h4 className="font-semibold text-lg text-indigo-300 border-b border-gray-600 pb-2 mb-3">Trạng thái quan hệ</h4>
                             <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <StatField label="Thiện cảm" value={person.affinity} valueClassName={person.affinity >= 0 ? "text-green-400" : "text-red-400"}/>
                                {('willpower' in person) && <StatField label="Ý chí" value={(person as any).willpower} />}
                                {('obedience' in person) && <StatField label="Phục tùng" value={(person as any).obedience} />}
                                {('resistance' in person) && <StatField label="Phản kháng" value={(person as Prisoner).resistance} />}
                             </div>
                        </div>
                    )}
                    
                    {person.stats && (person.stats.maxSinhLuc != null || person.stats.sucTanCong != null) && (
                        <div className="bg-gray-900/40 p-3 rounded-lg">
                            <h4 className="font-semibold text-lg text-indigo-300 border-b border-gray-600 pb-2 mb-3">Chỉ số chiến đấu</h4>
                            <ul className="text-sm space-y-1.5">
                                {person.stats.maxSinhLuc != null && <li><strong className="text-gray-400">Sinh Lực:</strong> {person.stats.sinhLuc ?? '??'} / {person.stats.maxSinhLuc}</li>}
                                {person.stats.maxLinhLuc != null && person.stats.maxLinhLuc > 0 && <li><strong className="text-gray-400">Linh Lực:</strong> {person.stats.linhLuc ?? '??'} / {person.stats.maxLinhLuc}</li>}
                                {person.stats.sucTanCong != null && <li><strong className="text-gray-400">Sức Tấn Công:</strong> {person.stats.sucTanCong}</li>}
                                {person.stats.maxKinhNghiem != null && person.stats.maxKinhNghiem > 0 && <li><strong className="text-gray-400">Kinh Nghiệm:</strong> {person.stats.kinhNghiem ?? '??'} / {person.stats.maxKinhNghiem}</li>}
                                {person.stats.thoNguyen !== undefined && <li className="col-span-2"><strong className="text-gray-400">Thọ Nguyên:</strong> {Math.floor(person.stats.thoNguyen)} / {person.stats.maxThoNguyen ?? '??'}</li>}
                            </ul>
                        </div>
                    )}
                    <p className="text-sm italic text-gray-400 pt-3 border-t border-gray-700/50">{person.description}</p>
                </div>
            );
            break;
        }
        case 'yeuThu': {
            const yeuThu = entity as YeuThu;
            title = "Chi Tiết Yêu Thú";
            const locationName = yeuThu.locationId ? knowledgeBase.discoveredLocations.find(l => l.id === yeuThu.locationId)?.name : null;
            content = (
                <div className="space-y-2 text-sm">
                    <img src={getDeterministicAvatarSrc(yeuThu)} alt={yeuThu.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover mx-auto mb-3 border-2 border-red-500 shadow-md" />
                    <p><strong className="text-indigo-300">Tên:</strong> {yeuThu.name}</p>
                    <p><strong className="text-indigo-300">Loài:</strong> {yeuThu.species}</p>
                    <p><strong className="text-indigo-300">Mô tả:</strong> {yeuThu.description}</p>
                    <p><strong className="text-indigo-300">Thái độ:</strong> {yeuThu.isHostile ? <span className="text-red-400">Thù địch</span> : <span className="text-green-400">Trung lập / Thân thiện</span>}</p>
                    {yeuThu.realm && <p><strong className="text-indigo-300">Cảnh giới:</strong> {yeuThu.realm}</p>}
                    {locationName && <p><strong className="text-indigo-300">Vị trí:</strong> {locationName}</p>}
                    {yeuThu.stats && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50">
                            <strong className="text-indigo-300">Chỉ số:</strong>
                            <ul className="list-disc list-inside pl-4 text-xs mt-1">
                                {yeuThu.stats.maxSinhLuc != null && <li>Sinh Lực: {yeuThu.stats.sinhLuc ?? '??'} / {yeuThu.stats.maxSinhLuc}</li>}
                                {yeuThu.stats.maxLinhLuc != null && yeuThu.stats.maxLinhLuc > 0 && <li>Linh Lực: {yeuThu.stats.linhLuc ?? '??'} / {yeuThu.stats.maxLinhLuc}</li>}
                                {yeuThu.stats.sucTanCong != null && <li>Sức Tấn Công: {yeuThu.stats.sucTanCong}</li>}
                            </ul>
                        </div>
                    )}
                </div>
            );
            break;
        }
        case 'location': {
            const location = entity as GameLocation;
            title = VIETNAMESE.locationDetails;
            const getRegionName = (regionId?: string): string | undefined => {
                if (!regionId) return undefined;
                return knowledgeBase.discoveredRegions.find(r => r.id === regionId)?.name;
            };
            const regionName = getRegionName(location.regionId);
            const subLocations = knowledgeBase.discoveredLocations.filter(loc => loc.parentLocationId === location.id);
            
            content = (
                 <div className="space-y-2 text-sm">
                    <p><strong className="text-indigo-300">Tên:</strong> {location.name}</p>
                    {location.locationType && <p><strong className="text-indigo-300">Loại:</strong> {location.locationType}</p>}
                    {location.description && <p><strong className="text-indigo-300">Mô tả:</strong> {location.description}</p>}
                    {regionName && <p><strong className="text-indigo-300">{VIETNAMESE.regionLabel || "Vùng"}:</strong> {regionName}</p>}
                    {(location.mapX !== undefined && location.mapY !== undefined) && <p><strong className="text-indigo-300">Tọa độ:</strong> ({location.mapX}, {location.mapY})</p>}
                    {location.isSafeZone !== undefined && <p><strong className="text-indigo-300">An toàn:</strong> {location.isSafeZone ? "Có" : "Không"}</p>}
                    {location.parentLocationId === undefined && ( // Only show for main locations
                        <p><strong className="text-indigo-300">{VIETNAMESE.locationStatusLabel}:</strong> <span className={location.visited ? 'text-green-400 font-semibold' : 'text-gray-400'}>{location.visited ? VIETNAMESE.locationStatusVisited : VIETNAMESE.locationStatusUnvisited}</span></p>
                    )}
                    
                    {location.connections && location.connections.some(c => c.isDiscovered) && (
                        <div className="mt-2">
                            <strong className="text-indigo-300">Kết nối đã biết:</strong>
                            <ul className="list-disc list-inside pl-4 text-gray-300 text-xs">
                                {location.connections.filter(c => c.isDiscovered).map(conn => {
                                    const target = knowledgeBase.discoveredLocations.find(l => l.id === conn.targetLocationId);
                                    let connDetails = target?.name || conn.targetLocationId;
                                    if (conn.travelTimeTurns) connDetails += ` (Thời gian: ${conn.travelTimeTurns} lượt)`;
                                    if (conn.description) connDetails += ` - ${conn.description}`;
                                    return <li key={conn.targetLocationId}>{connDetails}</li>;
                                })}
                            </ul>
                        </div>
                    )}

                    {subLocations.length > 0 && (
                        <div className="mt-2">
                            <strong className="text-indigo-300">Khu vực phụ:</strong>
                            <ul className="list-disc list-inside pl-4 text-gray-300 text-xs">
                                {subLocations.map(subLoc => <li key={subLoc.id}>{subLoc.name}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            );
            break;
        }
        case 'lore': {
            const lore = entity as WorldLoreEntry;
            title = VIETNAMESE.loreDetails;
            content = <p className="whitespace-pre-wrap"><strong className="text-indigo-300">Nội dung:</strong> {lore.content}</p>;
            break;
        }
        case 'companion': {
            const companion = entity as Companion;
            title = VIETNAMESE.companionDetails;
            content = (
                <>
                    <p><strong className="text-indigo-300">HP:</strong> {companion.hp}/{companion.maxHp}</p>
                    <p><strong className="text-indigo-300">ATK:</strong> {companion.atk}</p>
                    <p><strong className="text-indigo-300">Mô tả:</strong> {companion.description}</p>
                </>
            );
            break;
        }
         case 'faction': {
            const faction = entity as Faction;
            title = "Chi Tiết Phe Phái";
            content = (
                <div className="space-y-2">
                    <p><strong className="text-indigo-300">Tên Phe Phái:</strong> {faction.name}</p>
                    {faction.description && <p><strong className="text-indigo-300">Mô tả:</strong> {faction.description}</p>}
                    <p><strong className="text-indigo-300">Chính tà:</strong> {faction.alignment}</p>
                    <p><strong className="text-indigo-300">Uy tín người chơi:</strong> {String(faction.playerReputation)}</p>
                </div>
            );
            break;
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-2 text-sm">
                {content}
            </div>
        </Modal>
    );
};

export default EntityDetailModal;
