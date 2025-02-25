import type { TypeLambda } from "@fp-ts/core/HKT"
import type * as applicative from "@fp-ts/core/typeclass/Applicative"
import * as covariant from "@fp-ts/core/typeclass/Covariant"
import { pipe } from "@fp-ts/data/Function"
import * as O from "@fp-ts/data/Option"
import * as RA from "@fp-ts/data/ReadonlyArray"
import * as annotations from "@fp-ts/schema/annotation/AST"
import * as AST from "@fp-ts/schema/AST"
import * as S from "@fp-ts/schema/Schema"
import ts from "typescript"

const printNode = (node: ts.Node, printerOptions?: ts.PrinterOptions): string => {
  const sourceFile = ts.createSourceFile(
    "print.ts",
    "",
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  )
  const printer = ts.createPrinter(printerOptions)
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
}

const printNodes = (
  nodes: Writer<ts.TypeNode>,
  printerOptions?: ts.PrinterOptions
): ReadonlyArray<string> => {
  const [typeNode, declarations] = nodes
  return [...declarations, typeNode].map((node) => printNode(node, printerOptions))
}

type Writer<A> = readonly [A, ReadonlyArray<ts.Declaration>]

interface WriterLambda extends TypeLambda {
  readonly type: Writer<this["Target"]>
}

const map = <A, B>(f: (a: A) => B) => (self: Writer<A>): Writer<B> => [f(self[0]), self[1]]

const Applicative: applicative.Applicative<WriterLambda> = {
  imap: covariant.imap<WriterLambda>(map),
  map,
  product: (that) => (self) => [[self[0], that[0]], self[1].concat(that[1])],
  productMany: (collection) =>
    (self) => {
      const as = Array.from(collection)
      return [
        [self[0], ...as.map((a) => a[0])],
        RA.getMonoid<ts.Declaration>().combineAll(as.map((a) => a[1]))
      ]
    },
  productAll: (collection) => {
    const as = Array.from(collection)
    return [as.map((a) => a[0]), RA.getMonoid<ts.Declaration>().combineAll(as.map((a) => a[1]))]
  },
  of: (a) => [a, []]
}

interface TypeScript<A> extends S.Schema<A> {
  readonly nodes: Writer<ts.TypeNode>
}

const make = (ast: AST.AST, nodes: Writer<ts.TypeNode>): TypeScript<any> => ({ ast, nodes }) as any

const of: <A>(a: A) => Writer<A> = Applicative.of

const traverse: <A, B>(
  f: (a: A) => Writer<B>
) => (self: ReadonlyArray<A>) => Writer<ReadonlyArray<B>> = RA.traverse(Applicative)

const append = <B>(b: Writer<B>) =>
  <A>(
    as: Writer<ReadonlyArray<A>>
  ): Writer<ReadonlyArray<A | B>> => [[...as[0], b[0]], as[1].concat(b[1])]

const appendAll = <B>(bs: Writer<ReadonlyArray<B>>) =>
  <A>(
    as: Writer<ReadonlyArray<A>>
  ): Writer<ReadonlyArray<A | B>> => [[...as[0], ...bs[0]], as[1].concat(bs[1])]

const getIdentifier = AST.getAnnotation<annotations.Identifier>(
  annotations.IdentifierId
)

const addJsDocComment = (node: ts.Node, documentation: string): void => {
  ts.addSyntheticLeadingComment(
    node,
    ts.SyntaxKind.MultiLineCommentTrivia,
    `* ${documentation} `,
    true
  )
}

const addDocumentationOf = (annotated: AST.Annotated) =>
  <N extends ts.Node>(node: N): N => {
    const documentation = getDocumentationAnnotation(annotated)
    if (O.isSome(documentation)) {
      addJsDocComment(node, documentation.value)
    }
    return node
  }

const createSymbol = (description: string | undefined) =>
  ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier("Symbol"),
      "for"
    ),
    [],
    description === undefined ? [] : [ts.factory.createStringLiteral(description)]
  )

const getPropertyName = (ast: AST.PropertySignature): ts.PropertyName =>
  typeof ast.name === "symbol" ?
    ts.factory.createComputedPropertyName(createSymbol(ast.name.description)) :
    ts.factory.createIdentifier(String(ast.name))

