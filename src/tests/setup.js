import '@testing-library/jest-dom/vitest';

/**
 * jsdom ships no canvas implementation, so the visualizer needs a stub.
 * Keep this in sync with the 2D context methods Visualizer.jsx calls — a
 * missing method surfaces as an unhandled rejection inside requestAnimationFrame
 * rather than a readable test failure.
 */
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => ({
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    setTransform: () => {},
    resetTransform: () => {},
    save: () => {},
    restore: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineJoin: 'miter',
  }),
});
