export interface BackendToolParameter {
  type: string;
  description?: string;
  required?: boolean;
  enum?: string[];
}

export interface BackendToolParameters {
  type: string;
  properties: Record<string, BackendToolParameter>;
}

export interface BackendTool {
  name: string;
  description: string;
  parameters: BackendToolParameters;
}

export interface AudioTranscriptionConfig {
  language: string;
  model: string;
}

export interface AudioTurnDetectionConfig {
  type: string;
  createResponse: boolean;
  eagerness: string;
  interruptResponse: boolean;
}

export interface AudioInputConfig {
  transcription: AudioTranscriptionConfig;
  turnDetection: AudioTurnDetectionConfig;
}

export interface AudioOutputConfig {
  voice: string;
}

export interface AudioConfig {
  input: AudioInputConfig;
  output: AudioOutputConfig;
}

export interface EphemeralSessionData {
  ephemeralToken: string;
  tools: BackendTool[];
  audioConfig: AudioConfig;
}

export interface BackendResponse {
  data: EphemeralSessionData;
  successful: boolean;
  error: string | null;
}

export interface TranscriptionMessage {
  role: number;
  content: string;
}

export interface InterviewReport {
  summary: string;
  excitement: number;
  rapport: number;
  notes: string[];
  rbrGroup: string;
  englishProficiency: number;
  communication: number;
  confidence: number;
  insights: string[];
}

export interface ReportResponse {
  data: InterviewReport;
  successful: boolean;
  error: {
    message: string;
  } | null;
}
