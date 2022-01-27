// A large portion of the code was built off of Mozilla's WebGL tutorial
// though it has been significantly modified to allow for user textures
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial

// TODO: allow zooming in/out on cube via scroll wheel

// Global flag to see the most recently edited canvas
let recentFace = null;

// Global canvas curves to allow for reseting
let globalCurves = {
    top: [],
    bottom: [],
    left: [],
    right: [],
    front: [],
    back: []
};

// Global data urls for all canvas
let globalFaces = {
    top: null,
    bottom: null,
    left: null,
    right: null,
    front: null,
    back: null
};

// Global line width, color, and background color variables
let lineWidth = 2;
let color = "black";
let backgroundColors = {
    top: "white",
    bottom: "white",
    left: "white",
    right: "white",
    front: "white",
    back: "white"
};

// Global flag to see if a face has an image
let globalHasImage = {
    top: false,
    bottom: false,
    left: false,
    right: false,
    front: false,
    back: false
};

// Global flag to see if globalFaces has been updated
let texturesUpdated = false;

// Global cube position and rotation
let position = [-0.0, 0.0, -5.0];
let rotation = [Math.PI/6, Math.PI/4, 0.0];

// Global flag to check if a texture should be updated with an image
let copyImage = false;

// Global flag to check if a texture should be updated with a video
let copyVideo = false;

window.addEventListener("load", main);

// Warn if not using Firefox and warning has not appeared before
window.addEventListener("load", () => {
    if(!/firefox/.test(navigator.userAgent.toLowerCase()) && !document.cookie.includes("showedWarning")) {
        alert("This website has not been tested for any browser except Firefox.");
        document.cookie = "showedWarning";
    }
});

