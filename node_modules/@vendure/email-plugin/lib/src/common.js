"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTransportSettings = exports.isDevModeOptions = void 0;
function isDevModeOptions(input) {
    return input.devMode === true;
}
exports.isDevModeOptions = isDevModeOptions;
async function resolveTransportSettings(options, injector, ctx) {
    if (typeof options.transport === 'function') {
        return options.transport(injector, ctx);
    }
    else {
        return options.transport;
    }
}
exports.resolveTransportSettings = resolveTransportSettings;
//# sourceMappingURL=common.js.map