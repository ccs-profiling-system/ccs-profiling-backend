/**
 * UUID v7 Generator Utility
 * 
 * Generates RFC-compliant UUID v7 values with time-ordering properties.
 * UUID v7 provides better database performance compared to random UUIDs (v4)
 * due to sequential ordering based on timestamps.
 * 
 * UUID v7 Format:
 * - 48 bits: Unix timestamp in milliseconds
 * - 12 bits: Random data for sub-millisecond ordering
 * - 2 bits: Version (0b111 = 7)
 * - 62 bits: Random data
 * 
 */

/**
 * Generates a UUID v7 (time-ordered UUID)
 * 
 * @returns A UUID v7 string in the format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
 * 
 * @example
 * const id = generateUUIDv7();
 * // Returns: "018e5d7a-7c3f-7a1b-8c9d-0123456789ab"
 */
export function generateUUIDv7(): string {
  // Get current timestamp in milliseconds
  const timestamp = Date.now();
  
  // Generate random bytes for the random portions
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  
  // Build UUID v7 components
  
  // Timestamp (48 bits = 6 bytes)
  const timestampHex = timestamp.toString(16).padStart(12, '0');
  
  // Random data for sub-millisecond ordering (12 bits)
  const randA = randomBytes[0] & 0x0f; // 4 bits
  const randB = randomBytes[1]; // 8 bits
  
  // Version and variant bits
  // Version 7: 0111 (4 bits)
  const version = 0x7;
  
  // Variant: 10xx (2 bits for RFC 4122 variant)
  const variant = (randomBytes[2] & 0x3f) | 0x80; // Set variant bits to 10
  
  // Remaining random data (62 bits = ~8 bytes)
  const randC = randomBytes[3];
  const randD = randomBytes[4];
  const randE = randomBytes[5];
  const randF = randomBytes[6];
  const randG = randomBytes[7];
  const randH = randomBytes[8];
  const randI = randomBytes[9];
  
  // Format as UUID string: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
  const uuid = [
    // time_high (32 bits)
    timestampHex.substring(0, 8),
    '-',
    // time_mid (16 bits)
    timestampHex.substring(8, 12),
    '-',
    // time_low_and_version (16 bits: 12 bits time + 4 bits version)
    version.toString(16) + randA.toString(16).padStart(1, '0') + randB.toString(16).padStart(2, '0'),
    '-',
    // clock_seq_and_variant (16 bits: 2 bits variant + 14 bits random)
    variant.toString(16).padStart(2, '0') + randC.toString(16).padStart(2, '0'),
    '-',
    // node (48 bits random)
    randD.toString(16).padStart(2, '0') +
    randE.toString(16).padStart(2, '0') +
    randF.toString(16).padStart(2, '0') +
    randG.toString(16).padStart(2, '0') +
    randH.toString(16).padStart(2, '0') +
    randI.toString(16).padStart(2, '0'),
  ].join('');
  
  return uuid;
}

/**
 * Extracts the timestamp from a UUID v7
 * 
 * @param uuid - A UUID v7 string
 * @returns The timestamp in milliseconds, or null if invalid
 * 
 * @example
 * const timestamp = extractTimestampFromUUIDv7("018e5d7a-7c3f-7a1b-8c9d-0123456789ab");
 * // Returns: 1234567890123
 */
export function extractTimestampFromUUIDv7(uuid: string): number | null {
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return null;
  }
  
  // Extract timestamp from first 12 hex characters (48 bits)
  const timestampHex = uuid.replace(/-/g, '').substring(0, 12);
  const timestamp = parseInt(timestampHex, 16);
  
  return timestamp;
}

/**
 * Validates if a string is a valid UUID v7
 * 
 * @param uuid - A string to validate
 * @returns True if the string is a valid UUID v7
 * 
 * @example
 * isValidUUIDv7("018e5d7a-7c3f-7a1b-8c9d-0123456789ab"); // true
 * isValidUUIDv7("invalid-uuid"); // false
 */
export function isValidUUIDv7(uuid: string): boolean {
  // Check format: xxxxxxxx-xxxx-7xxx-[89ab]xxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
