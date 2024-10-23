"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacetValueChecker = void 0;
const unique_1 = require("@vendure/common/lib/unique");
const ttl_cache_1 = require("../../../common/ttl-cache");
const utils_1 = require("../../../common/utils");
const product_variant_entity_1 = require("../../../entity/product-variant/product-variant.entity");
/**
 * @description
 * The FacetValueChecker is a helper class used to determine whether a given OrderLine consists
 * of ProductVariants containing the given FacetValues.
 *
 * @example
 * ```ts
 * import { FacetValueChecker, LanguageCode, PromotionCondition, TransactionalConnection } from '\@vendure/core';
 *
 * let facetValueChecker: FacetValueChecker;
 *
 * export const hasFacetValues = new PromotionCondition({
 *   code: 'at_least_n_with_facets',
 *   description: [
 *     { languageCode: LanguageCode.en, value: 'Buy at least { minimum } products with the given facets' },
 *   ],
 *   args: {
 *     minimum: { type: 'int' },
 *     facets: { type: 'ID', list: true, ui: { component: 'facet-value-form-input' } },
 *   },
 *   init(injector) {
 *     facetValueChecker = new FacetValueChecker(injector.get(TransactionalConnection));
 *   },
 *   async check(ctx, order, args) {
 *     let matches = 0;
 *     for (const line of order.lines) {
 *       if (await facetValueChecker.hasFacetValues(line, args.facets)) {
 *           matches += line.quantity;
 *       }
 *     }
 *     return args.minimum <= matches;
 *   },
 * });
 * ```
 *
 * @docsCategory Promotions
 */
class FacetValueChecker {
    constructor(connection) {
        this.connection = connection;
        this.variantCache = new ttl_cache_1.TtlCache({ ttl: 5000 });
    }
    /**
     * @description
     * Checks a given {@link OrderLine} against the facetValueIds and returns
     * `true` if the associated {@link ProductVariant} & {@link Product} together
     * have *all* the specified {@link FacetValue}s.
     */
    async hasFacetValues(orderLine, facetValueIds, ctx) {
        let variant = this.variantCache.get(orderLine.productVariant.id);
        if (!variant) {
            variant = await this.connection
                .getRepository(ctx, product_variant_entity_1.ProductVariant)
                .findOne({
                where: { id: orderLine.productVariant.id },
                relations: ['product', 'product.facetValues', 'facetValues'],
                loadEagerRelations: false,
            })
                .then(result => result !== null && result !== void 0 ? result : undefined);
            if (!variant) {
                return false;
            }
            this.variantCache.set(variant.id, variant);
        }
        const allFacetValues = (0, unique_1.unique)([...variant.facetValues, ...variant.product.facetValues], 'id');
        return facetValueIds.reduce((result, id) => result && !!allFacetValues.find(fv => (0, utils_1.idsAreEqual)(fv.id, id)), true);
    }
}
exports.FacetValueChecker = FacetValueChecker;
//# sourceMappingURL=facet-value-checker.js.map