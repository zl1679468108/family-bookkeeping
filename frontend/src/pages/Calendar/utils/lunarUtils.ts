import { Solar, HolidayUtil } from 'lunar-javascript';

export interface LunarInfo {
  lunarMonth: string;
  lunarDay: string;
  lunarFull: string;
  subText: string;
  holidayInfo: string;
  isLegalHoliday: boolean;
  isWork: boolean | null;
  isLeapMonth: boolean;
  lunarDayText: string;
}

export const getLunarInfo = (dateStr: string): LunarInfo => {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();

  const lunarDayStr = lunar.getDayInChinese();
  const lunarMonthStr = lunar.getMonthInChinese();
  const isLeapMonth = lunar.getMonth() < 0;

  const solarFestivals: string[] = solar.getFestivals() || [];
  const lunarFestivals: string[] = lunar.getFestivals() || [];

  const holiday = HolidayUtil.getHoliday(year, month, day);

  const isFestivalDay = lunarFestivals.length > 0 || solarFestivals.length > 0;

  let subText = lunarDayStr;
  if (isFestivalDay) {
    subText = (lunarFestivals[0] || solarFestivals[0]);
  } else if (holiday) {
    subText = holiday.getName() + (holiday.isWork() ? '（班）' : '（休）');
  }

  let holidayInfo = '';
  if (holiday) {
    holidayInfo = holiday.getName() + (holiday.isWork() ? '（班）' : '（休）');
  }

  return {
    lunarMonth: lunarMonthStr,
    lunarDay: lunarDayStr,
    lunarFull: `${lunarMonthStr}月${lunarDayStr}`,
    subText,
    holidayInfo,
    isLegalHoliday: !!holiday,
    isWork: holiday ? holiday.isWork() : null,
    isLeapMonth,
    lunarDayText: lunarDayStr,
  };
};

export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

export const firstDayOfWeek = (year: number, month: number): number =>
  new Date(year, month - 1, 1).getDay();

export const toMonthKey = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, '0')}`;

export const formatAmount = (amount: number): string => {
  if (amount === 0) return '0';
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const generateMonthOptions = (): { key: string; label: string }[] => {
  const options: { key: string; label: string }[] = [];
  const today = new Date();
  const startYear = today.getFullYear() - 5;
  const endYear = today.getFullYear() + 5;
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      options.push({ key, label: `${y}年${m}月` });
    }
  }
  return options;
};

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
