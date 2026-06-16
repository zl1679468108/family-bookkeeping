declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
    getFestivals(): string[];
    getOtherFestivals(): string[];
  }

  export class Lunar {
    getDayInChinese(): string;
    getMonthInChinese(): string;
    getFestivals(): string[];
    getOtherFestivals(): string[];
    getMonth(): number;
  }

  export interface Holiday {
    getName(): string;
    isWork(): boolean;
  }

  export namespace HolidayUtil {
    function getHoliday(year: number, month: number, day: number): Holiday | null;
  }
}
