import { Discord, Injectable, Schedule } from '@/decorators';
import { Logger, TempVoiceService } from '@/services';

/**
 * Раз в минуту удаляет персональные каналы, которые пустуют дольше 5 минут.
 */
@Discord()
@Injectable()
export default class VoiceCleanupEvent {
  constructor(private voice: TempVoiceService, private logger: Logger) {}

  @Schedule('0 * * * * *', 'voiceCleanup')
  async cleanEmptyRooms() {
    const removed = await this.voice.sweepEmpty();

    if (removed > 0) this.logger.log(`[Voice] удалено пустых комнат: ${removed}`, 'info');
  }
}