function main() {
    // Make the face canvases paintable
    for (let can of document.getElementsByClassName("paintable")) {
        setupPainting(can);
    }

    // Listen for the update button press to update textures
    document.getElementById("update").addEventListener("click", () => {
        // Loop over each paintable canvas
        for (let can of document.getElementsByClassName("paintable")) {
            // Get the image as a data URL
            let data = can.toDataURL();

            // Save the URL in globalFaces
            globalFaces[can.id] = data;
        }

        // Set the flag to say that the images have been updated
        texturesUpdated = true;
    });

    // Listen for the reset button press to reset the selected face or all faces
    document.getElementById("reset").addEventListener("click", () => {
        // Check if a face is selected
        if (recentFace != null) {
            // Get the id and context
            let id = recentFace.id;
            let ctx = recentFace.getContext("2d");

            // Reset the curves array
            globalCurves[id] = [];

            // Reset the background color for this canvas
            backgroundColors[id] = "#FFFFFF";

            // Reset the hidden color input
            document.getElementById(`${id}Color`).value = "#FFFFFF";

            // Reset the hasImage flag
            globalHasImage[id] = false;

            // Reset this file's upload
            resetUploads(`${id}File`);

            // Redraw the canvas
            clearCanvas(ctx, backgroundColors[id]);

            // Deselect this face
            deselectAllFaces();
            recentFace = null;
        }
        // If no face is selected, reset everything
        else {
            // Loop over each paintable canvas
            for (let can of document.getElementsByClassName("paintable")) {
                // Get the id and context
                let id = can.id;
                let ctx = can.getContext("2d");

                // Reset the curves array for this canvas
                globalCurves[id] = [];

                // Reset the background color for this canvas
                backgroundColors[id] = "#FFFFFF";

                // Reset the hidden color input
                document.getElementById(`${id}Color`).value = "#FFFFFF";

                // Reset the hasImage flag for this canvas
                globalHasImage[id] = false;

                // Reset the file uploads
                resetUploads();

                // Redraw this canvas
                clearCanvas(ctx, backgroundColors[id]);

                // Artificially click the update button to update the images
                document.getElementById("update").click();
            }

            // Reset line width and color inputs
            // but only if everything else is also getting reset
            document.getElementById("widthInput").value = "5";
            document.getElementById("widthOutput").textContent = "5";
            document.getElementById("colorInput").value = "#000000";

            // Reset the position and rotation
            position = [-0.0, 0.0, -5.0];
            rotation = [Math.PI/6, Math.PI/4, 0.0];
        }

        // Reset the background color input unconditinally
        document.getElementById("backgroundInput").value = "#FFFFFF";
    });

    // Listen for clicks to show/hide the help menu
    {
        // Listen for a button press to show
        document.getElementById("help").addEventListener("click", () => {
            document.getElementById("helpScreen").removeAttribute("hidden");
        });

        // Listen for click that is not the help screen or button to hide the div
        document.addEventListener("click", (evt) => {
            if (evt.target.id != "helpScreen" && evt.target.id != "help") {
                document.getElementById("helpScreen").setAttribute("hidden", "true");
            }
        });
    }


    // Handle the brush size
    {
        // Get the size input and output
        let sizeIn = document.getElementById("widthInput");
        let sizeOut = document.getElementById("widthOutput");

        // Set lineWidth and sizeOut to the initial value of sizeIn
        lineWidth = Number.parseInt(sizeIn.value);
        sizeOut.textContent = lineWidth;

        // On sizeIn input, set size and sizeOut
        sizeIn.addEventListener("input", () => {
            let val = sizeIn.value;
            lineWidth = Number.parseInt(val);
            sizeOut.textContent = val;
        });
    }

    // Handle the brush color
    {
        // Get the color input
        let colorIn = document.getElementById("colorInput");

        // Set color to the initial value of colorIn
        color = colorIn.value;

        // On colorIn input, set color
        colorIn.addEventListener("input", () => {
            color = colorIn.value;
        });
    }

    // Handle the background color
    {
        // Get the background input
        let backgroundIn = document.getElementById("backgroundInput");

        // Set the background color to the hidden inputs
        for (let can of document.getElementsByClassName("paintable")) {
            backgroundColors[can.id] = document.getElementById(`${can.id}Color`).value;
            clearCanvas(can.getContext("2d"), backgroundColors[can.id]);
        }

        // Set the backgroundIn to be the top face color
        backgroundIn.value = backgroundColors["top"];

        // On backgroundIn input, set background color for variable, hidden input, and canvas
        backgroundIn.addEventListener("input", () => {
            // Check if a face is selected
            if (recentFace != null) {
                // Make sure the face doesn't have an image
                if (!globalHasImage[recentFace.id]) {
                    // Get the canvas id and context
                    let id = recentFace.id;
                    let ctx = recentFace.getContext("2d");

                    // Update the background color for the selected face
                    backgroundColors[id] = backgroundIn.value;

                    // Clear and redraw the selected face
                    clearCanvas(ctx, backgroundColors[id]);
                    drawCurves(globalCurves[id], ctx);

                    // Set the hidden input
                    document.getElementById(`${recentFace.id}Color`).value = backgroundIn.value;
                }
            }
            // Otherwise change all faces
            else {
                for (let can of document.getElementsByClassName("paintable")) {
                    // Make sure can doesn't have an image
                    if (!globalHasImage[can.id]) {
                        // Get the id and context of the canvas
                        let id = can.id;
                        let ctx = can.getContext("2d");

                        // Update the background color
                        backgroundColors[id] = backgroundIn.value;

                        // Clear and redraw the canvas
                        clearCanvas(ctx, backgroundColors[id]);
                        drawCurves(globalCurves[id], ctx);

                        // Set the hidden input
                        document.getElementById(`${can.id}Color`).value = backgroundIn.value;
                    }
                }
            }
        });

        // Click the update button to force the cube to be colored correctly
        document.getElementById("update").click();
    }

    // Listen for clicks on the canvas to drag the cube around
    {
        // Checks if the mouse is currently down
        let isClicked = false;

        // Get the canvas
        let can = document.getElementById("can");

        can.addEventListener("mousedown", () => {
            isClicked = true;
            
            // Hide the mouse
            can.classList.add("hideMouse");
        });

        can.addEventListener("mouseup", () => {
            isClicked = false;

            // Unhide the mouse
            can.classList.remove("hideMouse");
        });

        can.addEventListener("mousemove", (evt) => {
            // Make sure the canvas is clicked
            if (isClicked) {
                // If shift isn't pressed, rotation
                if (!evt.shiftKey) {
                    // Update rotation array
                    rotation[0] += evt.movementY / 100;
                    rotation[1] += evt.movementX / 100;

                    // Clamp y rotation using upper and lower
                    // This prevent the cube from flipping upside down and messing up x movement
                    const upper = Math.PI/2;
                    const lower = -Math.PI/2;
                    rotation[0] = Math.max(lower, Math.min(upper, rotation[0]));

                    // Update sliders
                    document.getElementById("xaxis").value = mod(rotation[0] * 180 / Math.PI, 360);
                    document.getElementById("yaxis").value = mod(rotation[1] * 180 / Math.PI, 360);
                }
                // If the shift key is pressed, pan around
                else {
                    // Update position array
                    position[0] += evt.movementX / 100;
                    position[1] -= evt.movementY / 100;

                    // Clamp x and y movement
                    const upper = 2;
                    const lower = -2;
                    position[0] = Math.max(lower, Math.min(upper, position[0]));
                    position[1] = Math.max(lower, Math.min(upper, position[1]));
                }
            }
        });

        // Listen for scroll wheel to zoom in/out
        can.addEventListener("wheel", (evt) => {
            // Increment position z variable
            position[2] += evt.wheelDeltaY * 0.001;

            // Clamp the position between upper and lower
            const upper = -2.0;
            const lower = -7.0;
            position[2] = Math.max(lower, Math.min(upper, position[2]));

            evt.preventDefault();
        });
    }

    // Various methods to deselect canvases
    {
        // Listen for escape to deselect the current face
        document.addEventListener("keydown", (evt) => {
            if (evt.key == "Escape") {
                deselectAllFaces();
                recentFace = null;
            }
        });

        // Listen for a click outside of a canvas to deselect the current face
        document.addEventListener("click", (evt) => {
            // Check if the target isn't paintable or an input
            if (!(evt.target.classList.contains("paintable") || evt.target.tagName == "INPUT")) {
                deselectAllFaces();
                recentFace = null;
            }
        });
    }

    // Reset the file uploads
    resetUploads();

    // Set the cube spinning
    cube();
}

