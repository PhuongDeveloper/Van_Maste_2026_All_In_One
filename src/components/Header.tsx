import React from 'react';
import { Activity, Volume2, VolumeX } from 'lucide-react';
import type { UserData } from '../types';

interface HeaderProps {
    userData: UserData;
    autoPlayAudio: boolean;
    onToggleAudio: () => void;
}

const Header: React.FC<HeaderProps> = ({ userData, autoPlayAudio, onToggleAudio }) => (
    <header className="bg-white/80 backdrop-blur-xl p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#0EA5E9] to-[#38BDF8] rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Activity size={24} />
            </div>
            <div>
                <h2 className="text-lg font-black uppercase text-slate-800 leading-none">Văn Master</h2>
                <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-bold bg-[#0EA5E9] text-white px-2 py-0.5 rounded-md">
                        {userData.level}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">{userData.xp} XP</span>
                </div>
            </div>
        </div>
        <button
            onClick={onToggleAudio}
            className={`p-3 rounded-2xl border-2 transition-all ${autoPlayAudio
                    ? 'border-[#0EA5E9] text-[#0EA5E9] bg-[#E0F2FE]'
                    : 'border-slate-200 text-slate-400'
                }`}
        >
            {autoPlayAudio ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
    </header>
);

export default Header;
