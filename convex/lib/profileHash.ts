/**
 * Generates a deterministic hash string from a values profile's sensitivity settings.
 * Used to key analysis cache entries — when a user changes their profile,
 * the hash changes and cached analyses are automatically invalidated.
 *
 * The hash is a simple concatenation of the 6 sensitivity values in a fixed order.
 * This is intentionally not cryptographic — it just needs to be deterministic and unique
 * per combination of settings.
 */

interface SensitivitySettings {
  violence: number;
  language: number;
  sexualContent: number;
  substanceUse: number;
  darkThemes: number;
  religiousSensitivity: number;
}

export function computeProfileHash(settings: SensitivitySettings): string {
  return [
    settings.violence,
    settings.language,
    settings.sexualContent,
    settings.substanceUse,
    settings.darkThemes,
    settings.religiousSensitivity,
  ].join("-");
}
