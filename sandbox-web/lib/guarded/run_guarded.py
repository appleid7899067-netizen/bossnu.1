#!/usr/bin/env python3
"""Aether-style AST gate and restricted interpreter for Python (Safe).

The user program is read from stdin, parsed before execution, and runs with a
small builtin set. File, network, import, process, reflection, class, and shell
capabilities are intentionally absent. This is a guardrail in addition to the
runner's process/resource limits, not an OS security boundary.
"""
from __future__ import annotations

import ast
import io
import json as _json
import math as _math
import os
import resource
import sys
import traceback
from types import SimpleNamespace

MAX_SOURCE_CHARS = 32_000
MAX_PROGRAM_INPUT_CHARS = 32_000
MAX_AST_NODES = 12_000
MAX_AST_DEPTH = 80
MAX_MEMORY_BYTES = 256 * 1024 * 1024


class GuardViolation(Exception):
    """The submitted program is outside the Python Safe subset."""


def _set_limit(kind: int, value: int) -> None:
    try:
        _, hard = resource.getrlimit(kind)
        bounded = value if hard == resource.RLIM_INFINITY else min(value, hard)
        resource.setrlimit(kind, (bounded, bounded))
    except (OSError, ValueError):
        # The runner also kills timed-out processes; unsupported limits must not
        # turn a rejected AST into an executable one.
        pass


def _apply_resource_limits() -> None:
    _set_limit(resource.RLIMIT_CPU, 8)
    _set_limit(resource.RLIMIT_AS, MAX_MEMORY_BYTES)
    _set_limit(resource.RLIMIT_FSIZE, 0)
    _set_limit(resource.RLIMIT_NOFILE, 16)
    if hasattr(resource, "RLIMIT_CORE"):
        _set_limit(resource.RLIMIT_CORE, 0)


_ALLOWED_NODE_TYPES = {
    ast.Module,
    ast.Expr,
    ast.Assign,
    ast.AnnAssign,
    ast.AugAssign,
    ast.If,
    ast.For,
    ast.While,
    ast.Break,
    ast.Continue,
    ast.Pass,
    ast.FunctionDef,
    ast.Lambda,
    ast.arguments,
    ast.arg,
    ast.Return,
    ast.Assert,
    ast.Try,
    ast.ExceptHandler,
    ast.Raise,
    ast.Name,
    ast.Load,
    ast.Store,
    ast.Constant,
    ast.List,
    ast.Tuple,
    ast.Set,
    ast.Dict,
    ast.ListComp,
    ast.SetComp,
    ast.DictComp,
    ast.GeneratorExp,
    ast.comprehension,
    ast.Call,
    ast.keyword,
    ast.Attribute,
    ast.Subscript,
    ast.Slice,
    ast.BinOp,
    ast.UnaryOp,
    ast.BoolOp,
    ast.Compare,
    ast.IfExp,
    ast.JoinedStr,
    ast.FormattedValue,
    ast.NamedExpr,
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.FloorDiv,
    ast.Mod,
    ast.MatMult,
    ast.UAdd,
    ast.USub,
    ast.Not,
    ast.And,
    ast.Or,
    ast.Eq,
    ast.NotEq,
    ast.Lt,
    ast.LtE,
    ast.Gt,
    ast.GtE,
    ast.Is,
    ast.IsNot,
    ast.In,
    ast.NotIn,
}

_FORBIDDEN_NAMES = {
    "__builtins__",
    "__import__",
    "breakpoint",
    "compile",
    "delattr",
    "eval",
    "exec",
    "getattr",
    "globals",
    "help",
    "locals",
    "memoryview",
    "open",
    "setattr",
    "vars",
}

_ALLOWED_ATTRIBUTES = {
    # Safe container operations.
    "append", "clear", "copy", "count", "extend", "get", "index", "insert",
    "items", "keys", "pop", "remove", "reverse", "setdefault", "sort", "update", "values",
    # Safe string/bytes operations. format/format_map are excluded because they
    # support attribute traversal in format strings.
    "capitalize", "casefold", "center", "decode", "encode", "endswith", "expandtabs",
    "find", "isalnum", "isalpha", "isascii", "isdigit", "isdecimal", "islower",
    "isnumeric", "isspace", "istitle", "isupper", "join", "ljust", "lower", "lstrip",
    "partition", "removeprefix", "removesuffix", "replace", "rfind", "rindex", "rjust",
    "rpartition", "rsplit", "rstrip", "split", "splitlines", "startswith", "strip",
    "swapcase", "title", "translate", "upper", "zfill",
    # Small, explicit math/json namespaces provided by the wrapper.
    "acos", "acosh", "asin", "asinh", "atan", "atan2", "atanh", "ceil", "comb",
    "copysign", "cos", "cosh", "degrees", "dist", "erf", "erfc", "exp", "expm1",
    "fabs", "factorial", "floor", "fmod", "frexp", "fsum", "gamma", "gcd", "hypot",
    "isclose", "isfinite", "isinf", "isnan", "isqrt", "lcm", "ldexp", "lgamma",
    "log", "log10", "log1p", "log2", "modf", "perm", "prod", "radians", "remainder",
    "sin", "sinh", "sqrt", "tan", "tanh", "trunc", "ulp", "dumps", "loads",
    "e", "inf", "nan", "pi", "tau",
}


