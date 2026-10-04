export type ExecutionMode = 'hybrid' | 'cloud-only' | 'local-only' | 'private-offline';

export type AIProvider = 'gemini' | 'local-ollama' | 'local-builtin';

export interface ChatRole {
  id: string;
  name: string;
  category: 'general' | 'complex' | 'fast' | 'creative' | 'custom';
  recommendedModel: 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite' | 'gemini-3.7-flash';
  tagline?: string;
  description: string;
  systemInstruction: string;
  iconName: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  executionMode: ExecutionMode;
  defaultModel?: string;
  preferredModel?: string;
  activeRoleId?: string;
  temperature?: number;
  systemPrompt?: string;
  customSystemPrompt?: string;
  responseStyle?: 'concise' | 'balanced' | 'detailed' | 'academic';
  memoryEnabled?: boolean;
  ollamaUrl?: string;
  localOllamaUrl?: string;
  localModelName?: string;
  localOllamaModel?: string;
  autoFallback?: boolean;
  autoSwitchToLocal?: boolean;
  streamResponses?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'dataset' | 'audio';
  mimeType: string;
  size: number;
  url?: string;
  dataBase64?: string;
  extractedText?: string;
  datasetPreview?: {
    rowCount: number;
    columnCount: number;
    columns: string[];
    sampleRows: Record<string, any>[];
  };
}

export interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber?: number;
  snippet: string;
  score: number;
}

export interface ToolCallExecution {
  id: string;
  name: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  status: 'running' | 'completed' | 'failed';
  error?: string;
  timestamp: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
  roleId?: string;
  roleName?: string;
  attachments?: Attachment[];
  citations?: Citation[];
  toolCalls?: ToolCallExecution[];
  reasoningStatus?: string;
  dashboardData?: DashboardData;
  reportData?: ReportData;
  generatedImageUrl?: string;
  isStreaming?: boolean;
  error?: string;
  userFeedback?: 'like' | 'dislike';
}

export interface Conversation {
  id: string;
  title: string;
  projectId?: string;
  summary?: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
  modelUsed?: string;
  roleId?: string;
  roleName?: string;
  systemInstruction?: string;
  tags?: string[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  text?: string;
  pageNumber?: number;
  tokenCount?: number;
}

export interface DocumentFile {
  id: string;
  name: string;
  type?: 'text' | 'pdf' | 'csv' | 'json' | 'image' | string;
  projectId?: string;
  mimeType: string;
  size: number;
  content?: string;
  extractedText?: string;
  chunks: DocumentChunk[];
  createdAt: number;
  updatedAt: number;
  uploadedAt?: number;
  status?: 'uploading' | 'processing' | 'indexed' | 'failed';
  pageCount?: number;
  chunksCount?: number;
  summary?: string;
  error?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  systemInstruction?: string;
  customInstructions?: string;
  createdAt: number;
  updatedAt: number;
  documentIds?: string[];
  fileIds?: string[];
  conversationIds?: string[];
}

export interface KPICard {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  description?: string;
  iconName?: string;
}

export interface ChartSeries {
  key: string;
  name: string;
  color?: string;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'radar';
  dataKeyX: string;
  series: ChartSeries[];
  data: Record<string, any>[];
  description?: string;
}

export interface DashboardData {
  id: string;
  title: string;
  summary: string;
  dateRange?: string;
  kpis: KPICard[];
  charts: ChartConfig[];
  insights: string[];
  recommendations: string[];
  sourceDatasetName?: string;
}

export interface ReportSection {
  id: string;
  heading: string;
  content: string;
  bulletPoints?: string[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

export interface ReportData {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  date: string;
  executiveSummary: string;
  keyFindings: string[];
  sections: ReportSection[];
  conclusions: string;
  recommendations: string[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  imageSize?: '512px' | '1K' | '2K' | '4K';
  timestamp: number;
  provider: string;
  model?: string;
  isEdit?: boolean;
  parentImageId?: string;
  originalImageUrl?: string;
  editInstruction?: string;
}

export interface SystemStatus {
  cpuUsagePct: number;
  ramUsedGB: number;
  ramTotalGB: number;
  storageUsedMB: number;
  isOnline: boolean;
  cloudAiHealthy: boolean;
  localAiHealthy: boolean;
  activeProvider: string;
  latencyMs: number;
  logs?: any[];
}

export type SystemMetrics = SystemStatus;

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'tool';
  category: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface SyncOperation {
  id: string;
  type: 'create_conv' | 'update_conv' | 'delete_conv' | 'create_msg' | 'save_file' | 'delete_file';
  entityId: string;
  payload: any;
  timestamp: number;
  synced: boolean;
}
