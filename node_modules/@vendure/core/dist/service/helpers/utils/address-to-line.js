"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressToLine = void 0;
/**
 * Given an Address object, this function converts it into a single line
 * consisting of streetLine1, (postalCode), (countryCode).
 */
function addressToLine(address) {
    const propsToInclude = ['streetLine1', 'postalCode', 'country'];
    let result = address.streetLine1 || '';
    if (address.postalCode) {
        result += ', ' + address.postalCode;
    }
    if (address.country) {
        if (typeof address.country === 'string') {
            result += ', ' + address.country;
        }
        else {
            result += ', ' + address.country.name;
        }
    }
    return result;
}
exports.addressToLine = addressToLine;
//# sourceMappingURL=address-to-line.js.map