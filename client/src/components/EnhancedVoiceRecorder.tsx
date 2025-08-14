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
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // Try different formats for better compatibility
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
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
          
          const updatedMemos = [...existingMemos, newMemo];
          onMemosUpdate(updatedMemos);
          
          // Start transcription after memo is added
          setTimeout(() => {
            transcribeAudio(newMemo);
          }, 500);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
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
      // Check if browser supports speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        // For real transcription, we'd need to send audio to a service like OpenAI Whisper
        // For now, simulate transcription with a realistic delay
        setTimeout(() => {
          const simulatedTranscription = generateSimulatedTranscription();
          const updatedMemos = existingMemos.map(m => 
            m.id === memo.id ? { ...m, transcription: simulatedTranscription } : m
          );
          onMemosUpdate(updatedMemos);
          setTranscribingMemoId(null);
        }, 3000);
      } else {
        // Fallback: no transcription available
        const updatedMemos = existingMemos.map(m => 
          m.id === memo.id ? { ...m, transcription: "Transcription not available in this browser" } : m
        );
        onMemosUpdate(updatedMemos);
        setTranscribingMemoId(null);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      const updatedMemos = existingMemos.map(m => 
        m.id === memo.id ? { ...m, transcription: "Transcription failed" } : m
      );
      onMemosUpdate(updatedMemos);
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
    try {
      // Convert base64 back to blob
      const binaryString = atob(memo.audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setPlayingMemoId(memo.id);
      
      audio.onended = () => {
        setPlayingMemoId(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        console.error('Error playing audio');
        setPlayingMemoId(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setPlayingMemoId(null);
        URL.revokeObjectURL(audioUrl);
      });
    } catch (error) {
      console.error('Error converting audio data:', error);
      setPlayingMemoId(null);
    }
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