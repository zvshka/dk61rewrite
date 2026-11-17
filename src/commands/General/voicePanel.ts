import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  RepliableInteraction,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuInteraction,
} from 'discord.js';

import { generalConfig } from '@/configs';
import {
  ButtonComponent,
  Discord,
  Injectable,
  ModalComponent,
  SelectMenuComponent,
} from '@/decorators';
import { L, locales } from '@/i18n';
import type { Locales } from '@/i18n';
import {
  MAX_NAME_LENGTH,
  MAX_USER_LIMIT,
  MIN_USER_LIMIT,
  TempVoiceService,
  VoiceRoom,
  VOICE_IDS,
} from '@/services';
import { isNullOrUndefined, isNullOrWhitespace } from '@/utils/functions';

type PanelInteraction = ButtonInteraction | UserSelectMenuInteraction;

/** селекты по пользователям не входят в общий тип AllInteractions, поэтому локаль определяем здесь */
function localeOf(interaction: { locale?: string }): Locales {
  const short = (interaction.locale ?? '').toLowerCase().split('-')[0];
  const matched = locales.find(locale => locale === short);

  return matched ?? generalConfig.defaultLocale;
}

/**
 * Кнопки, селекты и модалки панели управления персональным каналом.
 * Панель живёт в текстовом чате самого голосового канала.
 */
@Discord()
@Injectable()
export default class VoicePanelHandler {
  constructor(private voice: TempVoiceService) {}

  // =============================
  // ========== кнопки ===========
  // =============================

