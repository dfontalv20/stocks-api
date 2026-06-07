jest.mock('ws', () => {
  class MockWebSocketServer {
    clients = new Set();
    on = jest.fn();
    close = jest.fn();
  }
  const MockWebSocket = class {
    on = jest.fn();
    OPEN = 1;
  };
  return {
    WebSocket: MockWebSocket,
    WebSocketServer: MockWebSocketServer,
    Server: MockWebSocketServer,
  };
});

jest.mock('@/firebase/firebase.service', () => {
  return {
    FirebaseService: jest.fn().mockImplementation(() => ({
      sendNotification: jest.fn(),
    })),
  };
});
