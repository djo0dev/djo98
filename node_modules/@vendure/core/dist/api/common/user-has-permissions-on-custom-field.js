"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userHasPermissionsOnCustomField = void 0;
function userHasPermissionsOnCustomField(ctx, fieldDef) {
    var _a;
    if (ctx.apiType === 'shop' && fieldDef.public === true) {
        return true;
    }
    const requiresPermission = (_a = fieldDef.requiresPermission) !== null && _a !== void 0 ? _a : [];
    const permissionsArray = Array.isArray(requiresPermission) ? requiresPermission : [requiresPermission];
    if (permissionsArray.length === 0) {
        return true;
    }
    return ctx.userHasPermissions(permissionsArray);
}
exports.userHasPermissionsOnCustomField = userHasPermissionsOnCustomField;
//# sourceMappingURL=user-has-permissions-on-custom-field.js.map