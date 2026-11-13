#!/bin/bash
set -eu
out="$RUNNER_TEMP/Preencho-Monterey"
mkdir -p "$out"
python3 lab/prepare.py "$RUNNER_TEMP/sites" --extension safari-web-extension://unpaired
cp -R "$RUNNER_TEMP/sites/vault" "$RUNNER_TEMP/sites/target" "$out/"
sed -e 's|__VAULT__|http://localhost:8173|g;s|__TARGET__|http://localhost:8174|g' -e 's|Na aba <b>Extensões</b> do Chrome,.*No Safari, ative|No Safari, ative|' lab/guia.html > "$out/target/guia.html"
cp monterey/Monterey.command monterey/server.pl "$out/"
project=$(find build -name '*.xcodeproj' -print -quit)
scheme=$(xcodebuild -project "$project" -list -json | python3 -c 'import sys,json; print(next(s for s in json.load(sys.stdin)["project"]["schemes"] if "macos" in s.lower() and "extension" not in s.lower()))')
xcodebuild -project "$project" -scheme "$scheme" -destination 'generic/platform=macOS' -derivedDataPath "$RUNNER_TEMP/intel" ARCHS=x86_64 ONLY_ACTIVE_ARCH=NO MACOSX_DEPLOYMENT_TARGET=12.0 CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM= build
app=$(find "$RUNNER_TEMP/intel/Build/Products" -name '*.app' -maxdepth 2 -print -quit)
ditto "$app" "$out/Preencho Lab.app"
for bundle in "$out/Preencho Lab.app" "$out/Preencho Lab.app"/Contents/PlugIns/*.appex; do
 bin=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$bundle/Contents/Info.plist")
 lipo -verify_arch x86_64 "$bundle/Contents/MacOS/$bin"
 vtool -show-build "$bundle/Contents/MacOS/$bin" | grep -E 'minos 12\.0'
done
codesign --verify --deep --strict "$out/Preencho Lab.app"
ditto -c -k --keepParent "$out" Preencho-Monterey.zip
