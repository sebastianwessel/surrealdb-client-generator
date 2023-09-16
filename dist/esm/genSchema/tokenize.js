const getScope = (value) => {
    switch (value.toUpperCase()) {
        case 'DEFINE':
            return null;
        case 'FIELD':
            return 'name';
        case 'ON':
            return null;
        case 'TABLE':
            return 'table';
        case 'TYPE':
            return 'fieldType';
        case 'VALUE':
            return 'value';
        case 'DEFAULT':
            return 'defaultValue';
        case 'ASSERT':
            return 'assert';
        case 'INSIDE':
            return 'inside';
        default:
            return undefined;
    }
};
export const tokenize = (query) => {
    const clean = query.trim().replace(/;$/, '');
    const wordArray = clean.split(' ');
    const result = {
        name: '',
        table: '',
    };
    let scope;
    wordArray.forEach((word) => {
        const c = getScope(word);
        if (c) {
            scope = c;
            return;
        }
        if (c === null) {
            return;
        }
        result[scope] = ((result[scope] || '') + ' ' + word).trim();
    });
    return result;
};
//# sourceMappingURL=tokenize.js.map