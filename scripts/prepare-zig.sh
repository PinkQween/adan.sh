#!/bin/bash
# Downloads and extracts only the `zig` binary from the Zig release tarball.
# Runs during `vercel build` on the build machine (which has curl + tar + xz).
# The binary is placed at bin/zig and bundled into the Lambda via includeFiles.
set -euo pipefail

ZIG_VERSION="0.13.0"
ZIG_ARCH="zig-linux-x86_64-${ZIG_VERSION}"
URL="https://ziglang.org/download/${ZIG_VERSION}/${ZIG_ARCH}.tar.xz"

mkdir -p bin

if [ -f "bin/zig" ]; then
    echo "[prepare-zig] bin/zig already exists, skipping download."
    exit 0
fi

echo "[prepare-zig] Downloading zig ${ZIG_VERSION}..."
curl -fsSL "$URL" | tar xJ --strip-components=1 -C bin "${ZIG_ARCH}/zig"
chmod +x bin/zig
echo "[prepare-zig] zig binary ready at bin/zig ($(du -sh bin/zig | cut -f1))"
