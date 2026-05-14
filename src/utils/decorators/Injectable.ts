import { constructor } from 'tsyringe/dist/typings/types';
import { injectable } from 'tsyringe';

export function Injectable<T>() {
  return function (target: constructor<T>) {
    return injectable()(target);
  };
}
