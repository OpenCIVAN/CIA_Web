/**
 * Manifest-Driven Plugin Architecture - TypeScript Contracts
 *
 * This file defines the shared contract between client and server for the
 * plugin/handler capability system. Both the client manifests and server
 * validation use these types to ensure consistency.
 *
 * ARCHITECTURE:
 * - Manifests (TypeScript) declare handler capabilities at build time
 * - Build script validates manifests and generates registry.json
 * - Server reads registry.json for file validation and compute routing
 * - Client handlers reference their manifest for consistent behavior
 *
 * @module contracts
 */

// =============================================================================
// VERSION CONTROL
// =============================================================================

/**
 * Contract version for manifest compatibility checking.
 * Increment when making breaking changes to manifest structure.
 */
export const CONTRACT_VERSION = "1.0.0";

// =============================================================================
// FILE TYPE CAPABILITIES
// =============================================================================

/**
 * Defines what operations can be performed on a specific file type.
 * This is the core unit of the capability system.
 */
export interface FileTypeCapability {
  /** File extension without dot (e.g., 'vtp', 'stl', 'csv') */
  extension: string;

  /** MIME type for HTTP content-type headers */
  mimeType: string;

  /** Human-readable name for UI display */
  displayName: string;

  /** Lucide icon name for file type indicator */
  icon: string;

  /** Hex color for visual differentiation (e.g., '#c084fc') */
  color: string;

  /** Handler priority - higher values take precedence when multiple handlers support same type */
  priority: number;

  /**
   * Magic bytes signature for server-side validation (optional)
   * Hex string representation (e.g., '89504e47' for PNG)
   */
  magicBytes?: string;

  /**
   * Alternative magic byte signatures (e.g., for XML files with different headers)
   */
  altMagicBytes?: string[];

  /** Offset in bytes where magic bytes start (default: 0) */
  magicBytesOffset?: number;

  /** Capabilities this handler provides for this file type */
  capabilities: {
    /** Can render/visualize this format */
    canRender: boolean;

    /** Can quickly extract metadata without full parsing */
    canExtractMetadata: boolean;

    /** Can export to this format */
    canExport: boolean;

    /** Can stream large files incrementally (optional, Phase 2) */
    canStream?: boolean;
  };
}

// =============================================================================
// COMPUTE OPERATIONS (Phase 1 Stubs)
// =============================================================================

/**
 * Defines a compute operation that can run on client or server.
 * Stubbed for Phase 1 - full implementation in Phase 2.
 */
export interface ComputeOperation {
  /** Unique operation identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Operation description */
  description?: string;

  /** Input data requirements */
  inputType?: string;

  /** Output data type */
  outputType?: string;
}

// =============================================================================
// HANDLER MANIFEST
// =============================================================================

/**
 * Complete manifest for an instance type handler.
 * This is the single source of truth for handler capabilities.
 */
export interface HandlerManifest {
  /** Contract version this manifest adheres to */
  contractVersion: string;

  /** Unique handler type identifier (e.g., 'vtk', 'plotly') */
  type: string;

  /** Human-readable name for UI */
  displayName: string;

  /** Handler version for tracking changes */
  version: string;

  /** Description of what this handler does */
  description?: string;

  /** File types this handler supports */
  fileTypes: FileTypeCapability[];

  /** Runtime requirements */
  runtime: {
    /** Required browser APIs or features */
    requires: string[];

    /** Optional features that enhance capability */
    optional?: string[];
  };

  /** VR support configuration */
  vr: {
    /** Can individual instances be sent to VR */
    supportsInstanceVR: boolean;

    /** Adapts when entire app enters VR mode */
    supportsApplicationVR: boolean;

    /** VR requirements (optional, for detailed info) */
    requirements?: {
      controllers?: boolean;
      handTracking?: boolean;
      roomScale?: boolean;
      minFPS?: number;
    };
  };

  /** Collaboration feature support */
  collaboration: {
    /** Supports collaborative cursors */
    supportsCursors: boolean;

    /** Supports collaborative annotations */
    supportsAnnotations: boolean;

    /** Supports shared state synchronization */
    supportsSharedState: boolean;

    /** Supports real-time camera sync */
    supportsCameraSync?: boolean;
  };

