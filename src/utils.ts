import fs from 'fs-extra';
import path from 'path';

export const throwReadFileError = (path: string) => {
    throw new Error(
        `Failed to read file "${path}". Please check if the file exists and is readable.`,
    );
};

function merge(target: any, source: any): any {
    if (typeof target !== 'object' || target === null) return source;
    if (typeof source !== 'object' || source === null) return target;
    const result = Array.isArray(target) ? [...target] : { ...target };
    for (const key of Object.keys(source)) {
        if (key in result) {
            result[key] = merge(result[key], source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

function flattenObject(obj: Record<string, any>, prefix = ""): Record<string, string> {
    let result: Record<string, string> = {};
    for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "object" && value !== null) {
            Object.assign(result, flattenObject(value, newKey));
        } else {
            result[newKey] = String(value);
        }
    }
    return result;
}

export const readLocalesDir = (dirPath: string) => {
    const files: { langCode: string; source: any }[] = [];
    const locales = new Set<string>();
    const { extname, join, sep } = path;

    const walk = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && extname(entry.name) === '.json') {
                try {
                    const contents = fs.readFileSync(fullPath, 'utf-8');
                    const locale = path.basename(fullPath, '.json');
                    if (locale) {
                        let obj;
                        try {
                            obj = JSON.parse(contents);
                        } catch {
                            throwReadFileError(fullPath);
                        }
                        files.push({
                            langCode: locale,
                            source: obj,
                        });
                        locales.add(locale);
                    }
                } catch {
                    throwReadFileError(fullPath);
                }
            }
        }
    };

    walk(dirPath);

    return Array.from(locales).map((langCode) => {
        const sameLocale = files.filter((file) => file.langCode === langCode);
        const merged = sameLocale.reduce((acc, cur) => merge(acc, cur.source), {});
        return {
            langCode,
            source: flattenObject(merged),
        };
    });
};
