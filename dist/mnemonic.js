"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bip39_light_1 = require("bip39-light");
function generateMnemonic(wordCount) {
    wordCount = wordCount || 12;
    if (wordCount % 3 !== 0) {
        throw new Error(`Invalid mnemonic word count supplied: ${wordCount}`);
    }
    return bip39_light_1.generateMnemonic((32 * wordCount) / 3);
}
exports.generateMnemonic = generateMnemonic;
function validateMnemonic(mnemonic) {
    try {
        return !!mnemonic && (bip39_light_1.validateMnemonic(mnemonic) || validatePaperWalletMnemonic(mnemonic));
    }
    catch (e) {
        return false;
    }
}
exports.validateMnemonic = validateMnemonic;
function validatePaperWalletMnemonic(mnemonic) {
    return !!mnemonic && validateMnemonicWords(mnemonic) && isMnemonicInPaperWalletFormat(mnemonic);
}
exports.validatePaperWalletMnemonic = validatePaperWalletMnemonic;
function validateMnemonicWords(mnemonic) {
    const wordlist = bip39_light_1.wordlists.EN;
    const words = mnemonic.split(' ');
    return words.reduce((result, word) => {
        return result && wordlist.indexOf(word) !== -1;
    }, true);
}
function isMnemonicInPaperWalletFormat(mnemonic) {
    return mnemonicToList(mnemonic).length === 27;
}
exports.isMnemonicInPaperWalletFormat = isMnemonicInPaperWalletFormat;
function mnemonicToList(mnemonic) {
    return mnemonic.split(' ');
}
//# sourceMappingURL=mnemonic.js.map