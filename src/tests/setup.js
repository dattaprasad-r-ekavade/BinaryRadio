import '@testing-library/jest-dom/vitest';

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => ({
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  }),
});
