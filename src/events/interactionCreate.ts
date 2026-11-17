import { ArgsOf, Client } from 'discordx';
import { Database, Logger, Stats } from '@/services';

import { CommandInteraction } from 'discord.js';
import { generalConfig } from '@/configs';
import { Discord, Guard, Injectable, On, skipDeferCommands } from '@/decorators';
import { Maintenance } from '@/guards';
import { isNullOrUndefined, syncUser } from '@/utils/functions';

@Discord()
@Injectable()
export default class InteractionCreateEvent {
  constructor(
    private stats: Stats,
    private logger: Logger,
    private db: Database
  ) {}

  @On('interactionCreate')
  @Guard(Maintenance)
  async interactionCreateHandler([interaction]: ArgsOf<'interactionCreate'>, client: Client) {
    // defer the reply
    if (generalConfig.automaticDeferring && interaction instanceof CommandInteraction) {
      const commandName = interaction.commandName;
      if (!skipDeferCommands.has(commandName) && !interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }
    }

    // insert user in db if not exists
    await syncUser(interaction.user);

    // update last interaction time of both user and guild
    await this.db.prisma.user.update({
      where: {
        id: interaction.user.id,
      },
      data: {
        lastInteract: new Date(),
      },
    });

    if (!isNullOrUndefined(interaction.guildId)) {
      await this.db.prisma.guild.upsert({
        where: {
          id: interaction.guildId,
        },
        create: {
          id: interaction.guildId,
          lastInteract: new Date(),
        },
        update: {
          lastInteract: new Date(),
        }
      });
    }

    // register logs and stats
    await this.stats.registerInteraction(interaction as AllInteractions);
    this.logger.logInteraction(interaction as AllInteractions);

    await client.executeInteraction(interaction);
  }
}
