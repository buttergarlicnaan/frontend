import { useEffect, useRef, useState } from 'react'
import { fromUrl } from 'geotiff'

const VS_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = (a_position + 1.0) * 0.5;
    v_texCoord.y = 1.0 - v_texCoord.y;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const FS_SOURCE = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_raster;
  uniform sampler2D u_uncertainty;
  uniform int u_mode; // 0: True Color RGB, 1: False Color CIR, 2: Live NDVI, 3: Uncertainty

  // High-fidelity NDVI Color Ramp (Water/Rock -> Soil -> Vegetation)
  vec4 ndviRamp(float ndvi) {
    if (ndvi < 0.0) {
      return vec4(0.12, 0.22, 0.45, 1.0); // Water / Shadow
    } else if (ndvi < 0.15) {
      return vec4(0.70, 0.55, 0.38, 1.0); // Sand / Rock / Bare Ground
    } else if (ndvi < 0.35) {
      float t = (ndvi - 0.15) / 0.20;
      return mix(vec4(0.70, 0.55, 0.38, 1.0), vec4(0.90, 0.86, 0.30, 1.0), t); // Transition
    } else if (ndvi < 0.60) {
      float t = (ndvi - 0.35) / 0.25;
      return mix(vec4(0.90, 0.86, 0.30, 1.0), vec4(0.38, 0.80, 0.20, 1.0), t); // Healthy shrubs/crops
    } else {
      float t = clamp((ndvi - 0.60) / 0.35, 0.0, 1.0);
      return mix(vec4(0.38, 0.80, 0.20, 1.0), vec4(0.02, 0.58, 0.14, 1.0), t); // Dense healthy forest
    }
  }

  // Uncertainty Thermal Heatmap (Cool Teal -> Gold -> Crimson)
  vec4 uncertaintyHeatmap(float u) {
    vec3 c1 = vec3(0.10, 0.40, 0.85); // Low uncertainty (high confidence)
    vec3 c2 = vec3(0.95, 0.72, 0.18); // Medium uncertainty
    vec3 c3 = vec3(0.92, 0.18, 0.18); // High uncertainty
    if (u < 0.5) {
      return vec4(mix(c1, c2, u * 2.0), 0.75);
    } else {
      return vec4(mix(c2, c3, (u - 0.5) * 2.0), 0.85);
    }
  }

  void main() {
    vec4 pix = texture2D(u_raster, v_texCoord);
    float r = pix.r;
    float g = pix.g;
    float b = pix.b;
    float nir = pix.a; // 4th channel: Near-Infrared

    if (u_mode == 0) {
      // 1. True Color (RGB)
      gl_FragColor = vec4(r, g, b, 1.0);
    } else if (u_mode == 1) {
      // 2. False Color CIR (NIR -> Red, Red -> Green, Green -> Blue)
      gl_FragColor = vec4(nir, r, g, 1.0);
    } else if (u_mode == 2) {
      // 3. Live GPU NDVI: (NIR - Red) / (NIR + Red)
      float denom = nir + r;
      float ndvi = (denom > 0.001) ? ((nir - r) / denom) : 0.0;
      gl_FragColor = ndviRamp(ndvi);
    } else if (u_mode == 3) {
      // 4. Uncertainty Heatmap Overlay
      float unc = texture2D(u_uncertainty, v_texCoord).r;
      vec4 heat = uncertaintyHeatmap(unc);
      vec3 base = vec3(r, g, b);
      gl_FragColor = vec4(mix(base, heat.rgb, heat.a * 0.72), 1.0);
    }
  }
`

function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error: ${info}`)
  }
  return shader
}

function generateSyntheticRaster(width, height) {
  // Generates high-detail 4-channel test raster: R, G, B, NIR
  const data = new Uint8Array(width * height * 4)
  const uncData = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const nx = x / width
      const ny = y / height

      // Terrain noise simulation
      const v1 = Math.sin(nx * 12.0) * Math.cos(ny * 12.0)
      const v2 = Math.sin(nx * 28.0 + ny * 18.0) * 0.5
      const terrain = (v1 + v2 + 1.5) / 3.0

      if (terrain > 0.65) {
        // Lush agricultural vegetation (High NIR, moderate Green, low Red)
        data[idx] = Math.floor(40 + Math.random() * 30)       // Red
        data[idx + 1] = Math.floor(140 + Math.random() * 40) // Green
        data[idx + 2] = Math.floor(50 + Math.random() * 30)  // Blue
        data[idx + 3] = Math.floor(210 + Math.random() * 45) // NIR (Strong!)
        uncData[y * width + x] = Math.floor(20 + Math.random() * 35)
      } else if (terrain > 0.35) {
        // Mixed crop / grassland
        data[idx] = Math.floor(70 + Math.random() * 30)
        data[idx + 1] = Math.floor(125 + Math.random() * 30)
        data[idx + 2] = Math.floor(65 + Math.random() * 25)
        data[idx + 3] = Math.floor(175 + Math.random() * 40)
        uncData[y * width + x] = Math.floor(40 + Math.random() * 45)
      } else if (terrain > 0.18) {
        // Soil / Urban infrastructure (Similar Red and NIR)
        data[idx] = Math.floor(165 + Math.random() * 40)
        data[idx + 1] = Math.floor(155 + Math.random() * 35)
        data[idx + 2] = Math.floor(145 + Math.random() * 35)
        data[idx + 3] = Math.floor(160 + Math.random() * 40)
        uncData[y * width + x] = Math.floor(60 + Math.random() * 50)
      } else {
        // Water body / wetland (Very low NIR)
        data[idx] = Math.floor(25 + Math.random() * 20)
        data[idx + 1] = Math.floor(55 + Math.random() * 30)
        data[idx + 2] = Math.floor(110 + Math.random() * 45)
        data[idx + 3] = Math.floor(15 + Math.random() * 15) // NIR absorbed
        uncData[y * width + x] = Math.floor(15 + Math.random() * 25)
      }
    }
  }

  return { rasterData: data, uncData, width, height }
}