  /** Compute capabilities (Phase 1 simplified) */
  compute: {
    /** Client-side compute capabilities */
    clientSide: {
      /** Operations that can run in browser */
      operations: string[];

      /** Maximum dataset size for client processing */
      maxDatasetSize?: string;
    };

    /** Server-side compute capabilities */
    serverSide: {
      /** Operations requiring server compute */
      operations: ComputeOperation[];

      /** Worker type for compute routing */
      workerType: string;
    };

    /** Caching configuration */
    caching: {
      /** Cache preprocessed results */
      preprocessResults: boolean;

      /** Fields used to generate cache key */
      cacheKey: string[];

      /** Time-to-live for cached results */
      ttl: string;

      /** Events that invalidate cache */
      invalidateOn: string[];
    };
  };

  /** Tool definitions (empty for Phase 1, will be expanded) */
  tools: ToolDefinition[];

  /** Entry points for loading handler code */
  entry: {
    /** Client-side handler module path */
    client: string;

    /** Server-side handler module path (optional) */
    server?: string;
  };
}

// =============================================================================
// TOOL DEFINITIONS (Phase 1 Stub)
// =============================================================================

/**
 * Tool definition for handler-provided UI tools.
 * Stubbed for Phase 1 - tools remain in handler code.
 */
export interface ToolDefinition {
  id: string;
  type: "button" | "toggle" | "menu" | "slider";
  label: string;
  icon: string;
  description?: string;
}

// =============================================================================
// MANIFEST REGISTRY
// =============================================================================

/**
 * The compiled registry of all handler manifests.
 * Generated by build script, consumed by client and server.
 */
export interface ManifestRegistry {
  /** Build timestamp */
  generatedAt: string;

  /** Contract version used for validation */
  contractVersion: string;

  /** Build environment info */
  buildInfo: {
    nodeVersion?: string;
    platform?: string;
  };

  /** All registered handler manifests, keyed by type */
  handlers: Record<string, HandlerManifest>;

  /** Quick lookup: file extension -> handler type */
  fileTypeIndex: Record<
    string,
    {
      handlerType: string;
      priority: number;
      displayName: string;
      icon: string;
      color: string;
    }
  >;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validation error with details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Result of manifest validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates a handler manifest against the contract.
 * Returns validation result with errors and warnings.
 *
 * @param manifest - The manifest to validate
 * @returns Validation result with any issues found
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Type guard
  if (!manifest || typeof manifest !== "object") {
    errors.push({
      field: "manifest",
      message: "Manifest must be a non-null object",
      value: manifest,
    });
    return { valid: false, errors, warnings };
  }

  const m = manifest as Record<string, unknown>;

  // Required fields
  if (m.contractVersion !== CONTRACT_VERSION) {
    errors.push({
      field: "contractVersion",
      message: `Contract version mismatch. Expected ${CONTRACT_VERSION}, got ${m.contractVersion}`,
      value: m.contractVersion,
    });
  }

  if (!m.type || typeof m.type !== "string") {
    errors.push({
      field: "type",
      message: "Handler type is required and must be a string",
      value: m.type,
    });
  }

  if (!m.displayName || typeof m.displayName !== "string") {
    errors.push({
      field: "displayName",
      message: "Display name is required and must be a string",
      value: m.displayName,
    });
  }

  if (!m.version || typeof m.version !== "string") {
    errors.push({
      field: "version",
      message: "Version is required and must be a string",
      value: m.version,
    });
  }

  // File types validation
  if (!Array.isArray(m.fileTypes)) {
    errors.push({
      field: "fileTypes",
      message: "fileTypes must be an array",
      value: m.fileTypes,
    });
  } else if (m.fileTypes.length === 0) {
    warnings.push({
      field: "fileTypes",
      message: "Handler declares no file types - it cannot handle any files",
    });
  } else {
    // Validate each file type
    (m.fileTypes as unknown[]).forEach((ft, index) => {
      const ftErrors = validateFileType(ft, index);
      errors.push(...ftErrors);
    });
  }

