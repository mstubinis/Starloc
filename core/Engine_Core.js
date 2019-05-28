'use strict';
var Engine = Engine || {};
var gl;
var g = {}; // global variables

Engine.toRad=function(d){return d*0.0174533;}
Engine.getExtension=function(f){return f.substr((~-f.lastIndexOf(".")>>>0)+2);}

Engine.framerate = function(){ return 1.00000000 / Engine.dt; }
Engine.fps = Engine.framerate;

if(!Array.prototype.indexOf){
Array.prototype.indexOf=function(e){var l=this.length>>>0;var f=Number(arguments[1]) || 0;
f=(f<0)?Math.ceil(f):Math.floor(f);if(f<0)f+=l;for(;f<l;f++){if(f in this && this[f]===e)return f;}return -1;};}

Engine.run = function(){
    var now = Date.now();
    Engine.dt = (now - Engine.currentTime)/1000.00000000;
    Engine.currentTime = now;
    
    Engine.update(Engine.dt);
    Engine.render();
    
    Engine.requestId = window.requestAnimFrame(Engine.run, Engine.canvas);
}
Engine.handleContextLost = function(e) {
    e.preventDefault();
    if (Engine.requestId !== undefined) {
        window.cancelAnimFrame(Engine.requestId);
        Engine.requestId = undefined;
    }
}
Engine.handleContextRestored = function() {
    Engine.run();
}
Engine.init = function(w,h){
    Engine.windowWidth = w;
    Engine.currentTime = 0.0000000;
    Engine.dt = 0.0000000;
    //first build the canvas and it's necessary html elements.
    var body = document.getElementsByTagName('body')[0];
    
    var canvas_event_element = document.createElement('div');
    canvas_event_element.setAttribute('tabindex', '0');
    canvas_event_element.setAttribute('id', 'canvasEventCatcher');
    canvas_event_element.setAttribute('style', 'position:absolute;top:0;left:0;z-index:5;outline:none;');
    
    var canvas_debug_element = document.createElement('div');
    canvas_debug_element.setAttribute('tabindex', '-1');
    canvas_debug_element.setAttribute('id', 'canvasDebug');
    canvas_debug_element.setAttribute('style', 'margin:0;outline:0;border:0;padding:0;top:0;left:0;position:absolute;color:yellow;font-size:200%;z-index:4');

    var canvas_element = document.createElement('canvas');
    canvas_element.setAttribute('tabindex', '-1');
    canvas_element.setAttribute('id', 'canvas');
    canvas_element.setAttribute('style', 'position:relative;top:0;left:0;');
    
    
    body.appendChild(canvas_event_element);
    body.appendChild(canvas_debug_element);
    body.appendChild(canvas_element);
    //
    Engine.requestId = undefined;
    Engine.canvas = document.getElementById('canvas');
    Engine.canvasEventCatcher = document.getElementById("canvasEventCatcher");
       
    Engine.canvas.width = w;
    Engine.canvas.height = h;
    Engine.canvasEventCatcher.style.width = w + "px";
    Engine.canvasEventCatcher.style.height = h + "px";
    
    gl = Engine.RenderManager.init(Engine.canvas);
  
    Engine.canvas.addEventListener('webglcontextlost', Engine.handleContextLost, false);
    Engine.canvas.addEventListener('webglcontextrestored', Engine.handleContextRestored, false);
    
    Engine.Math.init();
    Engine.PhysicsManager.init();
    Engine.SoundManager.init();
    Engine.ResourceManager.initPreGameResources();
    Engine.Game.initResources();
    Engine.ResourceManager.initDefaultResources();
    
    //this is the above area referenced below
}
Engine.onResourcesLoaded = function(){
    Engine.EventManager.init();
    
    var now = Date.now();
    Engine.dt = 0.0000000;
    Engine.currentTime = now;

    
    //move this to above area if needed
    Engine.ResourceManager.initPreGameLogic();
    Engine.Game.initLogic();
    Engine.ResourceManager.initDefaultLogic();  
    Engine.resize(Engine.canvas.width,Engine.canvas.height);
    Engine.run();
}
Engine.requestGeolocation = function(){
    if ("geolocation" in navigator) {
        Engine.EventManager.geolocation.enabled = true;
    } else {
        Engine.EventManager.geolocation.enabled = false;
    }
}
Engine.disableOrientationChange = function(orientationType){
    Engine.EventManager.orientationChange.enabled = false;
    var s = orientationType.toLowerCase();
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0.0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0.0);
    if(s == "horizontal" || s == "landscape" || s == "h" || s == "l"){
        Engine.EventManager.orientationChange.mode = "horizontal";
    }
    else if(s == "vertical" || s == "portrait" || s == "v" || s == "p"){
        Engine.EventManager.orientationChange.mode = "vertical";
    }
    if(w > h){ Engine.EventManager.orientationChange.currOrientation = "horizontal"; }
    else{      Engine.EventManager.orientationChange.currOrientation = "vertical"; }
    Engine.EventManager.doWindowRotation();
}
Engine.requestPointerLock = function(){
    Engine.EventManager.pointerLock.desired = true;
}
Engine.resize = function(width,height){
    Engine.canvas.width = width;
    Engine.canvas.height = height;
    Engine.canvasEventCatcher.style.width = width + "px";
    Engine.canvasEventCatcher.style.height = height + "px"; 
    gl.viewport(0, 0, width, height);
    for (var key in Engine.ResourceManager.scenes) {
        var scene = Engine.ResourceManager.scenes[key];
        for (var key1 in scene.cameras) {
            scene.cameras[key1].resize(width,height);
        }
    }
}
Engine.update = function(dt){
    Engine.Game.update(dt);
    
    //cleanup memory
    for(var key in Engine.scene.objects){
        if(Engine.scene.objects[key].hasOwnProperty('_isToBeDestroyed')){
            Engine.scene.objects[key]._free();
            delete Engine.scene.objects[key];
        }
    }
    
    for (var key in Engine.scene.lights) {
        Engine.scene.lights[key].update(dt);
    }
    for (var key in Engine.scene.objects) {
        Engine.scene.objects[key].update(dt);
    }
    for (var key in Engine.scene.cameras) {
        Engine.scene.cameras[key].update(dt);
    }
    for (var key in Engine.ResourceManager.sounds) {
        Engine.ResourceManager.sounds[key].update(dt);
    }
    Engine.EventManager.update(dt);
    Engine.PhysicsManager.update(dt);
    
}

Engine.render = function(){
    Engine.RenderManager.render();
    Engine.Game.render();
}

Engine.isKeyDown = function(key){ return Engine.EventManager.isKeyDown(key); }
Engine.isKeyUp = function(key){ return Engine.EventManager.isKeyUp(key); }