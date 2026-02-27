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
            background: 'var(--color-surface-2)',
            overflow: 'hidden',
        }}>
            {/* ── Section Tabs ── */}
            <div style={{
                display: 'flex',
                gap: 0,
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
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
                                padding: '14px 14px 12px',
                                background: isActive ? 'var(--color-surface-3)' : 'transparent',
                                border: 'none',
                                borderBottom: isActive ? `2px solid var(--color-primary)` : '2px solid transparent',
                                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all .25s ease',
                                fontFamily: 'inherit',
                                position: 'relative',
                            }}
                        >
                            <div style={{ fontSize: 18, marginBottom: 4, transition: 'transform 0.2s', transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>{sec.icon}</div>
                            <div style={{
                                fontSize: 12,
                                fontWeight: isActive ? 700 : 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>{sec.title}</div>
                            {pct > 0 && (
                                <div style={{
                                    fontSize: 10,
                                    color: pct === 100 ? 'var(--color-success)' : 'var(--color-text-muted)',
                                    fontWeight: 700,
                                    marginTop: 4,
                                    background: pct === 100 ? '#dcfce7' : 'var(--color-border)',
                                    padding: '2px 6px',
                                    borderRadius: 10,
                                    display: 'inline-block'
                                }}>{pct === 100 ? 'Hoàn thành' : `${pct}%`}</div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Section Header + Overall Progress ── */}
            <div style={{
                padding: '24px 24px 16px',
                flexShrink: 0,
                background: 'var(--color-surface-2)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, background: 'var(--color-surface)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: 'var(--shadow-sm)' }}>
                        {currentSection.icon}
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{currentSection.title}</h2>
                </div>

                {/* Overall section progress bar */}
                {(() => {
                    const pct = getSectionPct(activeSection, lessonProgress);
                    return (
                        <div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', fontSize: 12,
                                fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6,
                            }}>
                                <span>Tiến độ phần này</span>
                                <span style={{ color: pct > 0 ? (pct === 100 ? 'var(--color-success)' : 'var(--color-primary)') : 'var(--color-text-muted)' }}>{pct}%</span>
                            </div>
                            <div style={{
                                height: 6, borderRadius: 3, background: 'var(--color-border)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 3,
                                    width: `${pct}%`,
                                    background: pct === 100
                                        ? 'var(--color-success)'
                                        : 'var(--color-primary)',
                                    transition: 'width .5s ease',
                                }} />
                            </div>
                        </div>
                    );
                })()}

                {/* Section complete banner */}
                {getSectionPct(activeSection, lessonProgress) === 100 && (
                    <div style={{
                        marginTop: 16,
                        background: '#dcfce7',
                        border: '1px solid #bbf7d0',
                        borderRadius: 12,
                        padding: '12px 16px',
                        display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: '0 2px 4px rgba(22, 163, 74, 0.05)',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <CheckCircle size={18} color="var(--color-success)" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
                            Xuất sắc! Bạn đã hoàn thành toàn bộ phần {currentSection.title}.
                        </span>
                    </div>
                )}
            </div>

            {/* ── Lesson Cards ── */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
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
                                background: 'var(--color-surface)',
                                border: '1px solid',
                                borderColor: isCompleted ? '#bbf7d0' : isInProgress ? 'var(--color-primary-light)' : 'var(--color-border)',
                                borderRadius: 16,
                                padding: '16px 20px',
                                cursor: 'pointer',
                                transition: 'all .25s ease',
                                boxShadow: isCompleted ? '0 4px 12px rgba(22, 163, 74, 0.08)' : isInProgress ? '0 4px 12px rgba(21, 101, 192, 0.08)' : 'var(--shadow-sm)',
                                opacity: status === 'not_started' && idx > 0 ? 0.75 : 1,
                            }}
                            className="hover-scale"
                            onClick={() => onSelectLesson(currentSection.id, lesson.id)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = isCompleted ? '0 4px 12px rgba(22, 163, 74, 0.08)' : isInProgress ? '0 4px 12px rgba(21, 101, 192, 0.08)' : 'var(--shadow-sm)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                {/* Status icon */}
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isCompleted ? '#dcfce7' : isInProgress ? '#eff6ff' : 'var(--color-surface-3)',
                                    color: isCompleted ? 'var(--color-success)' : isInProgress ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    flexShrink: 0,
                                }}>
                                    {isCompleted
                                        ? <CheckCircle size={20} />
                                        : isInProgress
                                            ? <Play size={18} fill="currentColor" />
                                            : <Lock size={16} />
                                    }
                                </div>

                                {/* Lesson info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 14.5, fontWeight: (isInProgress || isCompleted) ? 700 : 600,
                                        color: isCompleted ? '#166534' : isInProgress ? 'var(--color-primary-dark)' : 'var(--color-text)',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        Bài {idx + 1}: {lesson.title}
                                    </div>
                                    {(isInProgress || isCompleted) && lp && (
                                        <div style={{
                                            fontSize: 11.5, color: 'var(--color-text-secondary)', marginTop: 4,
                                            fontWeight: 500
                                        }}>
                                            {lp.sectionsDone}/{lp.sectionsTotal} phần
                                            {lp.questionsAsked > 0 && ` • ${lp.questionsCorrect}/${lp.questionsAsked} câu đúng`}
                                        </div>
                                    )}
                                    {status === 'not_started' && (
                                        <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                            Chưa bắt đầu học
                                        </div>
                                    )}
                                </div>

                                {/* Action / badge */}
                                <div style={{ flexShrink: 0 }}>
                                    {isCompleted ? (
                                        <span style={{
                                            fontSize: 11, fontWeight: 700, color: 'var(--color-success)',
                                            background: '#dcfce7',
                                            padding: '4px 10px', borderRadius: 20,
                                        }}>Hoàn thành</span>
                                    ) : isInProgress ? (
                                        <span style={{
                                            fontSize: 11, fontWeight: 700, color: 'var(--color-primary)',
                                            background: '#eff6ff',
                                            padding: '4px 10px', borderRadius: 20,
                                        }}>Đang học</span>
                                    ) : (
                                        <ChevronRight size={20} color="var(--color-text-muted)" />
                                    )}
                                </div>
                            </div>

                            {/* Progress bar (visible when in-progress) */}
                            {isInProgress && pct > 0 && (
                                <div style={{ marginTop: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{
                                            height: 5, borderRadius: 3, background: '#eff6ff', flex: 1, overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: 3,
                                                width: `${pct}%`,
                                                background: 'var(--color-primary)',
                                                transition: 'width .5s ease',
                                            }} />
                                        </div>
                                        <div style={{
                                            fontSize: 11, color: 'var(--color-primary)', fontWeight: 700, minWidth: 32, textAlign: 'right'
                                        }}>{pct}%</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
