import { constructor } from 'tsyringe/dist/typings/types';
import { autoInjectable } from 'tsyringe';

export function AutoInjectable<T>() {
  return function (target: constructor<T>) {
    return autoInjectable()(target);
  };
}