  // Runtime validation
  if (!m.runtime || typeof m.runtime !== "object") {
    errors.push({
      field: "runtime",
      message: "runtime configuration is required",
    });
  } else {
    const runtime = m.runtime as Record<string, unknown>;
    if (!Array.isArray(runtime.requires)) {
      errors.push({
        field: "runtime.requires",
        message: "runtime.requires must be an array",
      });
    }
  }

  // VR validation
  if (!m.vr || typeof m.vr !== "object") {
    errors.push({
      field: "vr",
      message: "vr configuration is required",
    });
  } else {
    const vr = m.vr as Record<string, unknown>;
    if (typeof vr.supportsInstanceVR !== "boolean") {
      errors.push({
        field: "vr.supportsInstanceVR",
        message: "vr.supportsInstanceVR must be a boolean",
      });
    }
    if (typeof vr.supportsApplicationVR !== "boolean") {
      errors.push({
        field: "vr.supportsApplicationVR",
        message: "vr.supportsApplicationVR must be a boolean",
      });
    }
  }

  // Collaboration validation
  if (!m.collaboration || typeof m.collaboration !== "object") {
    errors.push({
      field: "collaboration",
      message: "collaboration configuration is required",
    });
  } else {
    const collab = m.collaboration as Record<string, unknown>;
    const requiredBooleans = [
      "supportsCursors",
      "supportsAnnotations",
      "supportsSharedState",
    ];
    requiredBooleans.forEach((field) => {
      if (typeof collab[field] !== "boolean") {
        errors.push({
          field: `collaboration.${field}`,
          message: `collaboration.${field} must be a boolean`,
        });
      }
    });
  }

  // Compute validation
  if (!m.compute || typeof m.compute !== "object") {
    errors.push({
      field: "compute",
      message: "compute configuration is required",
    });
  }

  // Entry validation
  if (!m.entry || typeof m.entry !== "object") {
    errors.push({
      field: "entry",
      message: "entry configuration is required",
    });
  } else {
    const entry = m.entry as Record<string, unknown>;
    if (!entry.client || typeof entry.client !== "string") {
      errors.push({
        field: "entry.client",
        message: "entry.client path is required",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates a single file type capability entry
 */
function validateFileType(ft: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `fileTypes[${index}]`;

  if (!ft || typeof ft !== "object") {
    errors.push({
      field: prefix,
      message: "File type entry must be an object",
    });
    return errors;
  }

  const f = ft as Record<string, unknown>;

  // Required string fields
  const requiredStrings = [
    "extension",
    "mimeType",
    "displayName",
    "icon",
    "color",
  ];
  requiredStrings.forEach((field) => {
    if (!f[field] || typeof f[field] !== "string") {
      errors.push({
        field: `${prefix}.${field}`,
        message: `${field} is required and must be a string`,
        value: f[field],
      });
    }
  });

  // Priority must be a number
  if (typeof f.priority !== "number") {
    errors.push({
      field: `${prefix}.priority`,
      message: "priority must be a number",
      value: f.priority,
    });
  }

  // Capabilities object
  if (!f.capabilities || typeof f.capabilities !== "object") {
    errors.push({
      field: `${prefix}.capabilities`,
      message: "capabilities object is required",
    });
  } else {
    const caps = f.capabilities as Record<string, unknown>;
    const requiredCaps = ["canRender", "canExtractMetadata", "canExport"];
    requiredCaps.forEach((cap) => {
      if (typeof caps[cap] !== "boolean") {
        errors.push({
          field: `${prefix}.capabilities.${cap}`,
          message: `capabilities.${cap} must be a boolean`,
          value: caps[cap],
        });
      }
    });
  }

  return errors;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if an object is a valid HandlerManifest
 */
export function isHandlerManifest(obj: unknown): obj is HandlerManifest {
  const result = validateManifest(obj);
  return result.valid;
}

/**
 * Type guard to check if an object is a valid ManifestRegistry
 */
export function isManifestRegistry(obj: unknown): obj is ManifestRegistry {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.generatedAt === "string" &&
    typeof r.contractVersion === "string" &&
    typeof r.handlers === "object" &&
    typeof r.fileTypeIndex === "object"
  );
}
