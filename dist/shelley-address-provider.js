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
const addresses_1 = require("./helpers/addresses");
const HARDENED_THRESHOLD = 0x80000000;
const shelleyPath = (account, isChange, addrIdx) => {
    return [
        HARDENED_THRESHOLD + 1852,
        HARDENED_THRESHOLD + 1815,
        HARDENED_THRESHOLD + account,
        isChange ? 1 : 0,
        addrIdx,
    ];
};
const shelleyStakeAccountPath = (account) => {
    return [
        HARDENED_THRESHOLD + 1852,
        HARDENED_THRESHOLD + 1815,
        HARDENED_THRESHOLD + account,
        2,
        0,
    ];
};
exports.getStakingXpub = (cryptoProvider, accountIndex) => __awaiter(this, void 0, void 0, function* () {
    const path = shelleyStakeAccountPath(accountIndex);
    const xpubHex = (yield cryptoProvider.deriveXpub(path)).toString('hex');
    return {
        path,
        xpubHex,
    };
});
exports.getAccountXpub = (cryptoProvider, accountIndex) => __awaiter(this, void 0, void 0, function* () {
    const path = shelleyStakeAccountPath(accountIndex).slice(0, 3);
    const xpubHex = (yield cryptoProvider.deriveXpub(path)).toString('hex');
    return {
        path,
        xpubHex,
    };
});
exports.ShelleyBaseAddressProvider = (cryptoProvider, accountIndex, isChange) => (i) => __awaiter(this, void 0, void 0, function* () {
    const pathSpend = shelleyPath(accountIndex, isChange, i);
    const spendXpub = yield cryptoProvider.deriveXpub(pathSpend);
    const pathStake = shelleyStakeAccountPath(accountIndex);
    const stakeXpub = yield cryptoProvider.deriveXpub(pathStake);
    return {
        path: pathSpend,
        address: addresses_1.baseAddressFromXpub(spendXpub, stakeXpub, cryptoProvider.network.networkId),
    };
});
//# sourceMappingURL=shelley-address-provider.js.map