'use strict';
var Engine = Engine || {};
(function (scope, undefined){
    Engine.ResourceManager = {};
        
    Engine.ResourceManager.shaders = {};
    Engine.ResourceManager.meshes = {};
    Engine.ResourceManager.materials = {};
    Engine.ResourceManager.textures = {};
    Engine.ResourceManager.sounds = {};
    
    Engine.ResourceManager.scenes = {};
    
    Engine.ResourceManager.allLoaded = false;
    
    Engine.ResourceManager.initPreGameResources = function(){//add mandatory game resources
        new Shader("Default","vshader","fshader",["position","uv","normal","binormal","tangent"]);
        
        
        //LINES VERTEX SHADER////////////////////////////
        var vshader =
            "attribute vec3 position;\n"+
            "uniform mat4 M;\n"+
            "uniform mat4 V;\n"+
            "uniform mat4 P;\n"+
            "void main(void){\n"+
            "   gl_Position =  (P * V * M) * vec4(position,1.0);\n"+
            "}";
        //LINES FRAGMENT SHADER////////////////////////////
        var fshader =
            "precision mediump float;\n"+
            "void main(void){\n"+
            "   gl_FragColor = vec4(1.0,1.0,1.0,1.0);\n"+
            "}";
        
        new Shader("Lines",vshader,fshader,["position"],"vshader-lines","fshader-lines");
    }
    Engine.ResourceManager.initPreGameLogic = function(){//add mandatory game logic
        if(!Engine.hasOwnProperty('scene')){
            new Scene('DefaultScene');
        }
    }
    
    Engine.ResourceManager.initDefaultResources = function(){//add any needed game resources that the user might have forgotten
        if(!("Plane" in Engine.ResourceManager.meshes)){
            var data = "v -1.000000 -1.000000 0.000000\n"+
                       "v 1.000000 -1.000000 0.000000\n"+
                       "v -1.000000 1.000000 0.000000\n"+
                       "v 1.000000 1.000000 0.000000\n"+
                       "vt 0.0000 1.0000\n"+
                       "vt 1.0000 0.0000\n"+
                       "vt 0.0000 0.0000\n"+
                       "vt 1.0000 1.0000\n"+
                       "f 3/1 2/2 1/3\n"+
                       "f 3/1 4/4 2/2";
            new Mesh("Plane",data,false);
        }
        if(!("Cube" in Engine.ResourceManager.meshes)){
             var data = "v 1.000000 -1.000000 -1.000000\n"+
                        "v 1.000000 -1.000000 1.000000\n"+
                        "v -1.000000 -1.000000 1.000000\n"+
                        "v -1.000000 -1.000000 -1.000000\n"+
                        "v 1.000000 1.000000 -1.000000\n"+
                        "v 1.000000 1.000000 1.000000\n"+
                        "v -1.000000 1.000000 1.000000\n"+
                        "v -1.000000 1.000000 -1.000000\n"+
                        "vt 0.6657 0.3316\n"+
                        "vt 0.9997 0.6656\n"+
                        "vt 0.6657 0.6656\n"+
                        "vt -0.0022 0.6656\n"+
                        "vt 0.3318 0.3316\n"+
                        "vt 0.3318 0.6656\n"+
                        "vt -0.0022 0.6656\n"+
                        "vt 0.3318 0.9995\n"+
                        "vt -0.0022 0.9995\n"+
                        "vt 0.3318 0.6656\n"+
                        "vt 0.6657 0.9995\n"+
                        "vt 0.3318 0.9995\n"+
                        "vt 0.9997 0.9995\n"+
                        "vt 0.6657 0.9995\n"+
                        "vt 0.9997 0.3316\n"+
                        "vt -0.0022 0.3316\n"+
                        "vt 0.3318 0.6656\n"+
                        "vt 0.6657 0.6656\n"+
                        "vn 0.0000 -1.0000 0.0000\n"+
                        "vn 0.0000 1.0000 0.0000\n"+
                        "vn 1.0000 -0.0000 0.0000\n"+
                        "vn 0.0000 -0.0000 1.0000\n"+
                        "vn -1.0000 -0.0000 -0.0000\n"+
                        "vn 0.0000 0.0000 -1.0000\n"+
                        "f 2/1/1 4/2/1 1/3/1\n"+
                        "f 8/4/2 6/5/2 5/6/2\n"+
                        "f 5/6/3 2/1/3 1/3/3\n"+
                        "f 6/7/4 3/8/4 2/9/4\n"+
                        "f 3/10/5 8/11/5 4/12/5\n"+
                        "f 1/3/6 8/13/6 5/14/6\n"+
                        "f 2/1/1 3/15/1 4/2/1\n"+
                        "f 8/4/2 7/16/2 6/5/2\n"+
                        "f 5/6/3 6/5/3 2/1/3\n"+
                        "f 6/7/4 7/17/4 3/8/4\n"+
                        "f 3/10/5 7/18/5 8/11/5\n"+
                        "f 1/3/6 4/2/6 8/13/6";
            new Mesh("Cube",data,false);
        }
    }
    Engine.ResourceManager.initDefaultLogic = function(){//add any needed game logic that the user might have forgotten
        if(!Engine.hasOwnProperty('camera')){
            new Camera('DefaultCamera',Engine.canvas.width,Engine.canvas.height);
        }
    }
    Engine.ResourceManager.checkIfAllResourcesAreLoaded = function(){
        if(Engine.ResourceManager.allLoaded) return false;
        for(var key in Engine.ResourceManager.meshes){
            if(!Engine.ResourceManager.meshes[key].loaded){
                return false;
            }
        }
        for(var key in Engine.ResourceManager.sounds){
            if(!Engine.ResourceManager.sounds[key].loaded){
                return false;
            }
        }
        Engine.ResourceManager.allLoaded = true;
        return true;
    }
})(this);