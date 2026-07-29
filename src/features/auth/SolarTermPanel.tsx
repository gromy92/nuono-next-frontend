import { useEffect, useState } from 'react';
import { formatChineseLunarDate, getCurrentSolarTerm } from './solarTerms';

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
});

const shortDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  month: 'numeric',
  day: 'numeric'
});

export function SolarTermPanel({ now }: { now?: Date }) {
  const [liveNow, setLiveNow] = useState(() => new Date());
  const currentTime = now ?? liveNow;
  const term = getCurrentSolarTerm(currentTime);
  const progress = Math.round(term.progress * 100);

  useEffect(() => {
    if (now) {
      return;
    }
    const timer = window.setInterval(() => setLiveNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [now]);

  return (
    <section className={`nuono-solar-term-panel is-${term.season}`} aria-label={`当前节气：${term.name}`}>
      <div className="nuono-solar-term-orbit nuono-solar-term-orbit-one" aria-hidden="true" />
      <div className="nuono-solar-term-orbit nuono-solar-term-orbit-two" aria-hidden="true" />
      <div className="nuono-solar-term-sun" aria-hidden="true"><i /><i /><i /></div>

      <header className="nuono-solar-term-header">
        <span>二十四节气</span>
        <div className="nuono-solar-term-calendar">
          <time dateTime={currentTime.toISOString()}>{dateFormatter.format(currentTime)}</time>
          <span data-testid="solar-term-lunar-date">农历 {formatChineseLunarDate(currentTime)}</span>
        </div>
      </header>

      <div className="nuono-solar-term-content">
        <h2>{term.name}</h2>
        <p>{term.phrase}</p>
      </div>

      <footer className="nuono-solar-term-footer">
        <div className="nuono-solar-term-meta">
          <span><small>始于</small>{shortDateFormatter.format(term.moment)}</span>
          <span><small>下一节气</small>{term.nextName} · {shortDateFormatter.format(term.nextMoment)}</span>
        </div>
        <div className="nuono-solar-term-progress" aria-label={`本节气进度 ${progress}%`}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <span className="nuono-solar-term-progress-label">节气进度 {progress}%</span>
      </footer>
    </section>
  );
}
