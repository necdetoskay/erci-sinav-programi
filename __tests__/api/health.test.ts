import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';

// Prisma mock
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $connect: jest.fn().mockResolvedValue(true),
    $disconnect: jest.fn().mockResolvedValue(true),
  },
}));

describe('Health API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 status code with health information', async () => {
    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('database');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('environment');
    
    expect(data.status).toBe('ok');
    expect(typeof data.timestamp).toBe('string');
    expect(typeof data.uptime).toBe('number');
  });

  it('should include database status as connected when database connection succeeds', async () => {
    // Arrange
    const { prisma } = require('@/lib/prisma');
    prisma.$connect.mockResolvedValueOnce(true);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.database).toBe('connected');
    expect(prisma.$connect).toHaveBeenCalledTimes(1);
    expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('should include database status as error when database connection fails', async () => {
    // Arrange
    const { prisma } = require('@/lib/prisma');
    prisma.$connect.mockRejectedValueOnce(new Error('Connection failed'));

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.database).toBe('error');
    expect(prisma.$connect).toHaveBeenCalledTimes(1);
    expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('should still return 200 status code even when database connection fails', async () => {
    // Arrange
    const { prisma } = require('@/lib/prisma');
    prisma.$connect.mockRejectedValueOnce(new Error('Connection failed'));

    // Act
    const response = await GET();

    // Assert
    expect(response.status).toBe(200);
  });

  it('should include the correct environment', async () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.environment).toBe('test');

    // Cleanup
    process.env.NODE_ENV = originalEnv;
  });

  it('should default to development environment if NODE_ENV is not set', async () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = undefined;

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(data.environment).toBe('development');

    // Cleanup
    process.env.NODE_ENV = originalEnv;
  });
});
