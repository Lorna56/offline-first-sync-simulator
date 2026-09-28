export type PDPStatus = "Active" | "Expiring" | "Missing";

export interface Submission {
  submission_uuid: string;
  urban_council: string;
  pdp_status: PDPStatus;
  expiry_year: number | null;
  field_officer_timestamp: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_PDP_STATUSES: PDPStatus[] = [
  "Active",
  "Expiring",
  "Missing",
];

export function validateSubmission(
  submission: Submission
): ValidationResult {
  const errors: string[] = [];

  if (!submission.submission_uuid) {
    errors.push("submission_uuid is required");
  } else if (!isValidUUID(submission.submission_uuid)) {
    errors.push("submission_uuid must be a valid UUID");
  }

  if (!submission.urban_council?.trim()) {
    errors.push("urban_council is required");
  }

  if (!VALID_PDP_STATUSES.includes(submission.pdp_status)) {
    errors.push(
      `pdp_status must be one of: ${VALID_PDP_STATUSES.join(", ")}`
    );
  }

  if (
    submission.expiry_year !== null &&
    (!Number.isInteger(submission.expiry_year) ||
      submission.expiry_year < 1900)
  ) {
    errors.push("expiry_year must be a valid year or null");
  }

  if (!submission.field_officer_timestamp) {
    errors.push("field_officer_timestamp is required");
  } else if (
    Number.isNaN(Date.parse(submission.field_officer_timestamp))
  ) {
    errors.push("field_officer_timestamp must be a valid ISO timestamp");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value);
}