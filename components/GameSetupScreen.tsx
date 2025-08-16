import React, { useState, useCallback, ChangeEvent, useRef, useEffect } from 'react';
import { GameScreen, WorldSettings, StartingSkill, StartingItem, StartingNPC, StartingLore, StartingLocation, StartingFaction, PlayerStats, GenreType, WorldDate, StartingYeuThu, RaceCultivationSystem, GeneratedWorldElements } from '../types'; 
import Button from './ui/Button';
import Modal from './ui/Modal';
import { VIETNAMESE, DEFAULT_WORLD_SETTINGS, CUSTOM_GENRE_VALUE, MAX_TOKENS_FANFIC, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE, DEFAULT_NSFW_DESCRIPTION_STYLE } from '../constants';
import { generateWorldDetailsFromStory, generateFanfictionWorldDetails, countTokens, generateCompletionForWorldDetails, analyzeWritingStyle } from '../services/geminiService';
import * as GameTemplates from '../templates';

// Import tab components
import AIAssistTab from './gameSetup/tabs/AIAssistTab';
import CharacterStoryTab from './gameSetup/tabs/CharacterStoryTab';
import WorldSettingsTab from './gameSetup/tabs/WorldSettingsTab';
import StartingElementsTab from './gameSetup/tabs/StartingElementsTab';

interface GameSetupScreenProps {
  setCurrentScreen: (screen: GameScreen) => void;
  onSetupComplete: (settings: WorldSettings, uploadedAvatarData?: string | null) => void;
}

type SetupTab = 'aiAssist' | 'characterStory' | 'worldSettings' | 'startingElements';

const activeTabStyle = "whitespace-nowrap py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm border-indigo-500 text-indigo-400 focus:outline-none";
const inactiveTabStyle = "whitespace-nowrap py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500 focus:outline-none";

