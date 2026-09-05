// Google Calendar API Client & GIS Integration
// Client ID from authorized Firebase configuration

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: unknown; expires_in?: number }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

const CLIENT_ID = '934430563447-pralkbmb8qod5s3rin2kekurfgpl22q4.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export interface GoogleCalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

class GoogleCalendarService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private tokenClient: { requestAccessToken: (options?: { prompt?: string }) => void } | null = null;
  private listeners: ((connected: boolean) => void)[] = [];

  constructor() {
    // Restore token if still valid
    const savedToken = localStorage.getItem('gcal_access_token');
    const savedExpiry = localStorage.getItem('gcal_token_expiry');
    if (savedToken && savedExpiry && Number(savedExpiry) > Date.now()) {
      this.accessToken = savedToken;
      this.tokenExpiry = Number(savedExpiry);
    }
  }

  subscribe(listener: (connected: boolean) => void) {
    this.listeners.push(listener);
    listener(this.isConnected());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const status = this.isConnected();
    this.listeners.forEach((l) => l(status));
  }

  isConnected(): boolean {
    return !!this.accessToken && this.tokenExpiry > Date.now();
  }

  private initGIS(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.tokenClient) {
        return resolve();
      }

      const checkGIS = () => {
        if (window.google?.accounts?.oauth2) {
          try {
            this.tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: CLIENT_ID,
              scope: SCOPES,
              callback: () => {},
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        } else {
          setTimeout(checkGIS, 150);
        }
      };

      checkGIS();
    });
  }

  async signIn(): Promise<string> {
    await this.initGIS();

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services script not ready'));
      }

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) {
            return reject(resp.error);
          }
          if (resp.access_token) {
            this.accessToken = resp.access_token;
            const expiresIn = (resp.expires_in || 3600) * 1000;
            this.tokenExpiry = Date.now() + expiresIn;
            localStorage.setItem('gcal_access_token', this.accessToken);
            localStorage.setItem('gcal_token_expiry', String(this.tokenExpiry));
            this.notify();
            resolve(this.accessToken);
          } else {
            reject(new Error('No access token received'));
          }
        },
      });

      this.tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  signOut() {
    this.accessToken = null;
    this.tokenExpiry = 0;
    localStorage.removeItem('gcal_access_token');
    localStorage.removeItem('gcal_token_expiry');
    this.notify();
  }

  async fetchEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEventItem[]> {
    if (!this.isConnected()) {
      return [];
    }

    const start = timeMin || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const end = timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', start);
    url.searchParams.set('timeMax', end);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json',
        },
      });

      if (response.status === 401) {
        this.signOut();
        throw new Error('Google Calendar authorization expired. Please sign in again.');
      }

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Google Calendar API error: ${err}`);
      }

      const data = await response.json();
      return (data.items || []) as GoogleCalendarEventItem[];
    } catch (err) {
      console.error('Failed to fetch events from Google Calendar:', err);
      throw err;
    }
  }

  async createEvent(event: {
    title: string;
    description?: string;
    location?: string;
    startDateTime: string;
    endDateTime: string;
    allDay?: boolean;
  }): Promise<GoogleCalendarEventItem> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Google Calendar');
    }

    const payload: {
      summary: string;
      description?: string;
      location?: string;
      start: { dateTime?: string; date?: string };
      end: { dateTime?: string; date?: string };
    } = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.allDay
        ? { date: event.startDateTime.split('T')[0] }
        : { dateTime: new Date(event.startDateTime).toISOString() },
      end: event.allDay
        ? { date: event.endDateTime.split('T')[0] }
        : { dateTime: new Date(event.endDateTime).toISOString() },
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to create Google Calendar event: ${err}`);
    }

    return await response.json();
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.isConnected()) return;

    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }
}

export const googleCalendar = new GoogleCalendarService();
