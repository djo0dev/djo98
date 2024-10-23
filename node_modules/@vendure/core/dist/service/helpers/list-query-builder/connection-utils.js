"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeCalculatedColumnExpression = exports.getEntityAlias = exports.getColumnMetadata = void 0;
/**
 * @description
 * Returns TypeORM ColumnMetadata for the given entity type.
 */
function getColumnMetadata(connection, entity) {
    const metadata = connection.getMetadata(entity);
    const columns = metadata.columns;
    let translationColumns = [];
    const relations = metadata.relations;
    const translationRelation = relations.find(r => r.propertyName === 'translations');
    if (translationRelation) {
        const commonFields = [
            'id',
            'createdAt',
            'updatedAt',
            'languageCode',
        ];
        const translationMetadata = connection.getMetadata(translationRelation.type);
        translationColumns = translationColumns.concat(translationMetadata.columns.filter(c => !c.relationMetadata && !commonFields.includes(c.propertyName)));
    }
    const alias = metadata.name.toLowerCase();
    return { columns, translationColumns, alias };
}
exports.getColumnMetadata = getColumnMetadata;
function getEntityAlias(connection, entity) {
    return connection.getMetadata(entity).name.toLowerCase();
}
exports.getEntityAlias = getEntityAlias;
/**
 * @description
 * Escapes identifiers in an expression according to the current database driver.
 */
function escapeCalculatedColumnExpression(connection, expression) {
    return expression.replace(/\b([a-z]+[A-Z]\w+)\b/g, substring => connection.driver.escape(substring));
}
exports.escapeCalculatedColumnExpression = escapeCalculatedColumnExpression;
//# sourceMappingURL=connection-utils.js.map