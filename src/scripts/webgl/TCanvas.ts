import * as THREE from 'three'
import { gl } from './core/WebGL'
import VirtualScroll from 'virtual-scroll'
import { Assets, loadAssets } from './utils/assetLoader'
import vertexShader from './shader/vs.glsl'
import fragmentShader from './shader/fs.glsl'
import { calcCoveredTextureScale } from './utils/coveredTexture'

export class TCanvas {
  private centerTarget = new THREE.Vector3()
  private edgeTarget = new THREE.Vector3()
  private frustum = new THREE.Frustum()

  private cards = new THREE.Group()
  private cardParams = {
    width: 1,
    height: 1,
    row: 4,
    col: 14,
    gap: 0.05,
  }

  private assets: Assets = {
    image1: { path: 'images/eye (1).webp' },
    image2: { path: 'images/eye (2).webp' },
    image3: { path: 'images/eye (3).webp' },
    image4: { path: 'images/eye (4).webp' },
    image5: { path: 'images/eye (5).webp' },
    image6: { path: 'images/eye (6).webp' },
    image7: { path: 'images/eye (7).webp' },
    image8: { path: 'images/eye (8).webp' },
    image9: { path: 'images/eye (9).webp' },
    image10: { path: 'images/eye (10).webp' },
    image11: { path: 'images/eye (11).webp' },
    image12: { path: 'images/eye (12).webp' },
    image13: { path: 'images/eye (13).webp' },
    image14: { path: 'images/eye (14).webp' },
    image15: { path: 'images/hands (1).webp' },
    image16: { path: 'images/hands (2).webp' },
    image17: { path: 'images/hands (3).webp' },
    image18: { path: 'images/hands (4).webp' },
    image19: { path: 'images/hands (5).webp' }, 
    image20: { path: 'images/hands (6).webp' },
    image21: { path: 'images/hands (7).webp' },
    image22: { path: 'images/hands (8).webp' },
    image23: { path: 'images/hands (9).webp' },
    image24: { path: 'images/hands (10).webp' },
    image25: { path: 'images/hands (11).webp' },
    image26: { path: 'images/hands (12).webp' },
    image27: { path: 'images/hands (13).webp' },
    image28: { path: 'images/hands (14).webp' },
    image29: { path: 'images/eyeballs (1).webp' },
    image30: { path: 'images/eyeballs (2).webp' },
    image31: { path: 'images/eyeballs (3).webp' },
    image32: { path: 'images/eyeballs (4).webp' },
    image33: { path: 'images/eyeballs (5).webp' },
    image34: { path: 'images/eyeballs (6).webp' },
    image35: { path: 'images/eyeballs (7).webp' },
    image36: { path: 'images/eyeballs (8).webp' },
    image37: { path: 'images/eyeballs (9).webp' },
    image38: { path: 'images/eyeballs (10).webp' },
    image39: { path: 'images/eyeballs (11).webp' },
    image40: { path: 'images/eyeballs (12).webp' },
    image41: { path: 'images/eyeballs (13).webp' },
    image42: { path: 'images/eyeballs (14).webp' },
    image43: { path: 'images/person (1).webp' },
    image44: { path: 'images/person (2).webp' },
    image45: { path: 'images/person (3).webp' },
    image46: { path: 'images/person (4).webp' },
    image47: { path: 'images/person (5).webp' },
    image48: { path: 'images/person (6).webp' },
    image49: { path: 'images/person (7).webp' },
    image50: { path: 'images/person (8).webp' },
    image51: { path: 'images/person (9).webp' },
    image52: { path: 'images/person (10).webp' },
    image53: { path: 'images/person (11).webp' },
    image54: { path: 'images/person (12).webp' },
    image55: { path: 'images/person (13).webp' },
    image56: { path: 'images/person (14).webp' }
  }

  constructor(private container: HTMLElement) {
    loadAssets(this.assets).then(() => {
      this.init()
      this.createObjects()
      this.addEvents()
      gl.requestAnimationFrame(this.anime)
    })
  }

  private init() {
    gl.setup(this.container)
    gl.scene.background = new THREE.Color('#000')
    gl.camera.position.z = this.cardParams.height * 2 + this.cardParams.gap * (this.cardParams.row + 1) + 2
    gl.setResizeCallback(this.resize)
    this.resize()

    // gl.scene.add(new THREE.AxesHelper())
  }

  private isMouseDowon = false
  private prevMousePosition = { x: 0, y: 0 }

