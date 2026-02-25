import React from 'react';
import { BookOpen, FileText, Trophy } from 'lucide-react';

type Tab = 'chat' | 'home' | 'exam' | 'stats';

interface TabNavProps {
    active: Tab;
    onChange: (t: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode; emoji: string }[] = [
    { id: 'chat', label: 'Học Bài', icon: <BookOpen size={15} />, emoji: '📚' },
    { id: 'exam', label: 'Làm Bài', icon: <FileText size={15} />, emoji: '✍️' },
    { id: 'stats', label: 'Kỷ Lục', icon: <Trophy size={15} />, emoji: '🏆' },
];

export default function TabNav({ active, onChange }: TabNavProps) {
    return (
        <nav className="tab-nav">
            <div className="tab-track">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={`tab-btn ${active === t.id ? 'active' : ''}`}
                        onClick={() => onChange(t.id)}
                    >
                        <span className="tab-icon">{t.icon}</span>
                        <span className="tab-label">{t.label}</span>
                        {active === t.id && <span className="tab-indicator" />}
                    </button>
                ))}
            </div>
        </nav>
    );
}
