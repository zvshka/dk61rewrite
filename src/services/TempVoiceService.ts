import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Guild,
  GuildMember,
  OverwriteResolvable,
  PermissionFlagsBits,
  UserSelectMenuBuilder,
  VoiceChannel,
} from 'discord.js';
import { Client } from 'discordx';

import { generalConfig } from '@/configs';
import { Service } from '@/decorators';
import { L } from '@/i18n';
import { Database, Logger } from '@/services';
import {
  getColor,
  isNullOrUndefined,
  isNullOrWhitespace,
  resolveDependency,
} from '@/utils/functions';

/** идентификаторы компонентов панели управления */
export const VOICE_IDS = {
  rename: 'voice:rename',
  limit: 'voice:limit',
  toggleLock: 'voice:toggle-lock',
  permit: 'voice:permit',
  deny: 'voice:deny',
  kick: 'voice:kick',
  reset: 'voice:reset',
  delete: 'voice:delete',
  modalRename: 'voice:modal:rename',
  modalLimit: 'voice:modal:limit',
} as const;

export const DEFAULT_NAME_TEMPLATE = '🔊 {user}';
export const DEFAULT_USER_LIMIT = 0;
export const MIN_USER_LIMIT = 0;
export const MAX_USER_LIMIT = 99;
export const MAX_NAME_LENGTH = 100;

/** сколько комната живёт пустой, прежде чем её удалят */
export const EMPTY_ROOM_TTL_MS = 5 * 60 * 1000;

export interface VoiceSettings {
  hubChannelId: string | null;
  categoryId: string | null;
  nameTemplate: string;
  defaultLimit: number;
}

/** сохранённые настройки комнаты конкретного владельца */
export interface VoiceProfileData {
  channelName: string | null;
  userLimit: number | null;
  locked: boolean;
  allowedUserIds: string[];
  deniedUserIds: string[];
}

/** итоговые параметры создаваемой комнаты: серверные настройки, перекрытые профилем */
interface VoiceRoomSpec {
  name: string;
  userLimit: number;
  locked: boolean;
  allowedUserIds: string[];
  deniedUserIds: string[];
}

/** подмножество полей модели, которого достаточно сервису */
export interface VoiceRoom {
  id: string;
  guildId: string;
  channelId: string;
  ownerId: string;
  panelMessageId: string | null;
  locked: boolean;
  userLimit: number;
  emptySince: Date | null;
}

/** строка компонентов в том виде, в каком её принимает discord.js */
export type VoicePanelRow =
  | ReturnType<ActionRowBuilder<ButtonBuilder>['toJSON']>
  | ReturnType<ActionRowBuilder<UserSelectMenuBuilder>['toJSON']>;

export interface VoicePanelPayload {
  embeds: EmbedBuilder[];
  components: VoicePanelRow[];
}

export function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_USER_LIMIT;

  return Math.min(MAX_USER_LIMIT, Math.max(MIN_USER_LIMIT, Math.trunc(limit)));
}

/**
 * Собирает панель управления комнатой.
 * Тексты всегда на языке бота по умолчанию: панель живёт в канале и не привязана к локали зрителя.
 */
export function buildVoicePanel(room: VoiceRoom): VoicePanelPayload {
  const panel = L[generalConfig.defaultLocale].COMMANDS.VOICE.PANEL;

  const limit = room.userLimit > 0 ? String(room.userLimit) : panel.UNLIMITED();

  const embed = new EmbedBuilder()
    .setColor(getColor('primary'))
    .setTitle(panel.TITLE())
    .setDescription(
      panel.DESCRIPTION({
        owner: `<@${room.ownerId}>`,
        limit,
        lockState: room.locked ? panel.LOCKED() : panel.UNLOCKED(),
      })
    );

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(VOICE_IDS.rename)
      .setLabel(panel.BTN_RENAME())
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(VOICE_IDS.limit)
      .setLabel(panel.BTN_LIMIT())
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(VOICE_IDS.toggleLock)
      .setLabel(room.locked ? panel.BTN_UNLOCK() : panel.BTN_LOCK())
      .setStyle(room.locked ? ButtonStyle.Success : ButtonStyle.Danger)
  );

  const actions = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(VOICE_IDS.reset)
      .setLabel(panel.BTN_RESET())
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(VOICE_IDS.delete)
      .setLabel(panel.BTN_DELETE())
      .setStyle(ButtonStyle.Danger)
  );

  const permit = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(VOICE_IDS.permit)
      .setPlaceholder(panel.SEL_PERMIT())
      .setMinValues(1)
      .setMaxValues(1)
  );

  const deny = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(VOICE_IDS.deny)
      .setPlaceholder(panel.SEL_DENY())
      .setMinValues(1)
      .setMaxValues(1)
  );

  const kick = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(VOICE_IDS.kick)
      .setPlaceholder(panel.SEL_KICK())
      .setMinValues(1)
      .setMaxValues(1)
  );

  return {
    embeds: [embed],
    components: [buttons.toJSON(), actions.toJSON(), permit.toJSON(), deny.toJSON(), kick.toJSON()],
  };
}