// Make a canvas paintable
function setupPainting(can) {
    // Drawing settings
    let isDrawing = false;

    // Current curve
    let curve = null;

    // Get own id to look up curve list
    let id = can.id;

    // Get the canvas and context
    let ctx = can.getContext("2d");

    // Start drawing
    can.addEventListener("mousedown", (evt) => {
        // If this face is not selected, select it but dont' paint
        if (recentFace != can) {
            // Set this face to be the most recently edited
            selectFace(can);
        }
        // If it is selected and doesn't have an image, allow drawing
        else if (!globalHasImage[can.id]) {
            isDrawing = true;

            // Make a new curve and add location of mouse point
            curve = new Curve(color, lineWidth);
            curve.addPoint(new Point(evt.offsetX, evt.offsetY));
        }
    });

    // Stop drawing on mouse up
    can.addEventListener("mouseup", (evt) => {
        isDrawing = false;

        // Make sure curve is not null
        if (curve != null) {
            // Draw curve, add it to curves, and reset the curve
            globalCurves[id].push(curve);
            curve = null;

            clearCanvas(ctx, backgroundColors[can.id]);
            drawCurves(globalCurves[id], ctx);
        }
    });

    // Stop drawing if the mouse leaves the canvas
    can.addEventListener("mouseleave", (evt) => {
        isDrawing = false;

        // Make sure curve is not null
        if (curve != null) {
            // Draw curve, add it to curves, and reset the curve
            globalCurves[id].push(curve);
            curve = null;

            clearCanvas(ctx, backgroundColors[can.id]);
            drawCurves(globalCurves[id], ctx);
        }
    });

    // Draw on mouse move if isDrawing is true
    can.addEventListener("mousemove", (evt) => {
        if (isDrawing) {
            curve.addPoint(new Point(evt.offsetX, evt.offsetY));
            curve.drawAll(ctx);
        }
    });

    // On file upload, draw the uploaded file and rest curves
    document.getElementById(`${can.id}File`).addEventListener("input", (evt) => {
        // Draw the uploaded image
        // WHY IS THIS SO COMPLICATED
        // https://stackoverflow.com/a/10906961
        let reader = new FileReader();
        reader.addEventListener("load", (evt) => {
            let image = new Image();
            image.addEventListener("load", () => {
                ctx.drawImage(image, 0, 0, can.width, can.height);
            });
            image.src = evt.target.result;
        });
        reader.readAsDataURL(evt.target.files[0]);

        // Clear the canvas' curves
        globalCurves[can.id] = [];

        // Set the hasImage flag
        globalHasImage[can.id] = true;

        // Clear the canvas and draw the image
        clearCanvas(ctx);
    });

    // When a key is pressed, listen for ctrl+z to undo most recent line
    document.addEventListener("keydown", (evt) => {
        if (evt.ctrlKey && evt.key === "z" && recentFace == can) {
            // Clear the canvas
            clearCanvas(ctx, backgroundColors[can.id]);

            // If a line is currently being drawn, clear that curve
            if (curve != null) {
                curve = null;
                isDrawing = false;
            }
            // If no line was being drawn, pop the most recent curve
            else {
                globalCurves[id].pop();
            }

            // Draw all remaining curves
            drawCurves(globalCurves[id], ctx);
        }
    });
}

