import React from 'react';
import { GraduationCap } from 'lucide-react';
import GlobalStyles from './GlobalStyles';
import { playTTS } from '../services/ttsService';

interface SplashScreenProps {
    dailyQuote: string;
    onStart: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ dailyQuote, onStart }) => {
    const handleStart = () => {
        onStart();
        setTimeout(() => {
            playTTS(
                'Chào mừng đến với Văn Master 2026, trợ lý học tập vui tính của bạn. Hãy bắt đầu hành trình chinh phục ngữ văn 9 cộng!'
            );
        }, 300);
    };

    return (
        <div className="h-screen bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex flex-col items-center justify-center p-6 text-white text-center">
            <GlobalStyles />
            <div className="bg-white/10 backdrop-blur-md p-10 rounded-[3rem] shadow-2xl border border-white/20 animate-zoom-in">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
                    <GraduationCap size={64} className="text-[#4F46E5]" />
                </div>
                <h1 className="text-5xl font-black mb-2 tracking-tighter">
                    VĂN MASTER <br />
                    <span className="text-[#FCD34D]">PRO 2026</span>
                </h1>
                {dailyQuote ? (
                    <div className="mb-8 px-4 py-3 bg-white/20 rounded-xl">
                        <p className="text-indigo-100 text-base font-medium italic">"{dailyQuote}"</p>
                    </div>
                ) : (
                    <p className="text-indigo-100 text-lg mb-8 font-medium">Lộ trình 9+ Ngữ Văn dành cho GenZ</p>
                )}
                <button
                    onClick={handleStart}
                    className="bg-[#FCD34D] text-[#78350F] px-12 py-5 rounded-full font-black text-xl shadow-[0_10px_0_#D97706] hover:translate-y-1 hover:shadow-[0_5px_0_#D97706] transition-all flex items-center gap-3 mx-auto"
                >
                    CHIẾN THÔI 🚀
                </button>
            </div>
        </div>
    );
};

export default SplashScreen;
