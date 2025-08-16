import React from 'react';
import { WorldSettings, StartingNPC, TuChatTier, TU_CHAT_TIERS } from '../../../../types';
import { VIETNAMESE } from '../../../../constants';
import InputField from '../../../ui/InputField';
import Button from '../../../ui/Button';

interface NpcsSectionProps {
  settings: WorldSettings;
  handleStartingNPCChange: (index: number, field: keyof StartingNPC, value: string | number | undefined) => void;
  addStartingNPC: () => void;
  removeStartingNPC: (index: number) => void;
}

const NpcsSection: React.FC<NpcsSectionProps> = ({ settings, handleStartingNPCChange, addStartingNPC, removeStartingNPC }) => {
  return (
    <>
      {(settings.startingNPCs || []).map((npc, index) => (
        <div key={index} className="space-y-2 border-b border-gray-800 py-3">
          <InputField label={`${VIETNAMESE.npcNameLabel} ${index + 1}`} id={`npcName-${index}`} value={npc.name} onChange={(e) => handleStartingNPCChange(index, 'name', e.target.value)} />
          <InputField 
            label={VIETNAMESE.npcGenderLabel} 
            id={`npcGender-${index}`} 
            type="select" 
            options={['Không rõ', 'Nam', 'Nữ', 'Khác']} 
            value={npc.gender || 'Không rõ'} 
            onChange={(e) => handleStartingNPCChange(index, 'gender', e.target.value)} 
          />
          <InputField
            label="Chủng Tộc"
            id={`npcRace-${index}`}
            value={npc.race || ''}
            onChange={(e) => handleStartingNPCChange(index, 'race', e.target.value)}
            placeholder="Nhân Tộc, Yêu Tộc, Ma Tộc..."
          />
          <InputField label={VIETNAMESE.npcPersonalityLabel} id={`npcPersonality-${index}`} value={npc.personality} onChange={(e) => handleStartingNPCChange(index, 'personality', e.target.value)} />
          <InputField label={VIETNAMESE.npcAffinityLabel} id={`npcAffinity-${index}`} type="number" value={npc.initialAffinity} onChange={(e) => handleStartingNPCChange(index, 'initialAffinity', parseInt(e.target.value, 10))} min={-100} max={100} />
          {settings.isCultivationEnabled && (
            <>
              <InputField 
                label={VIETNAMESE.npcRealmLabel} 
                id={`npcRealm-${index}`} 
                value={npc.realm || ''} 
                onChange={(e) => handleStartingNPCChange(index, 'realm', e.target.value)} 
                placeholder="Vd: Luyện Khí Kỳ, Trúc Cơ Viên Mãn" 
              />
              <InputField 
                label={VIETNAMESE.npcTuChatLabel || "Tư Chất NPC"}
                id={`npcTuChat-${index}`}
                type="select"
                options={TU_CHAT_TIERS as unknown as string[]}
                value={npc.tuChat || "Trung Đẳng"}
                onChange={(e) => handleStartingNPCChange(index, 'tuChat', e.target.value as TuChatTier)}
              />
              <p className="text-xs text-gray-400 -mt-3 mb-2">{VIETNAMESE.tuChatNote || "Tư chất quyết định tốc độ tu luyện của NPC. Thần Phẩm là cao nhất, Phế Phẩm là thấp nhất."}</p>
               <InputField
                    label="Linh Căn NPC (Tùy chọn)"
                    id={`npcSpiritualRoot-${index}`}
                    value={npc.spiritualRoot || ''}
                    onChange={(e) => handleStartingNPCChange(index, 'spiritualRoot', e.target.value)}
                    placeholder="Vd: Ngũ Hành Tạp Linh Căn"
                />
                <InputField
                    label="Thể Chất NPC (Tùy chọn)"
                    id={`npcSpecialPhysique-${index}`}
                    value={npc.specialPhysique || ''}
                    onChange={(e) => handleStartingNPCChange(index, 'specialPhysique', e.target.value)}
                    placeholder="Vd: Phàm Thể, Tiên Thiên Đạo Thể"
                />
                <InputField
                    label={VIETNAMESE.playerThoNguyenLabel || "Thọ Nguyên Còn Lại"}
                    id={`npcThoNguyen-${index}`}
                    type="number"
                    value={npc.thoNguyen ?? ''}
                    onChange={(e) => handleStartingNPCChange(index, 'thoNguyen', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    min={1}
                />
                <InputField
                    label={VIETNAMESE.playerMaxThoNguyenLabel || "Thọ Nguyên Tối Đa"}
                    id={`npcMaxThoNguyen-${index}`}
                    type="number"
                    value={npc.maxThoNguyen ?? ''}
                    onChange={(e) => handleStartingNPCChange(index, 'maxThoNguyen', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    min={1}
                />
            </>
          )}
          <InputField label={VIETNAMESE.npcDetailsLabel} id={`npcDetails-${index}`} value={npc.details} onChange={(e) => handleStartingNPCChange(index, 'details', e.target.value)} textarea rows={2} />
          <InputField
            label={VIETNAMESE.npcRelationshipLabel}
            id={`npcRelationship-${index}`}
            value={npc.relationshipToPlayer || ''}
            onChange={(e) => handleStartingNPCChange(index, 'relationshipToPlayer', e.target.value)}
            placeholder={VIETNAMESE.npcRelationshipPlaceholder}
          />
          <div className="text-right mt-2">
            <Button variant="danger" size="sm" onClick={() => removeStartingNPC(index)}>{VIETNAMESE.removeNPC}</Button>
          </div>
        </div>
      ))}
      <Button onClick={addStartingNPC} variant="secondary" size="sm" className="mt-3">{VIETNAMESE.addStartingNPC}</Button>
    </>
  );
};

export default NpcsSection;
