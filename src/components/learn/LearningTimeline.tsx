import { useState } from 'react';
import { CheckCircle, Lock, Play, ChevronRight } from 'lucide-react';
import { CURRICULUM } from '../../constants/curriculum';
import type { LessonProgress } from '../../types';

interface LearningTimelineProps {
    lessonProgress: Record<string, LessonProgress>;
    onSelectLesson: (sectionId: string, lessonId: string) => void;
}

function getProgressPct(lp: LessonProgress | undefined): number {
    if (!lp || lp.sectionsTotal === 0) return 0;
    if (lp.status === 'completed') return 100;
    // Weight: 70% sections done, 30% questions correct
    const sectionPct = (lp.sectionsDone / lp.sectionsTotal) * 70;
    const questionPct = lp.questionsAsked > 0
        ? (lp.questionsCorrect / lp.questionsAsked) * 30
        : 0;
    return Math.min(Math.round(sectionPct + questionPct), 99);
}

function getSectionPct(sectionId: string, progress: Record<string, LessonProgress>): number {
    const section = CURRICULUM.find(s => s.id === sectionId);
    if (!section || section.lessons.length === 0) return 0;
    let total = 0;
    section.lessons.forEach(l => {
        total += getProgressPct(progress[`${sectionId}-${l.id}`]);
    });
    return Math.round(total / section.lessons.length);
}

