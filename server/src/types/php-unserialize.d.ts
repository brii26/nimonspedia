// Type declarations for php-unserialize package
declare module 'php-unserialize' {
  export function unserializeSession(data: string): any;
  export function unserialize(data: string): any;
}