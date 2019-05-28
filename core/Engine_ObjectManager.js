'use strict';
var Engine = Engine || {};
(function (scope, undefined){
    Engine.GameObjectManager = {};
    
    Engine.GameObjectManager.addObjectToDictionary = function(objName,obj,scene,dictionaryName){
        if(objName in scene[dictionaryName]){
            console.log("Error: " + objName + "already in dictionary");
            return;
        }
        if(obj.id in scene[dictionaryName + "ID"]){
            console.log("Error: " + obj.id + "already in dictionaryID");
            return;
        }
        scene[dictionaryName][objName] = obj; 
        scene[dictionaryName + "ID"][obj.id] = obj;
    }
    //GameObject
    {
        Engine.GameObjectManager.translate = function(obj,x,y,z,local){
            x *= Engine.dt; y *= Engine.dt; z *= Engine.dt;
            if(local !== undefined && local == false){
                Engine.GameObjectManager.setPosition(obj,obj._position[0] + x,obj._position[1] + y,obj._position[2] + z);
                return;
            }
            var offsetX = 0; var offsetY = 0; var offsetZ = 0;
            var forwardVector = Engine.GameObjectManager.forward(obj);
            var rightVector = Engine.GameObjectManager.right(obj);
            var upVector = Engine.GameObjectManager.up(obj);
            
            if(z != 0.0){
                offsetX += forwardVector[0] * z; 
                offsetY += forwardVector[1] * z; 
                offsetZ += forwardVector[2] * z;
            }
            if(x != 0.0){
                offsetX += rightVector[0] * x; 
                offsetY += rightVector[1] * x; 
                offsetZ += rightVector[2] * x;
            }
            if(y != 0.0){
                offsetX += upVector[0] * y; 
                offsetY += upVector[1] * y; 
                offsetZ += upVector[2] * y;
            }
            Engine.GameObjectManager.setPosition(obj,obj._position[0] + offsetX,obj._position[1] + offsetY,obj._position[2] + offsetZ);
        }
        Engine.GameObjectManager.scale = function(obj,x,y,z){
            Engine.GameObjectManager.setScale(obj,obj.scale[0] + x,obj.scale[1] + y,obj.scale[2] + z);
        }
        Engine.GameObjectManager.setScale = function(obj,x,y,z){
            obj.scale[0] = x;
            obj.scale[1] = y;
            obj.scale[2] = z;
            if( !(obj.mesh) in Engine.ResourceManager.meshes){
                obj.radius = 0;
            }
            else{
                obj.radius = Engine.ResourceManager.meshes[obj.mesh].radius * vec3.maxElement(obj.scale);
            }
        }
        Engine.GameObjectManager.setPosition = function(obj,x,y,z){
            obj._position[0] = x;
            obj._position[1] = y;
            obj._position[2] = z;
        }
        Engine.GameObjectManager.update = function(obj){
            mat4.identity(obj.modelMatrix);
            mat4.translate(obj.modelMatrix,obj.modelMatrix,obj._position);
            var mat4_Rotation = mat4.create();
            mat4.fromQuat(mat4_Rotation,obj.rotation);
            mat4.mul(obj.modelMatrix,obj.modelMatrix,mat4_Rotation);
            if(obj.scale)
                mat4.scale(obj.modelMatrix,obj.modelMatrix,obj.scale);
        }
        Engine.GameObjectManager.rotate = function(obj,x,y,z,useDT){
            if(x !== undefined && x != 0){ if(useDT !== undefined && useDT == true) x *= Engine.dt; quat.rotateX(obj.rotation,obj.rotation,x); }
            if(y !== undefined && y != 0){ if(useDT !== undefined && useDT == true) y *= Engine.dt; quat.rotateY(obj.rotation,obj.rotation,y); }
            if(z !== undefined && z != 0){ if(useDT !== undefined && useDT == true) z *= Engine.dt; quat.rotateZ(obj.rotation,obj.rotation,z); }
        }
        Engine.GameObjectManager.up = function(obj){ return quat.up(obj.rotation); }
        Engine.GameObjectManager.right = function(obj){ return quat.right(obj.rotation); }
        Engine.GameObjectManager.forward = function(obj){ return quat.forward(obj.rotation); }
        Engine.GameObjectManager.position = function(obj){ return vec3.fill(obj.modelMatrix[12],obj.modelMatrix[13],obj.modelMatrix[14]); }
    }
    
    //Dynamic GameObject
    {
        Engine.GameObjectManager.translateDynamic = function(obj,x,y,z,local){
            obj.rigidBody.activate();
            var transform = obj.rigidBody.getWorldTransform(transform);
            var origin = transform.getOrigin();
            var p = vec3.fill(origin.x(),origin.y(),origin.z());
            
            if(local !== undefined && local == false){
                p[0] += x; p[1] += y; p[2] += z;
                Engine.GameObjectManager.setPositionDynamic(obj.position()[0] + p[0],obj.position()[1] + p[1],obj.position()[2] + p[2]);
                Ammo.destroy(origin);
                Ammo.destroy(transform);
                return;
            }   
            var forwardVector = Engine.GameObjectManager.forwardDynamic(obj);
            var rightVector = Engine.GameObjectManager.rightDynamic(obj);
            var upVector = Engine.GameObjectManager.upDynamic(obj);
            
            p[0] += forwardVector[0] * z;
            p[1] += forwardVector[1] * z;
            p[2] += forwardVector[2] * z;
            
            p[0] += rightVector[0] * x;
            p[1] += rightVector[1] * x;
            p[2] += rightVector[2] * x;
            
            p[0] += upVector[0] * y;
            p[1] += upVector[1] * y;
            p[2] += upVector[2] * y;
            Engine.GameObjectManager.setPositionDynamic(obj.position()[0] + p[0],obj.position()[1] + p[1],obj.position()[2] + p[2]);
            Ammo.destroy(origin);
            Ammo.destroy(transform);
        }
        Engine.GameObjectManager.scaleDynamic = function(obj,x,y,z){
            return;
            /*
            var localScale = obj.rigidBody.getCollisionShape().getLocalScaling();
            var scl = vec3.fill(localScale.x(),localScale.y(),localScale.z());
            Engine.GameObjectManager.setScaleDynamic(obj,scl[0] + x,scl[1] + y,scl[2] + z);
            */
        }
        Engine.GameObjectManager.setScaleDynamic = function(obj,x,y,z){
            return;
            /*
            obj.rigidBody.getCollisionShape().setLocalScaling(new Ammo.btVector3(x,y,z));
            if( !(obj.mesh) in Engine.ResourceManager.meshes){
                obj.radius = 0;
            }
            else{
                var colObj = obj.rigidBody.getCollisionShape();
                var localScale = colObj.getLocalScaling();
                var scl = vec3.fill(localScale.x(),localScale.y(),localScale.z());      
                obj.radius = Engine.ResourceManager.meshes[obj.mesh].radius * vec3.maxElement(scl);
            }
            */
        }
        Engine.GameObjectManager.setPositionDynamic = function(obj,x,y,z){
            var transform = new Ammo.btTransform();
            var origin = new Ammo.btVector3(x,y,z);
            transform.setOrigin(origin);
            transform.setRotation(obj.rigidBody.getCenterOfMassTransform().getRotation());
            
            obj.rigidBody.getMotionState().setWorldTransform(transform);
            obj.rigidBody.setWorldTransform(transform);
            obj.rigidBody.setCenterOfMassTransform(transform);
            
            Ammo.destroy(origin);
            Ammo.destroy(transform);
        }
        Engine.GameObjectManager.updateDynamic = function(obj){
            mat4.identity(obj.modelMatrix);

            var transform = new Ammo.btTransform();
            obj.rigidBody.getMotionState().getWorldTransform(transform);
            var origin = transform.getOrigin();
            var rotation = transform.getRotation();

            mat4.translate(obj.modelMatrix,obj.modelMatrix,vec3.fill(origin.x(),origin.y(),origin.z()));
            var mat4FromQuat = mat4.create();
            mat4.fromQuat(mat4FromQuat,quat.fill(rotation.x(),rotation.y(),rotation.z(),rotation.w()));
            mat4.mul(obj.modelMatrix,obj.modelMatrix,mat4FromQuat);
            
            Ammo.destroy(transform);
            
            //var localScale = obj.rigidBody.getCollisionShape().getLocalScaling();
            //mat4.scale(obj.modelMatrix,obj.modelMatrix,vec3.fill(localScale.x,localScale.y,localScale.z));
        }
        Engine.GameObjectManager.rotateDynamic = function(obj,x,y,z){
            if(x !== undefined && x != 0.0){
                x *= Engine.dt; Engine.GameObjectManager.applyTorqueY(obj,-x);
            }
            if(y !== undefined && y != 0.0){
                y *= Engine.dt; Engine.GameObjectManager.applyTorqueX(obj,-y);
            }
            if(z !== undefined && z != 0.0){
                z *= Engine.dt; Engine.GameObjectManager.applyTorqueZ(obj,z);
            }
        }
        Engine.GameObjectManager.applyForce = function(obj,x,y,z,rX,rY,rZ,local){
            if(rX === undefined && rY === undefined && rZ === undefined && local === undefined){
                //x = vec3 force. y = vec3 relForce. z = local
                if(typeof(y) === "boolean"){ //y is bool representing local.
                    obj.applyCentralForce(x[0],x[1],x[2],y); return;
                }
                else{
                    obj.applyForce(x[0],x[1],x[2],y[0],y[1],y[2],z); return;
                }
            }
            obj.rigidBody.activate();
            if(local !== undefined && local == false){
                var tvec3 = new Ammo.btVector3(x,y,z);
                var lvec3 = new Ammo.btVector3(rX,rY,rZ);
                obj.rigidBody.applyForce(tvec3,lvec3);
                Ammo.destroy(tvec3);
                Ammo.destroy(lvec3);
                return;
            }
            var forwardVector = obj.forward();
            var rightVector = obj.right();
            var upVector = obj.up();
            
            var res = vec3.fill(rightVector[0] * x,rightVector[1]*x,rightVector[2]*x);
            
            res[0] += upVector[0] * y;
            res[1] += upVector[1] * y;
            res[2] += upVector[2] * y;
            
            res[0] += forwardVector[0] * z;
            res[1] += forwardVector[1] * z;
            res[2] += forwardVector[2] * z;

            var tvec3 = new Ammo.btVector3(res[0],res[1],res[2]);
            var lvec3 = new Ammo.btVector3(rX,rY,rZ);
            obj.rigidBody.applyForce(tvec3,lvec3); 
            Ammo.destroy(tvec3);
            Ammo.destroy(lvec3);
        }
        Engine.GameObjectManager.applyCentralForce = function(obj,x,y,z,local){
            if(z === undefined && local === undefined){
                //x = vec3 force. y = local
                GameObjectDynamic.prototype.applyCentralForce(x[0],x[1],x[2],y); return;
            }
            obj.rigidBody.activate();
            if(local !== undefined && local == false){
                var tvec3 = new Ammo.btVector3(x,y,z);
                obj.rigidBody.applyCentralForce(tvec3);
                Ammo.destroy(tvec3);
                return;
            }
            var forwardVector = obj.forward();
            var rightVector = obj.right();
            var upVector = obj.up();
            
            var res = vec3.fill(rightVector[0] * x,rightVector[1]*x,rightVector[2]*x);
            
            res[0] += upVector[0] * y;
            res[1] += upVector[1] * y;
            res[2] += upVector[2] * y;
            
            res[0] += forwardVector[0] * z;
            res[1] += forwardVector[1] * z;
            res[2] += forwardVector[2] * z;

            var tvec3 = new Ammo.btVector3(res[0],res[1],res[2]);
            obj.rigidBody.applyCentralForce(tvec3); 
            Ammo.destroy(tvec3);
        }
        Engine.GameObjectManager.setLinearVelocity = function(obj,x,y,z,local){
            this.rigidBody.activate();
            if(local !== undefined && local == false){
                var tvec3 = new Ammo.btVector3(x,y,z);
                this.rigidBody.setLinearVelocity(tvec3);
                Ammo.destroy(tvec3);
                return;
            }
            var forwardVector = this.forward();
            var rightVector = this.right();
            var upVector = this.up();
            
            var res = vec3.fill(rightVector[0] * x,rightVector[1]*x,rightVector[2]*x);
            
            res[0] += upVector[0] * y;
            res[1] += upVector[1] * y;
            res[2] += upVector[2] * y;
            
            res[0] += forwardVector[0] * z;
            res[1] += forwardVector[1] * z;
            res[2] += forwardVector[2] * z;
            
            var tvec3 = new Ammo.btVector3(res[0],res[1],res[2]);
            this.rigidBody.setLinearVelocity(tvec3); 
            Ammo.destroy(tvec3);
        }
        Engine.GameObjectManager.setAngularVelocity = function(obj,x,y,z,local){
            obj.rigidBody.activate();
            if(local !== undefined && local == false){
                var tvec3 = new Ammo.btVector3(x,y,z);
                obj.rigidBody.setAngularVelocity(tvec3);
                Ammo.destroy(tvec3);
                return;
            }
            var forwardVector = obj.forward();
            var rightVector = obj.right();
            var upVector = obj.up();
            
            var res = vec3.fill(rightVector[0] * x,rightVector[1]*x,rightVector[2]*x);
            
            res[0] += upVector[0] * y;
            res[1] += upVector[1] * y;
            res[2] += upVector[2] * y;
            
            res[0] += forwardVector[0] * z;
            res[1] += forwardVector[1] * z;
            res[2] += forwardVector[2] * z;
            
            var tvec3 = new Ammo.btVector3(res[0],res[1],res[2]);
            obj.rigidBody.setAngularVelocity(tvec3); 
            Ammo.destroy(tvec3);
        }
        Engine.GameObjectManager.applyTorque = function(obj,x,y,z,local){
            obj.rigidBody.activate();
            if(local !== undefined && local == false){
                var tvec3 = new Ammo.btVector3(x,y,z);
                obj.rigidBody.applyTorque(tvec3);
                Ammo.destroy(tvec3);
                return;
            }

            var forwardVector = obj.forward();
            var rightVector = obj.right();
            var upVector = obj.up();
            
            var res = vec3.fill(rightVector[0] * x,rightVector[1]*x,rightVector[2]*x);
            
            res[0] += upVector[0] * y;
            res[1] += upVector[1] * y;
            res[2] += upVector[2] * y;
            
            res[0] += forwardVector[0] * z;
            res[1] += forwardVector[1] * z;
            res[2] += forwardVector[2] * z;
            var tvec3 = new Ammo.btVector3(res[0],res[1],res[2]);
            obj.rigidBody.applyTorque(tvec3);
            Ammo.destroy(tvec3);
        }
        Engine.GameObjectManager.applyTorqueX = function(obj,x){ Engine.GameObjectManager.applyTorque(obj,x,0,0); }
        Engine.GameObjectManager.applyTorqueY = function(obj,y){ Engine.GameObjectManager.applyTorque(obj,0,y,0); }
        Engine.GameObjectManager.applyTorqueZ = function(obj,z){ Engine.GameObjectManager.applyTorque(obj,0,0,z); }
        
        Engine.GameObjectManager.setMass = function(obj,mass){
            obj.rigidBody.getCollisionShape().setMass(mass);
            obj.rigidBody.setMassProps(mass,obj.rigidBody.getCollisionShape().getInertia());
        }
        Engine.GameObjectManager.getColumnVector = function(rigidBody,column){
            var transform = new Ammo.btTransform();
            rigidBody.getMotionState().getWorldTransform(transform);
            var ve = transform.getBasis().getColumn(column);
            var v = vec3.fill(ve.x(),ve.y(),ve.z());
            Ammo.destroy(ve);
            Ammo.destroy(transform);
            return v;
        }
        Engine.GameObjectManager.upDynamic = function(obj){ return Engine.GameObjectManager.getColumnVector(obj.rigidBody,1); }
        Engine.GameObjectManager.rightDynamic = function(obj){ return Engine.GameObjectManager.getColumnVector(obj.rigidBody,0); }
        Engine.GameObjectManager.forwardDynamic = function(obj){ return Engine.GameObjectManager.getColumnVector(obj.rigidBody,2); }
        Engine.GameObjectManager.positionDynamic = function(obj){ 
            var transform = new Ammo.btTransform();
            obj.rigidBody.getMotionState().getWorldTransform(transform);
            var origin = transform.getOrigin();
            var v = vec3.fill(origin.x(),origin.y(),origin.z());
            Ammo.destroy(origin);
            Ammo.destroy(transform);
            return v;
        }
        Engine.GameObjectManager.clearLinearForces = function(obj){
            obj.rigidBody.setActivationState(0);
            obj.setLinearVelocity(0,0,0);
        }
        Engine.GameObjectManager.clearAngularForces = function(obj){
            obj.rigidBody.setActivationState(0);
            obj.setAngularVelocity(0,0,0);
        }
        Engine.GameObjectManager.clearAllForces = function(obj){
            obj.rigidBody.setActivationState(0);
            obj.setLinearVelocity(0,0,0);
            obj.setAngularVelocity(0,0,0);
        }
    }
})(this);