import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatDateDDMMYYYY, parseDDMMYYYYToISO } from '../utils/date';

interface DateFieldProps {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

/** dd/mm/yyyy text input with a calendar picker button */
export default function DateField({ id, value, onChange, className, wrapperClassName = 'relative w-full', disabled }: DateFieldProps) {
  const [draft, setDraft] = useState(formatDateDDMMYYYY(value));
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(formatDateDDMMYYYY(value));
  }, [value]);

  const handleChange = (next: string) => {
    const digits = next.replace(/\D/g, '').slice(0, 8);
    const formatted = [
      digits.slice(0, 2),
      digits.slice(2, 4),
      digits.slice(4, 8),
    ].filter(Boolean).join('/');
    setDraft(formatted);
    if (!formatted) {
      onChange('');
      return;
    }
    const isoDate = parseDDMMYYYYToISO(formatted);
    if (isoDate) onChange(isoDate);
  };

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el || disabled) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };

  return (
    <div className={wrapperClassName}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="დღე/თვე/წელი"
        value={draft}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.value)}
        className={`${className || ''} pr-9`}
      />
      <button type="button" onClick={openPicker} disabled={disabled} title="კალენდარი"
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-amber-400 hover:bg-slate-800 cursor-pointer disabled:opacity-40">
        <CalendarDays className="w-4 h-4" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value || ''}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="absolute right-1 bottom-0 w-px h-px opacity-0 pointer-events-none"
      />
    </div>
  );
}
