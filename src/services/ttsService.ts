import { MAX_TTS_LENGTH } from '../constants';

// Module-level audio reference (singleton pattern for audio playback)
let currentAudio: HTMLAudioElement | null = null;

/**
 * Clean text by removing special markers and markdown characters.
 */
function cleanTextForTTS(text: string): string {
    return text
        .replace(/\[TIMELINE\]|\[GEN_IMAGE\]|\[EXAM_PAPER\]|\[\/EXAM_PAPER\]|[*#_\[\]()]/g, '')
        .substring(0, MAX_TTS_LENGTH);
}

/**
 * Play Text-to-Speech using Google Cloud TTS API.
 */
export async function playTTS(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
): Promise<void> {
    if (!text) return;

    const clean = cleanTextForTTS(text);

    // Stop any currently playing audio
    stopCurrentAudio();

    onStart?.();
    console.log('🔊 Requesting Google Cloud TTS...');

    try {
        const API_KEY = import.meta.env.VITE_GOOGLE_TTS_API_KEY || '';
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text: clean },
                voice: {
                    languageCode: 'vi-VN',
                    name: 'vi-VN-Wavenet-C', // Giọng nữ cao cấp
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Google TTS API Error');
        }

        const data = await response.json();

        // Play the audio
        const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
        currentAudio = new Audio(audioSrc);

        currentAudio.onended = () => {
            onEnd?.();
            currentAudio = null;
        };

        currentAudio.onerror = () => {
            console.error('❌ Audio playback error');
            onEnd?.();
            currentAudio = null;
        };

        await currentAudio.play();
    } catch (error) {
        console.error('❌ Failed to play Google Cloud TTS:', error);
        onEnd?.();
        currentAudio = null;
    }
}

/**
 * Stop the currently playing audio.
 */
export function stopCurrentAudio(): void {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}
