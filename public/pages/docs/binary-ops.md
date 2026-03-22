## Binary Operators

Binary operators perform arithmetic between two values. ADAN supports addition, subtraction, multiplication, division, modulo, and exponentiation.

```adan
set result: i32 = a + b;
```

### Addition

The `+` operator adds two values together.

```adan
set a: i32 = 10 + 5; // 15
```

### Subtraction

The `-` operator subtracts the right operand from the left.

```adan
set b: i32 = 20 - 8; // 12
```

### Multiplication

The `*` operator multiplies two values.

```adan
set c: i32 = 6 * 7; // 42
```

### Division

The `/` operator divides the left operand by the right. When both operands are integers, the result is truncated toward zero.

```adan
set d: i32 = 100 / 4; // 25
```

### Modulo

The `%` operator returns the remainder after division.

```adan
set e: i32 = 17 % 5; // 2
```

### Exponentiation

The `^` operator raises the left operand to the power of the right operand.

```adan
set f: i32 = 2 ^ 8;  // 256
set l: i32 = 3 ^ 4;  // 81
set m: i32 = 5 ^ 2;  // 25
```

### Operator Precedence

Operators follow standard mathematical precedence. Exponentiation binds most tightly, followed by multiplication, division, and modulo, then addition and subtraction (PEMDAS).

```adan
set g: i32 = 2 + 3 * 4; // 14 (Multiplication before addition)
```

Use parentheses to override the default order of evaluation.

```adan
set h: i32 = (2 + 3) * 4; // 20 (Addition first due to parentheses)
```

### Full Example

```adan
import "adan/io";

fun main(): i32
{
    set a: i32 = 10 + 5;
    set b: i32 = 20 - 8;
    set c: i32 = 6 * 7;
    set d: i32 = 100 / 4;
    set e: i32 = 17 % 5;
    set f: i32 = 2 ^ 8;
    set g: i32 = 2 + 3 * 4;
    set h: i32 = (2 + 3) * 4;
    set i: i32 = 10 + 5 * 2 - 8 / 4;
    set j: i32 = (10 + 5) * (20 - 8) / 3;
    set k: i32 = 100 / 10 / 2;
    set l: i32 = 3 ^ 4;
    set m: i32 = 5 ^ 2;

    println(`10 + 5 = ${a}`); // 15
    println(`20 - 8 = ${b}`); // 12
    println(`6 * 7 = ${c}`); // 42
    println(`100 / 4 = ${d}`); // 25
    println(`17 % 5 = ${e}`); // 2
    println(`2 ^ 8 = ${f}`); // 256
    println(`2 + 3 * 4 = ${g}`); // 14
    println(`(2 + 3) * 4 = ${h}`); // 20
    println(`10 + 5 * 2 - 8 / 4 = ${i}`); // 18
    println(`(10 + 5) * (20 - 8) / 3 = ${j}`); // 60
    println(`100 / 10 / 2 = ${k}`); // 5
    println(`3 ^ 4 = ${l}`); // 81
    println(`5 ^ 2 = ${m}`); // 25

    return 0;
}
```
