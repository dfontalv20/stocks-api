import { Injectable } from '@nestjs/common';
import { App, applicationDefault, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export type NotificationMessage = {
  title: string;
  body: string;
  to: string;
};

@Injectable()
export class FirebaseService {
  firebaseApp: App;

  constructor() {
    this.initApp();
  }

  private initApp() {
    this.firebaseApp = initializeApp({
      credential: applicationDefault(),
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
