export const skipDeferCommands = new Set<string>();

export function SkipDefer(): MethodDecorator {
  return (target, propertyKey: string | symbol) => {
    if (typeof propertyKey === 'string') {
      skipDeferCommands.add(propertyKey);
    }
  };
}
