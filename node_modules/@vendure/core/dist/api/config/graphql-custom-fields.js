"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPaymentMethodQuoteCustomFields = exports.addShippingMethodQuoteCustomFields = exports.addOrderLineCustomFieldsInput = exports.addModifyOrderCustomFields = exports.addRegisterCustomerCustomFieldsInput = exports.addActiveAdministratorCustomFields = exports.addServerConfigCustomFields = exports.addGraphQLCustomFields = void 0;
const shared_utils_1 = require("@vendure/common/lib/shared-utils");
const graphql_1 = require("graphql");
const vendure_logger_1 = require("../../config/logger/vendure-logger");
const get_custom_fields_config_without_interfaces_1 = require("./get-custom-fields-config-without-interfaces");
/**
 * Given a CustomFields config object, generates an SDL string extending the built-in
 * types with a customFields property for all entities, translations and inputs for which
 * custom fields are defined.
 */
function addGraphQLCustomFields(typeDefsOrSchema, customFieldConfig, publicOnly) {
    var _a;
    const schema = typeof typeDefsOrSchema === 'string' ? (0, graphql_1.buildSchema)(typeDefsOrSchema) : typeDefsOrSchema;
    let customFieldTypeDefs = '';
    if (!schema.getType('JSON')) {
        customFieldTypeDefs += `
            scalar JSON
        `;
    }
    if (!schema.getType('DateTime')) {
        customFieldTypeDefs += `
            scalar DateTime
        `;
    }
    const customFieldsConfig = (0, get_custom_fields_config_without_interfaces_1.getCustomFieldsConfigWithoutInterfaces)(customFieldConfig, schema);
    for (const [entityName, customFields] of customFieldsConfig) {
        const gqlType = schema.getType(entityName);
        if ((0, graphql_1.isObjectType)(gqlType) && gqlType.getFields().customFields) {
            vendure_logger_1.Logger.warn(`The entity type "${entityName}" already has a "customFields" field defined. Skipping automatic custom field extension.`);
            continue;
        }
        const customEntityFields = customFields.filter(config => {
            return !config.internal && (publicOnly === true ? config.public !== false : true);
        });
        for (const fieldDef of customEntityFields) {
            if (fieldDef.type === 'relation') {
                const graphQlTypeName = fieldDef.graphQLType || fieldDef.entity.name;
                if (!schema.getType(graphQlTypeName)) {
                    const customFieldPath = `${entityName}.${fieldDef.name}`;
                    const errorMessage = `The GraphQL type "${graphQlTypeName !== null && graphQlTypeName !== void 0 ? graphQlTypeName : '(unknown)'}" specified by the ${customFieldPath} custom field does not exist in the ${publicOnly ? 'Shop API' : 'Admin API'} schema.`;
                    vendure_logger_1.Logger.warn(errorMessage);
                    if (publicOnly) {
                        vendure_logger_1.Logger.warn([
                            `This can be resolved by either:`,
                            `  - setting \`public: false\` in the ${customFieldPath} custom field config`,
                            `  - defining the "${graphQlTypeName}" type in the Shop API schema`,
                        ].join('\n'));
                    }
                    throw new Error(errorMessage);
                }
            }
        }
        const localizedFields = customEntityFields.filter(field => field.type === 'localeString' || field.type === 'localeText');
        const nonLocalizedFields = customEntityFields.filter(field => field.type !== 'localeString' && field.type !== 'localeText');
        const writeableLocalizedFields = localizedFields.filter(field => !field.readonly);
        const writeableNonLocalizedFields = nonLocalizedFields.filter(field => !field.readonly);
        const filterableFields = customEntityFields.filter(field => field.type !== 'relation');
        if (schema.getType(entityName)) {
            if (customEntityFields.length) {
                customFieldTypeDefs += `
                    type ${entityName}CustomFields {
                        ${mapToFields(customEntityFields, wrapListType(getGraphQlType))}
                    }

                    extend type ${entityName} {
                        customFields: ${entityName}CustomFields
                    }
                `;
            }
            else {
                customFieldTypeDefs += `
                    extend type ${entityName} {
                        customFields: JSON
                    }
                `;
            }
        }
        if (localizedFields.length && schema.getType(`${entityName}Translation`)) {
            customFieldTypeDefs += `
                    type ${entityName}TranslationCustomFields {
                         ${mapToFields(localizedFields, wrapListType(getGraphQlType))}
                    }

                    extend type ${entityName}Translation {
                        customFields: ${entityName}TranslationCustomFields
                    }
                `;
        }
        if (schema.getType(`Create${entityName}Input`)) {
            if (writeableNonLocalizedFields.length) {
                customFieldTypeDefs += `
                    input Create${entityName}CustomFieldsInput {
                       ${mapToFields(writeableNonLocalizedFields, wrapListType(getGraphQlInputType), shared_utils_1.getGraphQlInputName)}
                    }

                    extend input Create${entityName}Input {
                        customFields: Create${entityName}CustomFieldsInput
                    }
                `;
            }
            else {
                customFieldTypeDefs += `
                   extend input Create${entityName}Input {
                       customFields: JSON
                   }
               `;
            }
        }
        if (schema.getType(`Update${entityName}Input`)) {
            if (writeableNonLocalizedFields.length) {
                customFieldTypeDefs += `
                    input Update${entityName}CustomFieldsInput {
                       ${mapToFields(writeableNonLocalizedFields, wrapListType(getGraphQlInputType), shared_utils_1.getGraphQlInputName)}
                    }

                    extend input Update${entityName}Input {
                        customFields: Update${entityName}CustomFieldsInput
                    }
                `;
            }
            else {
                customFieldTypeDefs += `
                    extend input Update${entityName}Input {
                        customFields: JSON
                    }
                `;
            }
        }
        const customEntityNonListFields = customEntityFields.filter(f => f.list !== true);
        if (customEntityNonListFields.length && schema.getType(`${entityName}SortParameter`)) {
            // Sorting list fields makes no sense, so we only add "sort" fields
            // to non-list fields.
            customFieldTypeDefs += `
                    extend input ${entityName}SortParameter {
                         ${mapToFields(customEntityNonListFields, () => 'SortOrder')}
                    }
                `;
        }
        if (filterableFields.length && schema.getType(`${entityName}FilterParameter`)) {
            customFieldTypeDefs += `
                    extend input ${entityName}FilterParameter {
                         ${mapToFields(filterableFields, getFilterOperator)}
                    }
                `;
        }
        if (writeableLocalizedFields) {
            const translationInputs = [
                `${entityName}TranslationInput`,
                `Create${entityName}TranslationInput`,
                `Update${entityName}TranslationInput`,
            ];
            for (const inputName of translationInputs) {
                if (schema.getType(inputName)) {
                    if (writeableLocalizedFields.length) {
                        customFieldTypeDefs += `
                            input ${inputName}CustomFields {
                                ${mapToFields(writeableLocalizedFields, wrapListType(getGraphQlType))}
                            }

                            extend input ${inputName} {
                                customFields: ${inputName}CustomFields
                            }
                        `;
                    }
                    else {
                        customFieldTypeDefs += `
                            extend input ${inputName} {
                                customFields: JSON
                            }
                        `;
                    }
                }
            }
        }
    }
    const publicAddressFields = (_a = customFieldConfig.Address) === null || _a === void 0 ? void 0 : _a.filter(config => !config.internal && (publicOnly === true ? config.public !== false : true));
    if (publicAddressFields === null || publicAddressFields === void 0 ? void 0 : publicAddressFields.length) {
        // For custom fields on the Address entity, we also extend the OrderAddress
        // type (which is used to store address snapshots on Orders)
        if (schema.getType('OrderAddress')) {
            customFieldTypeDefs += `
                extend type OrderAddress {
                    customFields: AddressCustomFields
                }
            `;
        }
        if (schema.getType('UpdateOrderAddressInput')) {
            customFieldTypeDefs += `
                extend input UpdateOrderAddressInput {
                    customFields: UpdateAddressCustomFieldsInput
                }
            `;
        }
    }
    else {
        if (schema.getType('OrderAddress')) {
            customFieldTypeDefs += `
                extend type OrderAddress {
                    customFields: JSON
                }
        `;
        }
    }
    return (0, graphql_1.extendSchema)(schema, (0, graphql_1.parse)(customFieldTypeDefs));
}
exports.addGraphQLCustomFields = addGraphQLCustomFields;
function addServerConfigCustomFields(typeDefsOrSchema, customFieldConfig) {
    const schema = typeof typeDefsOrSchema === 'string' ? (0, graphql_1.buildSchema)(typeDefsOrSchema) : typeDefsOrSchema;
    const customFieldTypeDefs = `
            """
            This type is deprecated in v2.2 in favor of the EntityCustomFields type,
            which allows custom fields to be defined on user-supplies entities.
            """
            type CustomFields {
                ${Object.keys(customFieldConfig).reduce((output, name) => output + name + ': [CustomFieldConfig!]!\n', '')}
            }

            type EntityCustomFields {
                entityName: String!
                customFields: [CustomFieldConfig!]!
            }

            extend type ServerConfig {
                """
                This field is deprecated in v2.2 in favor of the entityCustomFields field,
                which allows custom fields to be defined on user-supplies entities.
                """
                customFieldConfig: CustomFields!
                entityCustomFields: [EntityCustomFields!]!
            }
        `;
    return (0, graphql_1.extendSchema)(schema, (0, graphql_1.parse)(customFieldTypeDefs));
}
exports.addServerConfigCustomFields = addServerConfigCustomFields;
function addActiveAdministratorCustomFields(typeDefsOrSchema, administratorCustomFields) {
    const schema = typeof typeDefsOrSchema === 'string' ? (0, graphql_1.buildSchema)(typeDefsOrSchema) : typeDefsOrSchema;
    const writableCustomFields = administratorCustomFields === null || administratorCustomFields === void 0 ? void 0 : administratorCustomFields.filter(field => field.readonly !== true);
    const extension = `
        extend input UpdateActiveAdministratorInput {
            customFields: ${0 < (writableCustomFields === null || writableCustomFields === void 0 ? void 0 : writableCustomFields.length) ? 'UpdateAdministratorCustomFieldsInput' : 'JSON'}
        }
    `;
    return (0, graphql_1.extendSchema)(schema, (0, graphql_1.parse)(extension));
}
exports.addActiveAdministratorCustomFields = addActiveAdministratorCustomFields;
/**
 * If CustomFields are defined on the Customer entity, then an extra `customFields` field is added to
 * the `RegisterCustomerInput` so that public writable custom fields can be set when a new customer
 * is registered.
 */