const GameSetupScreen = ({ setCurrentScreen, onSetupComplete }: GameSetupScreenProps): JSX.Element => {
  const [settings, setSettings] = useState<WorldSettings>({
    ...DEFAULT_WORLD_SETTINGS,
    saveGameName: DEFAULT_WORLD_SETTINGS.saveGameName || '',
    genre: DEFAULT_WORLD_SETTINGS.genre,
    customGenreName: DEFAULT_WORLD_SETTINGS.customGenreName || '',
    isCultivationEnabled: DEFAULT_WORLD_SETTINGS.isCultivationEnabled,
    startingSkills: [...(DEFAULT_WORLD_SETTINGS.startingSkills || [])],
    startingItems: (DEFAULT_WORLD_SETTINGS.startingItems || []).map(item => ({
        ...item, 
        category: item.category || GameTemplates.ItemCategory.MISCELLANEOUS, 
        quantity: item.quantity || 1
    })),
    startingNPCs: [...(DEFAULT_WORLD_SETTINGS.startingNPCs || [])],
    startingYeuThu: [...(DEFAULT_WORLD_SETTINGS.startingYeuThu || [])], // New
    startingLore: [...(DEFAULT_WORLD_SETTINGS.startingLore || [])],
    startingLocations: [...(DEFAULT_WORLD_SETTINGS.startingLocations || [])],
    startingFactions: [...(DEFAULT_WORLD_SETTINGS.startingFactions || [])],
    originalStorySummary: DEFAULT_WORLD_SETTINGS.originalStorySummary || "",
    raceCultivationSystems: [...(DEFAULT_WORLD_SETTINGS.raceCultivationSystems || [])], // NEW
    yeuThuRealmSystem: DEFAULT_WORLD_SETTINGS.yeuThuRealmSystem, // NEW
    canhGioiKhoiDau: DEFAULT_WORLD_SETTINGS.canhGioiKhoiDau,
    playerAvatarUrl: DEFAULT_WORLD_SETTINGS.playerAvatarUrl,
    playerSpiritualRoot: DEFAULT_WORLD_SETTINGS.playerSpiritualRoot, // Added
    playerSpecialPhysique: DEFAULT_WORLD_SETTINGS.playerSpecialPhysique, // Added
    nsfwMode: DEFAULT_WORLD_SETTINGS.nsfwMode || false,
    nsfwDescriptionStyle: DEFAULT_WORLD_SETTINGS.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE,
    violenceLevel: DEFAULT_WORLD_SETTINGS.violenceLevel || DEFAULT_VIOLENCE_LEVEL,
    storyTone: DEFAULT_WORLD_SETTINGS.storyTone || DEFAULT_STORY_TONE,
    startingDate: DEFAULT_WORLD_SETTINGS.startingDate,
    startingCurrency: DEFAULT_WORLD_SETTINGS.startingCurrency,
  });

  const [activeTab, setActiveTab] = useState<SetupTab>('aiAssist');

  // Player Avatar states
  const [playerAvatarPreviewUrl, setPlayerAvatarPreviewUrl] = useState<string | null>(null);
  const [playerUploadedAvatarData, setPlayerUploadedAvatarData] = useState<string | null>(null);


  // State related to AI Assist Tab
  const [storyIdea, setStoryIdea] = useState('');
  // isOriginalStoryIdeaNsfw removed, use settings.nsfwMode
  const [fanficSourceType, setFanficSourceType] = useState<'name' | 'file'>('name');
  const [fanficStoryName, setFanficStoryName] = useState('');
  const [fanficFile, setFanficFile] = useState<File | null>(null);
  const [fanficFileContent, setFanficFileContent] = useState<string | null>(null);
  const [fanficTokenCount, setFanficTokenCount] = useState<number | null>(null);
  const [fanficPlayerDescription, setFanficPlayerDescription] = useState('');
  // isFanficIdeaNsfw removed, use settings.nsfwMode
  const [originalStorySummary, setOriginalStorySummary] = useState<string>(settings.originalStorySummary || '');
  const [showOriginalStorySummaryInput, setShowOriginalStorySummaryInput] = useState<boolean>(!!settings.originalStorySummary);
  const fanficFileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);


  // General state for screen
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [generatorMessage, setGeneratorMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isGeneratingFanficDetails, setIsGeneratingFanficDetails] = useState(false);
  const [isGeneratingCompletion, setIsGeneratingCompletion] = useState(false); // NEW STATE
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const importSettingsFileRef = useRef<HTMLInputElement>(null);
  const [rawApiResponseText, setRawApiResponseText] = useState<string | null>(null);
  const [showRawResponseModal, setShowRawResponseModal] = useState(false);
  const [sentWorldGenPrompt, setSentWorldGenPrompt] = useState<string | null>(null);
  const [showSentPromptModal, setShowSentPromptModal] = useState(false);
  
  // State for StartingElementsTab collapsible sections
  const [isSkillsSectionOpen, setIsSkillsSectionOpen] = useState(false);
  const [isItemsSectionOpen, setIsItemsSectionOpen] = useState(false);
  const [isNpcsSectionOpen, setIsNpcsSectionOpen] = useState(false);
  const [isYeuThuSectionOpen, setIsYeuThuSectionOpen] = useState(false); // New
  const [isLoreSectionOpen, setIsLoreSectionOpen] = useState(false);
  const [isLocationsSectionOpen, setIsLocationsSectionOpen] = useState(false);
  const [isFactionsSectionOpen, setIsFactionsSectionOpen] = useState(false);

  const processItemDetails = (items: StartingItem[]): StartingItem[] => {
    if (!items) return [];
    return items.map(item => {
        if (item.category === GameTemplates.ItemCategory.EQUIPMENT && item.equipmentDetails) {
            const newItem = { ...item, equipmentDetails: { ...item.equipmentDetails } };

            // Process statBonusesString into a structured object
            if (newItem.equipmentDetails.statBonusesString && !newItem.equipmentDetails.statBonuses) {
                try {
                    const parsedBonuses = JSON.parse(newItem.equipmentDetails.statBonusesString);
                    newItem.equipmentDetails.statBonuses = parsedBonuses;
                } catch (e) {
                    console.error("Failed to parse statBonusesJSON:", newItem.equipmentDetails.statBonusesString, e);
                    newItem.equipmentDetails.statBonuses = {};
                }
            }

            // Process uniqueEffectsString into an array
            if (newItem.equipmentDetails.uniqueEffectsString && !newItem.equipmentDetails.uniqueEffects) {
                newItem.equipmentDetails.uniqueEffects = newItem.equipmentDetails.uniqueEffectsString.split(';').map(s => s.trim()).filter(Boolean);
            }
            return newItem;
        }
        return item;
    });
  };

  // Effect 1: When raw avatar data changes (e.g., user uploads, AI generates base64, user types URL that is passed via onPlayerAvatarDataChange in CharacterStoryTab)
  // This data is the "source of truth" for the current user interaction for preview.
  useEffect(() => {
    if (playerUploadedAvatarData && (playerUploadedAvatarData.startsWith('http') || playerUploadedAvatarData.startsWith('data:'))) {
      setPlayerAvatarPreviewUrl(playerUploadedAvatarData);
    } else if (!playerUploadedAvatarData) {
      setPlayerAvatarPreviewUrl(null);
    }
    // If playerUploadedAvatarData is some placeholder like "uploaded_via_file", this effect won't set a preview from it.
    // The preview would only be set if actual base64 or URL data is in playerUploadedAvatarData.
  }, [playerUploadedAvatarData]);

  // Effect 2: When settings.playerAvatarUrl changes (e.g., due to import, or AI assist directly modifying settings)
  // This needs to synchronize playerUploadedAvatarData and playerAvatarPreviewUrl
  useEffect(() => {
    if (settings.playerAvatarUrl) {
      if (settings.playerAvatarUrl.startsWith('http') || settings.playerAvatarUrl.startsWith('data:')) {
        // If settings.playerAvatarUrl is a direct URL/Data URI, it becomes the source of truth
        setPlayerUploadedAvatarData(settings.playerAvatarUrl);
        // playerAvatarPreviewUrl will be updated by Effect 1 reacting to playerUploadedAvatarData change.
      } else if (settings.playerAvatarUrl === 'uploaded_via_file' || settings.playerAvatarUrl === 'upload_pending_after_ai_gen_cloudinary_fail') {
        // These are placeholders. It means the actual data *should* be in playerUploadedAvatarData if the state is consistent
        // from a previous user action or save/load that preserves playerUploadedAvatarData.
        // If playerUploadedAvatarData is NOT already set with base64 for these placeholders, clear the preview.
        if (!playerUploadedAvatarData || !playerUploadedAvatarData.startsWith('data:')) {
           setPlayerAvatarPreviewUrl(null); 
        } else {
           setPlayerAvatarPreviewUrl(playerUploadedAvatarData); // Ensure preview shows if base64 is there
        }
      }
    } else { // settings.playerAvatarUrl is undefined/null/empty
      setPlayerUploadedAvatarData(null); // This will trigger Effect 1 to clear playerAvatarPreviewUrl
    }
  }, [settings.playerAvatarUrl]); // Removed playerUploadedAvatarData from deps here to prevent potential loops.


  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name.startsWith('startingDate.')) {
        const field = name.split('.')[1] as keyof WorldDate;
        const numValue = parseInt(value, 10);
        setSettings(prev => ({
            ...prev,
            startingDate: {
                ...prev.startingDate,
                [field]: isNaN(numValue) ? 0 : numValue,
            },
        }));
        return; // Exit after handling nested object
    }
    
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setSettings(prev => {
            const newSettings = { ...prev, [name]: checked };
            if (name === 'isCultivationEnabled' && !checked) {
                // When cultivation is disabled, clear related fields
                newSettings.raceCultivationSystems = [{ id: 'default-human-1', raceName: 'Nhân Tộc', realmSystem: VIETNAMESE.noCultivationSystem }];
                newSettings.yeuThuRealmSystem = VIETNAMESE.noCultivationSystem;
                newSettings.canhGioiKhoiDau = VIETNAMESE.mortalRealmName;
            } else if (name === 'isCultivationEnabled' && checked) {
                // Restore defaults if they were cleared
                if (prev.raceCultivationSystems.length === 0 || prev.raceCultivationSystems.every(s => s.realmSystem === VIETNAMESE.noCultivationSystem)) {
                    newSettings.raceCultivationSystems = DEFAULT_WORLD_SETTINGS.raceCultivationSystems;
                }
                 if (!prev.yeuThuRealmSystem || prev.yeuThuRealmSystem === VIETNAMESE.noCultivationSystem) {
                    newSettings.yeuThuRealmSystem = DEFAULT_WORLD_SETTINGS.yeuThuRealmSystem;
                }
                if (prev.canhGioiKhoiDau === VIETNAMESE.mortalRealmName || !prev.canhGioiKhoiDau) {
                    newSettings.canhGioiKhoiDau = DEFAULT_WORLD_SETTINGS.canhGioiKhoiDau;
                }
            }
            return newSettings;
        });
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
    if (name === 'playerName' && !settings.saveGameName) {
        setSettings(prev => ({ ...prev, saveGameName: VIETNAMESE.saveGameNamePlaceholder.replace("[Tên Nhân Vật]", value) }))
    }
    if (name === 'genre' && value !== CUSTOM_GENRE_VALUE) { 
        setSettings(prev => ({ ...prev, customGenreName: "" }));
    }
    if (generatorMessage) setGeneratorMessage(null);
    if (rawApiResponseText) setRawApiResponseText(null);
    if (sentWorldGenPrompt) setSentWorldGenPrompt(null);
  }, [generatorMessage, rawApiResponseText, sentWorldGenPrompt, settings.saveGameName]);

  const handleOriginalStorySummaryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSummary = e.target.value;
    setOriginalStorySummary(newSummary);
    setSettings(prev => ({ ...prev, originalStorySummary: newSummary }));
    if (rawApiResponseText) setRawApiResponseText(null);
    if (sentWorldGenPrompt) setSentWorldGenPrompt(null);
  }, [rawApiResponseText, sentWorldGenPrompt]);
  
  const handleRaceSystemChange = useCallback((index: number, field: keyof Omit<RaceCultivationSystem, 'id'>, value: string) => {
    setSettings(prev => {
        const newSystems = [...prev.raceCultivationSystems];
        newSystems[index] = { ...newSystems[index], [field]: value };
        return { ...prev, raceCultivationSystems: newSystems };
    });
  }, []);

  const addRaceSystem = useCallback(() => {
    setSettings(prev => ({
        ...prev,
        raceCultivationSystems: [
            ...prev.raceCultivationSystems,
            { id: `sys-${Date.now()}`, raceName: '', realmSystem: '' }
        ]
    }));
  }, []);

  const removeRaceSystem = useCallback((idToRemove: string) => {
    setSettings(prev => ({
        ...prev,
        raceCultivationSystems: prev.raceCultivationSystems.filter(sys => sys.id !== idToRemove)
    }));
  }, []);

  const handleStartingSkillChange = useCallback((index: number, field: string, value: any) => {
    setSettings(prev => {
      const newSkills = [...(prev.startingSkills || [])];
      let skillToUpdate = { ...(newSkills[index] || {}) } as StartingSkill;
  
      const fieldParts = field.split('.');
      if (fieldParts.length > 1) {
        let currentLevel: any = skillToUpdate;
        for (let i = 0; i < fieldParts.length - 1; i++) {
          if (currentLevel[fieldParts[i]] === undefined) {
            currentLevel[fieldParts[i]] = {};
          }
          currentLevel = currentLevel[fieldParts[i]];
        }
        currentLevel[fieldParts[fieldParts.length - 1]] = value;
      } else {
        (skillToUpdate as any)[field] = value;
      }
      
      if (field === 'skillType') {
        if (value !== GameTemplates.SkillType.CONG_PHAP_TU_LUYEN) delete skillToUpdate.congPhapDetails;
        if (value !== GameTemplates.SkillType.LINH_KI) delete skillToUpdate.linhKiDetails;
        if (value !== GameTemplates.SkillType.NGHE_NGHIEP) delete skillToUpdate.professionDetails;
        if (value !== GameTemplates.SkillType.CAM_THUAT) delete skillToUpdate.camThuatDetails;
        if (value !== GameTemplates.SkillType.THAN_THONG) delete skillToUpdate.thanThongDetails;
      }
  
      newSkills[index] = skillToUpdate;
      return { ...prev, startingSkills: newSkills };
    });
  }, []);

  const addStartingSkill = useCallback((type: GameTemplates.SkillTypeValues) => {
    setSettings(prev => ({
      ...prev,
      startingSkills: [
        ...(prev.startingSkills || []),
        { name: '', description: '', skillType: type }
      ]
    }));
  }, []);

  const removeStartingSkill = useCallback((index: number) => setSettings(prev => ({ ...prev, startingSkills: (prev.startingSkills || []).filter((_, i) => i !== index) })), []);

  const handleStartingItemChange = useCallback((index: number, field: string, value: any) => {
      setSettings(prev => {
          const newItems = [...(prev.startingItems || [])];
          const itemToUpdate = { ...(newItems[index] || {}) } as StartingItem;

          if (field.startsWith('equipmentDetails.')) {
              const subField = field.substring('equipmentDetails.'.length);
              if (!itemToUpdate.equipmentDetails) itemToUpdate.equipmentDetails = {};
              Object.assign(itemToUpdate.equipmentDetails, { [subField]: value });
          } else if (field.startsWith('potionDetails.')) {
              const subField = field.substring('potionDetails.'.length);
               if (!itemToUpdate.potionDetails) itemToUpdate.potionDetails = {};
              Object.assign(itemToUpdate.potionDetails, { [subField]: value });
          } else if (field.startsWith('materialDetails.')) {
              const subField = field.substring('materialDetails.'.length);
               if (!itemToUpdate.materialDetails) itemToUpdate.materialDetails = {};
              Object.assign(itemToUpdate.materialDetails, { [subField]: value });
          } else if (field.startsWith('questItemDetails.')) {
              const subField = field.substring('questItemDetails.'.length);
               if (!itemToUpdate.questItemDetails) itemToUpdate.questItemDetails = {};
              Object.assign(itemToUpdate.questItemDetails, { [subField]: value });
          } else if (field.startsWith('miscDetails.')) {
              const subField = field.substring('miscDetails.'.length);
              const boolValue = (typeof value === 'string' && (value === 'true' || value === 'false')) ? value === 'true' : value;
               if (!itemToUpdate.miscDetails) itemToUpdate.miscDetails = {};
              Object.assign(itemToUpdate.miscDetails, { [subField]: boolValue });
          } else {
              const directField = field as keyof StartingItem;
              if (directField === 'quantity' || directField === 'value') {
                  (itemToUpdate as any)[directField] = parseInt(String(value), 10) || 0;
              } else {
                  (itemToUpdate as any)[directField] = value;
              }
          }
          
          if (field === 'category') {
              const newCategory = value as GameTemplates.ItemCategoryValues;
              if (newCategory !== GameTemplates.ItemCategory.EQUIPMENT) itemToUpdate.equipmentDetails = {};
              if (newCategory !== GameTemplates.ItemCategory.POTION) itemToUpdate.potionDetails = {};
              if (newCategory !== GameTemplates.ItemCategory.MATERIAL) itemToUpdate.materialDetails = {};
              if (newCategory !== GameTemplates.ItemCategory.QUEST_ITEM) itemToUpdate.questItemDetails = {};
              if (newCategory !== GameTemplates.ItemCategory.MISCELLANEOUS) itemToUpdate.miscDetails = {};
          }

          newItems[index] = itemToUpdate;
          return { ...prev, startingItems: newItems };
      });
  }, []);

  const addStartingItem = useCallback(() => setSettings(prev => ({ ...prev, startingItems: [...(prev.startingItems || []), { name: '', description: '', quantity: 1, category: GameTemplates.ItemCategory.MISCELLANEOUS, rarity: GameTemplates.ItemRarity.PHO_THONG, value: 0, equipmentDetails: {}, potionDetails: {}, materialDetails: {}, questItemDetails: {}, miscDetails: {} }] })), []);
  const removeStartingItem = useCallback((index: number) => setSettings(prev => ({ ...prev, startingItems: (prev.startingItems || []).filter((_, i) => i !== index) })), []);

  const handleStartingNPCChange = useCallback((index: number, field: keyof StartingNPC, value: string | number | undefined) => setSettings(prev => {
    const newNPCs = [...(prev.startingNPCs || [])];
    const npcToUpdate = { ...newNPCs[index] };
    (npcToUpdate as any)[field] = value;
    newNPCs[index] = npcToUpdate;
    return { ...prev, startingNPCs: newNPCs };
  }), []);

  const addStartingNPC = useCallback(() => setSettings(prev => ({ ...prev, startingNPCs: [...(prev.startingNPCs || []), { name: '', personality: '', initialAffinity: 0, details: '', gender: 'Không rõ', race: 'Nhân Tộc', realm: '', tuChat: 'Trung Đẳng', thoNguyen: 120, maxThoNguyen: 120 }] })), []);
  const removeStartingNPC = useCallback((index: number) => setSettings(prev => ({ ...prev, startingNPCs: (prev.startingNPCs || []).filter((_, i) => i !== index) })), []);

  const handleStartingYeuThuChange = useCallback((index: number, field: keyof StartingYeuThu, value: string | boolean) => {
    setSettings(prev => {
        const newYeuThu = [...(prev.startingYeuThu || [])];
        const yeuThuToUpdate = { ...newYeuThu[index] };
        (yeuThuToUpdate as any)[field] = value;
        newYeuThu[index] = yeuThuToUpdate;
        return { ...prev, startingYeuThu: newYeuThu };
    });
  }, []);

  const addStartingYeuThu = useCallback(() => setSettings(prev => ({ ...prev, startingYeuThu: [...(prev.startingYeuThu || []), { name: '', species: '', description: '', isHostile: true }] })), []);
  const removeStartingYeuThu = useCallback((index: number) => setSettings(prev => ({ ...prev, startingYeuThu: (prev.startingYeuThu || []).filter((_, i) => i !== index) })), []);

  const handleStartingLoreChange = useCallback((index: number, field: keyof StartingLore, value: string) => setSettings(prev => {
    const newLore = [...(prev.startingLore || [])];
    const loreToUpdate = { ...newLore[index] };
    (loreToUpdate as any)[field] = value;
    newLore[index] = loreToUpdate;
    return { ...prev, startingLore: newLore };
  }), []);

  const addStartingLore = useCallback(() => setSettings(prev => ({ ...prev, startingLore: [...(prev.startingLore || []), { title: '', content: '' }] })), []);
  const removeStartingLore = useCallback((index: number) => setSettings(prev => ({ ...prev, startingLore: (prev.startingLore || []).filter((_, i) => i !== index) })), []);

  const handleStartingLocationChange = useCallback((index: number, field: keyof StartingLocation, value: string | boolean) => {
    setSettings(prev => {
      const newLocations = [...(prev.startingLocations || [])];
      const locToUpdate = { ...newLocations[index] };
      
      if (field === 'mapX' || field === 'mapY') {
        const numValue = parseInt(value as string, 10);
        (locToUpdate as any)[field] = isNaN(numValue) ? undefined : numValue;
      } else {
        (locToUpdate as any)[field] = value;
      }
      
      newLocations[index] = locToUpdate;
      return { ...prev, startingLocations: newLocations };
    });
  }, []);

  const addStartingLocation = useCallback(() => setSettings(prev => ({ ...prev, startingLocations: [...(prev.startingLocations || []), { name: '', description: '', isSafeZone: false, regionId: '', mapX: undefined, mapY: undefined, locationType: GameTemplates.LocationType.DEFAULT }] })), []);
  const removeStartingLocation = useCallback((index: number) => setSettings(prev => ({ ...prev, startingLocations: (prev.startingLocations || []).filter((_, i) => i !== index) })), []);

  const handleStartingFactionChange = useCallback((index: number, field: keyof StartingFaction, value: string | number) => setSettings(prev => {
    const newFactions = [...(prev.startingFactions || [])];
    const factionToUpdate = { ...newFactions[index] };
    (factionToUpdate as any)[field] = value;
    newFactions[index] = factionToUpdate;
    return { ...prev, startingFactions: newFactions };
  }), []);

  const addStartingFaction = useCallback(() => setSettings(prev => ({ ...prev, startingFactions: [...(prev.startingFactions || []), { name: '', description: '', alignment: GameTemplates.FactionAlignment.TRUNG_LAP, initialPlayerReputation: 0 }] })), []);
  const removeStartingFaction = useCallback((index: number) => setSettings(prev => ({ ...prev, startingFactions: (prev.startingFactions || []).filter((_, i) => i !== index) })), []);

  const handleAnalyzeWritingStyle = useCallback(async () => {
    if (!settings.writingStyleGuide?.trim()) {
        setAnalysisError("Vui lòng nhập hoặc tải lên văn bản mẫu trước khi phân tích.");
        return;
    }
    setIsAnalyzingStyle(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    try {
        const result = await analyzeWritingStyle(settings.writingStyleGuide);
        setAnalysisResult(result);
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        setAnalysisError(`Lỗi phân tích: ${errorMsg}`);
    } finally {
        setIsAnalyzingStyle(false);
    }
  }, [settings.writingStyleGuide]);

  const handleGenerateFromStoryIdea = useCallback(async () => {
    if (!storyIdea.trim()) { setGeneratorMessage({ text: 'Vui lòng nhập ý tưởng cốt truyện.', type: 'error' }); return; }
    setIsGeneratingDetails(true); setGeneratorMessage(null); setRawApiResponseText(null); setSentWorldGenPrompt(null);
    try {
      const {response, rawText, constructedPrompt} = await generateWorldDetailsFromStory(
        storyIdea, 
        settings.nsfwMode || false, 
        settings.genre, 
        settings.isCultivationEnabled,
        settings.violenceLevel || DEFAULT_VIOLENCE_LEVEL,
        settings.storyTone || DEFAULT_STORY_TONE,
        settings.genre === CUSTOM_GENRE_VALUE ? settings.customGenreName : undefined,
        settings.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE,
        (prompt) => setGeneratorMessage({ text: `Đang gửi prompt (dài ${prompt.length} ký tự)...`, type: 'info'}) 
      );
      setRawApiResponseText(rawText); setSentWorldGenPrompt(constructedPrompt);

      const processedItems = processItemDetails(response.startingItems || []);

      const validatedStartingItems = processedItems.map(item => {
        if (item.category === GameTemplates.ItemCategory.MATERIAL) {
            if (!item.materialDetails) {
                item.materialDetails = { type: GameTemplates.MaterialType.KHAC };
            } else if (!item.materialDetails.type || !Object.values(GameTemplates.MaterialType).includes(item.materialDetails.type as GameTemplates.MaterialTypeValues)) {
                item.materialDetails.type = GameTemplates.MaterialType.KHAC;
            }
        }
        return item;
      });

      setSettings(prev => ({
        ...prev,
        theme: response.worldTheme || prev.theme, settingDescription: response.worldSettingDescription || prev.settingDescription, writingStyle: response.worldWritingStyle || prev.writingStyle, currencyName: response.currencyName || prev.currencyName, playerName: response.playerName || prev.playerName, playerGender: response.playerGender || prev.playerGender, playerRace: response.playerRace || prev.playerRace, playerPersonality: response.playerPersonality || prev.playerPersonality, playerBackstory: response.playerBackstory || prev.playerBackstory, playerGoal: response.playerGoal || prev.playerGoal, playerStartingTraits: response.playerStartingTraits || prev.playerStartingTraits,
        startingSkills: response.startingSkills.length > 0 ? response.startingSkills : prev.startingSkills, 
        startingItems: validatedStartingItems.length > 0 ? validatedStartingItems : prev.startingItems, 
        startingNPCs: response.startingNPCs.length > 0 ? response.startingNPCs.map(npc => ({...npc, gender: npc.gender || 'Không rõ'})) : prev.startingNPCs, 
        startingYeuThu: response.startingYeuThu && response.startingYeuThu.length > 0 ? response.startingYeuThu : prev.startingYeuThu,
        startingLore: response.startingLore.length > 0 ? response.startingLore : prev.startingLore,
        startingLocations: response.startingLocations && response.startingLocations.length > 0 ? response.startingLocations : prev.startingLocations, startingFactions: response.startingFactions && response.startingFactions.length > 0 ? response.startingFactions : prev.startingFactions,
        raceCultivationSystems: response.raceCultivationSystems && response.raceCultivationSystems.length > 0 ? response.raceCultivationSystems : prev.raceCultivationSystems,
        yeuThuRealmSystem: response.yeuThuRealmSystem || prev.yeuThuRealmSystem,
        canhGioiKhoiDau: settings.isCultivationEnabled && response.canhGioiKhoiDau ? response.canhGioiKhoiDau : (settings.isCultivationEnabled ? prev.canhGioiKhoiDau : VIETNAMESE.mortalRealmName),
        genre: response.genre || prev.genre, customGenreName: response.genre === CUSTOM_GENRE_VALUE && response.customGenreName ? response.customGenreName : (response.genre === CUSTOM_GENRE_VALUE ? prev.customGenreName : ""), isCultivationEnabled: response.isCultivationEnabled !== undefined ? response.isCultivationEnabled : prev.isCultivationEnabled,
        nsfwDescriptionStyle: settings.nsfwMode && response.nsfwDescriptionStyle ? response.nsfwDescriptionStyle : prev.nsfwDescriptionStyle,
        violenceLevel: settings.nsfwMode && response.violenceLevel ? response.violenceLevel : prev.violenceLevel,
        storyTone: settings.nsfwMode && response.storyTone ? response.storyTone : prev.storyTone,
        startingDate: response.startingDate || prev.startingDate,
        playerSpiritualRoot: response.playerSpiritualRoot || prev.playerSpiritualRoot,
        playerSpecialPhysique: response.playerSpecialPhysique || prev.playerSpecialPhysique,
        playerThoNguyen: response.playerThoNguyen || prev.playerThoNguyen,
        playerMaxThoNguyen: response.playerMaxThoNguyen || prev.playerMaxThoNguyen,
        startingCurrency: response.startingCurrency || prev.startingCurrency,
      }));
      if (response.playerAvatarUrl && response.playerAvatarUrl.startsWith('http')) {
        setPlayerUploadedAvatarData(response.playerAvatarUrl);
      }
      setGeneratorMessage({ text: VIETNAMESE.worldDetailsGeneratedSuccess, type: 'success' });
    } catch (e) { const errorMsg = e instanceof Error ? e.message : String(e); setGeneratorMessage({ text: `${VIETNAMESE.errorGeneratingWorldDetails} ${errorMsg}`, type: 'error' });
    } finally { setIsGeneratingDetails(false); }
  }, [storyIdea, settings]);

  const handleFanficFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneratorMessage(null); setRawApiResponseText(null); setSentWorldGenPrompt(null);
    const file = e.target.files?.[0];
    if (file) {
      setFanficFile(file); setFanficFileContent(null); setFanficTokenCount(null); setIsLoadingTokens(true); setGeneratorMessage({ text: `Đang đọc file "${file.name}"...`, type: 'info' });
      try {
        const content = await file.text(); setFanficFileContent(content); setGeneratorMessage({ text: `Đang tính token cho file "${file.name}"...`, type: 'info' });
        const tokens = await countTokens(content); setFanficTokenCount(tokens);
        if (tokens > MAX_TOKENS_FANFIC) setGeneratorMessage({ text: VIETNAMESE.tokenCountExceededError(MAX_TOKENS_FANFIC), type: 'error' });
        else setGeneratorMessage({ text: `File "${file.name}" đã sẵn sàng. Ước tính ${tokens} token.`, type: 'success' });
      } catch (err) { const errorMsg = err instanceof Error ? err.message : String(err); setGeneratorMessage({ text: `Lỗi xử lý file: ${errorMsg}`, type: 'error' });
      } finally { setIsLoadingTokens(false); }
    } else { setFanficFile(null); setFanficFileContent(null); setFanficTokenCount(null); }
  }, []);

  const handleGenerateFromFanfic = useCallback(async () => {
    let sourceMaterialContent = ''; let isContentProvided = false;
    if (fanficSourceType === 'file') {
      if (!fanficFile || !fanficFileContent) { setGeneratorMessage({ text: VIETNAMESE.pleaseSelectFile, type: 'error' }); return; }
      if (fanficTokenCount && fanficTokenCount > MAX_TOKENS_FANFIC) { setGeneratorMessage({ text: VIETNAMESE.tokenCountExceededError(MAX_TOKENS_FANFIC), type: 'error' }); return; }
      sourceMaterialContent = fanficFileContent; isContentProvided = true;
    } else { 
      if (!fanficStoryName.trim()) { setGeneratorMessage({ text: VIETNAMESE.pleaseEnterStoryName, type: 'error' }); return; }
      sourceMaterialContent = fanficStoryName.trim(); isContentProvided = false;
    }
    setIsGeneratingFanficDetails(true); setGeneratorMessage(null); setRawApiResponseText(null); setSentWorldGenPrompt(null);
    try {
      const {response, rawText, constructedPrompt} = await generateFanfictionWorldDetails(
        sourceMaterialContent, 
        isContentProvided, 
        fanficPlayerDescription, 
        settings.nsfwMode || false, 
        settings.genre, 
        settings.isCultivationEnabled,
        settings.violenceLevel || DEFAULT_VIOLENCE_LEVEL,
        settings.storyTone || DEFAULT_STORY_TONE,
        settings.genre === CUSTOM_GENRE_VALUE ? settings.customGenreName : undefined, 
        settings.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE,
        (prompt) => setGeneratorMessage({ text: `Đang gửi prompt (dài ${prompt.length} ký tự)...`, type: 'info'})
      );
      setRawApiResponseText(rawText); setSentWorldGenPrompt(constructedPrompt);

      const processedItems = processItemDetails(response.startingItems || []);

      const validatedStartingItems = processedItems.map(item => {
        if (item.category === GameTemplates.ItemCategory.MATERIAL) {
            if (!item.materialDetails) {
                item.materialDetails = { type: GameTemplates.MaterialType.KHAC };
            } else if (!item.materialDetails.type || !Object.values(GameTemplates.MaterialType).includes(item.materialDetails.type as GameTemplates.MaterialTypeValues)) {
                item.materialDetails.type = GameTemplates.MaterialType.KHAC;
            }
        }
        return item;
      });

      setSettings(prev => ({
        ...prev,
        theme: response.worldTheme || prev.theme, settingDescription: response.worldSettingDescription || prev.settingDescription, writingStyle: response.worldWritingStyle || prev.writingStyle, currencyName: response.currencyName || prev.currencyName, playerName: response.playerName || prev.playerName, playerGender: response.playerGender || prev.playerGender, playerRace: response.playerRace || prev.playerRace, playerPersonality: response.playerPersonality || prev.playerPersonality, playerBackstory: response.playerBackstory || prev.playerBackstory, playerGoal: response.playerGoal || prev.playerGoal, playerStartingTraits: response.playerStartingTraits || prev.playerStartingTraits,
        startingSkills: response.startingSkills.length > 0 ? response.startingSkills : prev.startingSkills, 
        startingItems: validatedStartingItems.length > 0 ? validatedStartingItems : prev.startingItems, 
        startingNPCs: response.startingNPCs.length > 0 ? response.startingNPCs.map(npc => ({...npc, gender: npc.gender || 'Không rõ'})) : prev.startingNPCs, 
        startingYeuThu: response.startingYeuThu && response.startingYeuThu.length > 0 ? response.startingYeuThu : prev.startingYeuThu,
        startingLore: response.startingLore.length > 0 ? response.startingLore : prev.startingLore,
        startingLocations: response.startingLocations && response.startingLocations.length > 0 ? response.startingLocations : prev.startingLocations, startingFactions: response.startingFactions && response.startingFactions.length > 0 ? response.startingFactions : prev.startingFactions,
        originalStorySummary: response.originalStorySummary || prev.originalStorySummary,
        raceCultivationSystems: response.raceCultivationSystems && response.raceCultivationSystems.length > 0 ? response.raceCultivationSystems : prev.raceCultivationSystems,
        yeuThuRealmSystem: response.yeuThuRealmSystem || prev.yeuThuRealmSystem,
        canhGioiKhoiDau: settings.isCultivationEnabled && response.canhGioiKhoiDau ? response.canhGioiKhoiDau : (settings.isCultivationEnabled ? prev.canhGioiKhoiDau : VIETNAMESE.mortalRealmName),
        genre: response.genre || prev.genre, customGenreName: response.genre === CUSTOM_GENRE_VALUE && response.customGenreName ? response.customGenreName : (response.genre === CUSTOM_GENRE_VALUE ? prev.customGenreName : ""), isCultivationEnabled: response.isCultivationEnabled !== undefined ? response.isCultivationEnabled : prev.isCultivationEnabled,
        nsfwDescriptionStyle: settings.nsfwMode && response.nsfwDescriptionStyle ? response.nsfwDescriptionStyle : prev.nsfwDescriptionStyle,
        violenceLevel: settings.nsfwMode && response.violenceLevel ? response.violenceLevel : prev.violenceLevel,
        storyTone: settings.nsfwMode && response.storyTone ? response.storyTone : prev.storyTone,
        startingDate: response.startingDate || prev.startingDate,
        playerSpiritualRoot: response.playerSpiritualRoot || prev.playerSpiritualRoot,
        playerSpecialPhysique: response.playerSpecialPhysique || prev.playerSpecialPhysique,
        playerThoNguyen: response.playerThoNguyen || prev.playerThoNguyen,
        playerMaxThoNguyen: response.playerMaxThoNguyen || prev.playerMaxThoNguyen,
        startingCurrency: response.startingCurrency || prev.startingCurrency,
      }));
      if (response.playerAvatarUrl && response.playerAvatarUrl.startsWith('http')) {
        setPlayerUploadedAvatarData(response.playerAvatarUrl);
      }
      if (response.originalStorySummary) { setOriginalStorySummary(response.originalStorySummary); setShowOriginalStorySummaryInput(true); }
      setGeneratorMessage({ text: VIETNAMESE.fanficDetailsGeneratedSuccess, type: 'success' });
    } catch (e) { const errorMsg = e instanceof Error ? e.message : String(e); setGeneratorMessage({ text: `${VIETNAMESE.errorGeneratingFanficDetails} ${errorMsg}`, type: 'error' });
    } finally { setIsGeneratingFanficDetails(false); }
  }, [fanficSourceType, fanficFile, fanficFileContent, fanficTokenCount, fanficStoryName, fanficPlayerDescription, settings]);

  const handleGenerateCompletion = useCallback(async () => {
    setIsGeneratingCompletion(true);
    setGeneratorMessage(null);
    setRawApiResponseText(null);
    setSentWorldGenPrompt(null);
    try {
        const { response, rawText, constructedPrompt } = await generateCompletionForWorldDetails(
            settings,
            (prompt) => setGeneratorMessage({ text: `AI đang hoàn thiện... (Prompt dài ${prompt.length} ký tự)`, type: 'info' })
        );
        setRawApiResponseText(rawText);
        setSentWorldGenPrompt(constructedPrompt);

        setSettings(prev => {
            const newSettings = { ...prev };
            const mergedResponse: GeneratedWorldElements = response;

            const isFalsyOrEmpty = (value: any) => {
                if (Array.isArray(value)) return value.length === 0;
                if (typeof value === 'string') return value.trim() === '';
                return !value;
            };
            
            if (isFalsyOrEmpty(prev.theme) && mergedResponse.worldTheme) newSettings.theme = mergedResponse.worldTheme;
            if (isFalsyOrEmpty(prev.settingDescription) && mergedResponse.worldSettingDescription) newSettings.settingDescription = mergedResponse.worldSettingDescription;
            if (isFalsyOrEmpty(prev.writingStyle) && mergedResponse.worldWritingStyle) newSettings.writingStyle = mergedResponse.worldWritingStyle;
            if (isFalsyOrEmpty(prev.currencyName) && mergedResponse.currencyName) newSettings.currencyName = mergedResponse.currencyName;
            if (isFalsyOrEmpty(prev.playerName) && mergedResponse.playerName) newSettings.playerName = mergedResponse.playerName;
            if (isFalsyOrEmpty(prev.playerGender) && mergedResponse.playerGender) newSettings.playerGender = mergedResponse.playerGender;
            if (isFalsyOrEmpty(prev.playerRace) && mergedResponse.playerRace) newSettings.playerRace = mergedResponse.playerRace;
            if (isFalsyOrEmpty(prev.playerPersonality) && mergedResponse.playerPersonality) newSettings.playerPersonality = mergedResponse.playerPersonality;
            if (isFalsyOrEmpty(prev.playerBackstory) && mergedResponse.playerBackstory) newSettings.playerBackstory = mergedResponse.playerBackstory;
            if (isFalsyOrEmpty(prev.playerGoal) && mergedResponse.playerGoal) newSettings.playerGoal = mergedResponse.playerGoal;
            if (isFalsyOrEmpty(prev.playerStartingTraits) && mergedResponse.playerStartingTraits) newSettings.playerStartingTraits = mergedResponse.playerStartingTraits;
            if (isFalsyOrEmpty(prev.playerSpiritualRoot) && mergedResponse.playerSpiritualRoot) newSettings.playerSpiritualRoot = mergedResponse.playerSpiritualRoot;
            if (isFalsyOrEmpty(prev.playerSpecialPhysique) && mergedResponse.playerSpecialPhysique) newSettings.playerSpecialPhysique = mergedResponse.playerSpecialPhysique;
            if (!prev.playerThoNguyen && mergedResponse.playerThoNguyen) newSettings.playerThoNguyen = mergedResponse.playerThoNguyen;
            if (!prev.playerMaxThoNguyen && mergedResponse.playerMaxThoNguyen) newSettings.playerMaxThoNguyen = mergedResponse.playerMaxThoNguyen;
            if (!prev.startingCurrency && mergedResponse.startingCurrency) newSettings.startingCurrency = mergedResponse.startingCurrency;
            if (isFalsyOrEmpty(prev.raceCultivationSystems) && (mergedResponse.raceCultivationSystems || []).length > 0) newSettings.raceCultivationSystems = mergedResponse.raceCultivationSystems;
            if (isFalsyOrEmpty(prev.yeuThuRealmSystem) && mergedResponse.yeuThuRealmSystem) newSettings.yeuThuRealmSystem = mergedResponse.yeuThuRealmSystem;
            if (isFalsyOrEmpty(prev.canhGioiKhoiDau) && mergedResponse.canhGioiKhoiDau) newSettings.canhGioiKhoiDau = mergedResponse.canhGioiKhoiDau;
            
            if (isFalsyOrEmpty(prev.startingSkills) && (mergedResponse.startingSkills || []).length > 0) newSettings.startingSkills = mergedResponse.startingSkills;
            if (isFalsyOrEmpty(prev.startingItems) && (mergedResponse.startingItems || []).length > 0) newSettings.startingItems = processItemDetails(mergedResponse.startingItems);
            if (isFalsyOrEmpty(prev.startingNPCs) && (mergedResponse.startingNPCs || []).length > 0) newSettings.startingNPCs = mergedResponse.startingNPCs;
            if (isFalsyOrEmpty(prev.startingYeuThu) && (mergedResponse.startingYeuThu || []).length > 0) newSettings.startingYeuThu = mergedResponse.startingYeuThu;
            if (isFalsyOrEmpty(prev.startingLore) && (mergedResponse.startingLore || []).length > 0) newSettings.startingLore = mergedResponse.startingLore;
            if (isFalsyOrEmpty(prev.startingLocations) && (mergedResponse.startingLocations || []).length > 0) newSettings.startingLocations = mergedResponse.startingLocations;
            if (isFalsyOrEmpty(prev.startingFactions) && (mergedResponse.startingFactions || []).length > 0) newSettings.startingFactions = mergedResponse.startingFactions;

            return newSettings;
        });

        if (response.playerAvatarUrl && !settings.playerAvatarUrl) {
            setPlayerUploadedAvatarData(response.playerAvatarUrl);
        }
        setGeneratorMessage({ text: "AI đã hoàn thiện các trường còn trống!", type: 'success' });

    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        setGeneratorMessage({ text: `Lỗi khi hoàn thiện thế giới: ${errorMsg}`, type: 'error' });
    } finally {
        setIsGeneratingCompletion(false);
    }
  }, [settings]);
  
  const handleSubmit = useCallback(() => {
    if(!settings.saveGameName.trim()){ setGeneratorMessage({text: VIETNAMESE.saveGameNameRequiredError, type: 'error'}); setActiveTab('worldSettings'); return; }
    let missingFieldsError = "Vui lòng điền đầy đủ các trường thông tin cơ bản: "; const missingFields: string[] = [];
    if (!settings.theme.trim()) missingFields.push("Chủ đề"); if (!settings.settingDescription.trim()) missingFields.push("Bối cảnh"); if (!settings.writingStyle.trim()) missingFields.push("Văn phong"); if (!settings.playerName.trim()) missingFields.push("Tên nhân vật"); if (!settings.playerPersonality.trim()) missingFields.push("Tính cách NV"); if (!settings.playerBackstory.trim()) missingFields.push("Tiểu sử NV"); if (!settings.playerGoal.trim()) missingFields.push("Mục tiêu NV");
    if (settings.isCultivationEnabled) { if (settings.raceCultivationSystems.some(s => !s.raceName.trim() || !s.realmSystem.trim()) || !settings.yeuThuRealmSystem.trim()) missingFields.push("Hệ thống cảnh giới"); if (!settings.canhGioiKhoiDau.trim() || settings.canhGioiKhoiDau === VIETNAMESE.mortalRealmName) missingFields.push("Cảnh giới khởi đầu"); }
    if (settings.genre === CUSTOM_GENRE_VALUE && !settings.customGenreName?.trim()) missingFields.push(VIETNAMESE.customGenreNameLabel);
    if (missingFields.length > 0) { setGeneratorMessage({ text: missingFieldsError + missingFields.join(', ') + ".", type: "error" }); if(!settings.playerName.trim() || !settings.playerPersonality.trim() || !settings.playerBackstory.trim() || !settings.playerGoal.trim()) setActiveTab('characterStory'); else if (!settings.theme.trim() || !settings.settingDescription.trim() || !settings.writingStyle.trim() || (settings.isCultivationEnabled && (settings.raceCultivationSystems.some(s => !s.raceName.trim() || !s.realmSystem.trim()) || !settings.canhGioiKhoiDau.trim())) || (settings.genre === CUSTOM_GENRE_VALUE && !settings.customGenreName?.trim())) setActiveTab('worldSettings'); return; }
    
    const finalSettings = { ...settings, originalStorySummary: originalStorySummary };
    if (!finalSettings.isCultivationEnabled) { 
      finalSettings.raceCultivationSystems = [{ id: 'default-human-1', raceName: 'Nhân Tộc', realmSystem: VIETNAMESE.noCultivationSystem }];
      finalSettings.yeuThuRealmSystem = VIETNAMESE.noCultivationSystem;
      finalSettings.canhGioiKhoiDau = VIETNAMESE.mortalRealmName; 
    }
    if (finalSettings.genre !== CUSTOM_GENRE_VALUE) finalSettings.customGenreName = "";
    
    if (playerUploadedAvatarData) {
      if (playerUploadedAvatarData.startsWith('data:')) {
        finalSettings.playerAvatarUrl = "uploaded_via_file";
      } else if (playerUploadedAvatarData.startsWith('http')) {
        finalSettings.playerAvatarUrl = playerUploadedAvatarData;
      } else {
        if (settings.playerAvatarUrl === 'upload_pending_after_ai_gen_cloudinary_fail') {
             finalSettings.playerAvatarUrl = 'upload_pending_after_ai_gen_cloudinary_fail';
        } else if (settings.playerAvatarUrl === 'uploaded_via_file') {
             finalSettings.playerAvatarUrl = 'uploaded_via_file';
        } else {
             finalSettings.playerAvatarUrl = undefined;
        }
      }
    } else {
        finalSettings.playerAvatarUrl = undefined;
    }

    onSetupComplete(finalSettings, playerUploadedAvatarData); 
  }, [settings, originalStorySummary, onSetupComplete, playerUploadedAvatarData]);

  const handleExportSettings = useCallback(() => {
    try {
      const settingsToExport: WorldSettings = {
        ...settings,
        originalStorySummary: originalStorySummary,
        writingStyleGuide: settings.writingStyleGuide,
      };
      const jsonString = JSON.stringify(settingsToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `DaoDoAI_WorldSettings_${settings.saveGameName || 'Untitled'}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setGeneratorMessage({ text: VIETNAMESE.worldSettingsExportedSuccess, type: 'success' });
    } catch (error) {
      console.error("Error exporting world settings:", error);
      setGeneratorMessage({ text: VIETNAMESE.errorExportingWorldSettings, type: 'error' });
    }
  }, [settings, originalStorySummary]);

  const handleImportSettingsFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string; const importedSettings = JSON.parse(content) as WorldSettings & {startingDate?: {buoi?: any}};
          if (importedSettings && importedSettings.theme !== undefined && importedSettings.playerName !== undefined) {
            
            const importedDate = { ...(importedSettings.startingDate || DEFAULT_WORLD_SETTINGS.startingDate) };
            if (importedSettings.startingDate && typeof (importedSettings.startingDate as any).buoi !== 'undefined') {
                const buoi = (importedSettings.startingDate as any).buoi;
                delete (importedDate as any).buoi;
                switch(buoi) {
                    case 'Sáng Sớm': (importedDate as WorldDate).hour = 6; (importedDate as WorldDate).minute = 0; break;
                    case 'Buổi Sáng': (importedDate as WorldDate).hour = 8; (importedDate as WorldDate).minute = 0; break;
                    case 'Buổi Trưa': (importedDate as WorldDate).hour = 12; (importedDate as WorldDate).minute = 0; break;
                    case 'Buổi Chiều': (importedDate as WorldDate).hour = 15; (importedDate as WorldDate).minute = 0; break;
                    case 'Hoàng Hôn': (importedDate as WorldDate).hour = 18; (importedDate as WorldDate).minute = 0; break;
                    case 'Buổi Tối': (importedDate as WorldDate).hour = 20; (importedDate as WorldDate).minute = 0; break;
                    case 'Nửa Đêm': (importedDate as WorldDate).hour = 0; (importedDate as WorldDate).minute = 0; break;
                    default: (importedDate as WorldDate).hour = 8; (importedDate as WorldDate).minute = 0;
                }
            }
            if (typeof (importedDate as WorldDate).hour === 'undefined') (importedDate as WorldDate).hour = 8;
            if (typeof (importedDate as WorldDate).minute === 'undefined') (importedDate as WorldDate).minute = 0;

            const isCultivationEnabled = importedSettings.isCultivationEnabled === undefined ? true : importedSettings.isCultivationEnabled;

            setSettings({ 
              ...DEFAULT_WORLD_SETTINGS, 
              ...importedSettings,
              isCultivationEnabled: isCultivationEnabled,
              startingDate: importedDate as WorldDate, 
              raceCultivationSystems: isCultivationEnabled 
                ? (importedSettings.raceCultivationSystems || DEFAULT_WORLD_SETTINGS.raceCultivationSystems) 
                : [{ id: 'default-human-1', raceName: 'Nhân Tộc', realmSystem: VIETNAMESE.noCultivationSystem }],
              yeuThuRealmSystem: isCultivationEnabled 
                ? (importedSettings.yeuThuRealmSystem || DEFAULT_WORLD_SETTINGS.yeuThuRealmSystem) 
                : VIETNAMESE.noCultivationSystem,
              canhGioiKhoiDau: isCultivationEnabled 
                ? (importedSettings.canhGioiKhoiDau || DEFAULT_WORLD_SETTINGS.canhGioiKhoiDau) 
                : VIETNAMESE.mortalRealmName,
              playerRace: importedSettings.playerRace || DEFAULT_WORLD_SETTINGS.playerRace, 
              genre: importedSettings.genre || DEFAULT_WORLD_SETTINGS.genre, 
              customGenreName: importedSettings.genre === CUSTOM_GENRE_VALUE ? (importedSettings.customGenreName || '') : '', 
              startingSkills: importedSettings.startingSkills || [], 
              startingItems: importedSettings.startingItems || [], 
              startingNPCs: importedSettings.startingNPCs || [], 
              startingYeuThu: importedSettings.startingYeuThu || [],
              startingLore: importedSettings.startingLore || [], 
              startingLocations: importedSettings.startingLocations || [], 
              startingFactions: importedSettings.startingFactions || [], 
              playerAvatarUrl: importedSettings.playerAvatarUrl,
              nsfwMode: importedSettings.nsfwMode || false,
              nsfwDescriptionStyle: importedSettings.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE,
              violenceLevel: importedSettings.violenceLevel || DEFAULT_VIOLENCE_LEVEL,
              storyTone: importedSettings.storyTone || DEFAULT_STORY_TONE,
              writingStyleGuide: importedSettings.writingStyleGuide || '',
            });
            setOriginalStorySummary(importedSettings.originalStorySummary || ''); 
            setShowOriginalStorySummaryInput(!!importedSettings.originalStorySummary);
            setGeneratorMessage({ text: VIETNAMESE.worldSettingsImportedSuccess, type: 'success' }); 
            setActiveTab('worldSettings'); 
          } else setGeneratorMessage({ text: VIETNAMESE.invalidWorldSettingsFile, type: 'error' });
        } catch (error) { console.error("Error importing world settings:", error); setGeneratorMessage({ text: VIETNAMESE.errorImportingWorldSettings, type: 'error' }); }
      };
      reader.readAsText(file);
    }
    if (importSettingsFileRef.current) importSettingsFileRef.current.value = "";
  }, []);
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 p-4">
      <div className="w-full max-w-4xl bg-gray-900 shadow-2xl rounded-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          {VIETNAMESE.newGame}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mb-4">
            <Button onClick={handleExportSettings} variant="secondary" className="w-full sm:w-auto">
                {VIETNAMESE.exportWorldSettingsButton}
            </Button>
            <Button onClick={() => importSettingsFileRef.current?.click()} variant="secondary" className="w-full sm:w-auto">
                {VIETNAMESE.importWorldSettingsButton}
            </Button>
            <input type="file" ref={importSettingsFileRef} onChange={handleImportSettingsFileChange} accept=".json" className="hidden" />
        </div>

        {generatorMessage && (
          <div className={`p-3 rounded-md text-sm ${ generatorMessage.type === 'success' ? 'bg-green-600/80 text-white' : generatorMessage.type === 'error' ? 'bg-red-600/80 text-white' : 'bg-blue-600/80 text-white' }`}>
            {generatorMessage.text}
            {sentWorldGenPrompt && generatorMessage.type !== 'info' && ( <Button variant="ghost" size="sm" onClick={() => setShowSentPromptModal(true)} className="ml-2 mt-1 text-xs !p-1 border-current hover:bg-white/20"> {VIETNAMESE.viewSentPromptButton} </Button> )}
            {rawApiResponseText && generatorMessage.type !== 'info' && ( <Button variant="ghost" size="sm" onClick={() => setShowRawResponseModal(true)} className="ml-2 mt-1 text-xs !p-1 border-current hover:bg-white/20"> {VIETNAMESE.viewRawAiResponseButton} </Button> )}
          </div>
        )}

        <div className="border-b border-gray-700 sticky top-0 bg-gray-900 z-10 -mx-6 px-6 mb-2">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto pb-px hide-scrollbar" aria-label="Tabs">
            <button onClick={() => setActiveTab('aiAssist')} className={activeTab === 'aiAssist' ? activeTabStyle : inactiveTabStyle}>AI Hỗ Trợ</button>
            <button onClick={() => setActiveTab('characterStory')} className={activeTab === 'characterStory' ? activeTabStyle : inactiveTabStyle}>Nhân Vật & Cốt Truyện</button>
            <button onClick={() => setActiveTab('worldSettings')} className={activeTab === 'worldSettings' ? activeTabStyle : inactiveTabStyle}>Thiết Lập Thế Giới</button>
            <button onClick={() => setActiveTab('startingElements')} className={activeTab === 'startingElements' ? activeTabStyle : inactiveTabStyle}>Yếu Tố Khởi Đầu</button>
          </nav>
        </div>

        <div className="max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar pr-2 pb-4 -mr-2">
          {activeTab === 'aiAssist' && (
            <AIAssistTab
              settings={settings}
              handleChange={handleChange}
              storyIdea={storyIdea} setStoryIdea={setStoryIdea}
              handleGenerateFromStoryIdea={handleGenerateFromStoryIdea} isGeneratingDetails={isGeneratingDetails}
              handleGenerateCompletion={handleGenerateCompletion} isGeneratingCompletion={isGeneratingCompletion}
              fanficSourceType={fanficSourceType} setFanficSourceType={setFanficSourceType}
              fanficStoryName={fanficStoryName} setFanficStoryName={setFanficStoryName}
              fanficFile={fanficFile} handleFanficFileChange={handleFanficFileChange}
              fanficTokenCount={fanficTokenCount} isLoadingTokens={isLoadingTokens}
              fanficPlayerDescription={fanficPlayerDescription} setFanficPlayerDescription={setFanficPlayerDescription}
              handleGenerateFromFanfic={handleGenerateFromFanfic} isGeneratingFanficDetails={isGeneratingFanficDetails}
              originalStorySummary={originalStorySummary} handleOriginalStorySummaryChange={handleOriginalStorySummaryChange}
              showOriginalStorySummaryInput={showOriginalStorySummaryInput} setShowOriginalStorySummaryInput={setShowOriginalStorySummaryInput}
              fanficFileInputRef={fanficFileInputRef}
              handleAnalyzeWritingStyle={handleAnalyzeWritingStyle}
              isAnalyzingStyle={isAnalyzingStyle}
              analysisResult={analysisResult}
              analysisError={analysisError}
            />
          )}
          {activeTab === 'characterStory' && (
            <CharacterStoryTab
              settings={settings}
              handleChange={handleChange}
              playerAvatarPreviewUrl={playerAvatarPreviewUrl} // Pass down for preview
              setPlayerAvatarPreviewUrl={setPlayerAvatarPreviewUrl} // Allow CharacterStoryTab to update preview
              onPlayerAvatarDataChange={setPlayerUploadedAvatarData} // Allow CharacterStoryTab to set the raw data
            />
          )}
          {activeTab === 'worldSettings' && (
            <WorldSettingsTab 
              settings={settings} 
              handleChange={handleChange} 
              handleRaceSystemChange={handleRaceSystemChange}
              addRaceSystem={addRaceSystem}
              removeRaceSystem={removeRaceSystem}
            />
          )}
          {activeTab === 'startingElements' && (
            <StartingElementsTab
              settings={settings}
              isSkillsSectionOpen={isSkillsSectionOpen} setIsSkillsSectionOpen={setIsSkillsSectionOpen}
              handleStartingSkillChange={handleStartingSkillChange} addStartingSkill={addStartingSkill} removeStartingSkill={removeStartingSkill}
              isItemsSectionOpen={isItemsSectionOpen} setIsItemsSectionOpen={setIsItemsSectionOpen}
              handleStartingItemChange={handleStartingItemChange} addStartingItem={addStartingItem} removeStartingItem={removeStartingItem}
              isNpcsSectionOpen={isNpcsSectionOpen} setIsNpcsSectionOpen={setIsNpcsSectionOpen}
              handleStartingNPCChange={handleStartingNPCChange} addStartingNPC={addStartingNPC} removeStartingNPC={removeStartingNPC}
              isYeuThuSectionOpen={isYeuThuSectionOpen} setIsYeuThuSectionOpen={setIsYeuThuSectionOpen}
              handleStartingYeuThuChange={handleStartingYeuThuChange} addStartingYeuThu={addStartingYeuThu} removeStartingYeuThu={removeStartingYeuThu}
              isLoreSectionOpen={isLoreSectionOpen} setIsLoreSectionOpen={setIsLoreSectionOpen}
              handleStartingLoreChange={handleStartingLoreChange} addStartingLore={addStartingLore} removeStartingLore={removeStartingLore}
              isLocationsSectionOpen={isLocationsSectionOpen} setIsLocationsSectionOpen={setIsLocationsSectionOpen}
              handleStartingLocationChange={handleStartingLocationChange} addStartingLocation={addStartingLocation} removeStartingLocation={removeStartingLocation}
              isFactionsSectionOpen={isFactionsSectionOpen} setIsFactionsSectionOpen={setIsFactionsSectionOpen}
              handleStartingFactionChange={handleStartingFactionChange} addStartingFaction={addStartingFaction} removeStartingFaction={removeStartingFaction}
            />
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-700 space-y-3 sm:space-y-0 sm:space-x-4">
          <Button variant="secondary" onClick={() => setCurrentScreen(GameScreen.Initial)} className="w-full sm:w-auto">
            {VIETNAMESE.goBackButton}
          </Button>
          <Button variant="primary" size="lg" onClick={handleSubmit} className="w-full sm:w-auto" isLoading={isGeneratingDetails || isGeneratingFanficDetails || isGeneratingCompletion} disabled={isGeneratingDetails || isGeneratingFanficDetails || isGeneratingCompletion} >
            {VIETNAMESE.startGame}
          </Button>
        </div>
      </div>
      {showRawResponseModal && rawApiResponseText && ( <Modal isOpen={showRawResponseModal} onClose={() => setShowRawResponseModal(false)} title={VIETNAMESE.rawAiResponseModalTitle}> <pre className="whitespace-pre-wrap break-all bg-gray-700 p-3 rounded-md text-xs text-gray-200 max-h-[60vh] overflow-y-auto custom-scrollbar"> {rawApiResponseText} </pre> </Modal> )}
      {showSentPromptModal && sentWorldGenPrompt && ( <Modal isOpen={showSentPromptModal} onClose={() => setShowSentPromptModal(false)} title={VIETNAMESE.sentPromptModalTitle}> <pre className="whitespace-pre-wrap break-all bg-gray-700 p-3 rounded-md text-xs text-gray-200 max-h-[60vh] overflow-y-auto custom-scrollbar"> {sentWorldGenPrompt} </pre> </Modal> )}
    </div>
  );
};

export default GameSetupScreen;