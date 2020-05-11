
#include "wasmGlue.h"

#include <glue/class.h>
#include <glue/enum.h>
#include <greeter.h>

glue::MapValue greeterGlue() {
  using namespace greeter;

  auto lib = glue::createAnyMap();

  // clang-format off
  
  lib["Greeter"] = glue::createClass<Greeter>()
    .addConstructor<std::string>()
    .addMethod("greet", &Greeter::greet)
  ;

  lib["LanguageCode"] = glue::createEnum<LanguageCode>()
    .addValue("EN", LanguageCode::EN)
    .addValue("DE", LanguageCode::DE)
    .addValue("ES", LanguageCode::ES)
    .addValue("FR", LanguageCode::FR)
  ;

  // clang-format on

  return lib;
}
