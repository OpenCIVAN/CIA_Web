#include <cstdint>
#include <iostream>

#include <emscripten.h>

#include <vtkActor.h>
#include <vtkCamera.h>
#include <vtkNamedColors.h>
#include <vtkNew.h>
#include <vtkPolyData.h>
#include <vtkPolyDataMapper.h>
#include <vtkProperty.h>
#include <vtkRenderWindow.h>
#include <vtkRenderer.h>
#include <vtkXMLPolyDataReader.h>
#include <vtkPolyDataNormals.h>
#include <vtkRendererCollection.h>
#include <vtkRenderWindowInteractor.h>
#include <vtkWebAssemblyOpenGLRenderWindow.h>
#include <vtkWebAssemblyRenderWindowInteractor.h>
#include <vtkInteractorStyleTrackballCamera.h>
#include <vtkAutoInit.h>

VTK_MODULE_INIT(vtkRenderingOpenGL2);
VTK_MODULE_INIT(vtkInteractionStyle);
VTK_MODULE_INIT(vtkRenderingUI);

extern "C" {

// bytes   = pointer to VTP file bytes in WASM memory
// length  = size of that buffer
// canvasId is passed from JS (e.g. "vtk-wasm-canvas")
EMSCRIPTEN_KEEPALIVE
void ProcessVTP(const std::uint8_t* bytes, int length, const char* canvasId)
{
  std::cout << "[VTK-wasm] ProcessVTP(): length = "
            << length << ", canvasId = "
            << (canvasId ? canvasId : "(null)") << std::endl;

  // Static objects survive across calls so interaction keeps working
  static vtkNew<vtkNamedColors> colors;
  static vtkNew<vtkRenderer> renderer;
  static vtkNew<vtkRenderWindow> renderWindow;
  static vtkNew<vtkRenderWindowInteractor> interactor;
  static vtkNew<vtkActor> actor;
  static vtkNew<vtkPolyDataMapper> mapper;
  static vtkNew<vtkPolyDataNormals> normals;
  static vtkNew<vtkInteractorStyleTrackballCamera> style;  // <- now static

  // One-time initialization
    // One-time initialization
  if (renderWindow->GetRenderers()->GetNumberOfItems() == 0)
  {
    // Build a CSS selector for the canvas
    std::string selector = "#";
    selector += (canvasId && canvasId[0]) ? canvasId : "vtk-wasm-canvas";

    // Bind the render window to the canvas (factory should give us vtkWebAssemblyOpenGLRenderWindow)
    if (auto* wasmWindow =
          vtkWebAssemblyOpenGLRenderWindow::SafeDownCast(renderWindow.GetPointer()))
    {
      wasmWindow->SetCanvasSelector(selector.c_str());
      std::cout << "[VTK-wasm] Canvas selector set on window: "
                << selector << std::endl;
    }

    // Bind the interactor to the same canvas – this is what actually installs mouse callbacks
    if (auto* wasmInteractor =
          vtkWebAssemblyRenderWindowInteractor::SafeDownCast(interactor.GetPointer()))
    {
      wasmInteractor->SetCanvasSelector(selector.c_str());
      std::cout << "[VTK-wasm] Canvas selector set on interactor: "
                << selector << std::endl;
    }

    renderer->SetBackground(0.1, 0.1, 0.1);
    renderWindow->AddRenderer(renderer);

    std::cout << "[VTK-wasm] RenderWindow Class: "
              << renderWindow->GetClassName() << std::endl;

    interactor->SetRenderWindow(renderWindow);

    // Trackball interaction: rotate / pan / zoom with mouse
    style->SetDefaultRenderer(renderer);
    interactor->SetInteractorStyle(style);

    // For WASM we let the browser own the main loop
    vtkRenderWindowInteractor::InteractorManagesTheEventLoop = false;

    // Initialize and enable interactor (install event handlers on the canvas)
    interactor->Initialize();
    interactor->Enable();

    std::cout << "[VTK-wasm] Interactor initialized, styled, and enabled for mouse events"
              << std::endl;

    // Connect actor/mapper once; we'll update mapper input on each call
    renderer->AddActor(actor);
    actor->SetMapper(mapper);
    actor->GetProperty()->SetColor(colors->GetColor3d("White").GetData());
    actor->GetProperty()->SetInterpolationToPhong();
  }


  // --- 1. Read VTP from the in-memory buffer ---
  vtkNew<vtkXMLPolyDataReader> reader;
  reader->SetReadFromInputString(true);
  reader->SetInputString(
    reinterpret_cast<const char*>(bytes),
    static_cast<vtkIdType>(length));
  reader->Update();

  vtkPolyData* polyData = reader->GetOutput();
  if (!polyData || polyData->GetNumberOfPoints() == 0)
  {
    std::cerr << "[VTK-wasm] ERROR: Failed to read VTP or no points found."
              << std::endl;
    return;
  }

  std::cout << "[VTK-wasm] Loaded polydata: "
            << polyData->GetNumberOfPoints() << " points, "
            << polyData->GetNumberOfCells()  << " cells" << std::endl;

  // --- 2. Generate normals & update mapper ---
  normals->SetInputData(polyData);
  normals->ComputePointNormalsOn();
  normals->ComputeCellNormalsOff();
  normals->SplittingOff();
  normals->Update();

  mapper->SetInputData(normals->GetOutput());
  mapper->ScalarVisibilityOff();

  // --- 3. Reset camera to frame the model ---
  double bounds[6];
  normals->GetOutput()->GetBounds(bounds);

  double center[3] = {
    0.5 * (bounds[0] + bounds[1]),
    0.5 * (bounds[2] + bounds[3]),
    0.5 * (bounds[4] + bounds[5])
  };

  double maxDim = std::max({bounds[1] - bounds[0],
                            bounds[3] - bounds[2],
                            bounds[5] - bounds[4]});

  vtkCamera* cam = renderer->GetActiveCamera();
  cam->SetFocalPoint(center);
  cam->SetPosition(center[0], center[1], center[2] + 2.0 * maxDim);
  cam->SetViewUp(0.0, 1.0, 0.0);
  cam->SetClippingRange(0.1, 10.0 * maxDim);
  renderer->ResetCameraClippingRange();

  double* pos   = cam->GetPosition();
  double* focal = cam->GetFocalPoint();
  double* clip  = cam->GetClippingRange();

  std::cout << "[VTK-wasm] Camera Pos: " << pos[0]   << ", " << pos[1]   << ", " << pos[2]   << std::endl;
  std::cout << "[VTK-wasm] Camera Focal: " << focal[0] << ", " << focal[1] << ", " << focal[2] << std::endl;
  std::cout << "[VTK-wasm] Camera Clip: " << clip[0]  << ", " << clip[1]  << std::endl;

  // --- 4. Render ---
  renderWindow->Render();

  std::cout << "[VTK-wasm] ProcessVTP(): render() completed" << std::endl;
}

} // extern "C"