@Service()
export class TempVoiceService {
  constructor(private db: Database, private logger: Logger) {}

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private async client(): Promise<Client> {
    return resolveDependency(Client);
  }

  // =============================
  // ====== настройки сервера ====
  // =============================

  async getSettings(guildId: string): Promise<VoiceSettings> {
    const guild = await this.db.prisma.guild.findUnique({ where: { id: guildId } });
    const template = guild?.voiceNameTemplate;

    return {
      hubChannelId: guild?.voiceHubChannel ?? null,
      categoryId: guild?.voiceCategory ?? null,
      nameTemplate: isNullOrWhitespace(template) ? DEFAULT_NAME_TEMPLATE : template.trim(),
      defaultLimit: clampLimit(guild?.voiceDefaultLimit ?? DEFAULT_USER_LIMIT),
    };
  }

  async saveSettings(guildId: string, patch: Partial<VoiceSettings>): Promise<VoiceSettings> {
    const data: {
      voiceHubChannel?: string;
      voiceCategory?: string;
      voiceNameTemplate?: string;
      voiceDefaultLimit?: number;
    } = {};

    if (!isNullOrUndefined(patch.hubChannelId)) data.voiceHubChannel = patch.hubChannelId;
    if (!isNullOrUndefined(patch.categoryId)) data.voiceCategory = patch.categoryId;
    if (!isNullOrUndefined(patch.nameTemplate)) data.voiceNameTemplate = patch.nameTemplate;
    if (!isNullOrUndefined(patch.defaultLimit)) data.voiceDefaultLimit = clampLimit(patch.defaultLimit);

    await this.db.prisma.guild.upsert({
      where: { id: guildId },
      create: { id: guildId, ...data },
      update: data,
    });

    return this.getSettings(guildId);
  }

  // =============================
  // ====== профиль владельца ====
  // =============================

  async getProfile(guildId: string, ownerId: string): Promise<VoiceProfileData | null> {
    return this.db.prisma.voiceProfile.findUnique({
      where: { guildId_ownerId: { guildId, ownerId } },
    });
  }

  /** Дописывает профиль, сохраняя всё, что не передано в патче. */
  private async saveProfile(
    guildId: string,
    ownerId: string,
    patch: Partial<VoiceProfileData>
  ): Promise<void> {
    const current = await this.getProfile(guildId, ownerId);

    const next: VoiceProfileData = {
      channelName: isNullOrUndefined(patch.channelName)
        ? (current?.channelName ?? null)
        : patch.channelName,
      userLimit: isNullOrUndefined(patch.userLimit)
        ? (current?.userLimit ?? null)
        : patch.userLimit,
      locked: isNullOrUndefined(patch.locked) ? (current?.locked ?? false) : patch.locked,
      allowedUserIds: patch.allowedUserIds ?? current?.allowedUserIds ?? [],
      deniedUserIds: patch.deniedUserIds ?? current?.deniedUserIds ?? [],
    };

    await this.db.prisma.voiceProfile.upsert({
      where: { guildId_ownerId: { guildId, ownerId } },
      create: { guildId, ownerId, ...next },
      update: next,
    });
  }

