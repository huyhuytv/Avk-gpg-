


import React, { useState, useEffect, ChangeEvent } from 'react';
import { GameScreen, ApiConfig, SafetySetting, AvatarGenerationEngine } from '../types'; 
import Button from './ui/Button';
import { 
  VIETNAMESE, 
  API_SETTINGS_STORAGE_KEY, 
  AVAILABLE_MODELS, 
  HARM_CATEGORIES,      
  HARM_BLOCK_THRESHOLDS, 
  DEFAULT_API_CONFIG,
  AVAILABLE_AVATAR_ENGINES, // New Import
  DEFAULT_AVATAR_GENERATION_ENGINE // New Import
} from '../constants';
import { getApiSettings } from '../services/geminiService'; 
import { HarmCategory, HarmBlockThreshold } from '@google/genai'; 

interface ApiSettingsScreenProps {
  setCurrentScreen: (screen: GameScreen) => void;
  onSettingsSavedNotification: () => void;
}

const ApiSettingsScreen: React.FC<ApiSettingsScreenProps> = ({ setCurrentScreen, onSettingsSavedNotification }) => {
  const [currentApiKeySource, setCurrentApiKeySource] = useState<'system' | 'user'>(DEFAULT_API_CONFIG.apiKeySource);
  const [userApiKeys, setUserApiKeys] = useState<string[]>(['']);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_API_CONFIG.model);
  const [selectedEconomyModel, setSelectedEconomyModel] = useState<string>(DEFAULT_API_CONFIG.model);
  const [safetySettings, setSafetySettings] = useState<SafetySetting[]>(DEFAULT_API_CONFIG.safetySettings);
  const [autoGenerateNpcAvatars, setAutoGenerateNpcAvatars] = useState<boolean>(DEFAULT_API_CONFIG.autoGenerateNpcAvatars);
  const [selectedAvatarEngine, setSelectedAvatarEngine] = useState<AvatarGenerationEngine>(DEFAULT_AVATAR_GENERATION_ENGINE);
  const [ragTopK, setRagTopK] = useState<number>(DEFAULT_API_CONFIG.ragTopK || 10);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    const loadedSettings = getApiSettings();
    setCurrentApiKeySource(loadedSettings.apiKeySource);
    setUserApiKeys(loadedSettings.userApiKeys.length > 0 ? loadedSettings.userApiKeys : ['']);
    setSelectedModel(loadedSettings.model);
    setSelectedEconomyModel(loadedSettings.economyModel || loadedSettings.model || DEFAULT_API_CONFIG.model);
    setSafetySettings(loadedSettings.safetySettings);
    setAutoGenerateNpcAvatars(loadedSettings.autoGenerateNpcAvatars);
    setSelectedAvatarEngine(loadedSettings.avatarGenerationEngine || DEFAULT_AVATAR_GENERATION_ENGINE);
    setRagTopK(loadedSettings.ragTopK ?? (DEFAULT_API_CONFIG.ragTopK || 10));
  }, []);

  const handleUserApiKeyChange = (index: number, value: string) => {
    const newKeys = [...userApiKeys];
    newKeys[index] = value;
    setUserApiKeys(newKeys);
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleAddApiKey = () => {
    setUserApiKeys([...userApiKeys, '']);
  };

  const handleRemoveApiKey = (index: number) => {
    if (userApiKeys.length > 1) {
      const newKeys = userApiKeys.filter((_, i) => i !== index);
      setUserApiKeys(newKeys);
    }
  };

  const handleModelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
    if (successMessage) setSuccessMessage('');
  };

  const handleAvatarEngineChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedAvatarEngine(e.target.value as AvatarGenerationEngine);
    if (successMessage) setSuccessMessage('');
  };


  const handleEconomyModelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedEconomyModel(e.target.value);
    if (successMessage) setSuccessMessage('');
  };

  const handleSafetySettingChange = (category: HarmCategory, newThresholdValue: string) => {
    const newThreshold = newThresholdValue as HarmBlockThreshold;
    setSafetySettings(prevSettings =>
      prevSettings.map(setting =>
        setting.category === category ? { ...setting, threshold: newThreshold } : setting
      )
    );
    if (successMessage) setSuccessMessage('');
  };

  const handleApiKeySourceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentApiKeySource(e.target.value as 'system' | 'user');
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleAutoGenerateNpcAvatarsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAutoGenerateNpcAvatars(e.target.checked);
    if (successMessage) setSuccessMessage('');
  };

  const handleSaveSettings = () => {
    const validKeys = userApiKeys.map(k => k.trim()).filter(k => k !== '');

    if (currentApiKeySource === 'user' && validKeys.length === 0) {
      setError(VIETNAMESE.apiKeyRequiredError);
      return;
    }
    setError('');
    
    const settingsToSave: ApiConfig = { 
      apiKeySource: currentApiKeySource,
      userApiKeys: currentApiKeySource === 'user' ? (validKeys.length > 0 ? validKeys : ['']) : [''],
      model: selectedModel,
      economyModel: selectedEconomyModel,
      safetySettings: safetySettings,
      autoGenerateNpcAvatars: autoGenerateNpcAvatars,
      avatarGenerationEngine: selectedAvatarEngine,
      ragTopK: ragTopK,
    };
    localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
    
    setSuccessMessage(VIETNAMESE.settingsSavedMessage);
    onSettingsSavedNotification(); 
  };
  
  const apiInfoText = currentApiKeySource === 'system' ? VIETNAMESE.apiInfoSystem : VIETNAMESE.apiInfoUser;
  const cloudinaryInfoText = VIETNAMESE.cloudinaryInfo;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 p-4 sm:p-6">
      <div className="w-full max-w-lg bg-gray-900 shadow-2xl rounded-xl p-6 sm:p-8">
        <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-500 to-indigo-600 mb-8">
          {VIETNAMESE.apiSettingsTitle}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-30 border border-red-700 text-red-300 rounded-md text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-500 bg-opacity-30 border border-green-700 text-green-300 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {VIETNAMESE.apiKeySourceLabel}
            </label>
            <div className="space-y-2">
              <label htmlFor="apiKeySourceSystem" className="flex items-center p-3 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600/70 transition-colors cursor-pointer">
                <input
                  type="radio"
                  id="apiKeySourceSystem"
                  name="apiKeySource"
                  value="system"
                  checked={currentApiKeySource === 'system'}
                  onChange={handleApiKeySourceChange}
                  className="h-4 w-4 text-indigo-600 border-gray-500 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm text-gray-200">{VIETNAMESE.apiKeySourceSystem}</span>
              </label>
              <label htmlFor="apiKeySourceUser" className="flex items-center p-3 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600/70 transition-colors cursor-pointer">
                <input
                  type="radio"
                  id="apiKeySourceUser"
                  name="apiKeySource"
                  value="user"
                  checked={currentApiKeySource === 'user'}
                  onChange={handleApiKeySourceChange}
                  className="h-4 w-4 text-indigo-600 border-gray-500 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm text-gray-200">{VIETNAMESE.apiKeySourceUser}</span>
              </label>
            </div>
          </div>

          {currentApiKeySource === 'user' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {VIETNAMESE.geminiUserApiKeyLabel} (Hỗ trợ xoay tua nhiều key)
              </label>
              <div className="space-y-2">
                {userApiKeys.map((key, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="password"
                      value={key}
                      onChange={(e) => handleUserApiKeyChange(index, e.target.value)}
                      placeholder={`${VIETNAMESE.geminiApiKeyPlaceholder} #${index + 1}`}
                      className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 placeholder-gray-400 transition-colors"
                      aria-label={`Gemini API Key ${index + 1}`}
                    />
                    {userApiKeys.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveApiKey(index)}
                        className="!p-2 flex-shrink-0"
                        aria-label={`Xóa API Key #${index + 1}`}
                      >
                        &times;
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddApiKey}
                  className="w-full mt-2 border-dashed"
                >
                  + Thêm API Key
                </Button>
              </div>
              {error && currentApiKeySource === 'user' && <p id="api-key-error" className="mt-1 text-xs text-red-400">{error}</p>}
            </div>
          )}

          <div>
            <label htmlFor="geminiModel" className="block text-sm font-medium text-gray-300 mb-1">
              {VIETNAMESE.geminiModelLabel} (Cho Cốt Truyện Chính)
            </label>
            <select
              id="geminiModel"
              value={selectedModel}
              onChange={handleModelChange}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 transition-colors duration-150"
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          
           <div>
            <label htmlFor="economyModel" className="block text-sm font-medium text-gray-300 mb-1">
              {VIETNAMESE.economyModelLabel}
            </label>
            <select
              id="economyModel"
              value={selectedEconomyModel}
              onChange={handleEconomyModelChange}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 transition-colors duration-150"
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Model này sẽ được dùng cho các tính năng cần phản hồi nhanh như tạo chợ, đấu giá.</p>
          </div>

          <div>
            <label htmlFor="ragTopK" className="block text-sm font-medium text-gray-300 mb-1">
              Số Lượng Thông Tin Ngữ Cảnh (RAG) <span className="text-gray-400 font-normal">({ragTopK} mục)</span>
            </label>
            <input
              type="range"
              id="ragTopK"
              min="0"
              max="100"
              value={ragTopK}
              onChange={(e) => setRagTopK(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">Điều chỉnh lượng thông tin "trí nhớ" của AI. Số lớn hơn giúp AI nhớ tốt hơn nhưng có thể tốn nhiều token hơn và chậm hơn. 0 để tắt.</p>
          </div>


          <div>
            <label htmlFor="avatarGenerationEngine" className="block text-sm font-medium text-gray-300 mb-1">
                Cơ Chế Tạo Ảnh Avatar NPC
            </label>
            <select
                id="avatarGenerationEngine"
                value={selectedAvatarEngine}
                onChange={handleAvatarEngineChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 transition-colors duration-150"
            >
                {AVAILABLE_AVATAR_ENGINES.map(engine => (
                <option key={engine.id} value={engine.id}>
                    {engine.name}
                </option>
                ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Chọn model để tạo ảnh đại diện cho NPC khi tùy chọn "Tự động tạo ảnh NPC" được bật.</p>
          </div>
          
          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Cài Đặt Cloudinary (Lưu Ảnh)</h3>
            <label htmlFor="autoGenerateNpcAvatars" className="flex items-center cursor-pointer mb-2">
              <div className="relative">
                <input
                  type="checkbox"
                  id="autoGenerateNpcAvatars"
                  className="sr-only" 
                  checked={autoGenerateNpcAvatars}
                  onChange={handleAutoGenerateNpcAvatarsChange}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${autoGenerateNpcAvatars ? 'bg-indigo-600' : 'bg-gray-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoGenerateNpcAvatars ? 'transform translate-x-full' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-300">{VIETNAMESE.autoGenerateNpcAvatarsLabel}</span>
            </label>
            <p className="text-xs text-gray-400 mt-1 ml-10 mb-3">{VIETNAMESE.autoGenerateNpcAvatarsInfo}</p>
             <p className="text-xs text-gray-400 mt-1 ml-10">{cloudinaryInfoText}</p>
          </div>


          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-3 pt-4 border-t border-gray-700 mt-6">
              {VIETNAMESE.safetySettingsLabel}
            </h3>
            {safetySettings.map((setting) => {
              const categoryInfo = HARM_CATEGORIES.find(cat => cat.id === setting.category);
              return (
                <div key={setting.category} className="mb-4">
                  <label htmlFor={`safety-${setting.category}`} className="block text-sm font-medium text-gray-300 mb-1">
                    {categoryInfo?.label || setting.category}
                  </label>
                  <select
                    id={`safety-${setting.category}`}
                    value={setting.threshold}
                    onChange={(e) => handleSafetySettingChange(setting.category, e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 transition-colors duration-150"
                  >
                    {HARM_BLOCK_THRESHOLDS.map(thresholdOpt => (
                      <option key={thresholdOpt.id} value={thresholdOpt.id}>
                        {thresholdOpt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 space-y-3 sm:space-y-0 sm:space-x-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setCurrentScreen(GameScreen.Initial)}
              className="w-full sm:w-auto"
            >
              {VIETNAMESE.goBackButton}
            </Button>
            <Button 
              type="button" 
              variant="primary" 
              size="lg" 
              onClick={handleSaveSettings}
              className="w-full sm:w-auto"
            >
              {VIETNAMESE.saveSettingsButton}
            </Button>
          </div>
        </div>
      </div>
       <p className="mt-8 text-xs text-gray-500 text-center max-w-md px-2">
        {apiInfoText}
      </p>
    </div>
  );
};

export default ApiSettingsScreen;