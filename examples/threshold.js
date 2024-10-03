script = document.createElement("script");
script.type = "text/javascript";
// script.src = "https://boostlet.org/dist/boostlet.min.js";
script.src = 'http://localhost:5500/dist/boostlet.min.js';

script.onload = run;
document.head.appendChild(script);
eval(script);

async function run() {
  // Detect visualization framework
  Boostlet.init();

  image = await Boostlet.get_image();

  // Create a slider to adjust the threshold value
  createThresholdSlider();

  console.log("Set mask done");
}

// Create a slider on the top-left of the page to adjust the threshold value
function createThresholdSlider() {
  // Create a container div for the slider and label
  let container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "20px";
  container.style.left = "20px";
  container.style.width = "280px";
  container.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
  container.style.border = "1px solid #ccc";
  container.style.borderRadius = "8px";
  container.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
  container.style.zIndex = "1000";

  // Create a header for the container
  let header = document.createElement("div");
  header.style.padding = "10px";
  header.style.cursor = "move"; // Set cursor to indicate draggable area
  header.style.backgroundColor = "#4CAF50";
  header.style.borderTopLeftRadius = "8px";
  header.style.borderTopRightRadius = "8px";

  let headerText = document.createElement("span");
  headerText.style.fontFamily = "Arial, sans-serif";
  headerText.style.fontSize = "16px";
  headerText.style.fontWeight = "bold";
  headerText.style.color = "#fff";
  headerText.textContent = "Threshold Slider";

  header.appendChild(headerText);

  // Create a content div inside the container
  let content = document.createElement("div");
  content.style.padding = "15px"; // Add inner padding to content
  content.style.backgroundColor = "#fff";
  content.style.borderBottomLeftRadius = "8px";
  content.style.borderBottomRightRadius = "8px";

  // Create a label for the slider
  let label = document.createElement("label");
  label.style.fontFamily = "Arial, sans-serif";
  label.style.fontSize = "14px";
  label.style.color = "#333";
  label.textContent = "Threshold: ";

  // Create a span to display the slider value
  let valueDisplay = document.createElement("span");
  valueDisplay.textContent = "128"; // Initial value
  valueDisplay.style.fontWeight = "bold";

  // Append the value display to the label
  label.appendChild(valueDisplay);

  // Create the slider input
  let slider = document.createElement("input");
  slider.type = "range";
  slider.min = 0;
  slider.max = 255;
  slider.value = 128;
  slider.style.width = "100%";
  slider.style.marginTop = "10px";
  slider.oninput = async function () {
    let threshold = parseInt(slider.value);
    valueDisplay.textContent = threshold;
    let filtered = image.data.map((x) => (x > threshold ? 255 : 0));
    await Boostlet.set_mask(filtered);
  };

  // Assemble the elements
  content.appendChild(label);
  content.appendChild(slider);

  // Add header and content to container
  container.appendChild(header);
  container.appendChild(content);

  // Add the container to the body
  document.body.appendChild(container);

  // Make the container draggable via the header
  makeElementDraggable(container, header);
}

// Function to make an element draggable via a handle
function makeElementDraggable(elmnt, handle) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;

    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();

    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;

    pos3 = e.clientX;
    pos4 = e.clientY;

    // Set the element's new position
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
