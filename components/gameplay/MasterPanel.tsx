
import React from 'react';
import { Master } from '../../types';

interface MasterPanelProps {
  master: Master;
}

// Reusable component for displaying a stat line
const StatDisplay: React.FC<{label: string, value: React.ReactNode, valueClassName?: string}> = React.memo(({label, value, valueClassName}) => (
    <div>
        <span className="text-gray-400">{label}:</span>
        <span className={`ml-2 font-semibold ${valueClassName || 'text-gray-100'}`}>{value}</span>
    </div>
));

// Reusable component for displaying a progress bar with label and value
const StatBar: React.FC<{label: string, value: number, max?: number, colorClass?: string}> = React.memo(({label, value, max = 100, colorClass = 'bg-teal-500'}) => (
  <div className="flex items-center space-x-2">
    <span className="text-sm text-gray-300 w-20 shrink-0">{label}</span>
    <div className="w-full bg-gray-900/50 rounded-full h-2.5 border border-gray-700 flex-grow">
      <div className={`${colorClass} h-full rounded-full transition-all duration-300`} style={{ width: `${(value / max) * 100}%` }}></div>
    </div>
    <span className="text-xs text-gray-400 w-12 text-right shrink-0">{value}/{max}</span>
  </div>
));


const getMoodColor = (mood: Master['mood']) => {
    switch(mood) {
        case 'Vui Vẻ':
        case 'Hài Lòng':
            return 'text-green-400';
        case 'Bực Bội':
        case 'Nghi Ngờ':
            return 'text-yellow-400';
        case 'Giận Dữ':
            return 'text-red-500';
        case 'Bình Thường':
        default:
            return 'text-gray-300';
    }
}

const MasterPanel: React.FC<MasterPanelProps> = React.memo(({ master }) => {
  const needsOrder: (keyof Master['needs'])[] = ['Dục Vọng', 'Tham Vọng', 'An Toàn', 'Giải Trí'];
  const needColorMapping: Record<keyof Master['needs'], string> = {
    'Dục Vọng': 'bg-red-500',
    'Tham Vọng': 'bg-amber-500',
    'An Toàn': 'bg-green-500',
    'Giải Trí': 'bg-cyan-500',
  };

  return (
    <div className="bg-slate-900/80 p-4 rounded-lg shadow-xl border border-rose-500/40 text-sm">
        <h3 className="text-xl font-bold text-rose-300 mb-4 text-center">
            Thông Tin Chủ Nhân
        </h3>

        {/* Basic Info */}
        <div className="space-y-1.5">
            <StatDisplay label="Tên" value={master.name} valueClassName="text-white" />
            <StatDisplay label="Giới tính" value={master.gender || 'Không rõ'} />
            <StatDisplay label="Tâm Trạng" value={master.mood} valueClassName={getMoodColor(master.mood)} />
        </div>
        
        <hr className="my-3 border-gray-700/50" />
        
        {/* Core Stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="col-span-2">
                <StatDisplay label="Cảnh giới" value={master.realm || 'Không rõ'} valueClassName="text-amber-400" />
            </div>
            
            <StatDisplay label="Sinh Lực" value={`${Math.floor(master.stats?.sinhLuc || 0)} / ${master.stats?.maxSinhLuc || 0}`} valueClassName="text-green-400" />
            <StatDisplay label="Linh Lực" value={`${Math.floor(master.stats?.linhLuc || 0)} / ${master.stats?.maxLinhLuc || 0}`} valueClassName="text-sky-400" />
            
            <StatDisplay label="Sức tấn công" value={master.stats?.sucTanCong || 0} valueClassName="text-orange-400" />
            <StatDisplay label="Tư chất" value={master.tuChat || 'Không rõ'} valueClassName="text-purple-300" />
            
            <div className="col-span-2">
                <StatDisplay label="Linh Căn" value={master.spiritualRoot || 'Không rõ'} />
            </div>
            <div className="col-span-2">
                <StatDisplay label="Thể chất" value={master.specialPhysique || 'Không rõ'} />
            </div>
            <div className="col-span-2">
                 <StatDisplay label="Thọ nguyên" value={`${Math.floor(master.stats?.thoNguyen || 0)} / ${master.stats?.maxThoNguyen || 0}`} valueClassName="text-green-400" />
            </div>
            <div className="col-span-2">
                <StatDisplay label="Thiện cảm" value={master.affinity} valueClassName={master.affinity >= 0 ? 'text-green-400' : 'text-red-400'} />
            </div>
        </div>

        <hr className="my-3 border-gray-700/50" />
        
        {/* Goals & Needs */}
        <div className="space-y-3">
             <p><strong className="text-gray-400">Mục Tiêu Hiện Tại:</strong> <span className="text-gray-200 italic ml-2">{master.currentGoal}</span></p>

            {/* Favor Bar */}
            {master.favor !== undefined && (
                 <StatBar label="Sủng Ái" value={master.favor} colorClass="bg-pink-500" />
            )}
            
             {/* Needs Section */}
            {master.needs && Object.keys(master.needs).length > 0 && (
                <div className="space-y-2 pt-2">
                    <strong className="text-gray-400 block mb-1">Nhu Cầu:</strong>
                    {needsOrder.map(needKey => {
                        const value = master.needs?.[needKey];
                        // Ensure we only render if the need exists and has a value
                        return value !== undefined && value !== null ? (
                            <StatBar key={needKey} label={needKey} value={value} colorClass={needColorMapping[needKey] || 'bg-teal-500'} />
                        ) : null;
                    })}
                </div>
            )}
        </div>

    </div>
  );
});

export default MasterPanel;