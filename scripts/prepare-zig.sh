#!/bin/bash
set -euo pipefail

ZIG_VERSION="0.13.0"
ZIG_ARCH="zig-linux-x86_64-${ZIG_VERSION}"
URL="https://ziglang.org/download/${ZIG_VERSION}/${ZIG_ARCH}.tar.xz"
STAMP="v6-stripped"

mkdir -p bin/zig-dist

if [ -f "bin/zig-dist/zig" ] && [ -f "bin/zig-dist/.stamp" ] && [ "$(cat bin/zig-dist/.stamp)" = "$STAMP" ]; then
    echo "[prepare-zig] bin/zig-dist already up to date (${STAMP}), skipping download."
    exit 0
fi

echo "[prepare-zig] Downloading zig ${ZIG_VERSION} (${STAMP})..."
rm -rf bin/zig-dist
mkdir -p bin/zig-dist
curl -fsSL "$URL" | tar xJ \
    --strip-components=1 \
    -C bin/zig-dist \
    "${ZIG_ARCH}/zig" \
    "${ZIG_ARCH}/lib"

chmod +x bin/zig-dist/zig

# Keep only the C headers needed for zig cc -target x86_64-linux-gnu.
# Everything else in lib/ (std, libcxx, libcxxabi, compiler_rt, etc.) is unnecessary.
find bin/zig-dist/lib -maxdepth 1 -mindepth 1 ! -name 'libc' -exec rm -rf {} +
find bin/zig-dist/lib/libc -maxdepth 1 -mindepth 1 ! -name 'include' -exec rm -rf {} +
find bin/zig-dist/lib/libc/include -maxdepth 1 -mindepth 1 -type d \
    ! -name 'x86_64*' \
    ! -name 'generic*' \
    ! -name 'any*' \
    -exec rm -rf {} +

echo "$STAMP" > bin/zig-dist/.stamp
echo "[prepare-zig] zig distribution ready at bin/zig-dist/ ($(du -sh bin/zig-dist | cut -f1))"

