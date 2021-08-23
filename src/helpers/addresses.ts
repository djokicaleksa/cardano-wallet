import {
  packBaseAddress,
  getAddressType,
  AddressTypes,
  base58,
  bech32,
  getPubKeyBlake2b224Hash,
  getShelleyAddressNetworkId,
} from 'cardano-crypto.js'

import {encode} from 'borc'

const HARDENED_THRESHOLD = 0x80000000;

const enum NetworkId {
    MAINNET = 1,
    TESTNET = 0,
  }


export const xpub2pub = (xpub: Buffer) => xpub.slice(0, 32)

export const xpub2ChainCode = (xpub: Buffer) => xpub.slice(32, 64)

export const encodeAddress = (address: Buffer) => {
    const addressType = getAddressType(address)
    if (addressType === AddressTypes.BOOTSTRAP) {
      return base58.encode(address)
    }
    const addressPrefixes: {[key: number]: string} = {
      [AddressTypes.BASE]: 'addr',
      [AddressTypes.POINTER]: 'addr',
      [AddressTypes.ENTERPRISE]: 'addr',
      [AddressTypes.REWARD]: 'stake',
    }
    const isTestnet = getShelleyAddressNetworkId(address) === NetworkId.TESTNET
    const addressPrefix = `${addressPrefixes[addressType]}${isTestnet ? '_test' : ''}`
    return bech32.encode(addressPrefix, address)
  }

const xpub2blake2b224Hash = (xpub: Buffer) => getPubKeyBlake2b224Hash(xpub2pub(xpub))

export const baseAddressFromXpub = (
    spendXpub: Buffer,
  stakeXpub: Buffer,
  networkId: NetworkId
  ) => {
      const addrBuffer = packBaseAddress(
          xpub2blake2b224Hash(spendXpub),
          xpub2blake2b224Hash(stakeXpub),
          networkId
          )
  return encodeAddress(addrBuffer)
}


export const isShelleyPath = (path) => path[0] - HARDENED_THRESHOLD === 1852
export const indexIsHardened = (index) => index >= HARDENED_THRESHOLD
export const isShelleyFormat = (address: string): boolean => {
    return address.startsWith('addr') || address.startsWith('stake')
  }