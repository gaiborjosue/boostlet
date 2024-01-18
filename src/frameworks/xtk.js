import { Framework } from "../framework.js";

import { Util } from "../util.js";

export class Xtk extends Framework {
  constructor(instance) {
    super(instance);
    this.name = "xtk";
  }

  get_image(from_canvas) {
    let canvas = this.instance.ca;
    let ctx = canvas.getContext("2d");

    let image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let rgba_image = Util.rgba_to_grayscale(image.data);

    if(from_canvas) {
      return { data: image.data, width: image.width, height: image.height };
    }
    else {
      return { data: rgba_image, width: image.width, height: image.height };
    // return {'data':pixels, 'width':image.width, 'height':image.height};
    }
  }

  set_image(new_pixels) {
    let originalcanvas = this.instance.ca;

    let newcanvas = window.document.createElement("canvas");
    newcanvas.width = originalcanvas.width;
    newcanvas.height = originalcanvas.height;

    let ctx = newcanvas.getContext("2d");

    let newPixelsRgba = Util.grayscale_to_rgba(new_pixels);

    let newPixelsClamped = new Uint8ClampedArray(newPixelsRgba);

    let newImageData = new ImageData(
      newPixelsClamped,
      newcanvas.width,
      newcanvas.height
    );

    // Draw the new image data onto the canvas
    ctx.putImageData(newImageData, 0, 0);

    newcanvas.onclick = function () {
      // on click, we will restore the nv canvas
      newcanvas.parentNode.replaceChild(originalcanvas, newcanvas);
    };

    // replace nv canvas with new one
    originalcanvas.parentNode.replaceChild(newcanvas, originalcanvas);
  }

  set_mask(new_mask) {

    let image = this.get_image(true);


    let originalcanvas = this.instance.ca;
    let ctxOriginal = originalcanvas.getContext('2d');
    let imageDataOriginal = ctxOriginal.getImageData(0, 0, originalcanvas.width, originalcanvas.height);
    let pixelsOriginal = imageDataOriginal.data;

    let newcanvas = window.document.createElement('canvas');
    newcanvas.width = originalcanvas.width;
    newcanvas.height = originalcanvas.height;
    
    let ctx = newcanvas.getContext('2d');

    let imageclamped = new Uint8ClampedArray(image.data);

    let imagedata = new ImageData(imageclamped, newcanvas.width, newcanvas.height);

    ctx.putImageData(imagedata, 0, 0);

    image = ctx.getImageData(0, 0, newcanvas.width, newcanvas.height);

    let masked_image = Util.harden_mask(image.data, new_mask);

    let masked_image_as_imagedata = new ImageData(masked_image, newcanvas.width, newcanvas.height);

    ctx.putImageData(masked_image_as_imagedata, 0, 0); // rgba data, no flip

    originalcanvas.parentNode.replaceChild(newcanvas, originalcanvas);
  }

  select_box(callback) {
    let canvas = this.instance.ca;

    BoxCraft.createDraggableBBox(canvas, function (topleft, bottomright) {
      console.log("Inside Draggable BBox", topleft, bottomright);
      callback(topleft, bottomright);
    });
  }
}
