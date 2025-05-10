import type { Context, MiddlewareFn } from 'grammy';
import type { I18nConfig, I18nFlavor } from './types';
import { readLocalesDir } from './utils';

export class I18n<C extends Context = Context> {
    private config: I18nConfig<C>;
    readonly locales = new Array<string>();
    readonly translations = new Map<string, Map<string, string>>();

    constructor(config: Partial<I18nConfig<C>>) {
        this.config = {
            defaultLocale: 'en',
            ...config,
        };

        if (config.directory) {
            const locales = readLocalesDir(config.directory);
            for (const locale of locales) {
                const { langCode, source } = locale;
                this.locales.push(langCode);

                this.translations.set(langCode, new Map(Object.entries(source)));
            }
        }

        (this.locales, this.translations)
    }

    translate(locale: string, key: string, variables?: Record<string, string>) {
        const translation = this.translations.get(locale)?.get(key);
        if (!translation) {
            return key;
        }
        return this.replaceVariables(translation, variables);
    }

    replaceVariables(translation: string, variables?: Record<string, unknown>) {
        return translation.replace(/\{([^{}]+)\}/g, (match, p1) => {
            const value = variables?.[p1];
            return value !== undefined && value !== null ? value.toString() : match;
        });
    }

    middleware(): MiddlewareFn<C & I18nFlavor> {
        return async (ctx, next) => {
            let currentLocale: string | undefined;
            let currentMessages: Map<string, string> | undefined;

            const useLocale = (locale: string) => {
                if (!this.locales.includes(locale)) {
                    console.warn(`Locale ${locale} not found, fallback to ${this.config.defaultLocale}`);
                    locale = this.config.defaultLocale;
                }

                currentLocale = locale;
                currentMessages = this.translations.get(locale);
            };

            const getNegotiatedLocale = async () => {
                return await this.config.localeNegotiator?.(ctx) ??
                    ctx.from?.language_code ??
                    this.config.defaultLocale;
            };

            const negotiateLocale = async () => {
                const locale = await getNegotiatedLocale();
                useLocale(locale);
            };

            const setLocale = async (locale: string) => {
                useLocale(locale);
            };

            Object.defineProperty(ctx, 'i18n', {
                value: {
                    renegotiateLocale: negotiateLocale,
                    useLocale,
                    getLocale: async () => currentLocale ?? getNegotiatedLocale(),
                    setLocale,
                },
                writable: true,
            });

            const boundTranslate = (key: string, variables?: Record<string, string>) => {
                if (!currentMessages || !currentLocale) {
                    console.warn('No locale set');
                    return key;
                }
                const translation = currentMessages.get(key);
                if (!translation) return key;
                return this.replaceVariables(translation, variables);
            };

            ctx.translate = boundTranslate;
            ctx.t = boundTranslate;

            await negotiateLocale();
            await next();
        };
    }
}

export function hears(key: string) {
    return function <C extends Context & I18nFlavor>(ctx: C) {
        const expected = ctx.t(key);
        return ctx.hasText && ctx.hasText(expected);
    };
}