  /**
   * Возвращает комнату к дефолтам сервера и стирает профиль:
   * после этого следующая комната создастся «как в первый раз».
   */
  async resetRoom(room: VoiceRoom): Promise<VoiceRoom> {
    const settings = await this.getSettings(room.guildId);
    const profile = await this.getProfile(room.guildId, room.ownerId);
    const channel = await this.fetchVoiceChannel(room.channelId);

    if (!isNullOrUndefined(channel)) {
      const overwritten = new Set([
        ...(profile?.allowedUserIds ?? []),
        ...(profile?.deniedUserIds ?? []),
      ]);

      for (const userId of overwritten) {
        if (userId === room.ownerId) continue;
        await channel.permissionOverwrites.delete(userId).catch(() => null);
      }

      await channel.permissionOverwrites
        .edit(
          channel.guild.roles.everyone.id,
          { Connect: null },
          { reason: 'Сброс настроек комнаты' }
        )
        .catch(() => null);

      await channel.setUserLimit(settings.defaultLimit, 'Сброс настроек комнаты').catch(() => null);

      const owner = await channel.guild.members.fetch(room.ownerId).catch(() => null);
      if (!isNullOrUndefined(owner)) {
        await channel
          .setName(this.formatChannelName(settings.nameTemplate, owner), 'Сброс настроек комнаты')
          .catch(() => null);
      }
    }

    await this.db.prisma.voiceProfile
      .deleteMany({ where: { guildId: room.guildId, ownerId: room.ownerId } })
      .catch(() => null);

    return this.updateRoom(room.id, { locked: false, userLimit: settings.defaultLimit });
  }

  // =============================
  // ========== комнаты ==========
  // =============================

  async getRoomByChannel(channelId: string): Promise<VoiceRoom | null> {
    return this.db.prisma.tempVoiceRoom.findUnique({ where: { channelId } });
  }

  async getRoomByOwner(guildId: string, ownerId: string): Promise<VoiceRoom | null> {
    return this.db.prisma.tempVoiceRoom.findFirst({ where: { guildId, ownerId } });
  }

  /** Разрешает комнату по текущему голосовому каналу участника. */
  async getRoomForMember(member: GuildMember): Promise<VoiceRoom | null> {
    const channelId = member.voice.channelId;
    if (isNullOrWhitespace(channelId)) return null;

    return this.getRoomByChannel(channelId);
  }

  formatChannelName(template: string, member: GuildMember): string {
    const displayName = member.displayName;
    const userName = isNullOrWhitespace(displayName) ? member.user.username : displayName;
    const name = template.replaceAll('{user}', userName).trim();
    const result = isNullOrWhitespace(name) ? userName : name;

    return result.slice(0, MAX_NAME_LENGTH);
  }

  /**
   * Создаёт комнату для участника и переносит его туда.
   * Если комната у него уже есть - переносит в неё, чтобы не плодить каналы.
   */
  async createRoomFor(member: GuildMember): Promise<VoiceRoom | null> {
    const guild = member.guild;
    const settings = await this.getSettings(guild.id);

    const existing = await this.getRoomByOwner(guild.id, member.id);
    if (!isNullOrUndefined(existing)) {
      const existingChannel = await this.fetchVoiceChannel(existing.channelId);

      // комната ещё жива - просто возвращаем владельца в неё, новые каналы не плодим
      if (!isNullOrUndefined(existingChannel)) {
        await member.voice.setChannel(existingChannel).catch(() => null);

        return existing;
      }

      await this.deleteRoomRow(existing.id);
    }

    const profile = await this.getProfile(guild.id, member.id);
    const savedName = profile?.channelName;

    const spec: VoiceRoomSpec = {
      name: isNullOrWhitespace(savedName)
        ? this.formatChannelName(settings.nameTemplate, member)
        : savedName,
      userLimit: profile?.userLimit ?? settings.defaultLimit,
      locked: profile?.locked ?? false,
      allowedUserIds: profile?.allowedUserIds ?? [],
      deniedUserIds: profile?.deniedUserIds ?? [],
    };

    const channel = await this.createVoiceChannel(guild, member, settings, spec);
    if (isNullOrUndefined(channel)) return null;

    const room = await this.db.prisma.tempVoiceRoom.create({
      data: {
        guildId: guild.id,
        channelId: channel.id,
        ownerId: member.id,
        userLimit: spec.userLimit,
        locked: spec.locked,
        // канал считается пустым, пока в него реально никто не зашёл:
        // если перенос не удастся, комнату подберёт уборщик
        emptySince: new Date(),
      },
    });

    await member.voice.setChannel(channel).catch(error => {
      this.logger.log(
        `[Voice] не удалось перенести ${member.id} в ${channel.id}: ${this.describeError(error)}`,
        'warn'
      );
    });

    await this.sendPanel(channel, room);

    return room;
  }

