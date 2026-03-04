#!/bin/bash
set -euo pipefail

ZIG_VERSION="0.13.0"
ZIG_ARCH="zig-linux-x86_64-${ZIG_VERSION}"
URL="https://ziglang.org/download/${ZIG_VERSION}/${ZIG_ARCH}.tar.xz"
STAMP="v10-precached"

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

# Keep only what zig cc -target x86_64-linux-gnu needs:
#   lib/include/         — clang builtin headers (stddef.h, stdarg.h, etc.)
#   lib/libc/include/    — C standard library headers (stdio.h, etc.)
#   lib/libc/glibc/      — CRT sources (crti.o, crtn.o, Scrt1.o built from here)
#   lib/compiler_rt*     — compiler runtime (needed at link time)
find bin/zig-dist/lib -maxdepth 1 -mindepth 1 \
    ! -name 'libc' \
    ! -name 'include' \
    ! -name 'compiler_rt' \
    ! -name 'compiler_rt.zig' \
    -exec rm -rf {} +
find bin/zig-dist/lib/libc -maxdepth 1 -mindepth 1 \
    ! -name 'include' \
    ! -name 'glibc' \
    -exec rm -rf {} +
find bin/zig-dist/lib/libc/include -maxdepth 1 -mindepth 1 -type d \
    ! -name 'x86_64*' \
    ! -name 'generic*' \
    ! -name 'any*' \
    -exec rm -rf {} +

# Strip non-x86_64 glibc sysdeps
find bin/zig-dist/lib/libc/glibc/sysdeps -maxdepth 1 -mindepth 1 -type d \
    ! -name 'x86_64' \
    ! -name 'generic' \
    ! -name 'unix' \
    -exec rm -rf {} +
find bin/zig-dist/lib/libc/glibc/sysdeps/unix/sysv/linux -maxdepth 1 -mindepth 1 -type d \
    ! -name 'x86_64' \
    ! -name 'generic' \
    -exec rm -rf {} +

# Pre-warm zig cache: compile a dummy program so CRT + compiler_rt objects are
# built and stored as .o files in the cache. The source trees can then be deleted.
echo "[prepare-zig] Pre-warming zig cache for x86_64-linux-gnu..."
ZIG_CACHE="$(pwd)/bin/zig-dist/zig-cache"
mkdir -p "$ZIG_CACHE"
printf 'int main(void){return 0;}\n' > /tmp/_adan_warmup.c
ZIG_LIB_DIR="$(pwd)/bin/zig-dist/lib" \
ZIG_GLOBAL_CACHE_DIR="$ZIG_CACHE" \
ZIG_LOCAL_CACHE_DIR="$ZIG_CACHE/local" \
  bin/zig-dist/zig cc -target x86_64-linux-gnu -march=x86_64 /tmp/_adan_warmup.c -o /tmp/_adan_warmup
rm -f /tmp/_adan_warmup.c /tmp/_adan_warmup

# Source trees are now redundant — CRT objects and compiler_rt are in the cache
rm -rf bin/zig-dist/lib/libc/glibc
rm -rf bin/zig-dist/lib/compiler_rt
rm -f bin/zig-dist/lib/compiler_rt.zig

echo "$STAMP" > bin/zig-dist/.stamp
echo "[prepare-zig] zig distribution ready at bin/zig-dist/ ($(du -sh bin/zig-dist | cut -f1))"

