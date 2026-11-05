import AuthenticationServices
import AVFoundation
import Capacitor
import Contacts
import ContactsUI
import CoreNFC
import CryptoKit
import UIKit

/// Native features that keep KopyCat from being a website wrapper:
/// system share sheet, Core NFC read/write, camera QR scan,
/// Contacts save sheet, Sign in with Apple, and auth browser sessions.
@objc(KopyCatNativePlugin)
public class KopyCatNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KopyCatNativePlugin"
    public let jsName = "KopyCatNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "haptic", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "scanQr", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readNfc", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeNfc", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveContact", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signInWithApple", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAuthSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]

    private var nfc: NfcCoordinator?
    private var qr: QrScanViewController?
    private var contactSaver: ContactSaver?
    private var appleSignIn: AppleSignInCoordinator?
    private var authSession: AuthSessionCoordinator?

    @objc func share(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            var items: [Any] = []
            if let urlString = call.getString("url"), let url = URL(string: urlString) {
                items.append(url)
            }
            if let text = call.getString("text"), !text.isEmpty {
                items.append(text)
            }
            if items.isEmpty, let title = call.getString("title"), !title.isEmpty {
                items.append(title)
            }
            guard !items.isEmpty else {
                call.reject("Nothing to share.", "invalid")
                return
            }
            guard let presenter = self.bridge?.viewController else {
                call.reject("The share sheet is unavailable.", "unavailable")
                return
            }
            let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
            controller.completionWithItemsHandler = { _, completed, _, error in
                if let error = error {
                    call.reject(error.localizedDescription, "share_failed", error)
                    return
                }
                call.resolve(["completed": completed])
            }
            if let popover = controller.popoverPresentationController {
                popover.sourceView = presenter.view
                popover.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1)
                popover.permittedArrowDirections = []
            }
            presenter.present(controller, animated: true)
        }
    }

    @objc func haptic(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let style = call.getString("style") ?? "medium"
            switch style {
            case "success":
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            case "warning":
                UINotificationFeedbackGenerator().notificationOccurred(.warning)
            case "error":
                UINotificationFeedbackGenerator().notificationOccurred(.error)
            case "light":
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
            case "heavy":
                UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
            default:
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }
            call.resolve()
        }
    }

    @objc func scanQr(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.qr == nil else {
                call.reject("The camera is already open.", "busy")
                return
            }
            guard AVCaptureDevice.default(for: .video) != nil else {
                call.reject("This device has no camera.", "unavailable")
                return
            }
            let prompt = call.getString("prompt") ?? "Scan a KopyCat QR code"
            let cancelLabel = call.getString("cancelLabel") ?? "Cancel"
            let open: () -> Void = {
                guard let presenter = self.bridge?.viewController else {
                    call.reject("The camera is unavailable.", "unavailable")
                    return
                }
                let scanner = QrScanViewController(prompt: prompt, cancelLabel: cancelLabel)
                scanner.onResult = { [weak self] text in
                    self?.qr = nil
                    call.resolve(["text": text])
                }
                scanner.onCancel = { [weak self] in
                    self?.qr = nil
                    call.reject("User canceled", "canceled")
                }
                self.qr = scanner
                scanner.modalPresentationStyle = .fullScreen
                presenter.present(scanner, animated: true)
            }
            switch AVCaptureDevice.authorizationStatus(for: .video) {
            case .authorized:
                open()
            case .notDetermined:
                AVCaptureDevice.requestAccess(for: .video) { granted in
                    DispatchQueue.main.async {
                        if granted {
                            open()
                        } else {
                            call.reject("Camera access is off.", "denied")
                        }
                    }
                }
            default:
                call.reject("Camera access is off.", "denied")
            }
        }
    }

    @objc func readNfc(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard NFCNDEFReaderSession.readingAvailable else {
                call.reject("NFC is not available on this iPhone.", "unavailable")
                return
            }
            guard self.nfc == nil else {
                call.reject("An NFC session is already open.", "busy")
                return
            }
            let message = call.getString("message") ?? "Hold the top of your iPhone near a KopyCat card."
            let coordinator = NfcCoordinator(mode: .read, prompt: message, successMessage: "")
            coordinator.onSuccess = { [weak self] payload in
                self?.nfc = nil
                call.resolve(["text": payload])
            }
            coordinator.onFailure = { [weak self] code, message in
                self?.nfc = nil
                call.reject(message, code)
            }
            self.nfc = coordinator
            coordinator.start()
        }
    }

    @objc func writeNfc(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let urlString = call.getString("url"), let url = URL(string: urlString), Self.isKopyCatHttps(url) else {
                call.reject("Only an https://www.kopycat.app link can be written to a card.", "invalid")
                return
            }
            guard NFCNDEFReaderSession.readingAvailable else {
                call.reject("NFC is not available on this iPhone.", "unavailable")
                return
            }
            guard self.nfc == nil else {
                call.reject("An NFC session is already open.", "busy")
                return
            }
            let message = call.getString("message") ?? "Hold the top of your iPhone near a blank NFC card."
            let success = call.getString("successMessage") ?? "This KopyCat card is ready."
            let coordinator = NfcCoordinator(mode: .write(url), prompt: message, successMessage: success)
            coordinator.onSuccess = { [weak self] _ in
                self?.nfc = nil
                call.resolve()
            }
            coordinator.onFailure = { [weak self] code, message in
                self?.nfc = nil
                call.reject(message, code)
            }
            self.nfc = coordinator
            coordinator.start()
        }
    }

    @objc func saveContact(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let name = (call.getString("name") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard !name.isEmpty else {
                call.reject("A name is required.", "invalid")
                return
            }
            guard let presenter = self.bridge?.viewController else {
                call.reject("Contacts is unavailable.", "unavailable")
                return
            }
            guard self.contactSaver == nil else {
                call.reject("Contacts is already open.", "busy")
                return
            }
            let saver = ContactSaver(call: call) { [weak self] in
                self?.contactSaver = nil
            }
            self.contactSaver = saver
            saver.present(
                from: presenter,
                name: name,
                phone: call.getString("phone"),
                email: call.getString("email"),
                company: call.getString("company"),
                title: call.getString("title"),
                url: call.getString("url")
            )
        }
    }

    @objc func signInWithApple(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.appleSignIn == nil else {
                call.reject("Sign in with Apple is already open.", "busy")
                return
            }
            guard let presenter = self.bridge?.viewController else {
                call.reject("Sign in with Apple is unavailable.", "unavailable")
                return
            }
            let coordinator = AppleSignInCoordinator(anchor: presenter) { [weak self] in
                self?.appleSignIn = nil
            }
            self.appleSignIn = coordinator
            coordinator.start(call)
        }
    }

    @objc func openAuthSession(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let urlString = call.getString("url"), let url = URL(string: urlString), url.scheme == "https" else {
                call.reject("The sign-in address is invalid.", "invalid")
                return
            }
            let scheme = call.getString("callbackScheme") ?? "kopycat"
            guard let presenter = self.bridge?.viewController else {
                call.reject("Sign-in is unavailable.", "unavailable")
                return
            }
            guard self.authSession == nil else {
                call.reject("Sign-in is already open.", "busy")
                return
            }
            let coordinator = AuthSessionCoordinator(anchor: presenter) { [weak self] in
                self?.authSession = nil
            }
            self.authSession = coordinator
            coordinator.start(url: url, callbackScheme: scheme, call: call)
        }
    }

    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else {
                call.reject("Settings is unavailable.", "unavailable")
                return
            }
            UIApplication.shared.open(url) { _ in
                call.resolve()
            }
        }
    }

    private static func isKopyCatHttps(_ url: URL) -> Bool {
        guard url.scheme == "https", url.user == nil, url.password == nil else { return false }
        return url.host == "www.kopycat.app" || url.host == "kopycat.app"
    }
}

