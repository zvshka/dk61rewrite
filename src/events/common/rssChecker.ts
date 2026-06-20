import { Client } from 'discordx';

import { rssConfig } from '@/configs';
import { Discord, Injectable, Schedule } from '@/decorators';
import { RssService } from '@/services';
import { resolveDependency } from '@/utils/functions';

const cronExpression = `0 */${rssConfig.checkIntervalMinutes} * * * *`;

@Discord()
@Injectable()
export default class RssCheckerEvent {
  constructor(private rss: RssService) {}

  @Schedule(cronExpression, 'rssChecker')
  async checkFeeds() {
    const client = await resolveDependency(Client);
    await this.rss.checkAllFeeds(client);
  }
}
