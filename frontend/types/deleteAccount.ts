/**
 * Type definitions for the delete-account Edge Function
 */

export interface DeleteAccountDeletionSummary {
  attendanceAnonymized: number;
  storageFilesDeleted: string[];
  feedPostsDeleted: number;
  feedLikesDeleted: number;
  feedCommentsDeleted: number;
  pointsDeleted: number;
  rankTransactionsDeleted: number;
  profileDeleted: boolean;
  authUserDeleted: boolean;
}

export interface DeleteAccountSuccessResponse {
  success: true;
  message: string;
  deletionSummary: DeleteAccountDeletionSummary;
}

export interface DeleteAccountErrorResponse {
  success: false;
  error: string;
  code: string;
  debug?: any;
}

export type DeleteAccountResponse =
  | DeleteAccountSuccessResponse
  | DeleteAccountErrorResponse;
