


import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GameMessage, KnowledgeBase, StyleSettings } from '../../../types';
import Button from '../../ui/Button';
import Spinner from '../../ui/Spinner';
import { VIETNAMESE } from '../../../constants';
import ObservedMessage from './ObservedMessage'; // Import the new component
import SystemMessageGroup from './SystemMessageGroup'; // Import the new grouping component
import { useGame } from '../../../hooks/useGame';

interface StoryLogProps {
  storyLogRef: React.RefObject<HTMLDivElement>;
  displayedMessages: GameMessage[];
  isLoadingUi: boolean; 
  isSummarizingUi: boolean; 
  isCurrentlyActivePage: boolean;
  knowledgeBase: KnowledgeBase;
  styleSettings: StyleSettings;
  messageIdBeingEdited: string | null;
  currentEditText: string;
  setCurrentEditText: (text: string) => void;
  onStartEditMessage: (messageId: string) => void; 
  onSaveEditedMessage: (messageId: string, newContent: string) => void;
  onCancelEditMessage: () => void;
  parseAndHighlightText: (text: string) => React.ReactNode[];
  getDynamicMessageStyles: (msgType: GameMessage['type']) => React.CSSProperties;
  onClick: () => void;
}

const StoryLog: React.FC<StoryLogProps> = ({
  storyLogRef,
  displayedMessages,
  isLoadingUi,
  isSummarizingUi,
  isCurrentlyActivePage,
  knowledgeBase,
  styleSettings,
  messageIdBeingEdited,
  currentEditText,
  setCurrentEditText,
  onStartEditMessage,
  onSaveEditedMessage,
  onCancelEditMessage,
  parseAndHighlightText,
  getDynamicMessageStyles,
  onClick,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingText, setEditingText] = useState('');
  const lastNarrationRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(displayedMessages.length);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (messageIdBeingEdited) {
        const msgToEdit = displayedMessages.find(m => m.id === messageIdBeingEdited);
        setEditingText(msgToEdit?.content || '');
    }
  }, [messageIdBeingEdited, displayedMessages]);

  // Effect for auto-scrolling
  useEffect(() => {
    if (messagesEndRef.current && isCurrentlyActivePage) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedMessages, isCurrentlyActivePage]);

  // Effect for Proactive Focus Management
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        prevMessagesLength.current = displayedMessages.length;
        return;
    }

    const newLength = displayedMessages.length;
    const lengthIncreased = newLength > prevMessagesLength.current;

    // Only focus on new messages if it's the active page, not loading, and a message was actually added
    if (isCurrentlyActivePage && !isLoadingUi && !isSummarizingUi && lengthIncreased) {
        const lastMessage = displayedMessages[newLength - 1];
        // Check if the last message is an AI narration, which is the most logical focus target
        if (lastMessage && lastMessage.type === 'narration' && !lastMessage.isPlayerInput) {
            setTimeout(() => {
                lastNarrationRef.current?.focus();
            }, 100); // Delay to allow DOM update
        }
    }

    prevMessagesLength.current = newLength;
  }, [displayedMessages, isCurrentlyActivePage, isLoadingUi, isSummarizingUi]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (messageIdBeingEdited) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"], textarea')) return;
    onClick();
  };

  const isMajorMessage = (type: GameMessage['type']) => type === 'narration' || type === 'player_action';

  const getPlaceholderHeight = (type: GameMessage['type']): number => {
    switch (type) {
      case 'system':
      case 'error':
      case 'page_summary':
      case 'event_summary':
        return 36; // A smaller, more appropriate height for single-line system messages.
      case 'narration':
      case 'player_action':
      default:
        return 75; // The original default for longer content.
    }
  };
  
  // Group consecutive system messages for collapsibility
  const groupedMessages = useMemo(() => {
    const result: (GameMessage | GameMessage[])[] = [];
    let currentSystemGroup: GameMessage[] = [];

    displayedMessages.forEach((msg) => {
        // Only group 'system' messages. Other types like 'error' and 'page_summary' are distinct.
        if (msg.type === 'system') {
            currentSystemGroup.push(msg);
        } else {
            // If we encounter a non-system message, push any existing group first
            if (currentSystemGroup.length > 0) {
                result.push(currentSystemGroup);
                currentSystemGroup = [];
            }
            // Then push the non-system message
            result.push(msg);
        }
    });

    // Push any remaining group at the end of the loop
    if (currentSystemGroup.length > 0) {
        result.push(currentSystemGroup);
    }
    return result;
  }, [displayedMessages]);

  const lastMessageOverall = displayedMessages[displayedMessages.length - 1];

  return (
    <div 
      id="story-log"
      ref={storyLogRef}
      onClick={handleContainerClick}
      className="overflow-y-auto p-3 sm:p-4 bg-gray-800 rounded-t-lg custom-scrollbar flex-grow min-h-0"
      aria-atomic="false"
      aria-relevant="additions"
    >
      {groupedMessages.map((item, index) => {
        const isGroup = Array.isArray(item);
        
        let containerMargin = 'mt-2'; // Default margin
        if (index > 0) {
            const prevItem = groupedMessages[index - 1];
            const currentItemIsMajor = isMajorMessage(isGroup ? 'system' : item.type);
            const prevItemIsMajor = isMajorMessage(Array.isArray(prevItem) ? 'system' : prevItem.type);

            if (currentItemIsMajor !== prevItemIsMajor) {
                containerMargin = 'mt-3 sm:mt-4';
            }
        }
        
        // Render a group
        if (isGroup) {
            const firstMessageInGroup = item[0];
            return (
                <ObservedMessage key={`group-${firstMessageInGroup.id}`} placeholderHeight={getPlaceholderHeight('system')}>
                    <div className={`flex justify-start ${containerMargin}`}>
                        <div className="max-w-full w-full">
                           <SystemMessageGroup messages={item} />
                        </div>
                    </div>
                </ObservedMessage>
            );
        }
        
        // Render a single message
        const msg = item;
        const isLastNarrationMessage = lastMessageOverall && msg.id === lastMessageOverall.id && msg.type === 'narration' && !msg.isPlayerInput;
        const messageBaseClass = 'max-w-full p-2 sm:p-3 rounded-xl shadow text-sm sm:text-base relative outline-none focus:ring-2 focus:ring-indigo-400';
        let typeSpecificClass = '';
        let dynamicStyle = getDynamicMessageStyles(msg.type);
        const isEditable = (msg.type === 'narration' || msg.type === 'player_action') && isCurrentlyActivePage;

        switch (msg.type) {
            case 'narration':
            if (!dynamicStyle.backgroundColor) typeSpecificClass = 'bg-gray-700';
            if (!dynamicStyle.color) typeSpecificClass += (typeSpecificClass ? ' ' : '') + 'text-gray-100';
            dynamicStyle.whiteSpace = 'pre-wrap';
            break;
            case 'player_action':
            if (!dynamicStyle.backgroundColor) typeSpecificClass = 'bg-indigo-600';
            if (!dynamicStyle.color) typeSpecificClass += (typeSpecificClass ? ' ' : '') + 'text-white';
            dynamicStyle.whiteSpace = 'pre-wrap';
            break;
            case 'error': typeSpecificClass = 'bg-red-700 text-white'; break;
            case 'page_summary': typeSpecificClass = 'bg-purple-800 bg-opacity-50 text-purple-200 border border-purple-600 italic text-xs sm:text-sm'; break;
            case 'event_summary': typeSpecificClass = 'bg-green-800 bg-opacity-50 text-green-200 border border-green-600 italic text-xs sm:text-sm'; break;
            default: typeSpecificClass = 'bg-gray-600 text-gray-200';
        }

        return (
          <ObservedMessage key={msg.id} placeholderHeight={getPlaceholderHeight(msg.type)}>
            <div className={`flex ${msg.isPlayerInput ? 'justify-end' : 'justify-start'} ${containerMargin}`}>
              <div
                id={`message-${msg.id}`}
                ref={isLastNarrationMessage ? lastNarrationRef : null}
                tabIndex={-1}
                className={`${messageBaseClass} ${typeSpecificClass} ${messageIdBeingEdited === msg.id ? 'w-full' : ''}`}
                style={dynamicStyle}
              >
                {isEditable && messageIdBeingEdited !== msg.id && (
                  <button onClick={() => onStartEditMessage(msg.id)} className="absolute top-1 right-1 p-0.5 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full transition-colors" aria-label={VIETNAMESE.editButtonLabel} title={VIETNAMESE.editButtonLabel}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                  </button>
                )}
                {messageIdBeingEdited === msg.id ? (
                  <div className="mt-1">
                    <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full p-2 text-sm bg-gray-600 border border-gray-500 rounded-md focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 text-gray-100 min-h-[80px]" rows={Math.max(3, editingText.split('\\n').length)} />
                    <div className="flex justify-end space-x-2 mt-2">
                      <Button size="sm" variant="ghost" onClick={onCancelEditMessage}>{VIETNAMESE.cancelEditButton}</Button>
                      <Button size="sm" variant="primary" onClick={() => onSaveEditedMessage(msg.id, editingText)}>{VIETNAMESE.saveEditButton}</Button>
                    </div>
                  </div>
                ) : (
                  <p className="leading-relaxed">{React.Children.toArray(parseAndHighlightText(String(msg.content)))}</p>
                )}
              </div>
            </div>
          </ObservedMessage>
        );
      })}
      {(isLoadingUi && displayedMessages.length === 0) && <Spinner text={VIETNAMESE.contactingAI} size="sm" className="my-4" />}
      {(isLoadingUi && !isSummarizingUi && isCurrentlyActivePage && displayedMessages.length > 0) && <div role="status" aria-live="polite" className="text-center text-gray-400 italic py-2 mt-2 text-xs sm:text-sm">{VIETNAMESE.contactingAI}</div>}
      {isSummarizingUi && <div className="text-center text-gray-400 italic py-2 mt-2"><Spinner text={displayedMessages.some(m => m.content.includes(VIETNAMESE.creatingMissingSummary)) ? VIETNAMESE.creatingMissingSummary : VIETNAMESE.summarizingAndPreparingNextPage} size="sm" /></div>}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default StoryLog;