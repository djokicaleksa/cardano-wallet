export type OptionalParams = {
    message?: string
    causedBy?: Error
}
  
export class BaseError extends Error {
    constructor(params?: OptionalParams) {
      super()
      // this.message = params?.message
      // this.stack = params?.causedBy && `\nError caused by:\n${params.causedBy.stack}`
    }
}

export enum UnexpectedErrorReason {
  UnsupportedOperationError = 'UnsupportedOperationError',
  ParamsValidationError = 'ParamsValidationError',
  InvalidCertificateType = 'InvalidCertificateType',
  AccountExplorationError = 'AccountExplorationError',
  BulkExportCreationError = 'BulkExportCreationError',
  InvalidTxPlanType = 'InvalidTxPlanType',
  InvalidRelayType = 'InvalidRelayType',
  CannotConstructTxPlan = 'CannotConstructTxPlan',
}


export class UnexpectedError extends BaseError {
  constructor(reason, params?) {
    super(params)
    this.name = reason
  }
}
