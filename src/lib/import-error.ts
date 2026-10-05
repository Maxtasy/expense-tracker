// An error whose message was written for the user (and is already translated). Import actions
// return only these to the client; anything else -- notably raw Drizzle/SQL errors -- is logged
// and replaced by a generic "import failed" message.
export class ImportError extends Error {}

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_FILE_MB = MAX_IMPORT_FILE_BYTES / (1024 * 1024);
