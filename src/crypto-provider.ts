
import HdNode, {_HdNode} from './helpers/hd-node'
import { validateMnemonic, isMnemonicInPaperWalletFormat } from './mnemonic'
import { UnexpectedError, UnexpectedErrorReason } from './errors';
import CachedDeriveXpubFactory from './CachedDeriveXpubFactory';
import {encode} from 'borc'
import { xpub2pub, xpub2ChainCode, isShelleyPath, indexIsHardened} from './helpers/addresses';

import {
  ShelleySignedTransactionStructured,
  cborizeTxWitnesses,
  cborizeTxAuxiliaryVotingData,
  cborizeTxVotingRegistration,
  ShelleyTxAux,
} from './shelley-transactions'

import {
    sign as signMsg,
    derivePrivate,
    xpubToHdPassphrase,
    base58,
    getBootstrapAddressAttributes,
    blake2b,
    mnemonicToRootKeypair,
    decodePaperWalletMnemonic
  } from 'cardano-crypto.js'
  
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
}

const enum WalletName {
    LEDGER = 'Ledger',
    TREZOR = 'Trezor',
    MNEMONIC = 'Mnemonic',
  }
  

const guessDerivationSchemeFromMnemonic = (mnemonic) => {
    return mnemonic.split(' ').length === 12 ? derivationSchemes.v1 : derivationSchemes.v2
}

const mnemonicToWalletSecretDef = async (mnemonic) => {
    if (!validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic format')
    }
    if (await isMnemonicInPaperWalletFormat(mnemonic)) {
        mnemonic = await decodePaperWalletMnemonic(mnemonic)
    }

    const derivationScheme = guessDerivationSchemeFromMnemonic(mnemonic)
    const rootSecret = await mnemonicToRootKeypair(mnemonic, derivationScheme.ed25519Mode)

    return {
        rootSecret,
        derivationScheme,
    }
}


export const getCryptoProvider = async (mnemonic, networkId) => {
    const walletSecretDef = await mnemonicToWalletSecretDef(mnemonic)
    const network = {
        networkId,
    }
    return await ShelleyJsCryptoProvider({
        walletSecretDef,
        network,
        config: { shouldExportPubKeyBulk: true },
    })
}

