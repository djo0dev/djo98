"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasFacetValues = void 0;
const generated_types_1 = require("@vendure/common/lib/generated-types");
const transactional_connection_1 = require("../../../connection/transactional-connection");
const promotion_condition_1 = require("../promotion-condition");
const facet_value_checker_1 = require("../utils/facet-value-checker");
let facetValueChecker;
exports.hasFacetValues = new promotion_condition_1.PromotionCondition({
    code: 'at_least_n_with_facets',
    description: [
        { languageCode: generated_types_1.LanguageCode.en, value: 'Buy at least { minimum } products with the given facets' },
    ],
    args: {
        minimum: { type: 'int', defaultValue: 1 },
        facets: { type: 'ID', list: true, ui: { component: 'facet-value-form-input' } },
    },
    init(injector) {
        facetValueChecker = new facet_value_checker_1.FacetValueChecker(injector.get(transactional_connection_1.TransactionalConnection));
    },
    // eslint-disable-next-line no-shadow,@typescript-eslint/no-shadow
    async check(ctx, order, args) {
        let matches = 0;
        for (const line of order.lines) {
            if (await facetValueChecker.hasFacetValues(line, args.facets, ctx)) {
                matches += line.quantity;
            }
        }
        return args.minimum <= matches;
    },
});
//# sourceMappingURL=has-facet-values-condition.js.map