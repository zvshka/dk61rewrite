import { Message } from 'discord.js';

import { Discord, Injectable, On } from '@/decorators';
import { Logger } from '@/services';

@Discord()
@Injectable()
export default class messagePinnedEvent {
  constructor(private logger: Logger) {}

  @On('messagePinned')
  async messagePinnedHandler([message]: [Message]) {
    this.logger.log(
      `Message pinned by ${message.author.tag}: ${message.content.slice(0, 150)}`,
      'info'
    );
  }
}