class AetherASTGuard(ast.NodeVisitor):
    """Reject syntax/capabilities outside the intentionally small safe subset."""

    def __init__(self) -> None:
        self.node_count = 0
        self.depth = 0

    def visit(self, node: ast.AST):  # noqa: D401 - mirrors NodeVisitor.visit
        self.node_count += 1
        self.depth += 1
        try:
            if self.node_count > MAX_AST_NODES:
                raise GuardViolation(f"program exceeds {MAX_AST_NODES} AST nodes")
            if self.depth > MAX_AST_DEPTH:
                raise GuardViolation(f"program exceeds AST depth {MAX_AST_DEPTH}")
            if type(node) not in _ALLOWED_NODE_TYPES:
                raise GuardViolation(f"{type(node).__name__} syntax is not allowed")
            return super().visit(node)
        finally:
            self.depth -= 1

    def visit_Name(self, node: ast.Name) -> None:
        if node.id.startswith("_") or node.id in _FORBIDDEN_NAMES:
            raise GuardViolation(f"name {node.id!r} is not allowed (line {node.lineno})")

    def visit_Attribute(self, node: ast.Attribute) -> None:
        if node.attr.startswith("_") or node.attr not in _ALLOWED_ATTRIBUTES:
            raise GuardViolation(f"attribute {node.attr!r} is not allowed (line {node.lineno})")
        if not isinstance(node.ctx, ast.Load):
            raise GuardViolation(f"attribute assignment is not allowed (line {node.lineno})")
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        if node.name.startswith("_") or node.decorator_list:
            raise GuardViolation(f"decorators/private functions are not allowed (line {node.lineno})")
        self.generic_visit(node)

    def visit_ExceptHandler(self, node: ast.ExceptHandler) -> None:
        if node.name and node.name.startswith("_"):
            raise GuardViolation(f"private exception names are not allowed (line {node.lineno})")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        if isinstance(node.func, ast.Name) and node.func.id in _FORBIDDEN_NAMES:
            raise GuardViolation(f"call to {node.func.id!r} is not allowed (line {node.lineno})")
        self.generic_visit(node)


_SAFE_BUILTINS = {
    "abs": abs,
    "all": all,
    "any": any,
    "bool": bool,
    "dict": dict,
    "enumerate": enumerate,
    "filter": filter,
    "float": float,
    "int": int,
    "isinstance": isinstance,
    "iter": iter,
    "len": len,
    "list": list,
    "map": map,
    "max": max,
    "min": min,
    "next": next,
    "print": print,
    "range": range,
    "reversed": reversed,
    "round": round,
    "set": set,
    "slice": slice,
    "sorted": sorted,
    "str": str,
    "sum": sum,
    "tuple": tuple,
    "zip": zip,
    "Exception": Exception,
    "ArithmeticError": ArithmeticError,
    "AssertionError": AssertionError,
    "AttributeError": AttributeError,
    "EOFError": EOFError,
    "IndexError": IndexError,
    "KeyError": KeyError,
    "LookupError": LookupError,
    "NameError": NameError,
    "RuntimeError": RuntimeError,
    "StopIteration": StopIteration,
    "TypeError": TypeError,
    "ValueError": ValueError,
    "ZeroDivisionError": ZeroDivisionError,
    "OverflowError": OverflowError,
}


def _safe_input(prompt: object = "") -> str:
    if prompt:
        print(prompt, end="", flush=True)
    line = sys.stdin.readline()
    if line == "":
        raise EOFError("no more sandbox input")
    return line.rstrip("\r\n")


def _safe_namespaces() -> dict[str, object]:
    math_names = {
        name: getattr(_math, name)
        for name in (
            "acos", "acosh", "asin", "asinh", "atan", "atan2", "atanh", "ceil", "comb",
            "copysign", "cos", "cosh", "degrees", "dist", "erf", "erfc", "exp", "expm1",
            "fabs", "factorial", "floor", "fmod", "frexp", "fsum", "gamma", "gcd", "hypot",
            "isclose", "isfinite", "isinf", "isnan", "isqrt", "lcm", "ldexp", "lgamma",
            "log", "log10", "log1p", "log2", "modf", "perm", "prod", "radians", "remainder",
            "sin", "sinh", "sqrt", "tan", "tanh", "trunc", "ulp", "e", "inf", "nan", "pi", "tau",
        )
    }
    safe_json = {"dumps": _json.dumps, "loads": _json.loads}
    builtins = {**_SAFE_BUILTINS, "input": _safe_input}
    return {
        "__builtins__": builtins,
        "math": SimpleNamespace(**math_names),
        "json": SimpleNamespace(**safe_json),
    }


def _read_program_input() -> str:
    try:
        with os.fdopen(3, "r", encoding="utf-8", errors="replace", closefd=False) as stream:
            value = stream.read(MAX_PROGRAM_INPUT_CHARS + 1)
    except OSError:
        value = ""
    if len(value) > MAX_PROGRAM_INPUT_CHARS:
        raise GuardViolation(f"stdin exceeds {MAX_PROGRAM_INPUT_CHARS} characters")
    return value


def main() -> int:
    _apply_resource_limits()
    source = sys.stdin.read(MAX_SOURCE_CHARS + 1)
    if len(source) > MAX_SOURCE_CHARS:
        print(f"Python Safe blocked: source exceeds {MAX_SOURCE_CHARS} characters", file=sys.stderr)
        return 2

    try:
        tree = ast.parse(source, filename="<python-safe>", mode="exec")
        AetherASTGuard().visit(tree)
        program_input = _read_program_input()
        sys.stdin = io.StringIO(program_input)
        code = compile(tree, "<python-safe>", "exec")
        namespace = _safe_namespaces()
        exec(code, namespace, namespace)  # Only the validated AST + restricted builtins.
        return 0
    except GuardViolation as error:
        print(f"Python Safe blocked: {error}", file=sys.stderr)
        return 2
    except (SyntaxError, RecursionError) as error:
        print(f"Python Safe syntax error: {error}", file=sys.stderr)
        return 2
    except BaseException as error:
        # Keep the real traceback useful for debugging while code/data remain
        # in this disposable, resource-limited process.
        traceback.print_exc(file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