  @ButtonComponent({ id: VOICE_IDS.rename })
  async openRenameModal(interaction: ButtonInteraction) {
    const room = await this.resolveRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const localize = L[localeOf(interaction)];

    const modal = new ModalBuilder()
      .setCustomId(VOICE_IDS.modalRename)
      .setTitle(localize.COMMANDS.VOICE.MODAL.RENAME_TITLE())
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('name')
            .setLabel(localize.COMMANDS.VOICE.MODAL.RENAME_LABEL())
            .setStyle(TextInputStyle.Short)
            .setMaxLength(MAX_NAME_LENGTH)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal).catch(() => null);
  }

  @ButtonComponent({ id: VOICE_IDS.limit })
  async openLimitModal(interaction: ButtonInteraction) {
    const room = await this.resolveRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const localize = L[localeOf(interaction)];

    const modal = new ModalBuilder()
      .setCustomId(VOICE_IDS.modalLimit)
      .setTitle(localize.COMMANDS.VOICE.MODAL.LIMIT_TITLE())
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('limit')
            .setLabel(localize.COMMANDS.VOICE.MODAL.LIMIT_LABEL())
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true)
            .setValue(String(room.userLimit))
        )
      );

    await interaction.showModal(modal).catch(() => null);
  }

  @ButtonComponent({ id: VOICE_IDS.toggleLock })
  async toggleLock(interaction: ButtonInteraction) {
    const room = await this.resolveRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const localize = L[localeOf(interaction)];
    const updated = await this.voice.setLocked(room, !room.locked);

    await this.reply(
      interaction,
      updated.locked
        ? localize.COMMANDS.VOICE.SUCCESS.LOCKED()
        : localize.COMMANDS.VOICE.SUCCESS.UNLOCKED()
    );

    await this.voice.refreshPanel(updated);
  }

  // =============================
  // ========== селекты ==========
  // =============================

  @SelectMenuComponent({ id: VOICE_IDS.permit })
  async permitUser(interaction: UserSelectMenuInteraction) {
    const room = await this.resolveRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const localize = L[localeOf(interaction)];
    const userId = interaction.values.at(0);
    if (isNullOrWhitespace(userId)) return;

    await this.voice.permitUser(room, userId);
    await this.reply(interaction, localize.COMMANDS.VOICE.SUCCESS.PERMITTED({ user: `<@${userId}>` }));
  }

  @SelectMenuComponent({ id: VOICE_IDS.deny })
  async denyUser(interaction: UserSelectMenuInteraction) {
    const room = await this.resolveRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const localize = L[localeOf(interaction)];
    const userId = interaction.values.at(0);
    if (isNullOrWhitespace(userId)) return;

    if (userId === room.ownerId) {
      await this.reply(interaction, localize.COMMANDS.VOICE.ERRORS.TARGET_IS_OWNER());

      return;
    }

    await this.voice.denyUser(room, userId);
    await this.reply(interaction, localize.COMMANDS.VOICE.SUCCESS.DENIED({ user: `<@${userId}>` }));
  }

  @SelectMenuComponent({ id: VOICE_IDS.kick })
  async kickUser(interaction: UserSelectMenuInteraction) {
    const room = await this.resolveRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const localize = L[localeOf(interaction)];
    const userId = interaction.values.at(0);
    if (isNullOrWhitespace(userId)) return;

    if (userId === room.ownerId) {
      await this.reply(interaction, localize.COMMANDS.VOICE.ERRORS.TARGET_IS_OWNER());

      return;
    }

    const kicked = await this.voice.kickUser(room, userId);
    await this.reply(
      interaction,
      kicked
        ? localize.COMMANDS.VOICE.SUCCESS.KICKED({ user: `<@${userId}>` })
        : localize.COMMANDS.VOICE.ERRORS.USER_NOT_IN_ROOM()
    );
  }

  // =============================
  // ========== модалки ==========
  // =============================

  @ModalComponent({ id: VOICE_IDS.modalRename })
  async submitRename(interaction: ModalSubmitInteraction) {
    const room = await this.resolveRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const localize = L[localeOf(interaction)];
    const name = interaction.fields.getTextInputValue('name').trim();

    if (isNullOrWhitespace(name)) {
      await this.reply(interaction, localize.COMMANDS.VOICE.ERRORS.INVALID_NAME());

      return;
    }

    await this.voice.setName(room, name);
    await this.reply(interaction, localize.COMMANDS.VOICE.SUCCESS.RENAMED());
  }

  @ModalComponent({ id: VOICE_IDS.modalLimit })
  async submitLimit(interaction: ModalSubmitInteraction) {
    const room = await this.resolveRoom(interaction);
    if (isNullOrUndefined(room)) return;

    const localize = L[localeOf(interaction)];
    const raw = interaction.fields.getTextInputValue('limit').trim();
    const parsed = Number.parseInt(raw, 10);

    if (Number.isNaN(parsed) || parsed < MIN_USER_LIMIT || parsed > MAX_USER_LIMIT) {
      await this.reply(
        interaction,
        localize.COMMANDS.VOICE.ERRORS.INVALID_LIMIT({
          min: String(MIN_USER_LIMIT),
          max: String(MAX_USER_LIMIT),
        })
      );

      return;
    }

    const updated = await this.voice.setLimit(room, parsed);
    await this.reply(
      interaction,
      localize.COMMANDS.VOICE.SUCCESS.LIMIT_SET({
        limit: updated.userLimit > 0 ? String(updated.userLimit) : '∞',
      })
    );

    await this.voice.refreshPanel(updated);
  }

  // =============================
  // ========== helpers ==========
  // =============================

  /** Проверяет, что взаимодействие пришло из существующей комнаты, а вызывающий вправе ей управлять. */
  private async resolveRoom(interaction: PanelInteraction | ModalSubmitInteraction): Promise<VoiceRoom | null> {
    const localize = L[localeOf(interaction)];
    const channelId = interaction.channelId;
    const room = isNullOrUndefined(channelId)
      ? null
      : await this.voice.getRoomByChannel(channelId);

    if (isNullOrUndefined(room)) {
      await this.reply(interaction, localize.COMMANDS.VOICE.ERRORS.NOT_TEMP_CHANNEL());

      return null;
    }

    const isOwner = room.ownerId === interaction.user.id;
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;

    if (!isOwner && !isAdmin) {
      await this.reply(interaction, localize.COMMANDS.VOICE.ERRORS.NOT_OWNER());

      return null;
    }

    return room;
  }

  private async reply(interaction: RepliableInteraction, content: string): Promise<void> {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content, flags: ['Ephemeral'] }).catch(() => null);
    } else {
      await interaction.reply({ content, flags: ['Ephemeral'] }).catch(() => null);
    }
  }
}
