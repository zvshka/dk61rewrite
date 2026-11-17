import {
  ApplicationCommandOptionType,
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  GuildMember,
  PermissionFlagsBits,
  User,
} from 'discord.js';
import { Category } from '@discordx/utilities';

import { Discord, Injectable, Slash, SlashGroup, SlashOption } from '@/decorators';
import { Guard, GuildOnly, UserPermissions } from '@/guards';
import { getLocaleFromInteraction, L } from '@/i18n';
import {
  MAX_NAME_LENGTH,
  MAX_USER_LIMIT,
  MIN_USER_LIMIT,
  TempVoiceService,
  VoiceRoom,
  VoiceSettings,
} from '@/services';
import { isNullOrUndefined, isNullOrWhitespace } from '@/utils/functions';

async function respond(
  interaction: ChatInputCommandInteraction,
  content: string
): Promise<void> {
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp({ content, flags: ['Ephemeral'] }).catch(() => null);
  } else {
    await interaction.reply({ content, flags: ['Ephemeral'] }).catch(() => null);
  }
}

@Discord()
@Injectable()
@Category('General')
@SlashGroup({ name: 'voice', localizationSource: 'COMMANDS.VOICE' })
export default class VoiceCommand {
  constructor(private voice: TempVoiceService) {}

  // =============================
  // ====== настройка сервера ====
  // =============================

