/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StatusColor {
  bg: string;
  text: string;
}

export const STATUS_COLORS: Record<string, StatusColor> = {
  'Perlu Dikerjakan': { bg: '#37392E', text: '#FFFFFF' },
  'Untuk Dikerjakan': { bg: '#37392E', text: '#FFFFFF' },
  'To Do':            { bg: '#37392E', text: '#FFFFFF' },
  'Sedang Berjalan':   { bg: '#276FBF', text: '#F4F5FA' },
  'Dalam Review':      { bg: '#FFB20F', text: '#111827' },
  'Selesai':           { bg: '#CCF779', text: '#111827' },
  'Batal/Tunda':       { bg: '#C33C54', text: '#FFFFFF' },
};

export const STATUS_COLORS_BY_ID: Record<string, StatusColor> = {
  todo: STATUS_COLORS['Perlu Dikerjakan'],
  in_progress: STATUS_COLORS['Sedang Berjalan'],
  review: STATUS_COLORS['Dalam Review'],
  done: STATUS_COLORS['Selesai'],
  canceled_on_hold: STATUS_COLORS['Batal/Tunda'],
};

export const getStatusColor = (statusOrId: string): StatusColor => {
  return (
    STATUS_COLORS_BY_ID[statusOrId] ||
    STATUS_COLORS[statusOrId] ||
    { bg: '#37392E', text: '#FFFFFF' }
  );
};
