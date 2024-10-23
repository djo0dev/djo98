"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomFieldsConfigWithoutInterfaces = void 0;
const graphql_1 = require("graphql");
/**
 * @description
 * Because the "Region" entity is an interface, it cannot be extended directly, so we need to
 * replace it if found in the custom field config with its concrete implementations.
 */
function getCustomFieldsConfigWithoutInterfaces(customFieldConfig, schema) {
    var _a;
    const entries = Object.entries(customFieldConfig);
    const regionIndex = entries.findIndex(([name]) => name === 'Region');
    if (regionIndex !== -1) {
        // Region is an interface and cannot directly be extended. Instead, we will use the
        // concrete types that implement it.
        const regionType = schema.getType('Region');
        if ((0, graphql_1.isInterfaceType)(regionType)) {
            const implementations = schema.getImplementations(regionType);
            // Remove "Region" from the list of entities to which custom fields can be added
            entries.splice(regionIndex, 1);
            for (const implementation of implementations.objects) {
                entries.push([implementation.name, (_a = customFieldConfig.Region) !== null && _a !== void 0 ? _a : []]);
            }
        }
    }
    return entries;
}
exports.getCustomFieldsConfigWithoutInterfaces = getCustomFieldsConfigWithoutInterfaces;
//# sourceMappingURL=get-custom-fields-config-without-interfaces.js.map