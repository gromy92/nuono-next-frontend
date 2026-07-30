import { strict as assert } from 'node:assert';
import {
  calculateSolarTermMoment,
  formatChineseLunarDate,
  getCurrentSolarTerm
} from './solarTerms';

const shanghaiFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

assert.equal(
  shanghaiFormatter.format(calculateSolarTermMoment(2026, 13)),
  '07/23 03:13'
);
assert.equal(
  getCurrentSolarTerm(new Date('2026-07-29T04:00:00.000Z')).name,
  '大暑'
);
assert.equal(
  getCurrentSolarTerm(new Date('2026-08-07T12:00:00.000Z')).name,
  '立秋'
);
assert.equal(
  formatChineseLunarDate(new Date('2026-07-29T04:00:00.000Z')),
  '丙午年六月十六'
);
