import React, { useState, ChangeEvent } from 'react';
import { FindLocationParams, SearchMethod, SEARCH_METHODS } from '../../../types';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import InputField from '../../ui/InputField';
import { VIETNAMESE } from '../../../constants';
import * as GameTemplates from '../../../templates';

interface FindLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (params: FindLocationParams) => void;
  isLoading: boolean;
}

const FindLocationModal: React.FC<FindLocationModalProps> = ({ isOpen, onClose, onSearch, isLoading }) => {
  const [selectedLocationTypes, setSelectedLocationTypes] = useState<Set<GameTemplates.LocationTypeValues>>(new Set());
  const [isSafeZone, setIsSafeZone] = useState<boolean | null>(null); // null for 'any'
  const [keywords, setKeywords] = useState('');
  const [searchMethod, setSearchMethod] = useState<SearchMethod>(SEARCH_METHODS[0]);

  const handleLocationTypeChange = (type: GameTemplates.LocationTypeValues) => {
    setSelectedLocationTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      locationTypes: Array.from(selectedLocationTypes),
      isSafeZone: isSafeZone,
      keywords: keywords,
      searchMethod: searchMethod,
    });
  };

  const locationTypeOptions = Object.values(GameTemplates.LocationType);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={VIETNAMESE.findLocationModalTitle || 'Tìm Kiếm Địa Điểm'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location Type Selection */}
        <fieldset>
          <legend className="text-md font-semibold text-gray-300 mb-2">{VIETNAMESE.findLocationTypeLabel || 'Loại Địa Điểm'}</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
            {locationTypeOptions.map(type => (
              <label key={type} className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLocationTypes.has(type)}
                  onChange={() => handleLocationTypeChange(type)}
                  className="h-4 w-4 rounded text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-400"
                />
                <span className="text-sm text-gray-200">{String(VIETNAMESE[`locationType_${type}` as keyof typeof VIETNAMESE] || type)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Location Properties */}
        <fieldset>
            <legend className="text-md font-semibold text-gray-300 mb-2">{VIETNAMESE.findLocationPropertiesLabel || 'Đặc Tính'}</legend>
            <InputField 
                label={VIETNAMESE.findLocationIsSafeLabel || 'Khu Vực An Toàn?'}
                id="isSafeZone"
                type="select"
                options={['Bất Kỳ', 'An Toàn', 'Nguy Hiểm']}
                value={isSafeZone === null ? 'Bất Kỳ' : isSafeZone ? 'An Toàn' : 'Nguy Hiểm'}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'An Toàn') setIsSafeZone(true);
                    else if (val === 'Nguy Hiểm') setIsSafeZone(false);
                    else setIsSafeZone(null);
                }}
            />
        </fieldset>
        
        {/* Keywords */}
        <InputField
          label={VIETNAMESE.findLocationKeywordsLabel || 'Từ Khóa Mô Tả'}
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder={VIETNAMESE.findLocationKeywordsPlaceholder || 'Vd: có linh khí nồng đậm, bị ma ám...'}
          textarea
          rows={2}
        />
        
        {/* Search Method */}
        <InputField
          label={VIETNAMESE.findLocationMethodLabel || 'Phương Thức Tìm Kiếm'}
          id="searchMethod"
          type="select"
          options={SEARCH_METHODS}
          value={searchMethod}
          onChange={(e) => setSearchMethod(e.target.value as SearchMethod)}
        />
        
        <div className="pt-4 border-t border-gray-700">
          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} loadingText="Đang tìm kiếm...">
            {VIETNAMESE.findLocationSubmitButton || 'Bắt Đầu Tìm Kiếm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FindLocationModal;