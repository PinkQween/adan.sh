## Comments

Comments are ignored by the compiler and exist solely to explain code to anyone reading it.

### Single-Line Comments

A single-line comment starts with `//` and continues to the end of the line.

```adan
// This is a comment
set x: i32 = 42; // This is also a comment
```

### Inline Comments

Comments can appear anywhere on a line after valid code. Everything after `//` is ignored.

```adan
fun add(a: i32, b: i32): i32 {
    return a + b; // Return the sum
}
```

### Multi-Line Comments

Sometimes it gets kind of annoying typing `//` on every line for a comment and it, at times, makes what you're trying to say less legible.

Using `/*` and `*/`, anything that goes between these will be ignored by the compiler.

```adan
/*
    Here is a 
    multi-lined
    comment.
*/
set x: i32 = 10;
```