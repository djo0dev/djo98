"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterAsync = void 0;
/**
 * Performs a filter operation where the predicate is an async function returning a Promise.
 */
async function filterAsync(arr, predicate) {
    const results = await Promise.all(arr.map(async (value, index) => predicate(value, index)));
    return arr.filter((_, i) => results[i]);
}
exports.filterAsync = filterAsync;
//# sourceMappingURL=filter-async.js.map