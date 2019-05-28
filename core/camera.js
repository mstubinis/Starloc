'use strict';
var Camera = function(n,width,height,scene){
    if(scene === undefined){
        if(n in Engine.scene.cameras){ return undefined; }
    }else{
        if(n in Engine.ResourceManager.scenes[scene].cameras){ return undefined; }
    }
    
    this.modelMatrix = mat4.create();
    this._position = vec3.fill(0,0,0);
    this.rotation = quat.fill(0,0,0,1);
    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    
    //6 vec4's describing the viewing frustrum
    this.planes = [vec4.create(), vec4.create(), vec4.create(), vec4.create(), vec4.create(), vec4.create()];
    
    this.angle = 45.0;
    this.ratio = Engine.canvas.width/Engine.canvas.height;
    this.near = 0.005;
    this.far = 20000.0;
    
    if(scene === undefined){
        this.id = Object.keys(Engine.scene.cameras).length;
    }else{
        this.id = Object.keys(Engine.ResourceManager.scenes[scene].cameras).length;
    }
    
    this.viewWasOverriden = false;
    
    this.resize(Engine.canvas.width,Engine.canvas.height);
    this.update(Engine.dt);
    
    if(scene === undefined){
        Engine.GameObjectManager.addObjectToDictionary(n,this,Engine.scene,"cameras");
    }else{
        Engine.GameObjectManager.addObjectToDictionary(n,this,Engine.ResourceManager.scenes[scene],"cameras");
    }
    
    if(!Engine.hasOwnProperty('camera')){ Engine.camera = this; }
};
Camera.prototype.constructFrustrum = function(){
    var vp = mat4.create(); 
    mat4.mul(vp,this.projectionMatrix,this.viewMatrix);
    var rowX = mat4.row(vp,0);
    var rowY = mat4.row(vp,1);
    var rowZ = mat4.row(vp,2);
    var rowW = mat4.row(vp,3);
    
    var px = vec4.create(); vec4.add(px, rowW,rowX);
    var mx = vec4.create(); vec4.sub(mx, rowW,rowX);
    var py = vec4.create(); vec4.add(py, rowW,rowY);
    var my = vec4.create(); vec4.sub(my, rowW,rowY);
    var pz = vec4.create(); vec4.add(pz, rowW,rowZ);
    var mz = vec4.create(); vec4.sub(mz, rowW,rowZ);

    vec4.normalize(px,px);
    vec4.normalize(mx,mx);
    vec4.normalize(py,py);
    vec4.normalize(my,my);
    vec4.normalize(pz,pz);
    vec4.normalize(mz,mz);
    
    this.planes[0] = px;
    this.planes[1] = mx;
    this.planes[2] = py;
    this.planes[3] = my;
    this.planes[4] = pz;
    this.planes[5] = mz;

    for(var i = 0; i < 6; i++){
        var normal = vec3.fill(this.planes[i][0], this.planes[i][1], this.planes[i][2]);
        var len = vec3.length(normal);
        this.planes[i][0] = (-this.planes[i][0]) / len;
        this.planes[i][1] = (-this.planes[i][1]) / len;
        this.planes[i][2] = (-this.planes[i][2]) / len;
        this.planes[i][3] = (-this.planes[i][3]) / len;
    }
}
Camera.prototype.sphereIntersectTest = function(pos,radius){
    if(radius <= 0){ return false; }
    for (var i = 0; i < 6; i++){
        var dist = ((this.planes[i][0] * pos[0]) + (this.planes[i][1] * pos[1]) + (this.planes[i][2] * pos[2])) + (this.planes[i][3] - radius);
        if (dist > 0){ return false; }
    }
    return true;
}
Camera.prototype.resize = function(width,height){
    this.ratio = width/height;
    mat4.perspective(this.projectionMatrix,(this.angle * 0.0174533),width/height,this.near,this.far);
}
Camera.prototype.perspective = function(angle,ratio,near,far){
    this.angle = angle;  this.ratio = -ratio;  this.near = near;  this.far = far;
    mat4.perspective(this.projectionMatrix,(angle * 0.0174533),ratio,near,far);
}
Camera.prototype.ortho = function(left,right,bottom,top,near,far){
    mat4.ortho(this.projectionMatrix,left,right,bottom,top,near,far);
}
Camera.prototype.__lookAt = function(eyeX,eyeY,eyeZ,centerX,centerY,centerZ,upX,upY,upZ){
    if(centerX == undefined && centerY == undefined && centerZ == undefined && upX == undefined && upY == undefined && upZ == undefined){
        this._position = eyeX;
        mat4.lookAt(this.viewMatrix,eyeX,eyeY,eyeZ);
        this.constructFrustrum();
        return;
    }
    var vec3_eye = vec3.fill(eyeX,eyeY,eyeZ);
    var vec3_center = vec3.fill(centerX,centerY,centerZ);
    var vec3_up = vec3.fill(upX,upY,upZ);
    this._position = vec3_eye;
    mat4.lookAt(this.viewMatrix,vec3_eye,vec3_center,vec3_up);
    this.constructFrustrum();
}
Camera.prototype.lookAt = function(eyeX,eyeY,eyeZ,centerX,centerY,centerZ,upX,upY,upZ){
    this.__lookAt(eyeX,eyeY,eyeZ,centerX,centerY,centerZ,upX,upY,upZ);
    this.viewWasOverriden = true;
}
Camera.prototype.translate = function(x,y,z){
    Engine.GameObjectManager.translate(this,-x,y,z);
    this.update(Engine.dt);
}
Camera.prototype.setPosition = function(x,y,z){
    Engine.GameObjectManager.setPosition(this,x,y,z);
    this.update(Engine.dt);
}
Camera.prototype.update = function(dt){
    Engine.GameObjectManager.update(this);
    if(!this.viewWasOverriden){
        this.__lookAt(this.position(),this.target(),this.up());
    }
    this.viewWasOverriden = false;
}
Camera.prototype.rotate = function(x,y,z){
    Engine.GameObjectManager.rotate(this,x,y,z);
    this.update(Engine.dt);
}
Camera.prototype.rotateX = function(x){ this.rotate(x,0,0); }
Camera.prototype.rotateY = function(y){ this.rotate(0,y,0); }
Camera.prototype.rotateZ = function(z){ this.rotate(0,0,z); }

Camera.prototype.up = function(){ return Engine.GameObjectManager.up(this); }
Camera.prototype.right = function(){ return Engine.GameObjectManager.right(this); }
Camera.prototype.forward = function(){ return Engine.GameObjectManager.forward(this); }
Camera.prototype.position = function(){ return Engine.GameObjectManager.position(this); }
Camera.prototype.target = function(){var ret = vec3.create();vec3.sub(ret,this.position(),this.forward());return ret;}