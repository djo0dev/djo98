"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetInterceptorPlugin = void 0;
const graphql_1 = require("graphql");
const graphql_value_transformer_1 = require("../common/graphql-value-transformer");
/**
 * Transforms outputs so that any Asset instances are run through the {@link AssetStorageStrategy.toAbsoluteUrl}
 * method before being returned in the response.
 */
class AssetInterceptorPlugin {
    constructor(configService) {
        this.configService = configService;
        const { assetOptions } = this.configService;
        if (assetOptions.assetStorageStrategy.toAbsoluteUrl) {
            this.toAbsoluteUrl = assetOptions.assetStorageStrategy.toAbsoluteUrl.bind(assetOptions.assetStorageStrategy);
        }
    }
    async serverWillStart(service) {
        this.graphqlValueTransformer = new graphql_value_transformer_1.GraphqlValueTransformer(service.schema);
    }
    async requestDidStart() {
        return {
            willSendResponse: async (requestContext) => {
                const { document } = requestContext;
                if (document) {
                    const { body } = requestContext.response;
                    const req = requestContext.contextValue.req;
                    if (body.kind === 'single') {
                        this.prefixAssetUrls(req, document, body.singleResult.data);
                    }
                }
            },
        };
    }
    prefixAssetUrls(request, document, data) {
        const typeTree = this.graphqlValueTransformer.getOutputTypeTree(document);
        const toAbsoluteUrl = this.toAbsoluteUrl;
        if (!toAbsoluteUrl || !data) {
            return;
        }
        this.graphqlValueTransformer.transformValues(typeTree, data, (value, type) => {
            if (!type) {
                return value;
            }
            const isAssetType = this.isAssetType(type);
            const isUnionWithAssetType = (0, graphql_1.isUnionType)(type) && type.getTypes().find(t => this.isAssetType(t));
            if (isAssetType || isUnionWithAssetType) {
                if (value && !Array.isArray(value)) {
                    if (value.preview) {
                        value.preview = toAbsoluteUrl(request, value.preview);
                    }
                    if (value.source) {
                        value.source = toAbsoluteUrl(request, value.source);
                    }
                }
            }
            return value;
        });
    }
    isAssetType(type) {
        const assetTypeNames = ['Asset', 'SearchResultAsset'];
        return assetTypeNames.includes(type.name);
    }
}
exports.AssetInterceptorPlugin = AssetInterceptorPlugin;
//# sourceMappingURL=asset-interceptor-plugin.js.map