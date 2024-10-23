"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addEntityToPlugin = void 0;
const ast_utils_1 = require("../../../../../utilities/ast-utils");
function addEntityToPlugin(plugin, entityClass) {
    if (!entityClass) {
        throw new Error('Could not find entity class');
    }
    const entityClassName = entityClass.getName();
    plugin.addEntity(entityClassName);
    (0, ast_utils_1.addImportsToFile)(plugin.classDeclaration.getSourceFile(), {
        moduleSpecifier: entityClass.getSourceFile(),
        namedImports: [entityClassName],
    });
}
exports.addEntityToPlugin = addEntityToPlugin;
//# sourceMappingURL=add-entity-to-plugin.js.map