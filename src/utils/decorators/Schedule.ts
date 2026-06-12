import { InjectionToken } from 'tsyringe';
import { CronJob } from 'cron';
import { isValidCron } from 'cron-validator';
import { container } from 'tsyringe';

import { generalConfig } from '@/configs';
import { resolveDependency } from '@/utils/functions';

export function Schedule(cronExpression: string, jobName?: string) {
  if (!isValidCron(cronExpression, { alias: true, seconds: true }))
    throw new Error(`Invalid cron expression: ${cronExpression}`);

  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const oldDescriptor = descriptor.value;
    descriptor.value = function (...args: any[]) {
      return oldDescriptor.apply(container.resolve(this.constructor as InjectionToken<any>), args);
    };

    const job = new CronJob(
      cronExpression,
      descriptor.value,
      null,
      false,
      generalConfig.timezone,
      target
    );

    import('@/services')
      .then(async services => {
        const scheduler = await resolveDependency(services.Scheduler);
        scheduler.addJob(jobName ?? propertyKey, job);
      })
      .catch(() => {});
  };
}