const getDocumentationAnnotation = AST.getAnnotation<annotations.Documentation>(
  annotations.DocumentationId
)

const typeScriptFor = <A>(schema: S.Schema<A>): TypeScript<A> => {
  const go = (ast: AST.AST): TypeScript<any> => {
    switch (ast._tag) {
      case "TypeAlias":
        return pipe(
          getIdentifier(ast),
          O.match(
            () => go(ast.type),
            (id) =>
              make(
                ast,
                pipe(
                  ast.typeParameters,
                  traverse((ast) => go(ast).nodes),
                  map((typeParameters) => ts.factory.createTypeReferenceNode(id, typeParameters))
                )
              )
          )
        )
      case "Literal": {
        const literal = ast.literal
        if (typeof literal === "string") {
          return make(
            ast,
            of(ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(literal)))
          )
        } else if (typeof literal === "number") {
          return make(
            ast,
            of(ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(literal)))
          )
        } else if (typeof literal === "boolean") {
          return literal === true ?
            make(ast, of(ts.factory.createLiteralTypeNode(ts.factory.createTrue()))) :
            make(ast, of(ts.factory.createLiteralTypeNode(ts.factory.createFalse())))
        } else if (typeof literal === "bigint") {
          return make(
            ast,
            of(
              ts.factory.createLiteralTypeNode(ts.factory.createBigIntLiteral(literal.toString()))
            )
          )
        } else {
          return make(ast, of(ts.factory.createLiteralTypeNode(ts.factory.createNull())))
        }
      }
      case "UniqueSymbol": {
        const id = pipe(
          getIdentifier(ast),
          O.map((id) => ts.factory.createIdentifier(id)),
          O.getOrThrow(() =>
            new Error(`cannot find an indentifier for this unique symbol ${String(ast.symbol)}`)
          )
        )
        const typeNode = ts.factory.createTypeQueryNode(id)
        const declaration = ts.factory.createVariableDeclaration(
          id,
          undefined,
          undefined,
          createSymbol(ast.symbol.description)
        )
        return make(
          ast,
          [typeNode, [declaration]]
        )
      }
      case "UndefinedKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)))
      case "VoidKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)))
      case "NeverKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)))
      case "UnknownKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)))
      case "AnyKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)))
      case "StringKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)))
      case "NumberKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)))
      case "BooleanKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)))
      case "BigIntKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword)))
      case "SymbolKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.SymbolKeyword)))
      case "ObjectKeyword":
        return make(ast, of(ts.factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword)))
      case "Tuple": {
        let elements = pipe(
          ast.elements,
          traverse((e) =>
            pipe(
              go(e.type).nodes,
              map((element) => e.isOptional ? ts.factory.createOptionalTypeNode(element) : element)
            )
          )
        )
        if (O.isSome(ast.rest)) {
          const isArray = RA.isEmpty(ast.elements) && ast.rest.value.length === 1
          if (isArray) {
            return make(
              ast,
              pipe(
                go(RA.headNonEmpty(ast.rest.value)).nodes,
                map((item) => {
                  const arrayTypeNode = ts.factory.createArrayTypeNode(item)
                  return ast.isReadonly ?
                    ts.factory.createTypeOperatorNode(
                      ts.SyntaxKind.ReadonlyKeyword,
                      arrayTypeNode
                    ) :
                    arrayTypeNode
                })
              )
            )
          } else {
            elements = pipe(
              elements,
              append(pipe(
                go(RA.headNonEmpty(ast.rest.value)).nodes,
                map((head) => ts.factory.createRestTypeNode(ts.factory.createArrayTypeNode(head)))
              )),
              appendAll(pipe(RA.tailNonEmpty(ast.rest.value), traverse((ast) => go(ast).nodes)))
            )
          }
        }
        return make(
          ast,
          pipe(
            elements,
            map((elements) => {
              const tuple = ts.factory.createTupleTypeNode(elements)
              return ast.isReadonly ?
                ts.factory.createTypeOperatorNode(ts.SyntaxKind.ReadonlyKeyword, tuple) :
                tuple
            })
          )
        )
      }
      case "Union":
        return make(
          ast,
          pipe(
            ast.types,
            traverse((ast) => go(ast).nodes),
            map((members) => ts.factory.createUnionTypeNode(members))
          )
        )
      case "TypeLiteral":
        return make(
          ast,
          pipe(
            ast.propertySignatures,
            traverse(
              (ps) =>
                pipe(
                  go(ps.type).nodes,
                  map((type) =>
                    ts.factory.createPropertySignature(
                      ps.isReadonly ?
                        [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)] :
                        undefined,
                      getPropertyName(ps),
                      ps.isOptional ?
                        ts.factory.createToken(ts.SyntaxKind.QuestionToken) :
                        undefined,
                      type
                    )
                  ),
                  map(addDocumentationOf(ps))
                )
            ),
            appendAll(pipe(
              ast.indexSignatures,
              traverse((indexSignature) =>
                pipe(
                  go(indexSignature.parameter).nodes,
                  Applicative.product(go(indexSignature.type).nodes),
                  map(([key, value]) =>
                    ts.factory.createIndexSignature(
                      indexSignature.isReadonly ?
                        [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)] :
                        undefined,
                      [ts.factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        "x",
                        undefined,
                        key
                      )],
                      value
                    )
                  )
                )
              )
            )),
            map((members) => ts.factory.createTypeLiteralNode(members))
          )
        )
      case "Lazy":
        throw new Error("Unhandled schema: TODO")
      case "Enums": {
        const id = pipe(
          getIdentifier(ast),
          O.map((id) => ts.factory.createIdentifier(id)),
          O.getOrThrow(() => new Error(`cannot find an indentifier for this enum`))
        )
        const typeNode = ts.factory.createTypeQueryNode(id)
        const declaration = ts.factory.createEnumDeclaration(
          undefined,
          id,
          ast.enums.map(([key, value]) =>
            ts.factory.createEnumMember(
              key,
              typeof value === "string" ?
                ts.factory.createStringLiteral(value) :
                ts.factory.createNumericLiteral(value)
            )
          )
        )
        return make(
          ast,
          [typeNode, [declaration]]
        )
      }
      case "Refinement":
        return go(ast.from)
      case "TemplateLiteral": {
        const spans: Array<ts.TemplateLiteralTypeSpan> = []
        for (let i = 0; i < ast.spans.length; i++) {
          spans.push(ts.factory.createTemplateLiteralTypeSpan(
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            i < ast.spans.length - 1 ?
              ts.factory.createTemplateMiddle(ast.spans[i].literal) :
              ts.factory.createTemplateTail(ast.spans[i].literal)
          ))
        }
        return make(
          ast,
          of(ts.factory.createTemplateLiteralType(
            ts.factory.createTemplateHead(ast.head),
            spans
          ))
        )
      }
      case "Transform":
        return go(ast.to)
    }
  }

  return go(schema.ast)
}

