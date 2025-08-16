// src/components/EventsScreen.tsx
import React, { useState, useMemo } from 'react';
import { GameScreen, GameEvent } from '../types';
import { useGame } from '../hooks/useGame';
import Button from './ui/Button';
import { VIETNAMESE } from '../constants';
import Modal from './ui/Modal';
import { getWorldDateDifferenceString } from '../utils/dateUtils';

const EventsScreen: React.FC = () => {
    const { knowledgeBase, setCurrentScreen } = useGame();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'finished'>('upcoming');
    const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);

    const { gameEvents, worldDate, discoveredLocations } = knowledgeBase;

    const discoveredEvents = useMemo(() => {
        return gameEvents.filter(event => event.isDiscovered);
    }, [gameEvents]);

    const filteredEvents = useMemo(() => {
        const statusMap = {
            upcoming: 'Sắp diễn ra',
            ongoing: 'Đang diễn ra',
            finished: 'Đã kết thúc',
        };
        return discoveredEvents.filter(event => event.status === statusMap[activeTab]);
    }, [discoveredEvents, activeTab]);

    const getEventLocationName = (event: GameEvent) => {
        const specificLoc = discoveredLocations.find(loc => loc.id === event.specificLocationId);
        if (specificLoc) return specificLoc.name;
        const generalLoc = discoveredLocations.find(loc => loc.id === event.locationId);
        return generalLoc?.name || 'Không rõ';
    };

    const renderEventCard = (event: GameEvent) => (
        <div 
            key={event.id}
            className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 hover:bg-gray-700/50 hover:border-indigo-500 transition-all cursor-pointer"
            onClick={() => setSelectedEvent(event)}
        >
            <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <p className="font-bold text-lg text-indigo-300">{event.title}</p>
                    <p className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full inline-block mt-1">{event.type}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                     <p className="text-sm font-semibold text-amber-400">{getWorldDateDifferenceString(event.startDate, event.endDate, worldDate)}</p>
                     <p className="text-xs text-gray-500 mt-1">Tại: {getEventLocationName(event)}</p>
                </div>
            </div>
        </div>
    );
    
    const renderEventList = () => {
        if (filteredEvents.length === 0) {
            let message = '';
            switch (activeTab) {
                case 'upcoming': message = VIETNAMESE.noUpcomingEvents; break;
                case 'ongoing': message = VIETNAMESE.noOngoingEvents; break;
                case 'finished': message = VIETNAMESE.noFinishedEvents; break;
            }
            return <p className="text-center text-gray-400 italic mt-8">{message}</p>;
        }
        return (
            <div className="space-y-3">
                {filteredEvents.map(renderEventCard)}
            </div>
        );
    };

    return (
        <>
            <div className="min-h-screen flex flex-col bg-gray-800 p-4 sm:p-6 text-gray-100">
                <div className="w-full max-w-3xl mx-auto bg-gray-900 shadow-2xl rounded-xl flex flex-col h-[90vh]">
                    <header className="mb-4 flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500">
                            {VIETNAMESE.eventsPanelTitle}
                        </h1>
                        <Button variant="secondary" onClick={() => setCurrentScreen(GameScreen.Gameplay)}>
                            {VIETNAMESE.goBackButton}
                        </Button>
                    </header>
                    
                    <div className="flex border-b border-gray-700 flex-shrink-0 px-4">
                        <button onClick={() => setActiveTab('upcoming')} className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'upcoming' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'}`}>{VIETNAMESE.upcomingEventsTab}</button>
                        <button onClick={() => setActiveTab('ongoing')} className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'ongoing' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'}`}>{VIETNAMESE.ongoingEventsTab}</button>
                        <button onClick={() => setActiveTab('finished')} className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'finished' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'}`}>{VIETNAMESE.finishedEventsTab}</button>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
                        {renderEventList()}
                    </div>
                </div>
            </div>

            {selectedEvent && (
                <Modal
                    isOpen={!!selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    title={VIETNAMESE.eventDetailsTitle}
                >
                    <div className="space-y-3 text-sm">
                        <h3 className="text-xl font-bold text-indigo-300">{selectedEvent.title}</h3>
                        <p><strong className="text-gray-400">Loại sự kiện:</strong> {selectedEvent.type}</p>
                        <p><strong className="text-gray-400">Địa điểm:</strong> {getEventLocationName(selectedEvent)}</p>
                        <p><strong className="text-gray-400">Thời gian:</strong> {`Từ ngày ${selectedEvent.startDate.day}/${selectedEvent.startDate.month}/${selectedEvent.startDate.year} đến ngày ${selectedEvent.endDate.day}/${selectedEvent.endDate.month}/${selectedEvent.endDate.year}`}</p>
                        <p><strong className="text-gray-400">Trạng thái:</strong> {selectedEvent.status} ({getWorldDateDifferenceString(selectedEvent.startDate, selectedEvent.endDate, worldDate)})</p>
                        <p className="pt-3 border-t border-gray-700 mt-3 text-gray-200 whitespace-pre-wrap">{selectedEvent.description}</p>
                        {selectedEvent.details && selectedEvent.details.length > 0 && (
                            <div className="pt-3 border-t border-gray-700 mt-3">
                                <strong className="text-indigo-300">Thông tin đã biết:</strong>
                                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-300">
                                    {selectedEvent.details.map(detail => <li key={detail.id}>{detail.text}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
};

export default EventsScreen;