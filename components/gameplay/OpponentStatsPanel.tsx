
import React from 'react';
import { NPC, YeuThu } from '../../types';
import { VIETNAMESE } from '../../constants';

const OpponentStatsPanel: React.FC<{ opponents: (NPC | YeuThu)[] }> = ({ opponents }) => {
    if (!opponents || opponents.length === 0) {
        return <div className="p-3 bg-gray-800 rounded-lg"><p className="text-gray-400 italic">{VIETNAMESE.noOpponents}</p></div>;
    }
    return (
        <div className="p-2 sm:p-3 bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-red-400 border-b border-gray-600 pb-1 mb-2 text-sm sm:text-base">{VIETNAMESE.opponentsPanelTitle}</h4>
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 -mb-2">
                {opponents.map(opp => {
                    if (!opp.stats) return null; // Type guard for optional stats
                    const hpPercent = ((opp.stats.sinhLuc ?? 0) / (opp.stats.maxSinhLuc ?? 1)) * 100;
                    const mpPercent = ((opp.stats.linhLuc ?? 0) / (opp.stats.maxLinhLuc ?? 1)) * 100;
                    const speciesOrRace = 'species' in opp ? opp.species : ('race' in opp ? opp.race : 'Không rõ');

                    return (
                        <div key={opp.id} className="w-40 sm:w-48 flex-shrink-0 p-2 bg-gray-700/50 rounded-md border border-gray-600">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-gray-200 text-sm truncate" title={`${opp.name} (${speciesOrRace || 'Không rõ'})`}>{opp.name} {speciesOrRace && speciesOrRace !== 'Nhân Tộc' ? `(${speciesOrRace})` : ''}</span>
                                <span className="text-xs text-gray-400 truncate">{opp.realm}</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                {/* HP Bar */}
                                <div title={`HP: ${opp.stats.sinhLuc} / ${opp.stats.maxSinhLuc}`}>
                                    <div className="flex justify-between mb-0.5 text-red-300 text-[10px]">
                                        <span>HP</span>
                                        <span>{opp.stats.sinhLuc} / {opp.stats.maxSinhLuc}</span>
                                    </div>
                                    <div className="w-full bg-gray-600 rounded-full h-1.5">
                                        <div className="bg-red-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${hpPercent}%` }}></div>
                                    </div>
                                </div>
                                {/* MP Bar (if applicable) */}
                                {(opp.stats.maxLinhLuc ?? 0) > 0 && (
                                    <div title={`MP: ${opp.stats.linhLuc} / ${opp.stats.maxLinhLuc}`}>
                                        <div className="flex justify-between mb-0.5 text-blue-300 text-[10px]">
                                            <span>MP</span>
                                            <span>{opp.stats.linhLuc} / {opp.stats.maxLinhLuc}</span>
                                        </div>
                                        <div className="w-full bg-gray-600 rounded-full h-1.5">
                                            <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${mpPercent}%` }}></div>
                                        </div>
                                    </div>
                                )}
                                {/* Other stats */}
                                <div className="pt-1 text-[11px]">
                                    <span className="font-semibold text-gray-400">ATK: </span>
                                    <span className="text-gray-200">{opp.stats.sucTanCong}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default OpponentStatsPanel;
