'use strict';

//InstanceObject - No physics interactions with ammo.js. Contains the instanced objects and the mesh / material to use
{
    var InstanceObject = function(n,mesh,material,scene){
        if(scene === undefined){ if(n in Engine.scene.objects){ return Engine.scene.objects[n]; } }
        else{ if(n in Engine.ResourceManager.scenes[scene].objects){ return Engine.ResourceManager.scenes[scene].objects[n]; } }
        
        //add instance shaders if they do not already exist.
        if(!("Instance" in Engine.ResourceManager.shaders)){
            //INSTANCE VERTEX SHADER////////////////////////////
            var vert =
                "attribute vec3 position;\n"+
                "attribute vec2 uv;\n"+
                "attribute vec3 normal;\n"+
                "attribute vec3 binormal;\n"+
                "attribute vec3 tangent;\n"+
                "attribute vec4 col0;\n"+
                "attribute vec4 col1;\n"+
                "attribute vec4 col2;\n"+
                "attribute vec4 col3;\n"+
                "uniform mat4 V;\n"+
                "uniform mat4 P;\n"+
                "void main(void){\n"+
                "   mat4 m = mat4(1.0);\n"+
                "   m[0][0] = col0.x;\n"+
                "   m[0][1] = col0.y;\n"+
                "   m[0][2] = col0.z;\n"+
                "   m[0][3] = col0.w;\n"+
                "   m[1][0] = col1.x;\n"+
                "   m[1][1] = col1.y;\n"+
                "   m[1][2] = col1.z;\n"+
                "   m[1][3] = col1.w;\n"+
                "   m[2][0] = col2.x;\n"+
                "   m[2][1] = col2.y;\n"+
                "   m[2][2] = col2.z;\n"+
                "   m[2][3] = col2.w;\n"+
                "   m[3][0] = col3.x;\n"+
                "   m[3][1] = col3.y;\n"+
                "   m[3][2] = col3.z;\n"+
                "   m[3][3] = col3.w;\n"+
                "   gl_Position = (P * V * m) * vec4(position,1.0);\n"+
                "}";
            //INSTANCE FRAGMENT SHADER////////////////////////////
            var frag =
                "precision mediump float;\n"+
                "uniform sampler2D diffuseMap;\n"+
                "uniform sampler2D glowMap;\n"+
                "uniform sampler2D normalMap;\n"+
                "void main(void){\n"+
                "   gl_FragColor = vec4(1.0,1.0,0.0,1.0);\n"+
                "}";
            new Shader("Instance",vert,frag,["position","uv","normal","binormal","tangent","col0","col1","col2","col3"],"vshader-instance","fshader-instance");
        }
        if(!("InstanceWeak" in Engine.ResourceManager.shaders)){
            //INSTANCE VERTEX SHADER////////////////////////////
            var vert =
                "attribute vec3 position;\n"+
                "attribute vec2 uv;\n"+
                "attribute vec3 normal;\n"+
                "attribute vec3 binormal;\n"+
                "attribute vec3 tangent;\n"+
                "attribute vec3 col0;\n"+
                "uniform mat4 V;\n"+
                "uniform mat4 P;\n"+
                "void main(void){\n"+
                "   mat4 m = mat4(0.0);\n"+
                "   m[0][0] = 1.0;\n"+
                "   m[1][1] = 1.0;\n"+
                "   m[2][2] = 1.0;\n"+
                "   m[3][0] = col0.x;\n"+
                "   m[3][1] = col0.y;\n"+
                "   m[3][2] = col0.z;\n"+
                "   m[3][3] = 1.0;\n"+
                "   gl_Position = (P * V * m) * vec4(position,1.0);\n"+
                "}";
            //INSTANCE FRAGMENT SHADER////////////////////////////
            var frag =
                "precision mediump float;\n"+
                "uniform sampler2D diffuseMap;\n"+
                "uniform sampler2D glowMap;\n"+
                "uniform sampler2D normalMap;\n"+
                "void main(void){\n"+
                "   gl_FragColor = vec4(1.0,1.0,0.0,1.0);\n"+
                "}";
            new Shader("InstanceWeak",vert,frag,["position","uv","normal","binormal","tangent","col0"],"vshader-instance-weak","fshader-instance-weak");
        }
        this.instances = [];
        this.col0 = gl.createBuffer();
        this.col1 = gl.createBuffer();
        this.col2 = gl.createBuffer();
        this.col3 = gl.createBuffer();

        
        this.mesh = mesh;
        this.material = material;
        
        if(scene === undefined){ this.id = Object.keys(Engine.scene.objects).length; }
        else{ this.id = Object.keys(Engine.ResourceManager.scenes[scene].objects).length; }
        
        if(scene === undefined){ Engine.GameObjectManager.addObjectToDictionary(n,this,Engine.scene,"objects"); }
        else{ Engine.GameObjectManager.addObjectToDictionary(n,this,Engine.ResourceManager.scenes[scene],"objects"); }
    }; 
    InstanceObject.prototype.addInstance = function(position){
        var _instancedIndividual = new InstanceIndividual(this);
        
        if(position !== undefined){ _instancedIndividual.setPosition(position[0],position[1],position[2]); }
        
        _instancedIndividual.update(Engine.dt);
        this.instances.push(_instancedIndividual);  
        
        var data0 = new Float32Array(this.instances.length * 4);
        var data1 = new Float32Array(this.instances.length * 4);
        var data2 = new Float32Array(this.instances.length * 4);
        var data3 = new Float32Array(this.instances.length * 4);
        for(var i = 0; i < this.instances.length; i++){
            data0[(i*4)+0] = this.instances[i].modelMatrix[0];
            data0[(i*4)+1] = this.instances[i].modelMatrix[1];
            data0[(i*4)+2] = this.instances[i].modelMatrix[2];
            data0[(i*4)+3] = this.instances[i].modelMatrix[3];
            
            data1[(i*4)+0] = this.instances[i].modelMatrix[4];
            data1[(i*4)+1] = this.instances[i].modelMatrix[5];
            data1[(i*4)+2] = this.instances[i].modelMatrix[6];
            data1[(i*4)+3] = this.instances[i].modelMatrix[7];
            
            data2[(i*4)+0] = this.instances[i].modelMatrix[8];
            data2[(i*4)+1] = this.instances[i].modelMatrix[9];
            data2[(i*4)+2] = this.instances[i].modelMatrix[10];
            data2[(i*4)+3] = this.instances[i].modelMatrix[11];
            
            data3[(i*4)+0] = this.instances[i].modelMatrix[12];
            data3[(i*4)+1] = this.instances[i].modelMatrix[13];
            data3[(i*4)+2] = this.instances[i].modelMatrix[14];
            data3[(i*4)+3] = this.instances[i].modelMatrix[15];
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.col0);
        gl.bufferData(gl.ARRAY_BUFFER, data0, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.col1);
        gl.bufferData(gl.ARRAY_BUFFER, data1, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.col2);
        gl.bufferData(gl.ARRAY_BUFFER, data2, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.col3);
        gl.bufferData(gl.ARRAY_BUFFER, data3, gl.STATIC_DRAW);
    }
    InstanceObject.prototype.destroy = function(){
        this._isToBeDestroyed = true;
    }
    InstanceObject.prototype._free = function(){
        for(var i = this.instances.length; i--;){
            this.instances[i]._free();
            delete this.instances[i];
            this.instances.splice(i,1);
        }
    }
    InstanceObject.prototype.translate = function(index,x,y,z) {
        Engine.GameObjectManager.translate(this.instances[index],x,y,z);
    };
    /*
    InstanceObject.prototype.scale = function(index,x,y,z){
        Engine.GameObjectManager.scale(this.instances[index],x,y,z);
    }
    InstanceObject.prototype.setScale = function(index,x,y,z){
        Engine.GameObjectManager.setScale(this.instances[index],x,y,z);
    }
    */
    InstanceObject.prototype.setPosition = function(index,x,y,z){
        Engine.GameObjectManager.setPosition(this.instances[index],x,y,z);
        this.instances[index].update(Engine.dt);
    }
    InstanceObject.prototype.update = function(dt){
        for(var i = 0; i < this.instances.length; i++){
            if(this.radius == 0 && (this.mesh) in Engine.ResourceManager.meshes && Engine.ResourceManager.meshes[this.mesh].loaded){
                Engine.GameObjectManager.setScale(this.instances[i],this.instances[i].scale[0],this.instances[i].scale[1],this.instances[i].scale[2]);
            }
            Engine.GameObjectManager.update(this.instances[i]);
        }
    }
    InstanceObject.prototype.render = function(){
        //if(!Engine.camera.sphereIntersectTest(this.position(),this.radius)){ return; }
        
        this.shader = Engine.ResourceManager.shaders["Instance"].program;
        this.drawMode = gl.TRIANGLES;
        Engine.RenderManager.objectQueue.push(this);
    }
    InstanceObject.prototype.draw = function(){
        var mesh = Engine.ResourceManager.meshes[this.mesh];
        var material = Engine.ResourceManager.materials[this.material];
        if(mesh === undefined || !mesh.loaded){ return; }
        gl.useProgram(this.shader);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shader, "V"),false,Engine.camera.viewMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shader, "P"),false,Engine.camera.projectionMatrix); 
        //var camPos = Engine.camera.position();
        //gl.uniform3f(gl.getUniformLocation(this.shader, "CameraPosition"),camPos[0],camPos[1],camPos[2]);
        
        // Bind the instance matrix data
        gl.enableVertexAttribArray(5);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.col0);
        gl.vertexAttribPointer(5,4,gl.FLOAT,false,16,0);
        gl.extensions.instancing.vertexAttribDivisorANGLE(5,1);
        
        gl.enableVertexAttribArray(6);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.col1);
        gl.vertexAttribPointer(6,4,gl.FLOAT,false,16,0);
        gl.extensions.instancing.vertexAttribDivisorANGLE(6,1);
        
        gl.enableVertexAttribArray(7);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.col2);
        gl.vertexAttribPointer(7,4,gl.FLOAT,false,16,0);
        gl.extensions.instancing.vertexAttribDivisorANGLE(7,1);
        
        gl.enableVertexAttribArray(8);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.col3);
        gl.vertexAttribPointer(8,4,gl.FLOAT,false,16,0);
        gl.extensions.instancing.vertexAttribDivisorANGLE(8,1);
        
        
        //if(material !== undefined){
            //material.sendUniforms(this.shader);
            //if(!material.shadeless){
                //gl.uniform1i(gl.getUniformLocation(this.shader, "MaterialShadeless"), (this.shadeless ? 1 : 0));
            //}
        //}
        mesh.sendUniformsInstance(this.drawMode,this.instances.length);
        gl.disableVertexAttribArray(5);
        gl.disableVertexAttribArray(6);
        gl.disableVertexAttribArray(7);
        gl.disableVertexAttribArray(8);
    }
    InstanceObject.prototype.rotate = function(index,x,y,z){
        Engine.GameObjectManager.rotate(this.instances[index],x,y,z);
    }
    InstanceObject.prototype.rotateX = function(index,x){ this.instances[index].rotate(x,0,0); }
    InstanceObject.prototype.rotateY = function(index,y){ this.instances[index].rotate(0,y,0); }
    InstanceObject.prototype.rotateZ = function(index,z){ this.instances[index].rotate(0,0,z); }
        
    InstanceObject.prototype.up = function(index){ return Engine.GameObjectManager.up(this.instances[index]); }
    InstanceObject.prototype.right = function(index){ return Engine.GameObjectManager.right(this.instances[index]); }
    InstanceObject.prototype.forward = function(index){ return Engine.GameObjectManager.forward(this.instances[index]); }
    InstanceObject.prototype.position = function(index){ return Engine.GameObjectManager.position(this.instances[index]); }

}

