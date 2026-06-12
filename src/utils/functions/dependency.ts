import 'reflect-metadata';

import { F } from 'ts-toolbelt';
import { container, InjectionToken } from 'tsyringe';

export interface ResolverOptions {
  interval?: number;
  timeout?: number;
}

async function waitForRegistration(
  token: InjectionToken<never>,
  options: ResolverOptions = {}
): Promise<void> {
  const { interval = 500, timeout = 30000 } = options;
  const startTime = Date.now();

  while (!container.isRegistered(token)) {
    if (Date.now() - startTime > timeout) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      throw new Error(`Timeout waiting for dependency registration: ${String(token)}`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

export function resolveDependency<T>(token: InjectionToken<T>, _interval?: number): Promise<T> {
  return new Promise(resolve => resolve(container.resolve(token)));
}

type Forward<T> = {
  [Key in keyof T]: T[Key] extends abstract new (...args: any) => any
    ? InstanceType<T[Key]>
    : T[Key];
};

export function resolveDependencies<T extends readonly [...unknown[]]>(tokens: F.Narrow<T>) {
  return Promise.all(tokens.map((token: any) => resolveDependency(token))) as Promise<
    Forward<F.Narrow<T>>
  >;
}

const cacheMap = new Map<InjectionToken<any>, unknown>();

function getCachedValue(token: InjectionToken): unknown | undefined {
  return cacheMap.get(token);
}

function setCachedValue(token: InjectionToken, value: unknown): void {
  cacheMap.set(token, value);
}

export class LazyResolver<T> {
  private resolvingPromise: Promise<T> | undefined;

  constructor(private token: InjectionToken) {}

  async resolve(): Promise<T> {
    const cached = getCachedValue(this.token);
    if (cached !== undefined) {
      return cached as T;
    }

    if (this.resolvingPromise !== undefined) {
      return this.resolvingPromise;
    }

    this.resolvingPromise = (async () => {
      await waitForRegistration(this.token as InjectionToken<never>);
      const value = container.resolve<T>(this.token);
      setCachedValue(this.token, value);
      return value;
    })();

    try {
      return await this.resolvingPromise;
    } finally {
      /* empty */
    }
  }
}

export function createLazyResolver<T>(token: InjectionToken): LazyResolver<T> {
  return new LazyResolver(token);
}
