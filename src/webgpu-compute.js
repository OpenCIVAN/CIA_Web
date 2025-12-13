
// WebGPU Compute Helper for Dimensionality Reduction

let device = null;
let adapter = null;

export async function initializeWebGPU() {
    if (device) return device;

    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser.");
    }

    adapter = await navigator.gpu.requestAdapter({
        powerPreference: "high-performance"
    });

    if (!adapter) {
        throw new Error("No appropriate GPU adapter found.");
    }

    device = await adapter.requestDevice();
    return device;
}

export async function computePairwiseDistances(points) {
    if (!device) await initializeWebGPU();

    const numPoints = points.length;
    const numDims = points[0].length;

    // Flatten data
    const flatData = new Float32Array(numPoints * numDims);
    for (let i = 0; i < numPoints; i++) {
        for (let j = 0; j < numDims; j++) {
            flatData[i * numDims + j] = points[i][j];
        }
    }

    // Create buffers
    const dataBuffer = device.createBuffer({
        size: flatData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });
    new Float32Array(dataBuffer.getMappedRange()).set(flatData);
    dataBuffer.unmap();

    const resultSize = numPoints * numPoints * 4; // Float32
    const resultBuffer = device.createBuffer({
        size: resultSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const readBuffer = device.createBuffer({
        size: resultSize,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });

    // Shader
    const shaderModule = device.createShaderModule({
        code: `
      struct Data {
        values: array<f32>,
      };
      
      struct Result {
        distances: array<f32>,
      };

      @group(0) @binding(0) var<storage, read> data : Data;
      @group(0) @binding(1) var<storage, read_write> result : Result;

      struct Uniforms {
        numPoints : u32,
        numDims : u32,
      };
      @group(0) @binding(2) var<uniform> uniforms : Uniforms;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
        let i = global_id.x;
        let j = global_id.y;

        if (i >= uniforms.numPoints || j >= uniforms.numPoints) {
          return;
        }

        if (i == j) {
          result.distances[i * uniforms.numPoints + j] = 0.0;
          return;
        }

        var dist_sq : f32 = 0.0;
        for (var d : u32 = 0u; d < uniforms.numDims; d = d + 1u) {
          let val_i = data.values[i * uniforms.numDims + d];
          let val_j = data.values[j * uniforms.numDims + d];
          let diff = val_i - val_j;
          dist_sq = dist_sq + diff * diff;
        }

        result.distances[i * uniforms.numPoints + j] = sqrt(dist_sq);
      }
    `
    });

    // Uniform buffer
    const uniformBuffer = device.createBuffer({
        size: 8, // 2 * u32
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });
    new Uint32Array(uniformBuffer.getMappedRange()).set([numPoints, numDims]);
    uniformBuffer.unmap();

    // Pipeline
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } }
        ]
    });

    const pipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
        compute: { module: shaderModule, entryPoint: "main" }
    });

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: dataBuffer } },
            { binding: 1, resource: { buffer: resultBuffer } },
            { binding: 2, resource: { buffer: uniformBuffer } }
        ]
    });

    // Command Encoder
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);

    const workgroupCountX = Math.ceil(numPoints / 8);
    const workgroupCountY = Math.ceil(numPoints / 8);
    passEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY);
    passEncoder.end();

    commandEncoder.copyBufferToBuffer(resultBuffer, 0, readBuffer, 0, resultSize);

    device.queue.submit([commandEncoder.finish()]);

    // Read back
    await readBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readBuffer.getMappedRange();
    const output = new Float32Array(arrayBuffer);

    // Convert to array of arrays
    const distances = [];
    for (let i = 0; i < numPoints; i++) {
        distances.push(Array.from(output.slice(i * numPoints, (i + 1) * numPoints)));
    }

    readBuffer.unmap();

    // Cleanup
    dataBuffer.destroy();
    resultBuffer.destroy();
    readBuffer.destroy();
    uniformBuffer.destroy();

    return distances;
}

export async function computeKNN(points, k) {
    // For now, we can reuse computePairwiseDistances and sort on CPU.
    // Implementing a full k-selection shader is complex and might not be needed if N < 5000.
    // If performance is an issue, we can optimize later.

    const distances = await computePairwiseDistances(points);
    const n = points.length;
    const knn = new Array(n);

    for (let i = 0; i < n; i++) {
        const neighbors = [];
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                neighbors.push({ index: j, distance: distances[i][j] });
            }
        }
        neighbors.sort((a, b) => a.distance - b.distance);
        knn[i] = neighbors.slice(0, k);
    }

    return knn;
}
