import { Framework } from "../framework.js";

import { Util } from "../util.js";

export class Ami extends Framework {
  constructor(instance) {
    super(instance);
    this.name = "ami";
  }

  get_image() {
    let image = loader.data[0].stack[0];
    let pixels = image.frame.at(stackHelper.index).pixelData;
    let width = image.frame[0].columns;
    let height = image.frame[0].rows;

    return { data: pixels, width: width, height: height };
    // return {'data':pixels, 'width':image.width, 'height':image.height};
  }

  set_image(new_pixels) {
    let image = loader.data[0].stack[0];
    let pixels = image.frame.at(stackHelper.index).pixelData.buffer.Uint8Array;

    pixels.set(new_pixels);
    // return {'data':pixels, 'width':image.width, 'height':image.height};
  }

}