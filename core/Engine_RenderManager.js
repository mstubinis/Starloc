'use strict';
var Engine = Engine || {};
(function (scope, undefined){
    Engine.RenderManager = {};
    Engine.RenderManager.skyboxQueue = [];
    Engine.RenderManager.objectQueue = [];
    
    Engine.RenderManager.init = function(canvas){
        gl = WebGLUtils.setupWebGL(canvas,{antialias: true});
        if (!gl) { 
            return; 
        }
        gl.extensions = {};
        gl.extensions.drawBuffers = gl.getExtension('WEBGL_draw_buffers');
        gl.extensions.instancing = gl.getExtension('ANGLE_instanced_arrays');
        gl.extensions.depthTexture = gl.getExtension('WEBGL_depth_texture');

        var maxVertexShaderUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
        var maxFragmentShaderUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
        var maxShaderVaryings = gl.getParameter(gl.MAX_VARYING_VECTORS);
        
        var vertexTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
        var fragmentTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        var combinedTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        
        var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);

        var highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        var highpSupported = highp.precision != 0;
        
        var antialias = gl.getContextAttributes().antialias;
        var size = gl.getParameter(gl.SAMPLES);

        gl.enableVertexAttribArray(0);//always have this enabled.
        
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        Engine.GBuffer.init();
        return gl;
    }
    Engine.RenderManager.render = function(){
        gl.clearColor(0.0,0.0,0.0,1.0);
        gl.clearDepth(Engine.camera.far);

        //gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        var shader = Engine.ResourceManager.shaders["Default"].program;
        
        gl.useProgram(shader);
        
        gl.uniform3f(gl.getUniformLocation(shader,"SceneAmbient"),Engine.scene.ambient[0],Engine.scene.ambient[1],Engine.scene.ambient[2]);
        gl.uniform1i(gl.getUniformLocation(shader, "numLights"), Object.keys(Engine.scene.lights).length);
        
        for(key in Engine.scene.lights){
            Engine.scene.lights[key].sendUniforms(shader);
        }
        //queue up game objects for drawing
        gl.disable(gl.DEPTH_TEST); //custom for starloc
        for (var key in Engine.scene.objects) { 
            Engine.scene.objects[key].render(); 
        }
        //then actually draw them...
        for(var i = 0; i < Engine.RenderManager.skyboxQueue.length; i++){
            Engine.RenderManager.skyboxQueue[i].draw();
        }
        for(var i = 0; i < Engine.RenderManager.objectQueue.length; i++){
            Engine.RenderManager.objectQueue[i].draw();
        }
        Engine.RenderManager.skyboxQueue = [];
        Engine.RenderManager.objectQueue = [];
    }
    Engine.RenderManager.drawObject = function(obj){
        var mesh = Engine.ResourceManager.meshes[obj.mesh];
        var material = Engine.ResourceManager.materials[obj.material];
        if(mesh === undefined || !mesh.loaded){ return; }
        gl.useProgram(obj.shader);
          
        gl.uniformMatrix4fv(gl.getUniformLocation(obj.shader, "M"),false,obj.modelMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(obj.shader, "V"),false,Engine.camera.viewMatrix);

        var camPos = Engine.camera.position();
        gl.uniform4f(gl.getUniformLocation(obj.shader, "ObjectColor"),obj.color[0],obj.color[1],obj.color[2],obj.color[3]);
        gl.uniform3f(gl.getUniformLocation(obj.shader, "CameraPosition"),camPos[0],camPos[1],camPos[2]);

        var normalMatrix = mat4.create();
        mat4.invert(normalMatrix,obj.modelMatrix);
        mat4.transpose(normalMatrix,normalMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(obj.shader, "normalMatrix"),false,normalMatrix);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(obj.shader, "P"),false,Engine.camera.projectionMatrix); 
        
        if(material !== undefined){
            material.sendUniforms(obj.shader);
            if(material.shadeless == false){
                gl.uniform1i(gl.getUniformLocation(obj.shader, "MaterialShadeless"), (obj.shadeless ? 1 : 0));
            }
        }
        mesh.sendUniforms(obj.drawMode);
    }
})(this);