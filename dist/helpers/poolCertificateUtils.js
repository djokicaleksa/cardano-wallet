"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipv4AddressToBuf = (ipv4Address) => {
    const splitAddressNumbers = ipv4Address.split('.').map((x) => +x);
    return Buffer.from(splitAddressNumbers);
};
var TxRelayType;
(function (TxRelayType) {
    TxRelayType[TxRelayType["SINGLE_HOST_IP"] = 0] = "SINGLE_HOST_IP";
    TxRelayType[TxRelayType["SINGLE_HOST_NAME"] = 1] = "SINGLE_HOST_NAME";
    TxRelayType[TxRelayType["MULTI_HOST_NAME"] = 2] = "MULTI_HOST_NAME";
})(TxRelayType = exports.TxRelayType || (exports.TxRelayType = {}));
exports.ipv6AddressToBuf = (ipv6Address) => {
    const ipv6NoSemicolons = ipv6Address.replace(/:/g, '');
    const ipv6Buf = Buffer.from(ipv6NoSemicolons, 'hex');
    const copy = Buffer.from(ipv6Buf);
    const endianSwappedBuf = copy.swap32();
    return endianSwappedBuf;
};
//# sourceMappingURL=poolCertificateUtils.js.map