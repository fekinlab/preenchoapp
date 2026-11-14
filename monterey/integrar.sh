#!/bin/bash
set -eu
old="$RUNNER_TEMP/Preencho-Monterey"
app="$RUNNER_TEMP/Preencho.app"
osacompile -o "$app" monterey/launcher.applescript
plist="$app/Contents/Info.plist"
/usr/libexec/PlistBuddy -c 'Set :CFBundleIdentifier studio.fekin.preencho.lab' "$plist" || /usr/libexec/PlistBuddy -c 'Add :CFBundleIdentifier string studio.fekin.preencho.lab' "$plist"
mkdir -p "$app/Contents/Resources/Lab"
cp -R "$old/vault" "$old/target" "$old/server.pl" "$app/Contents/Resources/Lab/"
cp -R "$old/Preencho Lab.app/Contents/PlugIns" "$app/Contents/"
# Match the generated host identifier (may include a platform suffix).
host=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$old/Preencho Lab.app/Contents/Info.plist")
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $host" "$plist"
lipo "$app/Contents/MacOS/applet" -verify_arch x86_64
# osacompile uses the runner OS applet stub: reject stubs too new for Monterey.
xcrun vtool -arch x86_64 -show-build "$app/Contents/MacOS/applet"