private final class NfcCoordinator: NSObject, NFCNDEFReaderSessionDelegate {
    enum Mode {
        case read
        case write(URL)
    }

    private let mode: Mode
    private let prompt: String
    private let successMessage: String
    private var session: NFCNDEFReaderSession?
    private let lock = NSLock()
    private var settled = false
    var onSuccess: ((String) -> Void)?
    var onFailure: ((String, String) -> Void)?

    init(mode: Mode, prompt: String, successMessage: String) {
        self.mode = mode
        self.prompt = prompt
        self.successMessage = successMessage
    }

    func start() {
        let session = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
        session.alertMessage = prompt
        self.session = session
        session.begin()
    }

    func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {}

    func readerSession(_ session: NFCNDEFReaderSession, didDetect tags: [NFCNDEFTag]) {
        guard let tag = tags.first else {
            fail(session, code: "nfc_failed", message: "No NFC tag was found.")
            return
        }
        session.connect(to: tag) { error in
            if let error = error {
                self.fail(session, code: "nfc_failed", message: error.localizedDescription)
                return
            }
            switch self.mode {
            case .read:
                tag.readNDEF { message, error in
                    if let error = error {
                        self.fail(session, code: "nfc_failed", message: error.localizedDescription)
                        return
                    }
                    guard let text = message.flatMap(Self.firstLink(in:)) else {
                        self.fail(session, code: "nfc_failed", message: "This card has no KopyCat link.")
                        return
                    }
                    self.succeed(session, text: text)
                }
            case .write(let url):
                tag.queryNDEFStatus { status, capacity, error in
                    if let error = error {
                        self.fail(session, code: "nfc_failed", message: error.localizedDescription)
                        return
                    }
                    guard status == .readWrite else {
                        self.fail(session, code: "nfc_failed", message: "This card is locked or cannot store a link.")
                        return
                    }
                    guard let payload = NFCNDEFPayload.wellKnownTypeURIPayload(url: url) else {
                        self.fail(session, code: "invalid", message: "This link cannot be written.")
                        return
                    }
                    let message = NFCNDEFMessage(records: [payload])
                    if message.length > capacity {
                        self.fail(session, code: "nfc_failed", message: "This card is too small for the link.")
                        return
                    }
                    tag.writeNDEF(message) { error in
                        if let error = error {
                            self.fail(session, code: "nfc_failed", message: error.localizedDescription)
                            return
                        }
                        self.succeed(session, text: url.absoluteString)
                    }
                }
            }
        }
    }