  @SlashGroup('voice')
  @Slash({ name: 'setup', localizationSource: 'COMMANDS.VOICE.SETUP' })
  @Guard(UserPermissions(['Administrator']), GuildOnly)
  async setup(
    @SlashOption({
      name: 'hub',
      localizationSource: 'COMMANDS.VOICE.OPTIONS.HUB',
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildVoice],
      required: false,
    })
    hub: Channel | undefined,
    @SlashOption({
      name: 'category',
      localizationSource: 'COMMANDS.VOICE.OPTIONS.CATEGORY',
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildCategory],
      required: false,
    })
    category: Channel | undefined,
    @SlashOption({
      name: 'template',
      localizationSource: 'COMMANDS.VOICE.OPTIONS.TEMPLATE',
      type: ApplicationCommandOptionType.String,
      required: false,
      maxLength: MAX_NAME_LENGTH,
    })
    template: string | undefined,
    @SlashOption({
      name: 'default_limit',
      localizationSource: 'COMMANDS.VOICE.OPTIONS.DEFAULT_LIMIT',
      type: ApplicationCommandOptionType.Integer,
      required: false,
      minValue: MIN_USER_LIMIT,
      maxValue: MAX_USER_LIMIT,
    })
    defaultLimit: number | undefined,
    interaction: ChatInputCommandInteraction
  ) {
    const localize = L[getLocaleFromInteraction(interaction)];
    const guildId = interaction.guildId;
    if (isNullOrWhitespace(guildId)) return;

    const missing = interaction.guild?.members.me?.permissions.missing([
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.MoveMembers,
    ]);

    if (!isNullOrUndefined(missing) && missing.length > 0) {
      await respond(
        interaction,
        localize.COMMANDS.VOICE.ERRORS.MISSING_PERMISSIONS({ permissions: missing.join(', ') })
      );

      return;
    }

    const patch: Partial<VoiceSettings> = {};
    if (!isNullOrUndefined(hub)) patch.hubChannelId = hub.id;
    if (!isNullOrUndefined(category)) patch.categoryId = category.id;
    if (!isNullOrUndefined(template)) patch.nameTemplate = template;
    if (!isNullOrUndefined(defaultLimit)) patch.defaultLimit = defaultLimit;

    const settings = await this.voice.saveSettings(guildId, patch);

    await respond(
      interaction,
      localize.COMMANDS.VOICE.SETUP.SAVED({
        hub: isNullOrWhitespace(settings.hubChannelId)
          ? '—'
          : `<#${settings.hubChannelId}>`,
        template: settings.nameTemplate,
        limit: settings.defaultLimit > 0 ? String(settings.defaultLimit) : '∞',
      })
    );
  }

  // =============================
  // ====== управление комнатой ==
  // =============================

  @SlashGroup('voice')
  @Slash({ name: 'rename', localizationSource: 'COMMANDS.VOICE.RENAME' })
  @Guard(GuildOnly)
  async rename(
    @SlashOption({
      name: 'name',
      localizationSource: 'COMMANDS.VOICE.OPTIONS.NAME',
      type: ApplicationCommandOptionType.String,
      required: true,
      maxLength: MAX_NAME_LENGTH,
    })
    name: string,
    interaction: ChatInputCommandInteraction
  ) {
    const localize = L[getLocaleFromInteraction(interaction)];
    const room = await this.ownedRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const trimmed = name.trim();
    if (isNullOrWhitespace(trimmed)) {
      await respond(interaction, localize.COMMANDS.VOICE.ERRORS.INVALID_NAME());

      return;
    }

    await this.voice.setName(room, trimmed);
    await respond(interaction, localize.COMMANDS.VOICE.SUCCESS.RENAMED());
  }

  @SlashGroup('voice')
  @Slash({ name: 'limit', localizationSource: 'COMMANDS.VOICE.LIMIT' })
  @Guard(GuildOnly)
  async limit(
    @SlashOption({
      name: 'limit',
      localizationSource: 'COMMANDS.VOICE.OPTIONS.LIMIT',
      type: ApplicationCommandOptionType.Integer,
      required: true,
      minValue: MIN_USER_LIMIT,
      maxValue: MAX_USER_LIMIT,
    })
    limit: number,
    interaction: ChatInputCommandInteraction
  ) {
    const localize = L[getLocaleFromInteraction(interaction)];
    const room = await this.ownedRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const updated = await this.voice.setLimit(room, limit);
    await this.voice.refreshPanel(updated);

    await respond(
      interaction,
      localize.COMMANDS.VOICE.SUCCESS.LIMIT_SET({
        limit: updated.userLimit > 0 ? String(updated.userLimit) : '∞',
      })
    );
  }

  @SlashGroup('voice')
  @Slash({ name: 'lock', localizationSource: 'COMMANDS.VOICE.LOCK' })
  @Guard(GuildOnly)
  async lock(interaction: ChatInputCommandInteraction) {
    const localize = L[getLocaleFromInteraction(interaction)];
    const room = await this.ownedRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const updated = await this.voice.setLocked(room, true);
    await this.voice.refreshPanel(updated);
    await respond(interaction, localize.COMMANDS.VOICE.SUCCESS.LOCKED());
  }

  @SlashGroup('voice')
  @Slash({ name: 'unlock', localizationSource: 'COMMANDS.VOICE.UNLOCK' })
  @Guard(GuildOnly)
  async unlock(interaction: ChatInputCommandInteraction) {
    const localize = L[getLocaleFromInteraction(interaction)];
    const room = await this.ownedRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const updated = await this.voice.setLocked(room, false);
    await this.voice.refreshPanel(updated);
    await respond(interaction, localize.COMMANDS.VOICE.SUCCESS.UNLOCKED());
  }

  @SlashGroup('voice')
  @Slash({ name: 'permit', localizationSource: 'COMMANDS.VOICE.PERMIT' })
  @Guard(GuildOnly)
  async permit(
    @SlashOption({
      name: 'user',
      localizationSource: 'COMMANDS.VOICE.OPTIONS.USER',
      type: ApplicationCommandOptionType.User,
      required: true,
    })
    user: User,
    interaction: ChatInputCommandInteraction
  ) {
    const localize = L[getLocaleFromInteraction(interaction)];
    const room = await this.ownedRoom(interaction);
    if (isNullOrUndefined(room)) return;

    await this.voice.permitUser(room, user.id);
    await respond(interaction, localize.COMMANDS.VOICE.SUCCESS.PERMITTED({ user: `<@${user.id}>` }));
  }

  @SlashGroup('voice')
  @Slash({ name: 'deny', localizationSource: 'COMMANDS.VOICE.DENY' })
  @Guard(GuildOnly)
  async deny(
    @SlashOption({
      name: 'user',
      localizationSource: 'COMMANDS.VOICE.OPTIONS.USER',
      type: ApplicationCommandOptionType.User,
      required: true,
    })
    user: User,
    interaction: ChatInputCommandInteraction
  ) {
    const localize = L[getLocaleFromInteraction(interaction)];
    const room = await this.ownedRoom(interaction);
    if (isNullOrUndefined(room)) return;

    if (user.id === room.ownerId) {
      await respond(interaction, localize.COMMANDS.VOICE.ERRORS.TARGET_IS_OWNER());

      return;
    }

    await this.voice.denyUser(room, user.id);
    await respond(interaction, localize.COMMANDS.VOICE.SUCCESS.DENIED({ user: `<@${user.id}>` }));
  }

  @SlashGroup('voice')
  @Slash({ name: 'kick', localizationSource: 'COMMANDS.VOICE.KICK' })
  @Guard(GuildOnly)
  async kick(
    @SlashOption({
      name: 'user',
      localizationSource: 'COMMANDS.VOICE.OPTIONS.USER',
      type: ApplicationCommandOptionType.User,
      required: true,
    })
    user: User,
    interaction: ChatInputCommandInteraction
  ) {
    const localize = L[getLocaleFromInteraction(interaction)];
    const room = await this.ownedRoom(interaction);
    if (isNullOrUndefined(room)) return;

    if (user.id === room.ownerId) {
      await respond(interaction, localize.COMMANDS.VOICE.ERRORS.TARGET_IS_OWNER());

      return;
    }

    const kicked = await this.voice.kickUser(room, user.id);
    await respond(
      interaction,
      kicked
        ? localize.COMMANDS.VOICE.SUCCESS.KICKED({ user: `<@${user.id}>` })
        : localize.COMMANDS.VOICE.ERRORS.USER_NOT_IN_ROOM()
    );
  }

  // =============================
  // ========== helpers ==========
  // =============================

  /** Возвращает комнату, которой владеет вызывающий и в которой он сейчас находится. */
  private async ownedRoom(interaction: ChatInputCommandInteraction): Promise<VoiceRoom | null> {
    const localize = L[getLocaleFromInteraction(interaction)];
    const member = interaction.member;

    if (!(member instanceof GuildMember)) {
      await respond(interaction, localize.COMMANDS.VOICE.ERRORS.NOT_IN_ROOM());

      return null;
    }

    const room = await this.voice.getRoomForMember(member);
    if (isNullOrUndefined(room)) {
      await respond(interaction, localize.COMMANDS.VOICE.ERRORS.NOT_IN_ROOM());

      return null;
    }

    if (room.ownerId !== member.id) {
      await respond(interaction, localize.COMMANDS.VOICE.ERRORS.NOT_OWNER());

      return null;
    }

    return room;
  }
}
