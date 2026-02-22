import { useState } from 'react';

// Components
import GlobalStyles from './components/GlobalStyles';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import TabNav, { type TabType } from './components/TabNav';
import ChatMessage from './components/chat/ChatMessage';
import ChatInput from './components/chat/ChatInput';
import QuickActions from './components/chat/QuickActions';
import HomeTab from './components/home/HomeTab';
import StatsTab from './components/stats/StatsTab';

// Hooks
import { useChat } from './hooks/useChat';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

// Icons
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [hasStarted, setHasStarted] = useState(false);

  const {
    messages,
    input,
    isLoading,
    isRewriting,
    isDiagnosing,
    autoPlayAudio,
    userData,
    dailyQuote,
    chatEndRef,
    fileInputRef,
    setInput,
    setAutoPlayAudio,
    handleSend,
    handleMagicRewrite,
    handlePlayTTS,
    startDiagnosis,
    handleFileSelect,
  } = useChat();

  const { isRecording, toggleRecording } = useSpeechRecognition((transcript) => {
    setInput(transcript);
  });

  // --- Splash Screen ---
  if (!hasStarted) {
    return <SplashScreen dailyQuote={dailyQuote} onStart={() => setHasStarted(true)} />;
  }

  // --- Main App ---
  return (
    <div className="flex flex-col h-screen bg-[#F0F9FF] text-slate-900 w-full max-w-screen-2xl mx-auto">
      <GlobalStyles />

      <Header
        userData={userData}
        autoPlayAudio={autoPlayAudio}
        onToggleAudio={() => setAutoPlayAudio(!autoPlayAudio)}
      />

      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-hidden relative mt-2">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-48 no-scrollbar">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} onPlayTTS={handlePlayTTS} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-3xl flex gap-2 items-center shadow-sm">
                    <Loader2 className="animate-spin text-[#0EA5E9]" />
                    <span className="text-xs font-bold text-slate-400">Master đang soạn bài...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-20">
              <QuickActions onSend={handleSend} />
              <ChatInput
                input={input}
                isRecording={isRecording}
                isRewriting={isRewriting}
                fileInputRef={fileInputRef}
                onInputChange={setInput}
                onSend={() => handleSend()}
                onToggleRecording={toggleRecording}
                onMagicRewrite={handleMagicRewrite}
                onFileSelect={handleFileSelect}
                onCameraClick={() => fileInputRef.current?.click()}
              />
            </div>
          </div>
        )}

        {/* Home Tab */}
        {activeTab === 'home' && (
          <HomeTab
            userData={userData}
            isDiagnosing={isDiagnosing}
            onStartDiagnosis={() => {
              startDiagnosis();
              setActiveTab('chat');
            }}
          />
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && <StatsTab />}
      </main>
    </div>
  );
}
