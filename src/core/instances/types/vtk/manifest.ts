/**
 * VTK Instance Handler Manifest
 *
 * Single source of truth for VTK handler capabilities.
 * This manifest declares what file types VTK can handle, what operations
 * it supports, and its collaboration/VR capabilities.
 *
 * The build script validates this manifest and generates registry.json
 * for server consumption. The handler itself imports from here to ensure
 * consistency between declared and actual capabilities.
 *
 * @module vtk/manifest
 */

import {
  CONTRACT_VERSION,
  type HandlerManifest,
  type FileTypeCapability,
} from "../contracts/index";

// =============================================================================
// FILE TYPE CAPABILITIES
// =============================================================================

/**
 * VTK XML PolyData - Primary format for mesh data
 * High priority, full metadata extraction support
 */
const vtpCapability: FileTypeCapability = {
  extension: "vtp",
  mimeType: "application/vnd.vtk.polydata+xml",
  displayName: "VTK PolyData (XML)",
  icon: "hexagon",
  color: "#c084fc", // Purple for VTK formats
  priority: 10,
  magicBytes: "3c3f786d6c", // <?xml
  altMagicBytes: ["3c56544b46696c65"], // <VTKFile
  capabilities: {
    canRender: true,
    canExtractMetadata: true,
    canExport: false,
    canStream: false,
  },
};

/**
 * VTK XML Image Data - Volume/image data
 * High priority, full metadata extraction support
 */
const vtiCapability: FileTypeCapability = {
  extension: "vti",
  mimeType: "application/vnd.vtk.imagedata+xml",
  displayName: "VTK Image Data (XML)",
  icon: "grid3x3",
  color: "#60a5fa", // Blue for image data
  priority: 10,
  magicBytes: "3c3f786d6c", // <?xml
  altMagicBytes: ["3c56544b46696c65"], // <VTKFile
  capabilities: {
    canRender: true,
    canExtractMetadata: true,
    canExport: false,
    canStream: false,
  },
};

/**
 * VTK XML Unstructured Grid - Complex mesh data
 * High priority, full metadata extraction support
 */
const vtuCapability: FileTypeCapability = {
  extension: "vtu",
  mimeType: "application/vnd.vtk.unstructuredgrid+xml",
  displayName: "VTK Unstructured Grid (XML)",
  icon: "share2",
  color: "#34d399", // Green for unstructured
  priority: 10,
  magicBytes: "3c3f786d6c", // <?xml
  altMagicBytes: ["3c56544b46696c65"], // <VTKFile
  capabilities: {
    canRender: true,
    canExtractMetadata: true,
    canExport: false,
    canStream: false,
  },
};

/**
 * VTK Legacy Format - Older binary/ASCII format
 * Lower priority, limited metadata extraction
 */
const vtkCapability: FileTypeCapability = {
  extension: "vtk",
  mimeType: "application/vnd.vtk",
  displayName: "VTK Legacy Format",
  icon: "box",
  color: "#a78bfa", // Lighter purple for legacy
  priority: 8,
  magicBytes: "232076746b2044617461", // # vtk Data
  capabilities: {
    canRender: true,
    canExtractMetadata: false, // Legacy format is harder to parse quickly
    canExport: false,
    canStream: false,
  },
};

/**
 * STL Model - Common 3D printing format
 * Medium priority, export support
 */
const stlCapability: FileTypeCapability = {
  extension: "stl",
  mimeType: "model/stl",
  displayName: "STL Model",
  icon: "triangle",
  color: "#f472b6", // Pink for STL
  priority: 5,
  magicBytes: "736f6c6964", // solid (ASCII STL)
  capabilities: {
    canRender: true,
    canExtractMetadata: false,
    canExport: true,
    canStream: false,
  },
};

/**
 * Wavefront OBJ - Common interchange format
 * Medium priority, no metadata extraction
 */
