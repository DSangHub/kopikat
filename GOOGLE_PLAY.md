# Put KopyCat on Google Play

This is a checklist for D Sang, written on November 6, 2026. It describes the Android project in this repository and the Play Console steps that still belong to the account owner. It is not a statement that Google has approved the app, and it is not a substitute for the current Play policy pages.

The Android app is the same Capacitor shell as the iPhone app. It opens `https://www.kopycat.app/dashboard` and adds phone features around that site. The website and the iOS project stay in place. Deploying this branch is a separate decision. This work does not publish the app and does not change Vercel or Supabase.

## What was checked against Google’s pages

These are the pages used while preparing the project. Policies change. Re-read them in Play Console before you submit.

- Target API: [Meet Google Play's target API level requirement](https://developer.android.com/google/play/requirements/target-sdk) and [Play Console Help](https://support.google.com/googleplay/android-developer/answer/11926878). As of those pages, from August 31, 2026 new apps and updates must target Android 16 (API 36) or higher. An extension to November 1, 2026 was offered. Today is after that date. This project sets `compileSdkVersion` and `targetSdkVersion` to **36** in `android/variables.gradle`. The debug APK built here reports `targetSdkVersion='36'` and `minSdkVersion` 24.
- Account deletion: [Play Console Help](https://support.google.com/googleplay/android-developer/answer/13327111) and the [User Data policy](https://support.google.com/googleplay/android-developer/answer/18258653). Apps that create accounts need an in-app deletion path and a web link. In-app deletion is Dashboard → Account, type `DELETE`. The public explanation page in this branch is `/account-deletion`. After you deploy the website, the Play Console URL is `https://www.kopycat.app/account-deletion`. That URL is not live until this web change is deployed.
- Store graphics: [Add preview assets](https://support.google.com/googleplay/android-developer/answer/9866151).
- 16 KB page size: [Support 16 KB page sizes](https://developer.android.com/guide/practices/page-sizes). Apps that ship native code and target API 35+ must support 16 KB pages. Starting February 1, 2027, updates that do not support it cannot be released. The debug APK built here contained **no `.so` native libraries**. Play’s own note says Java/Kotlin-only apps are compatible by default. The QR scanner is provided by Google Play services at runtime, which is Google’s package, not a library file inside this APK. Re-check the bundle in Play Console’s app bundle explorer after you upload an AAB. That check was not run here.
- New personal developer accounts: [App testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465). Personal Play Console accounts created after November 13, 2023 must run a closed test with at least 12 testers opted in continuously for the preceding 14 days before applying for production. Organization accounts are described there as not being under that same test requirement. Confirm which kind of account you have.

## What the Android app does

| Action | How it works | Permission in the debug APK |
| --- | --- | --- |
| Share | Android share sheet | None |
| QR scan | Google Play services code scanner. KopyCat receives the text of the code, not a photo. The first scan can ask Play services to download a scanner module. Phones without Play services get an error instead of a camera preview. | Camera was **not** declared. `ACCESS_NETWORK_STATE` is present because a library merged it. It is a normal permission, not a prompt. |
| Save contact | Opens the system contact editor with the name, phone, email, company, and title filled in. The profile URL is placed in notes. KopyCat does not read the address book. | Contacts was **not** declared. |
| NFC read and write | Shown only when you tap NFC or Write to NFC card. If the phone has no NFC radio, the app says so and continues. If NFC is switched off, it asks you to turn it on. Blank NDEF tags can be formatted. Only `https://www.kopycat.app` and `https://kopycat.app` links can be written. | `android.permission.NFC`, and the NFC feature is marked **not required**, so phones without NFC can still install. |
| Haptics | The system haptic feedback API. | Vibrate was **not** declared. |
| Offline | The same offline page as iOS when the site cannot load, plus the offline banner when the browser reports no network. | Internet, which the site needs. |
| Sign-in | Google, Facebook, and Apple open in a Chrome Custom Tab and return through `kopycat://auth-callback`. There is no iOS-style Sign in with Apple sheet on Android. Email sign-in stays inside the page. | None beyond Internet. |
| Back | The system back button walks the page history, then leaves the app. | None. |
| Links | `https://www.kopycat.app/...` and `https://kopycat.app/...` for profiles, handoffs, the dashboard, login, and signup can open the app. Verified App Links work only after you publish `assetlinks.json` with the real signing fingerprint. Until then, Android may ask which app should open the link. | None. |

The debug APK also contains `app.kopycat.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. That comes from an AndroidX library so its internal receiver is not exported. It is not a user-facing permission.

## 1. Deploy the website before testers use the app

The app loads the live site. Account deletion, the Android bottom bar, and `assetlinks.json` are in this branch. They show up in the installed app only after this website is deployed. This document does not deploy it.

When you do deploy, set `ANDROID_APP_LINK_SHA256` on the server only after Play Console shows you a fingerprint. Leave it empty until then. The route `/.well-known/assetlinks.json` returns 404 while that variable is empty, on purpose, so a made-up fingerprint is not published.

`NEXT_PUBLIC_APP_URL` should stay `https://www.kopycat.app`.

Supabase redirect URLs already need `kopycat://auth-callback` for the iPhone app. The Android sign-in window uses that same redirect. If it is not on the allow list, Google, Facebook, and Apple sign-in from the app will not finish.

## 2. Create your upload key yourself

Do not commit a keystore. `android/.gitignore` ignores `*.jks`, `*.keystore`, and `keystore.properties`.

On your computer, outside this repository:

```bash
keytool -genkeypair -v \
  -keystore "$HOME/kopycat-upload-keystore.jks" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload
```

Copy `android/keystore.properties.example` to `android/keystore.properties` and point `storeFile` at that keystore. Use the passwords you just chose. `./gradlew bundleRelease` from the `android` directory will sign the release bundle only when that file exists. Without it, the release bundle is unsigned and Play will reject it.

Enroll in **Play App Signing** when Play Console asks. Google holds the app signing key. You keep the upload key. If you lose the upload key, you reset it through Play Console. You do not put Google’s app signing key in this repo.

## 3. App Links fingerprint

Verified links need the SHA-256 of the certificate that signs the app users install.

1. After the first upload, open Play Console → your app → Test and release → App integrity → App signing.
2. Copy the SHA-256 certificate fingerprint under **App signing key certificate**. That is the one Android will check. The upload key fingerprint is a different value.
3. Set `ANDROID_APP_LINK_SHA256` on the server to that fingerprint. Several fingerprints can be separated by commas if you also want a debug certificate for your own phone.
4. Deploy the website and open `https://www.kopycat.app/.well-known/assetlinks.json`. It should be JSON, not a redirect, and the package name should be `app.kopycat`.
5. On a phone where the app is installed from Play, check with `adb shell pm get-app-links app.kopycat` or the Play Console’s Digital Asset Links tool. A debug APK signed on another machine will not match the Play signing certificate.

The fingerprint format is 32 colon-separated hex bytes, for example `AB:CD:...` (32 pairs). This repository does not contain one.

## 4. Build the file Play accepts

Play wants an Android App Bundle (`.aab`), not the debug APK.

On a machine with Android Studio or the Android SDK (API 36), JDK 21, and this repo:

```bash
npm install
npx cap sync android
cd android
# after android/keystore.properties exists
./gradlew bundleRelease
```

The bundle is `android/app/build/outputs/bundle/release/app-release.aab`.

Each Play upload needs a higher `versionCode` in `android/app/build.gradle`. The first project value is `1`, version name `1.0`. Raise `versionCode` by one for every upload. You can leave the version name at `1.0` until you want the store to show a new version.

`npx cap sync android` refreshes the plugin list and the offline page. Run it after changing `capacitor.config.ts`, `native/www`, or the Android plugin. Ordinary website copy changes appear after the website deploy, without a new Play upload, because the app loads `https://www.kopycat.app`.

### Debug APK from this preparation

A debug APK was built with `./gradlew assembleDebug` on Linux using Android SDK platform 36 and build-tools 36.0.0. It is signed with the SDK’s debug keystore, which is not an upload key. Do not upload it to production.

- Package: `app.kopycat`
- versionName `1.0`, versionCode `1`
- targetSdk 36, minSdk 24
- Path in this environment: `/opt/cursor/artifacts/kopycat-debug.apk` (about 5 MB)

It was not installed on a phone or emulator. NFC, the QR scanner, Custom Tabs, and the back button were not exercised on a device. `assembleDebug` compiled them.

## 5. Listing draft

Paste and edit this in Play Console. The short description limit is 80 characters. The full description limit is 4000.

**App name:** KopyCat

**Short description** (74 characters)

```text
Share your KopyPak by NFC, QR, or the share sheet. Recipients need no app.
```

**Full description**

```text
KopyCat is the professional handoff app for people who meet people. Build a KopyPak once: your contact details, files, links, listings, and the next step. Share it from your phone by NFC card, QR code, or Android's share sheet.

The person who receives it opens a page in their browser. They do not install KopyCat. They can save you to Contacts, call, email, and send you a lead while the conversation is still fresh.

On Android, KopyCat lets you:

- Write your profile or a KopyPak link onto a blank NFC card, on phones that have NFC
- Read a KopyCat card
- Scan a KopyCat QR code
- Share through the Android share sheet
- Save a professional with the Contacts app
- Sign in with Google, Facebook, or Apple in the browser, or with email
- Delete your account inside the app

Built for realtors, contractors, account executives, insurance agents, and freelancers.

Your profile and the files you place in a KopyPak are public to anyone with the link, card, or code. Keep private documents off the profile.
```

**Category:** Business. You can add a secondary tag if the console offers Productivity.

**Contact details**

- Website: `https://www.kopycat.app`
- Email: `privacy@kopycat.app` if that mailbox is real. If it is not, change `supportEmail` in `lib/site.ts`, deploy, and use the mailbox you actually read.
- Privacy policy URL: `https://www.kopycat.app/privacy` (deploy this branch first so the Android wording is included)
- Account deletion URL: `https://www.kopycat.app/account-deletion`

## 6. Graphics you still have to capture

Play’s help page requires, at minimum:

- A high-res icon: 512 × 512 PNG, 32-bit, up to 1 MB. A starting file is `native/brand/play/icon-512.png`. Confirm the console accepts it. Replace it if you want a different treatment.
- A feature graphic: 1024 × 500 JPEG or 24-bit PNG, no alpha. A starting file is `native/brand/play/feature-graphic.png`. It is a brand draft, not a screenshot of the running app.
- At least two screenshots across phone and other device types. Each side must be between 320 and 3840 pixels, JPEG or 24-bit PNG with no alpha, and the long side cannot be more than twice the short side.

To be eligible for the larger recommendation layouts, the same help page says apps need at least four screenshots of at least 1080 pixels, portrait 9:16 (for example 1080 × 1920) or landscape 16:9. Tablet and Chromebook sections can take up to 8 screenshots each. Four or more at 1080 pixels or above is what that page describes for large-screen eligibility. This app runs on phones and tablets because it does not restrict screen size. Capture phone screenshots at minimum. Add 7-inch and 10-inch tablet screenshots if you want those listings to look finished.

Suggested shots, from a phone with the app installed:

1. Dashboard after sign-in.
2. A public profile.
3. Phone Tap / QR, including Write to NFC card.
4. The bottom bar with Scan and NFC visible.

Do not add ranking claims, prices, or “best of” badges on the images. Screenshots must show the app itself.

No emulator screenshots were produced in this preparation.

## 7. Data safety guidance

Answer the form from the app you ship, after you deploy. The notes below are what this repository does. They are not a completed Play form.

**Data is sent off the phone to run the product.** The account and profile live in your database through Supabase, and the site is hosted on Vercel. That includes:

- Name, email address, phone number, and other contact details you type (company, title, location text)
- User ID from sign-in
- Files and photos you upload into a KopyPak (PDF, JPG, PNG up to 750 KB)
- Messages and bios
- Leads other people submit on your public profile (their name, email, phone, and message)
- Optional report details if someone reports a profile

This data is tied to the account or the profile. The app does not include an ads SDK or a product-analytics SDK. Do not answer “yes” to advertising or tracking unless you add those later.

**Not collected by KopyCat’s servers, based on this code:**

- The address book. Save contact only opens the system editor.
- Precise or coarse location. The location field is text someone types.
- Camera images. On Android the scanner is Play services. KopyCat gets the QR text when it is a KopyCat link.
- NFC radio identifiers. The card stores a link you already had.

**Uncertainties you should confirm before submitting the form:**

- Supabase and Vercel may keep ordinary server logs, which can include IP addresses. This repo does not configure those logs. If Play asks about device or other identifiers collected by your hosting, check those dashboards rather than guessing.
- Google Play services handles the QR scanner UI. The image is not posted to KopyCat. If the form asks whether a third-party SDK processes camera data on device, say that the code scanner does, and that KopyCat does not receive the image.
- Sign-in with Google, Facebook, or Apple sends the person to that provider. Email and password sign-in goes to Supabase. Describe the providers you leave enabled.
- Account deletion removes the profile, KopyPaks, uploaded files, leads sent to that profile, and the sign-in, when `SUPABASE_SERVICE_ROLE_KEY` is set. Messages that person sent to someone else’s profile stay on that other account. The privacy policy says this. If deletion cannot reach Supabase, the account page says the account is still active. Do not claim deletion succeeded in that case.

**Data deletion section in the form:** provide `https://www.kopycat.app/account-deletion` and say users can also delete the account inside the app without emailing first.

## 8. What only you can do in Play Console

- Create or use a Google Play Console developer account and pay Google’s registration fee.
- Choose a personal or organization account. If the account is a personal one created after November 13, 2023, plan for the closed test of 12 opted-in testers for 14 days before production.
- Create the app with package name `app.kopycat`. That name is permanent.
- Complete the store listing, graphics, content rating questionnaire, target audience, ads declaration (this app has no ad SDK), news declaration if asked, and Data safety.
- Turn on Play App Signing and upload the AAB signed with your upload key.
- Put the app signing certificate SHA-256 into `ANDROID_APP_LINK_SHA256` and deploy the website.
- Add a privacy policy URL and the account deletion URL.
- Run an internal test on your own phone: sign-in, share, QR scan, NFC on a phone that has it, save contact, back button, airplane mode, and account deletion on a throwaway account.
- Submit for review when the listing is complete. Review can still reject the app. Nothing in this file guarantees acceptance.

## 9. Phone test, after you install a build

- Sign in with email. Try Google or Apple only if those Supabase providers already work on the website.
- Share a profile and confirm Android’s share sheet opens.
- Scan a KopyCat QR code. The scanner UI is Google’s, not a screen we drew.
- On a phone with NFC, write your profile link to a blank card and read it back. On a phone without NFC, the buttons should explain that, and the rest of the app should still open.
- Save a contact and confirm the Contacts app opens with the fields filled in. You choose whether to save.
- Press back from a profile to the previous page, then from the first page until the app closes.
- Turn on airplane mode and confirm the offline screen or banner.
- Delete a test account from Account. Type `DELETE`. Do not use your only login.

## Where the pieces live

| Piece | File |
| --- | --- |
| App id, live site, Android user agent | `capacitor.config.ts` |
| SDK levels | `android/variables.gradle` |
| Manifest, links, backup off, cleartext off | `android/app/src/main/AndroidManifest.xml` |
| Upload-key signing, only if `keystore.properties` exists | `android/app/build.gradle` |
| NFC, share, QR, contacts, back | `packages/kopycat-native/android` |
| Public deletion page | `app/account-deletion/page.tsx` |
| App Link file | `app/.well-known/assetlinks.json/route.ts` |
| Launcher and splash art | `android/app/src/main/res` |
| Play listing drafts | `native/brand/play/` |
| Redraw Android art from the existing mark | `python3 scripts/generate-android-assets.py` |
