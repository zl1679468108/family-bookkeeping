import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

function createContext() {
  const response = {
    headersSent: false,
    getHeader: () => undefined,
  };

  return {
    switchToHttp: () => ({ getResponse: () => response }),
  } as any;
}

describe('ResponseInterceptor', () => {
  it('wraps payloads and converts response timestamps to Beijing time', async () => {
    const interceptor = new ResponseInterceptor();
    const result = interceptor.intercept(createContext(), {
      handle: () =>
        of({
          message: '读取成功',
          data: {
            created_at: '2026-07-25T00:00:00.000Z',
            items: [{ date: '2026-07-25T01:02:03.004Z' }],
          },
        }),
    } as any);

    await expect(firstValueFrom(result)).resolves.toEqual({
      success: true,
      message: '读取成功',
      data: {
        created_at: '2026-07-25T08:00:00.000+08:00',
        items: [{ date: '2026-07-25T09:02:03.004+08:00' }],
      },
    });
  });

  it('uses the default success message for unwrapped payloads', async () => {
    const interceptor = new ResponseInterceptor();
    const result = interceptor.intercept(createContext(), {
      handle: () => of({ id: 'fixture' }),
    } as any);

    await expect(firstValueFrom(result)).resolves.toEqual({
      success: true,
      message: '请求成功',
      data: { id: 'fixture' },
    });
  });
});
