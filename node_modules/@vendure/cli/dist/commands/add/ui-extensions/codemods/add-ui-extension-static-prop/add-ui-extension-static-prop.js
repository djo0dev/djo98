"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUiExtensionStaticProp = void 0;
const change_case_1 = require("change-case");
const constants_1 = require("../../../../../constants");
const ast_utils_1 = require("../../../../../utilities/ast-utils");
function addUiExtensionStaticProp(plugin) {
    const pluginClass = plugin.classDeclaration;
    const adminUiExtensionType = constants_1.AdminUiExtensionTypeName;
    const extensionId = (0, change_case_1.paramCase)(pluginClass.getName()).replace(/-plugin$/, '');
    pluginClass
        .addProperty({
        name: 'ui',
        isStatic: true,
        type: adminUiExtensionType,
        initializer: `{
                        id: '${extensionId}-ui',
                        extensionPath: path.join(__dirname, 'ui'),
                        routes: [{ route: '${extensionId}', filePath: 'routes.ts' }],
                        providers: ['providers.ts'],
                    }`,
    })
        .formatText();
    (0, ast_utils_1.addImportsToFile)(pluginClass.getSourceFile(), {
        moduleSpecifier: '@vendure/ui-devkit/compiler',
        namedImports: [adminUiExtensionType],
        order: 0,
    });
    (0, ast_utils_1.addImportsToFile)(pluginClass.getSourceFile(), {
        moduleSpecifier: 'path',
        namespaceImport: 'path',
        order: 0,
    });
}
exports.addUiExtensionStaticProp = addUiExtensionStaticProp;
//# sourceMappingURL=add-ui-extension-static-prop.js.map