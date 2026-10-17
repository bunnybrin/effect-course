import { FetchError, JsonError } from './errors.ts'
import { Pokemon } from './schemas.ts'
import { Array, Config, Context, Effect, Schema } from 'effect'

const make = {
  getPokemon: Effect.gen(function* () {
    const pokemonCollection = yield* PokemonCollection
    const buildPokeApiUrl = yield* BuildPokeApiUrl

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

export class PokeApi extends Context.Service<
  PokeApi,
  typeof make
>()('PokeApi') {

  static readonly Live = PokeApi.of(make)

  static readonly Test = PokeApi.of({
    getPokemon: Effect.succeed({
      id: 1,
      height: 10,
      weight: 10,
      order: 1,
      name: 'myname',
    }),
  })
}


export class PokemonCollection extends Context.Service<
  PokemonCollection,
  Array.NonEmptyArray<string>
>()('PokemonCollection') {
  static readonly Live = PokemonCollection.of(['staryu', 'perrserker', 'flaaffy'])
}

export class BuildPokeApiUrl extends Context.Service<
  BuildPokeApiUrl,
  (props: { name: string }) => string
>()('BuildPokeApiUrl') {
  static readonly Live = Effect.gen(function* () {
    const pokeApiUrl = yield* PokeApiUrl
    return BuildPokeApiUrl.of(({ name }) => `${pokeApiUrl}/${name}`)
  })
}

export class PokeApiUrl extends Context.Service<
  PokeApiUrl,
  string
>()('PokeApiUrl') {
  static readonly Live = Effect.gen(function* () {
    const baseUrl = yield* Config.NonEmptyString('BASE_URL')
    return PokeApiUrl.of(`${baseUrl}/api/v2/pokemon`)
  })
}