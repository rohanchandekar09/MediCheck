'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, Loader } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface MedicineInfo {
  name: string;
  uses?: string;
  dosage?: string;
  sideEffects?: string[];
  warnings?: string[];
  source?: string;
}

// API service for fetching medicine data from RxNav and OpenFDA
const medicineApiService = {
  async fetchFromRxNav(medicineName: string): Promise<MedicineInfo | null> {
    try {
      console.log('[v0] Fetching from RxNav:', medicineName);
      const response = await fetch(
        `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(medicineName)}`
      );
      const data = await response.json();

      // RxNav API structure: drugGroup.conceptGroup[0].conceptProperties[0]
      const conceptGroup = data.drugGroup?.conceptGroup?.[0];
      if (conceptGroup?.conceptProperties?.[0]) {
        const drug = conceptGroup.conceptProperties[0];
        console.log('[v0] RxNav found drug:', drug.name);
        return {
          name: drug.name || medicineName,
          uses: 'For detailed information, consult with a healthcare provider or visit RxNav database',
          source: 'RxNav (NIH)',
        };
      }
      return null;
    } catch (error) {
      console.error('[v0] RxNav API error:', error);
      return null;
    }
  },

  async fetchFromOpenFDA(medicineName: string): Promise<MedicineInfo | null> {
    try {
      console.log('[v0] Fetching from OpenFDA:', medicineName);
      
      // Try searching by active ingredient first
      let response = await fetch(
        `https://api.fda.gov/drug/label.json?search=active_ingredient:"${encodeURIComponent(medicineName)}"&limit=1`
      );
      let data = await response.json();

      // If no results, try searching by brand name
      if (!data.results || data.results.length === 0) {
        console.log('[v0] Trying OpenFDA brand name search:', medicineName);
        response = await fetch(
          `https://api.fda.gov/drug/label.json?search=brand_name:"${encodeURIComponent(medicineName)}"&limit=1`
        );
        data = await response.json();
      }

      // If still no results, try generic search
      if (!data.results || data.results.length === 0) {
        console.log('[v0] Trying OpenFDA generic search:', medicineName);
        response = await fetch(
          `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(medicineName)}&limit=1`
        );
        data = await response.json();
      }

      if (data.results && data.results.length > 0) {
        const drug = data.results[0];
        const sideEffects = drug.adverse_reactions
          ? drug.adverse_reactions[0].split('\n').slice(0, 3).filter((s: string) => s.trim())
          : [];
        const warnings = drug.warnings
          ? drug.warnings[0].split('\n').slice(0, 2).filter((w: string) => w.trim())
          : [];

        console.log('[v0] OpenFDA found drug');
        return {
          name: drug.brand_name?.[0] || drug.active_ingredient?.[0] || medicineName,
          uses: drug.indications_and_usage?.[0] || 'Information not available',
          dosage: drug.dosage_and_administration?.[0] || 'Consult healthcare provider',
          sideEffects: sideEffects.length > 0 ? sideEffects : ['Information not available'],
          warnings: warnings.length > 0 ? warnings : ['Information not available'],
          source: 'OpenFDA (FDA)',
        };
      }
      return null;
    } catch (error) {
      console.error('[v0] OpenFDA API error:', error);
      return null;
    }
  },

  async searchMedicine(medicineName: string): Promise<MedicineInfo | null> {
    // Try RxNav first (faster)
    let result = await this.fetchFromRxNav(medicineName);
    if (result) return result;

    // Try OpenFDA as fallback
    result = await this.fetchFromOpenFDA(medicineName);
    return result;
  },
};

