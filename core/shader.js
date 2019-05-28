'use strict';

var Shader = function(name,vShaderFile,fShaderFile,attribs,vId,fId){
    if(name in Engine.ResourceManager.shaders){ return Engine.ResourceManager.shaders[name]; }
   
    this.program = -1;
    if(vId === undefined && fId === undefined){
        this.compile(vShaderFile,fShaderFile,attribs);
    }else{
        this.loadFromText(vShaderFile,fShaderFile,vId,fId);
        this.compile(vId,fId,attribs);
    } 
    Engine.ResourceManager.shaders[name] = this;
};
Shader.prototype.loadFromText = function(vShaderText,fShaderText,vId,fId){
    var s = document.createElement('script');
    var head = document.getElementsByTagName('head')[0];
    //VERTEX SHADER////////////////////////////////////////
    s.setAttribute("type", "x-shader/x-vertex");
    s.setAttribute("id", vId);
    s.innerHTML = vShaderText;
    head.appendChild(s);
    //FRAGMENT SHADER////////////////////////////////////
    s = document.createElement('script');
    s.setAttribute("type", "x-shader/x-fragment");
    s.setAttribute("id", fId);
    s.innerHTML = fShaderText;
    head.appendChild(s);
}
Shader.prototype.compile = function(vshader, fshader, attribs){
    var vertexShader = this.load(vshader);
    var fragmentShader = this.load(fshader);
    this.program = gl.createProgram();
    gl.attachShader (this.program, vertexShader);
    gl.attachShader (this.program, fragmentShader);
    
    for(var i = 0; i < attribs.length; i++)
        gl.bindAttribLocation(this.program,i,attribs[i]);
    
    gl.linkProgram(this.program);
    var linked = gl.getProgramParameter(this.program, gl.LINK_STATUS);
    if(!linked){
        var error = gl.getProgramInfoLog(this.program);
        gl.deleteProgram(this.program);
        gl.deleteProgram(fragmentShader);
        gl.deleteProgram(vertexShader);
        return null;
    }
}
Shader.prototype.load = function(shaderId){
    var shaderScript = document.getElementById(shaderId);
    var shaderType;
    if (!shaderScript) { return null; }
    if (shaderScript.type == "x-shader/x-vertex")        shaderType = gl.VERTEX_SHADER;
    else if (shaderScript.type == "x-shader/x-fragment") shaderType = gl.FRAGMENT_SHADER;
    else { return null; }
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderScript.text);
    gl.compileShader(shader);
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled){
        var error = gl.getShaderInfoLog(shader);
        var lines = error.split('\n');
        var msg = "";
        for(var i=0; i<lines.length; i++){
            var match = lines[i].match(/ERROR: (\d+):(\d+): (.*)/);
            if(match){
                var fileno = parseInt(match[1], 10)-1;
                var lineno = parseInt(match[2], 10)-1;
                msg += "File Line " + fileno + " , Shader Line " + lineno + ": " + match[3] + "\n";
                
            }
        }
        if(window.console && window.console.log){
            console.log(msg);
        }
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}