export default function LearningTimeline({ lessonProgress, onSelectLesson }: LearningTimelineProps) {
    const [activeSection, setActiveSection] = useState(CURRICULUM[0].id);
    const currentSection = CURRICULUM.find(s => s.id === activeSection) || CURRICULUM[0];

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            overflow: 'hidden',
        }}>
            {/* ── Section Tabs ── */}
            <div style={{
                display: 'flex',
                gap: 0,
                background: 'rgba(15,23,42,.95)',
                borderBottom: '1px solid rgba(255,255,255,.08)',
                overflowX: 'auto',
                flexShrink: 0,
            }}>
                {CURRICULUM.map(sec => {
                    const pct = getSectionPct(sec.id, lessonProgress);
                    const isActive = sec.id === activeSection;
                    return (
                        <button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            style={{
                                flex: '1 0 auto',
                                minWidth: 0,
                                padding: '12px 14px 10px',
                                background: isActive ? 'rgba(255,255,255,.08)' : 'transparent',
                                border: 'none',
                                borderBottom: isActive ? `2px solid ${sec.color}` : '2px solid transparent',
                                color: isActive ? '#fff' : 'rgba(255,255,255,.5)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all .25s ease',
                                fontFamily: 'inherit',
                            }}
                        >
                            <div style={{ fontSize: 18, marginBottom: 2 }}>{sec.icon}</div>
                            <div style={{
                                fontSize: 11,
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>{sec.title}</div>
                            {pct > 0 && (
                                <div style={{
                                    fontSize: 9,
                                    color: pct === 100 ? '#4ade80' : sec.color,
                                    fontWeight: 700,
                                    marginTop: 2,
                                }}>{pct === 100 ? '✓ Xong' : `${pct}%`}</div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Section Header + Overall Progress ── */}
            <div style={{
                padding: '16px 20px 12px',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{currentSection.icon}</span>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>{currentSection.title}</h2>
                </div>
                {/* Overall section progress bar */}
                {(() => {
                    const pct = getSectionPct(activeSection, lessonProgress);
                    return (
                        <div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', fontSize: 10,
                                fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 4,
                            }}>
                                <span>Tiến trình phần</span>
                                <span style={{ color: pct === 100 ? '#4ade80' : currentSection.color }}>{pct}%</span>
                            </div>
                            <div style={{
                                height: 5, borderRadius: 3, background: 'rgba(255,255,255,.1)',
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 3,
                                    width: `${pct}%`,
                                    background: pct === 100
                                        ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                        : `linear-gradient(90deg, ${currentSection.color}, ${currentSection.color}cc)`,
                                    transition: 'width .5s ease',
                                }} />
                            </div>
                        </div>
                    );
                })()}
                {/* Section complete banner */}
                {getSectionPct(activeSection, lessonProgress) === 100 && (
                    <div style={{
                        marginTop: 10,
                        background: 'linear-gradient(135deg, rgba(74,222,128,.15), rgba(34,197,94,.1))',
                        border: '1px solid rgba(74,222,128,.3)',
                        borderRadius: 10,
                        padding: '8px 12px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        animation: 'slideDown .4s ease',
                    }}>
                        <CheckCircle size={14} color="#4ade80" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>
                            Bạn đã hoàn thành phần {currentSection.title}!
                        </span>
                    </div>
                )}
            </div>

            {/* ── Lesson Cards ── */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
            }}>
                {currentSection.lessons.map((lesson, idx) => {
                    const key = `${currentSection.id}-${lesson.id}`;
                    const lp = lessonProgress[key];
                    const pct = getProgressPct(lp);
                    const status = lp?.status || 'not_started';
                    const isCompleted = status === 'completed';
                    const isInProgress = status === 'in_progress';

                    return (
                        <div
                            key={lesson.id}
                            style={{
                                background: isCompleted
                                    ? 'linear-gradient(135deg, rgba(74,222,128,.08), rgba(34,197,94,.05))'
                                    : 'rgba(255,255,255,.04)',
                                border: isCompleted
                                    ? '1px solid rgba(74,222,128,.25)'
                                    : isInProgress
                                        ? `1px solid ${currentSection.color}40`
                                        : '1px solid rgba(255,255,255,.06)',
                                borderRadius: 14,
                                padding: '14px 16px',
                                cursor: 'pointer',
                                transition: 'all .25s ease',
                                opacity: status === 'not_started' && idx > 0 ? 0.7 : 1,
                            }}
                            onClick={() => onSelectLesson(currentSection.id, lesson.id)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {/* Status icon */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isCompleted
                                        ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                                        : isInProgress
                                            ? `linear-gradient(135deg, ${currentSection.color}, ${currentSection.color}cc)`
                                            : 'rgba(255,255,255,.08)',
                                    flexShrink: 0,
                                }}>
                                    {isCompleted
                                        ? <CheckCircle size={18} color="#fff" />
                                        : isInProgress
                                            ? <Play size={16} color="#fff" />
                                            : <Lock size={14} color="rgba(255,255,255,.3)" />
                                    }
                                </div>

                                {/* Lesson info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13.5, fontWeight: 700, color: '#fff',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        Bài {idx + 1}: {lesson.title}
                                    </div>
                                    {(isInProgress || isCompleted) && lp && (
                                        <div style={{
                                            fontSize: 10, color: 'rgba(255,255,255,.45)', marginTop: 3,
                                        }}>
                                            {lp.sectionsDone}/{lp.sectionsTotal} phần
                                            {lp.questionsAsked > 0 && ` • ${lp.questionsCorrect}/${lp.questionsAsked} câu đúng`}
                                        </div>
                                    )}
                                </div>

                                {/* Action / badge */}
                                <div style={{ flexShrink: 0 }}>
                                    {isCompleted ? (
                                        <span style={{
                                            fontSize: 9, fontWeight: 800, color: '#4ade80',
                                            background: 'rgba(74,222,128,.15)',
                                            padding: '3px 8px', borderRadius: 6,
                                            textTransform: 'uppercase', letterSpacing: '.04em',
                                        }}>Hoàn thành</span>
                                    ) : (
                                        <ChevronRight size={16} color="rgba(255,255,255,.3)" />
                                    )}
                                </div>
                            </div>

                            {/* Progress bar (visible when in-progress) */}
                            {isInProgress && pct > 0 && (
                                <div style={{ marginTop: 10 }}>
                                    <div style={{
                                        height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)',
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: 2,
                                            width: `${pct}%`,
                                            background: `linear-gradient(90deg, ${currentSection.color}, ${currentSection.color}bb)`,
                                            transition: 'width .5s ease',
                                        }} />
                                    </div>
                                    <div style={{
                                        fontSize: 9, color: currentSection.color,
                                        fontWeight: 700, textAlign: 'right', marginTop: 3,
                                    }}>{pct}%</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
