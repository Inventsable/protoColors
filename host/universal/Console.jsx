JSXEvent('Loading...', 'console')

var doc = app.documents[0];
var directory;
var setPath;
var setName;

var thisDoc = app.documents[0];
var activeAB = thisDoc.artboards.getActiveArtboardIndex();
var lastAB = 0;
var lastABOffset, isOrigin, thisAB, absAB, relAB;

function getName(){
  return app.documents[0].name;
}

function setDirectory(path){
  setPath = path;
  var setFolder = new Folder(path);
  setFolder.create();
}

function deleteFolder(path) {
  var thisFolder = Folder(path);
  try {
    thisFolder.remove();
    return true;
  } catch(e){return false;}
}

function verifyFile(name){
  var newFile = File(setPath + "/" + name + ".svg");
  try {newFile.open('r');
    } catch(e){alert(e)};
  var contents = newFile.read();
  return contents;
}

function clearSet(){
  var setFolder = Folder(setPath);
  var setFile = setFolder.getFiles("*.svg");
  if ( !setFile.length ) {
    // alert("No files");
    return;
  } else {
    for (var i = 0; i < setFile.length; i++) {
      setFile[i].remove();
    }
  }
}

function runScript(path) {
  try {
  $.evalFile(path)
  } catch (e) {
    JSXEvent(e.name + "," + e.line + "," + e + "," + e.message, "console")
  }
}

function JSXEvent(payload, eventType) {
  try {
    var xLib = new ExternalObject("lib:\PlugPlugExternalObject");
  } catch (e) {
    JSXEvent(e, 'console')
  }
  if (xLib) {
  var eventObj = new CSXSEvent();
  eventObj.type = eventType;
  eventObj.data = payload;
  eventObj.dispatch();
  }
  return;
}

var console = {
  log : function(data) {JSXEvent(data, 'console')}
};

/// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// https://github.com/Qix-/color-convert/blob/HEAD/conversions.js
function hexToCMYK(hex) {
  var rgb = hexToRgb(hex);
	var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
	var c, m, y, k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;
  var color = {
    c: c * 100,
    m: m * 100,
    y: y * 100,
    k: k * 100,
  }
  // return [c * 100, m * 100, y * 100, k * 100];
  return color;
};

function cmykToHex(color) {
  var convert = cmykToRGB2(color.cyan, color.magenta, color.yellow, color.black);
  var mirror = [convert.r, convert.g, convert.b]
  return rgbToHex(convert[0], convert[1], convert[2])
}

function cmykToRGB2(C,M,Y,K) {
  // alert(C + " " + M + " " + Y + " " + K)
  var r = 255 * (1 - C) * (1 - K);
  var g = 255 * (1 - M) * (1 - K);
  var b = 255 * (1 - Y) * (1 - K);
  return [r,g,b]
}

// // https://www.standardabweichung.de/code/javascript/cmyk-rgb-conversion-javascript
function cmykToRGB(color){
    color.cyan = (color.cyan / 100);
    color.magenta = (color.magenta / 100);
    color.yellow = (color.yellow / 100);
    color.black = (color.black / 100);

    color.cyan = color.cyan * (1 - color.black) + color.black;
    color.magenta = color.magenta * (1 - color.black) + color.black;
    color.yellow = color.yellow * (1 - color.black) + color.black;

    var r = 1 - color.cyan;
    var g = 1 - color.magenta;
    var b = 1 - color.yellow;

    return {
        r: r,
        g: g,
        b: b
    }
}
