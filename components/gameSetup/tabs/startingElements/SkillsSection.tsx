
import React from 'react';
import { WorldSettings, StartingSkill, SkillTypeValues } from '../../../../types';
import * as GameTemplates from '../../../../templates';
import { VIETNAMESE, WEAPON_TYPES_FOR_VO_Y } from '../../../../constants';
import InputField from '../../../ui/InputField';
import Button from '../../../ui/Button';

interface SkillsSectionProps {
  settings: WorldSettings;
  handleStartingSkillChange: (index: number, field: string, value: any) => void;
  addStartingSkill: (type: SkillTypeValues) => void;
  removeStartingSkill: (index: number) => void;
}

const renderCombatSkillFields = (
    skill: StartingSkill, 
    index: number, 
    handleStartingSkillChange: (index: number, field: string, value: any) => void
) => {
    return (
        <div className="grid grid-cols-2 gap-x-4 mt-2">
            <InputField label="Sát thương cơ bản" type="number" id={`baseDamage-${index}`} value={skill.baseDamage ?? ''} onChange={(e) => handleStartingSkillChange(index, 'baseDamage', e.target.value === '' ? undefined : parseInt(e.target.value))} />
            <InputField label="Hồi phục cơ bản" type="number" id={`baseHealing-${index}`} value={skill.baseHealing ?? ''} onChange={(e) => handleStartingSkillChange(index, 'baseHealing', e.target.value === '' ? undefined : parseInt(e.target.value))} />
            <InputField label="Sát thương theo % ATK" type="number" id={`damageMultiplier-${index}`} value={skill.damageMultiplier ?? ''} onChange={(e) => handleStartingSkillChange(index, 'damageMultiplier', e.target.value === '' ? undefined : parseFloat(e.target.value))} step="0.01" placeholder="Ví dụ: 0.5 cho 50%" />
            <InputField label="Hồi phục theo % ATK" type="number" id={`healingMultiplier-${index}`} value={skill.healingMultiplier ?? ''} onChange={(e) => handleStartingSkillChange(index, 'healingMultiplier', e.target.value === '' ? undefined : parseFloat(e.target.value))} step="0.01" placeholder="Ví dụ: 0.2 cho 20%" />
            <InputField label="Linh lực tiêu hao" type="number" id={`manaCost-${index}`} value={skill.manaCost ?? ''} onChange={(e) => handleStartingSkillChange(index, 'manaCost', e.target.value === '' ? undefined : parseInt(e.target.value))} />
            <InputField label="Hồi chiêu (lượt)" type="number" id={`cooldown-${index}`} value={skill.cooldown ?? ''} onChange={(e) => handleStartingSkillChange(index, 'cooldown', e.target.value === '' ? undefined : parseInt(e.target.value))} />
            <InputField 
                label="Hiệu ứng đặc biệt (;)" 
                id={`specialEffects-${index}`} 
                className="col-span-2" 
                value={skill.specialEffects || ''} 
                onChange={(e) => handleStartingSkillChange(index, 'specialEffects', e.target.value)} 
                placeholder="Vd: Gây bỏng; Làm chậm 20%" 
            />
        </div>
    );
};

