import { Controller, Get, QueryParams, UseBefore } from '@tsed/common';
import { DevAuthenticated } from '@/api/middlewares';
import { Stats } from '@/services';
import { BaseController } from '@/utils/classes';
import { createLazyResolver } from '@/utils/functions';

@Controller('/stats')
@UseBefore(DevAuthenticated)
export class StatsController extends BaseController {
  private readonly stats = createLazyResolver<Stats>(Stats);

  @Get('/totals')
  async info() {
    const statsController = await this.stats.resolve();
    const totalStats = await statsController.getTotalStats();

    return {
      stats: {
        totalUsers: totalStats.TOTAL_USERS,
        totalGuilds: totalStats.TOTAL_GUILDS,
        totalActiveUsers: totalStats.TOTAL_ACTIVE_USERS,
        totalCommands: totalStats.TOTAL_COMMANDS,
      },
    };
  }

  @Get('/interaction/last')
  async lastInteraction() {
    return (await this.stats.resolve()).getLastInteraction();
  }

  @Get('/guilds/last')
  async lastGuildAdded() {
    return (await this.stats.resolve()).getLastGuildAdded();
  }

  @Get('/commands/usage')
  async commandsUsage(@QueryParams('numberOfDays') numberOfDays: number = 7) {
    const s = await this.stats.resolve();
    const commandsUsage = {
      slashCommands: await s.countStatsPerDays(
        'CHAT_INPUT_COMMAND_INTERACTION',
        numberOfDays
      ),
      simpleCommands: await s.countStatsPerDays('SIMPLE_COMMAND_MESSAGE', numberOfDays),
      userContextMenus: await s.countStatsPerDays(
        'USER_CONTEXT_MENU_COMMAND_INTERACTION',
        numberOfDays
      ),
      messageContextMenus: await s.countStatsPerDays(
        'MESSAGE_CONTEXT_MENU_COMMAND_INTERACTION',
        numberOfDays
      ),
    };

    const body = [];
    for (let i = 0; i < numberOfDays; i++) {
      body.push({
        date: commandsUsage.slashCommands[i].date,
        slashCommands: commandsUsage.slashCommands[i].count,
        simpleCommands: commandsUsage.simpleCommands[i].count,
        contextMenus:
          commandsUsage.userContextMenus[i].count + commandsUsage.messageContextMenus[i].count,
      });
    }

    return body;
  }

  @Get('/commands/top')
  async topCommands() {
    return (await this.stats.resolve()).getTopCommands();
  }

  @Get('/users/activity')
  async usersActivity() {
    return (await this.stats.resolve()).getUsersActivity();
  }

  @Get('/guilds/top')
  async topGuilds() {
    return (await this.stats.resolve()).getTopGuilds();
  }

  @Get('/usersAndGuilds')
  async usersAndGuilds(@QueryParams('numberOfDays') numberOfDays: number = 7) {
    const s = await this.stats.resolve();
    return {
      activeUsers: await s.countStatsPerDays('TOTAL_ACTIVE_USERS', numberOfDays),
      users: await s.countStatsPerDays('TOTAL_USERS', numberOfDays),
      guilds: await s.countStatsPerDays('TOTAL_GUILDS', numberOfDays),
    };
  }
}
