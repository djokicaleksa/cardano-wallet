"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cardano_crypto_js_1 = require("cardano-crypto.js");
const HARDENED_THRESHOLD = 0x80000000;
var NetworkId;
(function (NetworkId) {
    NetworkId[NetworkId["MAINNET"] = 1] = "MAINNET";
    NetworkId[NetworkId["TESTNET"] = 0] = "TESTNET";
})(NetworkId || (NetworkId = {}));
exports.xpub2pub = (xpub) => xpub.slice(0, 32);
exports.xpub2ChainCode = (xpub) => xpub.slice(32, 64);
exports.encodeAddress = (address) => {
    const addressType = cardano_crypto_js_1.getAddressType(address);
    if (addressType === cardano_crypto_js_1.AddressTypes.BOOTSTRAP) {
        return cardano_crypto_js_1.base58.encode(address);
    }
    const addressPrefixes = {
        [cardano_crypto_js_1.AddressTypes.BASE]: 'addr',
        [cardano_crypto_js_1.AddressTypes.POINTER]: 'addr',
        [cardano_crypto_js_1.AddressTypes.ENTERPRISE]: 'addr',
        [cardano_crypto_js_1.AddressTypes.REWARD]: 'stake',
    };
    const isTestnet = cardano_crypto_js_1.getShelleyAddressNetworkId(address) === 0 /* TESTNET */;
    const addressPrefix = `${addressPrefixes[addressType]}${isTestnet ? '_test' : ''}`;
    return cardano_crypto_js_1.bech32.encode(addressPrefix, address);
};
const xpub2blake2b224Hash = (xpub) => cardano_crypto_js_1.getPubKeyBlake2b224Hash(exports.xpub2pub(xpub));
exports.baseAddressFromXpub = (spendXpub, stakeXpub, networkId) => {
    const addrBuffer = cardano_crypto_js_1.packBaseAddress(xpub2blake2b224Hash(spendXpub), xpub2blake2b224Hash(stakeXpub), networkId);
    return exports.encodeAddress(addrBuffer);
};
exports.isShelleyPath = (path) => path[0] - HARDENED_THRESHOLD === 1852;
exports.indexIsHardened = (index) => index >= HARDENED_THRESHOLD;
exports.isShelleyFormat = (address) => {
    return address.startsWith('addr') || address.startsWith('stake');
};
//# sourceMappingURL=addresses.js.map