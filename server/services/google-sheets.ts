import { GoogleAuth } from 'google-auth-library';
import { sheets_v4, google } from 'googleapis';

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  constructor() {
    // Initialize Google Sheets API
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
  }

  async addEmailToSheet(email: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const rowData = [timestamp, email]; // Column A = timestamp, Column B = email
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Form Responses 1!A:B', // Specific sheet with columns A and B
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      });
      
      console.log('Successfully added to Google Sheets');
    } catch (error) {
      console.error('Error adding email to Google Sheets:', error);
      throw new Error('Failed to save email to waitlist');
    }
  }

  async getWaitlistCountFromSheet(): Promise<number> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Pivot!G6', // Get count from specific cell
      });

      const value = response.data.values?.[0]?.[0];
      const count = parseInt(value?.toString() || '0', 10);
      return isNaN(count) ? 0 : count;
    } catch (error) {
      console.error('Error getting waitlist count from Google Sheets:', error);
      // Fallback to in-memory count if Google Sheets is unavailable
      return 0;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