//InstanceIndividual - No physics interactions with ammo.js. Actual individual instance used in InstanceObject
{
    var InstanceIndividual = function(instanceObject){
        this.modelMatrix = mat4.create();
        this._position = vec3.fill(0,0,0);
        this.rotation = quat.fill(0,0,0,1);
        this.scale = vec3.fill(1,1,1);
        this.visible = true;
        this.shadeless = false;
        this.needsUpdate = true;
    }; 
    InstanceIndividual.prototype.destroy = function(){
        this._isToBeDestroyed = true;
    }
    InstanceIndividual.prototype._free = function(){
        delete this.modelMatrix;
        delete this._position;
        delete this.rotation;
        delete this.scale;
        delete this.visible;
        delete this.shadeless;
        delete this.needsUpdate;
    }
    InstanceIndividual.prototype.translate = function(x,y,z) {
        Engine.GameObjectManager.translate(this,x,y,z);
        this.needsUpdate = true;
    };
    /*
    InstanceIndividual.prototype.scale = function(x,y,z){
        Engine.GameObjectManager.scale(this,x,y,z);
    }
    InstanceIndividual.prototype.setScale = function(x,y,z){
        Engine.GameObjectManager.setScale(this,x,y,z);
    }
    */
    InstanceIndividual.prototype.setPosition = function(x,y,z){
        Engine.GameObjectManager.setPosition(this,x,y,z);
        this.update(Engine.dt);
        this.needsUpdate = true;
    }
    InstanceIndividual.prototype.update = function(dt){
        if(this.needsUpdate == false){ return; }
        Engine.GameObjectManager.update(this);
        this.needsUpdate = false;
    }
    InstanceIndividual.prototype.rotate = function(x,y,z){
        Engine.GameObjectManager.rotate(this,x,y,z);
        this.needsUpdate = true;
    }
    InstanceIndividual.prototype.rotateX = function(x){ this.rotate(x,0,0); }
    InstanceIndividual.prototype.rotateY = function(y){ this.rotate(0,y,0); }
    InstanceIndividual.prototype.rotateZ = function(z){ this.rotate(0,0,z); }
        
    InstanceIndividual.prototype.up = function(){ return Engine.GameObjectManager.up(this); }
    InstanceIndividual.prototype.right = function(){ return Engine.GameObjectManager.right(this); }
    InstanceIndividual.prototype.forward = function(){ return Engine.GameObjectManager.forward(this); }
    InstanceIndividual.prototype.position = function(){ return Engine.GameObjectManager.position(this); }
}