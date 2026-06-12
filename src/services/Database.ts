import { PrismaPg } from '@prisma/adapter-pg';
import Enmap from 'enmap';
import { delay, inject } from 'tsyringe';

import { Service } from '@/decorators';
import { env } from '@/env';
import { Logger, Store } from '@/services';

import { PrismaClient } from '../generated/prisma/client';

@Service()
export class Database {
  private _prisma: PrismaClient;
  private readonly _dataStore: Enmap;

  constructor(
    @inject(delay(() => Store)) private store: Store,
    @inject(delay(() => Logger)) private logger: Logger
  ) {
    // Инициализация Prisma Client с настройками логгирования при необходимости
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
    this._prisma = new PrismaClient({
      adapter,
      // log: env.NODE_ENV === 'development'
      // 	? ['query', 'error', 'warn']
      // 	: ['error'],
    });

    this._dataStore = new Enmap({
      name: 'dataStore',
      dataDir: './database',
    });
  }

  /**
   * Инициализация подключения к БД
   * Миграции управляются ВНЕ приложения (prisma migrate deploy)
   */
  async initialize(): Promise<void> {
    try {
      // Явное подключение (опционально, Prisma подключается лениво)
      await this._prisma.$connect();

      // Проверка состояния после перезагрузки (для бизнес-логики приложения)
      if (!this.store.get('botHasBeenReloaded')) {
        this.logger.log('Database connected successfully', 'info');
      }
    } catch (error) {
      this.logger.log(
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error',
        true
      );
      throw error;
    }
  }

  /**
   * Пересоздание подключения после восстановления из бэкапа
   */
  async refreshConnection(): Promise<void> {
    try {
      await this._prisma.$disconnect();
    } catch {
      // Игнорируем ошибки отключения
    }

    // Пересоздаем клиент с теми же настройками
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
    this._prisma = new PrismaClient({
      adapter,
      log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    await this._prisma.$connect();
    this.logger.log('Database connection refreshed after restore', 'info');
  }

  get prisma(): PrismaClient {
    return this._prisma;
  }

 get dataStore(): Enmap {
    return this._dataStore;
  }

  /**
   * Корректное завершение работы
   */
  async disconnect(): Promise<void> {
    try {
      await this._prisma.$disconnect();
    } catch (error) {
      this.logger.log(
        `Error during database disconnect: ${error instanceof Error ? error.message : 'Unknown'}`,
        'warn'
      );
    }
  }
}
