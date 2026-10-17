import { Effect, Layer } from 'effect'
import { BuildPokeApiUrl, PokeApi, PokeApiUrl, PokemonCollection } from './PokeApi.ts'

const program = Effect.gen(function* () {
  const pokeApi = yield* PokeApi
  return yield* pokeApi.getPokemon
})

const MainLayer = Layer.mergeAll(
  PokeApi.Live,
)

const runnable = program.pipe(
  Effect.provide(MainLayer),
)

const main = runnable.pipe(
  Effect.catchTags({
    FetchError: () => Effect.succeed('Fetch error'),
    JsonError: () => Effect.succeed('Json error'),
    ConfigError: () => Effect.succeed('ConfigError error'),
  }),
)

Effect.runPromise(main.pipe(Effect.tap((r) => Effect.sync(() => console.log(r)))),
)