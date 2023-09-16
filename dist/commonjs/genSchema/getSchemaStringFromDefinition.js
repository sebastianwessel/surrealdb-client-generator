"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchemaStringFromDefinition = void 0;
const tokenize_js_1 = require("./tokenize.js");
const optionalTypeRegex = /option<([^>]*)>/im;
const stringAssertionRegex = /\sstring::is::([^)]*)\(/im;
const getZodTypeFromQLType = (defString) => {
    switch (defString.toLowerCase()) {
        case 'string':
            return 'z.string()';
        case 'datetime':
            return 'z.string().datetime()';
        case 'array':
            return 'z.array(z.unknown())';
        case 'set':
            return 'z.array(z.unknown())';
        case 'number':
            return 'z.number()';
        case 'float':
            return 'z.number()';
        case 'int':
            return 'z.number()';
        case 'decimal':
            return 'z.number()';
        case 'bool':
            return 'z.boolean()';
        case 'object':
            return 'z.record(z.unknown(),z.unknown())';
        case 'record':
            return 'z.any()';
        case 'geometry':
            return 'z.any()';
        default:
            return 'z.any()';
    }
};
const addAssertion = (definition) => {
    const match = definition.match(stringAssertionRegex);
    if (!match) {
        return '';
    }
    switch (match[1]?.toLowerCase()) {
        case 'email':
            return '.email()';
        case 'uuid':
            return '.uuid()';
        case 'url':
            return '.url()';
        default:
            return '';
    }
};
const convertStringToEnum = (schema, definition) => {
    return schema.replace('.string()', '.enum(' + definition + ')');
};
const getSchemaStringFromDefinition = (definition, isInputSchema) => {
    let schema = 'z.any()';
    let isOptional = false;
    const tokens = (0, tokenize_js_1.tokenize)(definition);
    if (!tokens.fieldType) {
        return schema;
    }
    let defString = tokens.fieldType;
    const optionalDefinition = defString.match(optionalTypeRegex);
    if (optionalDefinition) {
        defString = optionalDefinition[1];
        isOptional = true;
    }
    schema = getZodTypeFromQLType(defString);
    if (defString.toLowerCase() === 'string' && tokens.inside) {
        schema = convertStringToEnum(schema, tokens.inside);
    }
    if (defString.toLowerCase() === 'string' && tokens.assert) {
        schema += addAssertion(tokens.assert);
    }
    if (isInputSchema && tokens.defaultValue) {
        isOptional = true;
    }
    if (!isInputSchema && tokens.defaultValue) {
        isOptional = false;
    }
    if (isOptional) {
        schema += '.optional().nullable()';
    }
    return schema;
};
exports.getSchemaStringFromDefinition = getSchemaStringFromDefinition;
//# sourceMappingURL=getSchemaStringFromDefinition.js.map