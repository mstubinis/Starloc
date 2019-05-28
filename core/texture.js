'use strict';

var Texture = function(name,file){
    if(name in Engine.ResourceManager.textures){ return Engine.ResourceManager.textures[name]; }
    var _this = this;
    if(typeof file == "string"){
        _this.texture = _this.load(_this,file);
    }
    else{//cubemap
        _this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP,_this.texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); 
     
        var faces = [gl.TEXTURE_CUBE_MAP_POSITIVE_Z,gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                     gl.TEXTURE_CUBE_MAP_POSITIVE_X,gl.TEXTURE_CUBE_MAP_POSITIVE_Y,gl.TEXTURE_CUBE_MAP_NEGATIVE_Y];
        
        var images = {};
        for(var i = 0; i < faces.length; i++){
            var ext = Engine.getExtension(file[i]);
            var buffType = gl.RGBA;
            if(ext == "jpg" || ext == "jpeg") buffType = gl.RGB;
            gl.texImage2D(faces[i], 0, buffType, 1, 1, 0,buffType, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
            images["_" + i] = -1;
            images["_" + i + "face"] = -1;
        }
        for(var i = 0; i < faces.length; i++){
            var img = new Image();
            var face = faces[i];
            var ext = Engine.getExtension(file[i]);
            img.src = file[i];
            img.onload = function(_images,_i,_this,_face,_img,_ext) {
                return function(){
                    var buffType = gl.RGBA;
                    if(_ext == "jpg" || _ext == "jpeg") buffType = gl.RGB;
                    
                    _images["_" + _i] = _img;
                    _images["_" + _i + "face"] = _face;
                    var _loaded = true; for(var key in _images){ if(_images[key] == -1){ _loaded = false; } }
                    if(_loaded){for(var j = 0; j < faces.length; j++){
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, _this.texture);
                        gl.texImage2D(_images["_" + j + "face"], 0, buffType, buffType, gl.UNSIGNED_BYTE, _images["_" + j]);
                    }
                    //cleanup
                    for (var member in _images) delete _images[member];}
                }
            }(images,i,_this,face,img,ext);
        }
    }
    Engine.ResourceManager.textures[name] = _this;
};
Texture.prototype.isPowerOf2 = function(img){   
    var res1 = ((img.width & (img.width - 1)) == 0);
    var res2 = ((img.height & (img.height - 1)) == 0);
    if(res1 && res2) return true; return false;
};
Texture.prototype.load = function(_this,file){
    var buffType = gl.RGBA;
    var extension = Engine.getExtension(file);
    if(extension == "jpg" || extension == "jpeg") buffType = gl.RGB;
    
    var textureMount = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureMount);
    gl.texImage2D(gl.TEXTURE_2D, 0, buffType, 1, 1, 0,buffType, gl.UNSIGNED_BYTE, new Uint8Array([255,255,255,255]));
    gl.bindTexture(gl.TEXTURE_2D, null);
    var img = new Image();
    img.onload = function(_this,_textureMount,_buffType,_img) { 
        return function(){
            gl.bindTexture(gl.TEXTURE_2D, _textureMount);
            gl.texImage2D(gl.TEXTURE_2D, 0, _buffType, _buffType, gl.UNSIGNED_BYTE, _img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            if(_this.isPowerOf2(_img)){
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            }
            else{
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }(_this,textureMount,buffType,img);
    img.src = file;
    return textureMount;
}