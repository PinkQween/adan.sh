## Functions

Functions are declared with the `fun` keyword, followed by a name, a parameter list, a return type, and a body.

```adan
fun name(params): type {
    // body
}
```

### Declaring a Function

Every function must declare an explicit return type after the parameter list.

```adan
fun greet(): void {
    // No return value.
}

fun square(n: i32): i32 {
    return n * n;
}
```

### Parameters

Parameters are declared inside the parentheses, each with a name and a type separated by `:`. Multiple parameters are separated by commas.

```adan
fun add(a: i32, b: i32): i32 {
    return a + b;
}

fun greetUser(name: string, age: u32): void {
    // Use name and age here.
}
```

### Return Types

The return type is written after the closing parenthesis. Use `void` when the function does not return a value, or any valid type when it does.

```adan
fun multiply(x: f64, y: f64): f64 {
    return x * y;
}

fun printScore(score: i32): void {
    return; // void functions must still use return to exit.
}
```

### Calling a Function

To call a function, write its name followed by arguments in parentheses. Arguments must match the order and types of the declared parameters.

```adan
fun add(a: i32, b: i32): i32 {
    return a + b;
}

fun main(): i32 {
    set result: i32 = add(3, 7);
    return result; // 10
}
```

### Recursion

A function may call itself. Make sure a base case exists to prevent infinite recursion.

```adan
fun factorial(n: i32): i32 {
    if n <= 1 {
        return 1;
    }
    return n * factorial(n - 1);
}
```