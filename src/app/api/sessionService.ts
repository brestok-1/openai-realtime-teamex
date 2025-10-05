import { BackendResponse, EphemeralSessionData } from './types';

export class SessionService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async fetchEphemeralSession(coachId: string): Promise<EphemeralSessionData> {
    const url = `${this.baseUrl}/api/coach/${coachId}/initialize`;
    
    const response = await fetch(url);
    
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
}

export const sessionService = new SessionService();
