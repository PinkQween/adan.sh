## Build the Compiler from [Source](https://github.com/Cappucina/ADAN)

> It's highly recommended to use a mainstream Linux distribution such as Ubuntu, Fedora, or Arch Linux when compiling the ADAN compiler yourself.

### Clone the repository

```bash
git clone https://github.com/Cappucina/ADAN.git
cd ADAN
```

### Install dependencies

Run the dependency script before compiling manually.

```bash
chmod +x ./dependencies.sh
./dependencies.sh
```

### Compile with Make

```bash
make
```


## Useful Make Commands

```bash
$ make                     # Clean, build, and run the binary file.
$ make build               # Clean and create a fresh binary.
$ make emit                # Build and emit LLVM IR for the sample file.
$ make link                # Build, compile, and link the sample file.
$ make run                 # Clear the terminal, then run the sample binary.
$ make format              # Beautifies all C and header files in ./src and ./libs, using .clang-format.
$ make clean               # Removes all build artifacts and sample outputs.
$ make install             # Install all required dependencies. (Linux required for now!)
$ make build-macos-arm64   # Build the binary for macOS ARM64 (Apple Silicon).
$ make build-macos-x86_64  # Build the binary for macOS x86_64 (Intel Macs).
$ make build-macos         # Build both macOS binaries (ARM64 and x86_64).
$ make push                # Run the push.sh script (for maintainers).
```


## Compiler Flags

```bash
adanc -f <file.adn> [options]
```

| Flag | Description |
|------|-------------|
| `-f, --file <file>` | Source file to compile (`.adn` or `.adan` extension required) |
| `-o, --output <path>` | Output path for the linked binary. If `<path>` is a directory, the binary is placed inside it named after the source file |
| `-r, --rawir` | Stop after emitting LLVM IR (.ll file) |
| `-h, --help` | Show the help message and exit |

### Examples

Compile a source file:

```bash
adan -f main.adn
```

Compile and specify an output path:

```bash
adan -f main.adn -o ./build/myprogram
```