'use strict';
var OBJ = {};

OBJ.LOAD_POSITIONS = 1 << 0; //1
OBJ.LOAD_UVS       = 1 << 1; //2
OBJ.LOAD_NORMALS   = 1 << 2; //4
OBJ.LOAD_TBN       = 1 << 3; //8
OBJ.LOAD_TRIANGLES = 1 << 4; //16

OBJ.is_near = function(v1,v2,threshold){ return Math.abs( v1-v2 ) < threshold; }
OBJ._getSimilarVertexIndex = function(in_pos,in_uv,in_norm,mesh,ret,threshold){
    ret.found = false;
    ret.index = 0;
    for (var i=0; i < mesh.vec3_vertices.length; i++ ){
        if(mesh.vec2_uvs.length == 0 && mesh.vec3_normals.length > 0){
            if (OBJ.is_near( in_pos[0] , mesh.vec3_vertices[i][0] ,threshold) &&
                OBJ.is_near( in_pos[1] , mesh.vec3_vertices[i][1] ,threshold) &&
                OBJ.is_near( in_pos[2] , mesh.vec3_vertices[i][2] ,threshold) &&
                OBJ.is_near( in_norm[0] , mesh.vec3_normals[i][0] ,threshold) &&
                OBJ.is_near( in_norm[1] , mesh.vec3_normals[i][1] ,threshold) &&
                OBJ.is_near( in_norm[2] , mesh.vec3_normals[i][2] ,threshold)
            ){
                ret.index = i; ret.found = true; return ret;
            }
        }else if(mesh.vec2_uvs.length == 0 && mesh.vec3_normals.length == 0){
            if (OBJ.is_near( in_pos[0] , mesh.vec3_vertices[i][0] ,threshold) &&
                OBJ.is_near( in_pos[1] , mesh.vec3_vertices[i][1] ,threshold) &&
                OBJ.is_near( in_pos[2] , mesh.vec3_vertices[i][2] ,threshold)
            ){
                ret.index = i; ret.found = true; return ret;
            }
        }else if(mesh.vec3_normals.length == 0 && mesh.vec2_uvs.length > 0){
            if (OBJ.is_near( in_pos[0] , mesh.vec3_vertices[i][0] ,threshold) &&
                OBJ.is_near( in_pos[1] , mesh.vec3_vertices[i][1] ,threshold) &&
                OBJ.is_near( in_pos[2] , mesh.vec3_vertices[i][2] ,threshold) &&
                OBJ.is_near( in_uv[0]  , mesh.vec2_uvs[i][0]      ,threshold) &&
                OBJ.is_near( in_uv[1]  , mesh.vec2_uvs[i][1]      ,threshold)
            ){
                ret.index = i; ret.found = true; return ret;
            }
        }else{
            if (OBJ.is_near( in_pos[0] , mesh.vec3_vertices[i][0] ,threshold) &&
                OBJ.is_near( in_pos[1] , mesh.vec3_vertices[i][1] ,threshold) &&
                OBJ.is_near( in_pos[2] , mesh.vec3_vertices[i][2] ,threshold) &&
                OBJ.is_near( in_uv[0]  , mesh.vec2_uvs[i][0]      ,threshold) &&
                OBJ.is_near( in_uv[1]  , mesh.vec2_uvs[i][1]      ,threshold) &&
                OBJ.is_near( in_norm[0] , mesh.vec3_normals[i][0] ,threshold) &&
                OBJ.is_near( in_norm[1] , mesh.vec3_normals[i][1] ,threshold) &&
                OBJ.is_near( in_norm[2] , mesh.vec3_normals[i][2] ,threshold)
            ){
                ret.index = i; ret.found = true; return ret;
            }
        }
    }
    return ret;
}
OBJ.indexVBO = function(mesh,threshold,flags){
    var new_mesh = {};
    new_mesh.triangles = mesh.triangles;
    new_mesh.vec3_vertices = [];
    new_mesh.vec3_barycentric = [];
    new_mesh.vec2_uvs = [];
    new_mesh.vec3_normals = [];
    new_mesh.vec3_binormals = [];
    new_mesh.vec3_tangents = [];
    new_mesh.indices = [];
    for (var i=0; i < mesh.vec3_vertices.length; i++ ){ 
        var ret = {}; ret.index = -1; ret.found = false;    
        ret = OBJ._getSimilarVertexIndex(mesh.vec3_vertices[i],mesh.vec2_uvs[i] || vec2.fill(0,0),mesh.vec3_normals[i] || vec3.fill(0,0,0),new_mesh,ret,threshold);
        if ( ret.found ){
            new_mesh.indices.push( ret.index );
            // Average the tangents and the bitangents -- doesnt work with mirrored uvs atm.
            if( mesh.vec3_tangents.length > 0){
                new_mesh.vec3_tangents[ret.index][0] += mesh.vec3_tangents[i][0];
                new_mesh.vec3_tangents[ret.index][1] += mesh.vec3_tangents[i][1];
                new_mesh.vec3_tangents[ret.index][2] += mesh.vec3_tangents[i][2];
            }
            if( mesh.vec3_binormals.length > 0){
                new_mesh.vec3_binormals[ret.index][0] += mesh.vec3_binormals[i][0];
                new_mesh.vec3_binormals[ret.index][1] += mesh.vec3_binormals[i][1];
                new_mesh.vec3_binormals[ret.index][2] += mesh.vec3_binormals[i][2];
            }
        }else{
            new_mesh.vec3_vertices.push( mesh.vec3_vertices[i]);
            new_mesh.vec3_barycentric.push( mesh.vec3_barycentric[i]);
            if(mesh.vec2_uvs.length > 0)
                new_mesh.vec2_uvs.push(mesh.vec2_uvs[i]);
            if(mesh.vec3_normals.length > 0)
                new_mesh.vec3_normals.push(mesh.vec3_normals[i]);
            if(mesh.vec3_tangents.length > 0)
                new_mesh.vec3_tangents.push(mesh.vec3_tangents[i]);
            if(mesh.vec3_binormals.length > 0)
                new_mesh.vec3_binormals.push(mesh.vec3_binormals[i]);
            new_mesh.indices.push(new_mesh.vec3_vertices.length - 1);
        }
    }
    return new_mesh;
}
OBJ.isSpecialFloat = function(v){
    if(!isFinite(v[0])){ return true }
    if(!isFinite(v[1])){ return true }
    if(!isFinite(v[2])){ return true }
    return false;
}
OBJ.calculateTBN = function(points,uvs,normals,mesh){
    if(normals.length == 0) return;
    
    for(var i=0; i < points.length; i+=3){
        var deltaPos1 = vec3.fill(points[i + 1][0] - points[i + 0][0],points[i + 1][1] - points[i + 0][1],points[i + 1][2] - points[i + 0][2]);                        
        var deltaPos2 = vec3.fill(points[i + 2][0] - points[i + 0][0],points[i + 2][1] - points[i + 0][1],points[i + 2][2] - points[i + 0][2]);
        
        var deltaUV1 = vec2.fill(uvs[i + 1][0] - uvs[i + 0][0],uvs[i + 1][1] - uvs[i + 0][1]);
        var deltaUV2 = vec2.fill(uvs[i + 2][0] - uvs[i + 0][0],uvs[i + 2][1] - uvs[i + 0][1]);
        
        var r = 1.0 / ((deltaUV1[0] * deltaUV2[1]) - (deltaUV1[1] * deltaUV2[0]));
        
        var tangent = vec3.fill(((deltaPos1[0] * deltaUV2[1]) - (deltaPos2[0] * deltaUV1[1])) * r,
                                ((deltaPos1[1] * deltaUV2[1]) - (deltaPos2[1] * deltaUV1[1])) * r,
                                ((deltaPos1[2] * deltaUV2[1]) - (deltaPos2[2] * deltaUV1[1])) * r);

        var bitangent = vec3.fill(((deltaPos2[0] * deltaUV1[0]) - (deltaPos1[0] * deltaUV2[0])) * r,
                                  ((deltaPos2[1] * deltaUV1[0]) - (deltaPos1[1] * deltaUV2[0])) * r,
                                  ((deltaPos2[2] * deltaUV1[0]) - (deltaPos1[2] * deltaUV2[0])) * r);

        var n1 = vec3.fill(normals[i + 0][0],normals[i + 0][1],normals[i + 0][2]);
        var n2 = vec3.fill(normals[i + 1][0],normals[i + 1][1],normals[i + 1][2]);
        var n3 = vec3.fill(normals[i + 2][0],normals[i + 2][1],normals[i + 2][2]);
                                        
        var t1_mul = vec3.create(); vec3.scale(t1_mul, n1, vec3.dot(tangent,n1));
        var t2_mul = vec3.create(); vec3.scale(t2_mul, n2, vec3.dot(tangent,n2));
        var t3_mul = vec3.create(); vec3.scale(t3_mul, n3, vec3.dot(tangent,n3)); 
        var t1 = vec3.create(); vec3.sub(t1, tangent, t1_mul);
        var t2 = vec3.create(); vec3.sub(t2, tangent, t2_mul);
        var t3 = vec3.create(); vec3.sub(t3, tangent, t3_mul);
        vec3.normalize(t1, t1); vec3.normalize(t2, t2); vec3.normalize(t3, t3);
        
        var b1_mul = vec3.create(); vec3.scale(b1_mul, n1, vec3.dot(bitangent,n1));
        var b2_mul = vec3.create(); vec3.scale(b2_mul, n2, vec3.dot(bitangent,n2));
        var b3_mul = vec3.create(); vec3.scale(b3_mul, n3, vec3.dot(bitangent,n3));  
        var b1 = vec3.create(); vec3.sub(b1, bitangent, b1_mul);
        var b2 = vec3.create(); vec3.sub(b2, bitangent, b2_mul);
        var b3 = vec3.create(); vec3.sub(b3, bitangent, b3_mul);
        vec3.normalize(b1, b1); vec3.normalize(b2, b2); vec3.normalize(b3, b3);
        
        //Orthogonalization of tangent////////////////////////////////////////////////////////////////
        var t1_mulDot = vec3.create(); vec3.scale(t1_mulDot, n1, vec3.dot(n1, t1));
        var t2_mulDot = vec3.create(); vec3.scale(t2_mulDot, n2, vec3.dot(n2, t2));
        var t3_mulDot = vec3.create(); vec3.scale(t3_mulDot, n3, vec3.dot(n3, t3));
        
        var t1_sub = vec3.create(); t1_sub = vec3.sub(t1_sub, t1, t1_mulDot);
        var t2_sub = vec3.create(); t2_sub = vec3.sub(t2_sub, t2, t2_mulDot);
        var t3_sub = vec3.create(); t3_sub = vec3.sub(t3_sub, t3, t3_mulDot);
        
        vec3.normalize(t1, t1_sub);
        vec3.normalize(t2, t2_sub);
        vec3.normalize(t3, t3_sub);
		
		//not sure why, but binormals NEED to be negated completely...
		b1[0] = -b1[0]; b1[1] = -b1[1]; b1[2] = -b1[2];
		b2[0] = -b2[0]; b2[1] = -b2[1]; b2[2] = -b2[2];
		b3[0] = -b3[0]; b3[1] = -b3[1]; b3[2] = -b3[2];
		
        ////////////////////////////////////////////////////////////////////////////////////////////////
        mesh.vec3_tangents.push(t1); mesh.vec3_tangents.push(t2); mesh.vec3_tangents.push(t3);
        mesh.vec3_binormals.push(b1); mesh.vec3_binormals.push(b2); mesh.vec3_binormals.push(b3);
    }
}
OBJ.loadDataIntoTriangles = function(mesh,file_verts,file_uvs,file_normals,point_indices,uv_indices,normal_indices){
    var triangle = {v1:{},v2:{},v3:{}};
    var triangles = [];
    var count = 0;
    
    if(point_indices.length == 0){
        for(var i=0; i < file_verts.length; i++ ){
            mesh.vec3_vertices.push(file_verts[i]);
            count++;
            if(count == 1){
                triangle.v1.position = file_verts[i];
                mesh.vec3_barycentric.push(vec3.fill(1,0,0));
            }else if(count == 2){
                triangle.v2.position = file_verts[i];
                mesh.vec3_barycentric.push(vec3.fill(0,1,0));
            }else if(count >= 3){
                triangle.v3.position = file_verts[i];
                mesh.vec3_barycentric.push(vec3.fill(0,0,1));
                count = 0;
                triangles.push(triangle);
                triangle = {v1:{},v2:{},v3:{}};
            }
        }
    }else{       
        for(var i=0; i < point_indices.length; i++ ){
            mesh.vec3_vertices.push(file_verts[ point_indices[i]-1 ]);
            if(uv_indices.length > 0)
                mesh.vec2_uvs.push(file_uvs[ uv_indices[i]-1 ]);
            if(normal_indices.length > 0)
                mesh.vec3_normals.push(file_normals[ normal_indices[i]-1 ]);
            count++;
            
            if(count == 1){
                triangle.v1.position = file_verts[ point_indices[i]-1 ];
                mesh.vec3_barycentric.push(vec3.fill(1,0,0));
                if(uv_indices.length > 0)
                    triangle.v1.uv = file_uvs[ uv_indices[i]-1 ];
                if(normal_indices.length > 0)
                    triangle.v1.normal = file_normals[ normal_indices[i]-1 ];
            }else if(count == 2){
                triangle.v2.position = file_verts[ point_indices[i]-1 ];
                mesh.vec3_barycentric.push(vec3.fill(0,1,0));
                if(uv_indices.length > 0)
                    triangle.v2.uv = file_uvs[ uv_indices[i]-1 ];
                if(normal_indices.length > 0)
                    triangle.v2.normal = file_normals[ normal_indices[i]-1 ];
            }else if(count >= 3){
                triangle.v3.position = file_verts[ point_indices[i]-1 ];
                mesh.vec3_barycentric.push(vec3.fill(0,0,1));
                if(uv_indices.length > 0)
                    triangle.v3.uv = file_uvs[ uv_indices[i]-1 ];
                if(normal_indices.length > 0)
                    triangle.v3.normal = file_normals[ normal_indices[i]-1 ];
                count = 0;
                triangles.push(triangle);
                triangle = {v1:{},v2:{},v3:{}};
            }
        }
    }
    mesh.triangles = triangles;
}
OBJ.vec3ArrayToFloatArray = function(vec3_array){
    var ret = [];
    for(var i = 0; i < vec3_array.length; i++){
        ret.push(vec3_array[i][0]);
        ret.push(vec3_array[i][1]);
        ret.push(vec3_array[i][2]);
    }
    return ret;
}
OBJ.vec2ArrayToFloatArray = function(vec2_array){
    var ret = [];
    for(var i = 0; i < vec2_array.length; i++){
        ret.push(vec2_array[i][0]);
        ret.push(vec2_array[i][1]);
    }
    return ret;
}
OBJ.finalize = function(mesh,flags){  
    mesh.radius = 0;
    mesh.radiusX = 0;
    mesh.radiusY = 0;
    mesh.radiusZ = 0;
    for(var i = 0; i < mesh.vec3_vertices.length; i++){
        var len = vec3.length(mesh.vec3_vertices[i]);
        var pt = mesh.vec3_vertices[i]; 
        var x = Math.abs(pt[0]);
        if(x > mesh.radiusX){   mesh.radiusX = x; }
        var y = Math.abs(pt[1]);
        if(y > mesh.radiusY){   mesh.radiusY = y; }   
        var z = Math.abs(pt[2]);
        if(z > mesh.radiusZ){   mesh.radiusZ = z; }       
        if(len > mesh.radius){  mesh.radius = len; }
    }
    mesh.vertices = OBJ.vec3ArrayToFloatArray(mesh.vec3_vertices);
    mesh.barycentric = OBJ.vec3ArrayToFloatArray(mesh.vec3_barycentric);
    if(mesh.vec2_uvs.length > 0)
        mesh.uvs = OBJ.vec2ArrayToFloatArray(mesh.vec2_uvs);
    if(mesh.vec3_normals.length > 0)
        mesh.normals = OBJ.vec3ArrayToFloatArray(mesh.vec3_normals);
    if(mesh.vec3_binormals.length > 0)
        mesh.binormals = OBJ.vec3ArrayToFloatArray(mesh.vec3_binormals);
    if(mesh.vec3_tangents.length > 0)
        mesh.tangents = OBJ.vec3ArrayToFloatArray(mesh.vec3_tangents);   
}
OBJ.Mesh = function (meshObject,objectData,flags){
    var file_verts = [], file_uvs = [], file_normals = [];
    var point_indices = [], uv_indices = [], normal_indices = [];
    meshObject.indices = [];
    
    var lines = objectData.split('\n');// array of lines separated by the newline
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        var elements = line.split((/\s+/));
        elements.shift();

        var xF = parseFloat(elements[0] || "0.0");
        var yF = parseFloat(elements[1] || "0.0");
        var zF = parseFloat(elements[2] || "0.0");

        if ((/^v\s/).test(line)) {
            file_verts.push(vec3.fill(xF,yF,zF));
        }else if ((/^vn\s/).test(line)) {
            file_normals.push(vec3.fill(xF,yF,zF));
        }else if ((/^vt\s/).test(line)) {
            file_uvs.push(vec2.fill(xF,1.0-yF));
        }else if ((/^f\s/).test(line)) {
            for (var j = 0; j < elements.length; j++){
                var face_vertex = elements[j].split( '/' );
                           
                if(face_vertex[0] !== undefined && (flags & OBJ.LOAD_POSITIONS)) point_indices.push(face_vertex[0]);
                if(face_vertex[1] !== undefined && (flags & OBJ.LOAD_UVS))       uv_indices.push(face_vertex[1]);
                if(face_vertex[2] !== undefined && (flags & OBJ.LOAD_NORMALS))   normal_indices.push(face_vertex[2]);
            }
        }
    }
    
    var newMesh = {};
    newMesh.vec3_vertices = []; newMesh.vec2_uvs = []; newMesh.vec3_normals = []; newMesh.vec3_binormals = []; newMesh.vec3_tangents = []; newMesh.vec3_barycentric = [];
    
    OBJ.loadDataIntoTriangles(newMesh,file_verts,file_uvs,file_normals,point_indices,uv_indices,normal_indices);
    
    if(flags & OBJ.LOAD_TBN)
        OBJ.calculateTBN(newMesh.vec3_vertices,newMesh.vec2_uvs,newMesh.vec3_normals,newMesh);
    //newMesh = OBJ.indexVBO(newMesh,0.001,flags);
    newMesh = OBJ.indexVBO(newMesh,0.0,flags);
    OBJ.finalize(newMesh,flags);
    
    if(newMesh.vertices !== undefined && (flags & OBJ.LOAD_POSITIONS))
        meshObject.vertices = newMesh.vertices;
    if(newMesh.barycentric !== undefined && (flags & OBJ.LOAD_POSITIONS))
        meshObject.barycentric = newMesh.barycentric;
    if(newMesh.uvs !== undefined && (flags & OBJ.LOAD_UVS))
        meshObject.uvs = newMesh.uvs;
    if(newMesh.normals !== undefined && (flags & OBJ.LOAD_NORMALS))
        meshObject.normals = newMesh.normals;
    if(newMesh.binormals !== undefined && (flags & OBJ.LOAD_TBN))
        meshObject.binormals = newMesh.binormals;
    if(newMesh.tangents !== undefined && (flags & OBJ.LOAD_TBN))
        meshObject.tangents = newMesh.tangents;
    if(flags & OBJ.LOAD_TRIANGLES)
        meshObject.triangles = newMesh.triangles;
    meshObject.radius  = newMesh.radius;
    meshObject.radiusX = newMesh.radiusX;
    meshObject.radiusY = newMesh.radiusY;
    meshObject.radiusZ = newMesh.radiusZ;
    meshObject.indices = newMesh.indices;
    
    //cleanup
    for (var member in newMesh) delete newMesh[member];
    return meshObject;
}
// this is just a helper class to ease ajax calls
var Ajax = function(){
    var _this = this;
    this.xml = new XMLHttpRequest();
    this.get = function(url, callback){
        _this.xml.onreadystatechange = function(){
            if(_this.xml.readyState === 4){ callback(_this.xml.responseText, _this.xml.status); }
        };
        _this.xml.open('GET', url, true); _this.xml.send();
    }
};
OBJ.downloadMeshes = function (nameAndURLs, completionCallback, meshObject,meshDictionaryName,flags){
    var semaphore = Object.keys(nameAndURLs).length;
    var error = false;
    for(var mesh_name in nameAndURLs){
        if(nameAndURLs.hasOwnProperty(mesh_name)){
            new Ajax().get(nameAndURLs[mesh_name], (function(name) {
                return function (data, status) {
                    if (status === 200) {
                        OBJ.Mesh(meshObject,data,flags);
                    }else {
                        error = true;
                        console.error('An error has occurred. mesh "' + name + '" could not be downloaded.');
                    }
                    semaphore--;
                    if (semaphore === 0) {
                        if (error) {
                            console.error('An error has occurred and one or meshes has not been ' + 'downloaded. The execution of the script has terminated.');
                            throw '';
                        }
                        completionCallback(meshObject,meshDictionaryName,flags);
                    }
                }
            })(mesh_name));
        }
    }   
};

