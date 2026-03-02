/**
 * Represents an authenticated or guest user.
 */
export interface User {
  id: string;
  displayName: string;
  email: string;
  isGuest: boolean;
}
