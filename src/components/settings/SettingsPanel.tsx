import { useState } from 'react';
import { X, Volume2, LogOut, User, Trophy, Zap, ChevronRight } from 'lucide-react';
import { logout, updateUserProfile } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import { PRONOUN_MAP, TTS_VOICE_MAP } from '../../constants';

interface SettingsPanelProps {
    open: boolean;
    onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
    const { userProfile, setUserProfile } = useAuth();
    const [saving, setSaving] = useState(false);

    const handleVoiceChange = async (gender: 'male' | 'female') => {
        if (!userProfile) return;
        setSaving(true);
        try {
            await updateUserProfile(userProfile.uid, { voiceGender: gender });
            setUserProfile({ ...userProfile, voiceGender: gender });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    const pronoun = userProfile ? PRONOUN_MAP[userProfile.voiceGender] : 'cô';
    const voiceName = userProfile ? TTS_VOICE_MAP[userProfile.voiceGender] : TTS_VOICE_MAP.female;
    const isMale = userProfile?.voiceGender === 'male';
    const avgScore = userProfile?.avgScore?.toFixed(1) ?? '--';
    const target = userProfile?.targetScore ?? '--';

    return (
        <>
            {/* Backdrop */}
            <div
                className={`sp-backdrop ${open ? 'sp-open' : ''}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <aside className={`sp-drawer ${open ? 'sp-open' : ''}`}>

                {/* ── Top bar ── */}
                <div className="sp-topbar">
                    <div className="sp-title">
                        <span>⚙️</span>
                        <span>Cài đặt</span>
                    </div>
                    <button className="sp-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="sp-body">

                    {/* Profile card */}
                    {userProfile && (
                        <div className="sp-profile-card">
                            <div className="sp-avatar">{userProfile.name.charAt(0).toUpperCase()}</div>
                            <div className="sp-profile-info">
                                <div className="sp-profile-name">{userProfile.name}</div>
                                <div className="sp-profile-email">{userProfile.email}</div>
                            </div>
                            <div className="sp-level-badge">{userProfile.level}</div>
                        </div>
                    )}

                    {/* Stats row */}
                    <div className="sp-stats-row">
                        <div className="sp-stat">
                            <div className="sp-stat-icon sp-stat-blue"><Trophy size={14} /></div>
                            <div>
                                <div className="sp-stat-val">{avgScore}/10</div>
                                <div className="sp-stat-lbl">Điểm TB</div>
                            </div>
                        </div>
                        <div className="sp-stat-div" />
                        <div className="sp-stat">
                            <div className="sp-stat-icon sp-stat-gold"><Zap size={14} /></div>
                            <div>
                                <div className="sp-stat-val">{target}/10</div>
                                <div className="sp-stat-lbl">Mục tiêu</div>
                            </div>
                        </div>
                        <div className="sp-stat-div" />
                        <div className="sp-stat">
                            <div className="sp-stat-icon sp-stat-green"><User size={14} /></div>
                            <div>
                                <div className="sp-stat-val">{userProfile?.submissionCount ?? 0}</div>
                                <div className="sp-stat-lbl">Bài nộp</div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Voice */}
                    <div className="sp-section">
                        <div className="sp-section-title">Giọng gia sư</div>
                        <p className="sp-section-desc">
                            AI sẽ xưng "<strong>{pronoun}</strong>" với bạn
                        </p>

                        {/* Toggle switch */}
                        <div className="sp-voice-toggle">
                            <button
                                className={`sp-voice-btn ${!isMale ? 'active female' : ''}`}
                                onClick={() => handleVoiceChange('female')}
                                disabled={saving}
                            >
                                <span className="sp-voice-emoji">👩</span>
                                <span>Giọng Nữ</span>
                                <span className="sp-voice-pronoun">Xưng: Cô</span>
                            </button>
                            <button
                                className={`sp-voice-btn ${isMale ? 'active male' : ''}`}
                                onClick={() => handleVoiceChange('male')}
                                disabled={saving}
                            >
                                <span className="sp-voice-emoji">👨</span>
                                <span>Giọng Nam</span>
                                <span className="sp-voice-pronoun">Xưng: Thầy</span>
                            </button>
                        </div>
                        {saving && <p className="sp-saving">Đang lưu...</p>}
                    </div>

                    {/* Section: Voice info */}
                    <div className="sp-section">
                        <div className="sp-section-title">Giọng đọc hiện tại</div>
                        <div className="sp-info-row">
                            <Volume2 size={14} style={{ color: 'var(--sp-accent)' }} />
                            <div>
                                <div className="sp-info-main">{voiceName}</div>
                                <div className="sp-info-sub">Google Cloud TTS Wavenet</div>
                            </div>
                            <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                        </div>
                    </div>

                    {/* Section: App info */}
                    <div className="sp-section">
                        <div className="sp-section-title">Ứng dụng</div>
                        <div className="sp-info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                            <div className="sp-info-main">Văn Master AI 2026 v1.0</div>
                            <div className="sp-info-sub">Powered by Google Gemini 2.5 Flash</div>
                        </div>
                    </div>
                </div>

                {/* ── Footer: logout ── */}
                <div className="sp-footer">
                    <button className="sp-logout-btn" onClick={handleLogout}>
                        <LogOut size={16} />
                        Đăng xuất
                    </button>
                </div>
            </aside>
        </>
    );
}
