"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pick = void 0;
function pick(inputOrProps, maybeProps) {
    if (Array.isArray(inputOrProps)) {
        return (input) => _pick(input, inputOrProps);
    }
    else {
        return _pick(inputOrProps, maybeProps || []);
    }
}
exports.pick = pick;
function _pick(input, props) {
    const output = {};
    for (const prop of props) {
        output[prop] = input[prop];
    }
    return output;
}
//# sourceMappingURL=pick.js.map