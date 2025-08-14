import { useState, useRef, useCallback } from "react";
import { useMacSounds } from "@/hooks/useMacSounds";

interface VoiceRecorderProps {
  onRecordingComplete: (audioData: string) => void;
  existingRecording?: string | null;
  disabled?: boolean;
}

export default function VoiceRecorder({ 
  onRecordingComplete, 
  existingRecording, 
  disabled = false 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const { playSound } = useMacSounds();

  const startRecording = useCallback(async () => {
    if (disabled) return;
    
    try {
      playSound('click');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result?.toString().split(',')[1] || '';
          onRecordingComplete(base64String);
        };
        reader.readAsDataURL(audioBlob);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      playSound('error');
    }
  }, [disabled, onRecordingComplete, playSound]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      playSound('click');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording, playSound]);

  const playRecording = useCallback(() => {
    if (!existingRecording) return;
    
    if (isPlaying) {
      audioElementRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    playSound('click');
    const audioData = `data:audio/webm;base64,${existingRecording}`;
    const audio = new Audio(audioData);
    audioElementRef.current = audio;
    
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      playSound('error');
    };
    
    audio.play();
    setIsPlaying(true);
  }, [existingRecording, isPlaying, playSound]);

  const deleteRecording = useCallback(() => {
    playSound('click');
    onRecordingComplete('');
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  }, [onRecordingComplete, playSound]);

  return (
    <div className="voice-recorder">
      <div className="voice-recorder-controls">
        {!existingRecording ? (
          <div className="recording-section">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
              className={`mac-button voice-record-btn ${isRecording ? 'recording' : ''}`}
              data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
            >
              <div className="voice-icon">
                {isRecording ? '⏹️' : '🎤'}
              </div>
              <span>{isRecording ? 'Stop Recording' : 'Record Voice Memo'}</span>
            </button>
            {isRecording && (
              <div className="recording-indicator">
                <div className="recording-dot"></div>
                <span>Recording...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="playback-section">
            <div className="sound-file-icon">
              <div className="mac-sound-icon">
                🔊
                <div className="sound-waves">
                  <div className="wave wave-1"></div>
                  <div className="wave wave-2"></div>
                  <div className="wave wave-3"></div>
                </div>
              </div>
              <span className="sound-file-label">Voice Memo</span>
            </div>
            <div className="playback-controls">
              <button
                onClick={playRecording}
                className="mac-button play-btn"
                data-testid={isPlaying ? "button-pause-recording" : "button-play-recording"}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <button
                onClick={deleteRecording}
                className="mac-button delete-btn"
                data-testid="button-delete-recording"
              >
                🗑️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}