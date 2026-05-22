export type SmsScene = 'login' | 'register' | 'reset_password';

export interface SmsProvider {
  sendCode(phone: string, code: string, scene: SmsScene): Promise<void>;
}

export class MockSmsProvider implements SmsProvider {
  async sendCode(phone: string, code: string, scene: SmsScene): Promise<void> {
    console.log(`[SMS_MOCK] scene=${scene} phone=${phone} code=${code}`);
  }
}
