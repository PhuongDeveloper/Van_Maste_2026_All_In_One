import { useState, useRef, useEffect } from 'react';
import type { Message, UserData } from '../types';
import {
    DEFAULT_USER_DATA,
    EXAM_DATE,
    DAILY_QUOTE,
    WELCOME_MESSAGE,
    DIAGNOSTIC_QUIZ_PROMPT,
} from '../constants';
import { sendChatMessage, rewriteText, generateDiagnosticQuiz, isApiKeyConfigured } from '../services/geminiApi';
import { playTTS } from '../services/ttsService';

/**
 * Custom hook that encapsulates all chat-related state and logic.
 */
export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [autoPlayAudio, setAutoPlayAudio] = useState(false);

    const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize on mount
    useEffect(() => {
        // Calculate days left until exam
        const examDate = new Date(EXAM_DATE);
        const diff = Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        setUserData((p) => ({ ...p, daysLeft: diff }));

        // Load speech synthesis voices
        const voicesChanged = () => {
            const voices = window.speechSynthesis.getVoices();
            console.log('Available voices:', voices.map((v) => `${v.name} (${v.lang})`).join(', '));
        };
        window.speechSynthesis.onvoiceschanged = voicesChanged;
        voicesChanged();

        // Show welcome message after a short delay
        setTimeout(() => {
            setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
        }, 1000);
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handlePlayTTS = (text: string) => {
        playTTS(
            text,
            () => setIsPlayingAudio(true),
            () => setIsPlayingAudio(false)
        );
    };

    const handleSend = async (override?: string) => {
        const val = override || input;
        if (!val.trim() && !previewImage) return;
        if (isLoading) return;

        if (!isApiKeyConfigured()) {
            setMessages((p) => [
                ...p,
                {
                    role: 'assistant',
                    content:
                        "⚠️ API Key chưa được cấu hình!\n\n1. Truy cập: https://ai.google.dev\n2. Click 'Get API Key' để lấy key\n3. Mở file .env trong thư mục gốc\n4. Thay 'paste_your_api_key_here' bằng key của bạn\n5. Lưu file và reload trang",
                },
            ]);
            return;
        }

        const newMsg: Message = { role: 'user', content: val, image: previewImage };
        setMessages((p) => [...p, newMsg]);
        setInput('');
        setPreviewImage(null);
        setIsLoading(true);

        try {
            const { text: aiContent, generatedImageUrl } = await sendChatMessage(messages, val, previewImage);

            setMessages((p) => [
                ...p,
                { role: 'assistant', content: aiContent, generatedImage: generatedImageUrl },
            ]);

            if (autoPlayAudio && aiContent) handlePlayTTS(aiContent);
            setUserData((p) => ({ ...p, xp: p.xp + 50, progress: Math.min(p.progress + 2, 100) }));
        } catch (err) {
            console.error('API error:', err);
            setMessages((p) => [
                ...p,
                {
                    role: 'assistant',
                    content:
                        '⚠️ Lỗi kết nối AI!\n\nVui lòng kiểm tra:\n1. API Key trong file .env\n2. Kết nối internet\n3. Google AI API có khả dụng không',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMagicRewrite = async () => {
        if (!input.trim()) return;
        if (!isApiKeyConfigured()) {
            alert('⚠️ API Key chưa được cấu hình. Vui lòng thêm VITE_GOOGLE_API_KEY vào file .env');
            return;
        }

        setIsRewriting(true);
        try {
            const rewritten = await rewriteText(input);
            if (rewritten) setInput(rewritten);
        } catch (e) {
            console.error('Rewrite error:', e);
            alert('Lỗi khi nâng cấp văn phong. Vui lòng thử lại.');
        } finally {
            setIsRewriting(false);
        }
    };

    const startDiagnosis = async () => {
        setIsDiagnosing(true);
        setMessages([]);

        try {
            const aiContent = await generateDiagnosticQuiz(DIAGNOSTIC_QUIZ_PROMPT);

            setMessages([
                {
                    role: 'assistant',
                    content: `🎯 BÀI KIỂM TRA CHẨN ĐOÁN KIẾN THỨC\n\n${aiContent}\n\nHãy trả lời từng câu (viết: A, B, C hoặc D) để nhận được lộ trình học tập phù hợp với trình độ của bạn!`,
                },
            ]);

            handlePlayTTS(
                'Bắt đầu bài kiểm tra chẩn đoán kiến thức. Hãy trả lời các câu hỏi để nhận được lộ trình học tập phù hợp.'
            );
        } catch (err) {
            console.error('Diagnosis error:', err);
            setMessages([
                { role: 'assistant', content: '⚠️ Lỗi tạo bài kiểm tra. Vui lòng thử lại sau.' },
            ]);
        } finally {
            setIsDiagnosing(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                const r = new FileReader();
                r.onload = () => {
                    if (typeof r.result === 'string') {
                        setPreviewImage(r.result);
                    }
                };
                r.onerror = () => console.error('File read error');
                r.readAsDataURL(file);
            }
        }
    };

    return {
        // State
        messages,
        input,
        isLoading,
        isRewriting,
        isDiagnosing,
        isPlayingAudio,
        previewImage,
        autoPlayAudio,
        userData,
        dailyQuote: DAILY_QUOTE,

        // Refs
        chatEndRef,
        fileInputRef,

        // Setters
        setInput,
        setAutoPlayAudio,

        // Actions
        handleSend,
        handleMagicRewrite,
        handlePlayTTS,
        startDiagnosis,
        handleFileSelect,
    };
}
