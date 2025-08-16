import React, { useState } from 'react';
import { WorldSettings, StartingItem, Item } from '../../../../types';
import * as GameTemplates from '../../../../templates';
import { VIETNAMESE, STAT_POINT_VALUES, SPECIAL_EFFECT_KEYWORDS } from '../../../../constants';
import { calculateItemValue } from '../../../../utils/statsCalculationUtils';
import InputField from '../../../ui/InputField';
import Button from '../../../ui/Button';

interface ItemsSectionProps {
    settings: WorldSettings;
    handleStartingItemChange: (index: number, field: any, value: any) => void;
    addStartingItem: () => void;
    removeStartingItem: (index: number) => void;
}

const EquipmentEffectEditor: React.FC<{
    item: StartingItem;
    itemIndex: number;
    handleStartingItemChange: (index: number, field: any, value: any) => void;
}> = ({ item, itemIndex, handleStartingItemChange }) => {
    const [newStatBonus, setNewStatBonus] = useState({ stat: 'sucTanCong', value: '' });
    const [newEffect, setNewEffect] = useState({ type: 'hút máu', value: '', unit: '%', customText: '' });
    const [isCustomEffect, setIsCustomEffect] = useState(false);

    const statBonusOptions = Object.keys(STAT_POINT_VALUES);
    const effectOptions = Object.keys(SPECIAL_EFFECT_KEYWORDS);

    const handleAddStatBonus = () => {
        if (!newStatBonus.value || isNaN(Number(newStatBonus.value))) return;
        const currentBonuses = item.equipmentDetails?.statBonuses || {};
        const updatedBonuses = {
            ...currentBonuses,
            [newStatBonus.stat]: Number(newStatBonus.value)
        };
        handleStartingItemChange(itemIndex, 'equipmentDetails.statBonuses', updatedBonuses);
        setNewStatBonus({ stat: 'sucTanCong', value: '' });
    };

    const handleRemoveStatBonus = (statToRemove: string) => {
        const currentBonuses = { ...item.equipmentDetails?.statBonuses };
        delete (currentBonuses as any)[statToRemove];
        handleStartingItemChange(itemIndex, 'equipmentDetails.statBonuses', currentBonuses);
    };

    const handleAddEffect = () => {
        let effectString = '';
        if (isCustomEffect) {
            effectString = newEffect.customText.trim();
        } else {
            effectString = `${newEffect.type} ${newEffect.value}${newEffect.unit}`;
        }
        if (!effectString) return;

        const currentEffects = item.equipmentDetails?.uniqueEffects || [];
        const updatedEffects = [...currentEffects, effectString];
        handleStartingItemChange(itemIndex, 'equipmentDetails.uniqueEffects', updatedEffects);
        setNewEffect({ type: 'hút máu', value: '', unit: '%', customText: '' });
        setIsCustomEffect(false);
    };

    const handleRemoveEffect = (effectIndex: number) => {
        const currentEffects = [...(item.equipmentDetails?.uniqueEffects || [])];
        currentEffects.splice(effectIndex, 1);
        handleStartingItemChange(itemIndex, 'equipmentDetails.uniqueEffects', currentEffects);
    };

    return (
        <div className="space-y-4 mt-2 p-3 border border-gray-600 rounded-md bg-gray-800/50">
            {/* Stat Bonuses Editor */}
            <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Chỉ Số Cộng Thêm</h4>
                <div className="space-y-2 mb-2">
                    {item.equipmentDetails?.statBonuses && Object.entries(item.equipmentDetails.statBonuses).map(([stat, value]) => (
                        <div key={stat} className="flex items-center justify-between bg-gray-700/50 p-1.5 rounded-md text-xs">
                            <span>{stat}: <span className="font-bold text-green-400">{value > 0 ? `+${value}`: value}</span></span>
                            <Button size="sm" variant="danger" className="!p-1 !text-xs" onClick={() => handleRemoveStatBonus(stat)}>Xóa</Button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 items-end p-2 border-t border-gray-700/50">
                    <InputField label="" id={`new-stat-type-${itemIndex}`} type="select" options={statBonusOptions} value={newStatBonus.stat} onChange={e => setNewStatBonus(prev => ({ ...prev, stat: e.target.value }))} className="!mb-0 flex-grow" />
                    <InputField label="" id={`new-stat-value-${itemIndex}`} type="number" value={newStatBonus.value} onChange={e => setNewStatBonus(prev => ({ ...prev, value: e.target.value }))} placeholder="Giá trị" className="!mb-0 w-24" />
                    <Button size="sm" variant="secondary" onClick={handleAddStatBonus} className="h-9">+ Thêm</Button>
                </div>
            </div>

            {/* Unique Effects Editor */}
            <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Hiệu Ứng Đặc Biệt</h4>
                <div className="space-y-2 mb-2">
                    {(item.equipmentDetails?.uniqueEffects || []).map((effect, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700/50 p-1.5 rounded-md text-xs">
                            <span className="truncate pr-2">{effect}</span>
                            <Button size="sm" variant="danger" className="!p-1 !text-xs" onClick={() => handleRemoveEffect(index)}>Xóa</Button>
                        </div>
                    ))}
                </div>
                <div className="p-2 border-t border-gray-700/50 space-y-2">
                    <InputField type="checkbox" label="Tạo hiệu ứng tùy chỉnh (không có trong danh sách)" id={`custom-effect-toggle-${itemIndex}`} checked={isCustomEffect} onChange={e => setIsCustomEffect((e.target as HTMLInputElement).checked)} />
                    {isCustomEffect ? (
                        <InputField label="" id={`new-effect-custom-${itemIndex}`} value={newEffect.customText} onChange={e => setNewEffect(prev => ({ ...prev, customText: e.target.value }))} placeholder="Nhập hiệu ứng tùy chỉnh..." className="!mb-0 w-full" />
                    ) : (
                        <div className="flex gap-2 items-end">
                            <InputField label="" id={`new-effect-type-${itemIndex}`} type="select" options={effectOptions} value={newEffect.type} onChange={e => setNewEffect(prev => ({ ...prev, type: e.target.value }))} className="!mb-0 flex-grow" />
                            <InputField label="" id={`new-effect-value-${itemIndex}`} type="number" value={newEffect.value} onChange={e => setNewEffect(prev => ({ ...prev, value: e.target.value }))} placeholder="Giá trị" className="!mb-0 w-20" />
                            <InputField label="" id={`new-effect-unit-${itemIndex}`} type="select" options={['%', 'điểm', 'giây', 'lượt']} value={newEffect.unit} onChange={e => setNewEffect(prev => ({ ...prev, unit: e.target.value }))} className="!mb-0 w-20" />
                        </div>
                    )}
                    <Button size="sm" variant="secondary" onClick={handleAddEffect} className="w-full h-9">+ Thêm Hiệu Ứng</Button>
                </div>
            </div>
        </div>
    );
};

const ItemsSection: React.FC<ItemsSectionProps> = ({ settings, handleStartingItemChange, addStartingItem, removeStartingItem }) => {
    const realmProgressionList = (settings.raceCultivationSystems[0]?.realmSystem || '').split(' - ').map(s => s.trim()).filter(Boolean);

    const constructItemForCalc = (startingItem: StartingItem): Item => {
        const base = {
            id: `temp-${Math.random()}`, name: startingItem.name || 'Vật phẩm',
            description: startingItem.description || '', quantity: startingItem.quantity || 1,
            rarity: startingItem.rarity || GameTemplates.ItemRarity.PHO_THONG, value: 0,
            itemRealm: startingItem.itemRealm || 'Phàm Nhân',
            category: startingItem.category || GameTemplates.ItemCategory.MISCELLANEOUS,
        };

        switch(base.category) {
            case GameTemplates.ItemCategory.EQUIPMENT:
                return {
                    ...base, category: GameTemplates.ItemCategory.EQUIPMENT,
                    equipmentType: startingItem.equipmentDetails?.type || GameTemplates.EquipmentType.VU_KHI,
                    slot: startingItem.equipmentDetails?.slot,
                    statBonuses: startingItem.equipmentDetails?.statBonuses || {},
                    uniqueEffects: startingItem.equipmentDetails?.uniqueEffects || [],
                } as GameTemplates.EquipmentTemplate;
            default:
                return base as Item;
        }
    };

    return (
        <>
            {(settings.startingItems || []).map((item, index) => {
                const itemForCalc = constructItemForCalc(item);
                const estimatedValue = calculateItemValue(itemForCalc, realmProgressionList);
                return (
                    <div key={index} className="space-y-3 border-b border-gray-800 py-3">
                        <div className="space-y-2">
                            <InputField label={`${VIETNAMESE.itemNameLabel} ${index + 1}`} id={`itemName-${index}`} value={item.name} onChange={(e) => handleStartingItemChange(index, 'name', e.target.value)} />
                            <InputField label={VIETNAMESE.itemQuantityLabel} id={`itemQuantity-${index}`} type="number" value={item.quantity} onChange={(e) => handleStartingItemChange(index, 'quantity', parseInt(e.target.value, 10))} min={1} />
                            <InputField label={VIETNAMESE.itemTypeLabel} id={`itemCategory-${index}`} type="select"
                                options={Object.values(GameTemplates.ItemCategory)}
                                value={item.category} onChange={(e) => handleStartingItemChange(index, 'category', e.target.value as GameTemplates.ItemCategoryValues)} />
                        </div>
                        <InputField label={VIETNAMESE.itemDescriptionLabel} id={`itemDesc-${index}`} value={item.description} onChange={(e) => handleStartingItemChange(index, 'description', e.target.value)} textarea rows={2} />

                        {item.category === GameTemplates.ItemCategory.EQUIPMENT && (
                           <div className="space-y-2 mt-2 p-3 border border-gray-600 rounded-md bg-gray-800/50">
                                <InputField
                                    label="Loại Trang Bị" id={`equipmentType-${index}`} type="select"
                                    options={Object.values(GameTemplates.EquipmentType)} value={item.equipmentDetails?.type || ''}
                                    onChange={(e) => handleStartingItemChange(index, 'equipmentDetails.type', e.target.value)} />
                                <InputField
                                    label="Vị Trí Trang Bị" id={`equipmentSlot-${index}`} value={item.equipmentDetails?.slot || ''}
                                    onChange={(e) => handleStartingItemChange(index, 'equipmentDetails.slot', e.target.value)} placeholder="Vd: Vũ Khí Chính, Giáp Thân, Thú Cưng..." />
                                <InputField
                                    label="Độ Hiếm" id={`itemRarity-${index}`} type="select"
                                    options={Object.values(GameTemplates.ItemRarity)} value={item.rarity || ''}
                                    onChange={(e) => handleStartingItemChange(index, 'rarity', e.target.value)} />
                                <InputField
                                    label="Cảnh Giới Vật Phẩm" id={`itemRealm-${index}`} value={item.itemRealm || ''}
                                    onChange={(e) => handleStartingItemChange(index, 'itemRealm', e.target.value)} placeholder="Vd: Luyện Khí Kỳ, Phàm Phẩm..." />
                                <EquipmentEffectEditor item={item} itemIndex={index} handleStartingItemChange={handleStartingItemChange} />
                           </div>
                        )}
                        {item.category === GameTemplates.ItemCategory.POTION && (
                            <div className="space-y-2 mt-2 p-3 border border-gray-600 rounded-md bg-gray-800/50">
                                <InputField label="Loại Đan Dược" id={`potionType-${index}`} type="select" options={Object.values(GameTemplates.PotionType)} value={item.potionDetails?.type || ''} onChange={(e) => handleStartingItemChange(index, 'potionDetails.type', e.target.value)} />
                                <InputField label="Độ Hiếm" id={`potionRarity-${index}`} type="select" options={Object.values(GameTemplates.ItemRarity)} value={item.rarity || ''} onChange={(e) => handleStartingItemChange(index, 'rarity', e.target.value)} />
                                <InputField label="Cảnh Giới Vật Phẩm" id={`potionItemRealm-${index}`} value={item.itemRealm || ''} onChange={(e) => handleStartingItemChange(index, 'itemRealm', e.target.value)} placeholder="Vd: Luyện Khí Kỳ, Phàm Phẩm..." />
                                <InputField label="Hiệu Ứng (cách nhau bởi ';')" id={`potionEffects-${index}`} value={item.potionDetails?.effectsString || (item.potionDetails?.effects ? item.potionDetails.effects.join(';') : '')} onChange={(e) => handleStartingItemChange(index, 'potionDetails.effectsString', e.target.value)} placeholder="Hồi 100 HP;Tăng 20 ATK" textarea rows={2}/>
                                <InputField label="Thời Gian Hiệu Lực (lượt)" id={`potionDuration-${index}`} type="number" value={item.potionDetails?.durationTurns || 0} onChange={(e) => handleStartingItemChange(index, 'potionDetails.durationTurns', parseInt(e.target.value, 10))} />
                                <InputField label="Thời Gian Hồi (lượt)" id={`potionCooldown-${index}`} type="number" value={item.potionDetails?.cooldownTurns || 0} onChange={(e) => handleStartingItemChange(index, 'potionDetails.cooldownTurns', parseInt(e.target.value, 10))} />
                            </div>
                        )}
                        {item.category === GameTemplates.ItemCategory.MATERIAL && (
                            <div className="space-y-2 mt-2 p-3 border border-gray-600 rounded-md bg-gray-800/50">
                                <InputField label="Loại Nguyên Liệu" id={`materialType-${index}`} type="select" options={Object.values(GameTemplates.MaterialType)} value={item.materialDetails?.type || ''} onChange={(e) => handleStartingItemChange(index, 'materialDetails.type', e.target.value)} />
                                <InputField label="Độ Hiếm" id={`materialRarity-${index}`} type="select" options={Object.values(GameTemplates.ItemRarity)} value={item.rarity || ''} onChange={(e) => handleStartingItemChange(index, 'rarity', e.target.value)} />
                                <InputField label="Cảnh Giới Vật Phẩm" id={`materialItemRealm-${index}`} value={item.itemRealm || ''} onChange={(e) => handleStartingItemChange(index, 'itemRealm', e.target.value)} placeholder="Vd: Luyện Khí Kỳ, Phàm Phẩm..." />
                            </div>
                        )}
                        {item.category === GameTemplates.ItemCategory.QUEST_ITEM && (
                            <div className="space-y-2 mt-2 p-3 border border-gray-600 rounded-md bg-gray-800/50">
                                <InputField label="ID Nhiệm Vụ Liên Quan" id={`questItemId-${index}`} value={item.questItemDetails?.questIdAssociated || ''} onChange={(e) => handleStartingItemChange(index, 'questItemDetails.questIdAssociated', e.target.value)} />
                                <InputField label="Độ Hiếm" id={`questRarity-${index}`} type="select" options={Object.values(GameTemplates.ItemRarity)} value={item.rarity || ''} onChange={(e) => handleStartingItemChange(index, 'rarity', e.target.value)} />
                                <InputField label="Cảnh Giới Vật Phẩm" id={`questItemRealm-${index}`} value={item.itemRealm || ''} onChange={(e) => handleStartingItemChange(index, 'itemRealm', e.target.value)} placeholder="Vd: Luyện Khí Kỳ, Phàm Phẩm..." />
                            </div>
                        )}
                         {item.category === GameTemplates.ItemCategory.CONG_PHAP && (
                            <div className="space-y-2 mt-2 p-3 border border-gray-600 rounded-md bg-gray-800/50">
                                <InputField label="Loại Công Pháp" id={`congPhapType-${index}`} type="select" options={Object.values(GameTemplates.CongPhapType)} value={item.congPhapDetails?.congPhapType || ''} onChange={(e) => handleStartingItemChange(index, 'congPhapDetails.congPhapType', e.target.value)} />
                                <InputField label="% Kinh nghiệm thưởng thêm" id={`congPhapExpBonus-${index}`} type="number" value={item.congPhapDetails?.expBonusPercentage || 0} onChange={(e) => handleStartingItemChange(index, 'congPhapDetails.expBonusPercentage', parseInt(e.target.value, 10))} />
                                <InputField label="Độ Hiếm" id={`congPhapRarity-${index}`} type="select" options={Object.values(GameTemplates.ItemRarity)} value={item.rarity || ''} onChange={(e) => handleStartingItemChange(index, 'rarity', e.target.value)} />
                                <InputField label="Cảnh Giới Vật Phẩm" id={`congPhapItemRealm-${index}`} value={item.itemRealm || ''} onChange={(e) => handleStartingItemChange(index, 'itemRealm', e.target.value)} placeholder="Vd: Luyện Khí Kỳ, Phàm Phẩm..." />
                            </div>
                        )}
                        {item.category === GameTemplates.ItemCategory.LINH_KI && (
                            <div className="space-y-2 mt-2 p-3 border border-gray-600 rounded-md bg-gray-800/50">
                                <InputField label="Kỹ Năng Để Học (JSON)" id={`linhKiSkillJSON-${index}`} value={item.linhKiDetails?.skillToLearnJSON || ''} onChange={(e) => handleStartingItemChange(index, 'linhKiDetails.skillToLearnJSON', e.target.value)} textarea rows={4} placeholder='{"name":"Tên Skill", "description":"Mô tả", ...}' />
                                <InputField label="Độ Hiếm" id={`linhKiRarity-${index}`} type="select" options={Object.values(GameTemplates.ItemRarity)} value={item.rarity || ''} onChange={(e) => handleStartingItemChange(index, 'rarity', e.target.value)} />
                                <InputField label="Cảnh Giới Vật Phẩm" id={`linhKiItemRealm-${index}`} value={item.itemRealm || ''} onChange={(e) => handleStartingItemChange(index, 'itemRealm', e.target.value)} placeholder="Vd: Luyện Khí Kỳ, Phàm Phẩm..." />
                            </div>
                        )}
                        {item.category === GameTemplates.ItemCategory.PROFESSION_SKILL_BOOK && (
                            <div className="space-y-2 mt-2 p-3 border border-gray-600 rounded-md bg-gray-800/50">
                                <InputField label="Nghề để học" id={`profBookType-${index}`} type="select" options={Object.values(GameTemplates.ProfessionType)} value={item.professionSkillBookDetails?.professionToLearn || ''} onChange={(e) => handleStartingItemChange(index, 'professionSkillBookDetails.professionToLearn', e.target.value)} />
                                <InputField label="Độ Hiếm" id={`profBookRarity-${index}`} type="select" options={Object.values(GameTemplates.ItemRarity)} value={item.rarity || ''} onChange={(e) => handleStartingItemChange(index, 'rarity', e.target.value)} />
                                <InputField label="Cảnh Giới Vật Phẩm" id={`profBookItemRealm-${index}`} value={item.itemRealm || ''} onChange={(e) => handleStartingItemChange(index, 'itemRealm', e.target.value)} placeholder="Vd: Luyện Khí Kỳ, Phàm Phẩm..." />
                            </div>
                        )}
                        {item.category === GameTemplates.ItemCategory.PROFESSION_TOOL && (
                            <div className="space-y-2 mt-2 p-3 border border-gray-600 rounded-md bg-gray-800/50">
                                <InputField label="Yêu cầu nghề" id={`profToolType-${index}`} type="select" options={Object.values(GameTemplates.ProfessionType)} value={item.professionToolDetails?.professionRequired || ''} onChange={(e) => handleStartingItemChange(index, 'professionToolDetails.professionRequired', e.target.value)} />
                                <InputField label="Độ Hiếm" id={`profToolRarity-${index}`} type="select" options={Object.values(GameTemplates.ItemRarity)} value={item.rarity || ''} onChange={(e) => handleStartingItemChange(index, 'rarity', e.target.value)} />
                                <InputField label="Cảnh Giới Vật Phẩm" id={`profToolItemRealm-${index}`} value={item.itemRealm || ''} onChange={(e) => handleStartingItemChange(index, 'itemRealm', e.target.value)} placeholder="Vd: Luyện Khí Kỳ, Phàm Phẩm..." />
                            </div>
                        )}
                        {item.category === GameTemplates.ItemCategory.MISCELLANEOUS && (
                            <div className="space-y-2 mt-2 p-3 border border-gray-600 rounded-md bg-gray-800/50">
                                <InputField label="Có thể sử dụng?" id={`miscUsable-${index}`} type="checkbox" checked={item.miscDetails?.usable || false} onChange={(e) => handleStartingItemChange(index, 'miscDetails.usable', (e.target as HTMLInputElement).checked)} />
                                <InputField label="Có thể tiêu hao?" id={`miscConsumable-${index}`} type="checkbox" checked={item.miscDetails?.consumable || false} onChange={(e) => handleStartingItemChange(index, 'miscDetails.consumable', (e.target as HTMLInputElement).checked)} />
                                <InputField label="Độ Hiếm" id={`miscRarity-${index}`} type="select" options={Object.values(GameTemplates.ItemRarity)} value={item.rarity || ''} onChange={(e) => handleStartingItemChange(index, 'rarity', e.target.value)} />
                                <InputField label="Cảnh Giới Vật Phẩm" id={`miscItemRealm-${index}`} value={item.itemRealm || ''} onChange={(e) => handleStartingItemChange(index, 'itemRealm', e.target.value)} placeholder="Vd: Luyện Khí Kỳ, Phàm Phẩm..." />
                            </div>
                        )}
                        
                        {/* Estimated Value Display */}
                        <div className="mt-2 p-2 bg-gray-800 rounded-md border border-gray-700">
                            <p className="text-sm text-gray-300">
                                <span className="font-semibold text-amber-400">Giá Trị Ước Tính:</span>
                                <span className="ml-2 font-bold text-lg text-white">{estimatedValue.toLocaleString()} {settings.currencyName}</span>
                            </p>
                        </div>

                        <div className="text-right mt-2">
                        <Button variant="danger" size="sm" onClick={() => removeStartingItem(index)}>{VIETNAMESE.removeItem}</Button>
                        </div>
                    </div>
                );
            })}
            <Button onClick={addStartingItem} variant="secondary" size="sm" className="mt-3">{VIETNAMESE.addStartingItem}</Button>
        </>
    );
};

export default ItemsSection;