  private async createVoiceChannel(
    guild: Guild,
    member: GuildMember,
    settings: VoiceSettings,
    spec: VoiceRoomSpec
  ): Promise<VoiceChannel | null> {
    const overwrites: OverwriteResolvable[] = [
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.MoveMembers,
        ],
      },
    ];

    if (spec.locked) {
      overwrites.push({
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.Connect],
      });
    }

    const allowed = new Set(spec.allowedUserIds);

    for (const userId of allowed) {
      if (userId === member.id) continue;

      overwrites.push({
        id: userId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
      });
    }

    for (const userId of spec.deniedUserIds) {
      if (userId === member.id || allowed.has(userId)) continue;

      overwrites.push({ id: userId, deny: [PermissionFlagsBits.Connect] });
    }

    const channel = await guild.channels
      .create({
        name: spec.name,
        type: ChannelType.GuildVoice,
        parent: settings.categoryId ?? null,
        userLimit: spec.userLimit,
        permissionOverwrites: overwrites,
        reason: 'Временный персональный канал',
      })
      .catch(error => {
        this.logger.log(
          `[Voice] не удалось создать канал: ${this.describeError(error)}`,
          'error',
          true
        );

        return null;
      });

    return channel instanceof VoiceChannel ? channel : null;
  }

  /** Отправляет панель управления в текстовый чат канала. */
  private async sendPanel(channel: VoiceChannel, room: VoiceRoom): Promise<void> {
    const message = await channel.send(buildVoicePanel(room)).catch(error => {
      this.logger.log(
        `[Voice] не удалось отправить панель в ${channel.id}: ${this.describeError(error)}`,
        'warn'
      );

      return null;
    });

    if (isNullOrUndefined(message)) return;

    await this.db.prisma.tempVoiceRoom.update({
      where: { id: room.id },
      data: { panelMessageId: message.id },
    });
  }

  /** Перерисовывает панель после изменения настроек комнаты. */
  async refreshPanel(room: VoiceRoom): Promise<void> {
    if (isNullOrWhitespace(room.panelMessageId)) return;

    const channel = await this.fetchVoiceChannel(room.channelId);
    const message = await channel?.messages.fetch(room.panelMessageId).catch(() => null);

    if (isNullOrUndefined(message)) return;

    await message.edit(buildVoicePanel(room)).catch(error => {
      this.logger.log(`[Voice] не удалось обновить панель: ${this.describeError(error)}`, 'warn');
    });
  }

  private async fetchVoiceChannel(channelId: string): Promise<VoiceChannel | null> {
    const client = await this.client();
    const channel = await client.channels.fetch(channelId).catch(() => null);

    return channel instanceof VoiceChannel ? channel : null;
  }

  async deleteRoomRow(roomId: string): Promise<void> {
    await this.db.prisma.tempVoiceRoom.delete({ where: { id: roomId } }).catch(() => null);
  }

  /** Удаляет канал комнаты (если он ещё есть) и запись о ней. */
  async deleteRoom(room: VoiceRoom, reason = 'Временный канал удалён'): Promise<void> {
    const channel = await this.fetchVoiceChannel(room.channelId);
    await channel?.delete(reason).catch(() => null);
    await this.deleteRoomRow(room.id);
  }

  // =============================
  // ====== изменение комнаты ====
  // =============================

  async setLocked(room: VoiceRoom, locked: boolean): Promise<VoiceRoom> {
    const channel = await this.fetchVoiceChannel(room.channelId);

    if (!isNullOrUndefined(channel)) {
      await channel.permissionOverwrites
        .edit(
          channel.guild.roles.everyone.id,
          { Connect: locked ? false : null },
          { reason: locked ? 'Комната закрыта' : 'Комната открыта' }
        )
        .catch(() => null);
    }

    await this.saveProfile(room.guildId, room.ownerId, { locked });

    return this.updateRoom(room.id, { locked });
  }

  async setLimit(room: VoiceRoom, limit: number): Promise<VoiceRoom> {
    const clamped = clampLimit(limit);
    const channel = await this.fetchVoiceChannel(room.channelId);

    await channel?.setUserLimit(clamped, 'Лимит участников').catch(() => null);
    await this.saveProfile(room.guildId, room.ownerId, { userLimit: clamped });

    return this.updateRoom(room.id, { userLimit: clamped });
  }

  async setName(room: VoiceRoom, name: string): Promise<void> {
    const trimmed = name.slice(0, MAX_NAME_LENGTH);
    const channel = await this.fetchVoiceChannel(room.channelId);

    await channel?.setName(trimmed, 'Переименование комнаты').catch(() => null);
    await this.saveProfile(room.guildId, room.ownerId, { channelName: trimmed });
  }

  async permitUser(room: VoiceRoom, userId: string): Promise<void> {
    const channel = await this.fetchVoiceChannel(room.channelId);

    await channel?.permissionOverwrites
      .edit(userId, { ViewChannel: true, Connect: true }, { reason: 'Разрешён вход' })
      .catch(() => null);

    const profile = await this.getProfile(room.guildId, room.ownerId);
    const allowed = new Set(profile?.allowedUserIds ?? []);
    const denied = new Set(profile?.deniedUserIds ?? []);

    allowed.add(userId);
    denied.delete(userId);

    await this.saveProfile(room.guildId, room.ownerId, {
      allowedUserIds: [...allowed],
      deniedUserIds: [...denied],
    });
  }

  async denyUser(room: VoiceRoom, userId: string): Promise<void> {
    const channel = await this.fetchVoiceChannel(room.channelId);

    if (!isNullOrUndefined(channel)) {
      await channel.permissionOverwrites
        .edit(userId, { Connect: false }, { reason: 'Запрещён вход' })
        .catch(() => null);

      await this.disconnectIfInside(channel, userId);
    }

    const profile = await this.getProfile(room.guildId, room.ownerId);
    const allowed = new Set(profile?.allowedUserIds ?? []);
    const denied = new Set(profile?.deniedUserIds ?? []);

    denied.add(userId);
    allowed.delete(userId);

    await this.saveProfile(room.guildId, room.ownerId, {
      allowedUserIds: [...allowed],
      deniedUserIds: [...denied],
    });
  }

  async kickUser(room: VoiceRoom, userId: string): Promise<boolean> {
    const channel = await this.fetchVoiceChannel(room.channelId);
    if (isNullOrUndefined(channel)) return false;

    const member = await channel.guild.members.fetch(userId).catch(() => null);
    if (isNullOrUndefined(member) || member.voice.channelId !== room.channelId) return false;

    await member.voice.disconnect().catch(() => null);

    return true;
  }

  private async disconnectIfInside(channel: VoiceChannel, userId: string): Promise<void> {
    const member = await channel.guild.members.fetch(userId).catch(() => null);
    if (member?.voice.channelId === channel.id) await member.voice.disconnect().catch(() => null);
  }

  private async updateRoom(
    roomId: string,
    data: { locked?: boolean; userLimit?: number; emptySince?: Date | null }
  ): Promise<VoiceRoom> {
    return this.db.prisma.tempVoiceRoom.update({ where: { id: roomId }, data });
  }

  // =============================
  // ====== пустые комнаты =======
  // =============================

  async markEmpty(room: VoiceRoom): Promise<void> {
    if (room.emptySince) return;

    await this.updateRoom(room.id, { emptySince: new Date() });
  }

  async clearEmpty(room: VoiceRoom): Promise<void> {
    if (isNullOrUndefined(room.emptySince)) return;

    await this.updateRoom(room.id, { emptySince: null });
  }

  /** Удаляет комнаты, которые пустуют дольше EMPTY_ROOM_TTL_MS. */
  async sweepEmpty(): Promise<number> {
    const threshold = new Date(Date.now() - EMPTY_ROOM_TTL_MS);
    const rooms = await this.db.prisma.tempVoiceRoom.findMany({
      where: { emptySince: { not: null, lte: threshold } },
    });

    let removed = 0;

    for (const room of rooms) {
      try {
        const channel = await this.fetchVoiceChannel(room.channelId);

        if (isNullOrUndefined(channel)) {
          await this.deleteRoomRow(room.id);
          removed++;
          continue;
        }

        if (channel.members.size > 0) {
          await this.updateRoom(room.id, { emptySince: null });
          continue;
        }

        try {
          await channel.delete('Временный канал пуст');
        } catch (error) {
          // не смогли удалить - оставляем запись, попробуем в следующий раз
          this.logger.log(
            `[Voice] не удалось удалить пустой канал ${room.channelId}: ${
              error instanceof Error ? error.message : 'Unknown'
            }`,
            'warn'
          );
          continue;
        }

        await this.deleteRoomRow(room.id);
        removed++;
      } catch (error) {
        this.logger.log(
          `[Voice] ошибка уборки комнаты ${room.channelId}: ${
            error instanceof Error ? error.message : 'Unknown'
          }`,
          'warn'
        );
      }
    }

    return removed;
  }
}
