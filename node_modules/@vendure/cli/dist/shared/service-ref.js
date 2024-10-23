"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRef = void 0;
const ts_morph_1 = require("ts-morph");
const entity_ref_1 = require("./entity-ref");
class ServiceRef {
    get name() {
        return this.classDeclaration.getName();
    }
    get nameCamelCase() {
        return this.name.charAt(0).toLowerCase() + this.name.slice(1);
    }
    get isCrudService() {
        return this.crudEntityRef !== undefined;
    }
    constructor(classDeclaration) {
        this.classDeclaration = classDeclaration;
        this.features = {
            findOne: !!this.classDeclaration.getMethod('findOne'),
            findAll: !!this.classDeclaration.getMethod('findAll'),
            create: !!this.classDeclaration.getMethod('create'),
            update: !!this.classDeclaration.getMethod('update'),
            delete: !!this.classDeclaration.getMethod('delete'),
        };
        this.crudEntityRef = this.getEntityRef();
    }
    injectDependency(dependency) {
        var _a;
        for (const constructorDeclaration of this.classDeclaration.getConstructors()) {
            const existingParam = constructorDeclaration.getParameter(dependency.name);
            if (!existingParam) {
                constructorDeclaration.addParameter({
                    name: dependency.name,
                    type: dependency.type,
                    hasQuestionToken: false,
                    isReadonly: false,
                    scope: (_a = dependency.scope) !== null && _a !== void 0 ? _a : ts_morph_1.Scope.Private,
                });
            }
        }
    }
    getEntityRef() {
        var _a;
        if (this.features.findOne) {
            const potentialCrudMethodNames = ['findOne', 'findAll', 'create', 'update', 'delete'];
            for (const methodName of potentialCrudMethodNames) {
                const findOneMethod = this.classDeclaration.getMethod(methodName);
                const returnType = findOneMethod === null || findOneMethod === void 0 ? void 0 : findOneMethod.getReturnType();
                if (returnType) {
                    const unwrappedReturnType = this.unwrapReturnType(returnType);
                    const typeDeclaration = unwrappedReturnType.getSymbolOrThrow().getDeclarations()[0];
                    if (typeDeclaration && ts_morph_1.Node.isClassDeclaration(typeDeclaration)) {
                        if (((_a = typeDeclaration.getExtends()) === null || _a === void 0 ? void 0 : _a.getText()) === 'VendureEntity') {
                            return new entity_ref_1.EntityRef(typeDeclaration);
                        }
                    }
                }
            }
        }
        return;
    }
    unwrapReturnType(returnType) {
        if (returnType.isUnion()) {
            const nonNullType = returnType.getUnionTypes().find(t => !t.isNull() && !t.isUndefined());
            if (!nonNullType) {
                throw new Error('Could not find non-null type in union');
            }
            return this.unwrapReturnType(nonNullType);
        }
        const typeArguments = returnType.getTypeArguments();
        if (typeArguments.length) {
            return this.unwrapReturnType(typeArguments[0]);
        }
        const aliasTypeArguments = returnType.getAliasTypeArguments();
        if (aliasTypeArguments.length) {
            return this.unwrapReturnType(aliasTypeArguments[0]);
        }
        return returnType;
    }
}
exports.ServiceRef = ServiceRef;
//# sourceMappingURL=service-ref.js.map