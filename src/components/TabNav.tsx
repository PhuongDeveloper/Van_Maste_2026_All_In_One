import React from 'react';
import { MessageSquare, Target, BarChart3 } from 'lucide-react';

export type TabType = 'chat' | 'home' | 'stats';

interface TabNavProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const TAB_CONFIG: { key: TabType; icon: React.ReactNode; label: string }[] = [
    { key: 'chat', icon: <MessageSquare size={16} />, label: 'Học Bài' },
    { key: 'home', icon: <Target size={16} />, label: 'Lộ Trình' },
    { key: 'stats', icon: <BarChart3 size={16} />, label: 'Kỷ Lục' },
];

const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange }) => (
    <nav className="flex p-2 gap-2 mx-4 mt-4 bg-white rounded-3xl shadow-sm border border-slate-100">
        {TAB_CONFIG.map((t) => (
            <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold uppercase transition-all flex justify-center gap-2 ${activeTab === t.key
                        ? 'bg-[#0EA5E9] text-white shadow-lg'
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
            >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
            </button>
        ))}
    </nav>
);

export default TabNav;
