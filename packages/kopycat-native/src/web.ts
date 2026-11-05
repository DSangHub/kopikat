import { WebPlugin } from "@capacitor/core";
import type {
  KopyCatAppleResult,
  KopyCatAuthSessionOptions,
  KopyCatAuthSessionResult,
  KopyCatContactOptions,
  KopyCatHapticOptions,
  KopyCatNativePlugin,
  KopyCatNfcReadOptions,
  KopyCatNfcReadResult,
  KopyCatNfcWriteOptions,
  KopyCatQrOptions,
  KopyCatQrResult,
  KopyCatShareOptions,
  KopyCatShareResult,
} from "./definitions";

export class KopyCatNativeWeb extends WebPlugin implements KopyCatNativePlugin {
  async share(options: KopyCatShareOptions): Promise<KopyCatShareResult> {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title: options.title, text: options.text, url: options.url });
      return { completed: true };
    }
    throw this.unavailable("share");
  }

  async haptic(_options?: KopyCatHapticOptions): Promise<void> {
    return;
  }

  async scanQr(_options?: KopyCatQrOptions): Promise<KopyCatQrResult> {
    throw this.unavailable("scanQr");
  }

  async readNfc(_options?: KopyCatNfcReadOptions): Promise<KopyCatNfcReadResult> {
    throw this.unavailable("readNfc");
  }

  async writeNfc(_options: KopyCatNfcWriteOptions): Promise<void> {
    throw this.unavailable("writeNfc");
  }

  async saveContact(_options: KopyCatContactOptions): Promise<void> {
    throw this.unavailable("saveContact");
  }

  async signInWithApple(): Promise<KopyCatAppleResult> {
    throw this.unavailable("signInWithApple");
  }

  async openAuthSession(_options: KopyCatAuthSessionOptions): Promise<KopyCatAuthSessionResult> {
    throw this.unavailable("openAuthSession");
  }

  async openSettings(): Promise<void> {
    throw this.unavailable("openSettings");
  }
}
