import { NextRequest } from 'next/server';
import { analyzeRepository } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return new Response(
        JSON.stringify({ error: 'Repository URL is missing' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if environment variables are configured
    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a stream to send real-time steps
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Function to send messages to the client
          const sendMessage = (type: string, data: any) => {
            const message = JSON.stringify({ type, data }) + '\n';
            controller.enqueue(encoder.encode(message));
          };

          // Send a start message
          sendMessage('start', { message: '🔍 Starting analysis...' });

          // Analyze the repository with callbacks for streaming
          const analysis = await analyzeRepository(repoUrl, {
            onStep: (step: string) => {
              sendMessage('step', { step });
            },
            onThought: (thought: string) => {
              sendMessage('thought', { thought });
            },
            onAction: (action: string, input: any) => {
              sendMessage('action', { action, input });
            },
            onObservation: (observation: string) => {
              sendMessage('observation', { observation });
            },
            onScore: (breakdown: any) => {
              sendMessage('score', breakdown);
            },
          });

          // Send the final result
          sendMessage('complete', { analysis });
          
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Error analyzing the repository';
          
          const message = JSON.stringify({ 
            type: 'error', 
            data: { error: errorMessage } 
          }) + '\n';
          
          controller.enqueue(encoder.encode(message));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error during analysis',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}