import React from 'react';
import { Icon, addCollection } from '@iconify/react';
import solarIcons from '@iconify-json/solar/icons.json';

addCollection(solarIcons);

export const ACCENT = '#10b981';
export const ACCENT_STRONG = '#059669';

export const I = {
  upload: 'upload',
  uploadCloud: 'cloud-upload',
  download: 'download',
  pdf: 'file-text',
  file: 'file',
  fileUp: 'upload',
  check: 'check-circle',
  checkSquare: 'check-square',
  close: 'close-circle',
  x: 'close-square',
  delete: 'trash-bin-trash',
  edit: 'pen-new-square',
  pen: 'pen',
  down: 'alt-arrow-down',
  up: 'alt-arrow-up',
  left: 'alt-arrow-left',
  right: 'alt-arrow-right',
  warn: 'danger-triangle',
  loading: 'refresh',
  hand: 'hand-pills',
  shield: 'shield-check',
  bank: 'buildings-2',
  info: 'info-circle',
  login: 'login',
  logout: 'logout-2',
  userPlus: 'user-plus-rounded',
  more: 'menu-dots',
  moreV: 'menu-dots-square',
  tag: 'tag',
  dollar: 'dollar',
  folder: 'folder',
  mail: 'letter',
  send: 'plain-2',
  chart: 'chart-square',
  chartBar: 'chart-2',
  filter: 'filter',
  message: 'chat-round-dots',
  hash: 'hashtag',
  down2: 'graph-down',
  pie: 'pie-chart',
  settings: 'settings',
  dashboard: 'widget-2',
  wallet: 'wallet',
  sun: 'sun',
  moon: 'moon',
  plus: 'add-circle',
  plusSquare: 'add-square',
  alert: 'danger-triangle',
  trash: 'trash-bin-trash',
  eye: 'eye',
  eyeOff: 'eye-closed',
  search: 'magnifer',
  clock: 'clock-circle',
  bolt: 'bolt',
  chatSquare: 'chat-square',
  pulse: 'pulse',
  graphUp: 'graph-up',
  database: 'database',
  stopwatch: 'stopwatch',
  refreshCircle: 'refresh-circle',
  fileText: 'file-text',
  lock: 'lock-keyhole-minimalistic',
  copy: 'copy',
  arrowLeft: 'arrow-left',
  arrowRight: 'arrow-right',
  chevronRight: 'alt-arrow-right',
  inbox: 'inbox',
  checkBox: 'check-square',
  play: 'play-circle',
  calendar: 'calendar',
  wand: 'magic-stick-3',
  building: 'buildings-2',
  shieldCheck: 'shield-check',
  layers: 'layers',
  trendDown: 'graph-down',
  trendUp: 'graph-up',
};

/** Thin duotone (Solar line-duotone) icon. Two real colors:
 *  primary = currentColor, secondary = --brand-accent (emerald-500 by default). */
export const Brand = ({ name, size = 20, accent, className = '', style, ...rest }) => (
  <Icon
    icon={`solar:${name}-line-duotone`}
    width={size}
    height={size}
    className={`brand-icon ${className}`}
    style={{ ...(accent ? { '--brand-accent': accent } : null), ...style }}
    {...rest}
  />
);

/** Single-color thin outline variant (Solar linear). Use on coloured buttons. */
export const BrandLine = ({ name, size = 20, className = '', style, ...rest }) => (
  <Icon
    icon={`solar:${name}-linear`}
    width={size}
    height={size}
    className={className}
    style={style}
    {...rest}
  />
);

export default Brand;
