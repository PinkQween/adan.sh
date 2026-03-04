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
make         # Clean, build, and run the binary
make build   # Clean and create a fresh binary
make run     # Clear terminal and run an existing binary
make format  # Format C files in ./src using .clang-format
make clean   # Remove existing binary in ./build
make install # Install required dependencies (Linux only)
```
