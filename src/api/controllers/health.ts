import { Controller, Get, UseBefore } from '@tsed/common';
import { Client } from 'discordx';

import { DevAuthenticated } from '@/api/middlewares';
import { Database, Logger, Stats } from '@/services';
import { BaseController } from '@/utils/classes';
import { createLazyResolver } from '@/utils/functions';
import { isInMaintenance } from '@/utils/functions';

@Controller('/health')
export class HealthController extends BaseController {
  private readonly client = createLazyResolver<Client>(Client);
  private readonly db = createLazyResolver<Database>(Database);
  private readonly stats = createLazyResolver<Stats>(Stats);
  private readonly logger = createLazyResolver<Logger>(Logger);

  @Get('/check')
  async healthcheck() {
    const c = await this.client.resolve();
    return {
      online: c.user?.presence.status !== 'offline',
      uptime: c.uptime,
      lastStartup: await (await this.db.resolve()).dataStore.get('lastStartup'),
    };
  }

  @Get('/latency')
  async latency() {
    return (await this.stats.resolve()).getLatency();
  }

  @Get('/usage')
  async usage() {
    return (await this.stats.resolve()).getPidUsage();
  }

  @Get('/host')
  async host() {
    return (await this.stats.resolve()).getHostUsage();
  }

  @Get('/monitoring')
  @UseBefore(DevAuthenticated)
  async monitoring() {
    const stats = await this.stats.resolve();
    const c = await this.client.resolve();
    const db = await this.db.resolve();
    return {
      botStatus: {
        online: true,
        uptime: c.uptime,
        maintenance: await isInMaintenance(),
      },
      host: await stats.getHostUsage(),
      pid: await stats.getPidUsage(),
      latency: stats.getLatency(),
    };
  }

  @Get('/logs')
  @UseBefore(DevAuthenticated)
  async logs() {
    return (await this.logger.resolve()).getLastLogs();
  }
}
