'use strict';

var Material = function(name,diffuseFile,glowFile,normalFile){
    if(name in Engine.ResourceManager.materials){ return Engine.ResourceManager.materials[name]; }

    if(diffuseFile !== undefined && diffuseFile != "")
        this.diffuse = new Texture(diffuseFile,diffuseFile);
    if(glowFile !== undefined && glowFile != "")
        this.glow = new Texture(glowFile,glowFile);
    if(normalFile !== undefined && normalFile != "")
        this.normal = new Texture(normalFile,normalFile);
    
    this.color = vec3.fill(1.0,1.0,1.0);
    this.specular = vec3.fill(1.0,1.0,1.0);
    this.shininess = 50.0;
    this.shadeless = false;
    this.transparency = 1.0;
    
    Engine.ResourceManager.materials[name] = this;
}; 
Material.prototype.sendUniforms = function(program){
    if(this.diffuse !== undefined){
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.diffuse.texture);
        gl.uniform1i(gl.getUniformLocation(program, "diffuseMap"), 0);
    }
    if(this.glow !== undefined){
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.glow.texture);
        gl.uniform1i(gl.getUniformLocation(program, "glowMap"), 1);
    }
    if(this.normal !== undefined){
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.normal.texture);
        gl.uniform1i(gl.getUniformLocation(program, "normalMap"), 2);
    }  
    gl.uniform1i(gl.getUniformLocation(program, "MaterialShadeless"), (this.shadeless ? 1 : 0));
    gl.uniform4f(gl.getUniformLocation(program, "MaterialColor"), this.color[0],this.color[1],this.color[2],this.transparency);
    gl.uniform4f(gl.getUniformLocation(program, "MaterialSpecularity"), this.specular[0],this.specular[1],this.specular[2],this.shininess);
}