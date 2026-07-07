export class NotificationService {
  public static async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      await this.sendRealEmail(to, subject, body);
    } else {
      await this.sendMockEmail(to, subject, body);
    }
  }

  private static async sendRealEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      /*
        Implement sending email through SMTP here (TODO)
      */
    } catch (error) {
      throw error;
    }
  }

  private static async sendMockEmail(to: string, subject: string, body: string): Promise<void> {
    /* eslint-disable no-console */
    console.log('-> MOCK EMAIL SENT');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body} <-`);
  }
}
