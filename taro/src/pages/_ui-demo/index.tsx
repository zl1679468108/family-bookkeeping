/**
 * _ui-demo — 组件库可视化验收页（开发期用，不进 tabBar）
 * 覆盖所有组件各 variant，供视觉验证。
 */
import { useState } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import {
  Button, Card, CardHeader, CardContent, Badge, EmptyState,
  Skeleton, Input, SearchInput, NumberInput, Textarea, SegControl,
  Switch, GlobalModal, Drawer, DropdownSelect, IconGrid, List, ListItem,
  RankRow, ReportRankList, Pagination, StatCard,
  AppSection, PageHero, MetricGrid, MenuList, FloatingAction,
} from "../../components/ui";
import "./index.scss";

export default function UiDemo() {
  const [inputVal, setInputVal] = useState("");
  const [textVal, setTextVal] = useState("");
  const [seg, setSeg] = useState<"all" | "income" | "expense">("all");
  const [sw, setSw] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string>("");
  const [icon, setIcon] = useState("🍚");

  return (
    <View className="demo">
      <ScrollView scrollY className="demo__scroll">
        <PageHero title="组件库演示" value="Spec 0 + 1" meta="视觉对齐 PC 端" />

        <AppSection title="Button">
          <View className="demo__row">
            <Button variant="default">默认</Button>
            <Button variant="primary">主操作</Button>
            <Button variant="secondary">次要</Button>
          </View>
          <View className="demo__row">
            <Button variant="outline">描边</Button>
            <Button variant="ghost">幽灵</Button>
            <Button variant="danger">危险</Button>
          </View>
          <View className="demo__row">
            <Button size="sm">小</Button>
            <Button size="md" loading>加载中</Button>
            <Button size="lg" disabled>禁用</Button>
          </View>
          <Button variant="primary" block onClick={() => setConfirmOpen(true)}>
            块级按钮（触发 confirm）
          </Button>
        </AppSection>

        <AppSection title="Card">
          <Card>
            <CardHeader title="卡片标题" subTitle="副标题" action={<Badge variant="primary">新</Badge>} />
            <CardContent>
              <Text>这是卡片内容，padding=md。</Text>
            </CardContent>
          </Card>
        </AppSection>

        <AppSection title="Badge">
          <View className="demo__row">
            <Badge>默认</Badge>
            <Badge variant="primary">主</Badge>
            <Badge variant="income">收入</Badge>
            <Badge variant="expense">支出</Badge>
            <Badge variant="warn">警告</Badge>
            <Badge variant="info">信息</Badge>
          </View>
        </AppSection>

        <AppSection title="StatCard">
          <View className="demo__stats">
            <StatCard label="本月支出" value="¥3,200" sub="较上月 -8%" variant="expense" />
            <StatCard label="本月收入" value="¥12,000" sub="较上月 +5%" variant="income" />
          </View>
          <StatCard label="总资产" value="¥86,400" sub="截至 6 月" variant="hero" />
        </AppSection>

        <AppSection title="EmptyState">
          <EmptyState
            icon="📭"
            title="暂无数据"
            description="点击下方按钮添加第一条记录"
            action={<Button variant="primary" size="sm">添加</Button>}
          />
        </AppSection>

        <AppSection title="Skeleton" loading>
          <Text>上方 loading 态即 AppSection loading 效果</Text>
        </AppSection>

        <AppSection title="Skeleton 预设">
          <View className="demo__row">
            <View className="demo__sk-col">
              <AvatarSkeleton />
              <ButtonSkeleton />
              <InputSkeleton />
            </View>
            <View className="demo__sk-col">
              <TextLineSkeleton />
              <TextParagraphSkeleton lines={2} />
            </View>
          </View>
          <StatCardsSkeleton count={3} />
        </AppSection>

        <AppSection title="Input">
          <Input label="用户名" placeholder="请输入" value={inputVal} onChange={setInputVal} allowClear required />
          <Input label="错误态" placeholder="演示" error="该字段必填" />
          <SearchInput value={inputVal} onChange={setInputVal} placeholder="搜索..." />
          <NumberInput label="金额" prefix="¥" placeholder="0.00" />
        </AppSection>

        <AppSection title="Textarea">
          <Textarea label="备注" placeholder="说点什么..." value={textVal} onChange={setTextVal} showCount maxLength={100} />
        </AppSection>

        <AppSection title="SegControl">
          <SegControl
            value={seg}
            onChange={setSeg}
            options={[
              { value: "all", label: "全部" },
              { value: "income", label: "收入" },
              { value: "expense", label: "支出" },
            ]}
          />
          <View style={{ height: "16rpx" }} />
          <SegControl variant="pill" value={seg} onChange={setSeg}
            options={[{ value: "all", label: "日" }, { value: "income", label: "周" }, { value: "expense", label: "月" }]} />
        </AppSection>

        <AppSection title="Switch">
          <View className="demo__row">
            <Text>开关：{sw ? "开" : "关"}</Text>
            <Switch checked={sw} onChange={setSw} />
          </View>
        </AppSection>

        <AppSection title="DropdownSelect">
          <DropdownSelect
            label="分类"
            placeholder="选择分类"
            value={dropdown}
            onChange={setDropdown}
            showSearch
            options={[
              { key: "1", label: "餐饮", icon: "🍚" },
              { key: "2", label: "交通", icon: "🚗" },
              { key: "3", label: "购物", icon: "🛒" },
              { key: "4", label: "居住", icon: "🏠" },
            ]}
          />
        </AppSection>

        <AppSection title="IconGrid">
          <IconGrid
            value={icon}
            onChange={setIcon}
            options={[
              { value: "🍚", icon: "🍚" }, { value: "🍜", icon: "🍜" },
              { value: "🍔", icon: "🍔" }, { value: "🚗", icon: "🚗" },
              { value: "🛒", icon: "🛒" }, { value: "🏠", icon: "🏠" },
            ]}
          />
        </AppSection>

        <AppSection title="List">
          <List inset>
            <ListItem icon={<Text>👤</Text>} title="个人资料" showArrow onClick={() => setDetailOpen(true)} />
            <ListItem icon={<Text>🔔</Text>} title="通知" extra={<Switch checked={sw} onChange={setSw} />} divider={false} />
          </List>
        </AppSection>

        <AppSection title="RankRow">
          <RankRow
            icon={<Text>🍚</Text>}
            label="餐饮"
            amount="¥1,280"
            totalAmount="/ ¥2,000"
            progress={64}
            meta="本月已用 64%"
            type="expense"
          />
        </AppSection>

        <AppSection title="ReportRankList">
          <ReportRankList
            items={[
              { icon: "🍚", label: "餐饮", amount: "¥3,200", type: "expense" },
              { icon: "🚗", label: "交通", amount: "¥1,200", type: "expense" },
              { icon: "💰", label: "工资", amount: "¥12,000", type: "income" },
            ]}
          />
        </AppSection>

        <AppSection title="Pagination">
          <Pagination page={1} totalPages={5} info="第 1/5 页 · 共 80 条" onChange={() => {}} />
        </AppSection>

        <AppSection title="MenuList">
          <MenuList
            items={[
              { key: "1", label: "设置", icon: "settings", onClick: () => {} },
              { key: "2", label: "退出登录", icon: "logout", danger: true },
            ]}
          />
        </AppSection>

        <AppSection title="MetricGrid">
          <MetricGrid
            columns={2}
            items={[
              { label: "本月支出", value: "¥3,200", tone: "expense" },
              { label: "本月收入", value: "¥12,000", tone: "income" },
            ]}
          />
        </AppSection>

        <AppSection title="弹窗 / 抽屉">
          <View className="demo__row">
            <Button variant="outline" onClick={() => setModalOpen(true)}>Modal 表单</Button>
            <Button variant="outline" onClick={() => setDetailOpen(true)}>Detail 详情</Button>
            <Button variant="outline" onClick={() => setDrawerOpen(true)}>Drawer</Button>
          </View>
        </AppSection>

        <View style={{ height: "200rpx" }} />
      </ScrollView>

      <FloatingAction onClick={() => setConfirmOpen(true)} />

      <GlobalModal type="modal" open={modalOpen} onClose={() => setModalOpen(false)} title="编辑信息" size="sm"
        footer={<Button variant="primary" block onClick={() => setModalOpen(false)}>保存</Button>}>
        <Input label="名称" placeholder="输入名称" />
      </GlobalModal>

      <GlobalModal type="detail" open={detailOpen} onClose={() => setDetailOpen(false)} title="详情"
        footer={<><Button onClick={() => setDetailOpen(false)}>关闭</Button><Button variant="primary" onClick={() => setDetailOpen(false)}>编辑</Button></>}>
        <Text>这里是详情内容。展示底部 sheet 形态的详情弹窗。</Text>
      </GlobalModal>

      <GlobalModal type="confirm" open={confirmOpen} onClose={() => setConfirmOpen(false)}
        title="确认删除" description="此操作不可撤销，确定继续吗？"
        confirmText="确认删除" confirmDanger onConfirm={() => setConfirmOpen(false)} />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="筛选条件"
        footer={<Button variant="primary" block onClick={() => setDrawerOpen(false)}>应用筛选</Button>}>
        <SegControl value={seg} onChange={setSeg}
          options={[{ value: "all", label: "全部" }, { value: "income", label: "收入" }, { value: "expense", label: "支出" }]} />
        <View style={{ height: "40rpx" }} />
        <Text>这里放更多筛选选项，可滚动。</Text>
      </Drawer>
    </View>
  );
}
