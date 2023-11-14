/**
 * lower cases the incoming address
 */
export const addr = (address: string) => address.toLowerCase();

/**
 * check if both addresses match
 */
export const matches = (a: string, b: string) => addr(a) === addr(b);