// Draw all curves
function drawCurves(curves, ctx) {
    for (let curve of curves) {
        curve.drawAll(ctx);
    }
}

// Clear a canvas
function clearCanvas(ctx, color="white") {
    // Set the fill color
    ctx.fillStyle = color;

    // Fill the canvas
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
}

// Pythonic mod (strictly positive, unlike JS)
// https://stackoverflow.com/a/4467559
function mod(n, modulus) {
    return ((n % modulus) + modulus) % modulus;
}

// Select a face canvas
function selectFace(canvas) {
    // Deselect everything
    deselectAllFaces();

    // Select the providec canvas
    canvas.classList.add("selected");

    // Set the canvas as the recent face
    recentFace = canvas;

    // Update the background color value
    document.getElementById("backgroundInput").value = backgroundColors[canvas.id];
}

// Deselect all paintable canvases
function deselectAllFaces() {
    for (let can of document.getElementsByClassName("paintable")) {
        can.classList.remove("selected");
    }
}

// Reset one or all file upload
function resetUploads(input=null) {
    // Check if an input was provided
    if (input != null) {
        input.value = null;
    }
    // Otherwise, clear everything
    else {
        for (let can of document.getElementsByClassName("paintable")) {
            document.getElementById(`${can.id}File`).value = null;
        }
    }
}

function cube() {
    // Get the canvas and context
    const canvas = document.getElementById("can");
    const ctx = canvas.getContext("webgl");

    // Make sure the ctx is working
    if (ctx === null) {
        alert("Unable to initialize WebGL. Make sure your browser is up to date.");
        return;
    }

    // Set the clear color to black
    ctx.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear the color buffer with the clear color
    ctx.clear(ctx.COLOR_BUFFER_BIT);

    // Get the shader program
    const shaderProgram = initShaderProgram(ctx, vsSource, fsSource);

    // Create an object that contains our program info
    const programInfo = {
        // Program variable name
        program: shaderProgram,
        
        // Give the name of "attribute" variable names
        attribLocations: {
            // Input variable for vertex position
            vertexPosition: ctx.getAttribLocation(shaderProgram, "aVertexPosition"),
            // Input variable for normal vector
            vertexNormal: ctx.getAttribLocation(shaderProgram, "aVertexNormal"),
            // Input variable for texture coordinates
            textureCoord: ctx.getAttribLocation(shaderProgram, "aTextureCoord")
        },

        // Give the name of "uniform" variable names
        uniformLocations: {
            projectionMatrix: ctx.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: ctx.getUniformLocation(shaderProgram, "uModelViewMatrix"),
            normalMatrix: ctx.getUniformLocation(shaderProgram, "uNormalMatrix"),
            uSampler: ctx.getUniformLocation(shaderProgram, "uSampler")
        }
    };

    // Initialize the buffers for all objects that will be drawn
    const buffers = initBuffers(ctx);

    // Default color value
    const color = [255, 255, 255, 255];

    // Init some textures
    const textures = [
        initBlankTexture(ctx, color),
        initBlankTexture(ctx, color),
        initBlankTexture(ctx, color),
        initBlankTexture(ctx, color),
        initBlankTexture(ctx, color),
        initBlankTexture(ctx, color)
    ];

    // Array of images for textures
    let images = [
        new Image(), new Image(), new Image(),
        new Image(), new Image(), new Image()
    ];

    // Render the scene
    function render(now) {
        // If the textures have been updates, start loading a new image
        if (texturesUpdated) {
            images[0] = setupImage(globalFaces["front"]);
            images[1] = setupImage(globalFaces["back"]);
            images[2] = setupImage(globalFaces["top"]);
            images[3] = setupImage(globalFaces["bottom"]);
            images[4] = setupImage(globalFaces["right"]);
            images[5] = setupImage(globalFaces["left"]);
            
            // Reset the texture flag
            texturesUpdated = false;
        }

        // If the image has finished loading, update the texture
        if (copyImage) {
            for (let i = 0; i < images.length; i++) {
                updateImageTexture(ctx, textures[i], images[i]);
            }

            // Reset the image flag
            copyImage = false;
        }


        // Draw the scene
        drawScene(ctx, programInfo, buffers, textures, rotation);

        // Request that this function be called again
        requestAnimationFrame(render);
    }

    // Request that render be called on the next animation frame
    requestAnimationFrame(render);
}

