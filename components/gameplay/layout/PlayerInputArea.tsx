import React, { ChangeEvent, useState, useRef, useEffect } from 'react';
import { GameMessage, PlayerActionInputType, ResponseLength } from '../../../types';
import Button from '../../ui/Button';
import { VIETNAMESE } from '../../../constants';

interface PlayerInputAreaProps {
  latestMessageWithChoices: GameMessage | undefined;
  showAiSuggestions: boolean;
  setShowAiSuggestions: (show: boolean) => void;
  playerInput: string;
  setPlayerInput: (input: string) => void;
  currentActionType: PlayerActionInputType;
  setCurrentActionType: (type: PlayerActionInputType) => void;
  selectedResponseLength: ResponseLength;
  setSelectedResponseLength: (length: ResponseLength) => void;
  isResponseLengthDropdownOpen: boolean;
  setIsResponseLengthDropdownOpen: (isOpen: boolean) => void;
  responseLengthDropdownRef: React.RefObject<HTMLDivElement | null>;
  isLoadingUi: boolean;
  isSummarizingUi: boolean;
  isCurrentlyActivePage: boolean;
  messageIdBeingEdited: string | null;
  handleChoiceClick: (choiceText: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  choiceButtonStyles: React.CSSProperties;
  // New props for pagination
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (page: number) => void;
}

const PlayerInputArea: React.FC<PlayerInputAreaProps> = ({
  latestMessageWithChoices,
  showAiSuggestions,
  setShowAiSuggestions,
  playerInput,
  setPlayerInput,
  currentActionType,
  setCurrentActionType,
  selectedResponseLength,
  setSelectedResponseLength,
  isResponseLengthDropdownOpen,
  setIsResponseLengthDropdownOpen,
  responseLengthDropdownRef,
  isLoadingUi,
  isSummarizingUi,
  isCurrentlyActivePage,
  messageIdBeingEdited,
  handleChoiceClick,
  handleSubmit,
  choiceButtonStyles,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onJump,
}) => {
    // New state and refs for pagination menu
    const [isPaginationMenuOpen, setIsPaginationMenuOpen] = useState(false);
    const paginationMenuRef = useRef<HTMLDivElement | null>(null);
    const [jumpToPageInput, setJumpToPageInput] = useState<string>(currentPage.toString());

    useEffect(() => {
        setJumpToPageInput(currentPage.toString());
    }, [currentPage]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (paginationMenuRef.current && !paginationMenuRef.current.contains(event.target as Node)) {
                setIsPaginationMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleJumpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJumpToPageInput(e.target.value);
    };

    const handleJumpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const pageNum = parseInt(jumpToPageInput, 10);
        if (!isNaN(pageNum)) {
            onJump(pageNum);
            setIsPaginationMenuOpen(false); // Close menu on action
        }
    };
    
    const handlePrevClick = () => {
        onPrev();
        setIsPaginationMenuOpen(false);
    };

    const handleNextClick = () => {
        onNext();
        setIsPaginationMenuOpen(false);
    };

    const responseLengthOptions: { label: string, value: ResponseLength }[] = [
        { label: VIETNAMESE.responseLength_default, value: 'default' },
        { label: VIETNAMESE.responseLength_short, value: 'short' },
        { label: VIETNAMESE.responseLength_medium, value: 'medium' },
        { label: VIETNAMESE.responseLength_long, value: 'long' },
    ];

  const isAction = currentActionType === 'action';

  return (
    <div className="bg-gray-800 p-2 sm:p-3 border-t border-gray-700 flex-shrink-0">
      {latestMessageWithChoices?.choices && latestMessageWithChoices.choices.length > 0 && isCurrentlyActivePage && !isSummarizingUi && (
        <div className="mb-2">
          <Button type="button" variant="ghost" size="sm" className="w-full text-left justify-start py-1.5 px-2 text-xs text-indigo-300 hover:text-indigo-200 mb-1" onClick={() => setShowAiSuggestions(!showAiSuggestions)}>
            {showAiSuggestions ? VIETNAMESE.hideAiSuggestionsButton : VIETNAMESE.showAiSuggestionsButton}
          </Button>
          {showAiSuggestions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
              {latestMessageWithChoices.choices.map((choice, index) => (
                <Button 
                  key={index} 
                  variant="ghost" 
                  className="w-full text-left justify-start py-1.5 px-2 sm:py-2 sm:px-3 text-xs sm:text-sm whitespace-normal h-auto" 
                  onClick={() => handleChoiceClick(choice.text)} 
                  disabled={isLoadingUi || isSummarizingUi || !isCurrentlyActivePage || !!messageIdBeingEdited} 
                  title={choice.text}
                  customStyles={choiceButtonStyles} // Apply styles
                >
                  {index + 1}. {choice.text}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-2">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            {/* Action Type Toggle Button */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`w-full sm:w-auto h-full justify-center transition-colors duration-200 ${isAction ? 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 border-indigo-500' : 'bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-500 border-teal-500'}`}
                onClick={() => setCurrentActionType(isAction ? 'story' : 'action')}
                disabled={isLoadingUi || isSummarizingUi || !isCurrentlyActivePage || !!messageIdBeingEdited}
                title={isAction ? VIETNAMESE.inputTypeToggleTooltipAction : VIETNAMESE.inputTypeToggleTooltipStory}
            >
                <span className="flex items-center gap-2">
                    {isAction ? '⚔️' : '📖'}
                    <span>{isAction ? VIETNAMESE.inputTypeActionLabel : VIETNAMESE.inputTypeStoryLabel}</span>
                </span>
            </Button>

            {/* Response Length Dropdown */}
            <div ref={responseLengthDropdownRef} className="relative flex-shrink-0">
                 <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto h-full justify-between"
                    onClick={() => setIsResponseLengthDropdownOpen(!isResponseLengthDropdownOpen)}
                    disabled={isLoadingUi || isSummarizingUi || !isCurrentlyActivePage || !!messageIdBeingEdited}
                >
                    <span>{VIETNAMESE.responseLengthLabel}: {responseLengthOptions.find(o => o.value === selectedResponseLength)?.label}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </Button>
                {isResponseLengthDropdownOpen && (
                    <div className="absolute bottom-full right-0 mb-1 w-max bg-gray-600 rounded-md shadow-lg z-20">
                        {responseLengthOptions.map(opt => (
                            <a
                                key={opt.value}
                                href="#"
                                onClick={(e) => { e.preventDefault(); setSelectedResponseLength(opt.value); setIsResponseLengthDropdownOpen(false); }}
                                className="block px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 first:rounded-t-md last:rounded-b-md"
                            >
                                {opt.label}
                            </a>
                        ))}
                    </div>
                )}
            </div>
            <input
            type="text"
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            placeholder={!isCurrentlyActivePage ? "Chỉ có thể hành động ở trang hiện tại nhất." : VIETNAMESE.enterAction}
            className="flex-grow w-full p-2 sm:p-2.5 text-sm sm:text-base bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 placeholder-gray-400"
            disabled={isLoadingUi || isSummarizingUi || !isCurrentlyActivePage || !!messageIdBeingEdited}
            />
            <Button type="submit" variant="primary" size="sm" className="px-3 sm:px-4 w-full sm:w-auto flex-shrink-0" disabled={isLoadingUi || isSummarizingUi || playerInput.trim() === "" || !isCurrentlyActivePage || !!messageIdBeingEdited} isLoading={isLoadingUi && !isSummarizingUi} loadingText={VIETNAMESE.sendingAction}>
                {VIETNAMESE.sendInputButton}
            </Button>

            {/* MOVED Pagination Menu Button & Dropdown */}
            <div ref={paginationMenuRef} className="relative flex-shrink-0">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto h-full justify-center px-3"
                    onClick={() => setIsPaginationMenuOpen(!isPaginationMenuOpen)}
                    disabled={isLoadingUi || isSummarizingUi || !!messageIdBeingEdited}
                    title="Mở Menu Trang"
                    aria-haspopup="true"
                    aria-expanded={isPaginationMenuOpen}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </Button>
                {isPaginationMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-72 bg-gray-600 rounded-lg shadow-lg z-20 p-3 border border-gray-500 space-y-3">
                        <div className="flex items-center justify-between">
                            <Button onClick={handlePrevClick} disabled={currentPage <= 1 || isSummarizingUi} size="sm" variant="ghost" className="text-xs px-2 py-1">
                                {VIETNAMESE.previousPage}
                            </Button>
                            <span className="text-sm text-gray-200 mx-2 font-semibold">
                                {VIETNAMESE.pageIndicator(currentPage, totalPages)}
                            </span>
                            <Button onClick={handleNextClick} disabled={currentPage >= totalPages || isSummarizingUi} size="sm" variant="ghost" className="text-xs px-2 py-1">
                                {VIETNAMESE.nextPage}
                            </Button>
                        </div>
                        <form onSubmit={handleJumpSubmit} className="flex items-center gap-2 border-t border-gray-500 pt-3">
                            <input
                                type="number"
                                value={jumpToPageInput}
                                onChange={handleJumpInputChange}
                                min="1"
                                max={totalPages}
                                className="w-full p-2 text-sm text-center bg-gray-800 border border-gray-700 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-100"
                                aria-label="Nhập số trang"
                                disabled={isSummarizingUi}
                            />
                            <Button type="submit" size="sm" variant="primary" className="h-full px-3" disabled={isSummarizingUi}>
                                {VIETNAMESE.goToPage}
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
      </form>
    </div>
  );
};

export default PlayerInputArea;
