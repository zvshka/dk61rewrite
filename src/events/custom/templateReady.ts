import { Discord, Injectable, OnCustom } from '@/decorators';
import { Logger } from '@/services';

@Discord()
@Injectable()
export default class TemplateReadyEvent {
  constructor(private logger: Logger) {}

  // =============================
  // ========= Handlers ==========
  // =============================

  @OnCustom('templateReady')
  async templateReadyHandler() {
    this.logger.log('Bot and API are fully ready!', 'info');
  }
}
