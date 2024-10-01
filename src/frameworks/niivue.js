import { Framework } from '../framework.js';
import { Util } from '../util.js';
import { CanvasFallback } from './canvasFallback.js';

export class NiiVue extends Framework {
  constructor(instance) {
    super(instance);
    this.name = 'niivue';
  }

  async get_image(from_volume = true) {
    if (from_volume && this.instance.volumes.length > 0) {
      let dims = this.instance.volumes[0].dims.slice(1, 4);
      let start = [0, 0, 0];
      let end = [dims[0] - 1, dims[1] - 1, dims[2] - 1];
      let volumeData = this.instance.volumes[0].getVolumeData(start, end);
      return {
        'data': volumeData,
        'width': dims[1],
        'height': dims[2],
      };
    } else {
      // Fallback: Use canvas pixel extraction
      let ctx = this.instance.gl;
      let width = ctx.drawingBufferWidth;
      let height = ctx.drawingBufferHeight;
      let pixels = new Uint8Array(width * height * 4);
      ctx.readPixels(0, 0, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);
      return { data: pixels, width, height };
    }
  }

  /**
   * Set the image by applying new pixel data to the volume
   * @param {Uint8Array} new_pixels - The new pixel data
   * @param {boolean} is_rgba - Whether the data is in RGBA format
   * @param {boolean} no_flip - Whether to skip the flip action
   */
  async set_image(new_pixels, is_rgba = true, no_flip = false) {
    if (this.instance.volumes.length > 0) {
      let volume = this.instance.volumes[0];
      let dims = volume.dims.slice(1, 4); // Extract dimensions
      let new_data = is_rgba
        ? new_pixels
        : Util.grayscale_to_rgba(new_pixels); // Convert to RGBA if needed

      // Apply the new volume data
      volume.setVolumeData([0, 0, 0], [dims[0], dims[1], dims[2]], new_data);

      if (!no_flip) {
        // Flip if required
        this.instance.setFlipYAxis(true);
      }

      this.instance.updateGLVolume(); // Redraw the updated volume
    } else {
      console.error('No volumes loaded in Niivue');
    }
  }

  /**
   * Set the mask by overlaying the new mask data
   * @param {Uint8Array} new_mask - The mask data to apply
   */
  async set_mask(new_mask) {
    if (this.instance.volumes.length > 0) {
      // Step 1: Clone the existing volume to create an overlay
      let overlay = this.instance.cloneVolume(0);
      overlay.img.fill(0); // Initialize the overlay with zeros

      // Step 2: Get current image data
      let image = await this.get_image(true);
      let dims = this.instance.volumes[0].dims.slice(1, 4);

      // Step 3: Apply the mask using utility function
      let masked_image = Util.harden_mask(image.data, new_mask);

      // Step 4: Set the new masked data in the overlay volume
      overlay.setVolumeData([0, 0, 0], [dims[0], dims[1], dims[2]], masked_image);
      overlay.opacity = 0.5; // Set opacity for better visualization

      // Step 5: Add the overlay to Niivue and update the scene
      this.instance.addVolume(overlay);
      this.instance.updateGLVolume();
    } else {
      console.error('No volumes loaded to apply the mask');
    }
  }
}
