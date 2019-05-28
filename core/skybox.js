'use strict';
//files is array[6], [front,back,left,right,top,bottom]
var Skybox = function(name,files,scene){
    if(scene === undefined){
        if(name in Engine.scene.objects){ return Engine.scene.objects[name]; }
    }else{
        if(name in Engine.ResourceManager.scenes[scene].objects){ return Engine.ResourceManager.scenes[scene].objects[name]; }
    } 
    //add skybox mesh if it does not already exist.
    if(!("Skybox" in Engine.ResourceManager.meshes)){
        var meshdata =  "v 1.000000 -1.000000 -1.000000\n" + 
                        "v 1.000000 -1.000000 1.000000\n" + 
                        "v -1.000000 -1.000000 1.000000\n" + 
                        "v -1.000000 -1.000000 -1.000000\n" + 
                        "v 1.000000 1.000000 -1.000000\n" + 
                        "v 1.000000 1.000000 1.000000\n" + 
                        "v -1.000000 1.000000 1.000000\n" + 
                        "v -1.000000 1.000000 -1.000000\n" + 
                        "f 4 2 1\n" + 
                        "f 6 8 5\n" + 
                        "f 2 5 1\n" + 
                        "f 3 6 2\n" + 
                        "f 3 8 7\n" + 
                        "f 8 1 5\n" + 
                        "f 4 3 2\n" + 
                        "f 6 7 8\n" + 
                        "f 2 6 5\n" + 
                        "f 3 7 6\n" + 
                        "f 3 4 8\n" + 
                        "f 8 4 1";
        new Mesh("Skybox",meshdata,false);
    }
    //add skybox shaders if they do not already exist.
    if(!("Skybox" in Engine.ResourceManager.shaders)){
        //SKYBOX VERTEX SHADER////////////////////////////
        var skyboxVertexShaderText =
            "attribute vec3 position;\n"+
            "uniform mat4 M;\n"+
            "uniform mat4 V;\n"+
            "uniform mat4 P;\n"+
            "varying vec3 UV;\n"+
            "void main(void){\n"+
            "   UV = position;\n"+
            "   gl_Position =  (P * V * M) * vec4(position,1.0);\n"+
            "}";
        //SKYBOX FRAGMENT SHADER////////////////////////////
        var skyboxFragmentShaderText =
            "precision mediump float;\n"+
            "uniform samplerCube texture;\n"+
            "varying vec3 UV;\n"+
            "void main(void){\n"+
            "   gl_FragColor = textureCube(texture, UV);\n"+
            "}";
        new Shader("Skybox",skyboxVertexShaderText,skyboxFragmentShaderText,["position"],"vshader-skybox","fshader-skybox");
    }
    this.modelMatrix = mat4.create();
    mat4.scale(this.modelMatrix,this.modelMatrix,vec3.fill(1000,1000,1000));
    this.cubeMap = new Texture(name,files);
    
    if(scene === undefined)
        Engine.scene.objects[name] = this;
    else
        Engine.ResourceManager.scenes[scene].objects[name] = this;
};
Skybox.prototype.update = function(dt){
    var camPos = Engine.camera.position();
    this.modelMatrix[12] = camPos[0];
    this.modelMatrix[13] = camPos[1];
    this.modelMatrix[14] = camPos[2];
}
Skybox.prototype.render = function(){
    if( !("Skybox") in Engine.ResourceManager.meshes || !Engine.ResourceManager.meshes["Skybox"].loaded){ return; }
    Engine.RenderManager.skyboxQueue.push(this);
}
Skybox.prototype.draw = function(){
    var shader = Engine.ResourceManager.shaders["Skybox"].program;

    gl.useProgram(shader);
    gl.depthMask(false);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "M"),false,this.modelMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "V"),false,Engine.camera.viewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "P"),false,Engine.camera.projectionMatrix); 
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMap.texture);
    gl.uniform1i(gl.getUniformLocation(shader, "texture"), 0);
    
    Engine.ResourceManager.meshes["Skybox"].sendUniforms(gl.TRIANGLES);
    
    gl.depthMask(true);
}