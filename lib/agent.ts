import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createStructuredChatAgent } from 'langchain/agents';
import { githubTools } from './github-tools';
import { parseGitHubUrl } from './utils';
import { calculateHealthScore } from './health-score';

/**
 * Creates and configures the LangChain agent with Gemini
 */
export async function createGitHubAnalyzerAgent() {
  // Initialize the Gemini model
  const model = new ChatGoogleGenerativeAI({
    modelName: 'gemini-2.5-flash',
    temperature: 0.3,
    apiKey: process.env.GEMINI_API_KEY,
  });

  // Use the standard prompt from the LangChain hub to avoid parsing errors
  const { pull } = await import('langchain/hub');
  const prompt = await pull<ChatPromptTemplate>('hwchase17/structured-chat-agent');

  // Create the StructuredChat agent with the custom prompt
  const agent = await createStructuredChatAgent({
    llm: model,
    tools: githubTools,
    prompt,
  });

  // Create the executor with error handling
  const agentExecutor = new AgentExecutor({
    agent,
    tools: githubTools,
    verbose: true,
    maxIterations: 7, // 5 tools + 1 analysis + 1 safety
    returnIntermediateSteps: true,
    handleParsingErrors: true,
    earlyStoppingMethod: 'force', // Force stop if maxIterations is reached
  });

  return agentExecutor;
}

export interface AnalysisCallbacks {
  onStep?: (step: string) => void;
  onThought?: (thought: string) => void;
  onAction?: (action: string, input: any) => void;
  onObservation?: (observation: string) => void;
  onScore?: (breakdown: any) => void;
}

/**
 * Analyzes a GitHub repository from its URL
 */
export async function analyzeRepository(
  repoUrl: string,
  callbacks?: AnalysisCallbacks
): Promise<string> {
  try {
    // Extract owner and repo from the URL
    const repoInfo = parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      throw new Error('Invalid GitHub URL. Expected format: https://github.com/owner/repo');
    }

    const { owner, repo } = repoInfo;
    console.log(`\n🔍 Analyzing repository: ${owner}/${repo}\n`);
    callbacks?.onStep?.(`Analyzing repository ${owner}/${repo}`);

    // Create the agent
    callbacks?.onStep?.('Initializing AI agent...');
    const agent = await createGitHubAnalyzerAgent();

    // Create LangChain callbacks
    const langchainCallbacks = [
      {
        handleAgentAction(action: any) {
          console.log('🎬 Action:', action.tool, action.toolInput);
          callbacks?.onAction?.(action.tool, action.toolInput);
        },
        handleAgentEnd(action: any) {
          console.log('✅ Agent finished');
        },
        handleChainStart(chain: any) {
          console.log('⛓️ Starting chain');
        },
        handleChainEnd(outputs: any) {
          console.log('⛓️ Finished chain');
        },
        handleToolStart(tool: any, input: string) {
          console.log('🔧 Tool called:', tool.name);
          callbacks?.onStep?.(`Using tool: ${tool.name}`);
        },
        handleToolEnd(output: string) {
          console.log('📊 Tool result received');
          callbacks?.onObservation?.(output);
        },
        handleLLMStart(llm: any, prompts: string[]) {
          console.log('🤖 LLM starting...');
          callbacks?.onStep?.('The AI is thinking...');
        },
        handleLLMEnd(output: any) {
          console.log('🤖 LLM finished');
        },
        handleText(text: string) {
          // Detects the agent's "Thoughts"
          if (text.includes('Thought:')) {
            const thought = text.replace(/Thought:/gi, '').trim();
            callbacks?.onThought?.(thought);
          }
        },
      },
    ];

    // Execute the analysis with the agent and callbacks
    const result = await agent.invoke(
      {
        input: `Analyze the GitHub repository ${owner}/${repo}. 

**IMPORTANT**: First, use the get_repository_metrics tool to get all metrics, then use other tools if necessary.
        
Use the 4 available tools and then provide a complete analysis in Markdown format with:
- Title: # 📊 Repository Analysis
- Sections: 🎯 Goal, ⭐ Popularity, 🔧 Maintenance, 💡 Features, 👥 Target Audience, 🏆 Contributors, 📝 Summary

Be concise and use emojis.`,
      },
      { callbacks: langchainCallbacks }
    );

    // Calculate the health score from the metrics
    callbacks?.onStep?.('Calculating health score...');
    
    // Extract metrics from the agent's result
    try {
      // Try to retrieve metrics from intermediate steps
      const metricsStep = result.intermediateSteps?.find(
        (step: any) => step.action?.tool === 'get_repository_metrics'
      );
      
      if (metricsStep) {
        const metrics = JSON.parse(metricsStep.observation);
        const scoreBreakdown = calculateHealthScore(metrics);
        
        callbacks?.onStep?.(`Score calculated: ${scoreBreakdown.total}/100 ${scoreBreakdown.emoji}`);
        callbacks?.onScore?.(scoreBreakdown);
      }
    } catch (error) {
      console.error('Error calculating score:', error);
    }

    // Insert the score into the final analysis
    let finalAnalysis = result.output || 'No analysis available';

    console.log('\n✅ Analysis finished\n');
    callbacks?.onStep?.('Analysis finished!');
    
    return finalAnalysis || 'No analysis available';
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw new Error(
      `Error analyzing the repository: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

