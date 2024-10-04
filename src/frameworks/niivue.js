import { Framework } from '../framework.js';
import { Util } from '../util.js';
import { CanvasFallback } from './canvasFallback.js';

export class NiiVue extends Framework {
  constructor(instance) {
    super(instance);
    this.name = 'niivue';
    
    this.canvasFallback = new CanvasFallback();

    this.flip_on_png = true;

    this.onMouseDown = false;
    this.x1 = null;
    this.y1 = null;
    this.x2 = null;
    this.y2 = null;
  }

  normalize(img)  {
    //  TODO: ONNX not JavaScript https://onnx.ai/onnx/operators/onnx_aionnxml_Normalizer.html
    let mx = img[0]
    let mn = mx
    for (let i = 0; i < img.length; i++) {
      mx = Math.max(mx, img[i])
      mn = Math.min(mn, img[i])
    }
    let scale = 1 / (mx - mn)
    for (let i = 0; i < img.length; i++) {
      img[i] = (img[i] - mn) * scale
    }

    return img
  }

  voxeLocation() {
    const vox = this.instance.frac2vox(this.instance.scene.crosshairPos, 0)
    const dims = this.instance.volumes[0].dims

    const axcorsag = this.instance.tileIndex(...this.instance.mousePos)

    const ax = 0
    const cor = 1
    const sag = 2

    let start, end = [0, 0, 0]
    if (axcorsag === ax) {
      start = [0, 0, vox[2]]
      end = [dims[1] - 1, dims[2] - 1, vox[2]]
    } else if (axcorsag === cor) {
      start = [0, vox[1], 0]
      end = [dims[1] - 1, vox[1], dims[3] - 1]
    } else if (axcorsag === sag) {
      start = [vox[0], 0, 0]
      end = [vox[0], dims[2] - 1, dims[3] - 1]
    }

    return [start, end]
  }
  
  getSlice(volIdx, start, end) {
    const sliceData = this.instance.volumes[volIdx].getVolumeData(start, end)
    const data = sliceData[0]
    const dimsSlice = sliceData[1]
    const axcorsag = this.instance.tileIndex(...this.instance.mousePos)
    const ax = 0
    const cor = 1
    const sag = 2 
    // dims will hold H and W, but we need to determine which is which based
    // on the plane the user is drawing on.
    // if the user is drawing on the axial plane, then the first dimension is W
    // and the second dimension is H.
    // if the user is drawing on the coronal plane, then the first dimension is W
    // and the third dimension is H
    // if the user is drawing on the sagittal plane, then the second dimension is W
    // and the third dimension is H.
    // we need to determine which plane the user is drawing on, and then set the
    // dimensions accordingly.
    if (axcorsag === ax) {
      return { data, dims: [dimsSlice[0], dimsSlice[1]] }
    } else if (axcorsag === cor) {
      return { data, dims: [dimsSlice[0], dimsSlice[2]] }
    } else if (axcorsag === sag) {
      return { data, dims: [dimsSlice[2], dimsSlice[1]] }
    }
  }

  async ensureOverlayVolumeLoaded() {
    if (this.instance.volumes.length !== 1) return
    let overlayVolume = await this.instance.volumes[0].clone()
    overlayVolume.zeroImage()
    overlayVolume.hdr.scl_inter = 0
    overlayVolume.hdr.scl_slope = 1
    overlayVolume.opacity = 0.8
    this.instance.addVolume(overlayVolume)
  }


  async get_image(slice) {
      if (slice) {
  
        // get the start and end coordinates of the slice
        const [start, end] = this.voxeLocation()
        console.log("Start and end of the get image")
        console.log(start, end)
        // background image index
        const backIdx = 0
        // get the slice data from the active slice the user was drawing on
        const inputSlice = this.getSlice(backIdx, start, end)
        console.log("Input slice")
        console.log(inputSlice)
        // get W, H, D of the slice
        const [W, H] = inputSlice.dims

        // make sure slice data is a Float32Array
        let inputSlice32 = new Float32Array(inputSlice.data)

        // normalize the slice data
        inputSlice32 = this.normalize(inputSlice32)
        
        return {
          'data': inputSlice32,
          'width': W,
          'height': H,
        };
      
      }

      console.log("Using no slice")
      let dims = this.instance.volumes[0].dims.slice(1, 4);
      let volumeData = this.instance.volumes[0].getVolumeData([0, 0, 0], [dims[0], dims[1], dims[2]])[0];
      return {
          'data': volumeData,
          'width': dims[2],
          'height': dims[1],
        };
  }

  async set_image(new_pixels) {
    if (this.instance.volumes.length > 0) {
      let dims = this.instance.volumes[0].dims.slice(1, 4);

      this.instance.volumes[0].setVolumeData([0, 0, 0], [dims[0], dims[1], dims[2]], new_pixels);

      this.instance.updateGLVolume();

    } else {
      console.error('No volumes loaded in Niivue');
    }
  }

  sigmoid = (x) => {
    return 1 / (1 + Math.exp(-x))
  }
  

  async set_mask(outSliceData, sliceBool) {

      console.log(outSliceData)
        
      await this.ensureOverlayVolumeLoaded();
      
        // get reference to the overlay volume for later
        const overlay = this.instance.volumes[1]

        // get the start and end coordinates of the slice
        let [start, end] = this.voxeLocation()

        console.log("Segmentation start and end")
        console.log(start, end)

        const threshold = 0.6
        // model returns logits, so we need to apply sigmoid.
        for (let i = 0; i < outSliceData.length; i++) {
          outSliceData[i] = this.sigmoid(outSliceData[i])
          if (outSliceData[i] > threshold) {
            outSliceData[i] = 1
          } else {
            outSliceData[i] = 0
          }
        }
        
        console.log(outSliceData)


        overlay.setVolumeData(start, end, outSliceData)

      this.instance.volumes[1].setColormap('red');

      this.instance.updateGLVolume();  

  }

  drag(info) {
    const startFrac = info.voxStart
    const endFrac = info.voxEnd

    const view = info.axCorSag
    return [startFrac, endFrac, view]

  }

  select_box(callback) {
    this.instance.opts.dragMode = 1

    this.instance.onDragRelease = (info) => {
      const [startFrac, endFrac, view] = this.drag(info)
      const ax = 0
      const cor = 1
      const sag = 2

      if (view === ax) {
        // X1, Y1, X2, Y2
        callback([startFrac[0], startFrac[1]], [endFrac[0], endFrac[1]])
      } else if (view === cor) {
        callback([startFrac[0], startFrac[2]], [endFrac[0], endFrac[2]])
      } else if (view === sag) {
        callback([startFrac[2], startFrac[1]], [endFrac[2], endFrac[1]])
      }

    }

  }
}
