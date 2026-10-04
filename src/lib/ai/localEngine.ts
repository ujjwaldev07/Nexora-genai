import { Message, Attachment, Citation, DashboardData, ReportData, ToolCallExecution } from '../../types';
import { ragEngine } from './ragEngine';
import { dataAnalyzer } from './dataAnalyzer';

export interface LocalGenerateOptions {
  prompt?: string;
  history?: Message[];
  attachments?: Attachment[];
  systemInstruction?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  onStatusUpdate?: (status: string) => void;
}

export interface LocalGenerateResult {
  text: string;
  content?: string;
  citations?: Citation[];
  toolCalls?: ToolCallExecution[];
  dashboardData?: DashboardData;
  reportData?: ReportData;
  generatedImageUrl?: string;
  provider: 'local-ollama' | 'local-builtin';
  model: string;
}

export class LocalEngine {
  // Check if local Ollama server is reachable
  async checkOllamaHealth(url: string = 'http://localhost:11434'): Promise<{ healthy: boolean; models: string[] }> {
    try {
      const res = await fetch(`${url}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name || m.model);
        return { healthy: true, models };
      }
    } catch {
      // expected if not running
    }
    return { healthy: false, models: [] };
  }

  // Convenience wrapper for generateResponse
  async generateResponse(
    prompt: string,
    options: Omit<LocalGenerateOptions, 'prompt'> = {}
  ): Promise<{
    content: string;
    citations?: Citation[];
    toolCalls?: ToolCallExecution[];
    dashboardData?: DashboardData;
    reportData?: ReportData;
    generatedImageUrl?: string;
    provider?: string;
    model?: string;
  }> {
    const result = await this.generate({
      prompt,
      ...options,
    });

    return {
      content: result.text,
      citations: result.citations,
      toolCalls: result.toolCalls,
      dashboardData: result.dashboardData,
      reportData: result.reportData,
      generatedImageUrl: result.generatedImageUrl,
      provider: result.provider,
      model: result.model,
    };
  }

  // Main local generation entrypoint
  async generate(options: LocalGenerateOptions): Promise<LocalGenerateResult> {
    const { prompt = '', attachments = [], ollamaUrl = 'http://localhost:11434', ollamaModel = 'llama3.2', onStatusUpdate } = options;
    const toolCalls: ToolCallExecution[] = [];

    // Step 1: Detect Math/Calculator Intent
    const mathMatch = this.detectMathExpression(prompt);
    if (mathMatch) {
      onStatusUpdate?.('Evaluating expression with local math engine...');
      const toolCall: ToolCallExecution = {
        id: 'tool_' + Date.now(),
        name: 'calculator',
        input: { expression: mathMatch.expr },
        output: { result: mathMatch.result },
        status: 'completed',
        timestamp: Date.now(),
      };
      toolCalls.push(toolCall);

      return {
        text: `### Calculation Result\n\n**Expression:** \`${mathMatch.expr}\`\n\n**Result:** **\`${mathMatch.result}\`**\n\n*Computed locally via deterministic arithmetic engine.*`,
        toolCalls,
        provider: 'local-builtin',
        model: 'local-math-v1',
      };
    }

    // Step 2: Detect Dataset Analysis / Dashboard / Report Intent
    const csvAttachment = attachments.find((a) => a.type === 'dataset' || a.name.endsWith('.csv') || a.name.endsWith('.json'));
    const isDashboardPrompt = /dashboard|kpi|charts|visualize dataset/i.test(prompt);
    const isReportPrompt = /report|executive summary|whitepaper/i.test(prompt);

    if (csvAttachment && csvAttachment.extractedText) {
      onStatusUpdate?.('Parsing tabular dataset locally...');
      const records = dataAnalyzer.parseCSV(csvAttachment.extractedText);
      const analysis = dataAnalyzer.analyze(records, csvAttachment.name);

      const toolCall: ToolCallExecution = {
        id: 'tool_' + Date.now(),
        name: 'data_analyzer',
        input: { rows: analysis.rowCount, columns: analysis.columnCount },
        output: { numericCols: analysis.numericColumns, anomaliesCount: analysis.anomalies.length },
        status: 'completed',
        timestamp: Date.now(),
      };
      toolCalls.push(toolCall);

      if (isDashboardPrompt) {
        onStatusUpdate?.('Generating interactive local dashboard...');
        const dash = dataAnalyzer.generateDashboard(analysis, `Local Dataset Dashboard - ${csvAttachment.name}`);
        return {
          text: `### Interactive Dashboard Generated\n\nSuccessfully parsed **${analysis.rowCount.toLocaleString()}** rows from \`${csvAttachment.name}\`. The interactive dashboard below renders live KPI metrics and trend visualizers entirely offline.`,
          dashboardData: dash,
          toolCalls,
          provider: 'local-builtin',
          model: 'local-analytics-v1',
        };
      }

      if (isReportPrompt) {
        onStatusUpdate?.('Generating local business intelligence report...');
        const rep = dataAnalyzer.generateReport(analysis, `Executive Report: ${csvAttachment.name}`);
        return {
          text: `### Executive Report Generated\n\nSynthesized quantitative intelligence report for \`${csvAttachment.name}\`. Review the structured sections, statistical metrics, and strategic recommendations below.`,
          reportData: rep,
          toolCalls,
          provider: 'local-builtin',
          model: 'local-report-v1',
        };
      }

      // Default CSV response
      return {
        text: `### Dataset Statistical Summary: \`${csvAttachment.name}\`\n\n` +
          `- **Total Records:** ${analysis.rowCount.toLocaleString()}\n` +
          `- **Attributes:** ${analysis.columnCount} (${analysis.numericColumns.join(', ') || 'None numeric'})\n` +
          `- **Key Insights:**\n` +
          analysis.summaryInsights.map((s) => `  * ${s}`).join('\n') +
          `\n\n*Tip: Ask "Create a dashboard" or "Generate an executive report" from this dataset.*`,
        toolCalls,
        provider: 'local-builtin',
        model: 'local-analytics-v1',
      };
    }

    // Step 3: Local Document RAG Query
    onStatusUpdate?.('Searching local indexed document vector chunks...');
    const { relevantChunks, citations } = ragEngine.query(prompt, 3, 0.15);

    if (relevantChunks.length > 0) {
      onStatusUpdate?.('Synthesizing grounded answer from local chunks...');
      const toolCall: ToolCallExecution = {
        id: 'tool_' + Date.now(),
        name: 'document_rag',
        input: { query: prompt, retrievedChunks: relevantChunks.length },
        output: { topDoc: relevantChunks[0].documentName },
        status: 'completed',
        timestamp: Date.now(),
      };
      toolCalls.push(toolCall);

      const contextSnippet = relevantChunks.map((c, i) => `[Source ${i + 1}: ${c.documentName} (p.${c.pageNumber})]:\n${c.content || c.text}`).join('\n\n');

      return {
        text: `### Grounded Document Intelligence (Offline RAG)\n\nBased on the local documents indexed in your session:\n\n${this.synthesizeLocalAnswer(prompt, contextSnippet)}\n\n*(Sourced from ${relevantChunks.length} relevant excerpt${relevantChunks.length > 1 ? 's' : ''})*`,
        citations,
        toolCalls,
        provider: 'local-builtin',
        model: 'local-rag-v1',
      };
    }

    // Step 4: Try Local Ollama if online/available
    try {
      const ollamaCheck = await this.checkOllamaHealth(ollamaUrl);
      if (ollamaCheck.healthy) {
        onStatusUpdate?.(`Querying local Ollama model (${ollamaModel})...`);
        const modelToUse = ollamaCheck.models.includes(ollamaModel) ? ollamaModel : (ollamaCheck.models[0] || 'llama3.2');
        const res = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelToUse,
            prompt,
            stream: false,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            text: data.response || 'No response received from local model.',
            provider: 'local-ollama',
            model: modelToUse,
          };
        }
      }
    } catch {
      // fallback to built-in local knowledge engine
    }

    // Step 5: Built-in Local Knowledge Engine Response
    onStatusUpdate?.('Generating local offline synthesis...');
    const builtInAnswer = this.generateLocalKnowledgeResponse(prompt);

    return {
      text: builtInAnswer,
      provider: 'local-builtin',
      model: 'aether-local-v1',
    };
  }

  private detectMathExpression(prompt: string): { expr: string; result: number } | null {
    const percentMatch = prompt.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of|\*)\s*(\d+(?:\.\d+)?)/i);
    if (percentMatch) {
      const p = parseFloat(percentMatch[1]);
      const total = parseFloat(percentMatch[2]);
      return { expr: `${p}% of ${total}`, result: Number(((p / 100) * total).toFixed(4)) };
    }

    const calcMatch = prompt.match(/(?:calculate|compute|what is|solve)\s+([\d\s\+\-\*\/\(\)\.\^%]+)/i);
    if (calcMatch) {
      const expr = calcMatch[1].trim();
      try {
        if (/^[0-9+\-*/().\s^%]+$/.test(expr)) {
          const sanitized = expr.replace(/\^/g, '**');
          const val = Function(`'use strict'; return (${sanitized})`)();
          if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
            return { expr, result: Number(val.toFixed(4)) };
          }
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  private synthesizeLocalAnswer(prompt: string, context: string): string {
    const sentences = context.split(/(?<=[.?!])\s+/);
    const keywords = prompt.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const matched = sentences.filter((s) => keywords.some((k) => s.toLowerCase().includes(k)));

    if (matched.length > 0) {
      return matched.slice(0, 4).join(' ');
    }
    return context.substring(0, 450) + '...';
  }

  private generateLocalKnowledgeResponse(prompt: string): string {
    const p = prompt.toLowerCase();

    if (p.includes('what is an api') || p.includes('explain api')) {
      return `### What is an API?\n\nAn **API (Application Programming Interface)** is a structured set of rules and protocols that enables different software applications to communicate and exchange data with one another.\n\n#### Simple Analogy:\nThink of a restaurant waiter: you (the client) give your food order (request) to the waiter (the API), who delivers it to the kitchen (the server) and returns with your meal (response).\n\n#### Common Example in Code:\n\`\`\`typescript\n// Client requests weather data via HTTP REST API\nconst response = await fetch('https://api.weather.com/v1/forecast?city=Tokyo');\nconst data = await response.json();\nconsole.log(data.temperature);\n\`\`\``;
    }

    if (p.includes('recursion') || p.includes('recursive')) {
      return `### Recursion in Computer Science\n\n**Recursion** is a programming technique where a function solves a problem by calling itself with smaller sub-problems until it reaches a defined **base condition**.\n\n#### Classic Example: Factorial\n\`\`\`typescript\nfunction factorial(n: number): number {\n  // 1. Base case to terminate recursion\n  if (n <= 1) return 1;\n  // 2. Recursive step\n  return n * factorial(n - 1);\n}\n\nconsole.log(factorial(5)); // Output: 120 (5 * 4 * 3 * 2 * 1)\n\`\`\`\n\n*Key takeaway: Always ensure a reachable base condition to avoid a stack overflow exception.*`;
    }

    if (p.includes('hello') || p.includes('hi') || p.includes('hey')) {
      return `Hello! I am **Aether AI**, running in your local workspace. I can help you with:\n\n- **Document Intelligence & RAG**: Upload PDFs, DOCXs, or TXT to extract and query information.\n- **Tabular Data Analysis**: Drop CSV or JSON files to generate statistical breakdowns.\n- **Dashboard & Report Generation**: Automatically create KPI visualizers and structured executive reports.\n- **Mathematical Computation & Tools**: Deterministic local calculation and unit evaluation.\n\nHow would you like to proceed?`;
    }

    return `### Local Intelligence Response\n\nI have processed your query offline in **Aether Local Mode**:\n\n> *"${prompt}"*\n\n**Key Points:**\n- Your workspace operates locally with zero internet dependency.\n- Documents, dataset analytics, and custom tools remain 100% accessible.\n- If you have an Ollama server running locally on \`http://localhost:11434\`, Aether can connect to your local weights automatically.\n\nFeel free to upload files, evaluate calculations, or request tailored analysis!`;
  }
}

export const localEngine = new LocalEngine();