// Common medicines for quick search
const commonMedicines = ['Paracetamol', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Metformin'];

export default function MedicineChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: `Hi! I'm the MediCheck Assistant. I can help you find real-time information about medicines using trusted medical databases. Ask me about any medicine name, or try: ${commonMedicines.join(', ')}`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMedicineResponse = (medicineInfo: MedicineInfo): string => {
    let response = `**${medicineInfo.name}**\n\n`;

    if (medicineInfo.uses) {
      response += `**Uses:** ${medicineInfo.uses}\n\n`;
    } else {
      response += `**Uses:** Information not available\n\n`;
    }

    if (medicineInfo.dosage) {
      response += `**Dosage:** ${medicineInfo.dosage}\n\n`;
    } else {
      response += `**Dosage:** Please consult with a healthcare provider\n\n`;
    }

    if (medicineInfo.sideEffects && medicineInfo.sideEffects.length > 0) {
      response += `**Side Effects:**\n${medicineInfo.sideEffects.map((effect) => `• ${effect.substring(0, 100)}`).join('\n')}\n\n`;
    } else {
      response += `**Side Effects:** Information not available\n\n`;
    }

    if (medicineInfo.warnings && medicineInfo.warnings.length > 0) {
      response += `**Warnings:**\n${medicineInfo.warnings.map((warning) => `• ${warning.substring(0, 100)}`).join('\n')}\n\n`;
    }

    response += `**Source:** ${medicineInfo.source || 'Medical Database'}\n\n⚠️ This information is educational. Always consult a healthcare professional before taking medication.`;
    return response;
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const medicineName = input.trim();

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: medicineName,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('[v0] Searching for medicine:', medicineName);
      const medicineInfo = await medicineApiService.searchMedicine(medicineName);

      let botResponse: string;
      if (medicineInfo) {
        botResponse = formatMedicineResponse(medicineInfo);
      } else {
        botResponse = `Medicine "${medicineName}" not found in medical databases. Please try another name or spelling.\n\nTips:\n• Try the generic name (e.g., "acetaminophen" instead of brand names)\n• Check spelling\n• Try searching for: ${commonMedicines.join(', ')}\n\nSources searched: RxNav (NIH) and OpenFDA (FDA)`;
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('[v0] Error fetching medicine info:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, there was an error fetching medicine information. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input]);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleQuickSearch = async (medicine: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: medicine,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const medicineInfo = await medicineApiService.searchMedicine(medicine);

      let botResponse: string;
      if (medicineInfo) {
        botResponse = formatMedicineResponse(medicineInfo);
      } else {
        botResponse = `Medicine "${medicine}" not found. Please try another name or use the search bar.`;
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('[v0] Error in quick search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto h-screen md:h-auto flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Real-Time Medicine Information</h2>
        <p className="text-muted-foreground text-sm">
          Search any medicine using trusted medical databases (RxNav & OpenFDA)
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-card border border-border rounded-lg p-4 mb-4 overflow-y-auto max-h-96">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap space-y-1">
                  {message.content.split('\n').map((line, idx) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <div key={idx} className="font-bold mb-2">
                          {line.replace(/\*\*/g, '')}
                        </div>
                      );
                    }
                    if (line.startsWith('• ')) {
                      return (
                        <div key={idx} className="ml-2">
                          {line}
                        </div>
                      );
                    }
                    if (line.startsWith('⚠️') || line.startsWith('Tip:')) {
                      return (
                        <div key={idx} className="italic mt-2 pt-2 border-t border-current">
                          {line}
                        </div>
                      );
                    }
                    return line ? (
                      <div key={idx}>
                        {line}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground rounded-lg rounded-bl-none px-4 py-3 flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Searching medical databases...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Search Buttons */}
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">Quick Search:</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {commonMedicines.map((medicine) => (
            <Button
              key={medicine}
              variant="outline"
              size="sm"
              onClick={() => handleQuickSearch(medicine)}
              className="text-xs"
              disabled={isLoading}
            >
              {medicine}
            </Button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Search any medicine name..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          onClick={handleVoiceInput}
          size="icon"
          variant={isListening ? 'default' : 'outline'}
          title="Voice input"
          disabled={isLoading}
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
        </Button>
        <Button onClick={handleSendMessage} size="icon" disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Data sourced from RxNav (NIH) & OpenFDA. Educational purposes only. Always consult healthcare professionals.
      </p>
    </div>
  );
}
