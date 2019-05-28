'use strict'; 
var Engine = Engine || {};
(function (scope, undefined){
    Engine.Game.Database = {};
    Engine.Game.DatabasePaths = {};
    Engine.Game.DatabaseFunctions = {};
    // compute altitude and azimuth
    Engine.Game.DatabaseFunctions.GetAltitudeAzimuth = function(starName){
        var ret = Engine.Game.DatabaseFunctions.celestialToHorizon(
            Engine.Game.Date.date, //now
            Engine.Game.Database[starName].RA,
            Engine.Game.Database[starName].Dec,
            Engine.EventManager.geolocation.lat,
            Engine.EventManager.geolocation.long
        );
        Engine.Game.Database[starName].Azimuth = ret[0];
        Engine.Game.Database[starName].Altitude = ret[1];
    }
    // ra, dec, lat, lon in  degrees
    // results returned in hrz_altitude, hrz_azimuth
    Engine.Game.DatabaseFunctions.celestialToHorizon = function(utcDate,ra,dec,lat,long){
        // compute hour angle in degrees
        var ha = Engine.Game.DatabaseFunctions.getMST(utcDate,long) - ra;
        if (ha < 0) ha = ha + 360;
        // convert degrees to radians
        ha  *= 0.0174533;
        dec *= 0.0174533;
        lat *= 0.0174533;
        // compute altitude in radians
        var sin_alt = Math.sin(dec)*Math.sin(lat) + Math.cos(dec)*Math.cos(lat)*Math.cos(ha);
        var alt = Math.asin(sin_alt);
        // compute azimuth in radians. divide by zero error at poles or if alt = 90 deg
        var cos_az = (Math.sin(dec) - Math.sin(alt)*Math.sin(lat))/(Math.cos(alt)*Math.cos(lat));
        var az  = Math.acos(cos_az);
        // convert radians to degrees
        var hrz_altitude = alt * 57.2958;
        var hrz_azimuth  = az * 57.2958;
        // choose hemisphere
        if (Math.sin(ha) > 0) 
            hrz_azimuth = 360 - hrz_azimuth;
        var ret = [hrz_azimuth,hrz_altitude];
        return ret;
    }
    // Compute the Mean Sidereal Time in units of degrees. 
    // Use lon := 0 to get the Greenwich MST. 
    // East longitudes are positive; West longitudes are negative
    // returns: time in degrees
    // NOTE: UTC == GMT Time (Greenwich Mean Time)
    Engine.Game.DatabaseFunctions.getMST = function(nowDate, long){
        var year   = nowDate.getUTCFullYear();
        var month  = nowDate.getUTCMonth() + 1;
        var day    = nowDate.getUTCDate();
        var hour   = nowDate.getUTCHours();
        var minute = nowDate.getUTCMinutes();
        var second = nowDate.getUTCSeconds();
        if (month == 1 || month == 2){
            year  = year - 1;
            month = month + 12;
        }
        var a = Math.floor(year/100);
        var b = 2 - a + Math.floor(a/4);
        var c = Math.floor(365.25*year);
        var d = Math.floor(30.6001*(month + 1));
        // days since J2000.0
        var jd = b + c + d - 730550.5 + day + (hour + minute/60.0 + second/3600.0)/24.0;
        // julian centuries since J2000.0
        var jc = jd/36525.0;
        // the mean sidereal time in degrees
        var mst = 280.46061837 + 360.98564736629*jd + 0.000387933*jc*jc - jc*jc*jc/38710000 + long;
        // in degrees modulo 360.0
        if (mst > 0.0)  
            while (mst > 360.0) mst = mst - 360.0;
        else            
            while (mst < 0.0)   mst = mst + 360.0;      
        return mst;
    }
    Engine.Game.DatabaseFunctions.addReal = function(name,ra,dec,dist,mag,color){
        if(Engine.Game.Database.hasOwnProperty(name)){
            console.log("Name: " + name + " is already in the database.");
            return;
        }
        Engine.Game.Database[name] = {
            Azimuth: 0,
            Altitude: 0,
            RA: 15*ra,
            Dec: dec,
            Dist: dist * 0.5,
            Mag: mag,
            GameScale: (((1.0 / ((mag + 1.5)+1.0)) * dist * 0.5) * 0.026),
            Color: color
        };
    }
    Engine.Game.DatabaseFunctions.addPath = function(name,data,lineWidth){
        Engine.Game.DatabasePaths[name] = {};
        Engine.Game.DatabasePaths[name].lineWidth = lineWidth || 1.0;
        Engine.Game.DatabasePaths[name].array = data;
        Engine.Game.DatabasePaths[name].dataBuffer = gl.createBuffer();
        
        Engine.Game.DatabasePaths[name].arrayData = new Float32Array(data.length*3);
        for(var i = 0; i < data.length*3; i++){
            Engine.Game.DatabasePaths[name].arrayData[i] = 0.0;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, Engine.Game.DatabasePaths[name].dataBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, Engine.Game.DatabasePaths[name].arrayData, gl.DYNAMIC_DRAW);   
    }
    Engine.Game.DatabaseFunctions.init = function(){
        var _addReal = Engine.Game.DatabaseFunctions.addReal;
        
        var httpReq = (window.XMLHttpRequest)?new XMLHttpRequest():new ActiveXObject("Microsoft.XMLHTTP");
        httpReq.onload = function() {
            var result = JSON.parse(httpReq.responseText);
            /*
            ["id,hip,hd,hr,gl,bf,proper,ra,dec,dist,pmra,pmdec,rv,mag,absmag,spect,ci,x,y,z,vx,vy,vz,
            rarad,decrad,pmrarad,pmdecrad,bayer,flam,con,comp,
            comp_primary,base,lum,var,var_min,var_max]
            */
            for(var i = 0; i < result.d.length; i++){
                var name = ""; 
                var res = result.d[i];
                var string_representation = res[0];
                var arr = string_representation.split(',');
                var bayer = arr[27];
                var con = arr[29];
                var add = true;
                     
                if(bayer != "" && bayer !== undefined){
                    //bayer greek lettering
                    if(     bayer.indexOf("Alp") !== -1){ bayer = bayer.replace("Alp","Alpha"); }
                    else if(bayer.indexOf("Bet") !== -1){ bayer = bayer.replace("Bet","Beta"); }
                    else if(bayer.indexOf("Gam") !== -1){ bayer = bayer.replace("Gam","Gamma"); }
                    else if(bayer.indexOf("Del") !== -1){ bayer = bayer.replace("Del","Delta"); }
                    else if(bayer.indexOf("Eps") !== -1){ bayer = bayer.replace("Eps","Epsilon"); }
                    else if(bayer.indexOf("Zet") !== -1){ bayer = bayer.replace("Zet","Zeta"); }
                    else if(bayer.indexOf("The") !== -1){ bayer = bayer.replace("The","Theta"); }
                    else if(bayer.indexOf("Kap") !== -1){ bayer = bayer.replace("Kap","Kappa"); }
                    else if(bayer.indexOf("Lam") !== -1){ bayer = bayer.replace("Lam","Lambda"); }
                    else if(bayer.indexOf("Omi") !== -1){ bayer = bayer.replace("Omi","Omicron"); }
                    else if(bayer.indexOf("Iot") !== -1){ bayer = bayer.replace("Iot","Iota"); }    
                    else if(bayer.indexOf("Sig") !== -1){ bayer = bayer.replace("Sig","Sigma"); }           
                    else if(bayer.indexOf("Ups") !== -1){ bayer = bayer.replace("Ups","Upsilon"); } 
                    else if(bayer.indexOf("Ome") !== -1){ bayer = bayer.replace("Ome","Omega"); } 
                }
                if(con != "" && con !== undefined){
                    //constellations
                    if(     con.indexOf("And") !== -1){ con = con.replace("And","Andromedae"); }
                    else if(con.indexOf("Ant") !== -1){ con = con.replace("Ant","Antliae"); }
                    else if(con.indexOf("Aps") !== -1){ con = con.replace("Aps","Apodis"); }
                    else if(con.indexOf("Aqr") !== -1){ con = con.replace("Aqr","Aquarii"); }
                    else if(con.indexOf("Aql") !== -1){ con = con.replace("Aql","Aquilae"); }
                    else if(con.indexOf("Ara") !== -1){ con = con.replace("Ara","Arae"); }
                    else if(con.indexOf("Ari") !== -1){ con = con.replace("Ari","Arietis"); }
                    else if(con.indexOf("Aur") !== -1){ con = con.replace("Aur","Aurigae"); }
                    else if(con.indexOf("Boo") !== -1){ con = con.replace("Boo","Boötis"); }
                    else if(con.indexOf("Cae") !== -1){ con = con.replace("Cae","Caeli"); }
                    else if(con.indexOf("Cam") !== -1){ con = con.replace("Cam","Camelopardus"); }
                    else if(con.indexOf("Cnc") !== -1){ con = con.replace("Cnc","Cancri"); }
                    else if(con.indexOf("CVn") !== -1){ con = con.replace("CVn","Canum Venaticorum"); }
                    else if(con.indexOf("CMa") !== -1){ con = con.replace("CMa","Canis Majoris"); }
                    else if(con.indexOf("CMi") !== -1){ con = con.replace("CMi","Canis Minoris"); }
                    else if(con.indexOf("Cap") !== -1){ con = con.replace("Cap","Capricorni"); }
                    else if(con.indexOf("Car") !== -1){ con = con.replace("Car","Carinae"); }
                    else if(con.indexOf("Cas") !== -1){ con = con.replace("Cas","Cassiopeiae"); }
                    else if(con.indexOf("Cen") !== -1){ con = con.replace("Cen","Centauri"); }
                    else if(con.indexOf("Cep") !== -1){ con = con.replace("Cep","Cephei"); }
                    else if(con.indexOf("Cet") !== -1){ con = con.replace("Cet","Ceti"); }
                    else if(con.indexOf("Cha") !== -1){ con = con.replace("Cha","Chamaeleontis"); }
                    else if(con.indexOf("Cir") !== -1){ con = con.replace("Cir","Circini"); }
                    else if(con.indexOf("Col") !== -1){ con = con.replace("Col","Columbae"); }
                    else if(con.indexOf("Com") !== -1){ con = con.replace("Com","Comae Berenices"); }
                    else if(con.indexOf("CrA") !== -1){ con = con.replace("CrA","Coronae Australis"); }
                    else if(con.indexOf("CrB") !== -1){ con = con.replace("CrB","Coronae Borealis"); }
                    else if(con.indexOf("Crv") !== -1){ con = con.replace("Crv","Corvi"); }
                    else if(con.indexOf("Crt") !== -1){ con = con.replace("Crt","Crateris"); }
                    else if(con.indexOf("Cru") !== -1){ con = con.replace("Cru","Crucis"); }
                    else if(con.indexOf("Cyg") !== -1){ con = con.replace("Cyg","Cygni"); }
                    else if(con.indexOf("Del") !== -1){ con = con.replace("Del","Delphini"); }
                    else if(con.indexOf("Dor") !== -1){ con = con.replace("Dor","Doradus"); }
                    else if(con.indexOf("Dra") !== -1){ con = con.replace("Dra","Draconis"); }
                    else if(con.indexOf("Equ") !== -1){ con = con.replace("Equ","Equulei"); }
                    else if(con.indexOf("Eri") !== -1){ con = con.replace("Eri","Eridani"); }
                    else if(con.indexOf("For") !== -1){ con = con.replace("For","Fornacis"); }
                    else if(con.indexOf("Gem") !== -1){ con = con.replace("Gem","Geminorum"); }
                    else if(con.indexOf("Gru") !== -1){ con = con.replace("Gru","Gruis"); }
                    else if(con.indexOf("Her") !== -1){ con = con.replace("Her","Herculis"); }
                    else if(con.indexOf("Hor") !== -1){ con = con.replace("Hor","Horologii"); }
                    else if(con.indexOf("Hya") !== -1){ con = con.replace("Hya","Hydrae"); }
                    else if(con.indexOf("Hyi") !== -1){ con = con.replace("Hyi","Hydri"); }
                    else if(con.indexOf("Ind") !== -1){ con = con.replace("Ind","Indi"); }
                    else if(con.indexOf("Lac") !== -1){ con = con.replace("Lac","Lacertae"); }
                    else if(con.indexOf("Leo") !== -1){ con = con.replace("Leo","Leonis"); }
                    else if(con.indexOf("LMi") !== -1){ con = con.replace("LMi","Leonis Minoris"); }
                    else if(con.indexOf("Lep") !== -1){ con = con.replace("Lep","Leporis"); }
                    else if(con.indexOf("Lib") !== -1){ con = con.replace("Lib","Librae"); }
                    else if(con.indexOf("Lup") !== -1){ con = con.replace("Lup","Lupi"); }
                    else if(con.indexOf("Lyn") !== -1){ con = con.replace("Lyn","Lyncis"); }
                    else if(con.indexOf("Lyr") !== -1){ con = con.replace("Lyr","Lyrae"); }
                    else if(con.indexOf("Men") !== -1){ con = con.replace("Men","Mensae"); }
                    else if(con.indexOf("Mic") !== -1){ con = con.replace("Mic","Microscopii"); }
                    else if(con.indexOf("Mon") !== -1){ con = con.replace("Mon","Monocerotis"); }
                    else if(con.indexOf("Mus") !== -1){ con = con.replace("Mus","Muscae"); }
                    else if(con.indexOf("Nor") !== -1){ con = con.replace("Nor","Normae"); }
                    else if(con.indexOf("Oct") !== -1){ con = con.replace("Oct","Octantis"); }
                    else if(con.indexOf("Oph") !== -1){ con = con.replace("Oph","Ophiuchi"); }
                    else if(con.indexOf("Ori") !== -1){ con = con.replace("Ori","Orionis"); }
                    else if(con.indexOf("Pav") !== -1){ con = con.replace("Pav","Pavonis"); }
                    else if(con.indexOf("Peg") !== -1){ con = con.replace("Peg","Pegasi"); }
                    else if(con.indexOf("Per") !== -1){ con = con.replace("Per","Persei"); }
                    else if(con.indexOf("Phe") !== -1){ con = con.replace("Phe","Phoenicis"); }
                    else if(con.indexOf("Pic") !== -1){ con = con.replace("Pic","Pictoris"); }
                    else if(con.indexOf("Psc") !== -1){ con = con.replace("Psc","Piscium"); }
                    else if(con.indexOf("PsA") !== -1){ con = con.replace("PsA","Piscis Austrini"); }
                    else if(con.indexOf("Pup") !== -1){ con = con.replace("Pup","Puppis"); }
                    else if(con.indexOf("Pyx") !== -1){ con = con.replace("Pyx","Pyxidis"); }
                    else if(con.indexOf("Ret") !== -1){ con = con.replace("Ret","Reticuli"); }
                    else if(con.indexOf("Sge") !== -1){ con = con.replace("Sge","Sagittae"); }
                    else if(con.indexOf("Sgr") !== -1){ con = con.replace("Sgr","Sagittarii"); }
                    else if(con.indexOf("Sco") !== -1){ con = con.replace("Sco","Scorpii"); }
                    else if(con.indexOf("Scl") !== -1){ con = con.replace("Scl","Sculptoris"); }
                    else if(con.indexOf("Sct") !== -1){ con = con.replace("Sct","Scuti"); }
                    else if(con.indexOf("Ser") !== -1){ con = con.replace("Ser","Serpentis"); }
                    else if(con.indexOf("Sex") !== -1){ con = con.replace("Sex","Sextantis"); }
                    else if(con.indexOf("Tau") !== -1){ con = con.replace("Tau","Tauri"); }
                    else if(con.indexOf("Tel") !== -1){ con = con.replace("Tel","Telescopii"); }
                    else if(con.indexOf("Tri") !== -1){ con = con.replace("Tri","Trianguli"); }
                    else if(con.indexOf("TrA") !== -1){ con = con.replace("TrA","Trianguli Australis"); }
                    else if(con.indexOf("Tuc") !== -1){ con = con.replace("Tuc","Tucanae"); }
                    else if(con.indexOf("UMa") !== -1){ con = con.replace("UMa","Ursae Majoris"); }
                    else if(con.indexOf("UMi") !== -1){ con = con.replace("UMi","Ursae Minoris"); }
                    else if(con.indexOf("Vel") !== -1){ con = con.replace("Vel","Velorum"); }
                    else if(con.indexOf("Vir") !== -1){ con = con.replace("Vir","Virginis"); }
                    else if(con.indexOf("Vol") !== -1){ con = con.replace("Vol","Volantis"); }
                    else if(con.indexOf("Vul") !== -1){ con = con.replace("Vul","Vulpeculae"); }
                }
                if(arr[6] != ""){                    
                    name = arr[6]; 
                }else if(con != "" && (arr[28] != "" || bayer != "")){
                    if(arr[28] != ""){                       
                        name = arr[28] + " " + con; 
                    }
                    if(bayer != ""){                             
                        name = bayer + " " + con; 
                    }
                }else if(arr[2] != "" && arr[2] != "0"){    
                    name = "HD " + arr[2]; 
                }else if(arr[3] != "" && arr[3] != "0"){    
                    name = "HR " + arr[3]; 
                }else if(arr[4] != "" && arr[4] != "0"){    
                    name = arr[4]; 
                }else if(arr[1] != "" && arr[1] != "0"){  
                    name = "HIP " + arr[1]; 
                }else{
                    console.log("error: could not get name.");
                    add = false;
                }
                //we got name now.
                
                //now get info based on spectral type
                var spect = arr[15];
                var color = vec4.fill(1,1,1,1);
                if(     spect.indexOf("O") !== -1){ color = vec4.fill(157/255,180/255,255/255,1); }
                else if(spect.indexOf("B") !== -1){ color = vec4.fill(170/255,191/255,255/255,1); }
                else if(spect.indexOf("A") !== -1){ color = vec4.fill(202/255,216/255,255/255,1); }
                else if(spect.indexOf("F") !== -1){ /*white, which is what we start with*/ }
                else if(spect.indexOf("G") !== -1){ color = vec4.fill(255/255,244/255,232/255,1); }
                else if(spect.indexOf("K") !== -1){ color = vec4.fill(255/255,221/255,180/255,1); }
                else if(spect.indexOf("M") !== -1){ color = vec4.fill(255/255,189/255,111/255,1); }
                else if(spect.indexOf("L") !== -1){ color = vec4.fill(248/255,66/255, 53/255,1); }
                else if(spect.indexOf("T") !== -1){ color = vec4.fill(186/255,48/255, 89/255,1); }
                else if(spect.indexOf("Y") !== -1){ color = vec4.fill(96/255, 81/255, 112/255,1); }
                
                //finally add to the database
                if(add == true){
                    _addReal(name,parseFloat(arr[7]),parseFloat(arr[8]),parseFloat(arr[9]),parseFloat(arr[13]),color);
                }
            }
            var count = 0;
            var countLimit = 41136;
            //Add the actual webgl objects
            for(var key in Engine.Game.Database){
                var starObject = new GameObject(key,"Plane","Star");
                starObject.color = Engine.Game.Database[key].Color;
                Engine.Game.DatabaseFunctions.GetAltitudeAzimuth(key); //this is needed for initial load
            }
            //Andromeda
            {
                Engine.Game.DatabaseFunctions.addPath("AndromedaRight",
                    ["Lambda Andromedae","Kappa Andromedae","Iota Andromedae","Omicron Andromedae","Iota Andromedae","Pi Andromedae","Delta Andromedae","Alpheratz"]
                );
                Engine.Game.DatabaseFunctions.addPath("AndromedaBottom",
                    ["Eta Andromedae","Zeta Andromedae","Epsilon Andromedae","Delta Andromedae","Mirach","Almaak"]
                );  
                Engine.Game.DatabaseFunctions.addPath("AndromedaTopLeftMiddle",
                    ["51 Andromedae","Phi Andromedae","Nu Andromedae","Mu Andromedae","Mirach","Pi Andromedae"]
                );  
            }
            //Antlia
            {
                Engine.Game.DatabaseFunctions.addPath("Antlia",
                    ["Iota Antliae","Alpha Antliae","Epsilon Antliae"]
                );  
            }
            //Apus
            {
                Engine.Game.DatabaseFunctions.addPath("Apus",
                    ["Gamma Apodis","Beta Apodis","Delta-1 Apodis","Alpha Apodis"]
                );  
            }
            //Aquarius
            {
                Engine.Game.DatabaseFunctions.addPath("AquariusRight",
                    ["Epsilon Aquarii","Mu Aquarii","Sadalsuud","Iota Aquarii"]
                );  
                Engine.Game.DatabaseFunctions.addPath("AquariusMiddle",
                    ["Sadalsuud","Sadalmelik","Pi Aquarii","Zeta-1 Aquarii","Eta Aquarii","Zeta-1 Aquarii","Gamma Aquarii","Sadalmelik","Theta Aquarii",
                     "Lambda Aquarii","Phi Aquarii","Psi-1 Aquarii","98 Aquarii","Psi-1 Aquarii","88 Aquarii","Psi-1 Aquarii","Delta Aquarii","Tau-1 Aquarii","Lambda Aquarii"]
                );  
            }
            //Aquila
            {
                Engine.Game.DatabaseFunctions.addPath("Aquila",
                    ["Alshain","Altair","Tarazed","Delta Aquilae","Zeta Aquilae","Epsilon Aquilae","Lambda Aquilae","Iota Aquilae","Theta Aquilae",
                    "Eta Aquilae","Delta Aquilae"]
                );  
            }
            //Ara
            {
                Engine.Game.DatabaseFunctions.addPath("Ara",
                    ["Theta Arae","Alpha Arae","Epsilon-1 Arae","Zeta Arae","Eta Arae","Delta Arae","Gamma Arae","Beta Arae","Alpha Arae"]
                );  
            }
            //Aries
            {
                Engine.Game.DatabaseFunctions.addPath("Aries",
                    ["41 Arietis","Hamal","Sheratan","Gamma-2 Arietis"]
                );  
            }
            //Auriga
            {
                Engine.Game.DatabaseFunctions.addPath("Auriga",
                    ["Zeta Aurigae","Epsilon Aurigae","Capella","Delta Aurigae","Menkalinan","Theta Aurigae","Alnath","Hassaleh","Eta Aurigae","Capella"]
                );  
            }
            //Bootes
            {
                Engine.Game.DatabaseFunctions.addPath("Bootes",
                    ["Zeta Boötis","Arcturus","Izar","Delta Boötis","Beta Boötis","Gamma Boötis","Lambda Boötis","Theta Boötis","Kappa-1 Boötis","Lambda Boötis",
                     "Gamma Boötis","Rho Boötis","Arcturus","Mufrid"]
                );  
            }
            //Caelum (Caeli)
            {
                Engine.Game.DatabaseFunctions.addPath("Caelum",
                    ["Gamma-1 Caeli","Beta Caeli","Alpha Caeli","Delta Caeli"]
                );  
            }
            //Camelopardus
            {
                Engine.Game.DatabaseFunctions.addPath("Camelopardus",
                    ["HD 42818","HD 49878","Alpha Camelopardus","Beta Camelopardus","7 Camelopardus","Beta Camelopardus","HD 23475","HD 21291",
                     "HD 23475","Gamma Camelopardus","Alpha Camelopardus"]
                );  
            }
            //Cancer (Cancri)
            {
                Engine.Game.DatabaseFunctions.addPath("Cancer",
                    ["Alpha Cancri","Delta Cancri","Beta Cancri","Delta Cancri","Gamma Cancri","Iota Cancri"]
                );  
            }
            //Canes Venatici (Canum Venaticorum)
            {
                Engine.Game.DatabaseFunctions.addPath("CanesVenatici",
                    ["Alpha-1 Canum Venaticorum","Beta Canum Venaticorum"]
                );
            }
            //Canis Major (Canis Majoris)
            {
                Engine.Game.DatabaseFunctions.addPath("CanisMajor",
                    ["Iota Canis Majoris","Theta Canis Majoris","Gamma Canis Majoris","Iota Canis Majoris","Sirius","Wezen","Aludra",
                     "Wezen","Adhara","Omicron-1 Canis Majoris","Nu-2 Canis Majoris","Mirzam","Sirius"]
                );
            }
            //Canis Minor (Canis Minoris)
            {
                Engine.Game.DatabaseFunctions.addPath("CanisMinor",
                    ["Procyon","Gomeisa"]
                );
            }
            //Capricornus (Capricorni)
            {
                Engine.Game.DatabaseFunctions.addPath("CapricornusTop",
                    ["Alpha-2 Capricorni","Beta Capricorni","Nu Capricorni","Upsilon Capricorni","Iota Capricorni","Gamma Capricorni","Theta Capricorni"]
                );
                Engine.Game.DatabaseFunctions.addPath("CapricornusBottom",
                    ["36 Capricorni","Iota Capricorni","Upsilon Capricorni","Zeta Capricorni","Upsilon Capricorni","Eta Capricorni","24 Capricorni","Eta Capricorni",
                     "Rho Capricorni","Beta Capricorni","Rho Capricorni","Psi Capricorni","Omega Capricorni"]
                );
            }
            //Carina (Carinae)
            {
                Engine.Game.DatabaseFunctions.addPath("Carina",
                    ["Canopus","Avior","Tureis","Upsilon Carinae","Miaplacidus","Omega Carinae","Theta Carinae","HD 84810","Tureis"]
                );
            }
            //Cassiopeia (Cassiopeiae)
            {
                Engine.Game.DatabaseFunctions.addPath("Cassiopeia",
                    ["Epsilon Cassiopeiae","Ruchbah","Cih","Shedir","Caph"]
                );
            }
            //Centaurus (Centauri)
            {
                Engine.Game.DatabaseFunctions.addPath("Centaurus",
                    ["Rigil Kentaurus","Hadar","Epsilon Centauri","Zeta Centauri","Upsilon-2 Centauri","Phi Centauri","Eta Centauri","Kappa Centauri","Eta Centauri",
                     "Phi Centauri","Chi Centauri","Psi Centauri","Menkent","Nu Centauri","Iota Centauri","Nu Centauri","Zeta Centauri","Gamma Centauri","Epsilon Centauri",
                     "Gamma Centauri","Sigma Centauri","Rho Centauri","Omicron-1 Centauri","Rho Centauri","Sigma Centauri","Delta Centauri","Pi Centauri"]
                );
            }
            //Cephus (Cephei)
            {
                Engine.Game.DatabaseFunctions.addPath("Cephus",
                    ["Gamma Cephei","Iota Cephei","Delta Cephei","Zeta Cephei","Epsilon Cephei","Mu Cephei","Alderamin","Eta Cephei","Theta Cephei","Eta Cephei",
                     "Alderamin","Beta Cephei","Iota Cephei","Beta Cephei","Gamma Cephei"]
                );
            }
            //Cetus (Ceti)
            {
                Engine.Game.DatabaseFunctions.addPath("Cetus",
                    ["Gamma Ceti","Xi-2 Ceti","Mu Ceti","Lambda Ceti","Menkar","Gamma Ceti","Delta Ceti","Mira","Zeta Ceti","Tau Ceti","Diphda","Iota Ceti",
                     "Eta Ceti","Theta Ceti","Zeta Ceti"]
                );
            }
            //Chamaeleon (Chamaeleontis)
            {
                Engine.Game.DatabaseFunctions.addPath("Chamaeleon",
                    ["Theta Chamaeleontis","Gamma Chamaeleontis","Epsilon Chamaeleontis","Beta Chamaeleontis","Delta-1 Chamaeleontis","Gamma Chamaeleontis"]
                );
            }
            //Circinus (Circini)
            {
                Engine.Game.DatabaseFunctions.addPath("Circinus",
                    ["Gamma Circini","Alpha Circini","Beta Circini"]
                );
            }
            //Columba (Columbae)
            {
                Engine.Game.DatabaseFunctions.addPath("Columba",
                    ["Epsilon Columbae","Phakt","Beta Columbae","Delta Columbae","Beta Columbae","Eta Columbae"]
                );
            }
            //Coma Berenices (Comae Berenices)
            {
                Engine.Game.DatabaseFunctions.addPath("ComaBerenices",
                    ["Alpha Comae Berenices","Beta Comae Berenices","Gamma Comae Berenices"]
                );
            }
            //Corona Australis (Coronae Australis)
            {
                Engine.Game.DatabaseFunctions.addPath("CoronaAustralis",
                    ["Theta Coronae Australis","Delta Coronae Australis","Beta Coronae Australis","Alpha Coronae Australis","Gamma Coronae Australis","Epsilon Coronae Australis"]
                );
            }
            //Corona Borealis (Coronae Borealis)
            {
                Engine.Game.DatabaseFunctions.addPath("CoronaBorealis",
                    ["Iota Coronae Borealis","Epsilon Coronae Borealis","Delta Coronae Borealis","Gamma Coronae Borealis","Alphekka","Beta Coronae Borealis","Theta Coronae Borealis"]
                );
            }
            //Corvus (Corvi)
            {
                Engine.Game.DatabaseFunctions.addPath("Corvus",
                    ["Alpha Corvi","Epsilon Corvi","Gienah Ghurab","Algorab","Kraz","Epsilon Corvi"]
                );
            }
            //Crater (Crateris)
            {
                Engine.Game.DatabaseFunctions.addPath("Crater",
                    ["Theta Crateris","Epsilon Crateris","Delta Crateris","Alpha Crateris","Beta Crateris","Gamma Crateris","Delta Crateris","Gamma Crateris",
                     "Zeta Crateris","Eta Crateris"]
                );
            }
            //Crux (Crucis)
            {
                Engine.Game.DatabaseFunctions.addPath("CruxA",
                    ["Acrux","Gacrux"]
                );
                Engine.Game.DatabaseFunctions.addPath("CruxB",
                    ["Becrux","Delta Crucis"]
                );
            }
            //Cygnus (Cygni)
            {
                Engine.Game.DatabaseFunctions.addPath("CygnusRight",
                    ["Albireo","Sadr","Delta Cygni","Iota-1 Cygni","Kappa Cygni"]
                );
                Engine.Game.DatabaseFunctions.addPath("CygnusLeft",
                    ["Deneb","Sadr","Gienah","Zeta Cygni"]
                );
            }
            //Delphinus (Delphini)
            {
                Engine.Game.DatabaseFunctions.addPath("Delphinus",
                    ["Epsilon Delphini","Zeta Delphini","Alpha Delphini","Gamma-1 Delphini","Delta Delphini","Zeta Delphini"]
                );
            }
            //Dorado (Doradus)
            {
                Engine.Game.DatabaseFunctions.addPath("Dorado",
                    ["Gamma Doradus","Alpha Doradus","Zeta Doradus","Beta Doradus","HD 40409","Delta Doradus","Beta Doradus","Alpha Doradus"]
                );
            }
            //Draco (Draconis)
            {
                Engine.Game.DatabaseFunctions.addPath("Draco",
                    ["Lambda Draconis","Kappa Draconis","Thuban","Iota Draconis","Theta Draconis","Eta Draconis","Zeta Draconis","Phi Draconis","Delta Draconis",
                     "Xi Draconis","Nu-1 Draconis","Rastaban","Etamin","Xi Draconis"]
                );
            }
            //Equuleus (Equulei)
            {
                Engine.Game.DatabaseFunctions.addPath("Equuleus",
                    ["Alpha Equulei","Delta Equulei","Gamma Equulei"]
                );
            }
            //Eridanus (Eridani)
            {
                Engine.Game.DatabaseFunctions.addPath("Eridanus",              //big gap here. fix later
                    ["Achernar","Chi Eridani","Kappa Eridani","Iota Eridani","Acamar","Upsilon-2 Eridani","Upsilon-1 Eridani","Tau-9 Eridani","Tau-8 Eridani",
                     "Tau-6 Eridani","Tau-5 Eridani","Tau-4 Eridani","Tau-3 Eridani","Tau-1 Eridani","Eta Eridani","Epsilon Eridani","Delta Eridani","Pi Eridani",
                     "Zaurak","Omicron-1 Eridani","Nu Eridani","Mu Eridani","Cursa"]
                );
            }
            //Fornax (Fornacis)
            {
                Engine.Game.DatabaseFunctions.addPath("Fornax",
                    ["Alpha Fornacis","Beta Fornacis","Nu Fornacis"]
                );
            }
            //Gemini (Geminorum)
            {
                Engine.Game.DatabaseFunctions.addPath("GeminiRight",
                    ["Castor","Rho Geminorum","Tau Geminorum","Theta Geminorum","Tau Geminorum","Epsilon Geminorum","Nu Geminorum","Epsilon Geminorum","Mu Geminorum","Eta Geminorum"]
                );
                Engine.Game.DatabaseFunctions.addPath("GeminiLeft",
                    ["Tau Geminorum","Iota Geminorum","Upsilon Geminorum","Pollux","Upsilon Geminorum","Kappa Geminorum","Upsilon Geminorum","Delta Geminorum",
                     "Lambda Geminorum","Xi Geminorum","Lambda Geminorum","Delta Geminorum","Zeta Geminorum","Alhena"]
                );
            }
            //Grus (Gruis)
            {
                Engine.Game.DatabaseFunctions.addPath("Grus",
                    ["Gamma Gruis","Lambda Gruis","Alnair","Delta-1 Gruis","Theta Gruis","Iota Gruis","Beta Gruis","Zeta Gruis","Beta Gruis","Epsilon Gruis","Beta Gruis",
                     "Alnair"]
                );
            }
            //Hercules (Herculis)
            {
                Engine.Game.DatabaseFunctions.addPath("HerculesTop",
                    ["Iota Herculis","Sigma Herculis","Phi Herculis","Tau Herculis","Iota Herculis","Theta Herculis","Rho Herculis","Pi Herculis","Eta Herculis",
                     "Zeta Herculis","Epsilon Herculis","Kornephoros","Gamma Herculis"]
                );
                Engine.Game.DatabaseFunctions.addPath("HerculesLeft",
                    ["Pi Herculis","Xi Herculis","Omicron Herculis","95 Herculis","102 Herculis","109 Herculis","110 Herculis","111 Herculis"]
                );
                Engine.Game.DatabaseFunctions.addPath("HerculesBottom",
                    ["Pi Herculis","Epsilon Herculis","Mu Herculis","Omicron Herculis","Mu Herculis","Lambda Herculis","Delta Herculis","Rasalgethi"]
                );
            }
            //Horologium (Horologii)
            {
                Engine.Game.DatabaseFunctions.addPath("Horologium",
                    ["Alpha Horologii","Iota Horologii","Eta Horologii","Zeta Horologii","Mu Horologii","Beta Horologii"]
                );
            }
            //Hydra (Hydrae)
            {
                Engine.Game.DatabaseFunctions.addPath("Hydra",
                    ["Rho Hydrae","Eta Hydrae","Sigma Hydrae","Delta Hydrae","Epsilon Hydrae","Rho Hydrae","Zeta Hydrae","Theta Hydrae","Iota Hydrae","Alphard","Upsilon-1 Hydrae",
                     "Lambda Hydrae","Mu Hydrae","Nu Hydrae","Chi-2 Hydrae","Xi Hydrae","Beta Hydrae","Gamma Hydrae","Pi Hydrae"]
                );
            }
            //Hydrus (Hydri)
            {
                Engine.Game.DatabaseFunctions.addPath("Hydrus",
                    ["Alpha Hydri","Beta Hydri","Gamma Hydri","Epsilon Hydri","Alpha Hydri"]
                );
            }
            //Indus (Indi)
            {
                Engine.Game.DatabaseFunctions.addPath("Indus",
                    ["Alpha Indi","Eta Indi","Beta Indi","Delta Indi","Theta Indi","Alpha Indi"]
                );
            }
            //Lacerta (Lacertae)
            {
                Engine.Game.DatabaseFunctions.addPath("Lacerta",
                    ["5 Lacertae","4 Lacertae","Beta Lacertae","Alpha Lacertae","5 Lacertae","11 Lacertae","6 Lacertae","1 Lacertae","6 Lacertae",
                     "2 Lacertae","5 Lacertae"]
                );
            }
            //Leo (Leonis)
            {
                Engine.Game.DatabaseFunctions.addPath("LeoOuter",
                    ["Denebola","Zosma","Algieba","Zeta Leonis","Mu Leonis","Kappa Leonis","Lambda Leonis","Ras Elased Australis","Eta Leonis","Omicron Leonis",
                    "Eta Leonis","Regulus","Eta Leonis","Theta Leonis","Rho Leonis","Theta Leonis","Iota Leonis","Sigma Leonis"]
                );
                Engine.Game.DatabaseFunctions.addPath("LeoInner",
                    ["Theta Leonis","Zosma","Algieba","Eta Leonis","Ras Elased Australis","Mu Leonis"]
                );
            }
            //Leo Minor (Leonis Minoris)
            {
                Engine.Game.DatabaseFunctions.addPath("LeoMinor",
                    ["11 Leonis Minoris","21 Leonis Minoris","30 Leonis Minoris","46 Leonis Minoris","Beta Leonis Minoris","21 Leonis Minoris"]
                );
            }
            //Lepus (Leporis)
            {
                Engine.Game.DatabaseFunctions.addPath("Lepus",
                    ["Mu Leporis","Arneb","Zeta Leporis","Eta Leporis","Theta Leporis","Delta Leporis","Gamma Leporis","Nihal","Arneb","Nihal","Epsilon Leporis",
                     "Mu Leporis","Lambda Leporis","Mu Leporis","Kappa Leporis"]
                );
            }
            //Libra (Librae)
            {
                Engine.Game.DatabaseFunctions.addPath("Libra",
                    ["Sigma Librae","Zubenelgenubi","Zubeneschemali","Gamma Librae","Zubenelgenubi","Gamma Librae","Upsilon Librae","Tau Librae"]
                );
            }
            //Lupus (Lupi)
            {
                Engine.Game.DatabaseFunctions.addPath("Lupus",
                    ["Beta Lupi","Delta Lupi","Gamma Lupi","Epsilon Lupi","Zeta Lupi","Alpha Lupi","Zeta Lupi","Eta Lupi",
                     "Chi Lupi","Phi-1 Lupi","Eta Lupi"]
                );
            }
            //Lynx (Lyncis)
            {
                Engine.Game.DatabaseFunctions.addPath("Lynx",
                    ["Alpha Lyncis","38 Lyncis","31 Lyncis","27 Lyncis","21 Lyncis","15 Lyncis","2 Lyncis"]
                );
            }
            //Lyra (Lyrae)
            {
                Engine.Game.DatabaseFunctions.addPath("Lyra",
                    ["Vega","Epsilon-1 Lyrae","Zeta-1 Lyrae","Delta-1 Lyrae","Gamma Lyrae","Sheliak","Zeta-1 Lyrae"]
                );
            }
            //Mensa (Mensae)
            {
                Engine.Game.DatabaseFunctions.addPath("Mensa",
                    ["Alpha Mensae","Gamma Mensae","Eta Mensae","Beta Mensae"]
                );
            }
            //Microscopium (Microscopii)
            {
                Engine.Game.DatabaseFunctions.addPath("Microscopium",
                    ["Theta-1 Microscopii","Epsilon Microscopii","Gamma Microscopii","Alpha Microscopii","Iota Microscopii","Theta-1 Microscopii"]
                );
            }
            //Monoceros (Monocerotis)
            {
                Engine.Game.DatabaseFunctions.addPath("MonocerosBottom",
                    ["Alpha Monocerotis","Zeta Monocerotis","Delta Monocerotis","Beta Monocerotis","Gamma Monocerotis"]
                );
                Engine.Game.DatabaseFunctions.addPath("MonocerosTop",
                    ["Delta Monocerotis","18 Monocerotis","Epsilon Monocerotis","13 Monocerotis","15 Monocerotis","13 Monocerotis","18 Monocerotis"]
                );
            }
            //Musca (Muscae)
            {
                Engine.Game.DatabaseFunctions.addPath("Musca",
                    ["Lambda Muscae","Epsilon Muscae","Alpha Muscae","Beta Muscae","Delta Muscae","Gamma Muscae","Alpha Muscae"]
                );
            }
            //Norma (Normae)
            {
                Engine.Game.DatabaseFunctions.addPath("Norma",
                    ["Delta Normae","Epsilon Normae","Gamma-2 Normae","Eta Normae","Delta Normae"]
                );
            }
            //Octans (Octantis)
            {
                Engine.Game.DatabaseFunctions.addPath("Octans",
                    ["Beta Octantis","Delta Octantis","Nu Octantis","Beta Octantis"]
                );
            }
            //Ophiuchus (Ophiuchi)
            {
                Engine.Game.DatabaseFunctions.addPath("Ophiuchus",
                    ["Nu Ophiuchi","Gamma Ophiuchi","Cebalrai","Eta Ophiuchi","Cebalrai","Rasalhague","Kappa Ophiuchi","Zeta Ophiuchi",
                     "Eta Ophiuchi","Zeta Ophiuchi","Upsilon Ophiuchi","Epsilon Ophiuchi","Delta Ophiuchi","Lambda Ophiuchi","Kappa Ophiuchi"]
                );
            }
            //Orion (Orionis)
            {
                Engine.Game.DatabaseFunctions.addPath("OrionBody",
                    ["Alnilam","Alnitak","Saiph","Rigel","Mintaka","Bellatrix","Lambda Orionis","Betelgeuse","Alnitak","Alnilam","Mintaka"]
                );
                Engine.Game.DatabaseFunctions.addPath("OrionShield",
                    ["Bellatrix","Pi-3 Orionis","Pi-2 Orionis","Pi-1 Orionis","Pi-2 Orionis","Pi-3 Orionis","Pi-4 Orionis","Pi-5 Orionis","Pi-6 Orionis"]
                );
                Engine.Game.DatabaseFunctions.addPath("OrionClub",
                    ["Betelgeuse","Mu Orionis","Xi Orionis","Chi-2 Orionis","Chi-1 Orionis","Nu Orionis","Xi Orionis"]
                );
            }
            //Pavo (Pavonis)
            {
                Engine.Game.DatabaseFunctions.addPath("Pavo",
                    ["Eta Pavonis","Pi Pavonis","Xi Pavonis","Lambda Pavonis","Delta Pavonis","Peacock","Gamma Pavonis","Beta Pavonis",
                     "Delta Pavonis","Epsilon Pavonis","Delta Pavonis","Zeta Pavonis","Delta Pavonis","Kappa Pavonis","Pi Pavonis"]
                );
            }
            //Pegasus (Pegasi)
            {
                Engine.Game.DatabaseFunctions.addPath("Pegasus",            //peg connects to and
                    ["Enif","Theta Pegasi","Zeta Pegasi","Markab","Algenib",     "Alpheratz"     ,"Scheat","Markab","Scheat","Lambda Pegasi","Iota Pegasi","Kappa Pegasi",
                     "Iota Pegasi","Lambda Pegasi","Scheat","Matar","Pi-1 Pegasi"]
                );
            }
            //Perseus (Persei)
            {
                Engine.Game.DatabaseFunctions.addPath("PerseusLeft",
                    ["Lambda Persei","Mu Persei","48 Persei","Delta Persei","Epsilon Persei","Xi Persei","Zeta Persei","Omicron Persei"]
                );
                Engine.Game.DatabaseFunctions.addPath("PerseusRight",
                    ["Epsilon Persei","Algol","Rho Persei","Algol","Kappa Persei","Iota Persei","Mirphak","Delta Persei","Mirphak","Gamma Persei","Eta Persei",
                     "Tau Persei","Gamma Persei","Tau Persei","Iota Persei","Theta Persei"]
                );
            }
            //Phoenix (Phoenicis)
            {
                Engine.Game.DatabaseFunctions.addPath("Phoenix",
                    ["Ankaa","Beta Phoenicis","Gamma Phoenicis","Delta Phoenicis","Zeta Phoenicis","Beta Phoenicis","Epsilon Phoenicis","Ankaa"]
                );
            }
            //Pictor (Pictoris)
            {
                Engine.Game.DatabaseFunctions.addPath("Pictor",
                    ["Alpha Pictoris","Gamma Pictoris","Beta Pictoris"]
                );
            }
            //Pisces (Piscium)
            {
                Engine.Game.DatabaseFunctions.addPath("Pisces",
                    ["Iota Piscium","Lambda Piscium","Kappa Piscium","Gamma Piscium","Theta Piscium","Iota Piscium","Omega Piscium","Delta Piscium","Epsilon Piscium",
                     "Nu Piscium","Alpha Piscium","Omicron Piscium","Eta Piscium","Phi Piscium","Tau Piscium","Upsilon Piscium","Phi Piscium"]
                );
            }
            //Piscis Austrinis (Piscis Austrini)
            {
                Engine.Game.DatabaseFunctions.addPath("PiscisAustrinis",
                    ["Mu Piscis Austrini","Theta Piscis Austrini","Iota Piscis Austrini","Mu Piscis Austrini","Epsilon Piscis Austrini","Fomalhaut",
                     "Delta Piscis Austrini","Gamma Piscis Austrini","Beta Piscis Austrini","Mu Piscis Austrini"]
                );
            }
            //Puppis (Puppis)
            {
                Engine.Game.DatabaseFunctions.addPath("Puppis",
                    ["Rho Puppis","Xi Puppis","3 Puppis","Naos","Sigma Puppis","Tau Puppis","Nu Puppis","Sigma Puppis",
                     "Pi Puppis","Naos"]
                );
            }
            //Pyxis (Pyxidis)
            {
                Engine.Game.DatabaseFunctions.addPath("Pyxis",
                    ["Gamma Pyxidis","Alpha Pyxidis","Beta Pyxidis"]
                );
            }
            //Reticulum (Reticuli)
            {
                Engine.Game.DatabaseFunctions.addPath("Reticulum",
                    ["Epsilon Reticuli","Alpha Reticuli","Beta Reticuli","Theta Reticuli","Epsilon Reticuli"]
                );
            }
            //Sagitta (Sagittae)
            {
                Engine.Game.DatabaseFunctions.addPath("Sagitta",
                    ["Gamma Sagittae","Delta Sagittae","Beta Sagittae","Delta Sagittae","Alpha Sagittae"]
                );
            }
            //Sagittarius (Sagittarii)
            {
                Engine.Game.DatabaseFunctions.addPath("Sagittarius",
                    ["Kaus Borealis","Phi Sagittarii","Nunki","Tau Sagittarii","Zeta Sagittarii","Phi Sagittarii","Zeta Sagittarii",
                     "Kaus Australis","Gamma-1 Sagittarii","Kaus Meridionalis","Kaus Australis","Kaus Meridionalis","Phi Sagittarii",
                     "Kaus Meridionalis","Kaus Borealis"]
                );
            }
            //Scorpius (Scorpii)
            {
                Engine.Game.DatabaseFunctions.addPath("Scorpius",
                    ["Upsilon Scorpii","Kappa Scorpii","Iota-1 Scorpii","Sargas","Eta Scorpii","Zeta-1 Scorpii","Mu-1 Scorpii","Epsilon Scorpii","Tau Scorpii",
                     "Antares","Sigma Scorpii","Dschubba","Graffias","Nu Scorpii","Graffias","Dschubba","Pi Scorpii","Rho Scorpii"]
                );
            }
            //Sculptor (Sculptoris)
            {
                Engine.Game.DatabaseFunctions.addPath("Sculptor",
                    ["Alpha Sculptoris","Iota Sculptoris","Delta Sculptoris","Gamma Sculptoris","Beta Sculptoris"]
                );
            }
            //Scutum (Scuti)
            {
                Engine.Game.DatabaseFunctions.addPath("Scutum",
                    ["Beta Scuti","Alpha Scuti","Gamma Scuti","Delta Scuti","Beta Scuti"]
                );
            }
            //Serpens (Serpentis) (serpentis is split into two areas)
            {
                Engine.Game.DatabaseFunctions.addPath("SerpensCaput",
                    ["Beta Serpentis","Iota Serpentis","Kappa Serpentis","Gamma Serpentis","Beta Serpentis","Delta Serpentis","Unukalhai","Epsilon Serpentis",
                     "Mu Serpentis"]
                );
                Engine.Game.DatabaseFunctions.addPath("SerpensCauda",
                    ["Theta-1 Serpentis","Eta Serpentis","Xi Serpentis"]
                );
            }
            //Sextans (Sextantis)
            {
                Engine.Game.DatabaseFunctions.addPath("Sextans",
                    ["Delta Sextantis","Beta Sextantis","Alpha Sextantis","Gamma Sextantis"]
                );
            }
            //Taurus (Tauri)
            {
                Engine.Game.DatabaseFunctions.addPath("TaurusTop",
                    ["Alnath","Tau Tauri","Epsilon Tauri","Delta-1 Tauri","Gamma Tauri","Lambda Tauri","5 Tauri","Xi Tauri","Omicron Tauri"]
                );
                Engine.Game.DatabaseFunctions.addPath("TaurusBottom",
                    ["Zeta Tauri","Aldebaran","Gamma Tauri","Lambda Tauri","Mu Tauri","Nu Tauri"]
                );
            }
            //Telescopium (Telescopii)
            {
                Engine.Game.DatabaseFunctions.addPath("Telescopium",
                    ["Epsilon Telescopii","Alpha Telescopii","Zeta Telescopii"]
                );
            }
            //Triangulum (Trianguli)
            {
                Engine.Game.DatabaseFunctions.addPath("Triangulum",
                    ["Alpha Trianguli","Beta Trianguli","Gamma Trianguli","Alpha Trianguli"]
                );
            }
            //Triangulum Australe (Trianguli Australis)
            {
                Engine.Game.DatabaseFunctions.addPath("TriangulumAustrale",
                    ["Atria","Beta Trianguli Australis","Epsilon Trianguli Australis","Gamma Trianguli Australis","Atria"]
                );
            }
            //Tucana (Tucanae)
            {
                Engine.Game.DatabaseFunctions.addPath("Tucana",
                    ["Delta Tucanae","Alpha Tucanae","Gamma Tucanae","Beta-1 Tucanae","Zeta Tucanae","Epsilon Tucanae","Gamma Tucanae"]
                );
            }
            //Ursa Major
            {
                Engine.Game.DatabaseFunctions.addPath("BigDipper",
                    ["Alkaid","Mizar","Alioth","Megrez","Phad","Merak","Dubhe","Megrez"]
                ,2.0);
                Engine.Game.DatabaseFunctions.addPath("UrsaMajorFront",
                    ["Alkaid","Mizar","Alioth","Megrez","Dubhe","23 Ursae Majoris","Omicron Ursae Majoris","Upsilon Ursae Majoris",
                    "Theta Ursae Majoris","Kappa Ursae Majoris","Iota Ursae Majoris"]
                );
                Engine.Game.DatabaseFunctions.addPath("UrsaMajorBack",
                    ["Lambda Ursae Majoris","Mu Ursae Majoris","Psi Ursae Majoris","Chi Ursae Majoris","Phad","Merak","Upsilon Ursae Majoris","23 Ursae Majoris"]
                );
                Engine.Game.DatabaseFunctions.addPath("UrsaMajorBack2",
                    ["Xi Ursae Majoris","Nu Ursae Majoris","Chi Ursae Majoris","Phad","Merak","Dubhe"]
                );
            }
            //Ursa Minor
            {
                Engine.Game.DatabaseFunctions.addPath("UrsaMinor",
                    ["Polaris","Delta Ursae Minoris","Epsilon Ursae Minoris","Zeta Ursae Minoris","Eta Ursae Minoris","Gamma Ursae Minoris","Kochab","Zeta Ursae Minoris"]
                );
            }
            //Vela (Velorum)
            {
                Engine.Game.DatabaseFunctions.addPath("Vela",
                    ["Psi Velorum","Mu Velorum","Phi Velorum","Kappa Velorum","Delta Velorum","Gamma-2 Velorum","Lambda Velorum","Psi Velorum","Kappa Velorum"]
                );
            }
            //Virgo (Virginis)
            {
                Engine.Game.DatabaseFunctions.addPath("Virgo",
                    ["Eta Virginis","Beta Virginis","Nu Virginis","Omicron Virginis","Eta Virginis","Porrima","Delta Virginis","Vindemiatrix",
                     "Delta Virginis","Porrima","Theta Virginis","Spica","Theta Virginis","Porrima","Zeta Virginis","Tau Virginis","109 Virginis",
                     "Tau Virginis","Zeta Virginis","Iota Virginis","Mu Virginis"]
                );
            }
            //Volans (Volantis)
            {
                Engine.Game.DatabaseFunctions.addPath("Volans",
                    ["Epsilon Volantis","Beta Volantis","Alpha Volantis","Epsilon Volantis","Gamma-1 Volantis","Delta Volantis","Epsilon Volantis"]
                );
            }
            //Vulpecula (Vulpeculae)
            {
                Engine.Game.DatabaseFunctions.addPath("Vulpecula",
                    ["1 Vulpeculae","Alpha Vulpeculae","13 Vulpeculae","29 Vulpeculae","13 Vulpeculae","31 Vulpeculae"]
                );
            }
        }
        try {
            httpReq.open("GET", "hyg.json", true);
            httpReq.send(null);
        } catch(e) { console.log(e); }
    }
    Engine.Game.DatabaseFunctions.drawPath = function(name,shader){
        var data = new Float32Array(Engine.Game.DatabasePaths[name].array.length*3);
        var doRender = false;
        for(var i = 0; i < Engine.Game.DatabasePaths[name].array.length; i++){
            var starName = Engine.Game.DatabasePaths[name].array[i];
            var position;
            var radius = 0;
            var actualObject = Engine.scene.objects[starName];
            if(actualObject !== undefined){
                position = actualObject.position();
                radius = actualObject.radius;
                data[(i*3)+0] = position[0];
                data[(i*3)+1] = position[1];
                data[(i*3)+2] = position[2];
                
                if(doRender == false){
                    if(Engine.camera.sphereIntersectTest(position,radius)){ 
                        doRender = true;
                    }
                }
            }
        }
        if(doRender == false) return;
        gl.lineWidth(Engine.Game.DatabasePaths[name].lineWidth);
        gl.bindBuffer(gl.ARRAY_BUFFER, Engine.Game.DatabasePaths[name].dataBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.LINE_STRIP, 0,data.length / 3);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
})(this);