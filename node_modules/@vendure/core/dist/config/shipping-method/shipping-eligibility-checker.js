"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingEligibilityChecker = void 0;
const crypto_1 = require("crypto");
const configurable_operation_1 = require("../../common/configurable-operation");
const ttl_cache_1 = require("../../common/ttl-cache");
/**
 * @description
 * The ShippingEligibilityChecker class is used to check whether an order qualifies for a
 * given {@link ShippingMethod}.
 *
 * @example
 * ```ts
 * const minOrderTotalEligibilityChecker = new ShippingEligibilityChecker({
 *     code: 'min-order-total-eligibility-checker',
 *     description: [{ languageCode: LanguageCode.en, value: 'Checks that the order total is above some minimum value' }],
 *     args: {
 *         orderMinimum: { type: 'int', ui: { component: 'currency-form-input' } },
 *     },
 *     check: (ctx, order, args) => {
 *         return order.totalWithTax >= args.orderMinimum;
 *     },
 * });
 * ```
 *
 * @docsCategory shipping
 * @docsPage ShippingEligibilityChecker
 */
class ShippingEligibilityChecker extends configurable_operation_1.ConfigurableOperationDef {
    constructor(config) {
        super(config);
        this.shouldRunCheckCache = new ttl_cache_1.TtlCache({ cacheSize: 5000, ttl: 1000 * 60 * 60 * 5 });
        this.checkFn = config.check;
        this.shouldRunCheckFn = config.shouldRunCheck;
    }
    /**
     * @description
     * Check the given Order to determine whether it is eligible.
     *
     * @internal
     */
    async check(ctx, order, args, method) {
        const shouldRunCheck = await this.shouldRunCheck(ctx, order, args, method);
        return shouldRunCheck ? this.checkFn(ctx, order, this.argsArrayToHash(args), method) : true;
    }
    /**
     * Determines whether the check function needs to be run, based on the presence and
     * result of any defined `shouldRunCheckFn`.
     */
    async shouldRunCheck(ctx, order, args, method) {
        var _a;
        if (typeof this.shouldRunCheckFn === 'function') {
            const cacheKey = (_a = ctx.session) === null || _a === void 0 ? void 0 : _a.id;
            if (cacheKey) {
                const checkResult = await this.shouldRunCheckFn(ctx, order, this.argsArrayToHash(args), method);
                const checkResultHash = (0, crypto_1.createHash)('sha1')
                    .update(JSON.stringify(checkResult))
                    .digest('base64');
                const lastResultHash = this.shouldRunCheckCache.get(cacheKey);
                this.shouldRunCheckCache.set(cacheKey, checkResultHash);
                if (checkResultHash === lastResultHash) {
                    return false;
                }
            }
        }
        return true;
    }
}
exports.ShippingEligibilityChecker = ShippingEligibilityChecker;
//# sourceMappingURL=shipping-eligibility-checker.js.map