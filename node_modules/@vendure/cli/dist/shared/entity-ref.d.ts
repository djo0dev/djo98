import { ClassDeclaration, Type } from 'ts-morph';
export declare class EntityRef {
    classDeclaration: ClassDeclaration;
    constructor(classDeclaration: ClassDeclaration);
    get name(): string;
    get nameCamelCase(): string;
    isTranslatable(): boolean;
    isTranslation(): boolean;
    hasCustomFields(): boolean;
    getProps(): Array<{
        name: string;
        type: Type;
        nullable: boolean;
    }>;
    getTranslationClass(): ClassDeclaration | undefined;
}
