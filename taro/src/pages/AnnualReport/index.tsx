/**
 * AnnualReport — 年度报告
 * 与 PC 端一致的年报展示
 */
import { useState, useEffect } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useYearSelector } from "../../hooks/useYearSelector";
import { useManualQuery } from "../../hooks/useManualQuery";
import { fetchAnnualReport } from "../../services/annualReportApi";
import ReportCover from "./components/ReportCover";
import ReportOverview from "./components/ReportOverview";
import ReportMonthlyTrend from "./components/ReportMonthlyTrend";
import ReportCategoryRank from "./components/ReportCategoryRank";
import ReportRecords from "./components/ReportRecords";
import ReportFunFact from "./components/ReportFunFact";
import ReportFooter from "./components/ReportFooter";
import "./index.scss";

export default function AnnualReport() {
  const { year, setYear } = useYearSelector();
  const [selectVisible, setSelectVisible] = useState(false);
  const [localYear, setLocalYear] = useState(year);

  const { data: report, isLoading } = useManualQuery({
    key: `annual-report-${year}`,
    queryFn: () => fetchAnnualReport(year),
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleYearSelect = (y: number) => {
    setYear(y);
    setLocalYear(y);
    setSelectVisible(false);
  };

  // Process data
  const totalIncome = report?.total_income || report?.totalIncome || 0;
  const totalExpense = report?.total_expense || report?.totalExpense || 0;
  const netSavings = totalIncome - totalExpense;
  const transactionCount = report?.transaction_count || report?.transactionCount || 0;

  // Monthly data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthKey = `m${i + 1}`;
    const monthReport = report?.monthly?.[monthKey] || report?.monthlyData?.[monthKey] || {};
    return {
      month: i + 1,
      income: monthReport.income || monthReport.total_income || 0,
      expense: monthReport.expense || monthReport.total_expense || 0,
    };
  });

  // Category data
  const expenseCategories = (report?.expense_categories || report?.categories?.expense || []).map((c: any, idx: number, arr: any[]) => ({
    id: c.id || c.category_id,
    name: c.name || c.category_name,
    icon: c.icon || c.category_icon || "📌",
    amount: c.amount || c.total_amount || 0,
    count: c.count || c.transaction_count || 0,
    percentage: arr.length > 0 ? ((c.amount || 0) / (arr.reduce((sum, cat) => sum + (cat.amount || 0), 0) || 1)) * 100 : 0,
  }));

  const incomeCategories = (report?.income_categories || report?.categories?.income || []).map((c: any, idx: number, arr: any[]) => ({
    id: c.id || c.category_id,
    name: c.name || c.category_name,
    icon: c.icon || c.category_icon || "💰",
    amount: c.amount || c.total_amount || 0,
    count: c.count || c.transaction_count || 0,
    percentage: arr.length > 0 ? ((c.amount || 0) / (arr.reduce((sum, cat) => sum + (cat.amount || 0), 0) || 1)) * 100 : 0,
  }));

  // Fun fact data
  const totalDays = 365;
  const recordDays = report?.record_days || monthlyData.filter(m => m.income > 0 || m.expense > 0).length * 30;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;
  const dailyAvg = totalDays > 0 ? totalExpense / totalDays : 0;
  const topExpenseCat = expenseCategories[0] || { name: "暂无", icon: "📌" };

  // Record items
  const maxExpenseRecord = {
    label: "单笔最大支出",
    value: `¥${(report?.max_expense || report?.maxExpense || 0).toFixed(2)}`,
    icon: "💸",
    desc: report?.max_expense_desc || "",
  };

  const maxIncomeRecord = {
    label: "单笔最大收入",
    value: `¥${(report?.max_income || report?.maxIncome || 0).toFixed(2)}`,
    icon: "💰",
    desc: report?.max_income_desc || "",
  };

  const busiestMonthRecord = {
    label: "最忙碌月份",
    value: monthlyData.reduce((max, m) => (m.expense > max.expense ? m : max), monthlyData[0] || { month: 0, expense: 0 }).month + "月",
    icon: "📅",
    desc: `支出 ¥${(monthlyData.reduce((max, m) => (m.expense > max.expense ? m : max), monthlyData[0] || { month: 0, expense: 0 }).expense || 0).toFixed(2)}`,
  };

  const mostUsedCatRecord = {
    label: "最常用分类",
    value: topExpenseCat.name,
    icon: "🏆",
    desc: topExpenseCat.icon,
  };

  return (
    <View className="annual-report">
      {/* Header */}
      <View className="report-header">
        <View
          className="report-year-picker"
          onClick={() => setSelectVisible(!selectVisible)}
        >
          <Text className="report-year-picker__text">{year}年</Text>
          <Text className="report-year-picker__arrow">▾</Text>
        </View>
        {selectVisible && (
          <View className="report-year-select">
            {years.map((y) => (
              <View
                key={y}
                className={`report-year-option ${y === year ? "report-year-option--active" : ""}`}
                onClick={() => handleYearSelect(y)}
              >
                <Text className="report-year-option__text">{y}年</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <ScrollView scrollY className="report-scroll">
        {isLoading ? (
          <View className="report-loading">
            <View className="report-spinner" />
            <Text className="report-loading-text">正在生成年报...</Text>
          </View>
        ) : (
          <>
            <ReportCover year={year} />

            <ReportOverview
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              netSavings={netSavings}
              transactionCount={transactionCount}
            />

            <ReportMonthlyTrend monthlyData={monthlyData} />

            <ReportCategoryRank
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
            />

            <ReportRecords
              maxExpense={maxExpenseRecord}
              maxIncome={maxIncomeRecord}
              busiestMonth={busiestMonthRecord}
              mostUsedCategory={mostUsedCatRecord}
            />

            <ReportFunFact
              dailyAvg={dailyAvg}
              topCategory={topExpenseCat.name}
              topCategoryIcon={topExpenseCat.icon}
              totalDays={totalDays}
              recordDays={recordDays}
              savingsRate={savingsRate}
            />

            <ReportFooter />
          </>
        )}
      </ScrollView>
    </View>
  );
}
