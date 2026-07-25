import { expect, Page, Request, Route } from '@playwright/test';

export const API_ORIGIN = 'http://localhost:3000';
export const API_BASE = `${API_ORIGIN}/api`;
export const TEST_ACCESS_TOKEN = 'e2e-access-token';
export const TEST_REFRESH_TOKEN = 'e2e-refresh-token';
/** 兼容旧测试命名；请求实际使用双 token。 */
export const TEST_TOKEN = TEST_ACCESS_TOKEN;

export interface CapturedRequest {
  method: string;
  url: string;
  pathname: string;
  searchParams: URLSearchParams;
  postData: unknown;
  headers: Record<string, string>;
}

const now = '2026-07-07 10:00:00.000';

export const mockUser = {
  id: 'user-1',
  email: 'e2e@example.com',
  username: 'E2E用户',
  role: 'user',
  status: 'active',
  current_book_id: 'book-1',
  created_at: now,
};

export const mockBooks = [
  {
    id: 'book-1',
    name: '家庭账本',
    owner_id: 'user-1',
    role: 'owner',
    icon: 'home',
    description: '日常家庭收支',
    member_count: 2,
    txn_count: 12,
    is_archived: false,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'book-2',
    name: '旅行账本',
    owner_id: 'user-1',
    role: 'owner',
    icon: 'travel',
    description: '暑期旅行',
    member_count: 1,
    txn_count: 3,
    is_archived: false,
    created_at: now,
    updated_at: now,
  },
];

export const mockCategories = [
  {
    id: 'cat-food',
    user_id: 'user-1',
    name: '餐饮',
    icon: '🍜',
    type: 'expense',
    is_default: true,
    sort_order: 0,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'cat-transport',
    user_id: 'user-1',
    name: '交通',
    icon: '🚇',
    type: 'expense',
    is_default: true,
    sort_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'cat-shopping',
    user_id: 'user-1',
    name: '购物',
    icon: '🛍️',
    type: 'expense',
    is_default: false,
    sort_order: 2,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'cat-salary',
    user_id: 'user-1',
    name: '工资',
    icon: '💰',
    type: 'income',
    is_default: true,
    sort_order: 0,
    created_at: now,
    updated_at: now,
  },
] as const;

export const mockTransactions = [
  {
    id: 101,
    amount: 28.5,
    category: 'cat-food',
    type: 'expense',
    date: '2026-07-06',
    description: '午餐',
    brand: '社区食堂',
    location_name: '静安寺',
    created_at: now,
  },
  {
    id: 102,
    amount: 12000,
    category: 'cat-salary',
    type: 'income',
    date: '2026-07-05',
    description: '七月工资',
    brand: '',
    created_at: now,
  },
  {
    id: 103,
    amount: 99,
    category: 'cat-shopping',
    type: 'expense',
    date: '2026-07-04',
    description: 'E2E购物测试',
    brand: '线上商城',
    created_at: now,
  },
];

export const mockTemplates = [
  {
    id: 'tpl-lunch',
    user_id: 'user-1',
    name: '工作日午餐',
    type: 'expense',
    amount: 35,
    category_id: 'cat-food',
    note: '公司附近',
    sort_order: 0,
    created_at: now,
  },
];

export function envelope<T>(data: T) {
  return {
    success: true,
    message: 'ok',
    data,
  };
}

export async function installApiMocks(page: Page) {
  const captured: CapturedRequest[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      throw new Error(`Browser console error: ${message.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    throw error;
  });

  await page.route(`${API_BASE}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const body = parsePostData(request);

    captured.push({
      method: request.method(),
      url: request.url(),
      pathname: url.pathname,
      searchParams: url.searchParams,
      postData: body,
      headers: request.headers(),
    });

    await fulfillApi(route, request, url, body);
  });

  return captured;
}

