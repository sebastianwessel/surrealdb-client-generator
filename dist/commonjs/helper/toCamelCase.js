"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCamelCase = void 0;
const toCamelCase = (str) => {
    const s = str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        ?.map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
        .join('') || str;
    return s.slice(0, 1).toLowerCase() + s.slice(1);
};
exports.toCamelCase = toCamelCase;
//# sourceMappingURL=toCamelCase.js.map