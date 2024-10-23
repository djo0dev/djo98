"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityRef = void 0;
const ts_morph_1 = require("ts-morph");
class EntityRef {
    constructor(classDeclaration) {
        this.classDeclaration = classDeclaration;
    }
    get name() {
        return this.classDeclaration.getName();
    }
    get nameCamelCase() {
        return this.name.charAt(0).toLowerCase() + this.name.slice(1);
    }
    isTranslatable() {
        return this.classDeclaration.getImplements().some(i => i.getText() === 'Translatable');
    }
    isTranslation() {
        return this.classDeclaration.getImplements().some(i => i.getText().includes('Translation<'));
    }
    hasCustomFields() {
        return this.classDeclaration.getImplements().some(i => i.getText() === 'HasCustomFields');
    }
    getProps() {
        return this.classDeclaration.getProperties().map(prop => {
            const propType = prop.getType();
            const name = prop.getName();
            return { name, type: propType.getNonNullableType(), nullable: propType.isNullable() };
        });
    }
    getTranslationClass() {
        var _a, _b;
        if (!this.isTranslatable()) {
            return;
        }
        const translationsDecoratorArgs = (_b = (_a = this.classDeclaration
            .getProperty('translations')) === null || _a === void 0 ? void 0 : _a.getDecorator('OneToMany')) === null || _b === void 0 ? void 0 : _b.getArguments();
        if (translationsDecoratorArgs) {
            const typeFn = translationsDecoratorArgs[0];
            if (ts_morph_1.Node.isArrowFunction(typeFn)) {
                const translationClass = typeFn.getReturnType().getSymbolOrThrow().getDeclarations()[0];
                return translationClass;
            }
        }
    }
}
exports.EntityRef = EntityRef;
//# sourceMappingURL=entity-ref.js.map