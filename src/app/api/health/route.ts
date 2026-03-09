import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface ServiceHealth {
  status: 'healthy' | 'down';
  responseTime?: number;
  error?: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    api: ServiceHealth;
    database: ServiceHealth;
  };
}

async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    logger.error('Database health check failed', error);
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET() {
  try {
    const database = await checkDatabase();
    const overallStatus = database.status === 'healthy' ? 'healthy' : 'down';

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        api: { status: 'healthy' },
        database,
      },
    };

    return NextResponse.json(response, {
      status: overallStatus === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    logger.error('Health check failed', error);

    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        services: {
          api: { status: 'down', error: 'Health check failed' },
          database: { status: 'down' },
        },
      } as HealthCheckResponse,
      { status: 503 }
    );
  }
}
