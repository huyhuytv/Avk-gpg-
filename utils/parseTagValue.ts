export const parseTagValue = (tagValue: string): Record<string, string> => {
    const result: Record<string, string> = {};
    if (!tagValue) return result;

    const parts: string[] = [];
    let quoteChar: "'" | '"' | null = null;
    let lastSplit = 0;
    let balance = 0; // for nested objects/arrays

    for (let i = 0; i < tagValue.length; i++) {
        const char = tagValue[i];

        if (quoteChar) {
            if (char === quoteChar && (i === 0 || tagValue[i - 1] !== '\\')) {
                quoteChar = null;
            }
            continue;
        }

        if (char === "'" || char === '"') {
            quoteChar = char;
            continue;
        }

        if (char === '{' || char === '[') {
            balance++;
        } else if (char === '}' || char === ']') {
            balance--;
        }

        if (char === ',' && balance === 0) {
            parts.push(tagValue.substring(lastSplit, i));
            lastSplit = i + 1;
        }
    }
    parts.push(tagValue.substring(lastSplit));

    for (const part of parts) {
        if (!part.trim()) continue;
        
        const eqIndex = part.indexOf('=');
        if (eqIndex === -1) {
            console.warn(`Could not parse key-value pair from part: "${part}"`);
            continue;
        }

        const rawKey = part.substring(0, eqIndex).trim();
        // The fix is here: normalize the key by removing spaces
        const key = rawKey.replace(/\s+/g, '');
        let value = part.substring(eqIndex + 1).trim();
        
        const firstChar = value.charAt(0);
        const lastChar = value.charAt(value.length - 1);
        if ((firstChar === "'" && lastChar === "'") || (firstChar === '"' && lastChar === '"')) {
            value = value.substring(1, value.length - 1);
        }
        
        result[key] = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
    
    return result;
};
