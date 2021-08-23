"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cbor = require("borc");
const cardano_crypto_js_1 = require("cardano-crypto.js");
const addresses_1 = require("./helpers/addresses");
const errors_1 = require("./errors");
const poolCertificateUtils_1 = require("./helpers/poolCertificateUtils");
const tokenFormater_1 = require("./helpers/tokenFormater");
var TxWitnessKey;
(function (TxWitnessKey) {
    TxWitnessKey[TxWitnessKey["SHELLEY"] = 0] = "SHELLEY";
    TxWitnessKey[TxWitnessKey["BYRON"] = 2] = "BYRON";
})(TxWitnessKey = exports.TxWitnessKey || (exports.TxWitnessKey = {}));
var CertificateType;
(function (CertificateType) {
    CertificateType[CertificateType["STAKING_KEY_REGISTRATION"] = 0] = "STAKING_KEY_REGISTRATION";
    CertificateType[CertificateType["STAKING_KEY_DEREGISTRATION"] = 1] = "STAKING_KEY_DEREGISTRATION";
    CertificateType[CertificateType["DELEGATION"] = 2] = "DELEGATION";
    CertificateType[CertificateType["STAKEPOOL_REGISTRATION"] = 3] = "STAKEPOOL_REGISTRATION";
})(CertificateType = exports.CertificateType || (exports.CertificateType = {}));
var TxCertificateKey;
(function (TxCertificateKey) {
    TxCertificateKey[TxCertificateKey["STAKING_KEY_REGISTRATION"] = 0] = "STAKING_KEY_REGISTRATION";
    TxCertificateKey[TxCertificateKey["STAKING_KEY_DEREGISTRATION"] = 1] = "STAKING_KEY_DEREGISTRATION";
    TxCertificateKey[TxCertificateKey["DELEGATION"] = 2] = "DELEGATION";
    TxCertificateKey[TxCertificateKey["STAKEPOOL_REGISTRATION"] = 3] = "STAKEPOOL_REGISTRATION";
})(TxCertificateKey = exports.TxCertificateKey || (exports.TxCertificateKey = {}));
var TxBodyKey;
(function (TxBodyKey) {
    TxBodyKey[TxBodyKey["INPUTS"] = 0] = "INPUTS";
    TxBodyKey[TxBodyKey["OUTPUTS"] = 1] = "OUTPUTS";
    TxBodyKey[TxBodyKey["FEE"] = 2] = "FEE";
    TxBodyKey[TxBodyKey["TTL"] = 3] = "TTL";
    TxBodyKey[TxBodyKey["CERTIFICATES"] = 4] = "CERTIFICATES";
    TxBodyKey[TxBodyKey["WITHDRAWALS"] = 5] = "WITHDRAWALS";
    TxBodyKey[TxBodyKey["AUXILIARY_DATA_HASH"] = 7] = "AUXILIARY_DATA_HASH";
    TxBodyKey[TxBodyKey["VALIDITY_INTERVAL_START"] = 8] = "VALIDITY_INTERVAL_START";
})(TxBodyKey = exports.TxBodyKey || (exports.TxBodyKey = {}));
var TxStakeCredentialType;
(function (TxStakeCredentialType) {
    TxStakeCredentialType[TxStakeCredentialType["ADDR_KEYHASH"] = 0] = "ADDR_KEYHASH";
    // SCRIPTHASH = 1,
})(TxStakeCredentialType = exports.TxStakeCredentialType || (exports.TxStakeCredentialType = {}));
function ShelleyTxAux({ inputs, outputs, fee, ttl, certificates, withdrawals, auxiliaryDataHash, auxiliaryData, validityIntervalStart, }) {
    function getId() {
        return cardano_crypto_js_1.blake2b(cbor.encode(ShelleyTxAux({
            inputs,
            outputs,
            fee,
            ttl,
            certificates,
            withdrawals,
            auxiliaryDataHash,
            auxiliaryData,
            validityIntervalStart,
        })), 32).toString('hex');
    }
    function encodeCBOR(encoder) {
        const txBody = new Map();
        txBody.set(0 /* INPUTS */, cborizeTxInputs(inputs));
        txBody.set(1 /* OUTPUTS */, cborizeTxOutputs(outputs));
        txBody.set(2 /* FEE */, fee);
        if (ttl !== null) {
            txBody.set(3 /* TTL */, ttl);
        }
        if (certificates.length) {
            txBody.set(4 /* CERTIFICATES */, cborizeTxCertificates(certificates));
        }
        if (withdrawals.length) {
            txBody.set(5 /* WITHDRAWALS */, cborizeTxWithdrawals(withdrawals));
        }
        if (auxiliaryDataHash) {
            txBody.set(7 /* AUXILIARY_DATA_HASH */, Buffer.from(auxiliaryDataHash, 'hex'));
        }
        if (validityIntervalStart !== null) {
            txBody.set(8 /* VALIDITY_INTERVAL_START */, validityIntervalStart);
        }
        return encoder.pushAny(txBody);
    }
    return {
        getId,
        inputs,
        outputs,
        fee,
        ttl,
        certificates,
        withdrawals,
        auxiliaryDataHash,
        auxiliaryData,
        validityIntervalStart,
        encodeCBOR,
    };
}
exports.ShelleyTxAux = ShelleyTxAux;
function cborizeTxInputs(inputs) {
    const txInputs = inputs.map(({ txHash, outputIndex }) => {
        const txId = Buffer.from(txHash, 'hex');
        return [txId, outputIndex];
    });
    return txInputs;
}
exports.cborizeTxInputs = cborizeTxInputs;
function cborizeTxOutputTokenBundle(tokenBundle) {
    const policyIdMap = new Map();
    const orderedTokenBundle = tokenFormater_1.orderTokenBundle(tokenBundle);
    orderedTokenBundle.forEach(({ policyId, assets }) => {
        const assetMap = new Map();
        assets.forEach(({ assetName, quantity }) => {
            assetMap.set(Buffer.from(assetName, 'hex'), quantity);
        });
        policyIdMap.set(Buffer.from(policyId, 'hex'), assetMap);
    });
    return policyIdMap;
}
function cborizeSingleTxOutput(output) {
    const amount = output.tokenBundle.length > 0
        ? [output.coins, cborizeTxOutputTokenBundle(output.tokenBundle)]
        : output.coins;
    // TODO: we should have one fn for decoding
    const addressBuff = addresses_1.isShelleyFormat(output.address)
        ? cardano_crypto_js_1.bech32.decode(output.address).data
        : cardano_crypto_js_1.base58.decode(output.address);
    return [addressBuff, amount];
}
exports.cborizeSingleTxOutput = cborizeSingleTxOutput;
function cborizeTxOutputs(outputs) {
    const txOutputs = outputs.map(cborizeSingleTxOutput);
    return txOutputs;
}
exports.cborizeTxOutputs = cborizeTxOutputs;
function cborizeStakingKeyRegistrationCert(certificate) {
    const stakingKeyHash = cardano_crypto_js_1.bech32.decode(certificate.stakingAddress).data.slice(1);
    const stakeCredential = [
        TxStakeCredentialType.ADDR_KEYHASH,
        stakingKeyHash,
    ];
    return [0 /* STAKING_KEY_REGISTRATION */, stakeCredential];
}
function cborizeStakingKeyDeregistrationCert(certificate) {
    const stakingKeyHash = cardano_crypto_js_1.bech32.decode(certificate.stakingAddress).data.slice(1);
    const stakeCredential = [
        TxStakeCredentialType.ADDR_KEYHASH,
        stakingKeyHash,
    ];
    return [1 /* STAKING_KEY_DEREGISTRATION */, stakeCredential];
}
function cborizeDelegationCert(certificate) {
    const stakingKeyHash = cardano_crypto_js_1.bech32.decode(certificate.stakingAddress).data.slice(1);
    const stakeCredential = [
        TxStakeCredentialType.ADDR_KEYHASH,
        stakingKeyHash,
    ];
    const poolHash = Buffer.from(certificate.poolHash, 'hex');
    return [2 /* DELEGATION */, stakeCredential, poolHash];
}
function cborizeStakepoolRegistrationCert(certificate) {
    const { poolRegistrationParams } = certificate;
    return [
        3 /* STAKEPOOL_REGISTRATION */,
        Buffer.from(poolRegistrationParams.poolKeyHashHex, 'hex'),
        Buffer.from(poolRegistrationParams.vrfKeyHashHex, 'hex'),
        parseInt(poolRegistrationParams.pledgeStr, 10),
        parseInt(poolRegistrationParams.costStr, 10),
        new cbor.Tagged(30, [
            parseInt(poolRegistrationParams.margin.numeratorStr, 10),
            parseInt(poolRegistrationParams.margin.denominatorStr, 10),
        ], null),
        Buffer.from(poolRegistrationParams.rewardAccountHex, 'hex'),
        poolRegistrationParams.poolOwners.map((ownerObj) => {
            return Buffer.from(ownerObj.stakingKeyHashHex, 'hex');
        }),
        poolRegistrationParams.relays.map((relay) => {
            switch (relay.type) {
                case 0 /* SINGLE_HOST_IP */:
                    return [
                        relay.type,
                        relay.params.portNumber,
                        relay.params.ipv4 ? poolCertificateUtils_1.ipv4AddressToBuf(relay.params.ipv4) : null,
                        relay.params.ipv6 ? poolCertificateUtils_1.ipv6AddressToBuf(relay.params.ipv6) : null,
                    ];
                case 1 /* SINGLE_HOST_NAME */:
                    return [relay.type, relay.params.portNumber, relay.params.dnsName];
                case 2 /* MULTI_HOST_NAME */:
                    return [relay.type, relay.params.dnsName];
                default:
                    return [];
            }
        }),
        poolRegistrationParams.metadata
            ? [
                poolRegistrationParams.metadata.metadataUrl,
                Buffer.from(poolRegistrationParams.metadata.metadataHashHex, 'hex'),
            ]
            : null,
    ];
}
function cborizeTxCertificates(certificates) {
    const txCertificates = certificates.map((certificate) => {
        switch (certificate.type) {
            case CertificateType.STAKING_KEY_REGISTRATION:
                return cborizeStakingKeyRegistrationCert(certificate);
            case CertificateType.STAKING_KEY_DEREGISTRATION:
                return cborizeStakingKeyDeregistrationCert(certificate);
            case CertificateType.DELEGATION:
                return cborizeDelegationCert(certificate);
            case CertificateType.STAKEPOOL_REGISTRATION:
                return cborizeStakepoolRegistrationCert(certificate);
            default:
                throw new errors_1.UnexpectedError(errors_1.UnexpectedErrorReason.InvalidCertificateType);
        }
    });
    return txCertificates;
}
exports.cborizeTxCertificates = cborizeTxCertificates;
function cborizeTxWithdrawals(withdrawals) {
    const txWithdrawals = new Map();
    withdrawals.forEach((withdrawal) => {
        const stakingAddress = cardano_crypto_js_1.bech32.decode(withdrawal.stakingAddress).data;
        txWithdrawals.set(stakingAddress, withdrawal.rewards);
    });
    return txWithdrawals;
}
exports.cborizeTxWithdrawals = cborizeTxWithdrawals;
function cborizeTxWitnessesShelley(shelleyWitnesses) {
    const txWitnessesShelley = shelleyWitnesses.map(({ publicKey, signature }) => [publicKey, signature]);
    return txWitnessesShelley;
}
exports.cborizeTxWitnessesShelley = cborizeTxWitnessesShelley;
function cborizeTxWitnessesByron(byronWitnesses) {
    const txWitnessesByron = byronWitnesses.map(({ publicKey, signature, chainCode, addressAttributes }) => [
        publicKey,
        signature,
        chainCode,
        addressAttributes,
    ]);
    return txWitnessesByron;
}
function cborizeTxWitnesses(byronWitnesses, shelleyWitnesses) {
    const txWitnesses = new Map();
    if (byronWitnesses.length > 0) {
        txWitnesses.set(2 /* BYRON */, cborizeTxWitnessesByron(byronWitnesses));
    }
    if (shelleyWitnesses.length > 0) {
        txWitnesses.set(0 /* SHELLEY */, cborizeTxWitnessesShelley(shelleyWitnesses));
    }
    return txWitnesses;
}
exports.cborizeTxWitnesses = cborizeTxWitnesses;
function ShelleySignedTransactionStructured(txAux, txWitnesses, txAuxiliaryData) {
    function getId() {
        return txAux.getId();
    }
    function encodeCBOR(encoder) {
        return encoder.pushAny([txAux, txWitnesses, txAuxiliaryData]);
    }
    return {
        getId,
        encodeCBOR,
    };
}
exports.ShelleySignedTransactionStructured = ShelleySignedTransactionStructured;
// function cborizeCliWitness(txSigned) {
//   const [, witnesses]: [any, any] = cbor.decode(txSigned.txBody)
//   // there can be only one witness since only one signing file was passed
//   const [key, [data]] = Array.from(witnesses)[0]
//   return [key, data]
// }
const cborizeTxVotingRegistration = ({ votingPubKey, stakePubKey, rewardDestinationAddress, nonce, }) => [
    61284,
    new Map([
        [1, Buffer.from(votingPubKey, 'hex')],
        [2, Buffer.from(stakePubKey, 'hex')],
        [3, cardano_crypto_js_1.bech32.decode(rewardDestinationAddress.address).data],
        [4, Number(nonce)],
    ]),
];
exports.cborizeTxVotingRegistration = cborizeTxVotingRegistration;
const cborizeTxAuxiliaryVotingData = (txAuxiliaryData, signatureHex) => [
    new Map([
        cborizeTxVotingRegistration(txAuxiliaryData),
        [61285, new Map([[1, Buffer.from(signatureHex, 'hex')]])],
    ]),
    [],
];
exports.cborizeTxAuxiliaryVotingData = cborizeTxAuxiliaryVotingData;
//# sourceMappingURL=shelley-transactions.js.map