function addRegisterCustomerCustomFieldsInput(typeDefsOrSchema, customerCustomFields) {
    const schema = typeof typeDefsOrSchema === 'string' ? (0, graphql_1.buildSchema)(typeDefsOrSchema) : typeDefsOrSchema;
    if (!customerCustomFields || customerCustomFields.length === 0) {
        return schema;
    }
    const publicWritableCustomFields = customerCustomFields.filter(fieldDef => {
        return fieldDef.public !== false && !fieldDef.readonly && !fieldDef.internal;
    });
    if (publicWritableCustomFields.length < 1) {
        return schema;
    }
    const customFieldTypeDefs = `
        input RegisterCustomerCustomFieldsInput {
            ${mapToFields(publicWritableCustomFields, wrapListType(getGraphQlInputType), shared_utils_1.getGraphQlInputName)}
        }

        extend input RegisterCustomerInput {
            customFields: RegisterCustomerCustomFieldsInput
        }
    `;
    return (0, graphql_1.extendSchema)(schema, (0, graphql_1.parse)(customFieldTypeDefs));
}
exports.addRegisterCustomerCustomFieldsInput = addRegisterCustomerCustomFieldsInput;
/**
 * If CustomFields are defined on the Order entity, we add a `customFields` field to the ModifyOrderInput
 * type.
 */
