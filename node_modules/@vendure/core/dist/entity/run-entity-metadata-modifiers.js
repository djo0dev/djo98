"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEntityMetadataModifiers = void 0;
const typeorm_1 = require("typeorm");
async function runEntityMetadataModifiers(config) {
    var _a, _b;
    if ((_b = (_a = config.entityOptions) === null || _a === void 0 ? void 0 : _a.metadataModifiers) === null || _b === void 0 ? void 0 : _b.length) {
        const metadataArgsStorage = (0, typeorm_1.getMetadataArgsStorage)();
        for (const modifier of config.entityOptions.metadataModifiers) {
            await modifier(metadataArgsStorage);
        }
    }
}
exports.runEntityMetadataModifiers = runEntityMetadataModifiers;
//# sourceMappingURL=run-entity-metadata-modifiers.js.map