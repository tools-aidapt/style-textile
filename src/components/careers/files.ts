/** Upload rules, shared by both dropzones so they reject identically. */

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