const ShelleyJsCryptoProvider = async ({
    walletSecretDef: {rootSecret, derivationScheme},
    network,
    config,
  }) => {
    const masterHdNode = HdNode(rootSecret)
  
    const isHwWallet = () => false
  
    const getWalletName = (): WalletName.MNEMONIC => WalletName.MNEMONIC
  
    const getWalletSecret = () => masterHdNode.toBuffer()
  
    const getDerivationScheme = () => derivationScheme
  
    const getVersion = () => null
  
    const deriveXpub = CachedDeriveXpubFactory(
      derivationScheme,
      config.shouldExportPubKeyBulk,
      (derivationPaths) => {
        return derivationPaths.map((path) => deriveHdNode(path).extendedPublicKey)
      }
    )
  
    function deriveHdNode(derivationPath): _HdNode {
      return derivationPath.reduce(deriveChildHdNode, masterHdNode)
    }
  
    function deriveChildHdNode(hdNode: _HdNode, childIndex: number): _HdNode {
      const result = derivePrivate(hdNode.toBuffer(), childIndex, derivationScheme.ed25519Mode)
  
      return HdNode(result)
    }
  
    async function sign(message, keyDerivationPath): Promise<Buffer> {
      const hdNode = await deriveHdNode(keyDerivationPath)
      const messageToSign = Buffer.from(message, 'hex')
      return signMsg(messageToSign, hdNode.toBuffer())
    }
  
    // eslint-disable-next-line require-await
    async function signTx(txAux, addressToPathMapper): Promise<any> {
      const structuredTx = await signTxGetStructured(txAux, addressToPathMapper)
      const tx = {
        txBody: encode(structuredTx).toString('hex'),
        txHash: structuredTx.getId(),
      }
      return tx
    }
  
    function getHdPassphrase(): Buffer {
      return xpubToHdPassphrase(masterHdNode.extendedPublicKey)
    }
  
    const prepareShelleyWitness = async (
      txHash,
      path
    ): Promise<any> => {
      const signature = await sign(txHash, path)
      const xpub = await deriveXpub(path)
      const publicKey = xpub2pub(xpub)
      return {publicKey, signature}
    }
  
    const prepareByronWitness = async (
      txHash,
      path,
      address
    ): Promise<any> => {
      const signature = await sign(txHash, path)
      const xpub = await deriveXpub(path)
      const publicKey = xpub2pub(xpub)
      const chainCode = xpub2ChainCode(xpub)
      // TODO: check if this works for testnet, apparently it doesnt
      const addressAttributes = encode(getBootstrapAddressAttributes(base58.decode(address)))
      return {publicKey, signature, chainCode, addressAttributes}
    }
  
    const prepareWitnesses = async (txAux, addressToAbsPathMapper) => {
      const {inputs, certificates, withdrawals, getId} = txAux
      const txHash = getId()
      const _shelleyWitnesses = []
      const _byronWitnesses = []
  
      // TODO: we should create witnesses only with unique addresses
  
      inputs.forEach(({address}) => {
        const spendingPath = addressToAbsPathMapper(address)
        isShelleyPath(spendingPath)
          ? _shelleyWitnesses.push(prepareShelleyWitness(txHash, spendingPath))
          : _byronWitnesses.push(prepareByronWitness(txHash, spendingPath, address))
      })
      ;[...certificates, ...withdrawals].forEach(({stakingAddress}) => {
        const stakingPath = addressToAbsPathMapper(stakingAddress)
        _shelleyWitnesses.push(prepareShelleyWitness(txHash, stakingPath))
      })
  
      const shelleyWitnesses = await Promise.all(_shelleyWitnesses)
      const byronWitnesses = await Promise.all(_byronWitnesses)
      return {shelleyWitnesses, byronWitnesses}
    }
  
    async function prepareVotingAuxiliaryData(
      auxiliaryData
    ): Promise<any> {
      const cborizedRegistrationData = new Map([cborizeTxVotingRegistration(auxiliaryData)])
      const registrationDataHash = blake2b(encode(cborizedRegistrationData), 32).toString('hex')
      const stakingPath = auxiliaryData.rewardDestinationAddress.stakingPath
      const registrationDataWitness = await prepareShelleyWitness(registrationDataHash, stakingPath)
      const registrationDataSignature = registrationDataWitness.signature.toString('hex')
      const txAuxiliaryData = cborizeTxAuxiliaryVotingData(auxiliaryData, registrationDataSignature)
      return txAuxiliaryData
    }
  
    async function finalizeTxAuxWithMetadata(txAux): Promise<any> {
      if (!txAux.auxiliaryData) {
        return {
          finalizedTxAux: txAux,
          txAuxiliaryData: null,
        }
      }
      switch (txAux.auxiliaryData.type) {
        case 'CATALYST_VOTING': {
          const txAuxiliaryData = await prepareVotingAuxiliaryData(txAux.auxiliaryData)
          return {
            finalizedTxAux: ShelleyTxAux({
              ...txAux,
              auxiliaryDataHash: blake2b(encode(txAuxiliaryData), 32).toString('hex'),
            }),
            txAuxiliaryData,
          }
        }
        default:
          return new Error('This should be unreachable.')
      }
    }
  
    async function signTxGetStructured(
      txAux,
      addressToPathMapper
    ): Promise<any> {
      const {finalizedTxAux, txAuxiliaryData} = await finalizeTxAuxWithMetadata(txAux)
  
      const {shelleyWitnesses, byronWitnesses} = await prepareWitnesses(
        finalizedTxAux,
        addressToPathMapper
      )
      const txWitnesses = cborizeTxWitnesses(byronWitnesses, shelleyWitnesses)
  
      return ShelleySignedTransactionStructured(finalizedTxAux, txWitnesses, txAuxiliaryData)
    }
  
    function displayAddressForPath(absDerivationPath, stakingPath) {
      throw new UnexpectedError(UnexpectedErrorReason.UnsupportedOperationError, {
        message: 'Operation not supported',
      })
    }
  
    // eslint-disable-next-line require-await
    async function witnessPoolRegTx(
      txAux,
      addressToAbsPathMapper
    ): Promise<any> {
      throw new UnexpectedError(UnexpectedErrorReason.UnsupportedOperationError)
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
    }
  }