import { BaseGuildTextChannel, BaseGuildVoiceChannel, NewsChannel } from 'discord.js';
import { BodyParams, Controller, Delete, Get, PathParams, Post, UseBefore } from '@tsed/common';
import { NotFound, Unauthorized } from '@tsed/exceptions';
import { Required } from '@tsed/schema';
import { ChannelType, PermissionsBitField } from 'discord.js';
import { Client, MetadataStorage } from 'discordx';

import { BotOnline, DevAuthenticated } from '@/api/middlewares';
import { generalConfig } from '@/configs';
import { Database } from '@/services';
import { BaseController } from '@/utils/classes';
import { createLazyResolver, getDevs, isDev, isInMaintenance, setMaintenance } from '@/utils/functions';

@Controller('/bot')
@UseBefore(BotOnline, DevAuthenticated)
export class BotController extends BaseController {
  private readonly client = createLazyResolver<Client>(Client);
  private readonly db = createLazyResolver<Database>(Database);

  @Get('/info')
  async info() {
    const c = await this.client.resolve();
    const user: any = c.user?.toJSON();
    if (user) {
      user.iconURL = c.user?.displayAvatarURL();
      user.bannerURL = c.user?.bannerURL();
    }

    return {
      user,
      owner: (await c.users.fetch(generalConfig.ownerId).catch(() => null))?.toJSON(),
    };
  }

  @Get('/commands')
  commands() {
    const commands = MetadataStorage.instance.applicationCommands;
    return commands.map(command => command.toJSON());
  }

  @Get('/guilds')
  async guilds() {
    const body: Record<string, unknown>[] = [];
    const db = await this.db.resolve();

    for (const discordRawGuild of (await this.client.resolve()).guilds.cache.values()) {
      const discordGuild: any = discordRawGuild.toJSON();
      discordGuild.iconURL = discordRawGuild.iconURL();
      discordGuild.bannerURL = discordRawGuild.bannerURL();

      const databaseGuild = await db.prisma.guild.findUnique({
        where: { id: discordGuild.id },
      });

      body.push({
        discord: discordGuild,
        database: databaseGuild,
      });
    }

    return body;
  }

  @Get('/guilds/:id')
  async guild(@PathParams('id') id: string) {
    const c = await this.client.resolve();
    const db = await this.db.resolve();
    const discordRawGuild = await c.guilds.fetch(id).catch(() => null);
    if (!discordRawGuild) throw new NotFound('Guild not found');

    const discordGuild: any = discordRawGuild.toJSON();
    discordGuild.iconURL = discordRawGuild.iconURL();
    discordGuild.bannerURL = discordRawGuild.bannerURL();

    const databaseGuild = await db.prisma.guild.findUnique({
      where: { id: discordGuild.id },
    });

    return {
      discord: discordGuild,
      database: databaseGuild,
    };
  }

  @Delete('/guilds/:id')
  async deleteGuild(@PathParams('id') id: string) {
    const guild = await (await this.client.resolve()).guilds.fetch(id).catch(() => null);
    if (!guild) throw new NotFound('Guild not found');

    await guild.leave();

    return {
      success: true,
      message: 'Guild deleted',
    };
  }

  @Get('/guilds/:id/invite')
  async invite(@PathParams('id') id: string) {
    const c = await this.client.resolve();
    const guild = await c.guilds.fetch(id).catch(() => null);
    if (!guild) throw new NotFound('Guild not found');

    const guildChannels = await guild.channels.fetch();

    let invite: any;
    for (const channel of guildChannels.values()) {
      if (
        channel &&
        guild.members.me
          ?.permissionsIn(channel)
          .has(PermissionsBitField.Flags.CreateInstantInvite) &&
        [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement].includes(
          channel.type
        )
      ) {
        invite = await (
          channel as BaseGuildTextChannel | BaseGuildVoiceChannel | NewsChannel | undefined
        )?.createInvite();
        if (invite) break;
      }
    }

    if (invite) return invite.toJSON();
    else throw new Unauthorized('Missing permission to create an invite in this guild');
  }

  @Get('/users')
  async users() {
    const c = await this.client.resolve();
    const db = await this.db.resolve();
    const users: any[] = [];

    for (const guild of c.guilds.cache.values()) {
      const members = await guild.members.fetch();

      for (const member of members.values()) {
        if (!users.some(user => user.id === member.id)) {
          const discordUser: any = member.user.toJSON();
          discordUser.iconURL = member.user.displayAvatarURL();
          discordUser.bannerURL = member.user.bannerURL();

          const databaseUser = await db.prisma.user.findUnique({
            where: { id: discordUser.id },
          });

          users.push({
            discord: discordUser,
            database: databaseUser,
          });
        }
      }
    }

    return users;
  }

  @Get('/users/:id')
  async user(@PathParams('id') id: string) {
    const c = await this.client.resolve();
    const db = await this.db.resolve();
    const discordRawUser = await c.users.fetch(id).catch(() => null);
    if (!discordRawUser) throw new NotFound('User not found');

    const discordUser: any = discordRawUser.toJSON();
    discordUser.iconURL = discordRawUser.displayAvatarURL();
    discordUser.bannerURL = discordRawUser.bannerURL();

    const databaseUser = await db.prisma.user.findUnique({
      where: { id: discordUser.id },
    });

    return {
      discord: discordUser,
      database: databaseUser,
    };
  }

  @Get('/users/cached')
  async cachedUsers() {
    const c = await this.client.resolve();
    return c.users.cache.map(user => user.toJSON());
  }

  @Get('/maintenance')
  async maintenance() {
    return {
      maintenance: await isInMaintenance(),
    };
  }

  @Post('/maintenance')
  async setMaintenance(@Required() @BodyParams('maintenance') maintenance: boolean) {
    await setMaintenance(maintenance);

    return {
      maintenance,
    };
  }

  @Get('/devs')
  devs() {
    return getDevs();
  }

  @Get('/devs/:id')
  dev(@PathParams('id') id: string) {
    return isDev(id);
  }
}
