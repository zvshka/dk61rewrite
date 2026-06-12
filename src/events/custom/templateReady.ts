import { Discord, OnCustom } from '@/decorators';
import { Logger } from '@/services';

@Discord()
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
