export type ValidationResponse = {
  valid: boolean;
  extractedName: string;
  extractedUniversity: string;
  isUnmsm: boolean;
};

export type ValidateStudentDocumentRequest = {
  email: string;
  documentBase64: string;
  fileName: string;
};