export default function WebGLShaderView({ hrPsUrl, uncertaintyUrl, mode = 'rgb' }) {
  const canvasRef = useRef(null)
  const glRef = useRef(null)
  const programRef = useRef(null)
  const modeLocationRef = useRef(null)
  const [loading, setLoading] = useState(false)

  // Map mode string to integer uniform
  const modeMap = { rgb: 0, cir: 1, ndvi: 2, uncertainty: 3 }
  const modeInt = modeMap[mode] ?? 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })
    if (!gl) {
      console.warn('WebGL not supported on this device')
      return
    }
    glRef.current = gl

    // Compile shaders & link program
    const vs = createShader(gl, gl.VERTEX_SHADER, VS_SOURCE)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE)
    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)
    programRef.current = program

    // Full quad buffer
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )

    const posLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    modeLocationRef.current = gl.getUniformLocation(program, 'u_mode')
    const rasterLoc = gl.getUniformLocation(program, 'u_raster')
    const uncLoc = gl.getUniformLocation(program, 'u_uncertainty')

    gl.uniform1i(rasterLoc, 0)
    gl.uniform1i(uncLoc, 1)

    // Load textures
    async function loadData() {
      setLoading(true)
      let width = 512
      let height = 512
      let rgbaBytes = null
      let uncBytes = null

      if (hrPsUrl && hrPsUrl.endsWith('.tif')) {
        try {
          const tiff = await fromUrl(hrPsUrl)
          const image = await tiff.getImage()
          width = image.getWidth()
          height = image.getHeight()
          const rasters = await image.readRasters()

          if (rasters.length >= 4) {
            rgbaBytes = new Uint8Array(width * height * 4)
            const rChan = rasters[0]
            const gChan = rasters[1]
            const bChan = rasters[2]
            const nirChan = rasters[3]

            for (let i = 0; i < width * height; i++) {
              rgbaBytes[i * 4] = Math.min(255, Math.floor(rChan[i] * 255))
              rgbaBytes[i * 4 + 1] = Math.min(255, Math.floor(gChan[i] * 255))
              rgbaBytes[i * 4 + 2] = Math.min(255, Math.floor(bChan[i] * 255))
              rgbaBytes[i * 4 + 3] = Math.min(255, Math.floor(nirChan[i] * 255))
            }
          }
        } catch (e) {
          console.warn('Could not parse GeoTIFF from URL; using high-detail multispectral fallback', e)
        }
      }

      if (!rgbaBytes) {
        const syn = generateSyntheticRaster(512, 512)
        rgbaBytes = syn.rasterData
        uncBytes = syn.uncData
        width = syn.width
        height = syn.height
      }

      if (!uncBytes) {
        uncBytes = new Uint8Array(width * height)
        for (let i = 0; i < width * height; i++) {
          uncBytes[i] = Math.floor(Math.random() * 80)
        }
      }

      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)

      // Texture 0: 4-band Raster (R, G, B, NIR)
      const rasterTex = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, rasterTex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgbaBytes)

      // Texture 1: 1-channel Uncertainty
      const uncTex = gl.createTexture()
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, uncTex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, uncBytes)

      // Initial Draw
      gl.uniform1i(modeLocationRef.current, modeInt)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      setLoading(false)
    }

    loadData()
  }, [hrPsUrl, uncertaintyUrl])

  // Instant mode switch on GPU (0ms reload)
  useEffect(() => {
    const gl = glRef.current
    if (!gl || !programRef.current || !modeLocationRef.current) return
    gl.useProgram(programRef.current)
    gl.uniform1i(modeLocationRef.current, modeInt)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }, [modeInt])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
      {loading && (
        <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(15,18,26,0.85)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', border: 'var(--glass-border)' }}>
          Uploading 4-channel raster to GPU...
        </div>
      )}
    </div>
  )
}
