const chrome = {
  storage: {
    local: {
      get: (keys, cb) => cb({}),
      set: (data, cb) => cb && cb()
    }
  },
  runtime: {
    sendMessage: () => {},
    lastError: null
  }
};
const window = {
  location: { pathname: '/app/123' },
  getComputedStyle: () => ({})
};
const makeMockElement = () => ({
  style: {},
  appendChild: () => {},
  querySelector: () => makeMockElement(),
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => {},
  classList: {
    toggle: () => false,
    add: () => {},
    remove: () => {},
    contains: () => false
  },
  remove: () => {},
  closest: () => null,
  setAttribute: () => {},
  contains: () => true
});
const document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelector: () => makeMockElement(),
  querySelectorAll: () => [],
  getElementById: () => makeMockElement(),
  createElement: makeMockElement,
  body: { appendChild: () => {} }
};
const navigator = { clipboard: { writeText: () => {} } };
const DragEvent = class {};
const Event = class {};
const MutationObserver = class {
  observe() {}
};

// Inject mocks into global
global.chrome = chrome;
global.window = window;
global.document = document;
global.navigator = navigator;
global.DragEvent = DragEvent;
global.Event = Event;
global.MutationObserver = MutationObserver;

try {
  require('./content.js');
  console.log("SUCCESS_EVAL");
} catch (e) {
  console.error("CRASH_ERR:", e);
}
