var jimp = require("jimp");
var fs = require('fs')



// This is a port of Ken Perlin's Java code. The
// original Java code is at http://cs.nyu.edu/%7Eperlin/noise/.
// Note that in this version, a number from 0 to 1 is returned.
// This code was ported by Kas Thomas at AssertTrue, and directly copied by me
PerlinNoise = new function() {

	this.noise = function(x, y, z) {
		var p = new Array(512)
		var permutation = [ 151,160,137,91,90,15,
		131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
		190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
		88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
		77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
		102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
		135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
		5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
		223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
		129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
		251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
		49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
		138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
		];
		for (var i=0; i < 256 ; i++) 
			p[256+i] = p[i] = permutation[i]; 

		var X = Math.floor(x) & 255,                  // FIND UNIT CUBE THAT
			Y = Math.floor(y) & 255,                  // CONTAINS POINT.
			Z = Math.floor(z) & 255;
		x -= Math.floor(x);                                // FIND RELATIVE X,Y,Z
		y -= Math.floor(y);                                // OF POINT IN CUBE.
		z -= Math.floor(z);
		var 	u = fade(x),                                // COMPUTE FADE CURVES
				v = fade(y),                                // FOR EACH OF X,Y,Z.
				w = fade(z);
		var 	A = p[X  ]+Y, AA = p[A]+Z, AB = p[A+1]+Z,      // HASH COORDINATES OF
			  	B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;      // THE 8 CUBE CORNERS,

	  return scale(lerp(w, lerp(v,   lerp(u, grad(p[AA  ], x  , y  , z   ),  // AND ADD
									 grad(p[BA  ], x-1, y  , z   )), // BLENDED
							 lerp(u, grad(p[AB  ], x  , y-1, z   ),  // RESULTS
									 grad(p[BB  ], x-1, y-1, z   ))),// FROM  8
					 lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),  // CORNERS
									 grad(p[BA+1], x-1, y  , z-1 )), // OF CUBE
							 lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
									 grad(p[BB+1], x-1, y-1, z-1 )))));
   }
   function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
   function lerp( t, a, b) { return a + t * (b - a); }
   function grad(hash, x, y, z) {
	  var h = hash & 15;                      // CONVERT LO 4 BITS OF HASH CODE
	  var u = h<8 ? x : y,                 // INTO 12 GRADIENT DIRECTIONS.
			 v = h<4 ? y : h==12||h==14 ? x : z;
	  return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
   } 
   function scale(n) { return (1 + n)/2; }
}

generateMap();

function lowest4Point(e,w,x,y){
	var lowest = e[x][y] + w[x][y];
	var lowx = x;
	var lowy = y;
	if(e[x-1][y] + w[x-1][y] * .1 < lowest){
		lowest = e[x-1][y] + w[x-1][y] * .1; 
		lowx = x-1;
		lowy = y;
	}
	if(e[x+1][y] + w[x+1][y] * .1 < lowest){
		lowest = e[x+1][y] + w[x+1][y] * .1;
		lowx = x+1;
		lowy = y;
	}
	if(e[x][y-1] + w[x][y-1] * .1 < lowest){
		lowest = e[x][y-1] + w[x][y-1] * .1;
		lowx = x;
		lowy = y-1;
	}
	if(e[x][y+1] + w[x][y+1] * .1 < lowest){
		lowest = e[x][y+1] + w[x][y+1] * .1;
		lowx = x;
		lowy = y+1;
	}
	var ret = [lowx, lowy];
	return ret;
}

function mapToImage(image, width, height, map, name) {
	for(var i = 0; i < width; i++) {
		for(var j = 0; j < height; j++){
			var t = Math.round(map[i][j]);
			image.setPixelColor(jimp.rgbaToInt(t, t, t,255),i,j)
		}
	}
	image.write(name);
}

function generateRainMap(width, height, elevationMap, moistureMap){
	var waterMap = new Array(height + 1);
	for (var i = 0; i < height + 1; i++) {
	  waterMap[i] = new Array(width + 1);
	  for(var j = 0; j <= width; j++){
	  	waterMap[i][j] = 0;
	  }
	}


	var dropX, dropY;
	for(var i = 0; i < 30; i++){
		do {
			var dropX = Math.round(Math.random() * (width/3) + width/3);
			var dropY = Math.round(Math.random() * (height/3) + height/3);
		} while (elevationMap[dropX][dropY] < 130 || moistureMap[dropX][dropY] < 100)
		if(moistureMap[dropX][dropY])
		while(elevationMap[dropX][dropY] > 110){
			waterMap[dropX][dropY] += 1;
			var t = lowest4Point(elevationMap, waterMap, dropX, dropY);
			if(t[0] == dropX && t[1] == dropY){
				continue;
			}
			dropX = t[0];
			dropY = t[1];
		}
	}

	return waterMap;
}