function addModifyOrderCustomFields(typeDefsOrSchema, orderCustomFields) {
    const schema = typeof typeDefsOrSchema === 'string' ? (0, graphql_1.buildSchema)(typeDefsOrSchema) : typeDefsOrSchema;
    if (!orderCustomFields || orderCustomFields.length === 0) {
        return schema;
    }
    if (schema.getType('ModifyOrderInput') && schema.getType('UpdateOrderCustomFieldsInput')) {
        const customFieldTypeDefs = `
                extend input ModifyOrderInput {
                    customFields: UpdateOrderCustomFieldsInput
                }
            `;
        return (0, graphql_1.extendSchema)(schema, (0, graphql_1.parse)(customFieldTypeDefs));
    }
    return schema;
}
exports.addModifyOrderCustomFields = addModifyOrderCustomFields;
/**
 * If CustomFields are defined on the OrderLine entity, then an extra `customFields` argument
 * must be added to the `addItemToOrder` and `adjustOrderLine` mutations, as well as the related
 * fields in the `ModifyOrderInput` type.
 */
function addOrderLineCustomFieldsInput(typeDefsOrSchema, orderLineCustomFields) {
    const schema = typeof typeDefsOrSchema === 'string' ? (0, graphql_1.buildSchema)(typeDefsOrSchema) : typeDefsOrSchema;
    const publicCustomFields = orderLineCustomFields.filter(f => f.public !== false);
    if (!publicCustomFields || publicCustomFields.length === 0) {
        return schema;
    }
    const schemaConfig = schema.toConfig();
    const mutationType = schemaConfig.mutation;
    if (!mutationType) {
        return schema;
    }
    const input = new graphql_1.GraphQLInputObjectType({
        name: 'OrderLineCustomFieldsInput',
        fields: publicCustomFields.reduce((fields, field) => {
            const name = (0, shared_utils_1.getGraphQlInputName)(field);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const primitiveType = schema.getType(getGraphQlInputType(field));
            const type = field.list === true ? new graphql_1.GraphQLList(primitiveType) : primitiveType;
            return Object.assign(Object.assign({}, fields), { [name]: { type } });
        }, {}),
    });
    schemaConfig.types = [...schemaConfig.types, input];
    const addItemToOrderMutation = mutationType.getFields().addItemToOrder;
    const adjustOrderLineMutation = mutationType.getFields().adjustOrderLine;
    if (addItemToOrderMutation) {
        addItemToOrderMutation.args = [
            ...addItemToOrderMutation.args,
            {
                name: 'customFields',
                type: input,
                description: null,
                defaultValue: null,
                extensions: {},
                astNode: null,
                deprecationReason: null,
            },
        ];
    }
    if (adjustOrderLineMutation) {
        adjustOrderLineMutation.args = [
            ...adjustOrderLineMutation.args,
            {
                name: 'customFields',
                type: input,
                description: null,
                defaultValue: null,
                extensions: {},
                astNode: null,
                deprecationReason: null,
            },
        ];
    }
    let extendedSchema = new graphql_1.GraphQLSchema(schemaConfig);
    if (schema.getType('AddItemInput')) {
        const customFieldTypeDefs = `
            extend input AddItemInput {
                customFields: OrderLineCustomFieldsInput
            }
        `;
        extendedSchema = (0, graphql_1.extendSchema)(extendedSchema, (0, graphql_1.parse)(customFieldTypeDefs));
    }
    if (schema.getType('OrderLineInput')) {
        const customFieldTypeDefs = `
            extend input OrderLineInput {
                customFields: OrderLineCustomFieldsInput
            }
        `;
        extendedSchema = (0, graphql_1.extendSchema)(extendedSchema, (0, graphql_1.parse)(customFieldTypeDefs));
    }
    if (schema.getType('AddItemToDraftOrderInput')) {
        const customFieldTypeDefs = `
            extend input AddItemToDraftOrderInput {
                customFields: OrderLineCustomFieldsInput
            }
        `;
        extendedSchema = (0, graphql_1.extendSchema)(extendedSchema, (0, graphql_1.parse)(customFieldTypeDefs));
    }
    if (schema.getType('AdjustDraftOrderLineInput')) {
        const customFieldTypeDefs = `
            extend input AdjustDraftOrderLineInput {
                customFields: OrderLineCustomFieldsInput
            }
        `;
        extendedSchema = (0, graphql_1.extendSchema)(extendedSchema, (0, graphql_1.parse)(customFieldTypeDefs));
    }
    return extendedSchema;
}
exports.addOrderLineCustomFieldsInput = addOrderLineCustomFieldsInput;
function addShippingMethodQuoteCustomFields(typeDefsOrSchema, shippingMethodCustomFields) {
    const schema = typeof typeDefsOrSchema === 'string' ? (0, graphql_1.buildSchema)(typeDefsOrSchema) : typeDefsOrSchema;
    let customFieldTypeDefs = '';
    const publicCustomFields = shippingMethodCustomFields.filter(f => f.public !== false);
    if (0 < publicCustomFields.length) {
        customFieldTypeDefs = `
            extend type ShippingMethodQuote {
                customFields: ShippingMethodCustomFields
            }
        `;
    }
    else {
        customFieldTypeDefs = `
            extend type ShippingMethodQuote {
                customFields: JSON
            }
        `;
    }
    return (0, graphql_1.extendSchema)(schema, (0, graphql_1.parse)(customFieldTypeDefs));
}
exports.addShippingMethodQuoteCustomFields = addShippingMethodQuoteCustomFields;
function addPaymentMethodQuoteCustomFields(typeDefsOrSchema, paymentMethodCustomFields) {
    const schema = typeof typeDefsOrSchema === 'string' ? (0, graphql_1.buildSchema)(typeDefsOrSchema) : typeDefsOrSchema;
    let customFieldTypeDefs = '';
    const publicCustomFields = paymentMethodCustomFields.filter(f => f.public !== false);
    if (0 < publicCustomFields.length) {
        customFieldTypeDefs = `
            extend type PaymentMethodQuote {
                customFields: PaymentMethodCustomFields
            }
        `;
    }
    else {
        customFieldTypeDefs = `
            extend type PaymentMethodQuote {
                customFields: JSON
            }
        `;
    }
    return (0, graphql_1.extendSchema)(schema, (0, graphql_1.parse)(customFieldTypeDefs));
}
exports.addPaymentMethodQuoteCustomFields = addPaymentMethodQuoteCustomFields;
/**
 * Maps an array of CustomFieldConfig objects into a string of SDL fields.
 */
