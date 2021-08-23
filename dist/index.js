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
const crypto_provider_1 = require("./crypto-provider");
const shelley_address_provider_1 = require("./shelley-address-provider");
const constants_1 = require("./constants");
// const getCryptoProvider = async (mnemonic, networkId) => {
//     const walletSecretDef = await mnemonicToWalletSecretDef(mnemonic)
//     const network = {
//       networkId,
//     }
//     return await ShelleyJsCryptoProvider({
//       walletSecretDef,
//       network,
//       config: {shouldExportPubKeyBulk: true},
//     })
//   }
var NetworkId;
(function (NetworkId) {
    NetworkId[NetworkId["MAINNET"] = 1] = "MAINNET";
    NetworkId[NetworkId["TESTNET"] = 0] = "TESTNET";
})(NetworkId || (NetworkId = {}));
function toBip32StringPath(derivationPath) {
    return `m/${derivationPath
        .map((item) => (item % constants_1.HARDENED_THRESHOLD) + (item >= constants_1.HARDENED_THRESHOLD ? "'" : ''))
        .join('/')}`;
}
const main = () => __awaiter(this, void 0, void 0, function* () {
    const mnemonic24Words = 'castle tonight fork exile fiber sea aisle other poem illegal large obtain frost suffer guilt tent nasty use scissors ice animal february daughter ride';
    const cp = yield crypto_provider_1.getCryptoProvider(mnemonic24Words, 1 /* MAINNET */);
    const addrGen = shelley_address_provider_1.ShelleyBaseAddressProvider(cp, 0, false);
    for (let i = 0; i < 10; i++) {
        const { address, path } = yield addrGen(i);
        console.log(`#${i} Address: ${address} - Path: ${toBip32StringPath(path)}`);
    }
});
main();
//# sourceMappingURL=index.js.map