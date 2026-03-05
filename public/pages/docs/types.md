## Types

ADAN is a statically typed programming language, which means you have to define a type manually for every variable you write.

### Number Types

Types like `i32` and `u32` differ because of the letter that comes before it. With the letter referring to whether or not the number is capable of being a signed integer.

> Read about [Two's Complement](https://www.cs.cornell.edu/~tomf/notes/cps104/twoscomp.html) here.

| Type | Size | Range |
|------|------|-------|
| `i8` | 8 bits | -128 to 127 |
| `u8` | 8 bits | 0 to 255 |
| `i32` | 32 bits | -2,147,483,648 to 2,147,483,647 |
| `u32` | 32 bits | 0 to 4,294,967,295 |
| `i64` | 64 bits | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 |
| `u64` | 64 bits | 0 to 18,446,744,073,709,551,615 |
| `f32` | 32 bits | ±1.4E-45 to ±3.4E38 |
| `f64` | 64 bits | ±4.9E-324 to ±1.8E308 |

### Strings

A string comes down to just being an array of characters, which allows you to easily represent words.

Using the `string` type, you can write a new variable and wrap the value portion inside of `"` (quotation marks).

```adan
set variableName: string = "Hello, world!";
```

### Void

Void is *special* in a sense, only capable of being assigned to functions and referring to a function not returning any value.

```adan
fun myFun(): void {
    return; // Anything else isn't allowed.
}
```