"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGraphQlErrorResult = void 0;
function isGraphQlErrorResult(input) {
    return (input &&
        !!(input.errorCode &&
            input.message != null) &&
        input.__typename);
}
exports.isGraphQlErrorResult = isGraphQlErrorResult;
//# sourceMappingURL=error-result.js.map