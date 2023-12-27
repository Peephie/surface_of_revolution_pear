'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let sphere, line;
let pointex = [0.5, 0.]

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function ([vertices, normals, texture]) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
    this.DrawLine = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let cs = 2
    let projection = m4.orthographic(-cs, cs, -cs, cs, -cs, cs);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.0, 0], 1.5);
    let translateToPointZero = m4.translation(0, 0, -1);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    /* Draw the six faces of a cube, with different colors. */

    gl.uniform4fv(shProgram.iColor, [...hexToRgb(document.getElementById('color').value), 1]);
    let x = 5 * sin(Date.now() * 0.001),
        y = document.getElementById('y').value,
        z = document.getElementById('z').value
    gl.uniform3fv(shProgram.iPos, [5 * sin(Date.now() * 0.001), y, z]);
    gl.uniform3fv(shProgram.iDir, [-x, -y, -z]);
    gl.uniform1f(shProgram.iRange, document.getElementById('range').value);
    gl.uniform1f(shProgram.iFocus, document.getElementById('focus').value);
    gl.uniform2fv(shProgram.iPointex, pointex);


    surface.Draw();
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(modelViewProjection,
        m4.translation(...pearVertex(pointex[0] * a, pointex[1] * 2 * PI))
    ));
    gl.uniform1f(shProgram.iFocus, 100);
    sphere.Draw()
}

function update() {
    draw()
    window.requestAnimationFrame(update)
}