const objCapability: FileTypeCapability = {
  extension: "obj",
  mimeType: "model/obj",
  displayName: "Wavefront OBJ",
  icon: "cube",
  color: "#fbbf24", // Amber for OBJ
  priority: 5,
  // OBJ files typically start with comments (#) or vertex data (v )
  magicBytes: "23", // # (comment)
  altMagicBytes: ["76202d"], // v - (vertex)
  capabilities: {
    canRender: true,
    canExtractMetadata: false,
    canExport: false,
    canStream: false,
  },
};

/**
 * PLY Point Cloud - Stanford polygon format
 * Medium priority, metadata extraction support
 */
const plyCapability: FileTypeCapability = {
  extension: "ply",
  mimeType: "application/x-ply",
  displayName: "PLY Point Cloud",
  icon: "scatter-chart",
  color: "#22d3ee", // Cyan for point clouds
  priority: 5,
  magicBytes: "706c79", // ply
  capabilities: {
    canRender: true,
    canExtractMetadata: true,
    canExport: false,
    canStream: false,
  },
};

// =============================================================================
// VTK HANDLER MANIFEST
// =============================================================================

/**
 * Complete VTK handler manifest
 * Exported for use by build script and handler
 */
export const vtkManifest: HandlerManifest = {
  contractVersion: CONTRACT_VERSION,
  type: "vtk",
  displayName: "VTK 3D Visualization",
  version: "1.0.0",
  description:
    "High-performance 3D visualization using VTK.js for scientific data, medical imaging, and engineering applications.",

  fileTypes: [
    vtpCapability,
    vtiCapability,
    vtuCapability,
    vtkCapability,
    stlCapability,
    objCapability,
    plyCapability,
  ],

  runtime: {
    requires: ["webgl", "webgl2"],
    optional: ["webxr", "offscreencanvas"],
  },

  vr: {
    supportsInstanceVR: true,
    supportsApplicationVR: false,
    requirements: {
      controllers: true,
      handTracking: false,
      roomScale: true,
      minFPS: 90,
    },
  },

  collaboration: {
    supportsCursors: true,
    supportsAnnotations: true,
    supportsSharedState: true,
    supportsCameraSync: true,
  },

  compute: {
    clientSide: {
      operations: [
        "pca",
        "tsne",
        "umap",
        "clipping",
        "slicing",
        "contouring",
        "point-picking",
        "measurement",
      ],
      maxDatasetSize: "100MB",
    },
    serverSide: {
      operations: [], // Empty for Phase 1
      workerType: "vtk-compute",
    },
    caching: {
      preprocessResults: true,
      cacheKey: ["datasetId", "operation", "parameters"],
      ttl: "24h",
      invalidateOn: ["dataset-update", "dataset-delete"],
    },
  },

  tools: [], // Empty for Phase 1 - tools defined in handler getTools()

  entry: {
    client: "./VTKInstanceHandler.js",
    server: undefined, // No server-side handler yet
  },
};

// =============================================================================
// EXPORTS FOR HANDLER USE
// =============================================================================

/**
 * Export individual file type capabilities for handler use
 * Handler can import these to build getSupportedFileTypes() return value
 */
export const fileTypes = {
  vtp: vtpCapability,
  vti: vtiCapability,
  vtu: vtuCapability,
  vtk: vtkCapability,
  stl: stlCapability,
  obj: objCapability,
  ply: plyCapability,
};

/**
 * Get file type capability by extension
 */
export function getFileTypeCapability(
  extension: string
): FileTypeCapability | undefined {
  return vtkManifest.fileTypes.find(
    (ft) => ft.extension.toLowerCase() === extension.toLowerCase()
  );
}

/**
 * Check if VTK handler supports a file extension
 */
export function supportsExtension(extension: string): boolean {
  return vtkManifest.fileTypes.some(
    (ft) => ft.extension.toLowerCase() === extension.toLowerCase()
  );
}

/**
 * Get all supported extensions
 */
export function getSupportedExtensions(): string[] {
  return vtkManifest.fileTypes.map((ft) => ft.extension);
}

// Default export for convenience
export default vtkManifest;
