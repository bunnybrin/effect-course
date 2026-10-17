import { Effect } from 'effect'
import { BuildPokeApiUrl, PokeApi, PokeApiUrl, PokemonCollection } from './PokeApi.ts'


const program = Effect.gen(function* () {
  const pokeApi = yield* PokeApi
  return yield* pokeApi.getPokemon
})

const runnable = program.pipe(
  Effect.provideService(PokeApi, PokeApi.Live),
  Effect.provideService(PokemonCollection, PokemonCollection.Live),
  Effect.provideServiceEffect(BuildPokeApiUrl, BuildPokeApiUrl.Live),
  Effect.provideServiceEffect(PokeApiUrl, PokeApiUrl.Live)
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