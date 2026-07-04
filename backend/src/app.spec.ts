import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';

describe('App (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let bookId: string;
  let categoryId: string;
  let transactionId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== Auth ====================
  describe('Auth', () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Test123456';

    it('POST /api/auth/captcha - 获取验证码', () => {
      return request(app.getHttpServer())
        .get('/api/auth/captcha')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.captchaId).toBeDefined();
          expect(res.body.data.svg).toBeDefined();
        });
    });

    it('POST /api/auth/register - 注册用户', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          username: '测试用户',
          captchaId: 'dummy',
          captchaCode: 'dummy',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.user.email).toBe(testEmail);
          expect(res.body.data.token).toBeDefined();
          authToken = res.body.data.token;
          userId = res.body.data.user.id;
        });
    });

    it('POST /api/auth/login - 登录', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
          captchaId: 'dummy',
          captchaCode: 'dummy',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.token).toBeDefined();
          authToken = res.body.data.token;
        });
    });

    it('GET /api/auth/profile - 获取用户信息', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe(testEmail);
          expect(res.body.data.username).toBe('测试用户');
        });
    });
  });

  // ==================== Categories ====================
  describe('Categories', () => {
    it('GET /api/categories - 获取分类列表', () => {
      return request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          if (res.body.data.length > 0) {
            categoryId = res.body.data[0].id;
          }
        });
    });

    it('POST /api/categories - 创建分类', () => {
      return request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '测试分类',
          icon: '🧪',
          type: 'expense',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('测试分类');
          categoryId = res.body.data.id;
        });
    });

    it('PUT /api/categories/:id - 更新分类', () => {
      return request(app.getHttpServer())
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '测试分类已更新' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('测试分类已更新');
        });
    });
  });

  // ==================== Books ====================
  describe('Books', () => {
    it('POST /api/books - 创建账本', () => {
      return request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '测试账本',
          description: '用于自动化测试的账本',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('测试账本');
          bookId = res.body.data.id;
        });
    });

    it('GET /api/books - 获取账本列表', () => {
      return request(app.getHttpServer())
        .get('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('GET /api/books/:id - 获取账本详情', () => {
      return request(app.getHttpServer())
        .get(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('测试账本');
        });
    });
  });

  // ==================== Transactions ====================
  describe('Transactions', () => {
    it('POST /api/transactions - 创建交易', () => {
      return request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100.50,
          type: 'expense',
          category: categoryId,
          description: '测试支出',
          date: new Date().toISOString().split('T')[0],
          book_id: bookId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.amount).toBe('100.50');
          transactionId = res.body.data.id;
        });
    });

    it('GET /api/transactions - 获取交易列表', () => {
      return request(app.getHttpServer())
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.data.length).toBeGreaterThan(0);
        });
    });

    it('GET /api/transactions/:id - 获取交易详情', () => {
      return request(app.getHttpServer())
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.description).toBe('测试支出');
        });
    });

    it('PUT /api/transactions/:id - 更新交易', () => {
      return request(app.getHttpServer())
        .put(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: '测试支出已更新' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.description).toBe('测试支出已更新');
        });
    });
  });

  // ==================== Statistics ====================
  describe('Statistics', () => {
    it('GET /api/statistics/summary - 获取收支概览', () => {
      return request(app.getHttpServer())
        .get('/api/statistics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });

    it('GET /api/statistics/monthly-trend - 获取月度趋势', () => {
      return request(app.getHttpServer())
        .get('/api/statistics/monthly-trend')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('GET /api/statistics/category-breakdown - 获取分类占比', () => {
      return request(app.getHttpServer())
        .get('/api/statistics/category-breakdown')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  // ==================== Budgets ====================
  describe('Budgets', () => {
    it('PUT /api/budgets - 批量保存预算', () => {
      const month = new Date().toISOString().slice(0, 7) + '-01';
      return request(app.getHttpServer())
        .put('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          budgets: [
            { category: categoryId, amount: 1000, month },
          ],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('GET /api/budgets - 获取预算列表', () => {
      const month = new Date().toISOString().slice(0, 7) + '-01';
      return request(app.getHttpServer())
        .get(`/api/budgets?month=${month}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('GET /api/budgets/status - 获取预算执行状态', () => {
      const month = new Date().toISOString().slice(0, 7) + '-01';
      return request(app.getHttpServer())
        .get(`/api/budgets/status?month=${month}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  // ==================== Templates ====================
  describe('Templates', () => {
    let templateId: string;

    it('POST /api/templates - 创建模板', () => {
      return request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '午餐',
          type: 'expense',
          amount: 30,
          category_id: categoryId,
          note: '日常午餐',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('午餐');
          templateId = res.body.data.id;
        });
    });

    it('GET /api/templates - 获取模板列表', () => {
      return request(app.getHttpServer())
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('POST /api/templates/:id/execute - 执行模板', () => {
      return request(app.getHttpServer())
        .post(`/api/templates/${templateId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  // ==================== Cleanup ====================
  describe('Cleanup', () => {
    it('DELETE /api/transactions/:id - 删除交易', () => {
      return request(app.getHttpServer())
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('DELETE /api/categories/:id - 删除分类', () => {
      return request(app.getHttpServer())
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('DELETE /api/books/:id - 删除账本', () => {
      return request(app.getHttpServer())
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });
});
