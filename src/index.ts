import { getCryptoProvider } from './crypto-provider';
import { ShelleyBaseAddressProvider } from './shelley-address-provider';
import { HARDENED_THRESHOLD } from './constants';
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
const enum NetworkId {
    MAINNET = 1,
    TESTNET = 0,
  }
  function toBip32StringPath(derivationPath) {
    return `m/${derivationPath
      .map((item) => (item % HARDENED_THRESHOLD) + (item >= HARDENED_THRESHOLD ? "'" : ''))
      .join('/')}`
  }
  
const main = async () => {
    const mnemonic24Words = 'castle tonight fork exile fiber sea aisle other poem illegal large obtain frost suffer guilt tent nasty use scissors ice animal february daughter ride';
    const cp = await getCryptoProvider(mnemonic24Words, NetworkId.MAINNET);
    const addrGen = ShelleyBaseAddressProvider(cp, 0, false)
    for (let i = 0; i < 10; i++ ){
      const { address, path } = await addrGen(i);
      console.log(`#${i} Address: ${address} - Path: ${toBip32StringPath(path)}`);
    }
};

main();


// #0 Address: addr1qx64glhdky8meemu7eym7exg4lz3r3tgyj77dnclmpsvugpl892vdqerrl7zzz2zfswzdu9v76h7ydpzgsurrejm9jqqjxvsq6 - Path: m/1852'/1815'/0'/0/0
// #1 Address: addr1qy37up3pa2hk4ud6axnhdsuud3cleqjaqtvfym73ld2us5el892vdqerrl7zzz2zfswzdu9v76h7ydpzgsurrejm9jqqmwkrav - Path: m/1852'/1815'/0'/0/1
// #2 Address: addr1q8vsvv54a0k0e2qrwnkjgl0vfertvqzk9rjfd79yufd70s3l892vdqerrl7zzz2zfswzdu9v76h7ydpzgsurrejm9jqq5q9uw0 - Path: m/1852'/1815'/0'/0/2
// #3 Address: addr1q9tlry6axn0mfgsgra442zfckrxnne7878s0ydgx43f277pl892vdqerrl7zzz2zfswzdu9v76h7ydpzgsurrejm9jqqg4k4l2 - Path: m/1852'/1815'/0'/0/3
// #4 Address: addr1q9qxh6jsu9d4ydpcrms99vrt2jq2wyva4k9egfc2rd6swcpl892vdqerrl7zzz2zfswzdu9v76h7ydpzgsurrejm9jqqhqxvc9 - Path: m/1852'/1815'/0'/0/4
// #5 Address: addr1qyeq9pq2sr843sqex7epmzc58x8lh0ax3hakha8upf948sel892vdqerrl7zzz2zfswzdu9v76h7ydpzgsurrejm9jqq79qavx - Path: m/1852'/1815'/0'/0/5
// #6 Address: addr1q9r7g67zxyegaqsye829qgvc2zgatnv90k0v5uvrwderxppl892vdqerrl7zzz2zfswzdu9v76h7ydpzgsurrejm9jqqu7g79v - Path: m/1852'/1815'/0'/0/6
// #7 Address: addr1qxta60qandgmjpejlnv84pkv3gpv3uv46n866j30kjmpqdpl892vdqerrl7zzz2zfswzdu9v76h7ydpzgsurrejm9jqq72cc93 - Path: m/1852'/1815'/0'/0/7
// #8 Address: addr1qxgmpyh4mggf45vtvl50fgffgvs3px5qv3xgxc2ap58apqpl892vdqerrl7zzz2zfswzdu9v76h7ydpzgsurrejm9jqqm4fva5 - Path: m/1852'/1815'/0'/0/8
// #9 Address: addr1q9209zyny260075n7cuk66k44wcdf6r8f39l4uv3f4p8kzfl892vdqerrl7zzz2zfswzdu9v76h7ydpzgsurrejm9jqq03rt26 - Path: m/1852'/1815'/0'/0/9