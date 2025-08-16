// src/components/gameplay/map/mapConstants.ts

export const MAP_COLORS = {
  DEFAULT_REGION_BG: 'rgba(75, 85, 99, 0.1)', // Tailwind gray-500 with opacity
  CURRENT_LOCATION_NODE: '#F59E0B', // Tailwind amber-500
  DISCOVERED_LOCATION_NODE: '#34D399', // Tailwind emerald-400
  UNDISCOVERED_HINT_NODE: '#9CA3AF', // Tailwind gray-400
  PATH_DISCOVERED: '#6B7280', // Tailwind gray-500
  PATH_UNDISCOVERED_DASHED: '#4B5563', // Tailwind gray-600
  SAFE_ZONE_NODE: '#22C55E', // Tailwind green-500
  DANGER_ZONE_NODE: '#EF4444', // Tailwind red-500
  MAP_BACKGROUND: '#1F2937', // Tailwind gray-800 (used for SVG background)
  NODE_TEXT_COLOR: '#E5E7EB', // Tailwind gray-200
  HIGHLIGHT_BORDER_COLOR: '#FCD34D', // Tailwind amber-300
  NODE_STROKE_COLOR: '#4A5568', // Tailwind gray-600
  NODE_HOVER_STROKE_COLOR: '#A78BFA', // Tailwind violet-400
};

export const MAP_SIZES = {
  NODE_RADIUS_DEFAULT: 7,
  NODE_RADIUS_CURRENT: 9,
  NODE_RADIUS_HIGHLIGHT_FACTOR: 1.3, // Multiplier for highlighted node
  NODE_STROKE_WIDTH: 1,
  NODE_HOVER_STROKE_WIDTH: 2,
  NODE_TEXT_OFFSET_X: 10,
  NODE_TEXT_OFFSET_Y: 3,
  NODE_FONT_SIZE: '10px',
  PATH_STROKE_WIDTH: 1.5,
  PATH_HOVER_STROKE_WIDTH: 2.5,
  LEGEND_ITEM_SIZE: '12px',
  SVG_DEFAULT_WIDTH: '100%', // Relative to parent
  SVG_DEFAULT_HEIGHT: '500px', // Fixed height, or make it dynamic
  SVG_VIEWBOX_WIDTH: 1000, // Arbitrary viewBox for internal coordinate system
  SVG_VIEWBOX_HEIGHT: 1000,
};

export const MAP_CONFIG = {
  SHOW_REGION_BOUNDARIES: false, // Example: can be toggled by user later
  ALLOW_PAN_ZOOM: true, // Placeholder for future pan/zoom implementation
  NODE_CLICK_DELAY: 200, // ms, to distinguish click from drag if pan/zoom is added
};

// Consider adding IDs for different map types if you plan to have more than one map (e.g., world, dungeon)
export const MAP_IDS = {
  WORLD_MAP: 'world_map',
  // DUNGEON_MAP_PREFIX: 'dungeon_', // e.g., dungeon_dark_cave
};

// Map interaction types (could be useful for logging or analytics)
export const MAP_INTERACTION_TYPES = {
  CLICK_LOCATION: 'CLICK_LOCATION',
  HOVER_LOCATION: 'HOVER_LOCATION',
  REQUEST_TRAVEL: 'REQUEST_TRAVEL',
  EXPLORE_CONNECTION: 'EXPLORE_CONNECTION', // If paths can be clicked to reveal them
};

export const MAP_DEFAULTS = {
  LOCATION_DEFAULT_X: 50, // Fallback X if mapX is undefined
  LOCATION_DEFAULT_Y: 50, // Fallback Y if mapY is undefined
};