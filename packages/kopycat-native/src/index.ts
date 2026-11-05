import { registerPlugin } from "@capacitor/core";
import type { KopyCatNativePlugin } from "./definitions";
import { KopyCatNativeWeb } from "./web";

export * from "./definitions";

export const KopyCatNative = registerPlugin<KopyCatNativePlugin>("KopyCatNative", {
  web: () => new KopyCatNativeWeb(),
});
