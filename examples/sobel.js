script = document.createElement("script");
script.type = "text/javascript";
script.src = "https://boostlet.org/dist/boostlet.min.js";
// script.src = 'http://localhost:5500/dist/boostlet.min.js';

script.onload = run;
document.head.appendChild(script);
eval(script);


async function run() {
  
  // detect visualization framework
  Boostlet.init();

  image = await Boostlet.get_image();

  kernel = [
    -1, 0, 1,
    -2, 0, 2,
    -1, 0, 1
  ];

  filtered = Boostlet.filter(image.data, image.width, image.height, kernel);

  await Boostlet.set_image( filtered );

  }