    func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        let code = (error as? NFCReaderError)?.code
        if code == .readerSessionInvalidationErrorUserCanceled {
            fail(session, code: "canceled", message: "User canceled", showSheet: false)
            return
        }
        if code == .readerSessionInvalidationErrorFirstNDEFTagRead {
            finishIfNeeded(code: "nfc_failed", message: "The NFC session ended.")
            return
        }
        finishIfNeeded(code: "nfc_failed", message: error.localizedDescription)
    }

    private func succeed(_ session: NFCNDEFReaderSession, text: String) {
        guard markSettled() else { return }
        session.alertMessage = successMessage.isEmpty ? "KopyCat link found." : successMessage
        session.invalidate()
        onSuccess?(text)
    }

    private func fail(_ session: NFCNDEFReaderSession, code: String, message: String, showSheet: Bool = true) {
        guard markSettled() else { return }
        if showSheet {
            session.invalidate(errorMessage: message)
        }
        onFailure?(code, message)
    }

    private func finishIfNeeded(code: String, message: String) {
        guard markSettled() else { return }
        onFailure?(code, message)
    }

    private func markSettled() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        if settled { return false }
        settled = true
        return true
    }

    private static func firstLink(in message: NFCNDEFMessage) -> String? {
        for record in message.records {
            if let url = record.wellKnownTypeURIPayload() {
                return url.absoluteString
            }
        }
        return nil
    }
}

