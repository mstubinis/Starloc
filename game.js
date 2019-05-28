'use strict'; 
var Engine = Engine || {};
(function (scope, undefined){
    Engine.Game = {};
    Engine.Game.Date = {};
    Engine.Game.initResources = function(){
        var mat = new Material("Star","star.png","","");
        mat.shadeless = true;
    }
    Engine.Game.initLogic = function(){ 
        //update azi & alt if user comes back to the page
        window.onfocus = function() {
            for(var starName in Engine.Game.Database){
                Engine.Game.DatabaseFunctions.GetAltitudeAzimuth(starName);
            }
        }
        Engine.Game.LoopCount = 0;
        Engine.Game.LoopAmount = 200; //amount of stars updated per frame. Lower to increase performance
        
        //Engine.requestPointerLock();
        Engine.requestGeolocation();
        Engine.disableOrientationChange("vertical");
        Engine.Game.DatabaseFunctions.init();
        Engine.Game.handleTime(0.0);
    }
    Engine.Game.handleTime = function(dt){
        var d = new Date; var date = new Date;
        date.setTime(d.getTime());

        Engine.Game.Date.date = date;
        Engine.Game.Date.day = date.getDate();
        Engine.Game.Date.year = date.getFullYear();
        Engine.Game.Date.hour = date.getHours();
        Engine.Game.Date.ampm = Engine.Game.Date.hour >= 12 ? 'pm' : 'am';
        
        Engine.Game.Date.minute = date.getMinutes();
        Engine.Game.Date.second = date.getSeconds();
        Engine.Game.Date.milisecond = date.getMilliseconds();
    }
    Engine.Game.onResize = function(e){
    }   
    Engine.Game.update = function(dt){
        Engine.Game.handleTime(dt);

        //if(Engine.EventManager.mobile.gyro.beta < 0){ Engine.EventManager.mobile.gyro.beta += 360.0 }
        var azimuth = Engine.EventManager.mobile.gyro.compass; //not so sure about this
        var altitude = Engine.EventManager.mobile.gyro.beta - 90;
        var roll = Engine.EventManager.mobile.gyro.gamma;
        
        var lat = Engine.EventManager.geolocation.lat;    // 43.172421    - lewiston, ny
        var longi = Engine.EventManager.geolocation.long; //-79.035782
        
        var keys = Object.keys(Engine.Game.Database);
        if(keys.length > 0){
            var test1 = Engine.Game.Database["Polaris"].Azimuth;
            var test2 = Engine.Game.Database["Polaris"].Altitude;
            var pRA = Engine.Game.Database["Polaris"].RA;
            var pDec = Engine.Game.Database["Polaris"].Dec;
            document.getElementById("canvasDebug").innerHTML = 
                "<br/><br/>My Azimuth: " + azimuth + 
                "<br/>My Altitude: " + altitude +
                "<br/>My Roll: " + roll +
                "<br/>Polaris Azimuth: " + test1 +
                "<br/>Polaris Altitude: " + test2 +
                "<br/>Polaris RA: " + pRA +
                "<br/>Polaris Dec: " + pDec;
        }
        var keys = Object.keys(Engine.Game.Database);
        if(keys.length > 0){
            for(var i = 0; i < Engine.Game.LoopAmount; i++){
                var key = keys[Engine.Game.LoopCount];
                var starData = Engine.Game.DatabaseFunctions.GetAltitudeAzimuth(key);
                Engine.Game.LoopCount++;
                if(Engine.Game.LoopCount >= keys.length){
                    Engine.Game.LoopCount = 0;
                }
            }
        }
        var keys1 = Object.keys(Engine.scene.objects);
        if(keys1.length > 0){
            for(var starName in Engine.Game.Database){
                var star = Engine.scene.objects[starName];
                var db = Engine.Game.Database[starName];
                var azimuthDiff  = (db.Azimuth  - azimuth) * 0.0174533;
                var altitudeDiff = (db.Altitude - altitude) * 0.0174533;
                
                star.setPosition(0,0,0);
                star.rotation = quat.fill(0,0,0,1);
                
                var sin = Math.sin(roll *0.0174533);
                var cos = Math.cos(roll *0.0174533);
                
                star.rotate(-altitudeDiff,-azimuthDiff,0 ,false);
                var fwd = star.forward();
                var newPos = vec3.fill(fwd[0],fwd[1],fwd[2]);
                star.setPosition(newPos[0]*db.Dist,newPos[1]*db.Dist,newPos[2]*db.Dist);
                star.rotation = Engine.camera.rotation;
                star.setScale(db.GameScale,db.GameScale,db.GameScale);
            }
        }
    }
    Engine.Game.render = function(){
        var shader = Engine.ResourceManager.shaders["Lines"].program;
        gl.useProgram(shader);
        gl.disable(gl.DEPTH_TEST);
        var modelMatrix = mat4.create();
        mat4.identity(modelMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "M"),false,modelMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "V"),false,Engine.camera.viewMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shader, "P"),false,Engine.camera.projectionMatrix); 
        for(var pathName in Engine.Game.DatabasePaths){
            Engine.Game.DatabaseFunctions.drawPath(pathName,shader);
        }
        gl.enable(gl.DEPTH_TEST);
    }
})(this);