
## Strings

Strings in ADAN are sequences of characters used to represent text. You can create strings using double quotes (`"`), single quotes (`'`), or backticks (`` ` ``), each with their own use cases.

### Creating Strings

You can define a string variable using any of the three delimiters:

```adan
set greeting: string = "Hello, world!";
set single: string = 'Single quoted string';
set template: string = `Backtick string`;
```

- **Double quotes (`"`)**: Most common for general strings.
- **Single quotes (`'`)**: Useful for strings containing double quotes.
- **Backticks (`` ` ``)**: Enable string interpolation (see below).

All three forms are functionally equivalent for plain text, but backticks are required for interpolation.

### String Concatenation

Use the `+` operator to join (concatenate) two or more strings:

```adan
set hello: string = "Hello, ";
set name: string = "Ada";
set message: string = hello + name; // "Hello, Ada"
```

You can concatenate as many strings as you like:

```adan
set full: string = "A" + "B" + "C"; // "ABC"
```

### String Interpolation

String interpolation allows you to embed variables or expressions inside a string. Use backticks (`` ` ``) to define the string, and `${...}` to insert values:

```adan
set name: string = "Ada";
set age: i32 = 21;
set info: string = `Name: ${name}, Age: ${age}`; // "Name: Ada, Age: 21"
```

You can interpolate any valid expression inside `${...}`:

```adan
set a: i32 = 5;
set b: i32 = 3;
set result: string = `Sum: ${a + b}`; // "Sum: 8"
```

### Examples

```adan
set first: string = "Hello";
set second: string = 'World';
set combined: string = first + ", " + second + "!"; // "Hello, World!"

set who: string = "Ada";
set greet: string = `Hi, ${who}!`; // "Hi, Ada!"

set x: i32 = 2;
set y: i32 = 3;
set math: string = `2 + 3 = ${x + y}`; // "2 + 3 = 5"
```