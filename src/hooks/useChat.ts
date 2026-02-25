import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from '../types';
import type { ExamGrade } from '../types';
import {
    EXAM_DATE,
    DAILY_QUOTE,
    DIAGNOSTIC_QUIZ_PROMPT,
    ONBOARDING_WELCOME_TEMPLATE,
    PRONOUN_MAP,
    PROACTIVE_PROMPT,
    QUIZ_GENERATION_PROMPT,
} from '../constants';
import {
    sendChatMessage,
    rewriteText,
    generateDiagnosticQuiz,
    isApiKeyConfigured,
    sendProactiveMessage,
    generateDiagnosticMCQ,
    generateInfographic,
    generateImage,
} from '../services/geminiApi';
import type { DiagnosticQuizData } from '../services/geminiApi';
import { playTTS } from '../services/ttsService';
import { useAuth } from '../context/AuthContext';
import { saveTargetScore, completeAssessment } from '../services/firebaseService';

function extractScore(text: string): number | null {
    const match = text.match(/\b(\d+(?:[.,]\d+)?)\b/);
    if (!match) return null;
    const num = parseFloat(match[1].replace(',', '.'));
    return isNaN(num) ? null : num;
}

function buildTeaseMessage(score: number, pronoun: string): string {
    const P = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
    if (score > 10) {
        return `Thang điểm chỉ 0–10 thôi em ơi, ${score} điểm là vượt quá rồi. Em nhập lại nhé!`;
    }
    if (score < 5) {
        return `${P} nghĩ em có thể làm tốt hơn ${score} điểm. Đặt mục tiêu từ 5 trở lên nhé!`;
    }
    return '';
}

// ─── Quiz state machine ─────────────────────────────────────────────────────
type QuizPhase = 'idle' | 'reading' | 'questioning' | 'done';

interface QuizState {
    phase: QuizPhase;
    data: DiagnosticQuizData | null;
    currentQ: number;        // 0-based
    userAnswers: string[];   // 'a'|'b'|'c'|'d'
}

