import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { credential } from 'firebase-admin';

export type NotificationMessage = {
  title: string;
  body: string;
  to: string;
};

@Injectable()
export class FirebaseService {
  firebaseApp: App;

  constructor(private readonly configService: ConfigService) {
    this.initApp();
  }

  private initApp() {
    this.firebaseApp = initializeApp({
      credential: credential.cert({
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY'),
      }),
    });
  }

  async sendNotification(messages: NotificationMessage[]) {
    return getMessaging(this.firebaseApp).sendEach(
      messages.map((msg) => ({
        notification: {
          title: msg.title,
          body: msg.body,
        },
        token: msg.to,
      })),
    );
  }
}
