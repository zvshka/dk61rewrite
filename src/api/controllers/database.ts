import { Controller, Get, UseBefore } from '@tsed/common';
import { DevAuthenticated } from '@/api/middlewares';
import { BaseController } from '@/utils/classes';

@Controller('/database')
@UseBefore(DevAuthenticated)
export class DatabaseController extends BaseController {
  // TODO: Реализовать бэкап/восстановление для PostgreSQL
  // Бэкап через pg_dump требует настройки прав доступа к серверу БД
}
