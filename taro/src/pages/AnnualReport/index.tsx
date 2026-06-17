/**
 * AnnualReport — 年度报告（增强版）
 * 与 PC 端一致的年报展示，支持长图保存分享
 */
import { useState } from "react";
import { View, Text, ScrollView, Canvas } from "@tarojs/components";
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
import { fmtAmount } from "../../utils/format";
import "./index.scss";

export default function AnnualReport() {
  const { year, setYear } = useYearSelector();
  const [selectVisible, setSelectVisible] = useState(false);

  const { data: report, isLoading } = useManualQuery({
    key: `annual-report-${year}`,
    queryFn: () => fetchAnnualReport(year),
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleYearSelect = (y: number) => {
    setYear(y);
    setSelectVisible(false);
  };

  // Process data
  const totalIncome = report?.total_income || 0;
  const totalExpense = report?.total_expense || 0;
  const netSavings = totalIncome - totalExpense;
  const transactionCount = report?.transaction_count || 0;

  // Monthly data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthKey = `m${i + 1}`;
    const monthReport: any = report?.monthly?.[monthKey] || {};
    return {
      month: i + 1,
      income: monthReport.income || 0,
      expense: monthReport.expense || 0,
    };
  });

  // Category data
  const expenseCategories = (report?.expense_categories || []).map((c: any, _idx: number, arr: any[]) => ({
    id: c.id,
    name: c.name,
    icon: c.icon || "📌",
    amount: c.amount || 0,
    count: c.count || 0,
    percentage: arr.length > 0 ? ((c.amount || 0) / (arr.reduce((sum, cat) => sum + (cat.amount || 0), 0) || 1)) * 100 : 0,
  }));

  const incomeCategories = (report?.income_categories || []).map((c: any, _idx: number, arr: any[]) => ({
    id: c.id,
    name: c.name,
    icon: c.icon || "💰",
    amount: c.amount || 0,
    count: c.count || 0,
    percentage: arr.length > 0 ? ((c.amount || 0) / (arr.reduce((sum, cat) => sum + (cat.amount || 0), 0) || 1)) * 100 : 0,
  }));

  // Fun fact data
  const totalDays = 365;
  const recordDays = monthlyData.filter(m => m.income > 0 || m.expense > 0).length * 30;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;
  const dailyAvg = totalDays > 0 ? totalExpense / totalDays : 0;
  const topExpenseCat = expenseCategories[0] || { name: "暂无", icon: "📌" };

  // Record items
  const maxExpenseRecord = {
    label: "单笔最大支出",
    value: `¥${(report?.max_expense || 0).toFixed(2)}`,
    icon: "💸",
    desc: "",
  };

  const maxIncomeRecord = {
    label: "单笔最大收入",
    value: `¥${(report?.max_income || 0).toFixed(2)}`,
    icon: "💰",
    desc: "",
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

  // 长图保存和分享
  const [saving, setSaving] = useState(false);

  const handleSaveImage = async () => {
    if (saving) return;
    setSaving(true);
    Taro.showLoading({ title: "正在生成图片..." });

    try {
      const canvas = Taro.createCanvasContext("reportCanvas");
      const ctx = canvas;

      // 设置背景
      ctx.setFillStyle("#ffffff");
      ctx.fillRect(0, 0, 400, 800);

      // 绘制封面
      ctx.setFillStyle("#2d9d8a");
      ctx.fillRect(0, 0, 400, 200);
      ctx.setFillStyle("#ffffff");
      ctx.setFontSize(48);
      ctx.fillText(`${year}年年度报告`, 40, 100);
      ctx.setFontSize(24);
      ctx.fillText("静记 · 记录每一笔", 40, 140);

      // 绘制概览
      let y = 240;
      ctx.setFillStyle("#1f2421");
      ctx.setFontSize(32);
      ctx.fillText("年度收支概览", 40, y);
      y += 50;

      ctx.setFontSize(24);
      ctx.setFillStyle("#666666");
      ctx.fillText("总收入", 40, y);
      ctx.setFillStyle("#2d9d8a");
      ctx.fillText(`¥${fmtAmount(totalIncome)}`, 120, y);
      y += 40;

      ctx.setFillStyle("#666666");
      ctx.fillText("总支出", 40, y);
      ctx.setFillStyle("#e06055");
      ctx.fillText(`¥${fmtAmount(totalExpense)}`, 120, y);
      y += 40;

      ctx.setFillStyle("#666666");
      ctx.fillText("结余", 40, y);
      ctx.setFillStyle(netSavings >= 0 ? "#2d9d8a" : "#e06055");
      ctx.fillText(`¥${fmtAmount(netSavings)}`, 120, y);
      y += 40;

      ctx.setFillStyle("#666666");
      ctx.fillText("交易笔数", 40, y);
      ctx.setFillStyle("#1f2421");
      ctx.fillText(`${transactionCount} 笔`, 120, y);
      y += 60;

      // 绘制分类排行
      ctx.setFillStyle("#1f2421");
      ctx.setFontSize(32);
      ctx.fillText("支出分类排行", 40, y);
      y += 50;

      expenseCategories.slice(0, 5).forEach((cat: any, i: number) => {
        ctx.setFontSize(24);
        ctx.setFillStyle("#1f2421");
        ctx.fillText(`${i + 1}. ${cat.name}`, 40, y);
        ctx.setFillStyle("#666666");
        ctx.fillText(`¥${fmtAmount(cat.amount)}`, 200, y);
        ctx.setFillStyle("#999999");
        ctx.fillText(`${cat.percentage.toFixed(1)}%`, 320, y);
        y += 40;
      });
      y += 30;

      // 绘制记录
      ctx.setFillStyle("#1f2421");
      ctx.setFontSize(32);
      ctx.fillText("年度记录", 40, y);
      y += 50;

      [maxExpenseRecord, maxIncomeRecord, busiestMonthRecord, mostUsedCatRecord].forEach((record: any) => {
        ctx.setFontSize(24);
        ctx.setFillStyle("#666666");
        ctx.fillText(`${record.label}：`, 40, y);
        ctx.setFillStyle("#1f2421");
        ctx.fillText(`${record.value}`, 180, y);
        y += 40;
      });

      // 绘制底部
      y += 40;
      ctx.setFillStyle("#999999");
      ctx.setFontSize(20);
      ctx.fillText("由静记生成", 40, y);

      ctx.draw(false, () => {
        Taro.canvasToTempFilePath({
          canvasId: "reportCanvas",
          success: (res) => {
            Taro.hideLoading();
            Taro.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                Taro.showToast({ title: "已保存到相册", icon: "success" });
              },
              fail: () => {
                Taro.showToast({ title: "保存失败", icon: "none" });
              },
            });
          },
          fail: () => {
            Taro.hideLoading();
            Taro.showToast({ title: "生成图片失败", icon: "none" });
          },
        });
      });
    } catch (err) {
      Taro.hideLoading();
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true,
    } as any);
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

      <ScrollView scrollY className="report-scroll" onScrollToLower={handleShare}>
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

      {/* 底部操作按钮 */}
      <View className="report-actions">
        <View className="report-action-btn save" onClick={handleSaveImage}>
          <Text className="report-action-icon">📥</Text>
          <Text className="report-action-text">{saving ? "生成中..." : "保存图片"}</Text>
        </View>
        <View className="report-action-btn share" onClick={handleShare}>
          <Text className="report-action-icon">📤</Text>
          <Text className="report-action-text">分享</Text>
        </View>
      </View>

      {/* 隐藏的 Canvas 用于生成图片 */}
      <Canvas canvasId="reportCanvas" className="report-canvas" type="2d" style={{ width: "400px", height: "800px", position: "fixed", left: "-9999px", top: "-9999px" }} />
    </View>
  );
}
