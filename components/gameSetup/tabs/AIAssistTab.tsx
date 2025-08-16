import React, { ChangeEvent, useRef, useState, useEffect } from 'react';
import { WorldSettings, GenreType, NsfwDescriptionStyle, ViolenceLevel, StoryTone } from '../../../types';
import Button from '../../ui/Button';
import InputField from '../../ui/InputField';
import Spinner from '../../ui/Spinner';
import { VIETNAMESE, MAX_TOKENS_FANFIC, CUSTOM_GENRE_VALUE, NSFW_DESCRIPTION_STYLES, VIOLENCE_LEVELS, STORY_TONES, DEFAULT_NSFW_DESCRIPTION_STYLE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE } from '../../../constants';

interface AIAssistTabProps {
  settings: WorldSettings; 
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  storyIdea: string;
  setStoryIdea: (value: string) => void;
  handleGenerateFromStoryIdea: () => void;
  isGeneratingDetails: boolean;
  handleGenerateCompletion: () => void;
  isGeneratingCompletion: boolean;

  fanficSourceType: 'name' | 'file';
  setFanficSourceType: (value: 'name' | 'file') => void;
  fanficStoryName: string;
  setFanficStoryName: (value: string) => void;
  fanficFile: File | null;
  handleFanficFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  fanficTokenCount: number | null;
  isLoadingTokens: boolean;
  fanficPlayerDescription: string;
  setFanficPlayerDescription: (value: string) => void;
  handleGenerateFromFanfic: () => void;
  isGeneratingFanficDetails: boolean;

  originalStorySummary: string;
  handleOriginalStorySummaryChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  showOriginalStorySummaryInput: boolean;
  setShowOriginalStorySummaryInput: (value: boolean) => void;
  fanficFileInputRef: React.RefObject<HTMLInputElement>;
  
  handleAnalyzeWritingStyle: () => void;
  isAnalyzingStyle: boolean;
  analysisResult: string | null;
  analysisError: string | null;
}

