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
const hd_node_1 = require("./helpers/hd-node");
const mnemonic_1 = require("./mnemonic");
const errors_1 = require("./errors");
const CachedDeriveXpubFactory_1 = require("./CachedDeriveXpubFactory");
const borc_1 = require("borc");
const addresses_1 = require("./helpers/addresses");
const shelley_transactions_1 = require("./shelley-transactions");
const cardano_crypto_js_1 = require("cardano-crypto.js");
const derivationSchemes = {
    v1: {
        type: 'v1',
        ed25519Mode: 1,
        keyfileVersion: '1.0.0',
    },
    v2: {
        type: 'v2',
        ed25519Mode: 2,
        keyfileVersion: '2.0.0',
    },
};
var WalletName;
(function (WalletName) {
    WalletName["LEDGER"] = "Ledger";
    WalletName["TREZOR"] = "Trezor";
    WalletName["MNEMONIC"] = "Mnemonic";
})(WalletName || (WalletName = {}));
const guessDerivationSchemeFromMnemonic = (mnemonic) => {
    return mnemonic.split(' ').length === 12 ? derivationSchemes.v1 : derivationSchemes.v2;
};
const mnemonicToWalletSecretDef = (mnemonic) => __awaiter(this, void 0, void 0, function* () {
    if (!mnemonic_1.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic format');
    }
    if (yield mnemonic_1.isMnemonicInPaperWalletFormat(mnemonic)) {
        mnemonic = yield cardano_crypto_js_1.decodePaperWalletMnemonic(mnemonic);
    }
    const derivationScheme = guessDerivationSchemeFromMnemonic(mnemonic);
    const rootSecret = yield cardano_crypto_js_1.mnemonicToRootKeypair(mnemonic, derivationScheme.ed25519Mode);
    return {
        rootSecret,
        derivationScheme,
    };
});
exports.getCryptoProvider = (mnemonic, networkId) => __awaiter(this, void 0, void 0, function* () {
    const walletSecretDef = yield mnemonicToWalletSecretDef(mnemonic);
    const network = {
        networkId,
    };
    return yield ShelleyJsCryptoProvider({
        walletSecretDef,
        network,
        config: { shouldExportPubKeyBulk: true },
    });
});
const ShelleyJsCryptoProvider = ({ walletSecretDef: { rootSecret, derivationScheme }, network, config, }) => __awaiter(this, void 0, void 0, function* () {
    const masterHdNode = hd_node_1.default(rootSecret);
    const isHwWallet = () => false;
    const getWalletName = () => "Mnemonic" /* MNEMONIC */;
    const getWalletSecret = () => masterHdNode.toBuffer();
    const getDerivationScheme = () => derivationScheme;
    const getVersion = () => null;
    const deriveXpub = CachedDeriveXpubFactory_1.default(derivationScheme, config.shouldExportPubKeyBulk, (derivationPaths) => {
        return derivationPaths.map((path) => deriveHdNode(path).extendedPublicKey);
    });
    function deriveHdNode(derivationPath) {
        return derivationPath.reduce(deriveChildHdNode, masterHdNode);
    }
    function deriveChildHdNode(hdNode, childIndex) {
        const result = cardano_crypto_js_1.derivePrivate(hdNode.toBuffer(), childIndex, derivationScheme.ed25519Mode);
        return hd_node_1.default(result);
    }
    function sign(message, keyDerivationPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const hdNode = yield deriveHdNode(keyDerivationPath);
            const messageToSign = Buffer.from(message, 'hex');
            return cardano_crypto_js_1.sign(messageToSign, hdNode.toBuffer());
        });
    }
    // eslint-disable-next-line require-await
    function signTx(txAux, addressToPathMapper) {
        return __awaiter(this, void 0, void 0, function* () {
            const structuredTx = yield signTxGetStructured(txAux, addressToPathMapper);
            const tx = {
                txBody: borc_1.encode(structuredTx).toString('hex'),
                txHash: structuredTx.getId(),
            };
            return tx;
        });
    }
    function getHdPassphrase() {
        return cardano_crypto_js_1.xpubToHdPassphrase(masterHdNode.extendedPublicKey);
    }
    const prepareShelleyWitness = (txHash, path) => __awaiter(this, void 0, void 0, function* () {
        const signature = yield sign(txHash, path);
        const xpub = yield deriveXpub(path);
        const publicKey = addresses_1.xpub2pub(xpub);
        return { publicKey, signature };
    });
    const prepareByronWitness = (txHash, path, address) => __awaiter(this, void 0, void 0, function* () {
        const signature = yield sign(txHash, path);
        const xpub = yield deriveXpub(path);
        const publicKey = addresses_1.xpub2pub(xpub);
        const chainCode = addresses_1.xpub2ChainCode(xpub);
        // TODO: check if this works for testnet, apparently it doesnt
        const addressAttributes = borc_1.encode(cardano_crypto_js_1.getBootstrapAddressAttributes(cardano_crypto_js_1.base58.decode(address)));
        return { publicKey, signature, chainCode, addressAttributes };
    });
    const prepareWitnesses = (txAux, addressToAbsPathMapper) => __awaiter(this, void 0, void 0, function* () {
        const { inputs, certificates, withdrawals, getId } = txAux;
        const txHash = getId();
        const _shelleyWitnesses = [];
        const _byronWitnesses = [];
        // TODO: we should create witnesses only with unique addresses
        inputs.forEach(({ address }) => {
            const spendingPath = addressToAbsPathMapper(address);
            addresses_1.isShelleyPath(spendingPath)
                ? _shelleyWitnesses.push(prepareShelleyWitness(txHash, spendingPath))
                : _byronWitnesses.push(prepareByronWitness(txHash, spendingPath, address));
        });
        [...certificates, ...withdrawals].forEach(({ stakingAddress }) => {
            const stakingPath = addressToAbsPathMapper(stakingAddress);
            _shelleyWitnesses.push(prepareShelleyWitness(txHash, stakingPath));
        });
        const shelleyWitnesses = yield Promise.all(_shelleyWitnesses);
        const byronWitnesses = yield Promise.all(_byronWitnesses);
        return { shelleyWitnesses, byronWitnesses };
    });
    function prepareVotingAuxiliaryData(auxiliaryData) {
        return __awaiter(this, void 0, void 0, function* () {
            const cborizedRegistrationData = new Map([shelley_transactions_1.cborizeTxVotingRegistration(auxiliaryData)]);
            const registrationDataHash = cardano_crypto_js_1.blake2b(borc_1.encode(cborizedRegistrationData), 32).toString('hex');
            const stakingPath = auxiliaryData.rewardDestinationAddress.stakingPath;
            const registrationDataWitness = yield prepareShelleyWitness(registrationDataHash, stakingPath);
            const registrationDataSignature = registrationDataWitness.signature.toString('hex');
            const txAuxiliaryData = shelley_transactions_1.cborizeTxAuxiliaryVotingData(auxiliaryData, registrationDataSignature);
            return txAuxiliaryData;
        });
    }
    function finalizeTxAuxWithMetadata(txAux) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!txAux.auxiliaryData) {
                return {
                    finalizedTxAux: txAux,
                    txAuxiliaryData: null,
                };
            }
            switch (txAux.auxiliaryData.type) {
                case 'CATALYST_VOTING': {
                    const txAuxiliaryData = yield prepareVotingAuxiliaryData(txAux.auxiliaryData);
                    return {
                        finalizedTxAux: shelley_transactions_1.ShelleyTxAux(Object.assign({}, txAux, { auxiliaryDataHash: cardano_crypto_js_1.blake2b(borc_1.encode(txAuxiliaryData), 32).toString('hex') })),
                        txAuxiliaryData,
                    };
                }
                default:
                    return new Error('This should be unreachable.');
            }
        });
    }
    function signTxGetStructured(txAux, addressToPathMapper) {
        return __awaiter(this, void 0, void 0, function* () {
            const { finalizedTxAux, txAuxiliaryData } = yield finalizeTxAuxWithMetadata(txAux);
            const { shelleyWitnesses, byronWitnesses } = yield prepareWitnesses(finalizedTxAux, addressToPathMapper);
            const txWitnesses = shelley_transactions_1.cborizeTxWitnesses(byronWitnesses, shelleyWitnesses);
            return shelley_transactions_1.ShelleySignedTransactionStructured(finalizedTxAux, txWitnesses, txAuxiliaryData);
        });
    }
    function displayAddressForPath(absDerivationPath, stakingPath) {
        throw new errors_1.UnexpectedError(errors_1.UnexpectedErrorReason.UnsupportedOperationError, {
            message: 'Operation not supported',
        });
    }
    // eslint-disable-next-line require-await
    function witnessPoolRegTx(txAux, addressToAbsPathMapper) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new errors_1.UnexpectedError(errors_1.UnexpectedErrorReason.UnsupportedOperationError);
        });
    }
    return {
        network,
        signTx,
        witnessPoolRegTx,
        getWalletSecret,
        getWalletName,
        getDerivationScheme,
        deriveXpub,
        isHwWallet,
        getHdPassphrase,
        _sign: sign,
        displayAddressForPath,
        getVersion,
    };
});
//# sourceMappingURL=crypto-provider.js.map