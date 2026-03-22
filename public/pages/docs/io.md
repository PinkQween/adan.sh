## Standard IO

The ADAN `io` library provides essential functions for text-based input and output operations, such as printing to the console and accepting user input.

### Printing to the Console

**`println(message: string): void`**

Displays a string message to standard output (STDOUT), followed by a newline.

```adan
println("Hello, world!");
```

**`errorln(message: string): void`**

Displays an error message to standard output, typically used for terminating execution on critical failures.

```adan
errorln("An unexpected error occurred.");
```

### Accepting User Input

**`input(prompt: string): string`**

Yields program execution and waits for the user to type input. The `prompt` string is displayed before waiting. Returns the user's input as a string.

```adan
set name: string = input("What is your name? ");
println(`Hello, ${name}!`);
```
