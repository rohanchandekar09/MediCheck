'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Mic, Square } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    // Request microphone permission and start speech recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim_transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + transcriptSegment + ' ');
        } else {
          interim_transcript += transcriptSegment;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript.trim()) {
        onTranscript(transcript.trim());
      }
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isListening ? (
        <>
          <Button
            size="sm"
            variant="destructive"
            onClick={stopListening}
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
          <div className="text-sm text-muted-foreground">
            Listening... {transcript && `"${transcript}"`}
          </div>
        </>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={startListening}
          className="gap-2"
        >
          <Mic className="w-4 h-4" />
          Voice Input
        </Button>
      )}
    </div>
  );
}
