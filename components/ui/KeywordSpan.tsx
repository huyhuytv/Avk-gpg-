
import React from 'react';
// Corrected to import the broader types
import { GameEntity, GameEntityType } from '../../hooks/types';

interface KeywordSpanProps {
  keyword: string;
  entityType: GameEntityType; // Use the broader type
  entity: GameEntity; // Use the broader type
  onClick: (
    event: React.MouseEvent<HTMLSpanElement>, 
    entity: GameEntity,
    entityType: GameEntityType
  ) => void;
  style?: React.CSSProperties;
}

const KeywordSpan: React.FC<KeywordSpanProps> = ({ keyword, entityType, entity, onClick, style }) => {
  const handleClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    onClick(event, entity, entityType);
  };

  return (
    <span
      className="underline cursor-pointer font-medium" // Removed text-yellow-400 and hover:text-yellow-300
      style={style} // Apply dynamic styles from props
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e as any)}
      aria-label={`Details for ${keyword}`}
    >
      {keyword}
    </span>
  );
};

export default KeywordSpan;
