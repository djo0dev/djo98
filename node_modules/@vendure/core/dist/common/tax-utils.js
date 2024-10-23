"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grossPriceOf = exports.taxPayableOn = exports.netPriceOf = exports.taxComponentOf = void 0;
/**
 * Returns the tax component of a given gross price.
 */
function taxComponentOf(grossPrice, taxRatePc) {
    return grossPrice - grossPrice / ((100 + taxRatePc) / 100);
}
exports.taxComponentOf = taxComponentOf;
/**
 * Given a gross (tax-inclusive) price, returns the net price.
 */
function netPriceOf(grossPrice, taxRatePc) {
    return grossPrice - taxComponentOf(grossPrice, taxRatePc);
}
exports.netPriceOf = netPriceOf;
/**
 * Returns the tax applicable to the given net price.
 */
function taxPayableOn(netPrice, taxRatePc) {
    return netPrice * (taxRatePc / 100);
}
exports.taxPayableOn = taxPayableOn;
/**
 * Given a net price, return the gross price (net + tax)
 */
function grossPriceOf(netPrice, taxRatePc) {
    return netPrice + taxPayableOn(netPrice, taxRatePc);
}
exports.grossPriceOf = grossPriceOf;
//# sourceMappingURL=tax-utils.js.map