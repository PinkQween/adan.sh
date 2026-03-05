## Variables

Variables are declared with the `set` keyword, followed by a name, a type annotation, and a value.

```adan
set name: type = value;
```

### Declaring a Variable

Every variable must have an explicit type. ADAN does not infer types.

```adan
set score: i32 = 100;
set username: string = "player1";
set active: bool = true;
set ratio: f64 = 0.75;
```

### Naming Rules

- Names must start with a letter or underscore (`_`).
- After the first character, digits are also allowed.
- Names are case-sensitive — `score` and `Score` are different variables.

```adan
set _private: i32 = 0;
set camelCase: string = "valid";
set value2: f32 = 3.14;
```

### Scope

Variables are scoped to the block `{}` in which they are declared. A variable declared inside a function or `if` block is not accessible outside of it.

```adan
fun main(): i32 {
    set result: i32 = 0;

    if true {
        set inner: i32 = 10; // Only accessible inside this block.
        result = inner;
    }

    return result;
}
```