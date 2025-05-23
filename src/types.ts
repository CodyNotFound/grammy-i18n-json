import { Context } from "grammy";

export type LocaleNegotiator<C extends Context = Context> = (ctx: C) =>
    string | undefined | PromiseLike<string | undefined>;

export interface I18nFlavor {
    /** I18n context namespace object */
    i18n: {
        /** Returns the current locale. */
        getLocale(): Promise<string>;
        /**
         * Equivalent for manually setting the locale in session and calling `renegotiateLocale()`.
         * If the `useSession` in the i18n configuration is set to true, sets the locale in session.
         * Otherwise throws an error.
         * You can suppress the error by using `useLocale()` instead.
         * @param locale Locale ID to set in the session.
         */
        setLocale(locale: string): Promise<void>;
        /**
         * Sets the specified locale to be used for future translations.
         * Effect lasts only for the duration of current update and is not preserved.
         * Could be used to change the translation locale in the middle of update processing
         * (e.g. when user changes the language).
         * @param locale Locale ID to set.
         */
        useLocale(locale: string): void;
        /**
         * You can manually trigger additional locale negotiation by calling this method.
         * This could be useful if locale negotiation conditions has changed and new locale must be applied
         * (e.g. user has changed the language and you need to display an answer in new locale).
         */
        renegotiateLocale(): Promise<void>;
    };
    /** Translation function bound to the current locale. */
    translate: (message: string, variables?: Record<string, string>) => string;
    /** Translation function bound to the current locale. */
    t: (message: string, variables?: Record<string, string>) => string;
}

export interface I18nConfig<C extends Context = Context> {
    /**
     * A locale ID to use by default.
     * This is used when locale negotiator and session (if enabled) returns an empty result.
     * The default value is "_en_".
     */
    defaultLocale: string;
    /**
     * Directory to load translations from.
     */
    directory?: string;
    /**
     * Whether to use session to get and set language code.
     * You must be using session with it.
     */
    useSession?: boolean;
    /**
     * An optional function that determines which locale to use.
     * See [Locale Negotiation](https://grammy.dev/plugins/i18n.html#custom-locale-negotiation) for more details.
     */
    localeNegotiator?: LocaleNegotiator<C>;
    /**
     * Convenience function for defining global variables that are used frequently in the translation context.
     * Variables defined inside this can be used directly in the translation source file without having to specifying them when calling the translate function.
     * It is possible to overwrite the values by re-defining them in the translation context of translate function.
     *
     * @example
     * ```ts
     * function defaultTranslationContext(ctx: Context) {
     *   return {
     *     name: ctx.from?.first_name || "",
     *     fullName: `${ctx.from?.first_name}${
     *       ctx.from?.last_name ? ` ${ctx.from.last_name}` : ""
     *     }`,
     *     // ...
     *   };
     * }
     * ```
     */
    globalTranslationContext?: (ctx: C) => Record<string, unknown>;
}
