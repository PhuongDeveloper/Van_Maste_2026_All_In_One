import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook for Web Speech API speech recognition.
 * Handles microphone recording and speech-to-text conversion.
 */
export function useSpeechRecognition(onResult: (transcript: string) => void) {
    const [isRecording, setIsRecording] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognitionAPI =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognitionAPI) {
            const recognition = new SpeechRecognitionAPI();
            recognition.continuous = false;
            recognition.lang = 'vi-VN';

            recognition.onresult = (e: any) => {
                if (e.results[0]) {
                    onResult(e.results[0][0].transcript);
                    setIsRecording(false);
                }
            };

            recognition.onend = () => setIsRecording(false);
            recognition.onerror = () => setIsRecording(false);

            recognitionRef.current = recognition;
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const startRecording = () => {
        recognitionRef.current?.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        recognitionRef.current?.stop();
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return { isRecording, toggleRecording };
}
