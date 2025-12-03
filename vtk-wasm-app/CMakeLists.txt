cmake_minimum_required(VERSION 3.20)
project(vtkWasmApp)

set(CMAKE_CXX_STANDARD 17)

find_package(VTK REQUIRED
  COMPONENTS
    CommonCore
    CommonColor
    FiltersCore
    IOXML
    RenderingCore
    RenderingOpenGL2
    InteractionStyle
    RenderingUI
)

add_executable(vtkWasmApp main.cxx)
target_link_libraries(vtkWasmApp PRIVATE ${VTK_LIBRARIES})

set_target_properties(vtkWasmApp PROPERTIES
  LINK_FLAGS
    "-s ALLOW_MEMORY_GROWTH=1 \
     -s MODULARIZE=1 \
     -s EXPORT_NAME=\"VtkWasmApp\" \
     -s EXPORTED_FUNCTIONS=\"['_ProcessVTP','_malloc','_free']\" \
     -s EXPORTED_RUNTIME_METHODS=\"['ccall','cwrap','HEAPU8','HEAP8']\""
)
