import AppKit

let app = NSApplication.shared
app.setActivationPolicy(.regular)
app.activate(ignoringOtherApps: true)

func message(_ title: String, _ body: String) {
    let alert = NSAlert()
    alert.messageText = title
    alert.informativeText = body
    alert.runModal()
}

func openSafari(_ url: URL) {
    guard let safari = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.apple.Safari") else {
        message("Safari indisponível", "Verifique a instalação do Safari.")
        return
    }
    NSWorkspace.shared.open([url], withApplicationAt: safari, configuration: .init()) { _, error in
        if let error = error { message("Falha ao abrir Safari", error.localizedDescription) }
    }
}

func lab() throws {
    guard let value = Bundle.main.object(forInfoDictionaryKey: "PreenchoTarget") as? String,
          let target = URL(string: value) else { throw CocoaError(.fileReadCorruptFile) }
    if value != "http://localhost:8174" {
        guard target.scheme == "https" else { throw CocoaError(.fileReadCorruptFile) }
        openSafari(target)
        message("Laboratório HTTPS", "Ative Preenchô nas preferências de extensões do Safari.")
        return
    }
    let files = FileManager.default
    let folder = files.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try files.createDirectory(at: folder, withIntermediateDirectories: false, attributes: [.posixPermissions: 0o700])
    defer { try? files.removeItem(at: folder) }
    let identity = folder.appendingPathComponent("identidade")
    let resources = Bundle.main.resourceURL!.appendingPathComponent("Laboratorio")
    let server = Process()
    let output = Pipe()
    server.executableURL = URL(fileURLWithPath: "/usr/bin/perl")
    server.arguments = ["server.pl", "vault", "target", identity.path]
    server.currentDirectoryURL = resources
    server.standardOutput = output
    try server.run()
    defer {
        if server.isRunning { server.terminate() }
        server.waitUntilExit()
    }
    let ready = output.fileHandleForReading.readData(ofLength: 6)
    guard ready == Data("READY\n".utf8) else {
        message("Laboratório indisponível", "Confira se outra janela do Preenchô está aberta ou se as portas 8173 e 8174 estão ocupadas.")
        return
    }
    let safariVersion = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.apple.Safari")
        .flatMap { Bundle(url: $0)?.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String }
    guard let version = safariVersion, version.compare("17.6", options: .numeric) != .orderedAscending else {
        message("Confira a versão do Safari", "Este ensaio requer Safari 17.6 ou posterior. Versão encontrada: " + (safariVersion ?? "desconhecida"))
        return
    }
    openSafari(target)
    var paired = false
    while server.isRunning {
        let dialog = NSAlert()
        dialog.messageText = paired ? "Laboratório pareado" : "Conectar a extensão ao cofre"
        dialog.informativeText = paired
            ? "Continue o teste no Safari. Ao terminar, encerre o laboratório aqui."
            : "No Safari, ative Preenchô em Preferências → Extensões. No cadastro, abra a extensão e copie a origem em Configuração do laboratório. Cole aqui."
        let field = NSTextField(frame: NSRect(x: 0, y: 0, width: 360, height: 24))
        if !paired {
            dialog.accessoryView = field
            dialog.addButton(withTitle: "Parear")
        }
        dialog.addButton(withTitle: "Encerrar laboratório")
        let response = dialog.runModal()
        if paired || response != .alertFirstButtonReturn {
            return
        }
        let origin = field.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard origin != "safari-web-extension://unpaired",
              origin.range(of: #"\Asafari-web-extension://[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\z"#, options: .regularExpression) != nil else {
            message("Origem inválida", "Copie a origem completa exibida dentro da extensão.")
            continue
        }
        try Data(origin.utf8).write(to: identity, options: .atomic)
        paired = true
        openSafari(target)
    }
}

do { try lab() }
catch { message("Falha ao iniciar o Preenchô", error.localizedDescription) }
