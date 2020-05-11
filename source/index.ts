export {
  withWasm as withGreeter,
  withWasmScope as withGreeterScope,
  persistWasmValue as persistGreeterValue,
  deletePersistedValue as deleteGreeterValue,
  GlueModule as GreeterModule,
} from "./wasmWrapper";

export type { Greeter, LanguageCode } from "./WasmModule";
