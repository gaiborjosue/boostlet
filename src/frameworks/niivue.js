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

  async get_image() {
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

  async ensureOverlayVolumeLoaded() {
    if (this.instance.volumes.length !== 1) return
    let overlayVolume = await this.instance.volumes[0].clone()
    overlayVolume.zeroImage()
    overlayVolume.hdr.scl_inter = 0
    overlayVolume.hdr.scl_slope = 1
    this.instance.addVolume(overlayVolume)
  }

  async set_mask(new_mask) {
      await this.ensureOverlayVolumeLoaded();

      let dims = this.instance.volumes[0].dims.slice(1, 4);
      
      this.instance.volumes[1].setVolumeData([0, 0, 0], [dims[0], dims[1], dims[2]], new_mask);
      this.instance.volumes[1].setColormap('red');

      this.instance.updateGLVolume();  
  }

  select_box(callback) {
    return this.canvasFallback.select_box(callback);
  }
}
