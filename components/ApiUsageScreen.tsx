
import React, { useState, useEffect, useMemo } from 'react';
import { GameScreen } from '../types';
import Button from './ui/Button';
import { getApiCallStats, resetApiCallStats, API_CALL_CATEGORIES, ApiCallCategory, ApiCallStats } from '../utils/apiUsageTracker';
import { useGame } from '../hooks/useGame';
import { VIETNAMESE } from '../constants';

const ApiUsageScreen: React.FC = () => {
    const { setCurrentScreen } = useGame();
    const [stats, setStats] = useState<ApiCallStats>({});

    useEffect(() => {
        setStats(getApiCallStats());
    }, []);

    const handleReset = () => {
        resetApiCallStats();
        setStats({});
    };

    const { totalCalls, sortedStats } = useMemo(() => {
        const total = Object.values(stats).reduce((sum, count) => sum + (count || 0), 0);
        const sorted = (Object.entries(stats) as [ApiCallCategory, number][])
            .filter(([, count]) => count > 0)
            .sort(([, countA], [, countB]) => countB - countA);
        return { totalCalls: total, sortedStats: sorted };
    }, [stats]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 p-4 sm:p-6 text-gray-100">
            <div className="w-full max-w-2xl bg-gray-900 shadow-2xl rounded-xl p-6 sm:p-8">
                <header className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">
                        Thống Kê Lượt Gọi API
                    </h1>
                    <Button variant="secondary" onClick={() => setCurrentScreen(GameScreen.Initial)}>
                        {VIETNAMESE.goBackButton}
                    </Button>
                </header>

                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center mb-6">
                    <p className="text-lg text-gray-400 mb-2">Tổng số lượt gọi API trong phiên này:</p>
                    <p className="text-6xl font-bold text-cyan-300 tracking-tight">{totalCalls.toLocaleString()}</p>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 -mr-2">
                    {sortedStats.length > 0 ? sortedStats.map(([category, count]) => {
                        const percentage = totalCalls > 0 ? (count / totalCalls) * 100 : 0;
                        const categoryLabel = API_CALL_CATEGORIES[category] || category;
                        return (
                            <div key={category} className="bg-gray-800/50 p-3 rounded-md">
                                <div className="flex justify-between items-center text-sm mb-1.5">
                                    <span className="font-semibold text-gray-200">{categoryLabel}</span>
                                    <span className="text-gray-300 font-mono">{count.toLocaleString()} lượt ({percentage.toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div 
                                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500" 
                                        style={{ width: `${percentage}%` }}
                                        title={`${percentage.toFixed(1)}%`}
                                    ></div>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="text-center text-gray-500 italic py-8">Chưa có lượt gọi API nào được ghi nhận.</p>
                    )}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleReset} variant="danger" className="w-full">
                        Reset Thống Kê
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">Bộ đếm này được lưu trữ trên trình duyệt của bạn và sẽ được giữ lại cho đến khi bạn nhấn nút "Reset".</p>
            </div>
        </div>
    );
};

export default ApiUsageScreen;
