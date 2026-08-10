import { useEffect, useState } from 'react';
import { formatDateDDMMYYYY, parseDDMMYYYYToISO } from '../utils/date';

interface DateFieldProps {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
}

export default function DateField({ id, value, onChange, className }: DateFieldProps) {
  const [draft, setDraft] = useState(formatDateDDMMYYYY(value));

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

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="დღე/თვე/წელი"
      value={draft}
      onChange={(e) => handleChange(e.target.value)}
      className={className}
    />
  );
}
