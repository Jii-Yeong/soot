export const DISPLAY_RESOLUTION_OPTIONS = [
  { value: 'auto', label: '자동' },
  { value: '960x540', label: '960 × 540' },
  { value: '1280x720', label: '1280 × 720' },
  { value: '1600x900', label: '1600 × 900' },
] as const;

export type DisplayResolution =
  (typeof DISPLAY_RESOLUTION_OPTIONS)[number]['value'];

export type GraphicsSettings = {
  displayResolution: DisplayResolution;
};

export const DEFAULT_GRAPHICS_SETTINGS: GraphicsSettings = {
  displayResolution: 'auto',
};