  private addEvents() {
    const scroller = new VirtualScroll()
    scroller.on((event) => {
      this.cards.userData.target.position.y -= event.deltaY * 0.003
      this.cards.userData.target.position.x -= event.deltaX * 0.003
    })

    window.addEventListener('mousedown', (e) => {
      this.isMouseDowon = true
      this.prevMousePosition = { x: e.clientX, y: e.clientY }
    })

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDowon) {
        this.cards.userData.target.position.x += (e.clientX - this.prevMousePosition.x) * 0.004
        this.cards.userData.target.position.y -= (e.clientY - this.prevMousePosition.y) * 0.004
        this.prevMousePosition = { x: e.clientX, y: e.clientY }
      }
    })

    window.addEventListener('mouseup', () => {
      this.isMouseDowon = false
    })

    window.addEventListener('mouseleave', () => {
      this.isMouseDowon = false
    })
  }

  private createObjects() {
    const { width, height, row, col, gap } = this.cardParams

    const geometry = new THREE.PlaneGeometry(width, height, 50, 50)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tImage: { value: null },
        uUvScale: { value: new THREE.Vector2() },
        uSpeed: { value: new THREE.Vector2() },
        uAspect: { value: width / height },
      },
      vertexShader,
      fragmentShader,
    })

    const textures = Object.values(this.assets).map((val) => {
      const texture = val.data as THREE.Texture
      texture.wrapS = THREE.MirroredRepeatWrapping
      texture.wrapT = THREE.MirroredRepeatWrapping
      return texture
    })

    const centerX = ((width + gap) * (col - 1)) / 2
    const centerY = ((height + gap) * (row - 1)) / 2
    const halfY = (height + gap)
    let i = 0

    for (let x = 0; x < col; x++) {
      for (let y = 0; y < row; y++) {
        const mat = material.clone()
        mat.uniforms.tImage.value = textures[i++]
        calcCoveredTextureScale(mat.uniforms.tImage.value, width / height, mat.uniforms.uUvScale.value)

        const mesh = new THREE.Mesh(geometry, mat)
        mesh.position.set(width * x + gap * x - centerX, height * y + gap * y - centerY, 0)

        if (x % 2 === 0) {
          mesh.position.y += halfY
        }
        this.cards.add(mesh)
      }
    }

    this.cards.userData.target = {
      position: { x: 0, y: 0, z: 0 },
    }

    gl.scene.add(this.cards)
  }

  private resize = () => {
    let scale = THREE.MathUtils.smoothstep(gl.size.aspect, 1.969, 3)
    scale = scale * (1.5 - 1) + 1
    gl.scene.scale.set(scale, scale, scale)
  }

  private updateCardPosition() {
    gl.camera.updateMatrix()
    gl.camera.updateMatrixWorld()
    const matrix = new THREE.Matrix4().multiplyMatrices(gl.camera.projectionMatrix, gl.camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(matrix)

    const { width, height, row, col, gap } = this.cardParams
    const screenHeight = (height + gap) * (row - 1)
    const screenWidth = (width + gap) * (col - 1)

    for (let i = 0; i < this.cards.children.length; i++) {
      const card = this.cards.children[i] as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
      card.getWorldPosition(this.centerTarget)

      if (this.centerTarget.y < 0) {
        this.edgeTarget.copy(this.centerTarget).y += height / 2 + gap
        this.edgeTarget.x = 0
        if (!this.frustum.containsPoint(this.edgeTarget)) {
          card.position.y += screenHeight + height + gap
        }
      } else {
        this.edgeTarget.copy(this.centerTarget).y -= height / 2 + gap
        this.edgeTarget.x = 0
        if (!this.frustum.containsPoint(this.edgeTarget)) {
          card.position.y -= screenHeight + height + gap
        }
      }

      if (this.centerTarget.x < 0) {
        this.edgeTarget.copy(this.centerTarget).x += width / 2 + gap
        this.edgeTarget.y = 0
        if (!this.frustum.containsPoint(this.edgeTarget)) {
          card.position.x += screenWidth + width + gap
        }
      } else {
        this.edgeTarget.copy(this.centerTarget).x -= width / 2 + gap
        this.edgeTarget.y = 0
        if (!this.frustum.containsPoint(this.edgeTarget)) {
          card.position.x -= screenWidth + width + gap
        }
      }
    }
  }

  // ----------------------------------
  // animation
  private anime = () => {
    this.updateCardPosition()
    this.cards.position.x = THREE.MathUtils.lerp(this.cards.position.x, this.cards.userData.target.position.x, 0.1)
    this.cards.position.y = THREE.MathUtils.lerp(this.cards.position.y, this.cards.userData.target.position.y, 0.1)

    const speedX = this.cards.userData.target.position.x - this.cards.position.x
    const speedY = this.cards.userData.target.position.y - this.cards.position.y

    this.cards.children.forEach((child) => {
      const card = child as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
      card.material.uniforms.uSpeed.value.x = THREE.MathUtils.lerp(card.material.uniforms.uSpeed.value.x, speedX, 0.1)
      card.material.uniforms.uSpeed.value.y = THREE.MathUtils.lerp(card.material.uniforms.uSpeed.value.y, speedY, 0.1)
    })

    gl.render()
  }

  // ----------------------------------
  // dispose
  dispose() {
    gl.dispose()
  }
}