export async function loginByStorage(page: Page) {
  await page.addInitScript(({ accessToken, refreshToken }) => {
    window.localStorage.setItem('auth_access_token', accessToken);
    window.sessionStorage.setItem('auth_refresh_token', refreshToken);
  }, { accessToken: TEST_ACCESS_TOKEN, refreshToken: TEST_REFRESH_TOKEN });
}

export async function setupAuthenticatedPage(page: Page) {
  const captured = await installApiMocks(page);
  await loginByStorage(page);
  return captured;
}

export async function expectAppReady(page: Page) {
  await expect(page.locator('.sidebar, nav').first()).toBeVisible();
  await expect(page.getByText(mockUser.username).first()).toBeVisible();
}

export function findRequest(captured: CapturedRequest[], method: string, pathSuffix: string) {
  return captured.find((entry) => (
    entry.method === method && entry.pathname.endsWith(pathSuffix)
  ));
}

export async function waitForRequest(
  page: Page,
  method: string,
  pathSuffix: string,
  action: () => Promise<void>,
) {
  const requestPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return request.method() === method && url.pathname.endsWith(pathSuffix);
  });
  await action();
  const request = await requestPromise;
  return parsePostData(request);
}

export async function chooseDropdownOption(page: Page, triggerText: string, optionText: string) {
  await page.locator('.dd-select__btn').filter({ hasText: triggerText }).first().click();
  await page.locator('.dd-select__item').filter({ hasText: optionText }).first().click();
}

export async function openCategoryDropdown(page: Page, optionText: string) {
  await page.locator('.dd-select__btn').filter({ hasText: /选择分类|全部分类/ }).first().click();
  await page.locator('.dd-select__item').filter({ hasText: optionText }).first().click();
}

export function expectObject(value: unknown): Record<string, unknown> {
  expect(typeof value).toBe('object');
  expect(value).not.toBeNull();
  return value as Record<string, unknown>;
}

