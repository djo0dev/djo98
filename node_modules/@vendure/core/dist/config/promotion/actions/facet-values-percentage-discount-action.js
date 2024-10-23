"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discountOnItemWithFacets = void 0;
const generated_types_1 = require("@vendure/common/lib/generated-types");
const transactional_connection_1 = require("../../../connection/transactional-connection");
const promotion_action_1 = require("../promotion-action");
const facet_value_checker_1 = require("../utils/facet-value-checker");
let facetValueChecker;
exports.discountOnItemWithFacets = new promotion_action_1.PromotionItemAction({
    code: 'facet_based_discount',
    args: {
        discount: {
            type: 'float',
            ui: {
                component: 'number-form-input',
                suffix: '%',
            },
        },
        facets: {
            type: 'ID',
            list: true,
            ui: { component: 'facet-value-form-input' },
        },
    },
    init(injector) {
        facetValueChecker = new facet_value_checker_1.FacetValueChecker(injector.get(transactional_connection_1.TransactionalConnection));
    },
    async execute(ctx, orderLine, args) {
        if (await facetValueChecker.hasFacetValues(orderLine, args.facets, ctx)) {
            const unitPrice = ctx.channel.pricesIncludeTax ? orderLine.unitPriceWithTax : orderLine.unitPrice;
            return -unitPrice * (args.discount / 100);
        }
        return 0;
    },
    description: [
        { languageCode: generated_types_1.LanguageCode.en, value: 'Discount products with these facets by { discount }%' },
    ],
});
//# sourceMappingURL=facet-values-percentage-discount-action.js.map