// Initialize shaders and shader program so WebGL knows they exist
function initShaderProgram(ctx, vsSource, fsSource) {
    // loadShader is user defined below
    const vertexShader = loadShader(ctx, ctx.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(ctx, ctx.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = ctx.createProgram();

    // Attach the vertex shader to the shader program
    ctx.attachShader(shaderProgram, vertexShader);

    // Attach the fragment shader to the shader program
    ctx.attachShader(shaderProgram, fragmentShader);

    // Link the program (to ctx? to the canvas? to WebGL?)
    ctx.linkProgram(shaderProgram);

    // If the shader program failed to load, make a fuss
    if (!ctx.getProgramParameter(shaderProgram, ctx.LINK_STATUS)) {
        alert("Unable to initialize the shader program: " + ctx.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

// Create a shader of the requested type, add the source, and compiles it
function loadShader(ctx, type, source) {
    // Create a blank shader
    const shader = ctx.createShader(type);

    // Send the source to the shader object
    ctx.shaderSource(shader, source);

    // Compile the shader program
    ctx.compileShader(shader);

    // Make sure the compilation was successful
    // If not, show an error and delete the shader
    if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
        alert("An error has occured compiling the shaders: " + ctx.getShaderInfoLog(shader));
        ctx.deleteShader(shader);
        return null;
    }

    return shader;
}

// Initialize vertex buffers
function initBuffers(ctx) {
    // Create a buffer for the object's vertices' positions
    const positionBuffer = ctx.createBuffer();

    // Set the positionBuffer as the context's currently used buffer
    // All buffer operations will be applied to it
    ctx.bindBuffer(ctx.ARRAY_BUFFER, positionBuffer);

    // Create an array of the coords of the cube
    // Note: the coords are continuous, so misalignment is very bad
    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    // Construct a 32-bit float array from positions and fill the current buffer with it
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(positions), ctx.STATIC_DRAW);


    // Create and bind a buffer for normal vectors
    const normalBuffer  = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, normalBuffer);

    // Vertex normals for each vertex
    // (thankfully cubes have simple normals)
    const vertexNormals = [
        // Front
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,

        // Back
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,

        // Top
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,

        // Bottom
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,

        // Right
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,

        // Left
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
    ];

    // Copy vertexNormals to normalBuffer
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertexNormals), ctx.STATIC_DRAW);


    // Create and bind a buffer for texture information
    const textureCoordBuffer = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, textureCoordBuffer);
    
    // Texture UV coordinates
    const textureCoordinates = [
        // Front
        0.0,  1.0,
        1.0,  1.0,
        1.0,  0.0,
        0.0,  0.0,
        // Back
        1.0,  1.0,
        1.0,  0.0,
        0.0,  0.0,
        0.0,  1.0,
        // Top
        0.0,  0.0,
        0.0,  1.0,
        1.0,  1.0,
        1.0,  0.0,
        // Bottom
        0.0,  1.0,
        1.0,  1.0,
        1.0,  0.0,
        0.0,  0.0,
        // Right
        1.0,  1.0,
        1.0,  0.0,
        0.0,  0.0,
        0.0,  1.0,
        // Left
        0.0,  1.0,
        1.0,  1.0,
        1.0,  0.0,
        0.0,  0.0,
    ];

    // Copy the textureCoordinates into the buffer
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(textureCoordinates), ctx.STATIC_DRAW);


    // Create and bind a buffer for the vertex index
    // The cube will be constructed from 12 triangles
    // This indexBuffer will let the triangles reuse vertices
    const indexBuffer = ctx.createBuffer();
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // The first row builds 2 triangles going like:
    // .-.
    // |/|
    // .-.
    // 0 is bottom left, then it goes counter clockwise
    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23    // left
    ];

    // Copy the index lookup into the indexBuffer
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), ctx.STATIC_DRAW);


    // Return an object with the position buffer
    return {
        position: positionBuffer,
        normal: normalBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer
    };
}

