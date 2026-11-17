import { ArgsOf } from 'discordx';
import { ChannelType, Guild } from 'discord.js';

import { Discord, Injectable, On } from '@/decorators';
import { Logger, TempVoiceService } from '@/services';
import { isNullOrUndefined, isNullOrWhitespace } from '@/utils/functions';

/**
 * Хаб «зайди и получи комнату»: создаёт персональный канал при входе в канал-хаб
 * и следит за тем, какие комнаты опустели.
 */
@Discord()
@Injectable()
export default class VoiceStateUpdateEvent {
  constructor(private voice: TempVoiceService, private logger: Logger) {}

  @On('voiceStateUpdate')
  async voiceStateUpdateHandler([oldState, newState]: ArgsOf<'voiceStateUpdate'>) {
    const member = newState.member ?? oldState.member;
    if (isNullOrUndefined(member) || member.user.bot) return;

    const guild = newState.guild;
    const leftId = oldState.channelId;
    const joinedId = newState.channelId;

    // микрофон/наушники и прочие изменения внутри одного канала нас не интересуют
    if (leftId === joinedId) return;

    try {
      if (!isNullOrWhitespace(leftId)) await this.handleLeftChannel(guild, leftId);

      if (!isNullOrWhitespace(joinedId)) {
        const room = await this.voice.getRoomByChannel(joinedId);
        if (!isNullOrUndefined(room)) await this.voice.clearEmpty(room);

        const settings = await this.voice.getSettings(guild.id);
        if (!isNullOrWhitespace(settings.hubChannelId) && joinedId === settings.hubChannelId) {
          await this.voice.createRoomFor(member);
        }
      }
    } catch (error) {
      this.logger.log(
        `[Voice] ошибка обработки voiceStateUpdate: ${
          error instanceof Error ? error.message : 'Unknown'
        }`,
        'error',
        true
      );
    }
  }

  private async handleLeftChannel(guild: Guild, channelId: string): Promise<void> {
    const room = await this.voice.getRoomByChannel(channelId);
    if (isNullOrUndefined(room)) return;

    const channel = guild.channels.cache.get(channelId);
    const remaining = channel?.type === ChannelType.GuildVoice ? channel.members.size : 0;

    if (remaining === 0) await this.voice.markEmpty(room);
    else await this.voice.clearEmpty(room);
  }
}
