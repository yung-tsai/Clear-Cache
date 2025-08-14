import { useState, useRef, useCallback } from "react";
import { useMacSounds } from "@/hooks/useMacSounds";

interface VoiceMemo {
  id: string;
  audioData: string;
  transcription?: string;
  duration: number;
  createdAt: Date;
  title?: string;
}

interface EnhancedVoiceRecorderProps {
  existingMemos?: VoiceMemo[];
  onMemosUpdate: (memos: VoiceMemo[]) => void;
  disabled?: boolean;
}

export default function EnhancedVoiceRecorder({ 
  existingMemos = [], 
  onMemosUpdate, 
  disabled = false 
}: EnhancedVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [playingMemoId, setPlayingMemoId] = useState<string | null>(null);
  const [transcribingMemoId, setTranscribingMemoId] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { playSound } = useMacSounds();

  const startRecording = useCallback(async () => {
    if (disabled || isRecording) return;
    
    try {
      playSound('click');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      setRecordingDuration(0);

      // Update recording duration
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(Date.now() - recordingStartTimeRef.current);
      }, 100);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result?.toString().split(',')[1] || '';
          const newMemo: VoiceMemo = {
            id: `memo-${Date.now()}`,
            audioData: base64String,
            duration: Date.now() - recordingStartTimeRef.current,
            createdAt: new Date(),
            title: `Recording ${existingMemos.length + 1}`
          };
          
          // Start transcription
          transcribeAudio(newMemo);
          
          const updatedMemos = [...existingMemos, newMemo];
          onMemosUpdate(updatedMemos);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      playSound('click'); // Error sound
    }
  }, [disabled, isRecording, existingMemos, onMemosUpdate, playSound]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      playSound('click');
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [isRecording, playSound]);

  const transcribeAudio = useCallback(async (memo: VoiceMemo) => {
    setTranscribingMemoId(memo.id);
    
    try {
      // Use Web Speech API for transcription simulation
      // In a real implementation, you'd send the audio to a transcription service
      setTimeout(() => {
        const simulatedTranscription = generateSimulatedTranscription();
        const updatedMemos = existingMemos.map(m => 
          m.id === memo.id ? { ...m, transcription: simulatedTranscription } : m
        );
        onMemosUpdate(updatedMemos);
        setTranscribingMemoId(null);
      }, 2000);
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscribingMemoId(null);
    }
  }, [existingMemos, onMemosUpdate]);

  const generateSimulatedTranscription = () => {
    const samples = [
      "I'm feeling really grateful today for all the opportunities I've been given.",
      "Need to remember to pick up groceries on the way home from work.",
      "The sunset was absolutely beautiful this evening. Perfect end to a great day.",
      "Meeting went well today. I think the project is finally coming together.",
      "Feeling a bit stressed about the deadline but trying to stay positive."
    ];
    return samples[Math.floor(Math.random() * samples.length)];
  };

  const playMemo = useCallback((memo: VoiceMemo) => {
    if (playingMemoId === memo.id) {
      setPlayingMemoId(null);
      return;
    }

    playSound('click');
    const audioBlob = new Blob([Uint8Array.from(atob(memo.audioData), c => c.charCodeAt(0))], { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    setPlayingMemoId(memo.id);
    
    audio.onended = () => {
      setPlayingMemoId(null);
      URL.revokeObjectURL(audioUrl);
    };
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      setPlayingMemoId(null);
    });
  }, [playingMemoId, playSound]);

  const deleteMemo = useCallback((memoId: string) => {
    playSound('click');
    const updatedMemos = existingMemos.filter(memo => memo.id !== memoId);
    onMemosUpdate(updatedMemos);
  }, [existingMemos, onMemosUpdate, playSound]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder">
      <div className="voice-recorder-header">
        <span className="voice-recorder-title">Voice Memos ({existingMemos.length})</span>
      </div>
      
      <div className="voice-recorder-controls">
        {/* Recording Section */}
        <div className="recording-section">
          <button
            className={`voice-record-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
          >
            <span className="voice-icon">🎤</span>
            <span>{isRecording ? 'Stop Recording' : 'New Recording'}</span>
          </button>
          
          {isRecording && (
            <div className="recording-indicator">
              <div className="recording-dot"></div>
              <span>Recording... {formatDuration(recordingDuration)}</span>
            </div>
          )}
        </div>

        {/* Voice Memos List */}
        {existingMemos.length > 0 && (
          <div className="voice-memos-list">
            <div className="memos-header">
              <span className="memos-title">Recorded Memos:</span>
            </div>
            
            {existingMemos.map((memo, index) => (
              <div key={memo.id} className="voice-memo-item" data-testid={`voice-memo-${index}`}>
                <div className="memo-header">
                  <div className="sound-file-icon">
                    <div className="mac-sound-icon">
                      🔊
                      {playingMemoId === memo.id && (
                        <div className="sound-waves">
                          <div className="wave wave-1"></div>
                          <div className="wave wave-2"></div>
                          <div className="wave wave-3"></div>
                        </div>
                      )}
                    </div>
                    <span className="sound-file-label">{memo.title}</span>
                  </div>
                  
                  <div className="memo-details">
                    <span className="memo-duration">{formatDuration(memo.duration)}</span>
                    <span className="memo-date">{memo.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Transcription */}
                {transcribingMemoId === memo.id ? (
                  <div className="memo-transcription transcribing">
                    <span className="transcription-label">Transcribing...</span>
                    <div className="transcription-loading">●●●</div>
                  </div>
                ) : memo.transcription ? (
                  <div className="memo-transcription">
                    <span className="transcription-label">Transcript:</span>
                    <p className="transcription-text">"{memo.transcription}"</p>
                  </div>
                ) : null}

                <div className="memo-controls">
                  <button
                    className="play-btn"
                    onClick={() => playMemo(memo)}
                    data-testid={`button-play-memo-${index}`}
                  >
                    {playingMemoId === memo.id ? '⏸️' : '▶️'} {playingMemoId === memo.id ? 'Pause' : 'Play'}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteMemo(memo.id)}
                    data-testid={`button-delete-memo-${index}`}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}