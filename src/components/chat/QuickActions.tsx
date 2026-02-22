import React from 'react';
import { Layout, Search, Zap, FileText } from 'lucide-react';

interface QuickActionsProps {
    onSend: (cmd: string) => void;
}

const QUICK_ACTIONS = [
    { icon: <Layout size={14} />, label: 'Đồ họa', cmd: 'Tóm tắt bài Vợ Nhặt bằng đồ họa Timeline!' },
    { icon: <Search size={14} />, label: 'Dẫn chứng', cmd: 'Tìm dẫn chứng NLXH 2026' },
    { icon: <Zap size={14} />, label: 'Quiz', cmd: '5 câu trắc nghiệm nhanh' },
    { icon: <FileText size={14} />, label: 'Đề thi', cmd: 'Cho 1 đề thi thử' },
];

const QuickActions: React.FC<QuickActionsProps> = ({ onSend }) => (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2">
        {QUICK_ACTIONS.map((btn, idx) => (
            <button
                key={idx}
                onClick={() => onSend(btn.cmd)}
                className="flex-shrink-0 bg-white text-[#0EA5E9] px-4 py-2 rounded-full text-xs font-bold shadow-sm border border-[#0EA5E9]/20 hover:bg-[#E0F2FE] flex items-center gap-2"
            >
                {btn.icon} {btn.label}
            </button>
        ))}
    </div>
);

export default QuickActions;
