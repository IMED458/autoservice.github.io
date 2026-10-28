import { CalendarDays, X } from 'lucide-react';
import DateField from './DateField';
import { shiftISODate, toISODateInputValue } from '../utils/date';

interface DayFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  accent?: 'amber' | 'cyan';
  title?: string;
}

/** Day / date-range filter: quick "today"/"yesterday", a single day, or a from–to range */
export default function DayFilter({ from, to, onChange, accent = 'amber', title = 'თარიღის ფილტრი' }: DayFilterProps) {
  const today = toISODateInputValue();
  const yesterday = shiftISODate(today, -1);
  const isSingleDay = !!from && from === to;
  const active = accent === 'amber' ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950';
  const focus = accent === 'amber' ? 'focus:border-amber-500' : 'focus:border-cyan-500';
  const inputCls = `w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none ${focus} text-slate-200 text-xs`;
  const quick = [
    { label: 'დღეს', on: isSingleDay && from === today, set: () => onChange(today, today) },
    { label: 'გუშინ', on: isSingleDay && from === yesterday, set: () => onChange(yesterday, yesterday) },
    { label: 'ყველა', on: !from && !to, set: () => onChange('', '') },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-2.5">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
        <CalendarDays className={`w-3.5 h-3.5 ${accent === 'amber' ? 'text-amber-400' : 'text-cyan-400'}`} />
        {title}
      </h3>
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        {quick.map(q => (
          <button key={q.label} type="button" onClick={q.set}
            className={`py-1.5 text-[11px] font-bold rounded-md cursor-pointer transition-all ${q.on ? active : 'text-slate-400 hover:text-slate-200'}`}>
            {q.label}
          </button>
        ))}
      </div>
      <div>
        <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">კონკრეტული დღე</label>
        <DateField value={isSingleDay ? from : ''} onChange={d => onChange(d, d)} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">-დან</label>
          <DateField value={from} onChange={d => onChange(d, to)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">-მდე</label>
          <DateField value={to} onChange={d => onChange(from, d)} className={inputCls} />
        </div>
      </div>
      {(from || to) && (
        <button type="button" onClick={() => onChange('', '')}
          className="w-full text-[10px] font-bold text-rose-400 py-1 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer flex items-center justify-center gap-1">
          <X className="w-3 h-3" /> ფილტრის მოხსნა
        </button>
      )}
    </div>
  );
}