function drawScene(ctx, programInfo, buffers, textures, rotations) {
    ctx.clearColor(0.11, 0.125, 0.27, 1.0); // Set clear color to black
    ctx.clearDepth(1.0);                    // Clear everything (clearing 0.5 would clear stuff where z <= 0.5 (i think))
    ctx.enable(ctx.DEPTH_TEST);             // Doesn't render stuff if it is behind something else
    ctx.depthFunc(ctx.LEQUAL);              // Specify what condition causes something to not be rendered

    // Clear the canvas to anything draw before
    // What does the ORing do?
    ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);

    // Settings to build a perspective matrix to give the illusion of perspective
    const fieldOfView = 45 * Math.PI / 180;                             // 45 degree FOV converted to radians
    const aspect = ctx.canvas.clientWidth / ctx.canvas.clientHeight;    // Aspect ratio
    const zNear = 0.1;                                                  // Near clipping plane
    const zFar = 100.0;                                                 // Far clipping plane

    // Initialize and calculate the projection matrix
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // Initialize the model view matrix
    // Sets the drawing position to the center of the scene (identity point)
    const modelViewMatrix = mat4.create();

    // Move the drawing position to where we want the object to be
    mat4.translate(
        modelViewMatrix,    // Destination matrix
        modelViewMatrix,    // Matrix to translate
        position            // Amount to translate, global variable
    );

    // Rotate the object about the x-axis
    mat4.rotate(
        modelViewMatrix,    // Destination matrix
        modelViewMatrix,    // Matrix to rotate
        rotations[0],       // Amount to rotate by
        [1,0,0]             // Axis of rotation
    );

    // Rotate the object about the y-axis
    mat4.rotate(
        modelViewMatrix,
        modelViewMatrix,
        rotations[1],
        [0,1,0]
    );

    // Rotate the object about the z-axis
    mat4.rotate(
        modelViewMatrix,
        modelViewMatrix,
        rotations[2],
        [0,0,1]
    );

    // Set up settings to tell WebGL how to read the posiiton
    // buffer into the vertexPosition attribute
    {
        const numComponents = 3;    // Pull 3 values (xyz) at a time
        const type = ctx.FLOAT;     // The data is 32-bit floats
        const normalize = false;    // Don't normalize stuff (the points?)
        const stride = 0;           // How many bytes to skip between reading components
        const offset = 0;           // How many bytes should be skipped from the start of the buffer

        // Bind the buffer passed in
        ctx.bindBuffer(ctx.ARRAY_BUFFER, buffers.position);

        // Use the settings to tell WebGL how to read data from
        // the program's buffer into vertexPosition
        // (set up the connection from the buffer to vertexPosition)
        ctx.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        
        // Enable the attribute?
        ctx.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }


    // Calculate a normal matrix
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    // Set up settings to read normal buffer into vertexNormal attribute
    {
        const numComponents = 3;
        const type = ctx.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        ctx.bindBuffer(ctx.ARRAY_BUFFER, buffers.normal);
        ctx.vertexAttribPointer(
            programInfo.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        ctx.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
    }


    // Set up settings to tell WebGL how to read the texture
    // buffer into the colorPosition attribute
    {
        // Mostly the same as position, except only 2 values (uv) are pulled out
        const numComponents = 2;
        const type = ctx.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        // Bind the texture buffer
        ctx.bindBuffer(ctx.ARRAY_BUFFER, buffers.textureCoord);

        // Use the above settings to set up the connection between buffer and shader
        ctx.vertexAttribPointer(
            programInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );

        // Enable the attribute
        ctx.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
    }

    // Bind and set up the index lookup table
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Tell WebGL to use our program
    ctx.useProgram(programInfo.program);

    // Set the uniform projection matrix
    ctx.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
    );

    // Set the uniform model view matrix
    ctx.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
    );

    // Set the uniform normal matrix
    ctx.uniformMatrix4fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        normalMatrix
    );

    // Set up TEXTURE0-TEXTURE5
    {
        // Set texture unit 0 as active
        ctx.activeTexture(ctx.TEXTURE0);
        // Bind the 0th texture
        ctx.bindTexture(ctx.TEXTURE_2D, textures[0]);

        ctx.activeTexture(ctx.TEXTURE1);
        ctx.bindTexture(ctx.TEXTURE_2D, textures[1]);

        ctx.activeTexture(ctx.TEXTURE2);
        ctx.bindTexture(ctx.TEXTURE_2D, textures[2]);

        ctx.activeTexture(ctx.TEXTURE3);
        ctx.bindTexture(ctx.TEXTURE_2D, textures[3]);

        ctx.activeTexture(ctx.TEXTURE4);
        ctx.bindTexture(ctx.TEXTURE_2D, textures[4]);

        ctx.activeTexture(ctx.TEXTURE5);
        ctx.bindTexture(ctx.TEXTURE_2D, textures[5]);
    }


    // Draw the bound buffer
    {
        const vertexCount = 36;             // Number of vertices in the buffer
        const type = ctx.UNSIGNED_SHORT;    // The type of the data in the index table
        let offset = 0;                     // Offset to start from in the buffer

        // Draw each face individually to allow for texture changes
        for (let i = 0; i < vertexCount/6; i++) {
            // Set the active texture based on the face
            ctx.uniform1i(programInfo.uniformLocations.uSampler, i);

            ctx.drawElements(ctx.TRIANGLES, 6, type, 12*i);
        }
    }
}

