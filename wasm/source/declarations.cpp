#include <glue/context.h>
#include <glue/declarations.h>

#include <iostream>

#include "wasmGlue.h"

int main() {
  auto glueValue = wasmGlue();

  glue::Context context;
  context.addRootMap(glueValue);

  glue::DeclarationPrinter printer;
  printer.init();

  printer.print(std::cout, glueValue, &context);

  // export declarations as PostRunModule (module type after main() has completed)
  std::cout << "\n\nexport type GlueModule = {\n";
  for (auto key : glueValue.keys()) {
    std::cout << "  " << key << ": "
              << "typeof " << key << ";\n";
  }
  std::cout << "}\n";

  // EmGlue internal funcions
  std::cout << R"(export type EmGlueModule = {
  setConstructCallback: (callback: (v: {delete(): void}) => void) => void;
  getExceptionMessage: (ptr: number) => string;
})" << '\n';

  // Emscripten types
  std::cout << "export type EmscriptenModule = { callMain: (...args: any[]) => void }\n";

  // add emscripten module export
  std::cout << "export type PostRunModule = GlueModule & EmGlueModule & EmscriptenModule\n";
  std::cout << "export type PreRunModule = { then(arg: (module: PostRunModule) => void): "
               "PreRunModule }\n";
  std::cout << "export default function(): PreRunModule";
  std::cout << std::endl;

  return 0;
}