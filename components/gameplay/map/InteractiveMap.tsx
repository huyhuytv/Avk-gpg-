
import React from 'react';
import { GameLocation } from '../../../types';
import { MAP_COLORS, MAP_SIZES } from './mapConstants';
import * as LocationIcons from './mapIcons';
import * as GameTemplates from '../../../templates';

interface InteractiveMapProps {
  locations: GameLocation[];
  currentLocationId: string | null;
  onLocationClick: (locationId: string) => void;
  transform: string;
  isEditMode: boolean;
  onNodeMouseDown: (event: React.MouseEvent<SVGGElement>, locationId: string) => void;
}

// Define the props interface for the icon components locally, as it is not exported from mapIcons.tsx
interface IconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
}

const getLocationIconComponent = (location: GameLocation): React.FC<IconProps> => {
    switch(location.locationType) {
        // Standard Locations
        case GameTemplates.LocationType.VILLAGE: return LocationIcons.VillageIcon;
        case GameTemplates.LocationType.TOWN: return LocationIcons.TownIcon;
        case GameTemplates.LocationType.CITY: return LocationIcons.CityIcon;
        case GameTemplates.LocationType.CAPITAL: return LocationIcons.CapitalIcon;
        case GameTemplates.LocationType.FOREST: return LocationIcons.ForestIcon;
        case GameTemplates.LocationType.MOUNTAIN: return LocationIcons.MountainIcon;
        case GameTemplates.LocationType.CAVE: return LocationIcons.CaveIcon;
        case GameTemplates.LocationType.DUNGEON: return LocationIcons.DungeonIcon;
        case GameTemplates.LocationType.RUIN: return LocationIcons.RuinIcon;
        case GameTemplates.LocationType.SECT_CLAN: return LocationIcons.SectIcon;
        case GameTemplates.SubLocationType.INN: return LocationIcons.InnIcon;
        case GameTemplates.LocationType.RIVER_LAKE: return LocationIcons.WaterIcon;
        case GameTemplates.LocationType.LANDMARK: return LocationIcons.LandmarkIcon;

        // Economy Locations
        case GameTemplates.EconomyLocationType.SHOP: return LocationIcons.ShopIcon;
        case GameTemplates.EconomyLocationType.MARKETPLACE: return LocationIcons.ShopIcon; // Reuse shop icon for marketplace
        case GameTemplates.EconomyLocationType.SHOPPING_CENTER: return LocationIcons.CityIcon; // Reuse city icon for shopping center
        case GameTemplates.EconomyLocationType.AUCTION_HOUSE: return LocationIcons.CapitalIcon; // Reuse capital icon for auction house
        
        case GameTemplates.LocationType.DEFAULT:
        default:
            // Fallback to circle for default or unspecified type
            return LocationIcons.DefaultIcon;
    }
}


const InteractiveMap: React.FC<InteractiveMapProps> = ({
  locations,
  currentLocationId,
  onLocationClick,
  transform,
  isEditMode,
  onNodeMouseDown,
}) => {
  const topLevelLocations = locations.filter(loc => !loc.parentLocationId);

  return (
    <g transform={transform}>
      {/* Render Connections (Paths) First - so nodes are on top */}
      {topLevelLocations.map(loc =>
        loc.connections?.map(conn => {
          if (conn.isDiscovered) {
            const targetLoc = topLevelLocations.find(l => l.id === conn.targetLocationId);
            if (loc.mapX && loc.mapY && targetLoc?.mapX && targetLoc?.mapY) {
              return (
                <line
                  key={`${loc.id}-${conn.targetLocationId}`}
                  x1={loc.mapX}
                  y1={loc.mapY}
                  x2={targetLoc.mapX}
                  y2={targetLoc.mapY}
                  stroke={MAP_COLORS.PATH_DISCOVERED}
                  strokeWidth={MAP_SIZES.PATH_STROKE_WIDTH / Math.sqrt(parseFloat(transform.split('(')[2]) || 1)} // Adjust stroke width on zoom
                  className="transition-all hover:stroke-indigo-400"
                />
              );
            }
          }
          return null;
        })
      )}

      {/* Render Location Nodes */}
      {topLevelLocations.map(loc => {
        const isCurrent = loc.id === currentLocationId;
        const nodeSize = isCurrent ? MAP_SIZES.NODE_RADIUS_CURRENT * 2 : MAP_SIZES.NODE_RADIUS_DEFAULT * 2;
        
        let nodeColor: string;
        if (isCurrent) {
            nodeColor = MAP_COLORS.CURRENT_LOCATION_NODE;
        } else if (loc.visited) {
            nodeColor = loc.isSafeZone ? MAP_COLORS.SAFE_ZONE_NODE : MAP_COLORS.DISCOVERED_LOCATION_NODE;
        } else {
            nodeColor = MAP_COLORS.UNDISCOVERED_HINT_NODE; // Known but not visited
        }

        // Fallback coordinates if not provided
        const x = loc.mapX ?? MAP_SIZES.SVG_VIEWBOX_WIDTH / 2;
        const y = loc.mapY ?? MAP_SIZES.SVG_VIEWBOX_HEIGHT / 2;

        const IconComponent = getLocationIconComponent(loc);

        return (
          <g
            key={loc.id}
            transform={`translate(${x}, ${y})`}
            onClick={() => !isEditMode && onLocationClick(loc.id)}
            className={`group ${isEditMode ? 'cursor-move' : 'cursor-pointer'}`}
            aria-label={`Địa điểm: ${loc.name}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !isEditMode && onLocationClick(loc.id)}
            onMouseDown={(e) => onNodeMouseDown(e, loc.id)}
          >
             <g transform={`translate(-${nodeSize / 2}, -${nodeSize / 2})`} style={{ color: nodeColor }}>
                <IconComponent
                    width={nodeSize}
                    height={nodeSize}
                    className="transition-all group-hover:stroke-indigo-400 group-hover:stroke-[2px] group-focus:ring-2 group-focus:ring-indigo-300"
                    stroke={MAP_COLORS.NODE_STROKE_COLOR}
                    strokeWidth={MAP_SIZES.NODE_STROKE_WIDTH}
                />
             </g>
            <text
              x={MAP_SIZES.NODE_TEXT_OFFSET_X}
              y={MAP_SIZES.NODE_TEXT_OFFSET_Y}
              fontSize={MAP_SIZES.NODE_FONT_SIZE}
              fill={MAP_COLORS.NODE_TEXT_COLOR}
              className="pointer-events-none select-none transition-all group-hover:font-semibold"
              style={{ textShadow: '1px 1px 2px black' }}
            >
              {loc.name}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export default InteractiveMap;