// Initialize an empty texture
function initBlankTexture(ctx, color=[0, 0, 255, 255]) {
    const texture = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, texture);

    // Because it might take a second for the video to download
    // so set the texture to be a single blue pixel until its ready

    // Settings
    const level = 0;                    // Level of detail (0 is base detail, otherwise nth mipmap)
    const internalFormat = ctx.RGBA;    // Color components the texture uses
    const width = 1;                    // Width of the texture
    const height = 1;                   // Height of the texture
    const border = 0;                   // Legacy property, created borders around textures, must be 0 now
    const srcFormat = ctx.RGBA;         // Color components used by the source image
    const srcType = ctx.UNSIGNED_BYTE;  // Data type of the source

    // A single blue pixel
    const pixel = new Uint8Array(color);

    // Create a texture from the pixel
    ctx.texImage2D(
        ctx.TEXTURE_2D, level, internalFormat,
        width, height, border,
        srcFormat, srcType, pixel
    );

    // Just to be safe, disable mipmaps and set wrapping to clamp to edge
    // This way the texture will work regardless of size
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);

    return texture;
}

// UPdate a texture with an image
function updateImageTexture(ctx, texture, image) {
    // Settings
    const level = 0;
    const internalFormat = ctx.RGBA;
    const srcFormat = ctx.RGBA;
    const srcType = ctx.UNSIGNED_BYTE;

    // Bind and update the texture
    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.texImage2D(
        ctx.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image
    );
}

