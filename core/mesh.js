'use strict';

var Mesh = function(name,meshFile,fromFile,flags){
    if(name in Engine.ResourceManager.meshes){ return Engine.ResourceManager.meshes[name]; }
    if(fromFile === undefined) fromFile = true;
    if(flags === undefined) 
        flags = OBJ.LOAD_POSITIONS | OBJ.LOAD_UVS | OBJ.LOAD_NORMALS | OBJ.LOAD_TBN;
    var _this = this;
    _this.loaded = false;
    _this.radius = 0;
    Engine.ResourceManager.meshes[name] = _this;
    if(fromFile){
        OBJ.downloadMeshes( {meshFile: meshFile}, InitMeshFunc,_this,name,flags);
    }else{
        OBJ.Mesh(_this,meshFile,flags);
        InitMeshFunc(_this,name,flags);
    }
}; 
var InitMeshFunc = function(_this,name,flags){
    _this = OBJ.initMeshBuffers(gl,_this,flags);
    _this.loaded = true;
    if(Engine.ResourceManager.checkIfAllResourcesAreLoaded()){
        Engine.onResourcesLoaded();
    }
}
Mesh.prototype.sendUniforms = function(drawMode){
    if(!this.loaded) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(0, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    if( this.hasOwnProperty('uvBuffer') ){
        gl.enableVertexAttribArray(1);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(1, this.uvBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    if( this.hasOwnProperty('normalBuffer') ){
        gl.enableVertexAttribArray(2);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(2, this.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    if( this.hasOwnProperty('binormalBuffer') ){
        gl.enableVertexAttribArray(3);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.binormalBuffer);
        gl.vertexAttribPointer(3, this.binormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    if( this.hasOwnProperty('tangentBuffer') ){
        gl.enableVertexAttribArray(4);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
        gl.vertexAttribPointer(4, this.tangentBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(drawMode, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    if( this.hasOwnProperty('uvBuffer') ){ gl.disableVertexAttribArray(1); }
    if( this.hasOwnProperty('normalBuffer') ){ gl.disableVertexAttribArray(2); }
    if( this.hasOwnProperty('binormalBuffer') ){ gl.disableVertexAttribArray(3); }
    if( this.hasOwnProperty('tangentBuffer') ){ gl.disableVertexAttribArray(4); }
}
Mesh.prototype.sendUniformsInstance = function(drawMode,instanceCount){
    if(!this.loaded) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(0, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    if( this.hasOwnProperty('uvBuffer') ){
        gl.enableVertexAttribArray(1);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(1, this.uvBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    if( this.hasOwnProperty('normalBuffer') ){
        gl.enableVertexAttribArray(2);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(2, this.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    if( this.hasOwnProperty('binormalBuffer') ){
        gl.enableVertexAttribArray(3);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.binormalBuffer);
        gl.vertexAttribPointer(3, this.binormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    if( this.hasOwnProperty('tangentBuffer') ){
        gl.enableVertexAttribArray(4);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
        gl.vertexAttribPointer(4, this.tangentBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.extensions.instancing.drawElementsInstancedANGLE(drawMode,this.indexBuffer.numItems,gl.UNSIGNED_SHORT,0,instanceCount);
    if( this.hasOwnProperty('uvBuffer') ){ gl.disableVertexAttribArray(1); }
    if( this.hasOwnProperty('normalBuffer') ){ gl.disableVertexAttribArray(2); }
    if( this.hasOwnProperty('binormalBuffer') ){ gl.disableVertexAttribArray(3); }
    if( this.hasOwnProperty('tangentBuffer') ){ gl.disableVertexAttribArray(4); }
}