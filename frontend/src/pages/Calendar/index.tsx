import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDailySummary } from '../../services/statisticsApi';
import { getTransactions, type Transaction } from '../../services/api';
import { useCategoryLookup } from '../../hooks/useCategories';
import { formatAmountWithType } from '../../utils/common';
import type { DailySummaryItem } from '../../types/statistics';
import { Skeleton, DropdownSelect, GlobalModal } from '../../components/ui';
import { Solar, HolidayUtil } from 'lunar-javascript';

/** 获取某年某月的天数 */
const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

/** 获取某年某月第一天是星期几（0=周日, 6=周六） */
const firstDayOfWeek = (year: number, month: number): number =>
  new Date(year, month - 1, 1).getDay();

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

/** 构建当月月份字符串 "YYYY-MM" */
const toMonthKey = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, '0')}`;

/** 格式化金额（不加货币符号） */
const formatAmount = (amount: number): string => {
  if (amount === 0) return '0';
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/** 生成月份选项（前5年到后5年） */
const generateMonthOptions = (): { key: string; label: string }[] => {
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

interface LunarInfo {
  lunarMonth: string;
  lunarDay: string;
  lunarFull: string;
  /** 格子里第二行显示的文本：节日名/调休名/农历日 */
  subText: string;
  /** 弹窗中展示的调休/上班标签文本，如 "端午节休"、"春节班"，无则空 */
  holidayInfo: string;
  /** 是否是法定节假日相关（含调休） */
  isLegalHoliday: boolean;
  /** 法定节假日(带调休)：true=需上班(调休工作日)，false=休息，null=非法定节假日 */
  isWork: boolean | null;
  /** 农历月份是否是闰月 */
  isLeapMonth: boolean;
  /** 原始农历日文本 */
  lunarDayText: string;
}

/** 获取日期对应的农历和节假日信息 */
const getLunarInfo = (dateStr: string): LunarInfo => {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();

  // 农历月份和日
  const lunarDayStr = lunar.getDayInChinese();
  const lunarMonthStr = lunar.getMonthInChinese();
  const isLeapMonth = lunar.getMonth() < 0;

  // 阳历节日（如劳动节、儿童节）
  const solarFestivals: string[] = solar.getFestivals() || [];
  // 农历节日（如春节、端午节）
  const lunarFestivals: string[] = lunar.getFestivals() || [];

  // 法定节假日信息（含调休）
  const holiday = HolidayUtil.getHoliday(year, month, day);

  // 是否是节日当天：lunarFestivals 或 solarFestivals 中存在节日名
  const isFestivalDay = lunarFestivals.length > 0 || solarFestivals.length > 0;

  // 格子第二行文本优先级：
  // 1. 节日当天 → 显示节日名
  // 2. 法定节假日调休 → 显示"X节休/班"
  // 3. 否则 → 农历日
  let subText = lunarDayStr;
  if (isFestivalDay) {
    subText = (lunarFestivals[0] || solarFestivals[0]);
  } else if (holiday) {
    subText = holiday.getName() + (holiday.isWork() ? '（班）' : '（休）');
  }

  // 弹窗中的调休标签
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

const Calendar: React.FC = () => {
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const monthKey = toMonthKey(viewYear, viewMonth);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const currentMonthKey = useMemo(() => toMonthKey(viewYear, viewMonth), [viewYear, viewMonth]);

  // ---- 每日汇总数据 ----
  const { data: dailyData = [], isLoading: summaryLoading } = useQuery({
    queryKey: ['statistics', 'daily-summary', monthKey],
    queryFn: () => fetchDailySummary({ month: monthKey }),
    staleTime: 2 * 60 * 1000,
    refetchOnMount: false,
  });

  // ---- 选中日期的交易明细 ----
  const { data: dayTransactions = [], isLoading: txsLoading } = useQuery({
    queryKey: ['transactions', 'by-date', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [] as Transaction[];
      const result = await getTransactions({
        startDate: selectedDate,
        endDate: selectedDate,
        pageSize: 200,
      });
      return result.data;
    },
    enabled: !!selectedDate,
  });

  // ---- 月度统计 ----
  const monthStats = useMemo(() => {
    const totalExpense = dailyData.reduce((sum, d) => sum + d.total_expense, 0);
    const totalIncome = dailyData.reduce((sum, d) => sum + d.total_income, 0);
    const totalCount = dailyData.reduce((sum, d) => sum + d.transaction_count, 0);
    return { totalExpense, totalIncome, totalCount };
  }, [dailyData]);

  // ---- 日历网格构建 ----
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDow = firstDayOfWeek(viewYear, viewMonth);

  // 按日期快速索引
  const dateMap = useMemo(() => {
    const map: Record<string, DailySummaryItem> = {};
    for (const item of dailyData) {
      map[item.date] = item;
    }
    return map;
  }, [dailyData]);

  // 构建日历格子数组
  const cells = useMemo(() => {
    const result: (DailySummaryItem | null)[] = [];
    // 填充前置空白
    for (let i = 0; i < startDow; i++) {
      result.push(null);
    }
    // 填充日期
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push(
        dateMap[dateStr] || {
          date: dateStr,
          total_income: 0,
          total_expense: 0,
          transaction_count: 0,
        },
      );
    }
    return result;
  }, [startDow, totalDays, viewYear, viewMonth, dateMap]);

  // ---- 月份切换 ----
  const goPrevMonth = useCallback(() => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [viewMonth, viewYear]);

  const goNextMonth = useCallback(() => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [viewMonth, viewYear]);

  // ---- 月份选择器 ----
  const handleMonthChange = useCallback((key: string) => {
    if (!key) return;
    const [y, m] = key.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m);
    setSelectedDate(null);
  }, []);

  // ---- 点击日期：弹出弹窗 ----
  const handleDateClick = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    setShowDetailModal(true);
  }, []);

  // ---- 渲染 ----
  return (
    <div className="page-container">
      <div className="dash-card">
        {/* 顶部标题与月份切换 */}
        <div className="cal-header-row">
          <button className="cal-nav-btn cal-nav-btn--prev" onClick={goPrevMonth} title="上一月">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="cal-nav-btn cal-nav-btn--next" onClick={goNextMonth} title="下一月">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          {summaryLoading ? (
            <Skeleton width="120px" height="28px" borderRadius="var(--rs)" />
          ) : (
            <DropdownSelect
              options={monthOptions}
              value={currentMonthKey}
              onChange={handleMonthChange}
              allowClear={false}
              width="auto"
              showSearch
              searchPlaceholder="搜索月份..."
            />
          )}
        </div>

        {/* 日历网格 */}
        <div className="cal-grid">
          {/* 星期标题行 */}
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="cal-hd">
              {label}
            </div>
          ))}

          {/* 日期格子 */}
          {summaryLoading ? (
            Array.from({ length: 35 }).map((_, idx) => (
              <div key={idx} className="cal-cell" style={{ pointerEvents: 'none' }}>
                <div className="cd-top">
                  <div className="cd-date-wrap">
                    <Skeleton width="24px" height="28px" borderRadius="3px" />
                  </div>
                </div>
                <Skeleton width="36px" height="12px" borderRadius="2px" style={{ marginTop: '4px' }} />
                <Skeleton width="40px" height="12px" borderRadius="2px" style={{ marginTop: '4px' }} />
              </div>
            ))
          ) : (
            cells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="cal-cell other" />;
              }

              const dayNum = parseInt(cell.date.slice(8, 10), 10);
              const isToday = cell.date === todayStr;
              const hasTransactions = cell.transaction_count > 0;
              const lunarInfo = getLunarInfo(cell.date);

              // 格子第二行显示文本已在 getLunarInfo 中计算好
              const subText = lunarInfo.subText;
              // 是否是节日相关（用于给灰色节日/调休名保持一致的灰色样式）
              const isFestivalDay = lunarInfo.isLegalHoliday || lunarInfo.subText !== lunarInfo.lunarDayText;

              return (
                <div
                  key={cell.date}
                  className={`cal-cell${isToday ? ' today' : ''}`}
                  onClick={() => handleDateClick(cell.date)}
                >
                  <div className="cd-left">
                    <div className="cd-date">{dayNum}</div>
                    <div className={`cd-sub${isFestivalDay ? ' festival' : ''}`}>
                      {subText}
                    </div>
                  </div>
                  <div className="cd-mid">
                    <div className="cd-stats">
                      <div className="cd-stat-row">
                        <span className="cd-stat-k">支</span>
                        <span className="cd-stat-v exp">{formatAmount(cell.total_expense)}</span>
                      </div>
                      <div className="cd-stat-row">
                        <span className="cd-stat-k">收</span>
                        <span className="cd-stat-v inc">{formatAmount(cell.total_income)}</span>
                      </div>
                      <div className="cd-stat-row">
                        <span className="cd-stat-v neutral">{cell.transaction_count}笔</span>
                      </div>
                    </div>
                  </div>
                  {hasTransactions && <div className="cd-dot" />}
                </div>
              );
            })
          )}
        </div>

        {/* 月度汇总卡片 */}
        <div className="cal-summary-row">
          {summaryLoading ? (
            <>
              <div className="cal-stat" style={{ pointerEvents: 'none' }}>
                <div className="cs-lbl"><Skeleton width="40px" height="11px" /></div>
                <Skeleton width="80px" height="18px" />
              </div>
              <div className="cal-stat" style={{ pointerEvents: 'none' }}>
                <div className="cs-lbl"><Skeleton width="40px" height="11px" /></div>
                <Skeleton width="80px" height="18px" />
              </div>
              <div className="cal-stat" style={{ pointerEvents: 'none' }}>
                <div className="cs-lbl"><Skeleton width="40px" height="11px" /></div>
                <Skeleton width="60px" height="18px" />
              </div>
              <div className="cal-stat" style={{ pointerEvents: 'none' }}>
                <div className="cs-lbl"><Skeleton width="40px" height="11px" /></div>
                <Skeleton width="80px" height="18px" />
              </div>
            </>
          ) : (
            <>
              <div className="cal-stat">
                <div className="cs-lbl">总支出</div>
                <div className="cs-val exp">¥{formatAmount(monthStats.totalExpense)}</div>
              </div>
              <div className="cal-stat">
                <div className="cs-lbl">总收入</div>
                <div className="cs-val inc">¥{formatAmount(monthStats.totalIncome)}</div>
              </div>
              <div className="cal-stat">
                <div className="cs-lbl">总笔数</div>
                <div className="cs-val neutral">{monthStats.totalCount}</div>
              </div>
              <div className="cal-stat">
                <div className="cs-lbl">结余</div>
                <div className={`cs-val ${monthStats.totalIncome - monthStats.totalExpense >= 0 ? 'inc' : 'exp'}`}>
                  ¥{formatAmount(monthStats.totalIncome - monthStats.totalExpense)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 日期详情弹窗 */}
      <GlobalModal
        type="detail"
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDate(null);
        }}
        title={selectedDate || ''}
      >
        {selectedDate && (() => {
          const lunarInfo = getLunarInfo(selectedDate);
          const cellData = dateMap[selectedDate];
          const dayNum = parseInt(selectedDate.slice(8, 10), 10);

          return (
            <div className="cal-detail-modal">
              {/* 日期头部信息 */}
              <div className="cal-detail-header">
                <div className="cal-detail-day-wrap">
                  <div className="cal-detail-day">{dayNum}</div>
                  <div className="cal-detail-lunar-info">
                    <div className="cal-detail-lunar-text">{lunarInfo.lunarFull}</div>
                    {lunarInfo.holidayInfo && (
                      <div
                        className={`cal-detail-holiday${lunarInfo.isWork === true
                            ? ' work'
                            : lunarInfo.isWork === false
                              ? ' rest'
                              : ' normal'
                          }`}
                      >
                        {lunarInfo.holidayInfo}
                      </div>
                    )}
                  </div>
                </div>
                <div className="cal-detail-stats">
                  <div className="cal-detail-stat-row">
                    <span className="cal-detail-stat-label">总支出</span>
                    <span className="cal-detail-stat-value exp">
                      ¥{cellData ? formatAmount(cellData.total_expense) : '0'}
                    </span>
                  </div>
                  <div className="cal-detail-stat-row">
                    <span className="cal-detail-stat-label">总收入</span>
                    <span className="cal-detail-stat-value inc">
                      ¥{cellData ? formatAmount(cellData.total_income) : '0'}
                    </span>
                  </div>
                  <div className="cal-detail-stat-row">
                    <span className="cal-detail-stat-label">总笔数</span>
                    <span className="cal-detail-stat-value neutral">
                      {cellData ? cellData.transaction_count : 0}笔
                    </span>
                  </div>
                </div>
              </div>

              {/* 交易明细列表 */}
              <div className="cal-detail-txn-section">
                {txsLoading ? (
                  <div className="cal-detail-txn-list" style={{ pointerEvents: 'none' }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="txn-row">
                        <div className="txn-icon">
                          <Skeleton width="100%" height="100%" borderRadius="8px" />
                        </div>
                        <div className="txn-info">
                          <Skeleton width="50%" height="13px" marginBottom="4px" />
                          <Skeleton width="35%" height="11px" />
                        </div>
                        <Skeleton width="64px" height="14px" />
                      </div>
                    ))}
                  </div>
                ) : dayTransactions.length === 0 ? (
                  <div className="calendar-empty">当天暂无交易记录</div>
                ) : (
                  <div className="cal-detail-txn-list txn-list">
                    {dayTransactions.map((item) => {
                      const isIncome = item.type === 'income';
                      const categoryName = getCategoryName(item.category);
                      const icon = getCategoryIcon(item.category);
                      const name = item.description || categoryName;

                      return (
                        <div key={item.id} className="txn-row">
                          <div className="txn-icon">{icon}</div>
                          <div className="txn-info">
                            <div className="txn-title">{name}</div>
                            <div className="txn-meta">
                              <span>{categoryName}</span>
                              <span>{item.created_at ? item.created_at.slice(11, 16) : ''}</span>
                            </div>
                          </div>
                          <div className={`txn-amount ${isIncome ? 'credit' : 'debit'}`}>
                            {formatAmountWithType(parseFloat(String(item.amount)), isIncome)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </GlobalModal>
    </div>
  );
};

export default Calendar;
