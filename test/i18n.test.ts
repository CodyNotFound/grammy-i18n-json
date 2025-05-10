import { I18n } from '../src/i18n';
import { describe, it, expect, beforeAll } from 'bun:test';

const localesDir = './test/locales';

function createMockCtx(language_code?: string) {
    return {
        from: language_code ? { language_code } : undefined,
        hasText: (text: string) => true,
    } as any;
}

describe('I18n middleware (bot style)', () => {
    let i18n: I18n;

    beforeAll(() => {
        i18n = new I18n({
            directory: localesDir,
            defaultLocale: 'en',
        });
    });

    it('should inject ctx.translate/t for cn', async () => {
        const ctx = createMockCtx('cn');
        await i18n.middleware()(ctx, async () => { });
        expect(ctx.translate('hello', {})).toBe('你好');
        expect(ctx.translate('bye', {})).toBe('再见');
        // fallback
        expect(ctx.translate('fallback', {})).toBe('This is fallback');
        expect(ctx.translate('onlyInEn', {})).toBe('Only in English');
    });

    it('should inject ctx.translate/t for tw', async () => {
        const ctx = createMockCtx('tw');
        await i18n.middleware()(ctx, async () => { });
        expect(ctx.translate('hello', {})).toBe('哈囉');
        // fallback
        expect(ctx.translate('bye', {})).toBe('Goodbye');
        expect(ctx.translate('fallback', {})).toBe('This is fallback');
        expect(ctx.translate('onlyInEn', {})).toBe('Only in English');
    });

    it('should fallback to defaultLocale for unknown', async () => {
        const ctx = createMockCtx('not-exist');
        await i18n.middleware()(ctx, async () => { });
        expect(ctx.translate('hello', {})).toBe('Hello');
        expect(ctx.translate('bye', {})).toBe('Goodbye');
        expect(ctx.translate('fallback', {})).toBe('This is fallback');
        expect(ctx.translate('onlyInEn', {})).toBe('Only in English');
    });

    it('should return key if missing in all locales', async () => {
        const ctx = createMockCtx('cn');
        await i18n.middleware()(ctx, async () => { });
        expect(ctx.translate('not.exist.key', {})).toBe('not.exist.key');
    });

    it('should interpolate variables in middleware style', async () => {
        const ctx = createMockCtx('cn');
        await i18n.middleware()(ctx, async () => { });
        expect(ctx.translate('greet', { name: '小明' })).toBe('你好, 小明!');
    });
});

describe('I18n.translate (direct call)', () => {
    let i18n: I18n;

    beforeAll(() => {
        i18n = new I18n({
            directory: localesDir,
            defaultLocale: 'en',
        });
    });

    it('should translate for cn', () => {
        expect(i18n.translate('cn', 'hello')).toBe('你好');
        expect(i18n.translate('cn', 'bye')).toBe('再见');
        // fallback
        expect(i18n.translate('cn', 'fallback')).toBe('This is fallback');
        expect(i18n.translate('cn', 'onlyInEn')).toBe('Only in English');
    });

    it('should translate for tw', () => {
        expect(i18n.translate('tw', 'hello')).toBe('哈囉');
        // fallback
        expect(i18n.translate('tw', 'bye')).toBe('Goodbye');
        expect(i18n.translate('tw', 'fallback')).toBe('This is fallback');
        expect(i18n.translate('tw', 'onlyInEn')).toBe('Only in English');
    });

    it('should fallback to defaultLocale for unknown', () => {
        expect(i18n.translate('not-exist', 'hello')).toBe('Hello');
        expect(i18n.translate('not-exist', 'bye')).toBe('Goodbye');
        expect(i18n.translate('not-exist', 'fallback')).toBe('This is fallback');
        expect(i18n.translate('not-exist', 'onlyInEn')).toBe('Only in English');
    });

    it('should return key if missing in all locales', () => {
        expect(i18n.translate('cn', 'not.exist.key')).toBe('not.exist.key');
    });

    it('should interpolate variables in direct call', () => {
        expect(i18n.translate('en', 'greet', { name: 'Tom' })).toBe('Hello, Tom!');
        expect(i18n.translate('cn', 'greet', { name: '小明' })).toBe('你好, 小明!');
        expect(i18n.translate('tw', 'greet', { name: '阿明' })).toBe('哈囉, 阿明!');
    });
}); 