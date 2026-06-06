jest.mock('ws', () => {
  return {
    WebSocket: class {
      constructor() {}
      on = jest.fn();
    },
  };
});
