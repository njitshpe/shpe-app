import { useState, useMemo } from 'react';

interface UseSelectedDateReturn {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  formattedHeader: string;  // "Saturday 4th"
}

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export const useSelectedDate = (initialDate?: Date): UseSelectedDateReturn => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());

  const formattedHeader = useMemo(() => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNumber = selectedDate.getDate();
    const ordinal = getOrdinalSuffix(dayNumber);

    return `${dayOfWeek} ${dayNumber}${ordinal}`;
  }, [selectedDate]);

  return {
    selectedDate,
    setSelectedDate,
    formattedHeader,
  };
};