const renderSkillSubSection = (
    settings: WorldSettings,
    title: string,
    skillType: GameTemplates.SkillTypeValues,
    renderDetails: (skill: StartingSkill, index: number) => React.ReactNode | null,
    handleStartingSkillChange: (index: number, field: string, value: any) => void,
    addStartingSkill: (type: GameTemplates.SkillTypeValues) => void,
    removeStartingSkill: (index: number) => void
  ) => {
    const filteredSkills = (settings.startingSkills || [])
        .map((skill, index) => ({ ...skill, originalIndex: index }))
        .filter(skill => skill.skillType === skillType);

    return (
        <div className="pl-2 py-2">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold text-indigo-300">{title} ({filteredSkills.length})</h4>
                <Button onClick={() => addStartingSkill(skillType)} variant="ghost" size="sm" className="!p-1.5 text-xs">+ Thêm</Button>
            </div>
            {filteredSkills.length > 0 && (
                <div className="space-y-4 ml-2 pl-3 border-l-2 border-gray-800">
                    {filteredSkills.map(skill => (
                        <div key={skill.originalIndex} className="space-y-3 border-t border-gray-700/50 pt-3">
                            <InputField 
                                label={VIETNAMESE.skillNameLabel} 
                                id={`skillName-${skill.originalIndex}`} 
                                value={skill.name} 
                                onChange={(e) => handleStartingSkillChange(skill.originalIndex, 'name', e.target.value)} 
                            />
                             <InputField
                                label="Loại Kỹ Năng"
                                id={`skillType-${skill.originalIndex}`}
                                type="select"
                                options={Object.values(GameTemplates.SkillType)}
                                value={skill.skillType || ''}
                                onChange={(e) => handleStartingSkillChange(skill.originalIndex, 'skillType', e.target.value as SkillTypeValues)}
                            />
                            <InputField 
                                label={VIETNAMESE.skillDescriptionLabel} 
                                id={`skillDesc-${skill.originalIndex}`} 
                                value={skill.description} 
                                onChange={(e) => handleStartingSkillChange(skill.originalIndex, 'description', e.target.value)} 
                                textarea 
                                rows={2} 
                            />
                            {renderDetails(skill, skill.originalIndex)}
                            <div className="text-right">
                                <Button variant="danger" size="sm" onClick={() => removeStartingSkill(skill.originalIndex)}>
                                    {VIETNAMESE.removeSkill}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

const SkillsSection: React.FC<SkillsSectionProps> = ({ settings, handleStartingSkillChange, addStartingSkill, removeStartingSkill }) => {
    return (
        <div className="space-y-2 divide-y divide-gray-700">
            {renderSkillSubSection(
                settings,
                "Công Pháp Tu Luyện",
                GameTemplates.SkillType.CONG_PHAP_TU_LUYEN,
                (skill, index) => (
                    <div className="pl-4 border-l-2 border-green-700/50 space-y-2 mt-2">
                        <InputField label="Loại Công Pháp" id={`congPhapType-${index}`} type="select" options={Object.values(GameTemplates.CongPhapType)} value={skill.congPhapDetails?.type || ''} onChange={(e) => handleStartingSkillChange(index, 'congPhapDetails.type', e.target.value)} />
                        {skill.congPhapDetails?.type === GameTemplates.CongPhapType.VO_Y && (
                            <InputField 
                                label="Chuyên Tu Vũ Khí" 
                                id={`weaponFocus-${index}`} 
                                type="select" 
                                options={[...WEAPON_TYPES_FOR_VO_Y]} 
                                value={skill.congPhapDetails?.weaponFocus || ''} 
                                onChange={(e) => handleStartingSkillChange(index, 'congPhapDetails.weaponFocus', e.target.value)} 
                            />
                        )}
                        <InputField label="Phẩm Chất Công Pháp" id={`congPhapGrade-${index}`} type="select" options={[...GameTemplates.CONG_PHAP_GRADES]} value={skill.congPhapDetails?.grade || ''} onChange={(e) => handleStartingSkillChange(index, 'congPhapDetails.grade', e.target.value)} />
                        <InputField 
                            label="Hiệu ứng đặc biệt (;)" 
                            id={`specialEffects-congphap-${index}`} 
                            value={skill.specialEffects || ''} 
                            onChange={(e) => handleStartingSkillChange(index, 'specialEffects', e.target.value)} 
                            textarea
                            rows={2}
                            placeholder="Vd: Tăng tốc độ tu luyện, giảm tiêu hao linh lực" 
                        />
                    </div>
                ),
                handleStartingSkillChange, addStartingSkill, removeStartingSkill
            )}
            {renderSkillSubSection(
                settings,
                "Linh Kĩ",
                GameTemplates.SkillType.LINH_KI,
                (skill, index) => (
                    <div className="pl-4 border-l-2 border-sky-700/50 space-y-2 mt-2">
                        <InputField label="Phân Loại Linh Kĩ" id={`linhKiCategory-${index}`} type="select" options={['', ...GameTemplates.LINH_KI_CATEGORIES]} value={skill.linhKiDetails?.category || ''} onChange={(e) => handleStartingSkillChange(index, 'linhKiDetails.category', e.target.value)} />
                        <InputField label="Loại Kích Hoạt" id={`linhKiActivation-${index}`} type="select" options={['', ...GameTemplates.LINH_KI_ACTIVATION_TYPES]} value={skill.linhKiDetails?.activation || ''} onChange={(e) => handleStartingSkillChange(index, 'linhKiDetails.activation', e.target.value)} />
                        
                        {skill.linhKiDetails?.activation === 'Chủ động' && renderCombatSkillFields(skill, index, handleStartingSkillChange)}
                        
                        {skill.linhKiDetails?.activation === 'Bị động' && (
                            <InputField 
                                label="Hiệu ứng đặc biệt (;)" 
                                id={`specialEffects-linhki-passive-${index}`} 
                                value={skill.specialEffects || ''} 
                                onChange={(e) => handleStartingSkillChange(index, 'specialEffects', e.target.value)} 
                                textarea
                                rows={2}
                                placeholder="Vd: Tăng 10% phòng thủ, tự hồi HP mỗi lượt" 
                            />
                        )}
                    </div>
                ),
                handleStartingSkillChange, addStartingSkill, removeStartingSkill
            )}
            {renderSkillSubSection(
                settings,
                "Thần Thông",
                GameTemplates.SkillType.THAN_THONG,
                 (skill, index) => (
                    <div className="pl-4 border-l-2 border-purple-700/50 space-y-2 mt-2">
                        {renderCombatSkillFields(skill, index, handleStartingSkillChange)}
                    </div>
                ),
                handleStartingSkillChange, addStartingSkill, removeStartingSkill
            )}
            {renderSkillSubSection(
                settings,
                "Cấm Thuật",
                GameTemplates.SkillType.CAM_THUAT,
                (skill, index) => (
                    <div className="pl-4 border-l-2 border-red-700/50 space-y-2 mt-2">
                        <InputField 
                            label="Tác Dụng Phụ" 
                            id={`camThuatSideEffects-${index}`} 
                            value={skill.camThuatDetails?.sideEffects || ''} 
                            onChange={(e) => handleStartingSkillChange(index, 'camThuatDetails.sideEffects', e.target.value)} 
                            textarea 
                            rows={2}
                            placeholder="Vd: Giảm tuổi thọ, mất đi một phần tu vi, bị tâm ma quấy nhiễu..."
                        />
                         {renderCombatSkillFields(skill, index, handleStartingSkillChange)}
                    </div>
                ),
                handleStartingSkillChange, addStartingSkill, removeStartingSkill
            )}
            {renderSkillSubSection(
                settings,
                "Nghề Nghiệp",
                GameTemplates.SkillType.NGHE_NGHIEP,
                (skill, index) => (
                    <div className="pl-4 border-l-2 border-yellow-700/50 space-y-2 mt-2">
                        <InputField label="Nghề Nghiệp" id={`professionType-${index}`} type="select" options={Object.values(GameTemplates.ProfessionType)} value={skill.professionDetails?.type || ''} onChange={(e) => handleStartingSkillChange(index, 'professionDetails.type', e.target.value)} />
                        {skill.professionDetails?.type && (
                            <InputField label="Mô tả Kỹ năng Nghề" id={`professionSkillDesc-${index}`} value={skill.professionDetails?.skillDescription || ''} onChange={(e) => handleStartingSkillChange(index, 'professionDetails.skillDescription', e.target.value)} textarea rows={2} placeholder="Mô tả kỹ năng cụ thể của nghề này..." />
                        )}
                        <InputField label="Cấp Bậc Kỹ Năng Nghề" id={`professionGrade-${index}`} type="select" options={[...GameTemplates.PROFESSION_GRADES]} value={skill.professionDetails?.grade || ''} onChange={(e) => handleStartingSkillChange(index, 'professionDetails.grade', e.target.value)} />
                         <InputField 
                            label="Hiệu ứng đặc biệt (;)" 
                            id={`specialEffects-nghenghiep-${index}`} 
                            value={skill.specialEffects || ''} 
                            onChange={(e) => handleStartingSkillChange(index, 'specialEffects', e.target.value)} 
                            textarea
                            rows={2}
                            placeholder="Vd: Tăng tỷ lệ thành công, giảm thời gian chế tạo" 
                        />
                    </div>
                ),
                handleStartingSkillChange, addStartingSkill, removeStartingSkill
            )}
             {renderSkillSubSection(
                settings,
                "Khác",
                GameTemplates.SkillType.KHAC,
                (skill, index) => (
                    <div className="pl-4 border-l-2 border-gray-600/50 space-y-2 mt-2">
                        <InputField
                            label="Hiệu ứng đặc biệt (;)"
                            id={`specialEffects-khac-${index}`}
                            value={skill.specialEffects || ''}
                            onChange={(e) => handleStartingSkillChange(index, 'specialEffects', e.target.value)}
                            textarea
                            rows={2}
                            placeholder="Vd: Tăng chỉ số ẩn, mở khóa lựa chọn đặc biệt"
                        />
                    </div>
                ),
                handleStartingSkillChange, addStartingSkill, removeStartingSkill
            )}
        </div>
    );
};

export default SkillsSection;
