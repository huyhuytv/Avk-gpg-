
import { EquipmentSlotConfig } from '../types';
import * as GameTemplates from '../templates';
// VIETNAMESE object is not directly imported here for values,
// type 'keyof typeof VIETNAMESE' is handled in types.ts

export const EQUIPMENT_SLOTS_CONFIG: EquipmentSlotConfig[] = [
  { id: 'mainWeapon', labelKey: 'slotMainWeapon', accepts: [GameTemplates.EquipmentType.VU_KHI] },
  { id: 'offHandWeapon', labelKey: 'slotOffHandWeapon', accepts: [GameTemplates.EquipmentType.VU_KHI, GameTemplates.EquipmentType.PHAP_BAO] },
  { id: 'head', labelKey: 'slotHead', accepts: [GameTemplates.EquipmentType.GIAP_DAU] },
  { id: 'body', labelKey: 'slotBody', accepts: [GameTemplates.EquipmentType.GIAP_THAN] },
  { id: 'hands', labelKey: 'slotHands', accepts: [GameTemplates.EquipmentType.GIAP_TAY] },
  { id: 'legs', labelKey: 'slotLegs', accepts: [GameTemplates.EquipmentType.GIAP_CHAN] },
  { id: 'artifact', labelKey: 'slotArtifact', accepts: [GameTemplates.EquipmentType.PHAP_BAO] },
  { id: 'pet', labelKey: 'slotPet', accepts: [GameTemplates.EquipmentType.THU_CUNG] },
  { id: 'accessory1', labelKey: 'slotAccessory1', accepts: [GameTemplates.EquipmentType.TRANG_SUC] },
  { id: 'accessory2', labelKey: 'slotAccessory2', accepts: [GameTemplates.EquipmentType.TRANG_SUC] },
];
