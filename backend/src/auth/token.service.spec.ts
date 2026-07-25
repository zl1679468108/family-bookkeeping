import { TokenService } from './token.service';

describe('TokenService', () => {
  const service = new TokenService();

  it('generates cryptographically sized access and refresh tokens', () => {
    const accessToken = service.generateAccessToken();
    const refreshToken = service.generateRefreshToken();

    expect(accessToken).toMatch(/^[0-9a-f]{64}$/);
    expect(refreshToken).toMatch(/^[0-9a-f]{96}$/);
    expect(refreshToken).not.toBe(accessToken);
  });

  it('keeps the legacy session token alias on the access-token contract', () => {
    expect(service.generateSessionToken()).toMatch(/^[0-9a-f]{64}$/);
    expect(service.getSessionExpiresAt()).toEqual(expect.any(String));
  });

  it('hashes tokens deterministically without exposing the original value', () => {
    const token = 'access-token-fixture';
    const hash = service.hashToken(token);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(service.hashToken(token));
    expect(hash).not.toContain(token);
  });

  it('sets access and refresh expiry windows independently', () => {
    const now = Date.now();
    const accessExpiry = Date.parse(service.getAccessExpiresAt());
    const refreshExpiry = Date.parse(service.getRefreshExpiresAt());

    expect(accessExpiry).toBeGreaterThanOrEqual(now + 2 * 60 * 60 * 1000 - 1000);
    expect(accessExpiry).toBeLessThanOrEqual(now + 2 * 60 * 60 * 1000 + 1000);
    expect(refreshExpiry).toBeGreaterThanOrEqual(now + 14 * 24 * 60 * 60 * 1000 - 1000);
    expect(refreshExpiry).toBeLessThanOrEqual(now + 14 * 24 * 60 * 60 * 1000 + 1000);
    expect(refreshExpiry).toBeGreaterThan(accessExpiry);
  });
});
