import { BackendResponse, EphemeralSessionData, ReportResponse, TranscriptionMessage } from './types';

export class SessionService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://diza.teamex.dev') {
    this.baseUrl = baseUrl;
  }

  async fetchEphemeralSession(body: { mood: number; talentId: string; jobId: string }): Promise<EphemeralSessionData> {
    const url = `${this.baseUrl}/api/interview/initialize`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ephemeral session: ${response.statusText}`);
    }

    const data: BackendResponse = await response.json();

    if (!data.successful) {
      throw new Error(data.error || 'Failed to fetch ephemeral session');
    }

    if (!data.data?.ephemeralToken) {
      throw new Error('No ephemeral token provided by the server');
    }

    return data.data;
  }

  async generateReport(body: {
    talentId: string;
    jobId: string;
    transcription: TranscriptionMessage[];
  }): Promise<ReportResponse> {
    const url = `${this.baseUrl}/api/interview/report`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate report: ${response.statusText}`);
    }

    const data: ReportResponse = await response.json();

    return data;
  }
}

export const sessionService = new SessionService();
