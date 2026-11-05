export interface KopyCatShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

export interface KopyCatShareResult {
  completed: boolean;
}

export interface KopyCatQrOptions {
  prompt?: string;
  cancelLabel?: string;
}

export interface KopyCatQrResult {
  text: string;
}

export interface KopyCatNfcReadOptions {
  message?: string;
}

export interface KopyCatNfcReadResult {
  text: string;
}

export interface KopyCatNfcWriteOptions {
  url: string;
  message?: string;
  successMessage?: string;
}

export interface KopyCatContactOptions {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
  url?: string;
}

export interface KopyCatAppleResult {
  identityToken: string;
  nonce: string;
  user: string;
  email?: string;
  givenName?: string;
  familyName?: string;
}

export interface KopyCatAuthSessionOptions {
  url: string;
  callbackScheme: string;
}

export interface KopyCatAuthSessionResult {
  url: string;
}

export interface KopyCatHapticOptions {
  style?: "light" | "medium" | "heavy" | "success" | "warning" | "error";
}

export interface KopyCatNativePlugin {
  share(options: KopyCatShareOptions): Promise<KopyCatShareResult>;
  haptic(options?: KopyCatHapticOptions): Promise<void>;
  scanQr(options?: KopyCatQrOptions): Promise<KopyCatQrResult>;
  readNfc(options?: KopyCatNfcReadOptions): Promise<KopyCatNfcReadResult>;
  writeNfc(options: KopyCatNfcWriteOptions): Promise<void>;
  saveContact(options: KopyCatContactOptions): Promise<void>;
  signInWithApple(): Promise<KopyCatAppleResult>;
  openAuthSession(options: KopyCatAuthSessionOptions): Promise<KopyCatAuthSessionResult>;
  openSettings(): Promise<void>;
}
