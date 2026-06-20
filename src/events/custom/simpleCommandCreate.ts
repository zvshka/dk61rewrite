import { ArgsOf, Client } from 'discordx';
import { Database, EventManager, Logger, Stats } from '@/services';

import { Guard, SimpleCommandMessage } from 'discordx';
import { Discord, Injectable, On, OnCustom } from '@/decorators';
import { Maintenance } from '@/guards';
import { isNullOrUndefined, syncUser } from '@/utils/functions';

@Discord()
@Injectable()
export default class SimpleCommandCreateEvent {
  constructor(
    private stats: Stats,
    private logger: Logger,
    private db: Database,
    private eventManager: EventManager
  ) {}

  // =============================
  // ========= Handler ===========
  // =============================

  @OnCustom('simpleCommandCreate')
  async simpleCommandCreateHandler(command: SimpleCommandMessage) {
    // insert user in db if not exists
    await syncUser(command.message.author);

    const lastInteract = new Date();

    // update last interaction time of both user and guild
    await this.db.prisma.user.update({
      where: {
        id: command.message.author.id,
      },
      data: {
        lastInteract,
      },
    });

    if (!isNullOrUndefined(command.message.guild)) {
      await this.db.prisma.guild.upsert({
        where: {
          id: command.message.guild.id,
        },
        create: {
          id: command.message.guild.id,
          lastInteract
        },
        update: {
          lastInteract
        }
      });
    }

    await this.stats.registerSimpleCommand(command);
    this.logger.logInteraction(command);
  }

  // =============================
  // ========== Emitter ==========
  // =============================

  @On('messageCreate')
  @Guard(Maintenance)
  async simpleCommandCreateEmitter([message]: ArgsOf<'messageCreate'>, client: Client) {
    const command = await client.parseCommand(message, false);

    if (!isNullOrUndefined(command) && command instanceof SimpleCommandMessage) {
      /**
       * @param {SimpleCommandMessage} command
       */
      await this.eventManager.emit('simpleCommandCreate', command);
    }
  }
}
