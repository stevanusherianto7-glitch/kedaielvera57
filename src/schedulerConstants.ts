import { ShiftType } from './types';

export const SHIFT_TYPES: ShiftType[] = [ShiftType.Pagi, ShiftType.Sore, ShiftType.Full, ShiftType.Off];

export const SHIFT_DETAILS: Record<ShiftType, { label: string; timeRange: string; colorFrom: string; colorTo: string; code: string; type: ShiftType; weekday: string; weekend: string }> = {
  [ShiftType.Pagi]: {
    label: 'Pagi',
    timeRange: '08:00 - 16:00',
    colorFrom: 'emerald-400',
    colorTo: 'emerald-600',
    code: 'P',
    type: ShiftType.Pagi,
    weekday: '08:00 - 16:00',
    weekend: '08:00 - 16:00'
  },
  [ShiftType.Sore]: {
    label: 'Sore',
    timeRange: '14:00 - 22:00',
    colorFrom: 'blue-400',
    colorTo: 'blue-600',
    code: 'S',
    type: ShiftType.Sore,
    weekday: '14:00 - 22:00',
    weekend: '14:00 - 22:00'
  },
  [ShiftType.Full]: {
    label: 'Full Day',
    timeRange: '08:00 - 22:00',
    colorFrom: 'purple-400',
    colorTo: 'purple-600',
    code: 'F',
    type: ShiftType.Full,
    weekday: '08:00 - 22:00',
    weekend: '08:00 - 22:00'
  },
  [ShiftType.Off]: {
    label: 'Libur',
    timeRange: '-',
    colorFrom: 'slate-300',
    colorTo: 'slate-400',
    code: 'O',
    type: ShiftType.Off,
    weekday: '-',
    weekend: '-'
  }
};

export const SHIFT_CONFIGS = Object.values(SHIFT_DETAILS);

export const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 
  'bg-fuchsia-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500'
];

export function getEmployeeInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateMonthDates(year: number, month: number) {
  const dates = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    dates.push(new Date(date).toISOString().split('T')[0]);
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

export function generateShiftsFromPattern(startDate: string, endDate: string, pattern: ShiftType[]) {
  if (!pattern || pattern.length === 0) return {};
  const shifts: Record<string, ShiftType> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let current = new Date(start);
  while (current <= end) {
    const day = current.getDay(); // 0 is Sunday
    const patternIdx = (day + 6) % 7; // Map Sunday(0) to 6, Monday(1) to 0
    shifts[current.toISOString().split('T')[0]] = pattern[patternIdx];
    current.setDate(current.getDate() + 1);
  }
  return shifts;
}