private final class QrScanViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onResult: ((String) -> Void)?
    var onCancel: (() -> Void)?

    private let promptText: String
    private let cancelText: String
    private let session = AVCaptureSession()
    private var preview: AVCaptureVideoPreviewLayer?
    private var settled = false

    init(prompt: String, cancelLabel: String) {
        self.promptText = prompt
        self.cancelText = cancelLabel
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) is not used")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.082, green: 0.173, blue: 0.165, alpha: 1)
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(layer)
        preview = layer

        let caption = UILabel()
        caption.translatesAutoresizingMaskIntoConstraints = false
        caption.text = promptText
        caption.textColor = .white
        caption.textAlignment = .center
        caption.numberOfLines = 0
        caption.font = .systemFont(ofSize: 17, weight: .semibold)
        view.addSubview(caption)

        let cancel = UIButton(type: .system)
        cancel.translatesAutoresizingMaskIntoConstraints = false
        cancel.setTitle(cancelText, for: .normal)
        cancel.setTitleColor(.white, for: .normal)
        cancel.titleLabel?.font = .systemFont(ofSize: 17, weight: .bold)
        cancel.backgroundColor = UIColor(red: 1, green: 0.431, blue: 0.333, alpha: 1)
        cancel.layer.cornerRadius = 8
        cancel.contentEdgeInsets = UIEdgeInsets(top: 12, left: 22, bottom: 12, right: 22)
        cancel.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        view.addSubview(cancel)

        NSLayoutConstraint.activate([
            caption.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            caption.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            caption.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 24),
            cancel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            cancel.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -24),
            cancel.heightAnchor.constraint(greaterThanOrEqualToConstant: 44)
        ])

        configureSession()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        preview?.frame = view.bounds
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        if !session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async { [session] in
                session.startRunning()
            }
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async { [session] in
                session.stopRunning()
            }
        }
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard !settled else { return }
        guard let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject, object.type == .qr, let value = object.stringValue else {
            return
        }
        settled = true
        DispatchQueue.global(qos: .userInitiated).async { [session] in
            if session.isRunning { session.stopRunning() }
        }
        dismiss(animated: true) { [onResult] in
            onResult?(value)
        }
    }

    @objc private func cancelTapped() {
        guard !settled else { return }
        settled = true
        dismiss(animated: true) { [onCancel] in
            onCancel?()
        }
    }

    private func configureSession() {
        session.beginConfiguration()
        session.sessionPreset = .high
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input) else {
            session.commitConfiguration()
            return
        }
        session.addInput(input)
        let output = AVCaptureMetadataOutput()
        guard session.canAddOutput(output) else {
            session.commitConfiguration()
            return
        }
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
        output.metadataObjectTypes = [.qr]
        session.commitConfiguration()
    }
}

private final class ContactSaver: NSObject, CNContactViewControllerDelegate {
    private let call: CAPPluginCall
    private let done: () -> Void
    private var settled = false

    init(call: CAPPluginCall, done: @escaping () -> Void) {
        self.call = call
        self.done = done
    }

    func present(from presenter: UIViewController, name: String, phone: String?, email: String?, company: String?, title: String?, url: String?) {
        let contact = CNMutableContact()
        let parts = name.split(separator: " ", maxSplits: 1, omittingEmptySubsequences: true).map(String.init)
        contact.givenName = String((parts.first ?? name).prefix(80))
        if parts.count > 1 {
            contact.familyName = String(parts[1].prefix(80))
        }
        if let company = company, !company.isEmpty {
            contact.organizationName = String(company.prefix(120))
        }
        if let title = title, !title.isEmpty {
            contact.jobTitle = String(title.prefix(120))
        }
        if let phone = phone, !phone.isEmpty {
            contact.phoneNumbers = [CNLabeledValue(label: CNLabelPhoneNumberMain, value: CNPhoneNumber(stringValue: String(phone.prefix(40))))]
        }
        if let email = email, !email.isEmpty {
            contact.emailAddresses = [CNLabeledValue(label: CNLabelWork, value: String(email.prefix(254)) as NSString)]
        }
        if let url = url, !url.isEmpty {
            contact.urlAddresses = [CNLabeledValue(label: CNLabelURLAddressHomePage, value: String(url.prefix(300)) as NSString)]
        }
        let viewController = CNContactViewController(forNewContact: contact)
        viewController.delegate = self
        viewController.contactStore = CNContactStore()
        viewController.allowsActions = false
        let navigation = UINavigationController(rootViewController: viewController)
        navigation.modalPresentationStyle = .formSheet
        presenter.present(navigation, animated: true)
    }

