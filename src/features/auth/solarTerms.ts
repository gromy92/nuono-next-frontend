const DAY_MS = 86_400_000;

export type SolarTermSeason = 'spring' | 'summer' | 'autumn' | 'winter';

type SolarTermDefinition = {
  name: string;
  phrase: string;
};

const SOLAR_TERMS: SolarTermDefinition[] = [
  { name: '小寒', phrase: '寒意渐深，静待春来' },
  { name: '大寒', phrase: '岁寒将尽，新意暗生' },
  { name: '立春', phrase: '东风解冻，万物启新' },
  { name: '雨水', phrase: '春雨润物，草木萌动' },
  { name: '惊蛰', phrase: '春雷初响，生机苏醒' },
  { name: '春分', phrase: '昼夜均分，春色正中' },
  { name: '清明', phrase: '气清景明，万物皆显' },
  { name: '谷雨', phrase: '雨生百谷，春意渐深' },
  { name: '立夏', phrase: '万物并秀，夏意初长' },
  { name: '小满', phrase: '小得盈满，恰是从容' },
  { name: '芒种', phrase: '有芒之谷，播种有时' },
  { name: '夏至', phrase: '日长之至，盛夏启幕' },
  { name: '小暑', phrase: '风携热意，盛夏渐浓' },
  { name: '大暑', phrase: '暑气至盛，万物荣华' },
  { name: '立秋', phrase: '凉风将至，秋意初生' },
  { name: '处暑', phrase: '暑意渐退，清风徐来' },
  { name: '白露', phrase: '露凝而白，秋色澄明' },
  { name: '秋分', phrase: '昼夜均长，秋色平分' },
  { name: '寒露', phrase: '露寒叶染，秋意渐深' },
  { name: '霜降', phrase: '霜华初降，层林尽染' },
  { name: '立冬', phrase: '万物收藏，冬意初临' },
  { name: '小雪', phrase: '寒云渐密，初雪轻落' },
  { name: '大雪', phrase: '天地积寒，雪意渐盛' },
  { name: '冬至', phrase: '日短之至，一阳初生' }
];

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function signedDegreeDelta(value: number, target: number) {
  return ((value - target + 540) % 360) - 180;
}

function solarApparentLongitude(timestamp: number) {
  const julianDate = timestamp / DAY_MS + 2_440_587.5;
  const centuries = (julianDate - 2_451_545) / 36_525;
  const meanLongitude = normalizeDegrees(
    280.46646 + centuries * (36_000.76983 + centuries * 0.0003032)
  );
  const meanAnomaly = (
    357.52911 + centuries * (35_999.05029 - 0.0001537 * centuries)
  ) * Math.PI / 180;
  const equationOfCenter = (
    1.914602 - centuries * (0.004817 + 0.000014 * centuries)
  ) * Math.sin(meanAnomaly)
    + (0.019993 - 0.000101 * centuries) * Math.sin(2 * meanAnomaly)
    + 0.000289 * Math.sin(3 * meanAnomaly);
  const omega = (125.04 - 1_934.136 * centuries) * Math.PI / 180;
  return normalizeDegrees(
    meanLongitude + equationOfCenter - 0.00569 - 0.00478 * Math.sin(omega)
  );
}

export function calculateSolarTermMoment(year: number, termIndex: number) {
  const targetLongitude = normalizeDegrees(285 + termIndex * 15);
  const approximate = Date.UTC(year, Math.floor(termIndex / 2), termIndex % 2 === 0 ? 6 : 21);
  let lower = approximate - 5 * DAY_MS;
  let upper = approximate + 5 * DAY_MS;

  for (let iteration = 0; iteration < 52; iteration += 1) {
    const middle = (lower + upper) / 2;
    if (signedDegreeDelta(solarApparentLongitude(middle), targetLongitude) < 0) {
      lower = middle;
    } else {
      upper = middle;
    }
  }

  return new Date((lower + upper) / 2);
}

function seasonForTerm(termIndex: number): SolarTermSeason {
  if (termIndex >= 2 && termIndex <= 7) {
    return 'spring';
  }
  if (termIndex >= 8 && termIndex <= 13) {
    return 'summer';
  }
  if (termIndex >= 14 && termIndex <= 19) {
    return 'autumn';
  }
  return 'winter';
}

export function getCurrentSolarTerm(now = new Date()) {
  const year = now.getUTCFullYear();
  const timeline = [year - 1, year, year + 1]
    .flatMap((candidateYear) => SOLAR_TERMS.map((term, termIndex) => ({
      ...term,
      termIndex,
      moment: calculateSolarTermMoment(candidateYear, termIndex)
    })))
    .sort((left, right) => left.moment.getTime() - right.moment.getTime());

  let activePosition = 0;
  for (let index = 0; index < timeline.length; index += 1) {
    if (timeline[index].moment.getTime() <= now.getTime()) {
      activePosition = index;
    } else {
      break;
    }
  }

  const active = timeline[activePosition];
  const next = timeline[activePosition + 1];
  const duration = next.moment.getTime() - active.moment.getTime();
  const progress = Math.max(0, Math.min(1, (now.getTime() - active.moment.getTime()) / duration));

  return {
    ...active,
    season: seasonForTerm(active.termIndex),
    nextName: next.name,
    nextMoment: next.moment,
    progress
  };
}

export function formatChineseLunarDate(date: Date) {
  try {
    const parts = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      timeZone: 'Asia/Shanghai',
      dateStyle: 'full'
    }).formatToParts(date);
    const valueByType = new Map(parts.map((part) => [String(part.type), part.value]));
    const yearName = valueByType.get('yearName');
    const month = valueByType.get('month');
    const day = valueByType.get('day');

    if (!month || !day) {
      return '农历日期暂不可用';
    }
    return `${yearName ? `${yearName}年` : ''}${month}${day}`;
  } catch {
    return '农历日期暂不可用';
  }
}
