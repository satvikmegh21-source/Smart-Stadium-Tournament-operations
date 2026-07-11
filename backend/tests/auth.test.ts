import { hashPassword, verifyPassword } from '../src/utils/hash.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../src/utils/jwt.js';

describe('Cryptography and Auth Session Helpers', () => {
  it('should hash and verify passwords successfully using Argon2', async () => {
    const raw = 'StadiumOpsP@ss123';
    const hash = await hashPassword(raw);
    expect(hash).toBeDefined();
    expect(hash).not.toEqual(raw);

    const match = await verifyPassword(raw, hash);
    expect(match).toBe(true);

    const invalid = await verifyPassword('wrongpass', hash);
    expect(invalid).toBe(false);
  });

  it('should sign and verify session tokens successfully', () => {
    const payload = { userId: 'usr_test_123', email: 'test@stadium.com', role: 'SUPER_ADMIN' };
    const access = generateAccessToken(payload);
    expect(access).toBeDefined();

    const refresh = generateRefreshToken(payload);
    expect(refresh).toBeDefined();

    const verified = verifyRefreshToken(refresh);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe(payload.userId);
  });
});