const AIAssistTab: React.FC<AIAssistTabProps> = ({
  settings,
  handleChange,
  storyIdea, setStoryIdea,
  handleGenerateFromStoryIdea, isGeneratingDetails,
  handleGenerateCompletion, isGeneratingCompletion,
  fanficSourceType, setFanficSourceType,
  fanficStoryName, setFanficStoryName,
  fanficFile, handleFanficFileChange,
  fanficTokenCount, isLoadingTokens,
  fanficPlayerDescription, setFanficPlayerDescription,
  handleGenerateFromFanfic, isGeneratingFanficDetails,
  originalStorySummary, handleOriginalStorySummaryChange,
  showOriginalStorySummaryInput, setShowOriginalStorySummaryInput,
  fanficFileInputRef,
  handleAnalyzeWritingStyle,
  isAnalyzingStyle,
  analysisResult,
  analysisError
}) => {

  const [writingStyleFile, setWritingStyleFile] = useState<File | null>(null);
  const writingStyleFileInputRef = useRef<HTMLInputElement>(null);
  const [writingStyleSource, setWritingStyleSource] = useState<'file' | 'text'>('file');

  useEffect(() => {
    // When settings are imported, if a writingStyleGuide exists,
    // switch the view to the text area to make it visible for editing.
    if (settings.writingStyleGuide && writingStyleSource === 'file') {
      setWritingStyleSource('text');
    }
  }, [settings.writingStyleGuide, writingStyleSource]);

  const nsfwStyleOptions: Array<{ value: NsfwDescriptionStyle; label: string }> = NSFW_DESCRIPTION_STYLES.map(style => {
    const labelKey = `nsfwStyle${style.replace(/\s+/g, '')}` as keyof typeof VIETNAMESE;
    const labelValue = VIETNAMESE[labelKey];
    return { value: style, label: (typeof labelValue === 'string' ? labelValue : style) };
  });

  const violenceLevelOptions: Array<{ value: ViolenceLevel; label: string }> = VIOLENCE_LEVELS.map(level => {
    const labelKey = `violenceLevel${level.replace(/\s+/g, '')}` as keyof typeof VIETNAMESE;
    const labelValue = VIETNAMESE[labelKey];
    return { value: level, label: (typeof labelValue === 'string' ? labelValue : level) };
  });

  const storyToneOptions: Array<{ value: StoryTone; label: string }> = STORY_TONES.map(tone => {
    const labelKey = `storyTone${tone.replace(/\s+/g, '')}` as keyof typeof VIETNAMESE;
    const labelValue = VIETNAMESE[labelKey];
    return { value: tone, label: (typeof labelValue === 'string' ? labelValue : tone) };
  });
  
  const handleWritingStyleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWritingStyleFile(file);
      try {
        const content = await file.text();
        handleChange({ target: { name: 'writingStyleGuide', value: content } } as any);
      } catch (err) {
        console.error("Error reading writing style file:", err);
        // Optionally, show an error message to the user
      }
    }
  };

  const handleRemoveWritingStyleFile = () => {
    setWritingStyleFile(null);
    handleChange({ target: { name: 'writingStyleGuide', value: '' } } as any);
    if (writingStyleFileInputRef.current) {
        writingStyleFileInputRef.current.value = "";
    }
  };
  
  const handleStyleSourceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newSource = e.target.value as 'file' | 'text';
    setWritingStyleSource(newSource);
    
    // Clear the other source's data to avoid confusion and ensure only one is used
    if (newSource === 'text') {
        // Switching to text input, clear file data
        handleRemoveWritingStyleFile();
    } else { // newSource is 'file'
        // Switching to file upload, clear text data from the main settings state
        handleChange({ target: { name: 'writingStyleGuide', value: '' } } as any);
    }
  };
  
  const parseAnalysisResult = (result: string | null): { analysis: string; summaryPrompt: string } => {
    if (!result) return { analysis: '', summaryPrompt: '' };

    const analysisMatch = result.match(/\[ANALYSIS_START\]([\s\S]*?)\[ANALYSIS_END\]/);
    const summaryPromptMatch = result.match(/\[SUMMARY_PROMPT_START\]([\s\S]*?)\[SUMMARY_PROMPT_END\]/);

    return {
        analysis: analysisMatch ? analysisMatch[1].trim() : 'Không thể trích xuất phần phân tích từ phản hồi của AI.',
        summaryPrompt: summaryPromptMatch ? summaryPromptMatch[1].trim() : '',
    };
  };

  const { analysis, summaryPrompt } = parseAnalysisResult(analysisResult);


  return (
    <div className="space-y-6">
      <fieldset className="border border-green-700 p-4 rounded-md bg-green-900/10">
          <legend className="text-lg font-semibold text-green-300 px-2">Hoàn Thiện Tự Động</legend>
          <p className="text-sm text-gray-400 mb-3">
              Bạn đã điền một vài thông tin? Nhấn nút này để AI tự động điền nốt các trường còn lại dựa trên bối cảnh bạn đã cung cấp.
          </p>
          <Button
              onClick={handleGenerateCompletion}
              isLoading={isGeneratingCompletion}
              disabled={isGeneratingDetails || isGeneratingFanficDetails || isGeneratingCompletion}
              variant="primary"
              className="w-full sm:w-auto mt-3 bg-green-600 hover:bg-green-700 focus:ring-green-500"
              loadingText="AI đang hoàn thiện..."
          >
              AI Hoàn Thiện Các Trường Trống
          </Button>
      </fieldset>
      
      <fieldset className="border border-orange-600 p-4 rounded-md bg-orange-900/10">
        <legend className="text-lg font-semibold text-orange-300 px-2">AI Phản Hồi & Phân Tích Văn Phong</legend>
        <p className="text-sm text-gray-400 mb-3">
            Cung cấp một đoạn văn mẫu để AI bắt chước văn phong, hoặc nhấn "Phân Tích" để AI đưa ra nhận xét và tạo một đoạn tóm tắt văn phong cho bạn.
        </p>
        <div className="flex items-center space-x-6 mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="writingStyleSource" value="file" checked={writingStyleSource === 'file'} onChange={handleStyleSourceChange} className="h-4 w-4 text-indigo-600 border-gray-500 focus:ring-indigo-500" />
                <span className="text-sm text-gray-200">Tải Lên File (.txt)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="writingStyleSource" value="text" checked={writingStyleSource === 'text'} onChange={handleStyleSourceChange} className="h-4 w-4 text-indigo-600 border-gray-500 focus:ring-indigo-500" />
                <span className="text-sm text-gray-200">Nhập Trực Tiếp</span>
            </label>
        </div>
        
        {writingStyleSource === 'file' ? (
            <div>
                <input
                    type="file"
                    id="writingStyleFile"
                    accept=".txt,text/plain"
                    onChange={handleWritingStyleFileChange}
                    ref={writingStyleFileInputRef}
                    className="hidden"
                />
                {!writingStyleFile ? (
                    <Button
                        onClick={() => writingStyleFileInputRef.current?.click()}
                        variant="secondary"
                        className="w-full"
                    >
                        Chọn File Văn Phong (.txt)
                    </Button>
                ) : (
                    <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded-md">
                        <span className="text-sm text-gray-200 truncate">Đã tải: <strong className="font-medium text-orange-300">{writingStyleFile.name}</strong></span>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleRemoveWritingStyleFile}
                            className="!p-1.5"
                        >
                        Xóa File
                        </Button>
                    </div>
                )}
            </div>
        ) : (
            <textarea
                id="writingStyleGuideText"
                name="writingStyleGuide"
                value={settings.writingStyleGuide || ''}
                onChange={handleChange}
                rows={8}
                placeholder="Dán hoặc viết văn bản mẫu của bạn vào đây... File nên dưới 100KB để có hiệu quả tốt nhất."
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 transition-colors duration-150"
            />
        )}
         <Button
            onClick={handleAnalyzeWritingStyle}
            isLoading={isAnalyzingStyle}
            disabled={!settings.writingStyleGuide?.trim() || isGeneratingDetails || isGeneratingFanficDetails || isGeneratingCompletion || isAnalyzingStyle}
            variant="secondary"
            className="w-full mt-2 border-dashed border-orange-400 text-orange-300 hover:bg-orange-700/60"
            loadingText="Đang phân tích..."
        >
            Phân Tích
        </Button>
         {isAnalyzingStyle && <Spinner text="AI đang phân tích văn phong..." className="mt-4" />}
          {analysisError && <p className="text-red-400 mt-2 text-sm bg-red-900/30 p-2 rounded-md">{analysisError}</p>}
          {analysisResult && (
            <div className="mt-4 p-4 border border-gray-700 rounded-md bg-gray-800/50 space-y-4">
                <div className="whitespace-pre-wrap text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: analysis.replace(/\*   /g, '• ').replace(/\*\*/g, '') }}></div>
                {summaryPrompt && (
                    <div className="pt-4 border-t border-gray-600">
                        <h5 className="text-md font-semibold text-teal-300 mb-2">Gợi ý prompt cho AI:</h5>
                        <p className="p-3 bg-gray-900/50 rounded-md text-sm italic text-teal-200">{summaryPrompt}</p>
                        <Button
                            onClick={() => handleChange({ target: { name: 'writingStyleGuide', value: summaryPrompt } } as any)}
                            variant="primary"
                            size="sm"
                            className="w-full mt-3 bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
                        >
                            Sử dụng gợi ý này làm văn phong
                        </Button>
                    </div>
                )}
            </div>
        )}
      </fieldset>


      <fieldset className="border border-indigo-700 p-4 rounded-md bg-indigo-900/10">
        <legend className="text-lg font-semibold text-indigo-300 px-2">{VIETNAMESE.storyIdeaGeneratorSection}</legend>
        <InputField
          label={VIETNAMESE.storyIdeaDescriptionLabel}
          id="storyIdea"
          name="storyIdea"
          value={storyIdea}
          onChange={(e) => setStoryIdea(e.target.value)}
          textarea
          rows={4}
          placeholder={VIETNAMESE.storyIdeaDescriptionPlaceholder}
        />
        <InputField
          label={VIETNAMESE.nsfwIdeaCheckboxLabel} // This now controls settings.nsfwMode
          id="nsfwModeStory" // Unique ID for this checkbox instance
          name="nsfwMode"
          type="checkbox"
          checked={settings.nsfwMode || false}
          onChange={handleChange} // Updates settings.nsfwMode in parent
        />
        {settings.nsfwMode && (
          <div className="pl-4 mt-2 space-y-3 border-l-2 border-indigo-500/50">
            <InputField
              label={VIETNAMESE.nsfwDescriptionStyleLabel}
              id="nsfwDescriptionStyleStory"
              name="nsfwDescriptionStyle"
              type="select"
              options={nsfwStyleOptions.map(opt => opt.label)}
              value={nsfwStyleOptions.find(opt => opt.value === (settings.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE))?.label || nsfwStyleOptions[0].label}
              onChange={(e) => {
                const selectedLabel = e.target.value;
                const selectedValue = nsfwStyleOptions.find(opt => opt.label === selectedLabel)?.value || DEFAULT_NSFW_DESCRIPTION_STYLE;
                handleChange({ target: { name: 'nsfwDescriptionStyle', value: selectedValue } } as any);
              }}
            />
            <InputField
              label={VIETNAMESE.violenceLevelLabel}
              id="violenceLevelStory"
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
              id="storyToneStory"
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
        <Button
          onClick={handleGenerateFromStoryIdea}
          isLoading={isGeneratingDetails}
          disabled={isGeneratingDetails || isGeneratingFanficDetails || isGeneratingCompletion}
          variant="primary"
          className="w-full sm:w-auto mt-3"
          loadingText={VIETNAMESE.generatingWorldDetails}
        >
          {VIETNAMESE.generateDetailsFromStoryButton}
        </Button>
      </fieldset>

      <fieldset className="border border-teal-700 p-4 rounded-md bg-teal-900/10">
        <legend className="text-lg font-semibold text-teal-300 px-2">{VIETNAMESE.fanficStoryGeneratorSection}</legend>
        <InputField
          label={VIETNAMESE.fanficSourceTypeLabel}
          id="fanficSourceType"
          type="select"
          options={[VIETNAMESE.fanficSourceTypeName, VIETNAMESE.fanficSourceTypeFile]}
          value={fanficSourceType === 'name' ? VIETNAMESE.fanficSourceTypeName : VIETNAMESE.fanficSourceTypeFile}
          onChange={(e) => setFanficSourceType(e.target.value === VIETNAMESE.fanficSourceTypeName ? 'name' : 'file')}
        />
        {fanficSourceType === 'name' ? (
          <InputField
            label={VIETNAMESE.fanficStoryNameLabel}
            id="fanficStoryName"
            value={fanficStoryName}
            onChange={(e) => setFanficStoryName(e.target.value)}
            placeholder={VIETNAMESE.fanficStoryNamePlaceholder}
          />
        ) : (
          <div>
            <label htmlFor="fanficFile" className="block text-sm font-medium text-gray-300 mb-1">{VIETNAMESE.fanficFileUploadLabel}</label>
            <input
              type="file"
              id="fanficFile"
              accept=".txt,text/plain"
              onChange={handleFanficFileChange}
              ref={fanficFileInputRef}
              className="w-full p-2 text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            {(isLoadingTokens || fanficTokenCount !== null) && (
              <p className="mt-1 text-xs text-gray-400">
                {isLoadingTokens ? VIETNAMESE.tokenCountCalculating :
                 fanficTokenCount !== null ? `${VIETNAMESE.tokenCountLabel} ${fanficTokenCount.toLocaleString()}` : ''}
              </p>
            )}
          </div>
        )}
        <InputField
          label={VIETNAMESE.fanficPlayerDescriptionLabel}
          id="fanficPlayerDescription"
          value={fanficPlayerDescription}
          onChange={(e) => setFanficPlayerDescription(e.target.value)}
          textarea
          rows={2}
          placeholder={VIETNAMESE.fanficPlayerDescriptionPlaceholder}
        />
        <InputField
          label={VIETNAMESE.nsfwIdeaCheckboxLabel} // This now controls settings.nsfwMode
          id="nsfwModeFanfic" // Unique ID for this checkbox instance
          name="nsfwMode"
          type="checkbox"
          checked={settings.nsfwMode || false}
          onChange={handleChange} // Updates settings.nsfwMode in parent
        />
         {settings.nsfwMode && (
          <div className="pl-4 mt-2 space-y-3 border-l-2 border-teal-500/50">
            <InputField
              label={VIETNAMESE.nsfwDescriptionStyleLabel}
              id="nsfwDescriptionStyleFanfic"
              name="nsfwDescriptionStyle"
              type="select"
              options={nsfwStyleOptions.map(opt => opt.label)}
              value={nsfwStyleOptions.find(opt => opt.value === (settings.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE))?.label || nsfwStyleOptions[0].label}
              onChange={(e) => {
                const selectedLabel = e.target.value;
                const selectedValue = nsfwStyleOptions.find(opt => opt.label === selectedLabel)?.value || DEFAULT_NSFW_DESCRIPTION_STYLE;
                handleChange({ target: { name: 'nsfwDescriptionStyle', value: selectedValue } } as any);
              }}
            />
            <InputField
              label={VIETNAMESE.violenceLevelLabel}
              id="violenceLevelFanfic"
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
              id="storyToneFanfic"
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
        <Button
          onClick={handleGenerateFromFanfic}
          isLoading={isGeneratingFanficDetails}
          disabled={isGeneratingDetails || isGeneratingFanficDetails || isLoadingTokens || (fanficSourceType === 'file' && (!fanficFile || (fanficTokenCount !== null && fanficTokenCount > MAX_TOKENS_FANFIC))) || isGeneratingCompletion}
          variant="primary"
          className="w-full sm:w-auto mt-3 bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
          loadingText={VIETNAMESE.generatingFanficDetails}
        >
          {VIETNAMESE.generateFanficButton}
        </Button>
      </fieldset>

      <div className="mt-4">
        <Button
          onClick={() => setShowOriginalStorySummaryInput(!showOriginalStorySummaryInput)}
          variant="ghost"
          className="text-sm text-gray-400 hover:text-gray-200 mb-2"
        >
          {showOriginalStorySummaryInput ? `Ẩn ${VIETNAMESE.originalStorySummaryLabel}` : VIETNAMESE.addOriginalStorySummaryButton}
        </Button>
        {showOriginalStorySummaryInput && (
          <InputField
            label={`${VIETNAMESE.originalStorySummaryLabel}${isGeneratingFanficDetails && !originalStorySummary ? " (AI đang tạo...)" : ""}`}
            id="originalStorySummary"
            name="originalStorySummary"
            value={originalStorySummary}
            onChange={handleOriginalStorySummaryChange}
            textarea
            rows={8}
            placeholder={VIETNAMESE.originalStorySummaryPlaceholder}
            disabled={isGeneratingFanficDetails && !originalStorySummary}
          />
        )}
      </div>
    </div>
  );
};

export default AIAssistTab;