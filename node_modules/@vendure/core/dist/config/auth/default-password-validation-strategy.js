"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPasswordValidationStrategy = void 0;
/**
 * @description
 * The DefaultPasswordValidationStrategy allows you to specify a minimum length and/or
 * a regular expression to match passwords against.
 *
 * TODO:
 * By default, the `minLength` will be set to `4`. This is rather permissive and is only
 * this way in order to reduce the risk of backward-compatibility breaks. In the next major version
 * this default will be made more strict.
 *
 * @docsCategory auth
 * @since 1.5.0
 */
class DefaultPasswordValidationStrategy {
    constructor(options) {
        this.options = options;
    }
    validate(ctx, password) {
        const { minLength, regexp } = this.options;
        if (minLength != null) {
            if (password.length < minLength) {
                return false;
            }
        }
        if (regexp != null) {
            if (!regexp.test(password)) {
                return false;
            }
        }
        return true;
    }
}
exports.DefaultPasswordValidationStrategy = DefaultPasswordValidationStrategy;
//# sourceMappingURL=default-password-validation-strategy.js.map