describe.concurrent("TypeScript", () => {
  it("templateLiteral. a", () => {
    const schema = S.templateLiteral(S.literal("a"))
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual([`"a"`])
  })

  it("templateLiteral. a b", () => {
    const schema = S.templateLiteral(S.literal("a"), S.literal(" "), S.literal("b"))
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual([`"a b"`])
  })

  it("templateLiteral. a${string}", () => {
    const schema = S.templateLiteral(S.literal("a"), S.string)
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["`a${string}`"])
  })

  it("templateLiteral. ${string}", () => {
    const schema = S.templateLiteral(S.string)
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["`${string}`"])
  })

  it("templateLiteral. a${string}b", () => {
    const schema = S.templateLiteral(S.literal("a"), S.string, S.literal("b"))
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["`a${string}b`"])
  })

  it("templateLiteral. https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html", () => {
    const EmailLocaleIDs = S.literal("welcome_email", "email_heading")
    const FooterLocaleIDs = S.literal("footer_title", "footer_sendoff")
    const schema = S.templateLiteral(S.union(EmailLocaleIDs, FooterLocaleIDs), S.literal("_id"))
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual([
      `"welcome_email_id" | "email_heading_id" | "footer_title_id" | "footer_sendoff_id"`
    ])
  })

  it("never", () => {
    const schema = S.never
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["never"])
  })

  it("undefined", () => {
    const schema = S.undefined
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["undefined"])
  })

  it("void", () => {
    const schema = S.void
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["void"])
  })

  it("string", () => {
    const schema = S.string
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["string"])
  })

  it("number", () => {
    const schema = S.number
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["number"])
  })

  it("boolean", () => {
    const schema = S.boolean
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["boolean"])
  })

  it("bigint", () => {
    const schema = S.bigint
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["bigint"])
  })

  it("symbol", () => {
    const schema = S.symbol
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["symbol"])
  })

  it("object", () => {
    const schema = S.object
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["object"])
  })

  it("undefined", () => {
    const schema = S.undefined
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual(["undefined"])
  })

  describe.concurrent("literal", () => {
    it("string", () => {
      const schema = S.literal("a")
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`"a"`])
    })

    it("number", () => {
      const schema = S.literal(1)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual(["1"])
    })

    it("true", () => {
      const schema = S.literal(true)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`true`])
    })

    it("false", () => {
      const schema = S.literal(false)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`false`])
    })

    it("null", () => {
      const schema = S.literal(null)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`null`])
    })
  })

  it("uniqueSymbol", () => {
    const schema = S.uniqueSymbol(Symbol.for("@fp-ts/schema/test/a"), {
      [annotations.IdentifierId]: "a"
    })
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual([`a = Symbol.for("@fp-ts/schema/test/a")`, `typeof a`])
  })

  it("enums", () => {
    enum Fruits {
      Apple,
      Banana
    }
    const schema = pipe(S.enums(Fruits), S.identifier("Fruits"))
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual([
      `enum Fruits {
    Apple = 0,
    Banana = 1
}`,
      `typeof Fruits`
    ])
  })

  describe.concurrent("tuple", () => {
    it("required element", () => {
      const schema = S.tuple(S.number)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    number
]`])
    })

    it("required element with undefined", () => {
      const schema = S.tuple(S.union(S.number, S.undefined))
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    number | undefined
]`])
    })

    it("optional element", () => {
      const schema = pipe(S.tuple(), S.optionalElement(S.number))
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    number?
]`])
    })

    it("optional element with undefined", () => {
      const schema = pipe(S.tuple(), S.optionalElement(S.union(S.number, S.undefined)))
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    (number | undefined)?
]`])
    })

    it("baseline", () => {
      const schema = S.tuple(S.string, S.number)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    string,
    number
]`])
    })

    it("empty tuple", () => {
      const schema = S.tuple()
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
]`])
    })

    it("optional elements", () => {
      const schema = S.partial(S.tuple(S.string, S.number))
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    string?,
    number?
]`])
    })

    it("array", () => {
      const schema = S.array(S.string)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly string[]`])
    })

    it("post rest element", () => {
      const schema = pipe(S.array(S.number), S.element(S.boolean))
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    ...number[],
    boolean
]`])
    })

    it("post rest elements", () => {
      const schema = pipe(
        S.array(S.number),
        S.element(S.boolean),
        S.element(S.union(S.string, S.undefined))
      )
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    ...number[],
    boolean,
    string | undefined
]`])
    })

    it("post rest elements when rest is unknown", () => {
      const schema = pipe(S.array(S.unknown), S.element(S.boolean))
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    ...unknown[],
    boolean
]`])
    })

    it("all", () => {
      const schema = pipe(
        S.tuple(S.string),
        S.rest(S.number),
        S.element(S.boolean)
      )
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    string,
    ...number[],
    boolean
]`])
    })

    it("all with symbols", () => {
      const schema = pipe(
        S.tuple(
          S.uniqueSymbol(Symbol.for("@fp-ts/schema/test/a"), {
            [annotations.IdentifierId]: "a"
          })
        ),
        S.rest(S.uniqueSymbol(Symbol.for("@fp-ts/schema/test/b"), {
          [annotations.IdentifierId]: "b"
        })),
        S.element(S.uniqueSymbol(Symbol.for("@fp-ts/schema/test/c"), {
          [annotations.IdentifierId]: "c"
        }))
      )
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([
        `a = Symbol.for("@fp-ts/schema/test/a")`,
        `b = Symbol.for("@fp-ts/schema/test/b")`,
        `c = Symbol.for("@fp-ts/schema/test/c")`,
        `readonly [
    typeof a,
    ...(typeof b)[],
    typeof c
]`
      ])
    })

    it("nonEmptyArray", () => {
      const schema = S.nonEmptyArray(S.number)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly [
    number,
    ...number[]
]`])
    })

    it("ReadonlyArray<unknown>", () => {
      const schema = S.array(S.unknown)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly unknown[]`])
    })

    it("ReadonlyArray<any>", () => {
      const schema = S.array(S.any)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`readonly any[]`])
    })
  })

  describe.concurrent("struct", () => {
    it("required property signature", () => {
      const schema = S.struct({ a: S.number })
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`{
    readonly a: number;
}`])
    })

    it("required property signature with undefined", () => {
      const schema = S.struct({ a: S.union(S.number, S.undefined) })
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`{
    readonly a: number | undefined;
}`])
    })

    it("optional property signature", () => {
      const schema = S.struct({ a: S.optional(S.number) })
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`{
    readonly a?: number;
}`])
    })

    it("optional property signature with undefined", () => {
      const schema = S.struct({ a: S.optional(S.union(S.number, S.undefined)) })
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`{
    readonly a?: number | undefined;
}`])
    })

    it("record(string, unknown)", () => {
      const schema = S.record(S.string, S.unknown)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`{
    readonly [x: string]: unknown;
}`])
    })

    it("record(string, any)", () => {
      const schema = S.record(S.string, S.any)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`{
    readonly [x: string]: any;
}`])
    })

    it("record(string, string)", () => {
      const schema = S.record(S.string, S.string)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`{
    readonly [x: string]: string;
}`])
    })

    it("record(symbol, string)", () => {
      const schema = S.record(S.symbol, S.string)
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`{
    readonly [x: symbol]: string;
}`])
    })

    it("all with symbols", () => {
      const a = Symbol.for("@fp-ts/schema/test/a")
      const b = Symbol.for("@fp-ts/schema/test/b")
      const schema = pipe(
        S.struct({
          [a]: S.uniqueSymbol(b, {
            [annotations.IdentifierId]: "b"
          }),
          c: S.number
        }),
        S.extend(
          S.record(
            S.string,
            S.uniqueSymbol(Symbol.for("@fp-ts/schema/test/d"), {
              [annotations.IdentifierId]: "d"
            })
          )
        )
      )
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([
        `b = Symbol.for("@fp-ts/schema/test/b")`,
        `d = Symbol.for("@fp-ts/schema/test/d")`,
        `{
    readonly [Symbol.for("@fp-ts/schema/test/a")]: typeof b;
    readonly c: number;
    readonly [x: string]: typeof d;
}`
      ])
    })
  })

  it("union", () => {
    const schema = S.union(
      S.string,
      S.number,
      S.uniqueSymbol(Symbol.for("@fp-ts/schema/test/a"), {
        [annotations.IdentifierId]: "a"
      })
    )
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual([
      `a = Symbol.for("@fp-ts/schema/test/a")`,
      `string | number | typeof a`
    ])
  })

  it("Option", () => {
    const schema = S.option(S.struct({ a: S.string }))
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual([`Option<{
    readonly a: string;
}>`])
  })

  it("example: compile to TypeScript AST", () => {
    const schema = S.struct({
      name: S.string,
      age: S.number
    })
    // const typeNode: ts.TypeNode
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual([`{
    readonly name: string;
    readonly age: number;
}`])
  })

  it("int", () => {
    const schema = pipe(S.number, S.int())
    const ts = typeScriptFor(schema)
    expect(printNodes(ts.nodes)).toEqual([`number`])
  })

  describe.concurrent("jsDoc", () => {
    it("property signatures", () => {
      const schema = S.make(AST.typeLiteral(
        [
          AST.propertySignature("a", AST.stringKeyword, false, true, {
            [annotations.DocumentationId]: "description"
          })
        ],
        []
      ))
      const ts = typeScriptFor(schema)
      expect(printNodes(ts.nodes)).toEqual([`{
    /** description */
    readonly a: string;
}`])
    })
  })
})