    func contactViewController(_ viewController: CNContactViewController, didCompleteWith contact: CNContact?) {
        viewController.dismiss(animated: true) { [weak self] in
            guard let self = self, !self.settled else { return }
            self.settled = true
            if contact == nil {
                self.call.reject("User canceled", "canceled")
            } else {
                self.call.resolve()
            }
            self.done()
        }
    }
}

private final class AppleSignInCoordinator: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    private weak var anchor: UIViewController?
    private let done: () -> Void
    private var controller: ASAuthorizationController?
    private var call: CAPPluginCall?
    private var rawNonce = ""

    init(anchor: UIViewController, done: @escaping () -> Void) {
        self.anchor = anchor
        self.done = done
    }

    func start(_ call: CAPPluginCall) {
        self.call = call
        let nonce = Self.randomNonce()
        rawNonce = nonce
        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(nonce)
        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        self.controller = controller
        controller.performRequests()
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        anchor?.view.window ?? ASPresentationAnchor()
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        defer { finish() }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let token = String(data: tokenData, encoding: .utf8) else {
            call?.reject("Apple did not return a sign-in token.", "apple_failed")
            return
        }
        var result: [String: Any] = [
            "identityToken": token,
            "nonce": rawNonce,
            "user": credential.user
        ]
        if let email = credential.email { result["email"] = email }
        if let given = credential.fullName?.givenName { result["givenName"] = given }
        if let family = credential.fullName?.familyName { result["familyName"] = family }
        call?.resolve(result)
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        defer { finish() }
        if let authError = error as? ASAuthorizationError, authError.code == .canceled {
            call?.reject("User canceled", "canceled")
            return
        }
        call?.reject(error.localizedDescription, "apple_failed", error)
    }

    private func finish() {
        controller = nil
        call = nil
        done()
    }

    private static func randomNonce(length: Int = 32) -> String {
        let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var bytes = [UInt8](repeating: 0, count: length)
        let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        if status != errSecSuccess {
            return UUID().uuidString.replacingOccurrences(of: "-", with: "")
        }
        return String(bytes.map { charset[Int($0) % charset.count] })
    }

    private static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}

private final class AuthSessionCoordinator: NSObject, ASWebAuthenticationPresentationContextProviding {
    private weak var anchor: UIViewController?
    private let done: () -> Void
    private var session: ASWebAuthenticationSession?

    init(anchor: UIViewController, done: @escaping () -> Void) {
        self.anchor = anchor
        self.done = done
    }

    func start(url: URL, callbackScheme: String, call: CAPPluginCall) {
        let session = ASWebAuthenticationSession(url: url, callbackURLScheme: callbackScheme) { [weak self] callback, error in
            defer { self?.finish() }
            if let error = error as? ASWebAuthenticationSessionError, error.code == .canceledLogin {
                call.reject("User canceled", "canceled")
                return
            }
            if let error = error {
                call.reject(error.localizedDescription, "auth_failed", error)
                return
            }
            guard let callback = callback else {
                call.reject("Sign-in did not return to KopyCat.", "auth_failed")
                return
            }
            call.resolve(["url": callback.absoluteString])
        }
        session.presentationContextProvider = self
        session.prefersEphemeralWebBrowserSession = false
        self.session = session
        if !session.start() {
            call.reject("The sign-in window could not open.", "auth_failed")
            finish()
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        anchor?.view.window ?? ASPresentationAnchor()
    }

    private func finish() {
        session = nil
        done()
    }
}
