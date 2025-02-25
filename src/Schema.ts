/**
 * @since 1.0.0
 */

import { pipe } from "@fp-ts/data/Function"
import type { Json } from "@fp-ts/data/Json"
import type { Option } from "@fp-ts/data/Option"
import type { Predicate, Refinement } from "@fp-ts/data/Predicate"
import * as RA from "@fp-ts/data/ReadonlyArray"
import * as A from "@fp-ts/schema/annotation/AST"
import * as AST from "@fp-ts/schema/AST"
import * as F from "@fp-ts/schema/data/filter"
import * as DataJson from "@fp-ts/schema/data/Json"
import * as DataOption from "@fp-ts/schema/data/Option"
import * as I from "@fp-ts/schema/internal/common"
import type { Parser } from "@fp-ts/schema/Parser"

/**
 * @category model
 * @since 1.0.0
 */
export interface Schema<A> {
  readonly A: (_: A) => A
  readonly ast: AST.AST
}

/**
 * @since 1.0.0
 */
export type Infer<S extends Schema<any>> = Parameters<S["A"]>[0]

// ---------------------------------------------
// constructors
// ---------------------------------------------

/**
 * @category constructors
 * @since 1.0.0
 */
export const make: <A>(ast: AST.AST) => Schema<A> = I.makeSchema

/**
 * @category constructors
 * @since 1.0.0
 */
export const literal: <Literals extends ReadonlyArray<AST.LiteralValue>>(
  ...literals: Literals
) => Schema<Literals[number]> = I.literal

/**
 * @category constructors
 * @since 1.0.0
 */
export const uniqueSymbol: <S extends symbol>(
  symbol: S,
  annotations?: AST.Annotated["annotations"]
) => Schema<S> = I.uniqueSymbol

/**
 * @category constructors
 * @since 1.0.0
 */
export const enums = <A extends { [x: string]: string | number }>(
  enums: A
): Schema<A[keyof A]> =>
  make(
    AST.enums(
      Object.keys(enums).filter(
        (key) => typeof enums[enums[key]] !== "number"
      ).map((key) => [key, enums[key]])
    )
  )

/**
 * @category constructors
 * @since 1.0.0
 */
export const instanceOf: <A extends abstract new(...args: any) => any>(
  constructor: A,
  annotationOptions?: AnnotationOptions<object>
) => (self: Schema<object>) => Schema<InstanceType<A>> = F.instanceOf

/**
 * @since 1.0.0
 */
export type Join<T> = T extends [infer Head, ...infer Tail]
  ? `${Head & (string | number | bigint | boolean | null | undefined)}${Tail extends [] ? ""
    : Join<Tail>}`
  : never

/**
 * @category constructors
 * @since 1.0.0
 */
export const templateLiteral = <T extends [Schema<any>, ...Array<Schema<any>>]>(
  ...[head, ...tail]: T
): Schema<Join<{ [K in keyof T]: Infer<T[K]> }>> => {
  let types: ReadonlyArray<AST.TemplateLiteral | AST.Literal> = getTemplateLiterals(head.ast)
  for (const span of tail) {
    types = pipe(
      types,
      RA.flatMap((a) => getTemplateLiterals(span.ast).map((b) => combineTemplateLiterals(a, b)))
    )
  }
  return make(AST.union(types))
}

const combineTemplateLiterals = (
  a: AST.TemplateLiteral | AST.Literal,
  b: AST.TemplateLiteral | AST.Literal
): AST.TemplateLiteral | AST.Literal => {
  if (AST.isLiteral(a)) {
    return AST.isLiteral(b) ?
      AST.literal(String(a.literal) + String(b.literal)) :
      AST.templateLiteral(String(a.literal) + b.head, b.spans)
  }
  if (AST.isLiteral(b)) {
    return AST.templateLiteral(
      a.head,
      pipe(
        a.spans,
        RA.modifyNonEmptyLast((span) => ({ ...span, literal: span.literal + String(b.literal) }))
      )
    )
  }
  return AST.templateLiteral(
    a.head,
    pipe(
      a.spans,
      RA.modifyNonEmptyLast((span) => ({ ...span, literal: span.literal + String(b.head) })),
      RA.appendAll(b.spans)
    )
  )
}

const getTemplateLiterals = (
  ast: AST.AST
): ReadonlyArray<AST.TemplateLiteral | AST.Literal> => {
  switch (ast._tag) {
    case "Literal":
      return [ast]
    case "NumberKeyword":
    case "StringKeyword":
      return [AST.templateLiteral("", [{ type: ast, literal: "" }])]
    case "Union":
      return pipe(ast.types, RA.flatMap(getTemplateLiterals))
    default:
      throw new Error(`Unsupported template literal span ${ast._tag}`)
  }
}

