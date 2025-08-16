
import { StyleSettings } from '../types';

export const STYLE_SETTINGS_STORAGE_KEY = 'daoDoAiStyleSettings_v1';
export const AVAILABLE_FONTS = ['Bookerly', 'Inter', 'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'inherit'];
export const AVAILABLE_FONT_SIZES = ['12px', '13px', '14px', '15px', '16px', '17px', '18px', '20px', '22px', '24px', 'inherit'];

export const DEFAULT_STYLE_SETTINGS: StyleSettings = {
  narration: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    textColor: '#F3F4F6',
    backgroundColor: '#374151',
  },
  playerAction: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    textColor: '#FFFFFF',
    backgroundColor: '#4F46E5',
  },
  choiceButton: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    textColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  keywordHighlight: {
    fontFamily: undefined,
    fontSize: undefined,
    textColor: '#FACC15',  // yellow-400
    backgroundColor: undefined,
  },
  dialogueHighlight: {
    fontFamily: undefined,
    fontSize: undefined,
    textColor: '#C084FC', // purple-400
    backgroundColor: undefined,
  },
};
