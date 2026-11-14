#!/bin/bash
set -eu
old="$RUNNER_TEMP/Preencho-Monterey"
app="$RUNNER_TEMP/Preencho.app"
osacompile -o "$app" monterey/launcher.applescript
plist="$app/Contents/Info.plist"
/usr/libexec/PlistBuddy -c 'Set :CFBundleIdentifier studio.fekin.preencho.lab' "$plist" || /usr/libexec/PlistBuddy -c 'Add :CFBundleIdentifier string studio.fekin.preencho.lab' "$plist"
target=$(python3 -c 'import json; print(json.loads(open("safari-qa/vault/approval-config.js").read().split(" = ",1)[1].rstrip(";"))["target"])')
/usr/libexec/PlistBuddy -c "Add :PreenchoTarget string $target" "$plist"
cp -R "$old/Preencho Lab.app/Contents/PlugIns" "$app/Contents/"
# Match the generated host identifier (may include a platform suffix).
host=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$old/Preencho Lab.app/Contents/Info.plist")
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $host" "$plist"
# Use an Intel launcher linked for Monterey, independent of the runner's applet stub.
if [[ "$target" == http://localhost:8174 ]]; then
  lab="$app/Contents/Resources/Laboratorio"
  mkdir "$lab"
  cp -R safari-qa/vault safari-qa/target monterey/server.pl "$lab/"
fi
xcrun swiftc -target x86_64-apple-macos12.0 monterey/Launcher.swift -o "$app/Contents/MacOS/applet"
/usr/libexec/PlistBuddy -c 'Set :LSMinimumSystemVersion 12.0' "$plist" || /usr/libexec/PlistBuddy -c 'Add :LSMinimumSystemVersion string 12.0' "$plist"
lipo "$app/Contents/MacOS/applet" -verify_arch x86_64
# osacompile uses the runner OS applet stub: reject stubs too new for Monterey.
xcrun vtool -arch x86_64 -show-build "$app/Contents/MacOS/applet" | grep -E 'minos 12\.0'
