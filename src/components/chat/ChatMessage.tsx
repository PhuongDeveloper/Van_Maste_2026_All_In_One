import React from 'react';
import { Play } from 'lucide-react';
import type { Message } from '../../types';
import TimelineInfographic from './TimelineInfographic';
import AcademicPaper from './AcademicPaper';

interface ChatMessageProps {
    message: Message;
    onPlayTTS: (text: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onPlayTTS }) => {
    const isUser = message.role === 'user';

    const renderContent = () => {
        if (message.content.includes('[TIMELINE]')) {
            return <TimelineInfographic data={message.content} />;
        }

        if (message.content.includes('[EXAM_PAPER]')) {
            return <AcademicPaper content={message.content} />;
        }

        return (
            <div
                className="whitespace-pre-wrap leading-relaxed text-sm md:text-base"
                dangerouslySetInnerHTML={{
                    __html: message.content.replace(
                        /([A-D])\./g,
                        '<br/><b class="text-[#0EA5E9] text-lg mr-1">$1.</b>'
                    ),
                }}
            />
        );
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div
                className={`max-w-[90%] md:max-w-[80%] ${isUser
                        ? 'bg-[#0EA5E9] text-white rounded-t-3xl rounded-bl-3xl p-4 shadow-lg'
                        : 'bg-white text-slate-800 rounded-t-3xl rounded-br-3xl p-5 shadow-sm border border-slate-100'
                    }`}
            >
                {message.image && (
                    <img src={message.image} alt="Uploaded content" className="rounded-2xl mb-4 border-4 border-white/20" />
                )}

                {renderContent()}

                {message.generatedImage && (
                    <img src={message.generatedImage} alt="AI generated" className="mt-4 rounded-2xl shadow-xl w-full" />
                )}

                {!isUser && (
                    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100/20">
                        <button
                            onClick={() => onPlayTTS(message.content)}
                            className="flex items-center gap-1 text-[10px] font-bold opacity-70 hover:opacity-100"
                        >
                            <Play size={12} /> ĐỌC
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