function generateMap() {
	var offsetx = Math.round(Math.random() * 1000);
	var offsety = Math.round(Math.random() * 1000);
	var height = 1024;
	var width = 1024;
	var midx = height/2;
	var midy = width/2;
	var scalar = .007;
	var scalar2 = scalar*2;
	var scalar3 = scalar*8;
	var scalar4 = scalar*16;
	var scalar5 = scalar*48;
	var scalarm1 = .002;
	var scalarm2 = scalarm1*2;
	var scalarm3 = scalarm1*8;
	var scalarm4 = scalarm1*16;
	var scalarm5 = scalarm1*48;
	var riverThreshold = 3;

	var compImage = new jimp(width, height, 0x0000FFFF);
	var elevationImage = new jimp(width, height, 0x0000FFFF);
	var moistureImage = new jimp(width, height, 0x0000FFFF);
	var waterImage = new jimp(width, height, 0x0000FFFF);


	var elevationMap = new Array(height + 1);
	for (var i = 0; i < height + 1; i++) {
	  elevationMap[i] = new Array(width + 1);
	}

	var moistureMap = new Array(height + 1);
	for (var i = 0; i < height + 1; i++) {
	  moistureMap[i] = new Array(width + 1);
	}

	for(var i = offsetx; i < width +offsetx; i++){
		for(var j = offsety; j < height + offsety; j++){
			var n = PerlinNoise.noise(i * scalar, j * scalar, 1) * 1 
			+ PerlinNoise.noise(i * scalar2, j * scalar2, 1) * .5 
			+ PerlinNoise.noise(i * scalar3, j * scalar3, 1) * .25 
			+ PerlinNoise.noise(i * scalar4, j * scalar4, 1) * .10 
			+ PerlinNoise.noise(i * scalar5, j * scalar5, 1) * .05;
			
			var m = PerlinNoise.noise(i * scalarm1, j * scalarm1, 1) * 1 
			+ PerlinNoise.noise(i * scalarm2, j * scalarm2, 1) * .5 
			+ PerlinNoise.noise(i * scalarm3, j * scalarm3, 1) * .25
			+ PerlinNoise.noise(i * scalarm4, j * scalarm4, 1) * .10
			+ PerlinNoise.noise(i * scalarm5, j * scalarm5, 1) * .05;

			var d = Math.sqrt(Math.pow(midx+offsetx - i, 2) + Math.pow(midy + offsety - j, 2))/300;
			// d = 1/d;
			n = n/1.9;
			n = Math.pow(n, .33)
			n = n + .01 - .3 * Math.pow(d,.6);
			m = m/1.9 * 255
			
			elevationMap[i-offsetx][j-offsety] = n * 255;
			moistureMap[i-offsetx][j-offsety] = m;
		}
		
	}
	console.log("heightmap done");	
	
	var waterMap = generateRainMap(width, height, elevationMap, moistureMap);
	console.log("rain done");

	for(var i = 0; i < width; i++){
		for(var j = 0; j < height; j++){
			var n = Math.round(elevationMap[i][j]);
			var m = moistureMap[i][j];
			var w = waterMap[i][j];
			var mountain = (n-180)*2+180;
			if (n <= 120) //ocean
				compImage.setPixelColor(jimp.rgbaToInt(0, 60, 82,255),i,j)
			else if (w >= riverThreshold)//river
				compImage.setPixelColor(jimp.rgbaToInt(0, 60, 82,255),i,j);
			else if (n <= 130)//beach
				compImage.setPixelColor(jimp.rgbaToInt(154, 140, 112,255),i,j)
			else if (n < 180 && m < 130)//plain
				compImage.setPixelColor(jimp.rgbaToInt(83, 109, 50,255),i,j)
			else if (n < 180 && m >= 130)//forest
				compImage.setPixelColor(jimp.rgbaToInt(50,80,50,255),i,j)
			else
				compImage.setPixelColor(jimp.rgbaToInt(mountain,mountain,mountain,255),i,j)
			
			if (w < riverThreshold && w > 0 && n > 120)//light river
							compImage.setPixelColor(jimp.rgbaToInt(0, 60, 82,w*100+55),i,j);
			
		}
	}

	mapToImage(elevationImage, width, height, elevationMap, "ElevationMap.png");
	mapToImage(moistureImage, width, height, moistureMap, "MoistureMap.png");
	mapToImage(waterImage, width, height, waterMap, "WaterMap.png");

	compImage.write("map.png",function(){
		setTimeout(function() {
			process.exit(1);
		}, 3000);
	})
	console.log("finished map")
}

