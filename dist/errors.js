"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseError extends Error {
    constructor(params) {
        super();
        // this.message = params?.message
        // this.stack = params?.causedBy && `\nError caused by:\n${params.causedBy.stack}`
    }
}
exports.BaseError = BaseError;
var UnexpectedErrorReason;
(function (UnexpectedErrorReason) {
    UnexpectedErrorReason["UnsupportedOperationError"] = "UnsupportedOperationError";
    UnexpectedErrorReason["ParamsValidationError"] = "ParamsValidationError";
    UnexpectedErrorReason["InvalidCertificateType"] = "InvalidCertificateType";
    UnexpectedErrorReason["AccountExplorationError"] = "AccountExplorationError";
    UnexpectedErrorReason["BulkExportCreationError"] = "BulkExportCreationError";
    UnexpectedErrorReason["InvalidTxPlanType"] = "InvalidTxPlanType";
    UnexpectedErrorReason["InvalidRelayType"] = "InvalidRelayType";
    UnexpectedErrorReason["CannotConstructTxPlan"] = "CannotConstructTxPlan";
})(UnexpectedErrorReason = exports.UnexpectedErrorReason || (exports.UnexpectedErrorReason = {}));
class UnexpectedError extends BaseError {
    constructor(reason, params) {
        super(params);
        this.name = reason;
    }
}
exports.UnexpectedError = UnexpectedError;
//# sourceMappingURL=errors.js.map