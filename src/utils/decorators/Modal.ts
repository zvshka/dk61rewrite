import { ModalComponent as ModalComponentX } from 'discordx';

import {
  constantPreserveDots,
  isNullOrUndefined,
  sanitizeLocales,
  setFallbackDescription,
  setOptionsLocalization,
} from '@/utils/functions';

/**
 * Handle a modal component
 * @param options - modal component options
 * ___
 *
 * @category Decorator
 */
export function Modal(options?: ModalComponentOptions | string) {
  if (!options) options = {};
  else if (typeof options === 'string') options = { command: options };

  let localizationSource: TranslationsNestedPaths | null = null;

  if (options.localizationSource)
    localizationSource = constantPreserveDots(
      options.localizationSource
    ) as TranslationsNestedPaths;
  else if (!isNullOrUndefined(options.command))
    localizationSource =
      `COMMANDS.${constantPreserveDots(options.command)}` as TranslationsNestedPaths;

  if (localizationSource) {
    options = setOptionsLocalization({
      target: 'name',
      options,
      localizationSource,
    });

    options = setOptionsLocalization({
      target: 'description',
      options,
      localizationSource,
    });
  }

  options = sanitizeLocales(options);

  if (isNullOrUndefined(options.command)) options = setFallbackDescription(options);

  return ModalComponentX(options);
}
