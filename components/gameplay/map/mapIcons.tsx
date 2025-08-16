// src/components/gameplay/map/mapIcons.tsx
import React from 'react';

// Common props for all icons to control size and styling from the parent
interface IconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
}

// Default icon (if needed) or can be handled as a fallback in the map component
export const DefaultIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const PlayerIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
      <path d="M12 12.25c1.24 0 2.25-1.01 2.25-2.25S13.24 7.75 12 7.75 9.75 8.76 9.75 10s1.01 2.25 2.25 2.25zm4.5 4c0-1.5-3-2.25-4.5-2.25s-4.5.75-4.5 2.25v.75h9v-.75z"></path>
    </svg>
);

export const VillageIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
    <path d="M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
  </svg>
);

export const TownIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M20 11h-2V7h2v4zm-4 0h-2V7h2v4zm-4 0H8V7h2v4zm-2 6h2v-2H8v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zM2 22h20V5H2v17zM6 9h2v2H6V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z"/>
    </svg>
);

export const CityIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M15 11V5l-3-3-3 3v6H2v10h20V11h-7zM9 13H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
    </svg>
);

export const CapitalIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M12,1.5L8.5,5.5H3.5V11H2V22.5H22V11H20.5V5.5H15.5L12,1.5M5.5,7.5H18.5V11H5.5V7.5M4,13H20V20.5H4V13Z" />
    </svg>
);

export const ForestIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M10,21V16H4.5L10,10.5L15.5,16H10ZM14.5,14H20L14.5,8.5L9,14H14.5Z" />
    </svg>
);

export const MountainIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/>
    </svg>
);

export const CaveIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
      <path d="M4 20h16v-6c0-4.4-3.6-8-8-8s-8 3.6-8 8v6zm2-6c0-3.3 2.7-6 6-6s6 2.7 6 6v4H6v-4z" />
    </svg>
);

export const DungeonIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-9h5v2h-5v-2zm0 3h5v2h-5v-2zM9 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm6 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
    </svg>
);

export const RuinIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M8.5 14.5l6-6.01 6 6.01L22 13l-8-8-8 8 1.5 1.5zM2 19h20v2H2v-2zM4 12l8-8 8 8-8 8-8-8zm2.5-1.5L12 16l5.5-5.5L12 5l-5.5 5.5z"/>
    </svg>
);

export const SectIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M1 21h4V9H1v12zm6 0h4V3H7v18zm6 0h4V12h-4v9zm6 0h4V6h-4v15z"/>
    </svg>
);

export const ShopIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
    </svg>
);

export const InnIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M21 10.78V8h-2v2.78l-6-3.75-6 3.75V8H5v2.78l-2 1.25V6c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v5.03l-2-1.25zM12 12l-8 5v2h16v-2l-8-5z"/>
    </svg>
);

export const WaterIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M2 15s1.89-2 3.5-2c2.43 0 2.5 2 5 2s2.5-2 5-2c1.61 0 3.5 2 3.5 2v4H2v-4z"/>
    </svg>
);

export const LandmarkIcon: React.FC<IconProps> = ({ width = "16", height = "16", className, stroke, strokeWidth }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" stroke={stroke} strokeWidth={strokeWidth} className={className}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>
);