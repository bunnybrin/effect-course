import { FetchError, JsonError } from './errors.ts'
import { Pokemon } from './schemas.ts'
import { Array, Config, Context, Effect, Layer, Schema } from 'effect'


export class PokemonCollection extends Context.Service<
  PokemonCollection,
  Array.NonEmptyArray<string>
>()('PokemonCollection') {
  static readonly Live = Layer.succeed(this, ['staryu', 'perrserker', 'flaaffy'])
}

export class PokeApiUrl extends Context.Service<
  PokeApiUrl,
  string
>()('PokeApiUrl') {
  static readonly Live = Layer.effect(this, Effect.gen(function* () {
    const baseUrl = yield* Config.NonEmptyString('BASE_URL')
    return PokeApiUrl.of(`${baseUrl}/api/v2/pokemon`)
  }))
}

export class BuildPokeApiUrl extends Context.Service<
  BuildPokeApiUrl,
  (props: { name: string }) => string
>()('BuildPokeApiUrl') {
  static readonly Live = Layer.effect(this, Effect.gen(function* () {
    const pokeApiUrl = yield* PokeApiUrl
    return BuildPokeApiUrl.of(({ name }) => `${pokeApiUrl}/${name}`)
  })).pipe(Layer.provide(PokeApiUrl.Live))
}

const make = Effect.gen(function* () {
  const pokemonCollection = yield* PokemonCollection
  const buildPokeApiUrl = yield* BuildPokeApiUrl

  return {
    getPokemon: Effect.gen(function* () {

      const requestUrl = buildPokeApiUrl({ name: pokemonCollection[0] })

      const response = yield* Effect.tryPromise({
        try: () => fetch(requestUrl),
        catch: () => new FetchError(),
      })

      if (!response.ok) {
        return yield* new FetchError()
      }

      const json = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: () => new JsonError(),
      })

      return Schema.decodeUnknownSync(Pokemon)(json)
    }),
  }
})

export class PokeApi extends Context.Service<
  PokeApi,
  Effect.Success<typeof make>
>()('PokeApi') {

  static readonly Live = Layer.effect(this, make).pipe(
    Layer.provide(Layer.mergeAll(PokemonCollection.Live, BuildPokeApiUrl.Live)),
  )

  static readonly Mock = Layer.succeed(
    this,
    PokeApi.of({
      getPokemon: Effect.succeed({
        id: 1,
        height: 10,
        weight: 10,
        name: "my-name",
        order: 1,
      }),
    })
  );
}

