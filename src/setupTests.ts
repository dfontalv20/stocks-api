jest.mock('ws', () => {
  return {
    WebSocket: class {
      constructor() {}
      on = jest.fn();
    },
  };
});

jest.mock('@/firebase/firebase.service', () => {
  return {
    FirebaseService: jest.fn().mockImplementation(() => ({
      sendNotification: jest.fn(),
    })),
  };
});