function parsePostData(request: Request): unknown {
  const raw = request.postData();
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

async function fulfillApi(route: Route, request: Request, url: URL, body: unknown) {
  const path = url.pathname.replace('/api', '');
  const method = request.method();

  if (method === 'GET' && path === '/auth/profile') {
    return json(route, mockUser);
  }
  if (method === 'POST' && path === '/auth/login') {
    return json(route, {
      user: mockUser,
      accessToken: TEST_ACCESS_TOKEN,
      refreshToken: TEST_REFRESH_TOKEN,
    });
  }
  if (method === 'POST' && path === '/auth/logout') {
    return json(route, null);
  }
  if (method === 'GET' && path === '/auth/captcha') {
    return json(route, { captchaId: 'captcha.e2e', svg: '<svg><text>1234</text></svg>' });
  }
  if (method === 'PUT' && path === '/auth/current-book') {
    return json(route, { book_id: bodyObject(body).book_id ?? 'book-1' });
  }

  if (method === 'GET' && path === '/books') {
    return json(route, mockBooks);
  }
  if (method === 'POST' && path === '/books') {
    return json(route, { ...mockBooks[0], id: 'book-created', ...bodyObject(body) });
  }
  if (method === 'PUT' && /^\/books\/[^/]+$/.test(path)) {
    return json(route, { ...mockBooks[0], ...bodyObject(body) });
  }
  if (method === 'DELETE' && /^\/books\/[^/]+$/.test(path)) {
    return json(route, null);
  }
  if (method === 'GET' && /^\/books\/[^/]+\/members$/.test(path)) {
    return json(route, [
      { id: 'user-1', email: mockUser.email, username: mockUser.username, role: 'owner', joined_at: now },
      { id: 'user-2', email: 'member@example.com', username: '家庭成员', role: 'member', joined_at: now },
    ]);
  }
  if (method === 'POST' && /^\/books\/[^/]+\/members$/.test(path)) {
    return json(route, null);
  }
  if (method === 'POST' && /^\/books\/[^/]+\/invitations$/.test(path)) {
    return json(route, { code: 'JJ2026', book_name: '家庭账本', expires_at: now });
  }

  if (method === 'GET' && path === '/categories') {
    const type = url.searchParams.get('type');
    const data = type ? mockCategories.filter((category) => category.type === type) : mockCategories;
    return json(route, data);
  }
  if (method === 'POST' && path === '/categories') {
    return json(route, {
      id: 'cat-created',
      user_id: 'user-1',
      sort_order: 9,
      created_at: now,
      updated_at: now,
      ...bodyObject(body),
    });
  }
  if (method === 'PUT' && /^\/categories\/[^/]+$/.test(path)) {
    return json(route, { ...mockCategories[2], ...bodyObject(body) });
  }
  if (method === 'DELETE' && /^\/categories\/[^/]+$/.test(path)) {
    return json(route, null);
  }
  if (method === 'PATCH' && path === '/categories/reorder') {
    return json(route, null);
  }

  if (method === 'GET' && path === '/custom-icons') {
    return json(route, []);
  }

  if (method === 'GET' && path === '/transactions') {
    return json(route, filteredTransactions(url));
  }
  if (method === 'GET' && /^\/transactions\/\d+$/.test(path)) {
    return json(route, mockTransactions[0]);
  }
  if (method === 'POST' && path === '/transactions') {
    return json(route, { ...mockTransactions[0], id: 999, ...bodyObject(body) });
  }
  if (method === 'PUT' && /^\/transactions\/\d+$/.test(path)) {
    return json(route, { ...mockTransactions[0], ...bodyObject(body) });
  }
  if (method === 'DELETE' && /^\/transactions\/\d+$/.test(path)) {
    return json(route, null);
  }

  if (method === 'GET' && path === '/statistics/summary') {
    return json(route, {
      totalIncome: 12000,
      totalExpense: 127.5,
      balance: 11872.5,
      incomeCount: 1,
      expenseCount: 2,
      incomeChange: 12000,
      incomeChangePercent: null,
      expenseChange: 127.5,
      expenseChangePercent: null,
      balanceChange: 11872.5,
      balanceChangePercent: null,
    });
  }
  if (method === 'GET' && path === '/statistics/category-breakdown') {
    const type = url.searchParams.get('type');
    return json(route, type === 'income'
      ? [{ category_id: 'cat-salary', category_name: '工资', category_icon: '💰', amount: 12000, percentage: 100 }]
      : [
          { category_id: 'cat-food', category_name: '餐饮', category_icon: '🍜', amount: 28.5, percentage: 22 },
          { category_id: 'cat-shopping', category_name: '购物', category_icon: '🛍️', amount: 99, percentage: 78 },
        ]);
  }
  if (method === 'GET' && path === '/statistics/daily-summary') {
    return json(route, [
      { date: '2026-07-04', total_income: 0, total_expense: 99, transaction_count: 1 },
      { date: '2026-07-05', total_income: 12000, total_expense: 0, transaction_count: 1 },
      { date: '2026-07-06', total_income: 0, total_expense: 28.5, transaction_count: 1 },
    ]);
  }
  if (method === 'GET' && path === '/statistics/monthly-trend') {
    return json(route, [
      { month: '2026-05', amount: 600, expense: 600, income: 9000 },
      { month: '2026-06', amount: 800, expense: 800, income: 10000 },
      { month: '2026-07', amount: 127.5, expense: 127.5, income: 12000 },
    ]);
  }
  if (method === 'GET' && path === '/statistics/yoy-comparison') {
    return json(route, [
      { month: '07', monthLabel: '7月', currentYear: 127.5, lastYear: 300 },
    ]);
  }
  if (method === 'GET' && path === '/statistics/member-comparison') {
    return json(route, [
      {
        user_id: 'user-1',
        user_name: mockUser.username,
        total_expense: 80,
        categories: [{ category_name: '餐饮', category_icon: '🍜', amount: 80, percentage: 100 }],
      },
      {
        user_id: 'user-2',
        user_name: '家庭成员',
        total_expense: 47.5,
        categories: [{ category_name: '购物', category_icon: '🛍️', amount: 47.5, percentage: 100 }],
      },
    ]);
  }

  if (method === 'GET' && path === '/budgets') {
    return json(route, [
      {
        id: 'budget-food',
        user_id: 'user-1',
        category: 'cat-food',
        book_id: 'book-1',
        amount: 1000,
        month: url.searchParams.get('month') ?? '2026-07-01',
        created_at: now,
        updated_at: now,
      },
    ]);
  }
  if (method === 'GET' && path === '/budgets/status') {
    return json(route, {
      totalBudget: 1000,
      totalSpent: 28.5,
      remaining: 971.5,
      overallProgress: 3,
      categories: [
        { category_id: 'cat-food', category_name: '餐饮', category_icon: '🍜', budget: 1000, spent: 28.5, progress: 3, status: 'safe' },
      ],
      alerts: [],
    });
  }
  if (method === 'PUT' && path === '/budgets') {
    const payload = bodyObject(body);
    return json(route, Array.isArray(payload.budgets) ? payload.budgets : []);
  }

  if (method === 'GET' && path === '/templates') {
    return json(route, mockTemplates);
  }
  if (method === 'POST' && path === '/templates') {
    return json(route, { ...mockTemplates[0], id: 'tpl-created', ...bodyObject(body) });
  }
  if (method === 'PUT' && /^\/templates\/[^/]+$/.test(path)) {
    return json(route, { ...mockTemplates[0], ...bodyObject(body) });
  }
  if (method === 'DELETE' && /^\/templates\/[^/]+$/.test(path)) {
    return json(route, null);
  }
  if (method === 'PUT' && path === '/templates/reorder') {
    return json(route, null);
  }

  if (method === 'GET' && path === '/map/members') {
    return json(route, [
      { userId: 'user-1', username: mockUser.username, role: 'owner', color: '#6366f1' },
      { userId: 'user-2', username: '家庭成员', role: 'member', color: '#f59e0b' },
    ]);
  }
  if (method === 'GET' && path.startsWith('/map')) {
    return json(route, []);
  }
  if (method === 'GET' && path === '/reports/annual') {
    return json(route, {
      overview: {
        total_income: 12000,
        total_expense: 127.5,
        balance: 11872.5,
      },
      monthly: [
        { month: 7, income: 12000, expense: 127.5 },
      ],
      top_categories: [
        { category_name: '餐饮', category_icon: '🍜', category_type: 'expense', amount: 28.5, percentage: 22 },
        { category_name: '购物', category_icon: '🛍️', category_type: 'expense', amount: 99, percentage: 78 },
      ],
      records: {
        max_expense: { amount: 99, description: 'E2E购物测试', date: '2026-07-04' },
      },
      book_breakdown: [
        { book_id: 'book-1', book_name: '家庭账本', amount: 127.5, percentage: 100 },
      ],
      member_ranking: [
        { user_id: 'user-1', nickname: mockUser.username },
        { user_id: 'user-2', nickname: '家庭成员' },
      ],
      fun_fact: {
        daily_avg_expense: 18,
      },
    });
  }

  return json(route, method === 'GET' ? [] : null);
}

function filteredTransactions(url: URL) {
  let data = [...mockTransactions];
  const type = url.searchParams.get('type');
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');

  if (type) data = data.filter((item) => item.type === type);
  if (category) data = data.filter((item) => item.category === category);
  if (search) {
    data = data.filter((item) => (
      item.description?.includes(search) || item.brand?.includes(search)
    ));
  }

  return {
    data,
    total: data.length,
    page: Number(url.searchParams.get('page') ?? 1),
    pageSize: Number(url.searchParams.get('pageSize') ?? 20),
  };
}

function bodyObject(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};
}

async function json(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(envelope(data)),
  });
}
