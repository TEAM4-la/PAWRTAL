import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function MiniCalendar({ selected, onSelect }) {
  const [viewDate, setViewDate] = useState(selected || new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const weeks = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const cellSize = 36;

  return (
    <div style={{ padding: '12px', fontFamily: 'inherit', minWidth: 260 }}>
      {/* Caption */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          style={{
            width: 28, height: 28, border: '1px solid #e5e7eb', borderRadius: 6,
            background: 'white', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#6b7280'
          }}
        >
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          style={{
            width: 28, height: 28, border: '1px solid #e5e7eb', borderRadius: 6,
            background: 'white', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#6b7280'
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cellSize}px)`, marginBottom: 4 }}>
        {DAYS.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 12, fontWeight: 500,
            color: '#9ca3af',
            height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cellSize}px)` }}>
          {week.map((d, di) => {
            const isSelected = selected && isSameDay(d, selected);
            const isCurrentMonth = isSameMonth(d, viewDate);
            const isTodayDate = isToday(d);
            const isSun = di === 0;
            const isSat = di === 6;

            let color = '#374151';
            if (!isCurrentMonth) color = '#d1d5db';

            return (
              <button
                key={di}
                onClick={() => isCurrentMonth && onSelect(d)}
                style={{
                  width: cellSize, height: cellSize,
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: isCurrentMonth ? 'pointer' : 'default',
                  background: isSelected ? '#111827' : 'transparent',
                  color: isSelected ? 'white' : color,
                  fontWeight: isTodayDate && !isSelected ? 700 : 400,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected && isCurrentMonth) e.currentTarget.style.background = '#f3f4f6'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                {format(d, 'd')}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}