const QUIZ_INIT: QuizState = { phase: 'idle', data: null, currentQ: 0, userAnswers: [] };

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useChat(onStartDiagnosticExam?: () => void) {
    const { user, userProfile, setUserProfile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [awaitingScore, setAwaitingScore] = useState(false);
    const [awaitingTestChoice, setAwaitingTestChoice] = useState(false);
    const [quizState, setQuizState] = useState<QuizState>(QUIZ_INIT);
    const [pendingGraphicPrompt, setPendingGraphicPrompt] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Proactive agent timer
    const proactiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const proactiveBlockedRef = useRef(false); // prevent double-fire

    const voiceGenderRef = useRef(userProfile?.voiceGender || 'male');
    useEffect(() => {
        voiceGenderRef.current = userProfile?.voiceGender || 'male';
    }, [userProfile?.voiceGender]);

    const voiceGender = userProfile?.voiceGender || 'male';
    const pronoun = PRONOUN_MAP[voiceGender];

    const playNotification = useCallback(() => {
        try {
            const audio = new Audio('/audio/chat.mp3');
            audio.volume = 0.6;
            // Fire and forget; ignore autoplay errors
            void audio.play().catch(() => { });
        } catch {
            // ignore
        }
    }, []);

    const autoSpeak = useCallback((text: string) => {
        playTTS(text, voiceGenderRef.current, () => setIsPlayingAudio(true), () => setIsPlayingAudio(false));
    }, []);

    // ── Greeting (text + TTS on every page load) ─────────────────────────────
    const initDoneRef = useRef(false);
    useEffect(() => {
        if (!userProfile) return;
        if (initDoneRef.current) return;
        initDoneRef.current = true;

        const examDate = new Date(EXAM_DATE);
        const diff = Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const pr = PRONOUN_MAP[userProfile.voiceGender || 'male'];

        let timerId: ReturnType<typeof setTimeout>;

        // Determine onboarding state on load:
        // a) Never set up target → full onboarding
        // b) Has target but assessment not done → resume A/B choice
        // c) Fully onboarded → returning greeting
        if (!userProfile.targetScore) {
            setAwaitingScore(true);
            const welcome = ONBOARDING_WELCOME_TEMPLATE(userProfile.name, pr);
            timerId = setTimeout(() => {
                setMessages([{ role: 'assistant', content: welcome }]);
                playNotification();
                autoSpeak(welcome);
            }, 800);
        } else if (!userProfile.assessmentDone) {
            // Resume: target saved but assessment not yet done
            setAwaitingTestChoice(true);
            const resumeMsg = `Chào ${userProfile.name}! Em đã đặt mục tiêu ${userProfile.targetScore}/10 rồi.
Thầy cần đánh giá năng lực của em trước khi bắt đầu. Em chọn:

A. Làm bài kiểm tra đề thi thật (120 phút)
B. Trả lời 10 câu trắc nghiệm nhanh`;
            timerId = setTimeout(() => {
                setMessages([{ role: 'assistant', content: resumeMsg }]);
                playNotification();
                autoSpeak(resumeMsg);
            }, 800);
        } else {
            const returning = `Chào ${userProfile.name}! Còn ${diff} ngày nữa là thi. Hôm nay em muốn ôn gì?`;
            timerId = setTimeout(() => {
                setMessages([{ role: 'assistant', content: returning }]);
                playNotification();
                autoSpeak(returning);
            }, 800);
        }

        return () => clearTimeout(timerId);
    }, [userProfile?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Proactive agent ───────────────────────────────────────────────────────
    const resetProactiveTimer = useCallback((currentMessages: Message[]) => {
        if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
        // Only activate when onboarded + at least 2 msgs + no special mode active
        if (!userProfile?.isOnboarded) return;
        if (currentMessages.length < 2) return;

        proactiveTimerRef.current = setTimeout(async () => {
            if (proactiveBlockedRef.current) return;
            proactiveBlockedRef.current = true;
            const question = await sendProactiveMessage(currentMessages, PROACTIVE_PROMPT);
            proactiveBlockedRef.current = false;
            if (question) {
                setMessages(p => [...p, { role: 'assistant', content: question }]);
                playNotification();
            }
        }, 15_000); // 15 seconds
    }, [userProfile?.isOnboarded]);

    // Clean up timer on unmount
    useEffect(() => () => {
        if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
    }, []);

    const handlePlayTTS = (text: string) => {
        autoSpeak(text);
    };

    // ── addAssistantMsg helper ────────────────────────────────────────────────
    const addAssistant = useCallback((content: string, speak = true) => {
        setMessages(p => {
            const next = [...p, { role: 'assistant' as const, content }];
            resetProactiveTimer(next);
            return next;
        });
        playNotification();
        if (speak) autoSpeak(content);
    }, [autoSpeak, resetProactiveTimer, playNotification]);

    const askGraphicTopic = useCallback(() => {
        const suggestion = [
            'chân dung nhân vật trong một tác phẩm Văn',
            'khung cảnh một bài thơ em thích',
            'poster ôn thi cho một tác phẩm Ngữ văn 12',
        ].join('\n- ');
        const msg = `Em muốn tạo ảnh đồ hoạ về chủ đề gì?\n\nMột vài gợi ý:\n- ${suggestion}\n\nEm gõ ngắn gọn: tên tác phẩm, nhân vật hoặc chủ đề Ngữ văn mà em muốn vẽ nhé.`;
        setPendingGraphicPrompt(true);
        addAssistant(msg);
    }, [addAssistant]);

    // ── Quiz: show passage and reading prompt ─────────────────────────────────
    const startInlineQuiz = useCallback(async () => {
        setIsLoading(true);
        addAssistant('Đợi thầy chọn một đoạn trích nhé...');
        const data = await generateDiagnosticMCQ(QUIZ_GENERATION_PROMPT);
        setIsLoading(false);
        if (!data) {
            addAssistant('Lỗi tạo câu hỏi. Em thử lại sau nhé.');
            return;
        }
        setQuizState({ phase: 'reading', data, currentQ: 0, userAnswers: [] });
        const msg = `📖 **${data.source}**\n\n${data.passage}\n\n---\nSau khi đọc kĩ văn bản, thầy sẽ bắt đầu hỏi. Hãy đọc thật kĩ nhé. Nếu em đã sẵn sàng hãy gõ **"Bắt đầu"**.`;
        addAssistant(msg);
    }, [addAssistant]);

    // ── Quiz: ask next question ───────────────────────────────────────────────
    const askQuizQuestion = useCallback((data: DiagnosticQuizData, qIndex: number) => {
        const q = data.questions[qIndex];
        const msg = `**Câu ${qIndex + 1}/10:** ${q.q}\n\nA. ${q.a}\nB. ${q.b}\nC. ${q.c}\nD. ${q.d}`;
        addAssistant(msg);
    }, [addAssistant]);

    // ── Quiz: show final result ───────────────────────────────────────────────
    const finishQuiz = useCallback(async (data: DiagnosticQuizData, answers: string[]) => {
        let correct = 0;
        const lines: string[] = ['📊 Kết quả bài kiểm tra:\n'];
        data.questions.forEach((q, i) => {
            const userAns = answers[i]?.toLowerCase() || '?';
            const isRight = userAns === q.correct;
            if (isRight) correct++;
            const label = (k: string) => ({ a: 'A', b: 'B', c: 'C', d: 'D' }[k] || k);
            lines.push(`${i + 1}. ${isRight ? '✅ Đúng' : '❌ Sai'} — Em chọn ${label(userAns)} — Đáp án: ${label(q.correct)}`);
        });
        const pct = Math.round((correct / 10) * 100);
        const score = +(correct / 10 * 10).toFixed(1);
        lines.push(`\nTổng: ${correct}/10 (${pct}%)`);
        if (pct >= 80) lines.push('Năng lực đọc hiểu tốt — thầy sẽ đặt lộ trình nâng cao.');
        else if (pct >= 60) lines.push('Năng lực ở mức trung bình — lộ trình chuẩn sẽ phù hợp.');
        else lines.push('Em cần củng cố kiến thức nền — thầy sẽ đồng hành từ đầu.');


        setQuizState(QUIZ_INIT);
        addAssistant(lines.join('\n'));

        // Mark assessment as complete in Firestore — only now is the user fully onboarded
        if (user) {
            completeAssessment(user.uid, score).catch(console.error);
            setUserProfile(p => p ? {
                ...p,
                diagnosticScore: score,
                assessmentDone: true,
                isOnboarded: true,
                avgScore: score,
                submissionCount: 1,
            } : p);
        }
    }, [user, setUserProfile, addAssistant]);

    // ── Main send handler ─────────────────────────────────────────────────────
    const handleSend = async (override?: string) => {
        const val = (override || input).trim();
        if (!val && !previewImage) return;
        if (isLoading) return;

        const userMsg: Message = { role: 'user', content: val, image: previewImage };
        setMessages(p => [...p, userMsg]);
        setInput('');
        setPreviewImage(null);

        // Reset proactive timer on user activity
        if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);

        // ── Đang chờ mô tả chủ đề đồ hoạ ─────────────────────────────────────
        if (pendingGraphicPrompt) {
            setPendingGraphicPrompt(false);
            const topic = val;
            if (!topic) {
                addAssistant('Em mô tả rõ hơn chủ đề Ngữ văn mà em muốn vẽ nhé.');
                setPendingGraphicPrompt(true);
                return;
            }

            if (!isApiKeyConfigured()) {
                addAssistant('API Key chưa được cấu hình. Thêm VITE_GOOGLE_API_KEY vào file .env để tạo ảnh đồ hoạ.');
                return;
            }

            // Nhắc xác nhận chủ đề Ngữ văn, rồi tạo ảnh bằng Imagen 3.0
            addAssistant(`Thầy sẽ tạo một ảnh đồ hoạ minh hoạ cho chủ đề Ngữ văn: "${topic}". Đợi một chút nhé...`, false);
            setIsLoading(true);
            try {
                const prompt = `Tạo một ảnh minh hoạ/đồ hoạ đẹp, hiện đại cho môn Ngữ văn THPT Việt Nam với chủ đề: "${topic}".
Yêu cầu: phải liên quan rõ ràng đến tác phẩm, nhân vật, bài thơ, chủ đề nghị luận hoặc kiến thức Ngữ văn; nếu chủ đề không thuộc môn Văn thì thay vào đó hãy thể hiện một tấm bảng ghi "Chủ đề này không thuộc môn Văn".
Phong cách: màu sắc ấm, chữ dễ đọc, phù hợp học sinh ôn thi tốt nghiệp THPT.`;
                const imgUrl = await generateImage(prompt);
                if (imgUrl) {
                    setMessages(p => {
                        const next = [
                            ...p,
                            {
                                role: 'assistant' as const,
                                content: `Đồ hoạ cho chủ đề "${topic}":`,
                                generatedImage: imgUrl,
                            },
                        ];
                        resetProactiveTimer(next);
                        return next;
                    });
                    playNotification();
                } else {
                    addAssistant('Thầy chưa tạo được ảnh đồ hoạ cho chủ đề này. Em thử mô tả lại ngắn gọn hơn hoặc thử lại sau nhé.');
                }
            } catch {
                addAssistant('Có lỗi khi tạo ảnh đồ hoạ. Em thử lại sau nhé.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // ── Onboarding: awaiting target score ────────────────────────────────
        if (awaitingScore) {
            const score = extractScore(val);
            if (score === null) {
                const resp = `${PRONOUN_MAP[voiceGender].charAt(0).toUpperCase() + PRONOUN_MAP[voiceGender].slice(1)} chưa hiểu, em nhập một số từ 5 đến 10 nhé.`;
                addAssistant(resp);
                return;
            }
            const tease = buildTeaseMessage(score, pronoun);
            if (tease) { addAssistant(tease); return; }

            if (user) {
                await saveTargetScore(user.uid, score);
                setUserProfile(prev => prev ? { ...prev, targetScore: score, isOnboarded: true } : prev);
            }
            setAwaitingScore(false);
            setAwaitingTestChoice(true);

            const p = pronoun;
            const confirmMsg = `Mục tiêu ${score}/10 đã lưu.\n\nĐể ${p} biết năng lực hiện tại của em, em muốn thử cách nào?\n\n**A.** Làm bài kiểm tra đề thi thật (120 phút)\n**B.** Trả lời 10 câu trắc nghiệm nhanh`;
            addAssistant(confirmMsg);
            return;
        }

        // ── Onboarding: awaiting A/B test choice ─────────────────────────────
        if (awaitingTestChoice) {
            const choice = val.trim().toUpperCase().slice(0, 1);
            if (choice === 'A') {
                setAwaitingTestChoice(false);
                addAssistant('Tốt! Thầy sẽ chuyển em sang phòng thi. Nhấn **Bắt Đầu** khi em sẵn sàng — đề sẽ được mở sau khi bắt đầu.');
                setTimeout(() => onStartDiagnosticExam?.(), 1200);
                return;
            }
            if (choice === 'B') {
                setAwaitingTestChoice(false);
                await startInlineQuiz();
                return;
            }
            addAssistant('Em gõ **A** để làm đề thi hoặc **B** để trả lời trắc nghiệm nhé.');
            return;
        }

        // ── Inline quiz flow ──────────────────────────────────────────────────
        if (quizState.phase === 'reading') {
            if (val.toLowerCase().includes('bắt đầu') || val.toLowerCase() === 'bt' || val === '1') {
                setQuizState(p => ({ ...p, phase: 'questioning' }));
                askQuizQuestion(quizState.data!, 0);
            } else {
                addAssistant('Gõ **"Bắt đầu"** khi em đã đọc xong nhé.');
            }
            return;
        }

        // ── Tự phát hiện yêu cầu tạo đồ hoạ từ câu chat ──────────────────────
        const lower = val.toLowerCase();
        const wantsGraphic = /(đồ hoạ|đồ họa|đồ họa|infographic|poster|ảnh minh hoạ|ảnh minh họa|tạo ảnh|vẽ giúp em)/i.test(lower);
        if (wantsGraphic) {
            askGraphicTopic();
            return;
        }

        if (quizState.phase === 'questioning' && quizState.data) {
            const ans = val.trim().toLowerCase().slice(0, 1);
            if (!['a', 'b', 'c', 'd'].includes(ans)) {
                addAssistant('Em chọn A, B, C hoặc D nhé.');
                return;
            }
            const newAnswers = [...quizState.userAnswers, ans];
            const nextQ = quizState.currentQ + 1;

            if (nextQ >= 10) {
                setQuizState(p => ({ ...p, userAnswers: newAnswers, phase: 'done' }));
                await finishQuiz(quizState.data, newAnswers);
            } else {
                setQuizState(p => ({ ...p, userAnswers: newAnswers, currentQ: nextQ }));
                askQuizQuestion(quizState.data, nextQ);
            }
            return;
        }

        // ── Normal chat ───────────────────────────────────────────────────────
        if (!isApiKeyConfigured()) {
            addAssistant('API Key chưa được cấu hình. Thêm VITE_GOOGLE_API_KEY vào file .env.');
            return;
        }

        setIsLoading(true);
        try {
            const { text: aiContent, generatedImageUrl } = await sendChatMessage(messages, val, previewImage);

            // ── Detect [INFOGRAPHIC] tag → call nanobanana pro ────────────────
            let finalText = aiContent;
            let infographicUrl: string | null = generatedImageUrl;

            const infMatch = aiContent.match(/\[INFOGRAPHIC\]([^\[]*)\[\/INFOGRAPHIC\]/);
            if (infMatch) {
                const workTitle = infMatch[1].trim();
                finalText = aiContent.replace(/\[INFOGRAPHIC\][^\[]*\[\/INFOGRAPHIC\]/g,
                    `Đang tạo infographic về "${workTitle}"...`);
                // Show loading message immediately
                setMessages(p => {
                    const next = [...p, { role: 'assistant' as const, content: finalText }];
                    resetProactiveTimer(next);
                    return next;
                });
                playNotification();
                // Generate in background
                generateInfographic(workTitle).then(imgUrl => {
                    if (imgUrl) {
                        setMessages(p => {
                            const next = [
                                ...p,
                                {
                                    role: 'assistant' as const,
                                    content: `Infographic "${workTitle}":`,
                                    generatedImage: imgUrl,
                                },
                            ];
                            resetProactiveTimer(next);
                            return next;
                        });
                        playNotification();
                    } else {
                        addAssistant(`Không thể tạo infographic về "${workTitle}". API chưa hỗ trợ hoặc lỗi kết nối.`);
                    }
                });
            } else {
                setMessages(p => {
                    const next = [...p, { role: 'assistant' as const, content: finalText, generatedImage: infographicUrl }];
                    resetProactiveTimer(next);
                    return next;
                });
                playNotification();
            }

            if (finalText) autoSpeak(finalText);
            if (user && userProfile) {
                import('../services/firebaseService').then(({ updateUserProfile }) => {
                    updateUserProfile(user.uid, {
                        xp: (userProfile.xp || 0) + 50,
                        progress: Math.min((userProfile.progress || 0) + 2, 100),
                    });
                });
                setUserProfile(p => p ? { ...p, xp: p.xp + 50, progress: Math.min(p.progress + 2, 100) } : p);
            }
        } catch (err) {
            console.error('API error:', err);
            addAssistant('Lỗi kết nối AI. Kiểm tra kết nối và API Key rồi thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMagicRewrite = async () => {
        if (!input.trim()) return;
        if (!isApiKeyConfigured()) return;
        setIsRewriting(true);
        try {
            const rewritten = await rewriteText(input);
            if (rewritten) setInput(rewritten);
        } catch (e) {
            console.error('Rewrite error:', e);
        } finally {
            setIsRewriting(false);
        }
    };

    const startDiagnosis = async () => {
        setIsDiagnosing(true);
        setMessages([]);
        try {
            const aiContent = await generateDiagnosticQuiz(DIAGNOSTIC_QUIZ_PROMPT);
            setMessages([{ role: 'assistant', content: `BÀI KIỂM TRA CHẨN ĐOÁN\n\n${aiContent}\n\nTrả lời: A, B, C hoặc D cho từng câu.` }]);
            playNotification();
            autoSpeak('Bắt đầu bài kiểm tra chẩn đoán.');
        } catch {
            setMessages([{ role: 'assistant', content: 'Lỗi tạo bài kiểm tra. Thử lại sau.' }]);
            playNotification();
        } finally {
            setIsDiagnosing(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                const r = new FileReader();
                r.onload = () => { if (typeof r.result === 'string') setPreviewImage(r.result); };
                r.readAsDataURL(file);
            }
        }
    };

    const startGraphicFlow = () => {
        // Giả lập như user vừa nói "Em muốn tạo ảnh đồ họa ạ"
        const syntheticUser: Message = { role: 'user', content: 'Em muốn tạo ảnh đồ hoạ ạ' };
        setMessages(prev => [...prev, syntheticUser]);
        askGraphicTopic();
    };

    return {
        messages, input, isLoading, isRewriting, isDiagnosing, isPlayingAudio, previewImage,
        quizPhase: quizState.phase,
        userData: {
            level: userProfile?.level || 'Tan Binh',
            status: 'San sang chien',
            progress: userProfile?.progress || 5,
            xp: userProfile?.xp || 0,
            streak: userProfile?.streak || 1,
            daysLeft: 0,
        },
        dailyQuote: DAILY_QUOTE,
        chatEndRef, fileInputRef,
        setInput, setPreviewImage,
        handleSend, handleMagicRewrite, handlePlayTTS, startDiagnosis, handleFileSelect, startGraphicFlow,
        addGradeMsg: (grade: ExamGrade, resolvedWeaknesses?: string[]) => {
            const scoreOutOf10 = +(grade.score / grade.maxScore * 10).toFixed(1);
            const label = scoreOutOf10 >= 8 ? 'Xuất sắc' : scoreOutOf10 >= 6.5 ? 'Khá' : scoreOutOf10 >= 5 ? 'Trung bình' : 'Cần cố gắng';
            const summary = `Thầy đã chấm xong bài vừa rồi của em.\n\nĐiểm: ${grade.score}/${grade.maxScore} (${scoreOutOf10}/10) — ${label}.\n${grade.feedback}`;
            setMessages(prev => {
                const gradeMsg = { role: 'assistant' as const, content: summary, examGrade: grade };
                // If any weaknesses were resolved, append a celebration message
                if (resolvedWeaknesses && resolvedWeaknesses.length > 0) {
                    const resolvedList = resolvedWeaknesses.map(w => `✅ ${w}`).join('\n');
                    const resolvedMsg = {
                        role: 'assistant' as const,
                        content: `🎉 Tuyệt vời! Em đã khắc phục được ${resolvedWeaknesses.length > 1 ? 'các' : 'lỗi'} sau đây so với các bài trước:\n\n${resolvedList}\n\nĐây là dấu hiệu tiến bộ rõ rệt. Thầy sẽ xóa những lỗi này khỏi danh sách cần cải thiện của em.`,
                    };
                    return [...prev, gradeMsg, resolvedMsg];
                }
                return [...prev, gradeMsg];
            });
            playNotification();
        },
    };
}
