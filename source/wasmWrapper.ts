import wasmLoader, {
  PreRunModule,
  PostRunModule,
  GlueModule,
} from "./WasmModule.js";
export { GlueModule } from "./WasmModule.js";

type Deletable = { delete(): void };
type Scope = Deletable[];

const scopeStack: Scope[] = [];

function pushScope() {
  scopeStack.push([]);
}

function currentScope() {
  return scopeStack[scopeStack.length - 1];
}

function popScope() {
  const scope = scopeStack.pop();
  if (scope) {
    for (const v of scope) {
      v.delete();
    }
  } else {
    console.warn("wasm scope underflow");
  }
}

let loaded: PreRunModule | undefined;
let wasmModule: PostRunModule | undefined;

/**
 * Returns a promise that will resolve after the main method has finished
 */
function getWasm() {
  if (wasmModule) {
    return Promise.resolve(wasmModule);
  } else {
    return new Promise<GlueModule>((res, rej) => {
      if (wasmModule) {
        res(wasmModule);
      } else {
        loaded = loaded || wasmLoader();
        loaded.then((module) => {
          if (!wasmModule) {
            module.callMain();
            module.setConstructCallback((v) => currentScope()?.push(v));
            wasmModule = module;
            // remove `then` propery to resolve promise without creating an endless loop
            (loaded as any)["then"] = undefined;
          }
          res(wasmModule);
        });
      }
    });
  }
}

/**
 * get the scope for debugging and testing
 * @param idx the scope index to get from the top
 */
export function __getCurrentWasmScope(idx = 0) {
  return scopeStack[scopeStack.length - 1 - idx];
}

/**
 * get the scope stack size for debugging and testing
 */
export function __getCurrentWasmScopeStackSize() {
  return scopeStack.length;
}

/**
 * persist a value from the current scope so it will stay alive after the scope is closed
 * @param value: the wasm value to be persisted
 */
export function persistWasmValue<V>(value: V) {
  const scope = currentScope();
  if (scope) {
    const result = scope.splice(scope.indexOf(value as any), 1);
    if (result.length == 0) {
      console.error(
        `could not persist value: value not found in current scope.`
      );
    }
  } else {
    console.error(`persisting a value outside of the current scope.`);
  }
  return value;
}

/**
 * delete persisted values
 */
export function deletePersistedValue(value: any) {
  (value as Deletable).delete();
}

/**
 * Opens a scope and calls `callback` inside
 * @param callback
 */
export function withWasmScope<R>(callback: () => R) {
  pushScope();
  let result: R;
  try {
    result = callback();
  } catch (error) {
    if (typeof error === "number") {
      throw new Error(wasmModule!.getExceptionMessage(error));
    } else {
      throw error;
    }
  } finally {
    popScope();
  }
  return result;
}

/**
 * Calls `callback` asynchronously inside a wasm scope with the wasm module as an argument
 * @param callback
 */
export async function withWasm<R>(callback: (module: GlueModule) => R) {
  const glue = await getWasm();
  return withWasmScope(() => callback(glue));
}
