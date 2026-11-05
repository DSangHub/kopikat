# Put KopyCat on the App Store

This guide is for D Sang. It assumes you are comfortable following a checklist and that a Mac with Xcode is available for the last stretch. The website at [https://www.kopycat.app](https://www.kopycat.app) stays the same product. The iOS app is a shell around that site, plus phone features Apple expects to see in a real app.

Deploy the website **before** you upload a build. The app opens `https://www.kopycat.app/dashboard`. Reviewers will see whatever is live there. Account deletion, the privacy policy, the terms, and the NFC button all live on the website.

## What the iOS app adds

These run on the phone, not as a mobile browser tab:

- The iOS share sheet when someone shares a profile or a KopyPak.
- Core NFC, so an iPhone can read a KopyCat card and write a profile link onto a blank NFC card.
- The camera, to scan a KopyCat QR code.
- The system Contacts card, so Save contact adds a person on the iPhone.
- Sign in with Apple, using Apple's own sign-in sheet.
- Google and Facebook sign-in open in the system browser instead of a hidden web view.
- A light tap (haptic) when a share, copy, scan, or card write succeeds.
- An offline screen when the phone has no connection.
- A cream launch screen with the K mark.
- A black bar at the bottom of the app: Home, Scan, NFC, Card, Account.
- Universal links so `https://www.kopycat.app/p/...` and handoff links can open the app when it is installed. Someone without the app still gets the website.

The recipient of a card or QR code still does not need the app.

## 1. Publish the website first

1. Merge this branch and let Vercel deploy it.
2. In the Vercel project, set:
   - `NEXT_PUBLIC_APP_URL` = `https://www.kopycat.app`
   - `SUPABASE_SERVICE_ROLE_KEY` = the service role key from Supabase (Project Settings → API). This key deletes accounts. It must stay server-only. Never put it in a value that starts with `NEXT_PUBLIC_`.
   - `APPLE_TEAM_ID` = the 10-character Team ID from [developer.apple.com/account](https://developer.apple.com/account) (Membership details). Example shape: `AB12CD34EF`.
3. Redeploy after those variables are saved so the server picks them up.
4. In the Supabase SQL editor, run `db/reports.sql`. The app also creates that table the first time someone submits a report, if the database user is allowed to create tables.
5. Confirm these pages open:
   - `https://www.kopycat.app/privacy`
   - `https://www.kopycat.app/terms`
   - `https://www.kopycat.app/dashboard/account` (after signing in)
   - `https://www.kopycat.app/.well-known/apple-app-site-association` (this stays a 404 until `APPLE_TEAM_ID` is set, then it returns JSON)

`https://kopycat.app` currently redirects to `https://www.kopycat.app`. Apple will not follow that redirect when it checks universal links. Links you put on cards and QR codes should use `https://www.kopycat.app`.

## 2. Accounts and IDs only you can create

Apple will not accept the app until these exist. Nobody else can click them for you.

| Step | Where | What to enter |
| --- | --- | --- |
| Join the Apple Developer Program | [developer.apple.com/programs](https://developer.apple.com/programs) | The legal name you want on the store. The fee is Apple's, paid yearly. |
| Note the Team ID | Developer account → Membership | 10 letters or numbers. Put it in Vercel as `APPLE_TEAM_ID`. |
| Register the bundle ID | Certificates, Identifiers & Profiles → Identifiers → App IDs → + | Explicit App ID, bundle ID `app.kopycat`, name KopyCat. |
| Turn on capabilities for that App ID | Edit the App ID | Sign in with Apple, NFC Tag Reading, Associated Domains. Save. |
| Create a Sign in with Apple key | Keys → + | Enable Sign in with Apple. Download the `.p8` file once. Note the Key ID. |
| Accept the App Store agreements | App Store Connect → Business | Paid Apps agreement is required even when the app is free. Add tax and banking if Apple asks. |
| Create the app record | App Store Connect → Apps → + | Platform iOS, name KopyCat, language English, bundle ID `app.kopycat`, SKU `kopycat-ios`. |
| Make `privacy@kopycat.app` a real mailbox | Your email host | The privacy policy and terms use this address. If you use a different address, change `supportEmail` in `lib/site.ts`, deploy again, and use that address below. |

If `app.kopycat` is already taken, pick another bundle ID such as `app.kopycat.ios`. Then change `appId` in `capacitor.config.ts` and `bundleId` in `lib/site.ts`, run `npx cap sync ios`, and deploy the website again so the universal-link file matches.

## 3. Supabase sign-in, before reviewers try the buttons

In Supabase → Authentication → URL configuration:

- Site URL: `https://www.kopycat.app`
- Redirect URLs must include `https://www.kopycat.app/auth/callback` and `kopycat://auth-callback`

In Authentication → Providers → Apple:

- Turn the provider on.
- Add the Services ID you use for the website.
- In the client IDs list, include the iOS bundle ID `app.kopycat`. Native Sign in with Apple sends that bundle ID. Supabase rejects the token if it is missing.
- Generate the client secret from the `.p8` key, the Key ID, and the Team ID. Supabase's Apple provider page has the generator.

Google and Facebook stay as they are on the website. On iPhone they open in the system sign-in window and return through `kopycat://auth-callback`. Test each button on a phone before you submit. Email and password sign-in does not need those providers.

Create a reviewer account with email and password, then fill in a profile and at least one KopyPak that contains a document. Write the email and password into the review notes in section 8. Do not send that password in a public place.

## 4. Build, archive, and TestFlight

You need a Mac, the current Xcode from the Mac App Store, and the Apple ID that belongs to the developer team.

1. Install Xcode. Open it once and accept the license. In Xcode → Settings → Accounts, sign in with the developer Apple ID.
2. Copy this project onto the Mac (clone the GitHub repo and check out the branch that contains this file).
3. In Terminal, from the project folder:

   ```bash
   npm install
   npx cap sync ios
   npm run ios:open
   ```

   `cap sync` copies the offline page into the Xcode project and registers the native plugin. Open `ios/App/App.xcodeproj` if the last command does not open Xcode. This project uses Swift packages, so you open the `.xcodeproj`, not a CocoaPods workspace.

4. Wait until Xcode finishes resolving Swift packages (Capacitor and KopyCatNative). The first resolve downloads those packages.
5. Click the blue **App** project, then the **App** target, then **Signing & Capabilities**.
   - Team: your developer team.
   - Bundle Identifier: `app.kopycat`.
   - Signing should say it is automatic.
   - You should see Sign in with Apple, Associated Domains (`applinks:www.kopycat.app` and `applinks:kopycat.app`), and NFC Tag Reading. They come from `ios/App/App/App.entitlements`. If a capability shows an error, the App ID in section 2 is missing that capability. Turn it on in the developer portal, then come back and let Xcode refresh the profile.
6. At the top of Xcode, set the run destination to **Any iOS Device (arm64)**. A simulator cannot be archived.
7. Menu **Product → Archive**. If the archive item is grey, the destination is still a simulator.
8. When the Organizer opens, select the archive → **Distribute App** → **App Store Connect** → **Upload**. Leave the default options (strip symbols, upload symbols). Xcode manages the certificate.
9. In App Store Connect, open the app → **TestFlight**. Processing usually takes a few minutes and can take longer. If Apple asks about encryption, answer that the app does not use non-exempt encryption. The project already sets that in Info.plist (`ITSAppUsesNonExemptEncryption` = false) because KopyCat only uses normal HTTPS.
10. Add yourself as an internal tester and install the build from the TestFlight app on a physical iPhone (iPhone 7 or newer for NFC).

Each upload needs a new build number. In Xcode, target **App** → **General** → **Identity**, raise **Build** (`CURRENT_PROJECT_VERSION`) by one. Leave **Version** at `1.0` until you ship a later release. Then archive again.

### What to try in TestFlight

- Sign in with the reviewer email account. Sign out is on Account.
- Sign in with Apple on a second test if you want that button checked.
- Open Phone Tap / QR, or the Card tab, and write your profile link to a blank NFC card. Read it back with the NFC tab.
- Scan a KopyCat QR code with the Scan tab.
- Open a profile and tap Save contact. iOS shows its contact card. Saving is your choice.
- Share a profile and confirm the iOS share sheet appears.
- Turn on airplane mode. You should get the offline screen or the offline banner.
- Delete a throwaway account from Account. Type `DELETE` in capitals. The public profile should disappear. Do this with a test account, not your only admin login.

## 5. App Store listing copy

Paste these into App Store Connect → the iOS app → version page. Limits are Apple's.

**Name** (7 of 30 characters)

```text
KopyCat
```

**Subtitle** (25 of 30)

```text
Tap it. Kopy it. Keep it.
```

**Promotional text** (141 of 170). You can change this later without a new review.

```text
Write a KopyPak onto an NFC card, scan a QR code, and share your professional profile from iPhone. The person you meet does not need the app.
```

**Description**

```text
KopyCat is the professional handoff app for people who meet people. Build a KopyPak once: your contact details, files, links, listings, and the next step. Share it from your iPhone by NFC card, QR code, or the share sheet.

The person who receives it opens a page in their browser. They do not install KopyCat. They can save you to Contacts, call, email, and send you a lead while the conversation is still fresh.

KopyCat on iPhone lets you:

- Write your profile or a KopyPak link onto a blank NFC card
- Read a KopyCat card with a tap
- Scan a KopyCat QR code with the camera
- Share through the iOS share sheet
- Save a professional to the Contacts app
- Sign in with Apple
- Delete your account inside the app

Built for realtors, contractors, account executives, insurance agents, and freelancers.

Your profile and the files you place in a KopyPak are public to anyone with the link, card, or code. Keep private documents off the profile.
```

**Keywords** (94 of 100). Apple separates these with commas. Do not add spaces, and do not repeat the name KopyCat.

```text
nfc,qr code,business card,realtor,contractor,insurance,leads,contact,profile,handoff,freelance
```

**Category**

- Primary: Business
- Secondary: Productivity

**URLs**

- Marketing URL: `https://www.kopycat.app`
- Support URL: `https://www.kopycat.app/privacy`
- Privacy Policy URL: `https://www.kopycat.app/privacy`
- Copyright: `2026 D Sang` (use the legal name on the developer account if it is different)

**Age rating**

Answer the questionnaire this way: no violence, sexual content, profanity, horror, gambling, alcohol, drugs, or contests. Unrestricted web access: No. The app stays on kopycat.app and opens other links in Safari. User-generated content: Yes, because professionals publish profiles. The profile page has Report profile. Reports are stored for you to review with:

```sql
SELECT created_at, profile_slug, reason, details, reporter_email
FROM profile_reports
ORDER BY created_at DESC;
```

There is no social feed and no follow button, so there is no separate block list.

**Price:** Free. There are no in-app purchases and no links to buy digital goods. A physical NFC card, if you sell one later, is a physical product and is not sold inside this app.

## 6. Screenshot sizes

Apple scales one large set down to the smaller phones and iPads. Because this project runs on iPhone and iPad, upload both required sets. Use PNG or JPEG with no transparency. One to ten images per set. Portrait is the right shape for KopyCat.

| Device | Required | Portrait pixels |
| --- | --- | --- |
| iPhone 6.9-inch (iPhone 16 Pro Max, 17 Pro Max, and the current large phones) | Yes | 1320 × 2868, or 1290 × 2796, or 1260 × 2736 |
| iPad 13-inch | Yes, because the app runs on iPad | 2064 × 2752, or 2048 × 2732 |

Smaller iPhone and iPad sizes are optional. Leave them empty and App Store Connect scales the required set.

In the simulator, pick an iPhone whose screenshot is one of the 6.9-inch sizes and an iPad Pro 13-inch. Use **File → Save Screen** (or Cmd-S) and check the pixel size before you upload. Suggested shots, in this order:

1. The dashboard after sign-in.
2. A finished public profile.
3. Phone Tap / QR, including the button that writes an NFC card.
4. A KopyPak with its documents.
5. The bottom bar visible, so review and customers can see Scan and NFC.

You can add a caption above the screenshot in a design tool. Keep the caption short: "Write your card", "Scan a QR", "Share the whole profile".

## 7. Privacy nutrition label

Answer from what the app actually does. KopyCat does not use a tracking SDK, ads, or analytics. Data below is collected because the account and profile are stored for the product. It is linked to the user. It is used for app functionality. It is not used for tracking.

**Data used to track you:** No.

**Contact info**

- Name. Yes. Linked. App functionality. The profile name, and names people type into a lead form.
- Email address. Yes. Linked. App functionality. The account email, a public email, and lead emails.
- Phone number. Yes. Linked. App functionality. Optional on the profile, and optional on a lead.
- Physical address. No. The location field is a city or region someone types, not a map location.
- Other user contact info. Yes. Linked. App functionality. Company and job title.

**Identifiers**

- User ID. Yes. Linked. App functionality. The account id from sign-in.
- Device ID. No.

**User content**

- Photos or videos. Yes. Linked. App functionality. Only when someone uploads a JPG or PNG into a KopyPak. The camera scanner does not upload frames.
- Other user content. Yes. Linked. App functionality. Bio, KopyPak text, lead messages, and profile reports.
- Audio, gameplay, customer support files. No.

**Do not declare these.** The app does not collect them:

- Contacts (the address book). Save contact only shows Apple's sheet so the user can store a card on the phone.
- Precise location, coarse location, browsing history, search history, purchases, financial info, health, sensitive info, crash data, performance data, product interaction, advertising data.

**Camera, NFC, and Contacts prompts** are on the phone so the feature can run. The purpose strings are in `ios/App/App/Info.plist`, with Spanish in `ios/App/App/es.lproj/InfoPlist.strings`. The privacy manifest is `ios/App/App/PrivacyInfo.xcprivacy`.

## 8. Review notes

Paste this into App Review Information. Fill in the blanks.

```text
Demo account
Email: [reviewer email]
Password: [reviewer password]

Sign-in also offers Sign in with Apple, Google, and Facebook. Email sign-in above is enough to review the app.

How to see the native features
The black bar at the bottom is part of the iOS app: Home, Scan, NFC, Card, Account.
Scan opens the camera and reads a KopyCat QR code.
NFC reads a KopyCat card. Card opens Phone Tap / QR, where "Write to NFC card" programs a blank NFC tag with this account's profile link.
NFC needs a physical iPhone 7 or newer and a blank NFC tag. The simulator has no NFC radio and no camera.
Save contact on a public profile opens the iOS Contacts card.

Account deletion (guideline 5.1.1)
Dashboard → Account, or the Account tab. Type DELETE and tap Delete my account. This removes the profile, KopyPaks, uploaded files, leads sent to that profile, and the sign-in. Please use a separate test account if you need to confirm deletion, so this demo login stays available.

Privacy and terms
https://www.kopycat.app/privacy
https://www.kopycat.app/terms
Both are linked from sign-in, sign-up, Account, and every public profile.

Payments
The app does not sell digital goods, subscriptions, or credits. There is no external purchase link.

Why this is not a website wrapper
The installed app adds Core NFC reading and writing, a camera QR scanner, the system share sheet, Contacts saving, Sign in with Apple, haptics, an offline screen, and universal links. Profiles are still opened from kopycat.app so a recipient does not need the app. The same pages are what the professional edits.
```

## 9. Checklist only you can finish

- [ ] Apple Developer Program is active, and the Team ID is in Vercel as `APPLE_TEAM_ID`.
- [ ] App ID `app.kopycat` exists with Sign in with Apple, NFC Tag Reading, and Associated Domains.
- [ ] App Store Connect record exists, and the paid-apps agreement, tax, and banking are done.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set on Vercel and the site has been redeployed.
- [ ] `NEXT_PUBLIC_APP_URL` is `https://www.kopycat.app`.
- [ ] Supabase Apple provider lists the bundle ID `app.kopycat`, and the redirect list includes `kopycat://auth-callback`.
- [ ] `https://www.kopycat.app/.well-known/apple-app-site-association` returns JSON, not a redirect and not a 404.
- [ ] `privacy@kopycat.app` receives mail, or `lib/site.ts` points at a mailbox you read.
- [ ] `db/reports.sql` has been run.
- [ ] A demo account has a profile and a KopyPak. The password is only in App Review notes.
- [ ] You tested NFC write, QR scan, Save contact, share, and account deletion on a physical iPhone.
- [ ] Screenshots are uploaded at the 6.9-inch iPhone size and the 13-inch iPad size.
- [ ] The nutrition labels in section 7 are entered in App Store Connect.
- [ ] Version 1.0 build 1 (or the build you archived) is selected on the version page.
- [ ] You clicked Add for Review.

## 10. What still needs a Mac

This repository was prepared on a machine without macOS or Xcode. These items are done in the project and were not compiled here:

- The Xcode project at `ios/App/App.xcodeproj` was generated with Capacitor 8 and `npx cap sync ios`.
- Swift packages resolve from the internet the first time Xcode opens the project. That download did not run here.
- Archive, signing, TestFlight upload, and a run on the simulator or a device did not run here.
- `npm run typecheck` and `npm run build` are the checks that did run. See the pull request for the result.

If Xcode reports a missing plugin, run `npx cap sync ios` again and rebuild. The plugin class `KopyCatNativePlugin` has to be listed in `ios/App/App/capacitor.config.json`, which sync writes for you.

## Where the pieces live

| Piece | File |
| --- | --- |
| App id, site URL, offline page | `capacitor.config.ts` |
| Offline and local shell pages | `native/www/` |
| Native Swift (NFC, QR, Contacts, share, Apple sign-in) | `packages/kopycat-native/` |
| Buttons that call the phone | `components/IosAppChrome.tsx`, `components/NfcWriteButton.tsx`, `components/SaveContactButton.tsx`, `components/SocialSignIn.tsx` |
| Account deletion | `app/dashboard/account/page.tsx`, `lib/account.ts` |
| Privacy and terms | `app/privacy/page.tsx`, `app/terms/page.tsx` |
| Universal links | `app/.well-known/apple-app-site-association/route.ts` |
| Icons and launch art | `native/brand/`, copied into `ios/App/App/Assets.xcassets` |
| Redraw the icon | `python3 scripts/generate-brand-assets.py` (needs Pillow), then copy the PNGs into the asset catalog again |

After you change the website, deploy Vercel, then run `npx cap sync ios` only if you changed `capacitor.config.ts` or the files in `native/www`. Day-to-day copy and layout changes on the website show up in the app without a new App Store build, because the app loads the live site. Changes to the Swift plugin, icons, permissions, or the bundle ID need a new archive.
