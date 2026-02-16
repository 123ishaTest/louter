export enum LouterErrorType {
  UnrecognizedContentType = 'UnrecognizedContentType',
  InvalidYaml = 'InvalidYaml',
  MissingGlobalIdKey = 'MissingGlobalIdKey',
  ZodValidationFailed = 'ZodValidationFailed',
  DuplicateId = 'DuplicateId',
}

export interface LouterError {
  file: string;
  type: LouterErrorType;
  message: string;
}
