
import React from 'react';
import { StartingLocation } from '../../../../types';
import * as GameTemplates from '../../../../templates';
import { VIETNAMESE } from '../../../../constants';
import InputField from '../../../ui/InputField';
import Button from '../../../ui/Button';

interface LocationsSectionProps {
  startingLocations: StartingLocation[];
  handleStartingLocationChange: (index: number, field: keyof StartingLocation, value: string | boolean) => void;
  addStartingLocation: () => void;
  removeStartingLocation: (index: number) => void;
}

const LocationsSection: React.FC<LocationsSectionProps> = ({ startingLocations, handleStartingLocationChange, addStartingLocation, removeStartingLocation }) => {
  return (
    <>
      <p className="text-xs text-amber-300 bg-amber-900/30 p-2 rounded-md italic">
        {VIETNAMESE.startingLocationNote || "Lưu ý: Địa điểm đầu tiên trong danh sách sẽ là vị trí khởi đầu của người chơi."}
      </p>
      {(startingLocations || []).map((location, index) => (
        <div key={index} className="space-y-2 border-b border-gray-800 py-3">
          <InputField label={`${VIETNAMESE.locationNameLabel} ${index + 1}`} id={`locName-${index}`} value={location.name} onChange={(e) => handleStartingLocationChange(index, 'name', e.target.value)} />
          <InputField label="Loại Địa Điểm" id={`locType-${index}`} type="select" options={Object.values(GameTemplates.LocationType)} value={location.locationType || GameTemplates.LocationType.DEFAULT} onChange={(e) => handleStartingLocationChange(index, 'locationType', e.target.value)} />
          <InputField label={VIETNAMESE.locationDescriptionLabel} id={`locDesc-${index}`} value={location.description} onChange={(e) => handleStartingLocationChange(index, 'description', e.target.value)} textarea rows={2} />
          <InputField label={VIETNAMESE.locationIsSafeZoneLabel} id={`locSafe-${index}`} type="checkbox" checked={location.isSafeZone || false} onChange={(e) => handleStartingLocationChange(index, 'isSafeZone', (e.target as HTMLInputElement).checked)} />
          <InputField label={VIETNAMESE.locationRegionIdLabel} id={`locRegion-${index}`} value={location.regionId || ''} onChange={(e) => handleStartingLocationChange(index, 'regionId', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="Tọa độ X (0-800)" 
              id={`locMapX-${index}`} 
              type="number"
              value={location.mapX ?? ''} 
              onChange={(e) => handleStartingLocationChange(index, 'mapX', e.target.value)} 
            />
            <InputField 
              label="Tọa độ Y (0-600)" 
              id={`locMapY-${index}`} 
              type="number"
              value={location.mapY ?? ''} 
              onChange={(e) => handleStartingLocationChange(index, 'mapY', e.target.value)} 
            />
          </div>
          <div className="text-right mt-2">
            <Button variant="danger" size="sm" onClick={() => removeStartingLocation(index)}>{VIETNAMESE.removeLocation}</Button>
          </div>
        </div>
      ))}
      <Button onClick={addStartingLocation} variant="secondary" size="sm" className="mt-3">{VIETNAMESE.addStartingLocation}</Button>
    </>
  );
};

export default LocationsSection;
