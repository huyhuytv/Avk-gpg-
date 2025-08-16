import React, { ChangeEvent, useState } from 'react';
import { WorldSettings, NsfwDescriptionStyle, ViolenceLevel, StoryTone, RaceCultivationSystem } from '../../../types'; // Adjusted path if needed
import InputField from '../../ui/InputField';
import Button from '../../ui/Button';
import { VIETNAMESE, AVAILABLE_GENRES, CUSTOM_GENRE_VALUE, NSFW_DESCRIPTION_STYLES, DEFAULT_NSFW_DESCRIPTION_STYLE, VIOLENCE_LEVELS, DEFAULT_VIOLENCE_LEVEL, STORY_TONES, DEFAULT_STORY_TONE } from '../../../constants'; // Adjusted path
import CollapsibleSection from './startingElements/CollapsibleSection';

interface WorldSettingsTabProps {
  settings: WorldSettings;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleRaceSystemChange: (index: number, field: keyof Omit<RaceCultivationSystem, 'id'>, value: string) => void;
  addRaceSystem: () => void;
  removeRaceSystem: (id: string) => void;
}

const WorldSettingsTab: React.FC<WorldSettingsTabProps> = ({ 
  settings, 
  handleChange,
  handleRaceSystemChange,
  addRaceSystem,
  removeRaceSystem
}) => {
  const [isRaceSystemsOpen, setIsRaceSystemsOpen] = useState(true);

  // Helper to create options for select, ensuring labels are correctly fetched from VIETNAMESE
  const createSelectOptions = <T extends string>(
    stylesArray: readonly T[],
    defaultStyle: T,
    labelPrefixKey: 'nsfwStyle' | 'violenceLevel' | 'storyTone'
  ): Array<{ value: T; label: string }> => {
    return stylesArray.map(style => {
      // Construct the key for VIETNAMESE object, e.g., nsfwStyleHoaMy, violenceLevelNheNhang
      // Sanitize style string to match potential VIETNAMESE keys (remove spaces, parentheses, etc.)
      const styleKeyPart = style
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/\s+/g, '') // Remove spaces
        .replace(/[()'+]/g, ''); // Remove parentheses and other special chars like +
      const labelKey = `${labelPrefixKey}${styleKeyPart}` as keyof typeof VIETNAMESE;
      const labelValue = VIETNAMESE[labelKey];
      return { value: style, label: (typeof labelValue === 'string' ? labelValue : style) };
    });
  };

  const nsfwStyleOptions = createSelectOptions(NSFW_DESCRIPTION_STYLES, DEFAULT_NSFW_DESCRIPTION_STYLE, 'nsfwStyle');
  const violenceLevelOptions = createSelectOptions(VIOLENCE_LEVELS, DEFAULT_VIOLENCE_LEVEL, 'violenceLevel');
  const storyToneOptions = createSelectOptions(STORY_TONES, DEFAULT_STORY_TONE, 'storyTone');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <InputField
        label={VIETNAMESE.saveGameNameLabel}
        id="saveGameNameTabWorldSettings" // Unique ID
        name="saveGameName"
        value={settings.saveGameName}
        onChange={handleChange}
        placeholder={settings.playerName ? VIETNAMESE.saveGameNamePlaceholder.replace("[Tên Nhân Vật]", settings.playerName) : VIETNAMESE.saveGameNamePlaceholder.replace(" [Tên Nhân Vật]", "")}
      />
      <InputField 
        label={VIETNAMESE.worldTheme} 
        id="themeTabWorldSettings" // Unique ID
        name="theme" 
        value={settings.theme} 
        onChange={handleChange} 
      />
      <InputField 
        label={VIETNAMESE.genreLabel} 
        id="genreTabWorldSettings" // Unique ID
        name="genre" 
        type="select" 
        options={AVAILABLE_GENRES as unknown as string[]} 
        value={settings.genre} 
        onChange={handleChange} 
      />
      {settings.genre === CUSTOM_GENRE_VALUE && (
        <InputField
          label={VIETNAMESE.customGenreNameLabel}
          id="customGenreNameTabWorldSettings" // Unique ID
          name="customGenreName"
          value={settings.customGenreName || ''}
          onChange={handleChange}
          placeholder={VIETNAMESE.customGenreNamePlaceholder}
        />
      )}
      <InputField 
        label={VIETNAMESE.worldSetting} 
        id="settingDescriptionTabWorldSettings" // Unique ID
        name="settingDescription" 
        value={settings.settingDescription} 
        onChange={handleChange} 
        textarea 
        rows={3} 
      />
      <InputField 
        label={VIETNAMESE.writingStyle} 
        id="writingStyleTabWorldSettings" // Unique ID
        name="writingStyle" 
        value={settings.writingStyle} 
        onChange={handleChange} 
        textarea 
      />
      <InputField 
        label={VIETNAMESE.difficultyLabel} 
        id="difficultyTabWorldSettings" // Unique ID
        name="difficulty" 
        type="select" 
        options={['Dễ', 'Thường', 'Khó', 'Ác Mộng']} 
        value={settings.difficulty} 
        onChange={handleChange} 
      />
      <InputField
          label={VIETNAMESE.currencyName}
          id="currencyNameTabWorldSettings"
          name="currencyName"
          value={settings.currencyName}
          onChange={handleChange}
      />
      
      {/* Starting Date */}
      <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-x-4 border-t border-gray-700 pt-4 mt-2">
        <InputField
            label="Ngày Bắt Đầu"
            id="startingDay"
            name="startingDate.day"
            type="number"
            value={settings.startingDate.day}
            onChange={handleChange}
            min={1}
            max={30}
        />
        <InputField
            label="Tháng Bắt Đầu"
            id="startingMonth"
            name="startingDate.month"
            type="number"
            value={settings.startingDate.month}
            onChange={handleChange}
            min={1}
            max={12}
        />
        <InputField
            label="Năm Bắt Đầu"
            id="startingYear"
            name="startingDate.year"
            type="number"
            value={settings.startingDate.year}
            onChange={handleChange}
            min={1}
        />
        <InputField
            label="Giờ"
            id="startingHour"
            name="startingDate.hour"
            type="number"
            value={settings.startingDate.hour}
            onChange={handleChange}
            min={0}
            max={23}
        />
        <InputField
            label="Phút"
            id="startingMinute"
            name="startingDate.minute"
            type="number"
            value={settings.startingDate.minute}
            onChange={handleChange}
            min={0}
            max={59}
        />
      </div>

      {/* NSFW Settings Section */}
      <div className="md:col-span-2 border-t border-gray-700 pt-4">
        <InputField
          label={VIETNAMESE.nsfwModeLabel}
          id="nsfwModeWorldSettingsTab" // Unique ID for this tab
          name="nsfwMode"
          type="checkbox"
          checked={settings.nsfwMode || false}
          onChange={handleChange}
          className="mb-3" // Add some margin below the checkbox
        />
        {settings.nsfwMode && (
          <div className="pl-4 mt-1 space-y-3 border-l-2 border-red-500/50 rounded-r-md bg-gray-800/20 py-3"> {/* Visual grouping for NSFW sub-settings */}
            <InputField
              label={VIETNAMESE.nsfwDescriptionStyleLabel}
              id="nsfwDescriptionStyleWorldSettingsTab"
              name="nsfwDescriptionStyle"
              type="select"
              options={nsfwStyleOptions.map(opt => opt.label)} // Pass labels for display
              value={nsfwStyleOptions.find(opt => opt.value === (settings.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE))?.label || nsfwStyleOptions[0].label}
              onChange={(e) => {
                const selectedLabel = e.target.value;
                // Find the actual value corresponding to the selected label
                const selectedValue = nsfwStyleOptions.find(opt => opt.label === selectedLabel)?.value || DEFAULT_NSFW_DESCRIPTION_STYLE;
                handleChange({ target: { name: 'nsfwDescriptionStyle', value: selectedValue } } as any);
              }}
            />
            <InputField
              label={VIETNAMESE.violenceLevelLabel}
              id="violenceLevelWorldSettingsTab"
              name="violenceLevel"
              type="select"
              options={violenceLevelOptions.map(opt => opt.label)}
              value={violenceLevelOptions.find(opt => opt.value === (settings.violenceLevel || DEFAULT_VIOLENCE_LEVEL))?.label || violenceLevelOptions[1].label}
              onChange={(e) => {
                  const selectedLabel = e.target.value;
                  const selectedValue = violenceLevelOptions.find(opt => opt.label === selectedLabel)?.value || DEFAULT_VIOLENCE_LEVEL;
                  handleChange({ target: { name: 'violenceLevel', value: selectedValue } } as any);
              }}
            />
            <InputField
              label={VIETNAMESE.storyToneLabel}
              id="storyToneWorldSettingsTab"
              name="storyTone"
              type="select"
              options={storyToneOptions.map(opt => opt.label)}
              value={storyToneOptions.find(opt => opt.value === (settings.storyTone || DEFAULT_STORY_TONE))?.label || storyToneOptions[1].label}
              onChange={(e) => {
                  const selectedLabel = e.target.value;
                  const selectedValue = storyToneOptions.find(opt => opt.label === selectedLabel)?.value || DEFAULT_STORY_TONE;
                  handleChange({ target: { name: 'storyTone', value: selectedValue } } as any);
              }}
            />
          </div>
        )}
      </div>
      
      <div className="md:col-span-2 border-t border-gray-700 pt-4 mt-2">
        <InputField 
          label={VIETNAMESE.enableCultivationSystemLabel} 
          id="isCultivationEnabledTabWorldSettings" // Unique ID
          name="isCultivationEnabled" 
          type="checkbox" 
          checked={settings.isCultivationEnabled} 
          onChange={handleChange} 
        />
        {settings.isCultivationEnabled && (
          <div className="space-y-4 pl-4 border-l-2 border-sky-700/50 mt-2">
            <CollapsibleSection
              title="Hệ Thống Cảnh Giới Theo Chủng Tộc"
              isOpen={isRaceSystemsOpen}
              onToggle={() => setIsRaceSystemsOpen(!isRaceSystemsOpen)}
              itemCount={settings.raceCultivationSystems.length}
            >
              <div className="space-y-4">
                {(settings.raceCultivationSystems || []).map((system, index) => (
                  <div key={system.id} className="p-3 border border-gray-600 rounded-md relative bg-gray-800/20">
                    <InputField
                      label="Tên Chủng Tộc"
                      id={`raceName-${index}`}
                      value={system.raceName}
                      onChange={(e) => handleRaceSystemChange(index, 'raceName', e.target.value)}
                    />
                    <InputField
                      label="Hệ Thống Cảnh Giới (phân cách bằng ' - ')"
                      id={`realmSystem-${index}`}
                      value={system.realmSystem}
                      onChange={(e) => handleRaceSystemChange(index, 'realmSystem', e.target.value)}
                      textarea
                      rows={2}
                      placeholder="Vd: Luyện Khí - Trúc Cơ - Kim Đan..."
                    />
                    {settings.raceCultivationSystems.length > 1 && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeRaceSystem(system.id)}
                        className="absolute top-2 right-2 !p-1.5 leading-none"
                      >
                        &times;
                      </Button>
                    )}
                  </div>
                ))}
                <Button onClick={addRaceSystem} variant="ghost" size="sm" className="w-full border-dashed mt-2">
                  + Thêm Hệ Thống Chủng Tộc
                </Button>
              </div>
            </CollapsibleSection>
            
            <InputField 
              label="Hệ Thống Cảnh Giới Yêu Thú" 
              id="yeuThuRealmSystem" 
              name="yeuThuRealmSystem" 
              value={settings.yeuThuRealmSystem} 
              onChange={handleChange} 
              placeholder="Vd: Khai Trí - Yêu Binh - Yêu Tướng..." 
            />
            
            <InputField 
              label={VIETNAMESE.startingRealmLabel} 
              id="canhGioiKhoiDauTabWorldSettings" // Unique ID
              name="canhGioiKhoiDau" 
              value={settings.canhGioiKhoiDau} 
              onChange={handleChange} 
              placeholder={VIETNAMESE.startingRealmPlaceholder} 
            />
          </div>
        )}
        {!settings.isCultivationEnabled && (
          <p className="text-sm text-gray-400 italic">{VIETNAMESE.cultivationSystemDisabledNote}</p>
        )}
      </div>
    </div>
  );
};

export default WorldSettingsTab;