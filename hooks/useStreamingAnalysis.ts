import { useState, useCallback } from 'react';

export interface StreamMessage {
  type: 'start' | 'step' | 'thought' | 'action' | 'observation' | 'complete' | 'error' | 'score';
  data: any;
}

export function useStreamingAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<any>(null);

  const analyzeRepository = useCallback(async (repoUrl: string) => {
    setIsLoading(true);
    setMessages([]);
    setAnalysis(null);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error during analysis');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to read the response');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const message: StreamMessage = JSON.parse(line);
            
            setMessages(prev => [...prev, message]);

            if (message.type === 'complete') {
              setAnalysis(message.data.analysis);
              setIsLoading(false);
            } else if (message.type === 'score') { // ✅ New message type
                setScoreBreakdown(message.data);
            } else if (message.type === 'error') {
              setError(message.data.error);
              setIsLoading(false);
            }
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    messages,
    analysis,
    error,
    scoreBreakdown,
    analyzeRepository,
    reset,
  };
}