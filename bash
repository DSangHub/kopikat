git clone https://github.com/DSangHub/kopikat.git
cd kopikat
# create capacitor.config.ts with the content above
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
npx cap sync npx cap open ios      # Xcode (Mac required)
npx cap open android  # Android Studio
