'use strict';
var Engine = Engine || {};
(function (scope, undefined){
    Engine.PhysicsManager = {};

    Engine.PhysicsManager.COLLISION_FLAG_BOX = 1; // 0001
    Engine.PhysicsManager.COLLISION_FLAG_CONVEX = 2; // 0010
    Engine.PhysicsManager.COLLISION_FLAG_STATIC_TRIANGLES = 4; // 0100
    Engine.PhysicsManager.COLLISION_FLAG_DYNAMIC_TRIANGLES = 8; // 1000
    
    Engine.PhysicsManager.init = function(){
        Engine.PhysicsManager.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        Engine.PhysicsManager.dispatcher = new Ammo.btCollisionDispatcher(Engine.PhysicsManager.collisionConfiguration);
        Engine.PhysicsManager.overlappingPairCache = new Ammo.btDbvtBroadphase();
        Engine.PhysicsManager.solver = new Ammo.btSequentialImpulseConstraintSolver();
        Engine.PhysicsManager.world = new Ammo.btDiscreteDynamicsWorld(
            Engine.PhysicsManager.dispatcher,
            Engine.PhysicsManager.overlappingPairCache,
            Engine.PhysicsManager.solver,
            Engine.PhysicsManager.collisionConfiguration);
        Engine.PhysicsManager.world.setGravity(new Ammo.btVector3(0,0,0));
    }
    Engine.PhysicsManager.cleanup = function(){
    }
    Engine.PhysicsManager.setGravity = function(x,y,z){
        Engine.PhysicsManager.world.setGravity(new Ammo.btVector3(x,y,z));
    }
    Engine.PhysicsManager.update = function(dt){
        Engine.PhysicsManager.world.stepSimulation(dt, 1, 1.0/60.0);
        
        var numManifolds = Engine.PhysicsManager.world.getDispatcher().getNumManifolds();
        for (var i = 0; i < numManifolds; i++){
            var contactManifold =  Engine.PhysicsManager.world.getDispatcher().getManifoldByIndexInternal(i);
            var obA = contactManifold.getBody0();
            var obB = contactManifold.getBody1();
            var numContacts = contactManifold.getNumContacts();
            for (var j = 0; j < numContacts; j++){
                var pt = contactManifold.getContactPoint(j);
                if (pt.getDistance() < 0.0){
                    var ptA = pt.getPositionWorldOnA();
                    var ptB = pt.getPositionWorldOnB();
                    var normalOnB = pt.get_m_normalWorldOnB;

                    var a = obA.getUserIndex();
                    var b = obB.getUserIndex();
                    
                    Engine.scene.objectsID[a].collisionResponse(Engine.scene.objectsID[b]);
                    Engine.scene.objectsID[b].collisionResponse(Engine.scene.objectsID[a]);
                }
            }
        }
    }
    
    Engine.PhysicsManager.constructCollisionShape = function(flag,mesh){
        var shape;
        if(flag === undefined || (flag & Engine.PhysicsManager.COLLISION_FLAG_CONVEX)){
            shape = new Ammo.btConvexHullShape();
            var check = {};
            for(var i = 0; i < mesh.triangles.length; i++){
                for(var key in mesh.triangles[i]){
                    var value = mesh.triangles[i][key].position;
                    var vec = new Ammo.btVector3(value[0],value[1],value[2]);
                    var strRep = value[0].toFixed(2) + " , " + value[1].toFixed(2) + " , " + value[2].toFixed(2);
                    if(!check.hasOwnProperty(strRep)){
                        check[strRep] = false;
                        shape.addPoint(vec,true);
                    }
                }
            }
        }
        else if(flag && Engine.PhysicsManager.COLLISION_FLAG_BOX){
            shape = new Ammo.btBoxShape(new Ammo.btVector3(mesh.radiusX,mesh.radiusY,mesh.radiusZ));
        }
        else if(flag && Engine.PhysicsManager.COLLISION_FLAG_STATIC_TRIANGLES){
        }
        else if(flag && Engine.PhysicsManager.COLLISION_FLAG_DYNAMIC_TRIANGLES){
        }
        else{
            console.log("Error: could not set up object collision shape, returning without one.");
            return undefined;
        }
        //shape.setMargin(0.01);
        return shape;
    }
    
})(this);