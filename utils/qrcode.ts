import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

export class QRCodeService {
  static async generateClassQRCode(classId: string): Promise<string> {
    try {
      const qrCodeData = {
        type: 'class_checkin',
        classId,
        timestamp: new Date().toISOString(),
        code: uuidv4(),
      };

      const qrCodeString = JSON.stringify(qrCodeData);
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      });

      logger.info({ classId }, 'QR Code generated successfully');
      return qrCodeDataUrl;
    } catch (error) {
      logger.error({ error, classId }, 'Failed to generate QR Code');
      throw new Error('Falha ao gerar QR Code');
    }
  }

  static parseQRCode(qrCodeString: string): { classId: string; timestamp: string; code: string } | null {
    try {
      const qrCodeData = JSON.parse(qrCodeString);
      
      if (qrCodeData.type !== 'class_checkin' || !qrCodeData.classId) {
        return null;
      }

      return {
        classId: qrCodeData.classId,
        timestamp: qrCodeData.timestamp,
        code: qrCodeData.code,
      };
    } catch (error) {
      logger.warn({ error, qrCodeString }, 'Failed to parse QR Code');
      return null;
    }
  }

  static isQRCodeValid(timestamp: string, maxAgeMinutes: number = 30): boolean {
    const qrCodeTime = new Date(timestamp);
    const now = new Date();
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

    return (now.getTime() - qrCodeTime.getTime()) <= maxAge;
  }
}