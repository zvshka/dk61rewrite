import { PrismaPg } from '@prisma/adapter-pg'
import Enmap from 'enmap'
import { delay, inject } from 'tsyringe'

import { Service } from '@/decorators'
import { env } from '@/env'
import { Logger, Store } from '@/services'

import { PrismaClient } from '../generated/prisma/client'

@Service()
export class Database {

	private _prisma: PrismaClient
	private readonly _dataStore: Enmap

	constructor(
		@inject(delay(() => Store)) private store: Store,
		@inject(delay(() => Logger)) private logger: Logger
	) {
		// Инициализация Prisma Client с настройками логгирования при необходимости
		const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
		this._prisma = new PrismaClient({
			adapter,
			// log: env.NODE_ENV === 'development'
			// 	? ['query', 'error', 'warn']
			// 	: ['error'],
		})

		this._dataStore = new Enmap({
			name: 'dataStore',
			dataDir: './database',
		})
	}

	/**
	 * Инициализация подключения к БД
	 * Миграции управляются ВНЕ приложения (prisma migrate deploy)
	 */
	async initialize(): Promise<void> {
		try {
			// Явное подключение (опционально, Prisma подключается лениво)
			await this._prisma.$connect()

			// Проверка состояния после перезагрузки (для бизнес-логики приложения)
			if (!this.store.get('botHasBeenReloaded')) {
				this.logger.log('Database connected successfully', 'info')
			}
		} catch (error) {
			this.logger.log(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', true)
			throw error
		}
	}

	/**
	 * Пересоздание подключения после восстановления из бэкапа
	 */
	async refreshConnection(): Promise<void> {
		try {
			await this._prisma.$disconnect()
		} catch {
			// Игнорируем ошибки отключения
		}

		// Пересоздаем клиент с теми же настройками
		const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
		this._prisma = new PrismaClient({
			adapter,
			log: env.NODE_ENV === 'development'
				? ['query', 'error', 'warn']
				: ['error'],
		})

		await this._prisma.$connect()
		this.logger.log('Database connection refreshed after restore', 'info')
	}

	get prisma(): PrismaClient {
		return this._prisma
	}

	get dataStore(): Enmap {
		return this._dataStore
	}

	/**
	 * Создание резервной копии SQLite БД
	 * @param snapshotName Имя файла снапшота (без расширения)
	 */
	// @Schedule('0 0 * * *')
	// async backup(snapshotName?: string): Promise<boolean> {
	// 	// Проверка включения бэкапов в конфиге
	// 	if (!databaseConfig.backup.enabled && !snapshotName) {
	// 		return false
	// 	}
	//
	// 	// Только для SQLite
	// 	if (!this.isSQLiteDatabase()) {
	// 		this.logger.log('Backup only supported for SQLite databases', 'warn')
	//
	// 		return false
	// 	}
	//
	// 	const backupPath = databaseConfig.backup.path
	// 	if (!backupPath) {
	// 		this.logger.log('Backup path not configured', 'error', true)
	//
	// 		return false
	// 	}
	//
	// 	// Формируем имя файла
	// 	const finalSnapshotName = snapshotName || `snapshot-${formatDate(new Date(), 'onlyDateFileName')}`
	// 	const objectsPath = `${backupPath}objects/` as `${string}/`
	// 	const dbPath = this.getDatabasePath()
	//
	// 	try {
	// 		// Гарантируем, что папка для бэкапов существует
	// 		if (!fs.existsSync(backupPath)) {
	// 			fs.mkdirSync(backupPath, { recursive: true })
	// 		}
	// 		if (!fs.existsSync(objectsPath)) {
	// 			fs.mkdirSync(objectsPath, { recursive: true })
	// 		}
	//
	// 		await backup(dbPath, `${finalSnapshotName}.txt`, objectsPath)
	// 		this.logger.log(`Backup created successfully: ${finalSnapshotName}`, 'info')
	//
	// 		return true
	// 	} catch (e) {
	// 		const errorMessage = e instanceof Error ? e.message : String(e)
	// 		this.logger.log(`Backup failed: ${errorMessage}`, 'error', true)
	//
	// 		return false
	// 	}
	// }

	/**
	 * Восстановление БД из снапшота
	 * @param snapshotName Имя файла снапшота (с расширением .txt)
	 */
	// async restore(snapshotName: string): Promise<boolean> {
	// 	if (!this.isSQLiteDatabase()) {
	// 		this.logger.log('Restore only supported for SQLite databases', 'error')
	//
	// 		return false
	// 	}
	//
	// 	const backupPath = databaseConfig.backup.path
	// 	if (!backupPath) {
	// 		this.logger.log('Backup path not configured', 'error', true)
	//
	// 		return false
	// 	}
	//
	// 	const dbPath = this.getDatabasePath()
	// 	const snapshotPath = `${backupPath}${snapshotName}`
	//
	// 	// Проверка существования файла
	// 	if (!fs.existsSync(snapshotPath)) {
	// 		this.logger.log(`Snapshot file not found: ${snapshotPath}`, 'error', true)
	//
	// 		return false
	// 	}
	//
	// 	try {
	// 		// Отключаем текущее подключение перед восстановлением
	// 		await this._prisma.$disconnect()
	//
	// 		// Восстанавливаем файл БД
	// 		await restore(dbPath, snapshotPath)
	//
	// 		// Пересоздаем подключение
	// 		await this.refreshConnection()
	//
	// 		this.logger.log(`Database restored successfully from ${snapshotName}`, 'info')
	//
	// 		return true
	// 	} catch (error) {
	// 		const errorMessage = error instanceof Error ? error.message : String(error)
	// 		this.logger.log(`Restore failed: ${errorMessage}`, 'error', true)
	//
	// 		// Пытаемся восстановить исходное подключение
	// 		try {
	// 			await this.refreshConnection()
	// 		} catch (reconnectError) {
	// 			this.logger.log(`Failed to reconnect after restore error: ${reconnectError instanceof Error ? reconnectError.message : 'Unknown'}`, 'error')
	// 		}
	//
	// 		return false
	// 	}
	// }

	/**
	 * Получение списка доступных бэкапов
	 */
	// getBackupList(): string[] | null {
	// 	const backupPath = databaseConfig.backup.path
	// 	if (!backupPath || !fs.existsSync(backupPath)) {
	// 		this.logger.log('Backup path invalid or not found', 'error')
	//
	// 		return null
	// 	}
	//
	// 	try {
	// 		const files = fs.readdirSync(backupPath)
	//
	// 		return files
	// 			.filter(file => file.startsWith('snapshot') && file.endsWith('.txt'))
	// 			.sort() // Сортируем по имени (хронологически)
	// 	} catch (error) {
	// 		this.logger.log(`Failed to read backup directory: ${error instanceof Error ? error.message : 'Unknown'}`, 'error')
	//
	// 		return null
	// 	}
	// }

	/**
	 * Получение размеров БД и бэкапов
	 */
	// getSize(): DatabaseSize {
	// 	const size: DatabaseSize = { db: null, backups: null }
	//
	// 	if (this.isSQLiteDatabase()) {
	// 		try {
	// 			const dbPath = this.getDatabasePath()
	// 			if (fs.existsSync(dbPath)) {
	// 				size.db = fs.statSync(dbPath).size
	// 			}
	// 		} catch (error) {
	// 			this.logger.log(`Failed to get DB size: ${error instanceof Error ? error.message : 'Unknown'}`, 'warn')
	// 		}
	// 	}
	//
	// 	const backupPath = databaseConfig.backup.path
	// 	if (backupPath && fs.existsSync(backupPath)) {
	// 		try {
	// 			size.backups = fastFolderSizeSync(backupPath) || null
	// 		} catch (error) {
	// 			this.logger.log(`Failed to calculate backup size: ${error instanceof Error ? error.message : 'Unknown'}`, 'warn')
	// 		}
	// 	}
	//
	// 	return size
	// }

	/**
	 * Проверка, является ли текущая БД SQLite
	 * Определяется по конфигурации приложения
	 */
	// isSQLiteDatabase(): boolean {
	// 	// Предполагаем, что тип БД указан в конфигурации приложения
	// 	// Альтернатива: проверять строку подключения из env.DATABASE_URL
	// 	return env.DATABASE_PROVIDER === 'sqlite'
	// 		|| (env.DATABASE_URL && env.DATABASE_URL.startsWith('file:'))
	// }

	/**
	 * Получение абсолютного пути к файлу SQLite БД
	 * @throws Error если путь не может быть определен
	 */
	// private getDatabasePath(): string {
	// 	if (!this.isSQLiteDatabase()) {
	// 		throw new Error('Database is not SQLite')
	// 	}
	//
	// 	// Приоритет: явный путь из конфига > извлечение из DATABASE_URL
	// 	if (databaseConfig.sqlitePath) {
	// 		return databaseConfig.sqlitePath
	// 	}
	//
	// 	if (env.DATABASE_URL && env.DATABASE_URL.startsWith('file:')) {
	// 		// Извлекаем путь из строки подключения Prisma (file:./dev.db -> ./dev.db)
	// 		return env.DATABASE_URL.substring(5)
	// 	}
	//
	// 	throw new Error('Cannot determine SQLite database path. Configure databaseConfig.sqlitePath or DATABASE_URL')
	// }

	/**
	 * Корректное завершение работы
	 */
	async disconnect(): Promise<void> {
		try {
			await this._prisma.$disconnect()
		} catch (error) {
			this.logger.log(`Error during database disconnect: ${error instanceof Error ? error.message : 'Unknown'}`, 'warn')
		}
	}

}
