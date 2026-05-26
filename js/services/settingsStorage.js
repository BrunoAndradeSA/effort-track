const SETTINGS_KEY = 'effort_track_settings';

const DEFAULTS = {
  defaultProjectDuration: 30,
  defaultQtyDevs: 7,
  defaultQtyQas: 2,
  defaultHoursPerDay: '07:45'
};

export function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULTS, ...parsed };
    }
  } catch (_) {}
  return { ...DEFAULTS };
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
