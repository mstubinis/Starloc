'use strict';

var Scene = function(name){
    if(name in Engine.ResourceManager.scenes){ return Engine.ResourceManager.scenes[name]; }

    this.objects = {};
    this.lights = {};
    this.cameras = {};
    
    this.objectsID = {};
    this.lightsID = {};
    this.camerasID = {};
    
    this.ambient = vec3.fill(0.05,0.05,0.05);

    Engine.ResourceManager.scenes[name] = this;
    if(!Engine.hasOwnProperty('scene')){
        Engine.scene = this;
    }
};