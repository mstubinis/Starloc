'use strict';
var Engine = Engine || {};

(function (scope, undefined){
    Engine.EventManager = {};
    
    Engine.EventManager.loaded = false;
    
    Engine.EventManager.hidden = undefined;
    Engine.EventManager.visibilityChange = undefined;
    
    Engine.EventManager.geolocation = {
        enabled: false,
        lat: 0,
        long: 0,
        accuracy: 0,
    };
    Engine.EventManager.orientationChange = {
        enabled: true,
        mode: "N/A",
        currOrientation: "",
    };  
    Engine.EventManager.mobile = {
        gyro: {
            alpha: 0,
            beta: 0,
            gamma: 0,
            compass: 0,
            absolute: 0,
        },
        acc: {
            rotAlpha: 0,
            rotBeta: 0,
            rotGamma: 0,
            gx: 0,
            gy: 0,
            gz: 0,
            x: 0,
            y: 0,
            z: 0,
        }
    };
    Engine.EventManager.pointerLock = {
        available: 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document,
        activated: false,
        desired: false,
    };
    Engine.EventManager.touch = {
        zoom1: vec2.zero(),
        zoom2: vec2.zero(),
        prevZoom1: vec2.zero(),
        prevZoom2: vec2.zero(),
        numTouches: 0,
    };
    Engine.EventManager.mouse = {
        x: 0,
        y: 0,
        pX: 0,
        pY: 0,
        diffX: 0,
        diffY: 0,
        wheel: 0,
        currentButton: -1,
        prevButton: -1,
        inBounds: true,
        buttons: {},
        map: {
            LEFT: '0',
            BUTTON_LEFT: '0',
            BUTTON_0: '0',
            
            MIDDLE: '1',
            BUTTON_MIDDLE: '1',
            BUTTON_1: '1',
            WHEEL: '1',
            
            RIGHT: '2',
            BUTTON_RIGHT: '2',
            BUTTON_2: '2',
            
            BUTTON_3: '3',
            BUTTON_4: '4',
            BUTTON_5: '5',
            BUTTON_6: '6',
            BUTTON_7: '7',
            BUTTON_8: '8',
            BUTTON_9: '9',
            BUTTON_10: '10',
        },
    };
    Engine.EventManager.keyboard = {
        currentKey: -1,
        prevKey: -1,
        key: {},
        map: {
            KEY_UP: '38',
            KEY_DOWN: '40',
            KEY_LEFT: '37',
            KEY_RIGHT: '39',
            KEY_SPACE: '32',
            KEY_W: '87',
            KEY_S: '83',
            KEY_A: '65',
            KEY_D: '68',
            KEY_Q: '81',
            KEY_E: '69',
            KEY_ENTER: '13',
            KEY_Z: '90',
            KEY_X: '88',
            KEY_C: '67',
            KEY_R: '82',
            KEY_F: '70',
            KEY_V: '86',
            KEY_T: '84',
            KEY_G: '71',
            KEY_B: '66',
            KEY_Y: '89',
            KEY_H: '72',
            KEY_N: '78',
            KEY_U: '85',
            KEY_J: '74',
            KEY_M: '77',
            KEY_I: '73',
            KEY_K: '75',
            KEY_O: '79',
            KEY_L: '76',
            KEY_P: '80',
            KEY_TAB: '9',
            KEY_ESC: '27',
            KEY_SHIFT: '16',
            KEY_CTRL: '17',
            KEY_ALT: '18',
            KEY_LEFT_WINDOW: '91',
            KEY_RIGHT_WINDOW: '92',
            KEY_SELECT: '93',
            KEY_BACKSPACE: '8',
            KEY_LEFTBRACKET: '219',
            KEY_RIGHTBRACKET: '221',
            KEY_MINUS: '189',
            KEY_PLUS: '187',
            KEY_TILDA: '192',
            KEY_ZERO: '48',
            KEY_ONE: '49',
            KEY_TWO: '50',
            KEY_THREE: '51',
            KEY_FOUR: '52',
            KEY_FIVE: '53',
            KEY_SIX: '54',
            KEY_SEVEN: '55',
            KEY_EIGHT: '56',
            KEY_NINE: '57',
            KEY_NUMPAD_ZERO: '96',
            KEY_NUMPAD_ONE: '97',
            KEY_NUMPAD_TWO: '98',
            KEY_NUMPAD_THREE: '99',
            KEY_NUMPAD_FOUR: '100',
            KEY_NUMPAD_FIVE: '101',
            KEY_NUMPAD_SIX: '102',
            KEY_NUMPAD_SEVEN: '103',
            KEY_NUMPAD_EIGHT: '104',
            KEY_NUMPAD_NINE: '105',
            KEY_NUMLOCK: '144',
            KEY_DIVIDE: '111',
            KEY_MULTIPLY: '106',
            KEY_SUBTRACT: '109',
            KEY_ADD: '107',
            KEY_INSERT: '45',
            KEY_DELETE: '46',
            KEY_HOME: '36',
            KEY_END: '35',
            KEY_PAGEUP: '33',
            KEY_PAGEDOWN: '34',
            KEY_SCROLLLOCK: '145',
            KEY_PAUSE: '19',
            KEY_BREAK: '19',
            KEY_F1: '112',
            KEY_F2: '113',
            KEY_F3: '114',
            KEY_F4: '115',
            KEY_F5: '116',
            KEY_F6: '117',
            KEY_F7: '118',
            KEY_F8: '119',
            KEY_F9: '120',
            KEY_F10: '121',
            KEY_F11: '122',
            KEY_F12: '123',
            KEY_SEMICOLON: '186',
            KEY_COLON: '186',
            KEY_QUOTE: '222',
            KEY_APOSTROPHE: '222',
            KEY_COMMA: '188',
            KEY_PERIOD: '190',
            KEY_QUESTIONMARK: '191',
            KEY_FORWARDSLASH: '191',
            KEY_PIPE: '220',
            KEY_FORWARDSLASH: '220'
        },
    };
    Engine.EventManager.isKeyDown = function(k){ 
        return Engine.EventManager.keyboard.key[Engine.EventManager.keyboard.map[k]] || false; 
    }
    Engine.EventManager.isKeyDownOnce = function(k){ 
        var res = Engine.EventManager.isKeyDown(k);
        var mappedKey = Engine.EventManager.keyboard.map[k]
        return (res 
            && Engine.EventManager.keyboard.currentKey == mappedKey 
            && (Engine.EventManager.keyboard.currentKey != Engine.EventManager.keyboard.prevKey)) ? true : false;
    }
    Engine.EventManager.isKeyUp = function(k){ 
        return (!Engine.EventManager.keyboard.key[Engine.EventManager.keyboard.map[k]]) || true; 
    }   
    Engine.EventManager.isMouseDown = function(m){ 
        return Engine.EventManager.mouse.buttons[Engine.EventManager.mouse.map[m]] || false; 
    }
    Engine.EventManager.isMouseDownOnce = function(m){ 
        var res = Engine.EventManager.isMouseDown(m);
        var mappedMouse = Engine.EventManager.mouse.map[m]
        return (res 
            && Engine.EventManager.mouse.currentButton == mappedMouse 
            && (Engine.EventManager.mouse.currentButton != Engine.EventManager.mouse.prevButton)) ? true : false;
    }
    Engine.EventManager.isMouseUp = function(m){ 
        return (!Engine.EventManager.mouse.buttons[Engine.EventManager.mouse.map[m]]) || true;
    }
    Engine.EventManager.updateMouseCoords = function(x,y,e){
        Engine.EventManager.mouse.pX = Engine.EventManager.mouse.x;
        Engine.EventManager.mouse.pY = Engine.EventManager.mouse.y;
        Engine.EventManager.mouse.x = x;
        Engine.EventManager.mouse.y = y;
        
        if(!Engine.EventManager.loaded) return;
        if(Engine.EventManager.pointerLock.activated){      
            Engine.EventManager.mouse.diffX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
            Engine.EventManager.mouse.diffY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
        }else{
            Engine.EventManager.mouse.diffX = (Engine.EventManager.mouse.x - Engine.EventManager.mouse.pX);
            Engine.EventManager.mouse.diffY = (Engine.EventManager.mouse.y - Engine.EventManager.mouse.pY);
        }
    }
    Engine.EventManager.update = function(){
        if(Math.abs(Engine.EventManager.mouse.diffX) > 0){
            Engine.EventManager.mouse.diffX *= 0.7; if(Math.abs(Engine.EventManager.mouse.diffX) < 0.01){ Engine.EventManager.mouse.diffX = 0; }
        }
        if(Math.abs(Engine.EventManager.mouse.diffY) > 0){
            Engine.EventManager.mouse.diffY *= 0.7; if(Math.abs(Engine.EventManager.mouse.diffY) < 0.01){ Engine.EventManager.mouse.diffY = 0; }
        }
        if(Math.abs(Engine.EventManager.mouse.wheel) > 0){
            Engine.EventManager.mouse.wheel *= 0.7; if(Math.abs(Engine.EventManager.mouse.wheel) < 0.01){ Engine.EventManager.mouse.wheel = 0; }
        }
        
        //geolocation parsing
        if(Engine.EventManager.geolocation.enabled){
            navigator.geolocation.getCurrentPosition(function(position){
                /*
coords.latitude         The latitude as a decimal number (always returned)
coords.longitude        The longitude as a decimal number (always returned)
coords.accuracy         The accuracy of position (always returned)
coords.altitude         The altitude in meters above the mean sea level (returned if available)
coords.altitudeAccuracy The altitude accuracy of position (returned if available)
coords.heading          The heading as degrees clockwise from North (returned if available)
coords.speed            The speed in meters per second (returned if available)
timestamp               The date/time of the response (returned if available)
                */
                
                Engine.EventManager.geolocation.lat      = position.coords.latitude;
                Engine.EventManager.geolocation.long     = position.coords.longitude;
                Engine.EventManager.geolocation.accuracy = position.coords.accuracy;
            });
        }
    }
    Engine.EventManager.ontouchstart = function(e){
        e = window.event || e;
        e.preventDefault();
        switch(e.touches.length){
            case 1:
                Engine.EventManager.mouse.x = e.touches[0].clientX;
                Engine.EventManager.mouse.y = e.touches[0].clientY;
                Engine.EventManager.mouse.pX = e.touches[0].clientX;
                Engine.EventManager.mouse.pY = e.touches[0].clientY;
                
                Engine.EventManager.mouse.prevButton    = Engine.EventManager.mouse.currentButton;
                Engine.EventManager.mouse.currentButton = '0';
                Engine.EventManager.mouse.buttons['0'] = true;
                break;
            case 2:
                Engine.EventManager.touch.prevZoom1 = vec2.fill(e.touches[0].clientX,e.touches[0].clientY);
                Engine.EventManager.touch.prevZoom2 = vec2.fill(e.touches[1].clientX,e.touches[1].clientY);
                Engine.EventManager.touch.zoom1 = vec2.fill(e.touches[0].clientX,e.touches[0].clientY);
                Engine.EventManager.touch.zoom2 = vec2.fill(e.touches[1].clientX,e.touches[1].clientY);
                
                
                Engine.EventManager.mouse.prevButton    = Engine.EventManager.mouse.currentButton;
                Engine.EventManager.mouse.currentButton = '2';
                Engine.EventManager.mouse.buttons['0'] = true;
                Engine.EventManager.mouse.buttons['2'] = true;
                
                break;
            default:
                break;
        }
        Engine.EventManager.touch.numTouches = e.touches.length;

        Engine.EventManager.mouse.inBounds = true;
    }
    Engine.EventManager.ontouchmove = function(e){
        e = window.event || e;
        e.preventDefault();
        e.stopPropagation();
        switch(e.touches.length){
            case 1:
                Engine.EventManager.updateMouseCoords(e.touches[0].clientX,e.touches[0].clientY,e);     
                break;
            case 2://probably zoom
                Engine.EventManager.touch.prevZoom1 = Engine.EventManager.touch.zoom1;
                Engine.EventManager.touch.prevZoom2 = Engine.EventManager.touch.zoom2;
                
                Engine.EventManager.touch.zoom1 = vec2.fill(e.touches[0].clientX,e.touches[0].clientY);
                Engine.EventManager.touch.zoom2 = vec2.fill(e.touches[1].clientX,e.touches[1].clientY);
                
                var y2 = Engine.EventManager.touch.zoom2[1]; var x2 = Engine.EventManager.touch.zoom2[0];
                var y1 = Engine.EventManager.touch.zoom1[1]; var x1 = Engine.EventManager.touch.zoom1[0];
                
                var _y2 = Engine.EventManager.touch.prevZoom2[1]; var _x2 = Engine.EventManager.touch.prevZoom2[0];
                var _y1 = Engine.EventManager.touch.prevZoom1[1]; var _x1 = Engine.EventManager.touch.prevZoom1[0];
                
                var x2Mx1 = (x2 - x1); x2Mx1*=x2Mx1; var y2My1 = (y2 - y1); y2My1*=y2My1;   
                var _x2Mx1 = (_x2 - _x1); _x2Mx1*=_x2Mx1; var _y2My1 = (_y2 - _y1); _y2My1*=_y2My1;
                
                var prevDiameter = Math.sqrt(x2Mx1 + y2My1);
                var currDiameter = Math.sqrt(_x2Mx1 + _y2My1);
                Engine.EventManager.mouse.wheel = -((currDiameter - prevDiameter) * 0.1);    
                break;
            default:
                break;
        }
        Engine.EventManager.touch.numTouches = e.touches.length;
        Engine.EventManager.mouse.inBounds = true;
    }
    Engine.EventManager.ontouchend = function(e){
        e = window.event || e;
        switch(e.touches.length){
            case 0:
                break;
            case 1:
                Engine.EventManager.updateMouseCoords(e.touches[0].clientX,e.touches[0].clientY,e);
                if(Engine.EventManager.touch.numTouches == 2){
                    Engine.EventManager.mouse.diffX = 0;
                    Engine.EventManager.mouse.diffY = 0;
                }
                break;
            default:
                break;
        }
        Engine.EventManager.touch.numTouches = e.touches.length;
    }
    Engine.EventManager.onmousedown = function(e){
        e = window.event || e;

        Engine.EventManager.mouse.prevButton    = Engine.EventManager.mouse.currentButton;
        Engine.EventManager.mouse.currentButton = e.button;
        Engine.EventManager.mouse.buttons[e.button] = true;
        
        Engine.EventManager.updateMouseCoords(e.x || e.clientX, e.y || e.clientY, e);
        
        if(Engine.EventManager.pointerLock.desired){
            if(!Engine.EventManager.pointerLock.activated && e.button == 0){
                Engine.EventManager.requestPointerLock();
            }
        }
    }
    Engine.EventManager.onmouseup = function(e){
        e = window.event || e;
        Engine.EventManager.updateMouseCoords(e.x || e.clientX,e.y || e.clientY,e);
        Engine.EventManager.mouse.buttons[e.button] = false;
        Engine.EventManager.mouse.prevButton    = -1;
        Engine.EventManager.mouse.currentButton = -1;
    }
    Engine.EventManager.onmousemove = function(e){
        e = window.event || e;
        e.stopPropagation();
        e.preventDefault();
        Engine.EventManager.updateMouseCoords(e.x || e.clientX,e.y || e.clientY,e);
    }
    Engine.EventManager.onmousewheel = function(e){
        e = window.event || e;
        e.stopPropagation();
        e.preventDefault();
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        Engine.EventManager.mouse.wheel = delta;
    }
    Engine.EventManager.onmouseover = function(e){
        e = window.event || e;
        e.stopPropagation();
        e.preventDefault();
        Engine.EventManager.mouse.inBounds = true;
    }
    Engine.EventManager.onmouseout = function(e){
        e = window.event || e;
        e.stopPropagation();
        e.preventDefault();
        Engine.EventManager.mouse.inBounds = false;
    }
    Engine.EventManager.onkeydown = function(e){
        e = window.event || e;

        Engine.EventManager.keyboard.prevKey    = Engine.EventManager.keyboard.currentKey;
        Engine.EventManager.keyboard.currentKey = e.keyCode;
        
        Engine.EventManager.keyboard.key[e.keyCode] = true;
        e.preventDefault();
    }
    Engine.EventManager.onkeyup = function(e){
        e = window.event || e;

        Engine.EventManager.keyboard.prevKey    = -1;
        Engine.EventManager.keyboard.currentKey = -1;
        
        Engine.EventManager.keyboard.key[e.keyCode] = false;
        e.preventDefault();
    }
    Engine.EventManager.onfocusout = function(e){
        e = window.event || e;
        e.preventDefault(); 
        for(var k in Engine.EventManager.keyboard.key){
            Engine.EventManager.keyboard.key[k] = false;
        }
        for(var m in Engine.EventManager.mouse.buttons){
            Engine.EventManager.mouse.buttons[m] = false;
        }
        Engine.focused = false;
    }
    Engine.EventManager.onfocusin = function(e){
        e = window.event || e;
        e.preventDefault(); 
        Engine.focused = true;
    }
    Engine.EventManager.onfocus = function(e){
        e = window.event || e;
        e.preventDefault(); 
        Engine.focused = true;
    }
    Engine.EventManager.onblur = function(e){
        e = window.event || e;
        e.preventDefault(); 
        for(var k in Engine.EventManager.keyboard.key){
            Engine.EventManager.keyboard.key[k] = false;
        }
        for(var m in Engine.EventManager.mouse.buttons){
            Engine.EventManager.mouse.buttons[m] = false;
        }
        Engine.focused = false;
    }
    Engine.EventManager.ondeviceorientation = function(e){
        e = window.event || e;
        Engine.EventManager.mobile.gyro.alpha    = e.alpha    || e.x || 0;     //0 to 360
        Engine.EventManager.mobile.gyro.beta     = e.beta     || e.y || 0;     //-180 to 180
        Engine.EventManager.mobile.gyro.gamma    = e.gamma    || e.z || 0;     //-90 to 90
        Engine.EventManager.mobile.gyro.absolute = e.absolute ||        false; //boolean
        // Apple works only with this, alpha doesn't work
        if(e.webkitCompassHeading && e.webkitCompassAccuracy && (e.webkitCompassAccuracy > 0 && e.webkitCompassAccuracy < 11)){
            Engine.EventManager.mobile.gyro.compass = e.webkitCompassHeading;
        }else{
            Engine.EventManager.mobile.gyro.compass = Engine.EventManager.mobile.gyro.alpha;
        }
    }
    Engine.EventManager.ondevicemotion = function(e){
        e = window.event || e;
        Engine.EventManager.mobile.acc.gx = e.accelerationIncludingGravity.x;
        Engine.EventManager.mobile.acc.gy = e.accelerationIncludingGravity.y;
        Engine.EventManager.mobile.acc.gz = e.accelerationIncludingGravity.z;
        Engine.EventManager.mobile.acc.x = e.acceleration.x;
        Engine.EventManager.mobile.acc.y = e.acceleration.y;
        Engine.EventManager.mobile.acc.z = e.acceleration.z;
        Engine.EventManager.mobile.acc.rotAlpha = e.rotationRate.alpha || 0;
        Engine.EventManager.mobile.acc.rotBeta = e.rotationRate.beta || 0;
        Engine.EventManager.mobile.acc.rotGamma = e.rotationRate.gamma || 0;
    }
    Engine.EventManager.onresize = function(e){
        Engine.Game.onResize(e);
    }
    Engine.EventManager.doWindowRotation = function(e){
        var body = document.getElementsByTagName('body')[0];
        if(Engine.EventManager.orientationChange.mode == "horizontal"){
            if(Engine.EventManager.orientationChange.currOrientation == "horizontal"){
                setTimeout(function(){ 
                    Engine.Game.onResize(e);
                    var s = "0px 0px 0px";
                    body.setAttribute('style','overflow-y:hidden;background-color:black;margin:0;outline:0;border:0;padding:0;top:0;left:0;position:absolute;z-index:1;'+
                        '-webkit-transform: rotate(0deg);'+
                        '-o-transform: rotate(0deg);'+
                        '-ms-transform: rotate(0deg);'+
                        '-moz-transform: rotate(0deg);'+
                        'transform: rotate(0deg);'+
                        
                        '-webkit-transform-origin: '+s+';'+
                        '-o-transform-origin: '+s+';'+
                        '-ms-transform-origin: '+s+';'+
                        '-moz-transform-origin: '+s+';'+
                        'transform-origin: '+s+';'
                    );
                }, 100);
            }else if(Engine.EventManager.orientationChange.currOrientation == "vertical"){
                setTimeout(function(){
                    Engine.Game.onResize(e);
                    var s = (w/2)+"px "+(w/2)+"px 0px";
                    body.setAttribute('style','overflow-x:hidden;background-color:black;margin:0;outline:0;border:0;padding:0;top:0;left:0;position:absolute;z-index:1;'+
                        '-webkit-transform: rotate(90deg);'+
                        '-o-transform: rotate(90deg);'+
                        '-ms-transform: rotate(90deg);'+
                        '-moz-transform: rotate(90deg);'+
                        'transform: rotate(90deg);'+
                        
                        '-webkit-transform-origin: '+s+';'+
                        '-o-transform-origin: '+s+';'+
                        '-ms-transform-origin: '+s+';'+
                        '-moz-transform-origin: '+s+';'+
                        'transform-origin: '+s+';'
                    );
                }, 100);
            }
        }else{
        }
    }
    Engine.EventManager.onorientationchange = function(e){
        e = window.event || e;
        var orientation = e.orientation || window.orientation;
        switch (orientation){
            case "Portrait":
            case 0://Portrait
            case 180://Portrait (upside down)
                if(Engine.EventManager.orientationChange.mode == "vertical"){ Engine.EventManager.orientationChange.prevRot = Engine.EventManager.orientationChange.nextRot; Engine.EventManager.orientationChange.nextRot = 0; }
                else{                                                         Engine.EventManager.orientationChange.prevRot = Engine.EventManager.orientationChange.nextRot; Engine.EventManager.orientationChange.nextRot = 90; }
                Engine.EventManager.orientationChange.currOrientation = "vertical";
                break;
            case "Landscape":
            case -90://Landscape(right,screen turned CW)
            case 90://Landscape(left, screen turned CCW)
                if(Engine.EventManager.orientationChange.mode == "vertical"){ Engine.EventManager.orientationChange.prevRot = Engine.EventManager.orientationChange.nextRot; Engine.EventManager.orientationChange.nextRot = 90; }
                else{                                                         Engine.EventManager.orientationChange.prevRot = Engine.EventManager.orientationChange.nextRot; Engine.EventManager.orientationChange.nextRot = 0; }
                Engine.EventManager.orientationChange.currOrientation = "horizontal";
                break;
            default:
                break;
        }
        if(!Engine.EventManager.orientationChange.enabled){
            Engine.EventManager.doWindowRotation();
        }
    }
    Engine.EventManager.requestPointerLock = function(){
        if(!Engine.EventManager.pointerLock.available){ 
            console.log("error: browser does not have pointer lock available.");
            return;
        }
        Engine.canvasEventCatcher.requestPointerLock = Engine.canvasEventCatcher.requestPointerLock || Engine.canvasEventCatcher.mozRequestPointerLock || Engine.canvasEventCatcher.webkitRequestPointerLock;
        Engine.canvasEventCatcher.requestPointerLock();
    }
    Engine.EventManager.exitPointerLock = function(){
        if(!Engine.EventManager.pointerLock.available){ 
            console.log("error: browser does not have pointer lock available.");
            return;
        }
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        document.exitPointerLock();
    }
    Engine.EventManager.onpointerlockchange = function(e){
        e = window.event || e;
        if(document.pointerLockElement === Engine.canvasEventCatcher || document.mozPointerLockElement === Engine.canvasEventCatcher || document.webkitPointerLockElement === Engine.canvasEventCatcher) {
            Engine.EventManager.pointerLock.activated = true;
            Engine.EventManager.mouse.diffX = 0;
            Engine.EventManager.mouse.diffY = 0;
        } 
        else{
            Engine.EventManager.pointerLock.activated = false;
        }
    }
    Engine.EventManager.onpointerlockchangeerror = function(){ console.log("error: could not activate pointer lock."); }

    Engine.EventManager.handleVisibilityChange = function(s){
        if (document[Engine.EventManager.hidden]) {
            Engine.focused = false;
        } else {
            Engine.focused = true;
        }
    }
    Engine.EventManager.init = function(){
        if(Engine.EventManager.loaded) return;
        Engine.canvasEventCatcher.addEventListener('touchstart',Engine.EventManager.ontouchstart);
        Engine.canvasEventCatcher.addEventListener('touchmove',Engine.EventManager.ontouchmove);
        Engine.canvasEventCatcher.addEventListener('touchend',Engine.EventManager.ontouchend);
        Engine.canvasEventCatcher.addEventListener('mousedown',Engine.EventManager.onmousedown);
        Engine.canvasEventCatcher.addEventListener('mouseup',Engine.EventManager.onmouseup);
        Engine.canvasEventCatcher.addEventListener('mousemove',Engine.EventManager.onmousemove);
        Engine.canvasEventCatcher.addEventListener('mousewheel',Engine.EventManager.onmousewheel);
        Engine.canvasEventCatcher.addEventListener('DOMMouseScroll',Engine.EventManager.onmousewheel);
        Engine.canvasEventCatcher.addEventListener('mouseover',Engine.EventManager.onmouseover);
        Engine.canvasEventCatcher.addEventListener('mouseout',Engine.EventManager.onmouseout);
        Engine.canvasEventCatcher.addEventListener('keydown',Engine.EventManager.onkeydown);
        Engine.canvasEventCatcher.addEventListener('keyup',Engine.EventManager.onkeyup);
        Engine.canvasEventCatcher.addEventListener('focusout',Engine.EventManager.onfocusout);
        Engine.canvasEventCatcher.addEventListener('focusin',Engine.EventManager.onfocusin);
        Engine.canvasEventCatcher.addEventListener('blur',Engine.EventManager.onblur);
        Engine.canvasEventCatcher.addEventListener('focus',Engine.EventManager.onfocus);
        
        //this does not really work well...
        if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
            Engine.EventManager.hidden = "hidden";
            Engine.EventManager.visibilityChange = "visibilitychange";
        } else if (typeof document.msHidden !== "undefined") {
            Engine.EventManager.hidden = "msHidden";
            Engine.EventManager.visibilityChange = "msvisibilitychange";
        } else if (typeof document.webkitHidden !== "undefined") {
            Engine.EventManager.hidden = "webkitHidden";
            Engine.EventManager.visibilityChange = "webkitvisibilitychange";
        }
        else if (typeof document.mozHidden !== "undefined") {
            Engine.EventManager.hidden = "mozHidden";
            Engine.EventManager.visibilityChange = "mozvisibilitychange";
        }
        document.addEventListener(Engine.EventManager.visibilityChange, Engine.EventManager.handleVisibilityChange, false);
        
        
        document.addEventListener('pointerlockchange', Engine.EventManager.onpointerlockchange, false);
        document.addEventListener('mozpointerlockchange', Engine.EventManager.onpointerlockchange, false);
        document.addEventListener('webkitpointerlockchange', Engine.EventManager.onpointerlockchange, false);
        
        document.addEventListener('pointerlockerror', Engine.EventManager.onpointerlockchangeerror, false);
        document.addEventListener('mozpointerlockerror', Engine.EventManager.onpointerlockchangeerror, false);
        document.addEventListener('webkitpointerlockerror', Engine.EventManager.onpointerlockchangeerror, false);
        
        window.addEventListener("resize", Engine.EventManager.onresize);
        window.addEventListener("orientationchange", Engine.EventManager.onorientationchange,false);
        
        //if(window.DeviceOrientationEvent){
            window.addEventListener("deviceorientation",Engine.EventManager.ondeviceorientation);
        //}else{
        //    window.addEventListener("MozOrientation",Engine.EventManager.ondeviceorientation,true);
        //}
        if(window.DeviceMotionEvent){
            window.addEventListener('devicemotion',Engine.EventManager.ondevicemotion,true);
        } 
        Engine.EventManager.loaded = true;
    }
    Engine.EventManager.cleanup = function(){
        if(!Engine.EventManager.loaded) return;
        Engine.canvasEventCatcher.removeEventListener('touchstart',Engine.EventManager.ontouchstart);
        Engine.canvasEventCatcher.removeEventListener('touchmove',Engine.EventManager.ontouchmove);
        Engine.canvasEventCatcher.removeEventListener('touchend',Engine.EventManager.ontouchend);
        Engine.canvasEventCatcher.removeEventListener('mousedown',Engine.EventManager.onmousedown);
        Engine.canvasEventCatcher.removeEventListener('mouseup',Engine.EventManager.onmouseup);
        Engine.canvasEventCatcher.removeEventListener('mousemove',Engine.EventManager.onmousemove);
        Engine.canvasEventCatcher.removeEventListener('mousewheel',Engine.EventManager.onmousewheel);
        Engine.canvasEventCatcher.removeEventListener('DOMMouseScroll',Engine.EventManager.onmousewheel);
        Engine.canvasEventCatcher.removeEventListener('mouseover',Engine.EventManager.onmouseover);
        Engine.canvasEventCatcher.removeEventListener('mouseout',Engine.EventManager.onmouseout);
        Engine.canvasEventCatcher.removeEventListener('keydown',Engine.EventManager.onkeydown);
        Engine.canvasEventCatcher.removeEventListener('keyup',Engine.EventManager.onkeyup);
        Engine.canvasEventCatcher.removeEventListener('focusout',Engine.EventManager.onfocusout);
        Engine.canvasEventCatcher.removeEventListener('focusin',Engine.EventManager.onfocusin);
        Engine.canvasEventCatcher.removeEventListener('blur',Engine.EventManager.onblur);
        Engine.canvasEventCatcher.removeEventListener('focus',Engine.EventManager.onfocus);
        
        document.removeEventListener(Engine.EventManager.visibilityChange, Engine.EventManager.handleVisibilityChange, false);
        
        document.removeEventListener("pointerlockchange", Engine.EventManager.onpointerlockchange, false);
        document.removeEventListener("mozpointerlockchange", Engine.EventManager.onpointerlockchange, false);
        document.removeEventListener("webkitpointerlockchange", Engine.EventManager.onpointerlockchange, false);
        
        document.removeEventListener("pointerlockerror", Engine.EventManager.onpointerlockchangeerror, false);
        document.removeEventListener("mozpointerlockerror", Engine.EventManager.onpointerlockchangeerror, false);
        document.removeEventListener("webkitpointerlockerror", Engine.EventManager.onpointerlockchangeerror, false);
        
        window.removeEventListener("resize", Engine.EventManager.onresize);
        window.removeEventListener("orientationchange", Engine.EventManager.onorientationchange,false);
        
        //if(window.DeviceOrientationEvent){
            window.removeEventListener("deviceorientation",Engine.EventManager.ondeviceorientation);
        //}else{
        //    window.removeEventListener("MozOrientation",Engine.EventManager.ondeviceorientation,true);
        //}
        if(window.DeviceMotionEvent){
            window.removeEventListener('devicemotion',Engine.EventManager.ondevicemotion,true);
        } 
        Engine.EventManager.loaded = false;
    }
})(this);