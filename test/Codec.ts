import { pipe } from "@fp-ts/data/Function"
import * as C from "@fp-ts/schema/Codec"
import * as DE from "@fp-ts/schema/DecodeError"
import * as Util from "@fp-ts/schema/test/util"

describe.concurrent("Codec", () => {
  it("exports", () => {
    expect(C.success).exist
    expect(C.failure).exist
    expect(C.failures).exist
    expect(C.warning).exist
    expect(C.warnings).exist

    expect(C.isSuccess).exist
    expect(C.isFailure).exist
    expect(C.isWarning).exist

    expect(C.codecFor).exist

    expect(C.literal).exist
    expect(C.uniqueSymbol).exist
    expect(C.enums).exist

    expect(C.minLength).exist
    expect(C.maxLength).exist
    expect(C.startsWith).exist
    expect(C.endsWith).exist
    expect(C.regex).exist
    expect(C.lessThan).exist
    expect(C.lessThanOrEqualTo).exist
    expect(C.greaterThan).exist
    expect(C.greaterThanOrEqualTo).exist
    expect(C.int).exist

    expect(C.union).exist
    expect(C.keyof).exist
    expect(C.tuple).exist
    expect(C.rest).exist
    expect(C.element).exist
    expect(C.optionalElement).exist
    expect(C.array).exist
    expect(C.optional).exist
    expect(C.struct).exist
    expect(C.pick).exist
    expect(C.omit).exist
    expect(C.partial).exist
    expect(C.stringIndexSignature).exist
    expect(C.symbolIndexSignature).exist
    expect(C.extend).exist
    expect(C.lazy).exist
    expect(C.filter).exist
    expect(C.parse).exist
    expect(C.annotation).exist
    expect(C.annotations).exist

    expect(C.undefined).exist
    expect(C.void).exist
    expect(C.string).exist
    expect(C.number).exist
    expect(C.boolean).exist
    expect(C.bigint).exist
    expect(C.symbol).exist
    expect(C.unknown).exist
    expect(C.any).exist
    expect(C.never).exist
    expect(C.json).exist
    expect(C.option).exist
  })

  it("parseOrThrow", () => {
    const Person = C.struct({
      firstName: C.string,
      lastName: C.string,
      age: C.optional(C.number)
    })

    Util.expectSuccess(Person, { firstName: "Michael", lastName: "Arnaldi" })

    const person = Person.of({ firstName: "Michael", lastName: "Arnaldi" })
    const string = Person.stringify(person)

    expect(string).toEqual(`{"firstName":"Michael","lastName":"Arnaldi"}`)
    expect(Person.parseOrThrow(string)).toEqual(person)
  })

  it("string", () => {
    const codec = C.string
    expect(codec.decode("a")).toEqual(C.success("a"))

    Util.expectFailure(codec, 1, "1 did not satisfy is(string)")
  })

  describe.concurrent("number", () => {
    const codec = C.number

    it("baseline", () => {
      expect(codec.decode(1)).toEqual(C.success(1))
      Util.expectFailure(codec, "a", "\"a\" did not satisfy is(number)")
    })

    it("should warn for NaN", () => {
      Util.expectWarning(codec, NaN, "did not satisfy not(isNaN)", NaN)
    })

    it("should warn for no finite values", () => {
      Util.expectWarning(codec, Infinity, "did not satisfy isFinite", Infinity)
      Util.expectWarning(codec, -Infinity, "did not satisfy isFinite", -Infinity)
    })
  })

  it("boolean", () => {
    const codec = C.boolean
    expect(codec.decode(true)).toEqual(C.success(true))
    expect(codec.decode(false)).toEqual(C.success(false))

    Util.expectFailure(codec, 1, "1 did not satisfy is(boolean)")
  })

  it("bigint", () => {
    const codec = C.bigint

    expect(codec.decode(0n)).toEqual(C.success(0n))
    expect(codec.decode(1n)).toEqual(C.success(1n))
    expect(codec.decode("1")).toEqual(C.success(1n))
    Util.expectFailure(
      codec,
      null,
      "null did not satisfy is(string | number | boolean)"
    )
    Util.expectFailure(
      codec,
      1.2,
      `1.2 did not satisfy parsing from (string | number | boolean) to (bigint)`
    )
  })

  it("symbol", () => {
    const a = Symbol.for("@fp-ts/schema/test/a")
    const codec = C.symbol
    expect(codec.decode(a)).toEqual(C.success(a))
    Util.expectFailure(codec, 1, "1 did not satisfy is(symbol)")
  })

  it("literal", () => {
    const codec = C.literal(1, "a")
    expect(codec.decode(1)).toEqual(C.success(1))
    expect(codec.decode("a")).toEqual(C.success("a"))

    Util.expectFailureTree(
      codec,
      null,
      `2 error(s) found
├─ union member
│  └─ null did not satisfy isEqual(1)
└─ union member
   └─ null did not satisfy isEqual("a")`
    )
  })

  it("uniqueSymbol", () => {
    const a = Symbol.for("@fp-ts/schema/test/a")
    const codec = C.uniqueSymbol(a)
    Util.expectSuccess(codec, a)
    Util.expectSuccess(codec, Symbol.for("@fp-ts/schema/test/a"))

    Util.expectFailure(
      codec,
      "Symbol(@fp-ts/schema/test/a)",
      `"Symbol(@fp-ts/schema/test/a)" did not satisfy isEqual(Symbol(@fp-ts/schema/test/a))`
    )
  })

  describe.concurrent("enums", () => {
    it("Numeric enums", () => {
      enum Fruits {
        Apple,
        Banana
      }
      const codec = C.enums(Fruits)
      Util.expectSuccess(codec, Fruits.Apple)
      Util.expectSuccess(codec, Fruits.Banana)
      Util.expectSuccess(codec, 0)
      Util.expectSuccess(codec, 1)

      Util.expectFailure(
        codec,
        3,
        `3 did not satisfy isEnum([["Apple",0],["Banana",1]])`
      )
    })

    it("String enums", () => {
      enum Fruits {
        Apple = "apple",
        Banana = "banana",
        Cantaloupe = 0
      }
      const codec = C.enums(Fruits)
      Util.expectSuccess(codec, Fruits.Apple)
      Util.expectSuccess(codec, Fruits.Cantaloupe)
      Util.expectSuccess(codec, "apple")
      Util.expectSuccess(codec, "banana")
      Util.expectSuccess(codec, 0)

      Util.expectFailure(
        codec,
        "Cantaloupe",
        `"Cantaloupe" did not satisfy isEnum([["Apple","apple"],["Banana","banana"],["Cantaloupe",0]])`
      )
    })

    it("Const enums", () => {
      const Fruits = {
        Apple: "apple",
        Banana: "banana",
        Cantaloupe: 3
      } as const
      const codec = C.enums(Fruits)
      Util.expectSuccess(codec, "apple")
      Util.expectSuccess(codec, "banana")
      Util.expectSuccess(codec, 3)

      Util.expectFailure(
        codec,
        "Cantaloupe",
        `"Cantaloupe" did not satisfy isEnum([["Apple","apple"],["Banana","banana"],["Cantaloupe",3]])`
      )
    })
  })

  describe.concurrent("tuple", () => {
    it("required element", () => {
      const codec = C.tuple(C.number)
      Util.expectSuccess(codec, [1])

      Util.expectWarning(codec, [1, "b"], `/1 index is unexpected`, [1])

      Util.expectFailure(codec, null, `null did not satisfy is(ReadonlyArray<unknown>)`)
      Util.expectFailure(codec, [], `/0 did not satisfy is(required)`)
      Util.expectFailure(codec, [undefined], `/0 undefined did not satisfy is(number)`)
      Util.expectFailure(codec, ["a"], `/0 "a" did not satisfy is(number)`)
    })

    it("required element with undefined", () => {
      const codec = C.tuple(C.union(C.number, C.undefined))
      Util.expectSuccess(codec, [1])
      Util.expectSuccess(codec, [undefined])

      Util.expectWarning(codec, [1, "b"], `/1 index is unexpected`, [1])

      Util.expectFailure(codec, null, `null did not satisfy is(ReadonlyArray<unknown>)`)
      Util.expectFailure(codec, [], `/0 did not satisfy is(required)`)
      Util.expectFailure(
        codec,
        ["a"],
        `/0 member: "a" did not satisfy is(number), member: "a" did not satisfy is(undefined)`
      )
    })

    it("optional element", () => {
      const codec = pipe(C.tuple(), C.optionalElement(C.number))
      Util.expectSuccess(codec, [])
      Util.expectSuccess(codec, [1])

      Util.expectWarning(codec, [1, "b"], `/1 index is unexpected`, [1])

      Util.expectFailure(codec, null, `null did not satisfy is(ReadonlyArray<unknown>)`)
      Util.expectFailure(
        codec,
        ["a"],
        `/0 "a" did not satisfy is(number)`
      )
    })

    it("optional element with undefined", () => {
      const codec = pipe(C.tuple(), C.optionalElement(C.union(C.number, C.undefined)))
      Util.expectSuccess(codec, [])
      Util.expectSuccess(codec, [1])
      Util.expectSuccess(codec, [undefined])

      Util.expectWarning(codec, [1, "b"], `/1 index is unexpected`, [1])

      Util.expectFailure(codec, null, `null did not satisfy is(ReadonlyArray<unknown>)`)
      Util.expectFailure(
        codec,
        ["a"],
        `/0 member: "a" did not satisfy is(number), member: "a" did not satisfy is(undefined)`
      )
    })

    it("post rest element", () => {
      const codec = pipe(C.array(C.number), C.element(C.boolean))
      Util.expectSuccess(codec, [true])
      Util.expectSuccess(codec, [1, true])
      Util.expectSuccess(codec, [1, 2, true])
      Util.expectSuccess(codec, [1, 2, 3, true])

      Util.expectWarning(codec, [NaN, true], `/0 did not satisfy not(isNaN)`, [NaN, true])

      Util.expectFailure(codec, ["b"], `/0 "b" did not satisfy is(boolean)`)
      Util.expectFailure(codec, [1], `/0 1 did not satisfy is(boolean)`)
      Util.expectFailure(codec, [1, "b"], `/1 "b" did not satisfy is(boolean)`)
      Util.expectFailure(codec, [1, 2], `/1 2 did not satisfy is(boolean)`)
      Util.expectFailure(codec, [1, 2, "b"], `/2 "b" did not satisfy is(boolean)`)
      Util.expectFailure(codec, [1, 2, 3], `/2 3 did not satisfy is(boolean)`)
      Util.expectFailure(codec, [1, 2, 3, "b"], `/3 "b" did not satisfy is(boolean)`)
    })

    it("post rest element warnings", () => {
      const codec = pipe(C.array(C.string), C.element(C.number))

      Util.expectWarning(codec, [NaN], `/0 did not satisfy not(isNaN)`, [NaN])
      Util.expectWarning(codec, ["a", NaN], `/1 did not satisfy not(isNaN)`, ["a", NaN])
    })

    it("post rest elements", () => {
      const codec = pipe(
        C.array(C.number),
        C.element(C.boolean),
        C.element(C.union(C.string, C.undefined))
      )
      Util.expectSuccess(codec, [true, "c"])
      Util.expectSuccess(codec, [1, true, "c"])
      Util.expectSuccess(codec, [1, 2, true, "c"])
      Util.expectSuccess(codec, [1, 2, 3, true, "c"])
      Util.expectSuccess(codec, [1, 2, 3, true, undefined])

      Util.expectFailure(codec, [], `/0 did not satisfy is(required)`)
      Util.expectFailure(codec, [true], `/1 did not satisfy is(required)`)
      Util.expectFailure(codec, [1, 2, 3, true], `/2 3 did not satisfy is(boolean)`)
    })

    it("post rest elements when rest is unknown", () => {
      const codec = pipe(C.array(C.unknown), C.element(C.boolean))
      Util.expectSuccess(codec, [1, "a", 2, "b", true])
      Util.expectSuccess(codec, [true])

      Util.expectFailure(codec, [], `/0 did not satisfy is(required)`)
    })

    it("all", () => {
      const codec = pipe(
        C.tuple(C.string),
        C.rest(C.number),
        C.element(C.boolean)
      )
      Util.expectSuccess(codec, ["a", true])
      Util.expectSuccess(codec, ["a", 1, true])
      Util.expectSuccess(codec, ["a", 1, 2, true])

      Util.expectFailure(codec, [], `/0 did not satisfy is(required)`)
      Util.expectFailure(codec, ["b"], `/1 did not satisfy is(required)`)
    })

    it("baseline", () => {
      const codec = C.tuple(C.string, C.number)
      expect(codec.decode(["a", 1])).toEqual(C.success(["a", 1]))

      Util.expectFailure(codec, {}, "{} did not satisfy is(ReadonlyArray<unknown>)")
      Util.expectFailure(codec, ["a"], "/1 did not satisfy is(required)")

      Util.expectWarning(codec, ["a", NaN], "/1 did not satisfy not(isNaN)", ["a", NaN])
    })

    it("additional indexes should raise a warning", () => {
      const codec = C.tuple(C.string, C.number)
      Util.expectWarning(codec, ["a", 1, true], "/2 index is unexpected", ["a", 1])
    })

    it("rest", () => {
      const codec = pipe(C.tuple(C.string, C.number), C.rest(C.boolean))
      expect(codec.decode(["a", 1])).toEqual(C.success(["a", 1]))
      expect(codec.decode(["a", 1, true])).toEqual(C.success(["a", 1, true]))
      expect(codec.decode(["a", 1, true, false])).toEqual(C.success(["a", 1, true, false]))

      Util.expectFailure(codec, ["a", 1, true, "a", true], "/3 \"a\" did not satisfy is(boolean)")
    })

    it("ReadonlyArray<unknown>", () => {
      const codec = C.array(C.unknown)
      expect(codec.decode([])).toEqual(C.success([]))
      expect(codec.decode(["a", 1, true])).toEqual(C.success(["a", 1, true]))
    })

    it("ReadonlyArray<any>", () => {
      const codec = C.array(C.any)
      expect(codec.decode([])).toEqual(C.success([]))
      expect(codec.decode(["a", 1, true])).toEqual(C.success(["a", 1, true]))
    })
  })

  describe.concurrent("struct", () => {
    it("required field", () => {
      const codec = C.struct({ a: C.number })
      Util.expectSuccess(codec, { a: 1 })

      Util.expectWarning(codec, { a: 1, b: "b" }, "/b key is unexpected", { a: 1 })

      Util.expectFailure(
        codec,
        null,
        `null did not satisfy is({ readonly [x: string]: unknown })`
      )
      Util.expectFailure(codec, {}, "/a did not satisfy is(required)")
      Util.expectFailure(codec, { a: undefined }, "/a undefined did not satisfy is(number)")
    })

    it("required field with undefined", () => {
      const codec = C.struct({ a: C.union(C.number, C.undefined) })
      Util.expectSuccess(codec, { a: 1 })
      Util.expectSuccess(codec, { a: undefined })

      Util.expectWarning(codec, { a: 1, b: "b" }, "/b key is unexpected", { a: 1 })

      Util.expectFailure(
        codec,
        null,
        `null did not satisfy is({ readonly [x: string]: unknown })`
      )
      Util.expectFailure(codec, {}, "/a did not satisfy is(required)")
      Util.expectFailure(
        codec,
        { a: "a" },
        `/a member: "a" did not satisfy is(number), member: "a" did not satisfy is(undefined)`
      )
    })

    it("optional field", () => {
      const codec = C.struct({ a: C.optional(C.number) })
      Util.expectSuccess(codec, {})
      Util.expectSuccess(codec, { a: 1 })

      Util.expectWarning(codec, { a: 1, b: "b" }, "/b key is unexpected", { a: 1 })

      Util.expectFailure(
        codec,
        null,
        `null did not satisfy is({ readonly [x: string]: unknown })`
      )
      Util.expectFailure(codec, { a: "a" }, `/a "a" did not satisfy is(number)`)
      Util.expectFailure(codec, { a: undefined }, `/a undefined did not satisfy is(number)`)
    })

    it("optional field with undefined", () => {
      const codec = C.struct({ a: C.optional(C.union(C.number, C.undefined)) })
      Util.expectSuccess(codec, {})
      Util.expectSuccess(codec, { a: 1 })
      Util.expectSuccess(codec, { a: undefined })

      Util.expectWarning(codec, { a: 1, b: "b" }, "/b key is unexpected", { a: 1 })

      Util.expectFailure(
        codec,
        null,
        `null did not satisfy is({ readonly [x: string]: unknown })`
      )
      Util.expectFailure(
        codec,
        { a: "a" },
        `/a member: "a" did not satisfy is(number), member: "a" did not satisfy is(undefined)`
      )
    })

    it("stringIndexSignature", () => {
      const codec = C.stringIndexSignature(C.number)
      expect(codec.decode({})).toEqual(C.success({}))
      expect(codec.decode({ a: 1 })).toEqual(C.success({ a: 1 }))

      Util.expectFailure(codec, [], "[] did not satisfy is({ readonly [x: string]: unknown })")
      Util.expectFailure(codec, { a: "a" }, "/a \"a\" did not satisfy is(number)")

      Util.expectWarning(codec, { a: NaN }, "/a did not satisfy not(isNaN)", { a: NaN })
    })

    it("symbolIndexSignature", () => {
      const a = Symbol.for("@fp-ts/schema/test/a")
      const codec = C.symbolIndexSignature(C.number)
      expect(codec.decode({})).toEqual(C.success({}))
      expect(codec.decode({ [a]: 1 })).toEqual(C.success({ [a]: 1 }))

      Util.expectFailure(codec, [], "[] did not satisfy is({ readonly [x: string]: unknown })")
      Util.expectFailure(
        codec,
        { [a]: "a" },
        "/Symbol(@fp-ts/schema/test/a) \"a\" did not satisfy is(number)"
      )

      Util.expectWarning(
        codec,
        { [a]: NaN },
        "/Symbol(@fp-ts/schema/test/a) did not satisfy not(isNaN)",
        { [a]: NaN }
      )
    })

    it("additional fields should raise a warning", () => {
      const codec = C.struct({ a: C.string, b: C.number })
      Util.expectWarning(codec, { a: "a", b: 1, c: true }, "/c key is unexpected", {
        a: "a",
        b: 1
      })
    })

    it("should not add optional keys", () => {
      const codec = C.partial(C.struct({ a: C.string, b: C.number }))
      expect(codec.decode({})).toEqual(C.success({}))
    })

    it("extend stringIndexSignature", () => {
      const codec = pipe(
        C.struct({ a: C.string }),
        C.extend(C.stringIndexSignature(C.string))
      )
      expect(codec.decode({ a: "a" })).toEqual(C.success({ a: "a" }))
      expect(codec.decode({ a: "a", b: "b" })).toEqual(C.success({ a: "a", b: "b" }))

      Util.expectFailure(codec, {}, "/a did not satisfy is(required)")
      Util.expectFailure(codec, { b: "b" }, "/a did not satisfy is(required)")
      Util.expectFailure(codec, { a: 1 }, "/a 1 did not satisfy is(string)")
      Util.expectFailure(codec, { a: "a", b: 1 }, "/b 1 did not satisfy is(string)")
    })
  })

  describe.concurrent("partial", () => {
    it("struct", () => {
      const codec = C.partial(C.struct({ a: C.number }))
      expect(codec.decode({})).toEqual(C.success({}))
      expect(codec.decode({ a: 1 })).toEqual(C.success({ a: 1 }))

      Util.expectFailure(codec, { a: undefined }, `/a undefined did not satisfy is(number)`)
    })

    it("tuple", () => {
      const codec = pipe(C.tuple(C.string, C.number), C.partial)
      expect(codec.decode([])).toEqual(C.success([]))
      expect(codec.decode(["a"])).toEqual(C.success(["a"]))
      expect(codec.decode(["a", 1])).toEqual(C.success(["a", 1]))
    })

    it("array", () => {
      const codec = pipe(C.array(C.number), C.partial)
      expect(codec.decode([])).toEqual(C.success([]))
      expect(codec.decode([1])).toEqual(C.success([1]))
      expect(codec.decode([undefined])).toEqual(C.success([undefined]))

      Util.expectFailureTree(
        codec,
        ["a"],
        `1 error(s) found
└─ index 0
   ├─ union member
   │  └─ "a" did not satisfy is(number)
   └─ union member
      └─ "a" did not satisfy is(undefined)`
      )
    })

    describe.concurrent("union", () => {
      it("baseline", () => {
        const codec = pipe(C.union(C.string, C.array(C.number)), C.partial)
        expect(codec.decode("a")).toEqual(C.success("a"))
        expect(codec.decode([])).toEqual(C.success([]))
        expect(codec.decode([1])).toEqual(C.success([1]))
        expect(codec.decode([undefined])).toEqual(C.success([undefined]))

        Util.expectFailureTree(
          codec,
          ["a"],
          `2 error(s) found
├─ union member
│  └─ index 0
│     ├─ union member
│     │  └─ "a" did not satisfy is(number)
│     └─ union member
│        └─ "a" did not satisfy is(undefined)
└─ union member
   └─ ["a"] did not satisfy is(string)`
        )
      })

      it("empty union", () => {
        const codec = C.union()
        Util.expectFailure(codec, 1, "1 did not satisfy is(never)")
      })

      describe.concurrent("should give precedence to schemas containing more infos", () => {
        it("more required fields", () => {
          const a = C.struct({ a: C.string })
          const ab = C.struct({ a: C.string, b: C.number })
          const codec = C.union(a, ab)
          expect(codec.decode({ a: "a", b: 1 })).toEqual(C.success({ a: "a", b: 1 }))
        })

        it("optional fields", () => {
          const ab = C.struct({ a: C.string, b: C.optional(C.number) })
          const ac = C.struct({ a: C.string, c: C.optional(C.number) })
          const codec = C.union(ab, ac)
          expect(codec.decode({ a: "a", c: 1 })).toEqual(C.success({ a: "a", c: 1 }))
        })

        it("less warnings heuristic", () => {
          const ab = C.struct({ a: C.string, b: C.optional(C.string) })
          const ac = C.struct({ a: C.string, c: C.optional(C.number) })
          const codec = C.union(ab, ac)
          Util.expectWarning(codec, { a: "a", c: NaN }, "/c did not satisfy not(isNaN)", {
            a: "a",
            c: NaN
          })
        })
      })
    })
  })

  it("lazy", () => {
    interface A {
      readonly a: string
      readonly as: ReadonlyArray<A>
    }
    const codec: C.Codec<A> = C.lazy<A>(() =>
      C.struct({
        a: C.string,
        as: C.array(codec)
      })
    )
    expect(codec.decode({ a: "a1", as: [] })).toEqual(C.success({ a: "a1", as: [] }))
    expect(codec.decode({ a: "a1", as: [{ a: "a2", as: [] }] })).toEqual(
      C.success({ a: "a1", as: [{ a: "a2", as: [] }] })
    )

    Util.expectFailure(
      codec,
      { a: "a1", as: [{ a: "a2", as: [1] }] },
      "/as /0 /as /0 1 did not satisfy is({ readonly [x: string]: unknown })"
    )
  })

  describe.concurrent("omit", () => {
    it("baseline", () => {
      const base = C.struct({ a: C.string, b: C.number, c: C.boolean })
      const codec = pipe(base, C.omit("c"))
      Util.expectSuccess(codec, { a: "a", b: 1 })

      Util.expectFailure(
        codec,
        null,
        "null did not satisfy is({ readonly [x: string]: unknown })"
      )
      Util.expectFailure(codec, { a: "a" }, `/b did not satisfy is(required)`)
      Util.expectFailure(codec, { b: 1 }, "/a did not satisfy is(required)")
    })

    it("involving a symbol", () => {
      const a = Symbol.for("@fp-ts/schema/test/a")
      const base = C.struct({ [a]: C.string, b: C.number, c: C.boolean })
      const codec = pipe(base, C.omit("c"))
      Util.expectSuccess(codec, { [a]: "a", b: 1 })

      Util.expectFailure(
        codec,
        null,
        "null did not satisfy is({ readonly [x: string]: unknown })"
      )
      Util.expectFailure(codec, { [a]: "a" }, `/b did not satisfy is(required)`)
      Util.expectFailure(
        codec,
        { b: 1 },
        `/Symbol(@fp-ts/schema/test/a) did not satisfy is(required)`
      )
    })
  })

  describe.concurrent("StringBuilder", () => {
    it("max", () => {
      const codec = C.string.max(1)
      Util.expectSuccess(codec, "")
      Util.expectSuccess(codec, "a")

      Util.expectFailure(codec, "aa", `"aa" did not satisfy MaxLength(1)`)
    })

    it("min", () => {
      const codec = C.string.nonEmpty()
      Util.expectSuccess(codec, "a")
      Util.expectSuccess(codec, "aa")

      Util.expectFailure(codec, "", `"" did not satisfy MinLength(1)`)
    })

    it("length", () => {
      const codec = C.string.length(1)
      Util.expectSuccess(codec, "a")

      Util.expectFailure(codec, "", `"" did not satisfy MinLength(1)`)
      Util.expectFailure(codec, "aa", `"aa" did not satisfy MaxLength(1)`)
    })

    it("startsWith", () => {
      const codec = C.string.startsWith("a")
      Util.expectSuccess(codec, "a")
      Util.expectSuccess(codec, "ab")

      Util.expectFailure(codec, "", `"" did not satisfy StartsWith(a)`)
      Util.expectFailure(codec, "b", `"b" did not satisfy StartsWith(a)`)
    })

    it("endsWith", () => {
      const codec = C.string.endsWith("a")
      Util.expectSuccess(codec, "a")
      Util.expectSuccess(codec, "ba")

      Util.expectFailure(codec, "", `"" did not satisfy EndsWith(a)`)
      Util.expectFailure(codec, "b", `"b" did not satisfy EndsWith(a)`)
    })

    it("regex", () => {
      const codec = C.string.regex(/^abb+$/)
      Util.expectSuccess(codec, "abb")
      Util.expectSuccess(codec, "abbb")

      Util.expectFailure(codec, "ab", `"ab" did not satisfy Regex(^abb+$)`)
      Util.expectFailure(codec, "a", `"a" did not satisfy Regex(^abb+$)`)
    })

    it("filter", () => {
      const codec = C.string.filter((s) =>
        s.length === 1 ? C.success(s) : C.failure(DE.type("Char", s))
      )
      Util.expectSuccess(codec, "a")

      Util.expectFailure(codec, "", `"" did not satisfy is(Char)`)
      Util.expectFailure(codec, "aa", `"aa" did not satisfy is(Char)`)
    })
  })

  describe.concurrent("NumberBuilder", () => {
    it("gt", () => {
      const codec = C.number.gt(0)
      Util.expectSuccess(codec, 1)
    })

    it("gte", () => {
      const codec = C.number.gte(0)
      Util.expectSuccess(codec, 0)
      Util.expectSuccess(codec, 1)

      Util.expectFailure(codec, -1, `-1 did not satisfy GreaterThanOrEqualTo(0)`)
    })

    it("lt", () => {
      const codec = C.number.lt(0)
      Util.expectSuccess(codec, -1)

      Util.expectFailure(codec, 0, `0 did not satisfy LessThan(0)`)
      Util.expectFailure(codec, 1, `1 did not satisfy LessThan(0)`)
    })

    it("lte", () => {
      const codec = C.number.lte(0)
      Util.expectSuccess(codec, -1)
      Util.expectSuccess(codec, 0)

      Util.expectFailure(codec, 1, `1 did not satisfy LessThanOrEqualTo(0)`)
    })

    it("int", () => {
      const codec = C.number.int()
      Util.expectSuccess(codec, 0)
      Util.expectSuccess(codec, 1)

      Util.expectFailure(codec, 1.2, `1.2 did not satisfy is(Int)`)
    })

    it("filter", () => {
      const codec = C.number.filter((n) =>
        n % 2 === 0 ? C.success(n) : C.failure(DE.type("Even", n))
      )
      Util.expectSuccess(codec, 0)
      Util.expectSuccess(codec, 2)
      Util.expectSuccess(codec, 4)

      Util.expectFailure(codec, 1, `1 did not satisfy is(Even)`)
      Util.expectFailure(codec, 3, `3 did not satisfy is(Even)`)
    })
  })
})
