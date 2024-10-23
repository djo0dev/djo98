"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeString = void 0;
/**
 * Normalizes a string to replace non-alphanumeric and diacritical marks with
 * plain equivalents.
 * Based on https://stackoverflow.com/a/37511463/772859
 */
function normalizeString(input, spaceReplacer = ' ') {
    return (input || '')
        .normalize('NFD')
        .replace(/[\u00df]/g, 'ss')
        .replace(/[\u1e9e]/g, 'SS')
        .replace(/[\u0308]/g, 'e')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[!"£$%^&*()+[\]{};:@#~?\\/,|><`¬'=‘’©®™]/g, '')
        .replace(/\s+/g, spaceReplacer);
}
exports.normalizeString = normalizeString;
//# sourceMappingURL=normalize-string.js.map