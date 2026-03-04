#!/bin/bash
set -euo pipefail

ZIG_VERSION="0.13.0"
ZIG_ARCH="zig-linux-x86_64-${ZIG_VERSION}"
URL="https://ziglang.org/download/${ZIG_VERSION}/${ZIG_ARCH}.tar.xz"
STAMP="v4-stripped"

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

rm -rf bin/zig-dist/lib/std
rm -rf bin/zig-dist/lib/libcxx
rm -rf bin/zig-dist/lib/libcxxabi
rm -rf bin/zig-dist/lib/libc/mingw
rm -rf bin/zig-dist/lib/libc/wasi
rm -rf bin/zig-dist/lib/libc/musl
rm -rf bin/zig-dist/lib/libunwind

find bin/zig-dist/lib/libc/include -maxdepth 1 -mindepth 1 -type d \
    ! -name 'x86_64*' \
    ! -name 'generic*' \
    ! -name 'any*' \
    -exec rm -rf {} +

echo "$STAMP" > bin/zig-dist/.stamp
echo "[prepare-zig] zig distribution ready at bin/zig-dist/ ($(du -sh bin/zig-dist | cut -f1))"

