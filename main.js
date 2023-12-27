'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let sphere, line;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
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
    let cs = 5
    let projection = m4.orthographic(-cs, cs, -cs, cs, -cs, cs);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.0, 0], 5);
    let translateToPointZero = m4.translation(0, 0, -1);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    /* Draw the six faces of a cube, with different colors. */

    gl.uniform4fv(shProgram.iColor, [...hexToRgb(document.getElementById('color').value), 1]);
    let x = 5*sin(Date.now()*0.001),
        y = document.getElementById('y').value,
        z = document.getElementById('z').value
    gl.uniform3fv(shProgram.iPos, [5*sin(Date.now()*0.001), y, z]);
    gl.uniform3fv(shProgram.iDir, [-x, -y, -z]);
    gl.uniform1f(shProgram.iRange, document.getElementById('range').value);
    gl.uniform1f(shProgram.iFocus, document.getElementById('focus').value);

    surface.Draw();
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(modelViewProjection,
        m4.translation(x,y,z)
    ));
    gl.uniform1f(shProgram.iFocus, 100);
    sphere.Draw()
    line.BufferData([[0, 0, 0, -x, -y, -z]])
    line.DrawLine();
}

function updateWireframe() {
    surface.BufferData(CreateSurfaceData());
    draw()
}

// linearly maps value from the range (a..b) to (c..d)
function mapRange(value, a, b, c, d) {
    // first map value from (a..b) to (0..1)
    value = (value - a) / (b - a);
    // then map it from (0..1) to (c..d) and return it
    return c + value * (d - c);
}
function CreateSurfaceData() {
    let vertexList = [];
    const zAmount = document.getElementById('amt').value, bAmount = document.getElementById('amt').value;

    for (let i = 0; i < bAmount; i++) {
        for (let j = 0; j < zAmount; j++) {
            let z = mapRange(j, 0, zAmount - 1, 0, a);
            let b = mapRange(i, 0, bAmount - 1, 0, 2 * PI);
            let vertex = pearVertex(z, b)
            vertexList.push(...vertex);
        }
    }

    return vertexList;
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

    let u = 0,
        t = 0;
    while (u < Math.PI * 2) {
        while (t < Math.PI) {
            let v = getSphereVertex(u, t);
            let w = getSphereVertex(u + 0.1, t);
            let wv = getSphereVertex(u, t + 0.1);
            let ww = getSphereVertex(u + 0.1, t + 0.1);
            vertexList.push(v.x, v.y, v.z);
            normalList.push(v.x, v.y, v.z);
            vertexList.push(w.x, w.y, w.z);
            normalList.push(w.x, w.y, w.z);
            vertexList.push(wv.x, wv.y, wv.z);
            normalList.push(wv.x, wv.y, wv.z);
            vertexList.push(wv.x, wv.y, wv.z);
            normalList.push(wv.x, wv.y, wv.z);
            vertexList.push(w.x, w.y, w.z);
            normalList.push(w.x, w.y, w.z);
            vertexList.push(ww.x, ww.y, ww.z);
            normalList.push(ww.x, ww.y, ww.z);
            t += 0.1;
        }
        t = 0;
        u += 0.1;
    }
    return [vertexList, normalList]
}
const radius = 0.2;
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
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");

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

    draw();
}