function mapToFields(fieldDefs, typeFn, nameFn) {
    const res = fieldDefs
        .map(field => {
        const type = typeFn(field);
        if (!type) {
            return;
        }
        const name = nameFn ? nameFn(field) : field.name;
        return `${name}: ${type}`;
    })
        .filter(x => x != null);
    return res.join('\n');
}
function getFilterOperator(config) {
    switch (config.type) {
        case 'datetime':
            return config.list ? 'DateListOperators' : 'DateOperators';
        case 'string':
        case 'localeString':
        case 'text':
        case 'localeText':
            return config.list ? 'StringListOperators' : 'StringOperators';
        case 'boolean':
            return config.list ? 'BooleanListOperators' : 'BooleanOperators';
        case 'int':
        case 'float':
            return config.list ? 'NumberListOperators' : 'NumberOperators';
        case 'relation':
            return undefined;
        default:
            (0, shared_utils_1.assertNever)(config);
    }
    return 'String';
}
function getGraphQlInputType(config) {
    return config.type === 'relation' ? 'ID' : getGraphQlType(config);
}
function wrapListType(getTypeFn) {
    return (def) => {
        const type = getTypeFn(def);
        if (!type) {
            return;
        }
        return def.list ? `[${type}!]` : type;
    };
}
function getGraphQlType(config) {
    switch (config.type) {
        case 'string':
        case 'localeString':
        case 'text':
        case 'localeText':
            return 'String';
        case 'datetime':
            return 'DateTime';
        case 'boolean':
            return 'Boolean';
        case 'int':
            return 'Int';
        case 'float':
            return 'Float';
        case 'relation':
            return config.graphQLType || config.entity.name;
        default:
            (0, shared_utils_1.assertNever)(config);
    }
    return 'String';
}
//# sourceMappingURL=graphql-custom-fields.js.map