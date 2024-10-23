"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminUiPluginInit = void 0;
const ts_morph_1 = require("ts-morph");
const constants_1 = require("../../../../../constants");
const ast_utils_1 = require("../../../../../utilities/ast-utils");
function updateAdminUiPluginInit(vendureConfig, options) {
    var _a, _b;
    const adminUiPlugin = (_a = vendureConfig
        .getPluginsArray()) === null || _a === void 0 ? void 0 : _a.getChildrenOfKind(ts_morph_1.SyntaxKind.CallExpression).find(c => {
        return c.getExpression().getText() === 'AdminUiPlugin.init';
    });
    if (adminUiPlugin) {
        const initObject = adminUiPlugin
            .getArguments()
            .find((a) => a.isKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression));
        const appProperty = initObject === null || initObject === void 0 ? void 0 : initObject.getProperty('app');
        if (!appProperty) {
            initObject === null || initObject === void 0 ? void 0 : initObject.addProperty({
                name: 'app',
                kind: ts_morph_1.StructureKind.PropertyAssignment,
                initializer: `compileUiExtensions({
                        outputPath: path.join(__dirname, '../admin-ui'),
                        extensions: [
                            ${options.pluginClassName}.ui,
                        ],
                        devMode: true,
                    }),`,
            }).formatText();
        }
        else {
            const computeFnCall = appProperty.getFirstChildByKind(ts_morph_1.SyntaxKind.CallExpression);
            if (computeFnCall === null || computeFnCall === void 0 ? void 0 : computeFnCall.getType().getText().includes(constants_1.AdminUiAppConfigName)) {
                const arg = computeFnCall.getArguments()[0];
                if (arg && ts_morph_1.Node.isObjectLiteralExpression(arg)) {
                    const extensionsProp = arg.getProperty('extensions');
                    if (extensionsProp) {
                        (_b = extensionsProp
                            .getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression)) === null || _b === void 0 ? void 0 : _b.addElement(`${options.pluginClassName}.ui`).formatText();
                    }
                }
            }
        }
        (0, ast_utils_1.addImportsToFile)(vendureConfig.sourceFile, {
            moduleSpecifier: '@vendure/ui-devkit/compiler',
            namedImports: ['compileUiExtensions'],
            order: 0,
        });
        (0, ast_utils_1.addImportsToFile)(vendureConfig.sourceFile, {
            moduleSpecifier: 'path',
            namespaceImport: 'path',
            order: 0,
        });
        (0, ast_utils_1.addImportsToFile)(vendureConfig.sourceFile, {
            moduleSpecifier: options.pluginPath,
            namedImports: [options.pluginClassName],
        });
        return true;
    }
    return false;
}
exports.updateAdminUiPluginInit = updateAdminUiPluginInit;
//# sourceMappingURL=update-admin-ui-plugin-init.js.map