// Update a texture with a video's current frame
// Note: WebGL is smart enough to use the video's curernt frame
function updateVideoTexture(ctx, texture, video) {
    // Settings
    const level = 0;
    const internalFormat = ctx.RGBA;
    const srcFormat = ctx.RGBA;
    const srcType = ctx.UNSIGNED_BYTE;
    
    // Bind and update the texture
    ctx.bindTexture(ctx.TEXTURE_2D, texture);
    ctx.texImage2D(
        ctx.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, video
    );
}

// Checks if the given number is a power of 2
function isPowerOf2(value) {
    // Dang this is clever
    return (value & (value - 1)) == 0;
}

// Load an image as a texture
function initImageTexture(ctx, url) {
    // Create a blank texture so it is usuable before the image loads
    const texture = initBlankTexture(ctx);

    // Create an image element
    const img = document.createElement("img");

    // Wait for the image to load
    // When it does, update the texture
    img.addEventListener("load", () => {
        // Settings for the texture (probably redundant?)
        const level = 0;
        const internalFormat = ctx.RGBA;
        const srcFormat = ctx.RGBA;
        const srcType = ctx.UNSIGNED_BYTE;

        // Bind the texture for editing
        ctx.bindTexture(ctx.TEXTURE_2D, texture);
        ctx.texImage2D(ctx.TEXTURE_2D, level, internalFormat, srcFormat, srcType, img);
    });

    // Set the image source
    img.src = url;

    return texture;
}

// Load an image asynchronously
function setupImage(url) {
    // Make an image element
    const image = document.createElement("img");

    // Wait for the image to load
    image.addEventListener("load", () => {
        // When the image loads, set the copyImage flag
        copyImage = true;
    });

    // Set the image src
    image.src = url;

    return image;
}

// Make sure the given video url is valid/has data loaded
function setupVideo(url) {
    // Make a video element
    const video = document.createElement("video");

    // Make flags for if the video is playing or if the current time has changed
    let playing = false;
    let timeupdate = false;

    // Set the video to autoplay while muted and looped
    video.autoplay = true;
    video.muted = true;
    video.loop = true;

    // Wait for the video to play or change its time to make sure data is loaded
    video.addEventListener("playing", () => {
        playing = true;
        checkReady();
    }, true);

    video.addEventListener("timeupdate", () => {
        timeupdate = true;
        checkReady();
    }, true);

    // Set the video to the URL and play it
    video.src = url;
    video.play();

    // Local function to check if the video is ready
    // Makes sure the video is playing and the time has changed
    function checkReady() {
        if (playing && timeupdate) {
            copyVideo = true;
        }
    }

    return video;
}

// Vertex shader source code
const vsSource = `
// Naming convention is (a|u|v) for attribute/uniform/varying
// We need a vec4 for most math, even if a vec2 or vec3 would suffice

// Vertex position, normal, and texture coordinates
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

// Normal, model, and projection matrix
uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

// Pass the color to the fragment shader
// "lowp" means "lowest precision"
// "highp" mean "highest precision"
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

// Like in C, the main function is executed automatically
void main() {
    // Reverse multiplication is necessary because its matrix multiplication (I think)
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    vTextureCoord = aTextureCoord;

    // Lighting effect
    
    highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    vLighting = ambientLight + (directionalLightColor * directional);
}
`;

// Fragment shader source code
const fsSource = `
// Take in the texture coordinates and lighting vector from the vertex shader
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

// Used to sample the texture
uniform sampler2D uSampler;

void main() {
    // Get the texel color
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

    // Add lighting to the texel color
    gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
}
`;

// Stores a series of Points and draws them on a canvas
class Curve {
    constructor(color, width) {
        this.points = [];
        this.color = color;
        this.width = width;
    }

    // Add a Point to the points array
    addPoint(p) {
        this.points.push(p);
    }

    drawAll(ctx) {
        // Set correct settings in ctx
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Draw all points if there are at least 2
        if (this.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 0; i < this.points.length - 1; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
        }
        // If only 1 point exists, draw a circle instead
        else if (this.points.length == 1) {
            ctx.beginPath();
            ctx.arc(this.points[0].x, this.points[0].y, this.width/2, 0, 2*Math.PI);
            ctx.fill();
        }
    }
}

// Helper class for Curve
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}