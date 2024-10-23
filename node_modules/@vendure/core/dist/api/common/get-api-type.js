"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiType = void 0;
/**
 * Inspects the GraphQL "info" resolver argument to determine which API
 * the request came through.
 */
function getApiType(info) {
    const query = info && info.schema.getQueryType();
    if (query) {
        return !!query.getFields().administrators ? 'admin' : 'shop';
    }
    return 'custom';
}
exports.getApiType = getApiType;
//# sourceMappingURL=get-api-type.js.map