/**
  @category combinators
  @since 1.0.0
*/
export const typeAlias: (
  typeParameters: ReadonlyArray<Schema<any>>,
  type: Schema<any>,
  annotations?: AST.Annotated["annotations"]
) => Schema<any> = I.typeAlias

// ---------------------------------------------
// filters
// ---------------------------------------------

/**
 * @category filters
 * @since 1.0.0
 */
export const minLength: <A extends string>(
  minLength: number,
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.minLength

/**
 * @category filters
 * @since 1.0.0
 */
export const maxLength: <A extends string>(
  maxLength: number,
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.maxLength

/**
 * @category filters
 * @since 1.0.0
 */
export const length = <A extends string>(
  length: number,
  annotationOptions?: AnnotationOptions<A>
) =>
  (self: Schema<A>): Schema<A> => minLength(length, annotationOptions)(maxLength<A>(length)(self))

/**
 * @category filters
 * @since 1.0.0
 */
export const nonEmpty = <A extends string>(
  annotationOptions?: AnnotationOptions<A>
): (self: Schema<A>) => Schema<A> => minLength(1, annotationOptions)

/**
 * @category filters
 * @since 1.0.0
 */
export const startsWith: <A extends string>(
  startsWith: string,
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.startsWith

/**
 * @category filters
 * @since 1.0.0
 */
export const endsWith: <A extends string>(
  endsWith: string,
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.endsWith

/**
 * @category filters
 * @since 1.0.0
 */
export const includes: <A extends string>(
  searchString: string,
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.includes

/**
 * @category filters
 * @since 1.0.0
 */
export const pattern: <A extends string>(
  regex: RegExp,
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.pattern

/**
 * @category filters
 * @since 1.0.0
 */
export const lessThan: <A extends number>(
  max: number,
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.lessThan

/**
 * @category filters
 * @since 1.0.0
 */
export const lessThanOrEqualTo: <A extends number>(
  max: number,
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.lessThanOrEqualTo

/**
 * @category filters
 * @since 1.0.0
 */
export const greaterThan: <A extends number>(
  min: number,
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.greaterThan

/**
 * @category filters
 * @since 1.0.0
 */
export const greaterThanOrEqualTo: <A extends number>(
  min: number,
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.greaterThanOrEqualTo

/**
 * @category filters
 * @since 1.0.0
 */
export const int: <A extends number>(
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.int

/**
 * @category filters
 * @since 1.0.0
 */
export const nonNaN: <A extends number>(
  annotationOptions?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.nonNaN

/**
 * @category filters
 * @since 1.0.0
 */
export const finite: <A extends number>(
  options?: AnnotationOptions<A>
) => (self: Schema<A>) => Schema<A> = F.finite

// ---------------------------------------------
// combinators
// ---------------------------------------------

/**
 * @category combinators
 * @since 1.0.0
 */
export const union: <Members extends ReadonlyArray<Schema<any>>>(
  ...members: Members
) => Schema<Infer<Members[number]>> = I.union

/**
 * @category combinators
 * @since 1.0.0
 */
export const nullable: <A>(self: Schema<A>) => Schema<A | null> = I.nullable

/**
 * @category combinators
 * @since 1.0.0
 */
export const keyof = <A>(schema: Schema<A>): Schema<keyof A> => make(AST.keyof(schema.ast))

/**
 * @category combinators
 * @since 1.0.0
 */
export const tuple: <Elements extends ReadonlyArray<Schema<any>>>(
  ...elements: Elements
) => Schema<{ readonly [K in keyof Elements]: Infer<Elements[K]> }> = I.tuple

/**
 * @category combinators
 * @since 1.0.0
 */
export const rest = <R>(rest: Schema<R>) =>
  <A extends ReadonlyArray<any>>(self: Schema<A>): Schema<readonly [...A, ...Array<R>]> => {
    if (AST.isTuple(self.ast)) {
      return make(AST.appendRestElement(self.ast, rest.ast))
    }
    throw new Error("`rest` is not supported on this schema")
  }

/**
 * @category combinators
 * @since 1.0.0
 */
export const element = <E>(element: Schema<E>) =>
  <A extends ReadonlyArray<any>>(self: Schema<A>): Schema<readonly [...A, E]> => {
    if (AST.isTuple(self.ast)) {
      return make(AST.appendElement(self.ast, AST.element(element.ast, false)))
    }
    throw new Error("`element` is not supported on this schema")
  }

/**
 * @category combinators
 * @since 1.0.0
 */
export const optionalElement = <E>(element: Schema<E>) =>
  <A extends ReadonlyArray<any>>(self: Schema<A>): Schema<readonly [...A, E?]> => {
    if (AST.isTuple(self.ast)) {
      return make(AST.appendElement(self.ast, AST.element(element.ast, true)))
    }
    throw new Error("`optionalElement` is not supported on this schema")
  }

/**
 * @category combinators
 * @since 1.0.0
 */
export const array: <A>(item: Schema<A>) => Schema<ReadonlyArray<A>> = I.array

/**
 * @category combinators
 * @since 1.0.0
 */
export const nonEmptyArray = <A>(
  item: Schema<A>
): Schema<readonly [A, ...Array<A>]> => pipe(tuple(item), rest(item))

/**
 * @since 1.0.0
 */
export type Spread<A> = {
  [K in keyof A]: A[K]
} extends infer B ? B : never

/**
 * @category symbol
 * @since 1.0.0
 */
export const OptionalSchemaId = Symbol.for("@fp-ts/schema/Schema/OptionalSchema")

/**
 * @category symbol
 * @since 1.0.0
 */
export type OptionalSchemaId = typeof OptionalSchemaId

/**
 * @since 1.0.0
 */
export interface OptionalSchema<A, isOptional extends boolean> extends Schema<A>, AST.Annotated {
  readonly _id: OptionalSchemaId
  readonly isOptional: isOptional
}

/**
 * @category combinators
 * @since 1.0.0
 */
export const optional: <A>(schema: Schema<A>) => OptionalSchema<A, true> = I.optional

/**
 * @since 1.0.0
 */
export type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends OptionalSchema<any, true> ? K : never
}[keyof T]

/**
 * @category combinators
 * @since 1.0.0
 */
export const struct: <Fields extends Record<PropertyKey, Schema<any>>>(
  fields: Fields
) => Schema<
  Spread<
    & { readonly [K in Exclude<keyof Fields, OptionalKeys<Fields>>]: Infer<Fields[K]> }
    & { readonly [K in OptionalKeys<Fields>]?: Infer<Fields[K]> }
  >
> = I.struct

/**
 * @category combinators
 * @since 1.0.0
 */
export const pick = <A, Keys extends ReadonlyArray<keyof A>>(...keys: Keys) =>
  (self: Schema<A>): Schema<{ readonly [P in Keys[number]]: A[P] }> =>
    make(AST.pick(self.ast, keys))

/**
 * @category combinators
 * @since 1.0.0
 */
export const omit = <A, Keys extends ReadonlyArray<keyof A>>(...keys: Keys) =>
  (self: Schema<A>): Schema<{ readonly [P in Exclude<keyof A, Keys[number]>]: A[P] }> =>
    make(AST.omit(self.ast, keys))

/**
 * @category combinators
 * @since 1.0.0
 */
export const partial = <A>(self: Schema<A>): Schema<Partial<A>> => make(AST.partial(self.ast))

/**
 * @category combinators
 * @since 1.0.0
 */
export const record: <K extends string | symbol, V>(
  key: Schema<K>,
  value: Schema<V>
) => Schema<{ readonly [k in K]: V }> = I.record

/**
 * @category combinators
 * @since 1.0.0
 */
export const extend = <B>(that: Schema<B>) =>
  <A>(self: Schema<A>): Schema<Spread<A & B>> => {
    if (AST.isTypeLiteral(self.ast) && AST.isTypeLiteral(that.ast)) {
      return make(AST.typeLiteral(
        self.ast.propertySignatures.concat(that.ast.propertySignatures),
        self.ast.indexSignatures.concat(that.ast.indexSignatures)
      ))
    }
    throw new Error("`extend` is not supported on this schema")
  }

/**
 * @category combinators
 * @since 1.0.0
 */
export const lazy: <A>(
  f: () => Schema<A>,
  annotations?: AST.Annotated["annotations"]
) => Schema<A> = I.lazy

/**
 * @category combinators
 * @since 1.0.0
 */
export type AnnotationOptions<A> = {
  message?: A.Message<A>
  identifier?: A.Identifier
  title?: A.Title
  description?: A.Description
  examples?: A.Examples
  documentation?: A.Documentation
  jsonSchema?: A.JSONSchema
  custom?: A.Custom
}

/**
 * @category combinators
 * @since 1.0.0
 */
export function filter<A, B extends A>(
  refinement: Refinement<A, B>,
  annotationOptions?: AnnotationOptions<A>
): (self: Schema<A>) => Schema<B>
export function filter<A>(
  predicate: Predicate<A>,
  options?: AnnotationOptions<A>
): (self: Schema<A>) => Schema<A>
export function filter<A>(
  predicate: Predicate<A>,
  options?: AnnotationOptions<A>
): (self: Schema<A>) => Schema<A> {
  return I.filter(predicate, options)
}

/**
  Create a new `Schema` by transforming the input and output of an existing `Schema`
  using the provided decoding functions.

  @category combinators
  @since 1.0.0
 */
export const transformOrFail: <A, B>(
  to: Schema<B>,
  decode: Parser<A, B>["parse"],
  encode: Parser<B, A>["parse"]
) => (self: Schema<A>) => Schema<B> = I.transformOrFail

/**
  Create a new `Schema` by transforming the input and output of an existing `Schema`
  using the provided mapping functions.

  @category combinators
  @since 1.0.0
*/
export const transform: <A, B>(
  to: Schema<B>,
  f: (a: A) => B,
  g: (b: B) => A
) => (self: Schema<A>) => Schema<B> = I.transform

// ---------------------------------------------
// annotations
// ---------------------------------------------

/**
 * @category annotations
 * @since 1.0.0
 */
export const annotations: (
  annotations: AST.Annotated["annotations"]
) => <A>(self: Schema<A>) => Schema<A> = I.annotations

/**
 * @category annotations
 * @since 1.0.0
 */
export const message = (message: A.Message<unknown>) =>
  <A>(self: Schema<A>): Schema<A> => make(AST.annotation(self.ast, A.MessageId, message))

/**
 * @category annotations
 * @since 1.0.0
 */
export const identifier = (identifier: A.Identifier) =>
  <A>(self: Schema<A>): Schema<A> => make(AST.annotation(self.ast, A.IdentifierId, identifier))

/**
 * @category annotations
 * @since 1.0.0
 */
export const title = (title: A.Title) =>
  <A>(self: Schema<A>): Schema<A> => make(AST.annotation(self.ast, A.TitleId, title))

/**
 * @category annotations
 * @since 1.0.0
 */
export const description = (description: A.Description) =>
  <A>(self: Schema<A>): Schema<A> => make(AST.annotation(self.ast, A.DescriptionId, description))

/**
 * @category annotations
 * @since 1.0.0
 */
export const examples = (examples: A.Examples) =>
  <A>(self: Schema<A>): Schema<A> => make(AST.annotation(self.ast, A.ExamplesId, examples))

/**
 * @category annotations
 * @since 1.0.0
 */
export const documentation = (documentation: A.Documentation) =>
  <A>(self: Schema<A>): Schema<A> =>
    make(AST.annotation(self.ast, A.DocumentationId, documentation))

// ---------------------------------------------
// data
// ---------------------------------------------

const _undefined: Schema<undefined> = I._undefined

const _void: Schema<void> = I._void

const _null: Schema<null> = I._null

export {
  /**
   * @category primitives
   * @since 1.0.0
   */
  _null as null,
  /**
   * @category primitives
   * @since 1.0.0
   */
  _undefined as undefined,
  /**
   * @category primitives
   * @since 1.0.0
   */
  _void as void
}

/**
 * @category primitives
 * @since 1.0.0
 */
export const never: Schema<never> = I.never

/**
 * @category primitives
 * @since 1.0.0
 */
export const unknown: Schema<unknown> = I.unknown

/**
 * @category primitives
 * @since 1.0.0
 */
export const any: Schema<any> = I.any

/**
 * @category primitives
 * @since 1.0.0
 */
export const string: Schema<string> = I.string

/**
 * @category primitives
 * @since 1.0.0
 */
export const number: Schema<number> = I.number

/**
 * @category primitives
 * @since 1.0.0
 */
export const boolean: Schema<boolean> = I.boolean

/**
 * @category primitives
 * @since 1.0.0
 */
export const bigint: Schema<bigint> = I.bigint

/**
 * @category primitives
 * @since 1.0.0
 */
export const symbol: Schema<symbol> = I.symbol

/**
 * @category primitives
 * @since 1.0.0
 */
export const object: Schema<object> = I.object

/**
 * @category data
 * @since 1.0.0
 */
export const json: Schema<Json> = DataJson.json

/**
  @category data
  @since 1.0.0
 */
export const option: <A>(value: Schema<A>) => Schema<Option<A>> = DataOption.fromNullable
