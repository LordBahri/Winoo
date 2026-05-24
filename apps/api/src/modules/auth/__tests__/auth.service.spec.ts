import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ErrorCodes } from '../../../common/exceptions/error-codes';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  passwordHash: '$2b$12$mockhash',
  role: 'PET_OWNER',
  isBanned: false,
  lastLoginAt: null,
};

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  passwordReset: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((ops) => Promise.all(ops)),
};

const jwtMock = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  decode: jest.fn(),
};

const notifMock = {
  sendEmailVerification: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
};

const redisMock = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
        { provide: NotificationsService, useValue: notifMock },
        { provide: 'default_IORedisModuleConnectionToken', useValue: redisMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('throws CONFLICT when email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'Password1', name: 'Test' }),
      ).rejects.toMatchObject({ code: ErrorCodes.EMAIL_ALREADY_EXISTS });
    });

    it('creates user and returns access token', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.create.mockResolvedValueOnce(mockUser);
      prismaMock.refreshToken.create.mockResolvedValueOnce({ id: 'rt-1' });

      const result = await service.register({
        email: 'new@example.com',
        password: 'Password1',
        name: 'New User',
      });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(notifMock.sendEmailVerification).toHaveBeenCalledTimes(1);
    });
  });

  describe('login()', () => {
    it('throws UNAUTHORIZED for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'no@example.com', password: 'wrong' }),
      ).rejects.toMatchObject({ code: ErrorCodes.INVALID_CREDENTIALS });
    });

    it('throws FORBIDDEN for banned user', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ ...mockUser, isBanned: true });

      await expect(
        service.login({ email: 'test@example.com', password: 'Password1' }),
      ).rejects.toMatchObject({ code: ErrorCodes.ACCOUNT_BANNED });
    });

    it('throws UNAUTHORIZED for wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toMatchObject({ code: ErrorCodes.INVALID_CREDENTIALS });
    });

    it('returns token pair on valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      prismaMock.user.update.mockResolvedValueOnce(mockUser);
      prismaMock.refreshToken.create.mockResolvedValueOnce({ id: 'rt-1' });

      const result = await service.login({ email: 'test@example.com', password: 'Password1' });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('logout()', () => {
    it('revokes all refresh tokens for the user', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValueOnce({ count: 2 });

      await service.logout('user-uuid-1');

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });
});
