#!/bin/bash
# Downloads and extracts the full Zig distribution to bin/zig-dist/.
# Zig needs its lib/ directory alongside the binary (bundled libc/headers).
# Runs during `vercel build` on the build machine (which has curl + tar + xz).
# The directory is bundled into the Lambda via includeFiles.
set -euo pipefail

ZIG_VERSION="0.13.0"
ZIG_ARCH="zig-linux-x86_64-${ZIG_VERSION}"
URL="https://ziglang.org/download/${ZIG_VERSION}/${ZIG_ARCH}.tar.xz"

mkdir -p bin

if [ -f "bin/zig-dist/zig" ]; then
    echo "[prepare-zig] bin/zig-dist/zig already exists, skipping download."
    exit 0
fi

echo "[prepare-zig] Downloading zig ${ZIG_VERSION}..."
curl -fsSL "$URL" | tar xJ --strip-components=1 -C bin --transform 's|^|zig-dist/|' "${ZIG_ARCH}/zig" "${ZIG_ARCH}/lib"
chmod +x bin/zig-dist/zig

# Remove docs to save space (not needed for compilation)
rm -rf bin/zig-dist/doc

echo "[prepare-zig] zig distribution ready at bin/zig-dist/ ($(du -sh bin/zig-dist | cut -f1))"