var _buildBuffer = function( gl, type, data, itemSize ){
    var buffer = gl.createBuffer();
    var arrayView = type === gl.ARRAY_BUFFER ? Float32Array : Uint16Array;
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, new arrayView(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
    return buffer;
}  
OBJ.initMeshBuffers = function(gl,mesh,flags){
    if(mesh.vertices !== undefined && (flags & OBJ.LOAD_POSITIONS))
        mesh.vertexBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.vertices, 3);
    if(mesh.barycentric !== undefined && (flags & OBJ.LOAD_POSITIONS))
        mesh.barycentricBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.barycentric, 3);
    if(mesh.uvs !== undefined && (flags & OBJ.LOAD_UVS))
        mesh.uvBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.uvs, 2);
    if(mesh.normals !== undefined && (flags & OBJ.LOAD_NORMALS))
        mesh.normalBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.normals, 3);
    if(mesh.binormals !== undefined && (flags & OBJ.LOAD_TBN))
        mesh.binormalBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.binormals, 3);
    if(mesh.tangents !== undefined && (flags & OBJ.LOAD_TBN))
        mesh.tangentBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.tangents, 3);
    mesh.indexBuffer = _buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.indices, 1);
    return mesh;
}
OBJ.deleteMeshBuffers = function( gl, mesh ){
    if(mesh.vertexBuffer !== undefined)        gl.deleteBuffer(mesh.vertexBuffer);
    if(mesh.barycentricBuffer !== undefined)   gl.deleteBuffer(mesh.barycentricBuffer);
    if(mesh.uvBuffer !== undefined)            gl.deleteBuffer(mesh.uvBuffer);
    if(mesh.normalBuffer !== undefined)        gl.deleteBuffer(mesh.normalBuffer);
    if(mesh.binormalBuffer !== undefined)      gl.deleteBuffer(mesh.binormalBuffer);
    if(mesh.tangentBuffer !== undefined)       gl.deleteBuffer(mesh.tangentBuffer);
    gl.deleteBuffer(mesh.indexBuffer);
}