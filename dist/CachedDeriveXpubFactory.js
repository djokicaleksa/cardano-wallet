"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const cardano_crypto_js_1 = require("cardano-crypto.js");
const errors_1 = require("./errors");
const addresses_1 = require("./helpers/addresses");
const BYRON_V2_PATH = [constants_1.HARDENED_THRESHOLD + 44, constants_1.HARDENED_THRESHOLD + 1815, constants_1.HARDENED_THRESHOLD];
function CachedDeriveXpubFactory(derivationScheme, shouldExportPubKeyBulk, deriveXpubsHardenedFn) {
    const derivedXpubs = {};
    function deriveXpub(absDerivationPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const memoKey = JSON.stringify(absDerivationPath);
            if (!derivedXpubs[memoKey]) {
                const deriveHardened = absDerivationPath.length === 0 || addresses_1.indexIsHardened(absDerivationPath.slice(-1)[0]);
                /*
                 * we create pubKeyBulk only if the derivation path is from shelley era
                 * since there should be only one byron account exported in the fist shelley pubKey bulk
                 */
                if (deriveHardened) {
                    const derivationPaths = shouldExportPubKeyBulk && addresses_1.isShelleyPath(absDerivationPath)
                        ? createPathBulk(absDerivationPath)
                        : [absDerivationPath];
                    const pubKeys = yield _deriveXpubsHardenedFn(derivationPaths);
                    Object.assign(derivedXpubs, pubKeys);
                }
                else {
                    derivedXpubs[memoKey] = yield deriveXpubNonhardenedFn(absDerivationPath);
                }
            }
            /*
             * we await the derivation of the key so in case the derivation fails
             * the key is not added to the cache
             * this approach depends on the key derivation happening sychronously
             */
            return derivedXpubs[memoKey];
        });
    }
    function deriveXpubNonhardenedFn(derivationPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const lastIndex = derivationPath.slice(-1)[0];
            const parentXpub = yield deriveXpub(derivationPath.slice(0, -1));
            return cardano_crypto_js_1.derivePublic(parentXpub, lastIndex, derivationScheme.ed25519Mode);
        });
    }
    function* makeBulkAccountIndexIterator() {
        yield [0, 4];
        yield [5, 16];
        for (let i = 17; true; i += 18) {
            yield [i, i + 17];
        }
    }
    function getAccountIndexExportInterval(accountIndex) {
        const bulkAccountIndexIterator = makeBulkAccountIndexIterator();
        for (const [startIndex, endIndex] of bulkAccountIndexIterator) {
            if (accountIndex >= startIndex && accountIndex <= endIndex) {
                return [startIndex, endIndex];
            }
        }
        throw new errors_1.UnexpectedError(errors_1.UnexpectedErrorReason.BulkExportCreationError);
    }
    function createPathBulk(derivationPath) {
        const paths = [];
        const accountIndex = derivationPath[2] - constants_1.HARDENED_THRESHOLD;
        const [startIndex, endIndex] = getAccountIndexExportInterval(accountIndex);
        for (let i = startIndex; i <= endIndex; i += 1) {
            const nextAccountIndex = i + constants_1.HARDENED_THRESHOLD;
            const nextAccountPath = [...derivationPath.slice(0, -1), nextAccountIndex];
            paths.push(nextAccountPath);
        }
        /*
         * in case of the account 0 we append also the byron path
         * since during byron era only the first account was used
         */
        // @ts-ignore
        if (accountIndex === 0 && !paths.includes(BYRON_V2_PATH))
            paths.push(BYRON_V2_PATH);
        return paths;
    }
    /*
     * on top of the original deriveXpubHardenedFn this is priming
     * the cache of derived keys to minimize the number of prompts on hardware wallets
     */
    function _deriveXpubsHardenedFn(derivationPaths) {
        return __awaiter(this, void 0, void 0, function* () {
            const xPubBulk = yield deriveXpubsHardenedFn(derivationPaths);
            const _derivedXpubs = {};
            xPubBulk.forEach((xpub, i) => {
                const memoKey = JSON.stringify(derivationPaths[i]);
                _derivedXpubs[memoKey] = xpub;
            });
            return _derivedXpubs;
        });
    }
    return deriveXpub;
}
exports.default = CachedDeriveXpubFactory;
//# sourceMappingURL=CachedDeriveXpubFactory.js.map