function updateWireframe() {
    surface.BufferData(CreateSurfaceData());
    draw()
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ];
}
// linearly maps value from the range (a..b) to (c..d)
function mapRange(value, a, b, c, d) {
    // first map value from (a..b) to (0..1)
    value = (value - a) / (b - a);
    // then map it from (0..1) to (c..d) and return it
    return c + value * (d - c);
}
function CreateSurfaceData() {
    let vertexList = [],
        normalList = [],
        textureList = [];
    const zAmount = 20,
        bAmount = 20;

    for (let i = 0; i < bAmount; i++) {
        for (let j = 0; j < zAmount; j++) {
            let z = mapRange(j, 0, zAmount - 1, 0, a);
            let b = mapRange(i, 0, bAmount - 1, 0, 2 * PI);
            let zE = mapRange(1, 0, zAmount - 1, 0, a);
            let bE = mapRange(1, 0, bAmount - 1, 0, 2 * PI);
            let vertex = pearVertex(z, b)
            let vertexx = pearVertex(z + zE, b)
            let vertexxx = pearVertex(z, b + bE)
            let vertexxxx = pearVertex(z + zE, b + bE)
            let normal = computeFacetAverage(z, b, zE, bE);
            let normall = computeFacetAverage(z + zE, b, zE, bE);
            let normalll = computeFacetAverage(z, b + bE, zE, bE);
            let normallll = computeFacetAverage(z + zE, b + bE, zE, bE);
            let texture = [mapRange(j, 0, zAmount, 0, 1), mapRange(i, 0, bAmount, 0, 1)]
            let texturee = [mapRange(j + 1, 0, zAmount, 0, 1), mapRange(i, 0, bAmount, 0, 1)]
            let textureee = [mapRange(j, 0, zAmount, 0, 1), mapRange(i + 1, 0, bAmount, 0, 1)]
            let textureeee = [mapRange(j + 1, 0, zAmount, 0, 1), mapRange(i + 1, 0, bAmount, 0, 1)]
            vertexList.push(
                ...vertex,
                ...vertexx,
                ...vertexxx,
                ...vertexxx,
                ...vertexx,
                ...vertexxxx,
            );
            normalList.push(
                ...normal,
                ...normall,
                ...normalll,
                ...normalll,
                ...normall,
                ...normallll,
            );
            textureList.push(
                ...texture,
                ...texturee,
                ...textureee,
                ...textureee,
                ...texturee,
                ...textureeee,
            );
        }
    }

    return [vertexList, normalList, textureList];
}
function computeFacetAverage(z, b, zE, bE) {
    let v0 = pearVertex(z, b);
    let v1 = pearVertex(z + zE, b);
    let v2 = pearVertex(z, b + bE);
    let v3 = pearVertex(z - zE, b + bE);
    let v4 = pearVertex(z - zE, b);
    let v5 = pearVertex(z - zE, b - bE);
    let v6 = pearVertex(z, b - bE);
    let v01 = m4.subtractVectors(v1, v0)
    let v02 = m4.subtractVectors(v2, v0)
    let v03 = m4.subtractVectors(v3, v0)
    let v04 = m4.subtractVectors(v4, v0)
    let v05 = m4.subtractVectors(v5, v0)
    let v06 = m4.subtractVectors(v6, v0)
    let n1 = m4.normalize(m4.cross(v01, v02))
    let n2 = m4.normalize(m4.cross(v02, v03))
    let n3 = m4.normalize(m4.cross(v03, v04))
    let n4 = m4.normalize(m4.cross(v04, v05))
    let n5 = m4.normalize(m4.cross(v05, v06))
    let n6 = m4.normalize(m4.cross(v06, v01))
    let n = [(n1[0] + n2[0] + n3[0] + n4[0] + n5[0] + n6[0]) / 6.0,
    (n1[1] + n2[1] + n3[1] + n4[1] + n5[1] + n6[1]) / 6.0,
    (n1[2] + n2[2] + n3[2] + n4[2] + n5[2] + n6[2]) / 6.0]
    n = m4.normalize(n);
    return n;
}
const { sin, cos, sqrt, PI } = Math
function pearVertex(z, b) {
    let x = r(z) * sin(b),
        y = r(z) * cos(b),
        newZ = z
    return [x, y, newZ]
}
const a = 2, c = 2
function r(z) {
    return z * sqrt(z * (a - z)) / c
}
function CreateSphereData() {
    let vertexList = [];
    let normalList = [];
    let textureList = [];

    let u = 0,
        t = 0;
    while (u < Math.PI * 2) {
        while (t < Math.PI) {
            let v = getSphereVertex(u, t);
            let w = getSphereVertex(u + 0.1, t);
            let wv = getSphereVertex(u, t + 0.1);
            let ww = getSphereVertex(u + 0.1, t + 0.1);
            vertexList.push(v.x, v.y, v.z);
            vertexList.push(w.x, w.y, w.z);
            vertexList.push(wv.x, wv.y, wv.z);
            vertexList.push(wv.x, wv.y, wv.z);
            vertexList.push(w.x, w.y, w.z);
            vertexList.push(ww.x, ww.y, ww.z);
            t += 0.1;
        }
        t = 0;
        u += 0.1;
    }
    return [vertexList, vertexList, vertexList]
}
const radius = 0.1;
function getSphereVertex(long, lat) {
    return {
        x: radius * Math.cos(long) * Math.sin(lat),
        y: radius * Math.sin(long) * Math.sin(lat),
        z: radius * Math.cos(lat)
    }
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iPos = gl.getUniformLocation(prog, "pos");
    shProgram.iDir = gl.getUniformLocation(prog, "dir");
    shProgram.iRange = gl.getUniformLocation(prog, "range");
    shProgram.iFocus = gl.getUniformLocation(prog, "focus");
    shProgram.iPointex = gl.getUniformLocation(prog, "pointex");

    surface = new Model('Surface');
    sphere = new Model('Surface');
    line = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    sphere.BufferData(CreateSphereData())
    line.BufferData([[0, 0, 0, 1, 1, 1]])

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);
    LoadTexture()
    update();
}
function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://raw.githubusercontent.com/Peephie/surface_of_revolution_pear/CGW/ice-texture.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}

window.onkeydown = (e) => {
    if (e.keyCode == 87) {
        pointex[0] = Math.min(pointex[0] + 0.02, 1);
    }
    else if (e.keyCode == 65) {
        pointex[1] = Math.max(pointex[1] - 0.02, 0);
    }
    else if (e.keyCode == 83) {
        pointex[0] = Math.max(pointex[0] - 0.02, 0);
    }
    else if (e.keyCode == 68) {
        pointex[1] = Math.min(pointex[1] + 0.02, 1);
    }
}