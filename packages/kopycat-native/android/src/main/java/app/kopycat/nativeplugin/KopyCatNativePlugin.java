package app.kopycat.nativeplugin;

import android.app.Activity;
import androidx.activity.ComponentActivity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import android.nfc.tech.NdefFormatable;
import android.os.Build;
import android.provider.ContactsContract;
import android.provider.Settings;
import android.view.HapticFeedbackConstants;
import android.view.View;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResult;
import androidx.appcompat.app.AlertDialog;
import androidx.browser.customtabs.CustomTabsIntent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning;
import java.nio.charset.StandardCharsets;

/**
 * Android counterparts to the iOS shell: the system share sheet, Play services
 * QR scanner (no camera permission in this app), Contacts insert intent, NFC
 * read/write when the radio exists, and a Chrome Custom Tab for sign-in.
 * Sign in with Apple's native sheet is iOS-only; Android uses the browser flow.
 */
@CapacitorPlugin(name = "KopyCatNative")
public class KopyCatNativePlugin extends Plugin {
    private PluginCall authCall;
    private boolean authReturning;
    private PluginCall nfcCall;
    private String nfcWriteUrl;
    private String nfcSuccessMessage;
    private AlertDialog nfcDialog;
    private OnBackPressedCallback backCallback;

    @Override
    public void load() {
        backCallback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                Activity activity = getActivity();
                if (activity == null || bridge == null || bridge.getWebView() == null) {
                    setEnabled(false);
                    return;
                }
                if (bridge.getWebView().canGoBack()) {
                    bridge.getWebView().goBack();
                    return;
                }
                setEnabled(false);
                activity.finish();
            }
        };
        Activity activity = getActivity();
        if (activity instanceof ComponentActivity component) {
            component.getOnBackPressedDispatcher().addCallback(component, backCallback);
        }
    }

    @PluginMethod
    public void share(PluginCall call) {
        String url = call.getString("url");
        String text = call.getString("text");
        String title = call.getString("title");
        StringBuilder body = new StringBuilder();
        if (text != null && !text.trim().isEmpty()) body.append(text.trim());
        if (url != null && !url.trim().isEmpty()) {
            if (body.length() > 0) body.append('\n');
            body.append(url.trim());
        }
        if (body.length() == 0 && title != null) body.append(title);
        if (body.length() == 0) {
            call.reject("Nothing to share.", "invalid");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("The share sheet is unavailable.", "unavailable");
            return;
        }
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_TEXT, body.toString());
        if (title != null && !title.trim().isEmpty()) send.putExtra(Intent.EXTRA_SUBJECT, title);
        try {
            activity.startActivity(Intent.createChooser(send, title == null ? "KopyCat" : title));
            JSObject result = new JSObject();
            // Android does not report whether the person finished sharing.
            result.put("completed", true);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("The share sheet could not open.", "unavailable", error);
        }
    }

    @PluginMethod
    public void haptic(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Haptics are unavailable.", "unavailable");
            return;
        }
        String style = call.getString("style", "medium");
        int feedback = HapticFeedbackConstants.CONTEXT_CLICK;
        if ("heavy".equals(style)) feedback = HapticFeedbackConstants.LONG_PRESS;
        else if ("light".equals(style)) feedback = HapticFeedbackConstants.CLOCK_TICK;
        else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if ("success".equals(style)) feedback = HapticFeedbackConstants.CONFIRM;
            else if ("warning".equals(style) || "error".equals(style)) feedback = HapticFeedbackConstants.REJECT;
        } else if ("error".equals(style) || "warning".equals(style)) {
            feedback = HapticFeedbackConstants.LONG_PRESS;
        }
        View view = activity.getWindow().getDecorView();
        view.performHapticFeedback(feedback);
        call.resolve();
    }

    @PluginMethod
    public void scanQr(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("The scanner is unavailable.", "unavailable");
            return;
        }
        GmsBarcodeScannerOptions options = new GmsBarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
            .enableAutoZoom()
            .build();
        GmsBarcodeScanning.getClient(activity, options)
            .startScan()
            .addOnSuccessListener(barcode -> {
                String value = barcode.getRawValue();
                if (value == null || value.trim().isEmpty()) {
                    call.reject("That code was empty.", "invalid");
                    return;
                }
                JSObject result = new JSObject();
                result.put("text", value);
                call.resolve(result);
            })
            .addOnCanceledListener(() -> call.reject("User canceled", "canceled"))
            .addOnFailureListener(error -> call.reject(
                error.getMessage() == null ? "The scanner could not open. Google Play services is required." : error.getMessage(),
                "unavailable",
                error
            ));
    }

    @PluginMethod
    public void readNfc(PluginCall call) {
        startNfc(call, null, call.getString("message", "Hold the back of your phone near a KopyCat card."), "KopyCat link found.");
    }

    @PluginMethod
    public void writeNfc(PluginCall call) {
        String url = call.getString("url");
        if (!isKopyCatHttps(url)) {
            call.reject("Only an https://www.kopycat.app link can be written to a card.", "invalid");
            return;
        }
        startNfc(
            call,
            url,
            call.getString("message", "Hold the back of your phone near a blank NFC card."),
            call.getString("successMessage", "This KopyCat card is ready.")
        );
    }

    @PluginMethod
    public void saveContact(PluginCall call) {
        String name = call.getString("name", "").trim();
        if (name.isEmpty()) {
            call.reject("A name is required.", "invalid");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_INSERT);
        intent.setType(ContactsContract.RawContacts.CONTENT_TYPE);
        intent.putExtra(ContactsContract.Intents.Insert.NAME, clip(name, 120));
        putIfPresent(intent, ContactsContract.Intents.Insert.PHONE, call.getString("phone"), 40);
        putIfPresent(intent, ContactsContract.Intents.Insert.EMAIL, call.getString("email"), 254);
        putIfPresent(intent, ContactsContract.Intents.Insert.COMPANY, call.getString("company"), 120);
        putIfPresent(intent, ContactsContract.Intents.Insert.JOB_TITLE, call.getString("title"), 120);
        String url = call.getString("url");
        if (url != null && !url.trim().isEmpty()) intent.putExtra(ContactsContract.Intents.Insert.NOTES, clip(url, 300));
        startActivityForResult(call, intent, "saveContactResult");
    }

    @ActivityCallback
    private void saveContactResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_CANCELED) call.reject("User canceled", "canceled");
        else call.resolve();
    }

    @PluginMethod
    public void signInWithApple(PluginCall call) {
        call.reject("Sign in with Apple on Android uses the browser sign-in window.", "unavailable");
    }

    @PluginMethod
    public void openAuthSession(PluginCall call) {
        if (authCall != null) {
            call.reject("Sign-in is already open.", "busy");
            return;
        }
        String url = call.getString("url");
        Uri uri = url == null ? null : Uri.parse(url);
        if (uri == null || !"https".equals(uri.getScheme())) {
            call.reject("The sign-in address is invalid.", "invalid");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Sign-in is unavailable.", "unavailable");
            return;
        }
        authCall = call;
        authReturning = false;
        try {
            CustomTabsIntent tabs = new CustomTabsIntent.Builder().setShowTitle(true).build();
            tabs.launchUrl(activity, uri);
        } catch (Exception error) {
            authCall = null;
            call.reject("The sign-in window could not open.", "unavailable", error);
        }
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Settings is unavailable.", "unavailable");
            return;
        }
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.fromParts("package", activity.getPackageName(), null));
        activity.startActivity(intent);
        call.resolve();
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        Uri data = intent == null ? null : intent.getData();
        if (data == null || !"kopycat".equals(data.getScheme())) return;
        authReturning = true;
        PluginCall call = authCall;
        authCall = null;
        if (call != null) {
            JSObject result = new JSObject();
            result.put("url", data.toString());
            call.resolve(result);
        }
    }

    @Override
    protected void handleOnResume() {
        PluginCall call = authCall;
        if (call == null || authReturning) return;
        Activity activity = getActivity();
        if (activity == null) return;
        activity.getWindow().getDecorView().post(() -> {
            if (authCall == call && !authReturning) {
                authCall = null;
                call.reject("User canceled", "canceled");
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        stopNfc(null, null);
        if (backCallback != null) backCallback.setEnabled(false);
    }

    private void startNfc(PluginCall call, String writeUrl, String prompt, String success) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("NFC is unavailable.", "unavailable");
            return;
        }
        PackageManager packages = activity.getPackageManager();
        if (!packages.hasSystemFeature(PackageManager.FEATURE_NFC)) {
            call.reject("This phone cannot read or write NFC cards.", "unavailable");
            return;
        }
        NfcAdapter adapter = NfcAdapter.getDefaultAdapter(activity);
        if (adapter == null) {
            call.reject("This phone cannot read or write NFC cards.", "unavailable");
            return;
        }
        if (!adapter.isEnabled()) {
            call.reject("Turn on NFC in your phone settings, then try again.", "nfc_disabled");
            return;
        }
        if (nfcCall != null) {
            call.reject("An NFC session is already open.", "busy");
            return;
        }
        nfcCall = call;
        nfcWriteUrl = writeUrl;
        nfcSuccessMessage = success;
        activity.runOnUiThread(() -> {
            AlertDialog dialog = new AlertDialog.Builder(activity)
                .setTitle("KopyCat")
                .setMessage(prompt)
                .setNegativeButton(android.R.string.cancel, (d, which) -> stopNfc("canceled", "User canceled"))
                .setOnCancelListener(d -> stopNfc("canceled", "User canceled"))
                .create();
            nfcDialog = dialog;
            dialog.show();
        });
        int flags = NfcAdapter.FLAG_READER_NFC_A
            | NfcAdapter.FLAG_READER_NFC_B
            | NfcAdapter.FLAG_READER_NFC_F
            | NfcAdapter.FLAG_READER_NFC_V
            | NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK;
        try {
            adapter.enableReaderMode(activity, this::onTag, flags, null);
        } catch (Exception error) {
            stopNfc("unavailable", "NFC could not start on this phone.");
        }
    }

    private void onTag(Tag tag) {
        PluginCall call = nfcCall;
        if (call == null) return;
        String writeUrl = nfcWriteUrl;
        try {
            NdefMessage message = writeUrl == null ? null : new NdefMessage(new NdefRecord[] { NdefRecord.createUri(writeUrl) });
            Ndef ndef = Ndef.get(tag);
            if (ndef != null) {
                ndef.connect();
                if (writeUrl == null) {
                    NdefMessage stored = ndef.getNdefMessage();
                    ndef.close();
                    String text = firstLink(stored);
                    if (text == null) stopNfc("nfc_failed", "This card has no KopyCat link.");
                    else finishNfc(text);
                    return;
                }
                if (!ndef.isWritable()) {
                    ndef.close();
                    stopNfc("nfc_failed", "This card is locked or cannot store a link.");
                    return;
                }
                if (message.toByteArray().length > ndef.getMaxSize()) {
                    ndef.close();
                    stopNfc("nfc_failed", "This card is too small for the link.");
                    return;
                }
                ndef.writeNdefMessage(message);
                ndef.close();
                finishNfc(writeUrl);
                return;
            }
            NdefFormatable format = NdefFormatable.get(tag);
            if (format != null && message != null) {
                format.connect();
                format.format(message);
                format.close();
                finishNfc(writeUrl);
                return;
            }
            stopNfc("nfc_failed", writeUrl == null ? "This card has no KopyCat link." : "This card cannot store a link.");
        } catch (Exception error) {
            stopNfc("nfc_failed", error.getMessage() == null ? "The NFC card could not be used." : error.getMessage());
        }
    }

    private void finishNfc(String text) {
        Activity activity = getActivity();
        String success = nfcSuccessMessage == null ? "Done." : nfcSuccessMessage;
        PluginCall call = nfcCall;
        clearNfcSession();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                AlertDialog dialog = nfcDialog;
                if (dialog == null) return;
                dialog.setMessage(success);
                dialog.setOnCancelListener(null);
                View cancel = dialog.getButton(AlertDialog.BUTTON_NEGATIVE);
                if (cancel != null) cancel.setVisibility(View.GONE);
                activity.getWindow().getDecorView().postDelayed(() -> {
                    if (nfcDialog == dialog) {
                        dialog.dismiss();
                        nfcDialog = null;
                    }
                }, 700);
            });
        }
        if (call != null) {
            JSObject result = new JSObject();
            result.put("text", text);
            call.resolve(result);
        }
    }

    private void stopNfc(String code, String message) {
        PluginCall call = nfcCall;
        clearNfcSession();
        Activity activity = getActivity();
        if (activity != null) activity.runOnUiThread(() -> {
            if (nfcDialog != null) {
                nfcDialog.setOnCancelListener(null);
                nfcDialog.dismiss();
                nfcDialog = null;
            }
        });
        if (call != null && code != null) call.reject(message, code);
    }

    private void clearNfcSession() {
        nfcCall = null;
        nfcWriteUrl = null;
        Activity activity = getActivity();
        if (activity == null) return;
        NfcAdapter adapter = NfcAdapter.getDefaultAdapter(activity);
        if (adapter != null) {
            try {
                adapter.disableReaderMode(activity);
            } catch (Exception ignored) {
                // The session was already closed.
            }
        }
    }

    private static String firstLink(NdefMessage message) {
        if (message == null) return null;
        for (NdefRecord record : message.getRecords()) {
            Uri uri = record.toUri();
            if (uri != null) return uri.toString();
            byte[] payload = record.getPayload();
            if (payload != null && payload.length > 0) {
                String text = new String(payload, StandardCharsets.UTF_8);
                int https = text.indexOf("https://");
                if (https >= 0) return text.substring(https).trim();
            }
        }
        return null;
    }

    private static boolean isKopyCatHttps(String value) {
        if (value == null) return false;
        Uri uri = Uri.parse(value);
        if (!"https".equals(uri.getScheme()) || uri.getUserInfo() != null) return false;
        String host = uri.getHost();
        return "www.kopycat.app".equals(host) || "kopycat.app".equals(host);
    }

    private static void putIfPresent(Intent intent, String key, String value, int max) {
        if (value != null && !value.trim().isEmpty()) intent.putExtra(key, clip(value, max));
    }

    private static String clip(String value, int max) {
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max);
    }

}
