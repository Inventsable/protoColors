function colorToIllustrator(newColor){
  var type = app.documents[0].documentColorSpace;
  var nColor = new RGBColor, uColor;
  nColor.red = hexToRgb(newColor).r;
  nColor.green = hexToRgb(newColor).g;
  nColor.blue = hexToRgb(newColor).b;
  if (type == DocumentColorSpace.RGB) {
    uColor = nColor;
  } else if (type == DocumentColorSpace.CMYK) {
    convert = app.convertSampleColor(ImageColorSpace.RGB, [nColor.red, nColor.green, nColor.blue], ImageColorSpace.CMYK, ColorConvertPurpose.defaultpurpose)
    uColor = new CMYKColor;
    uColor.cyan = convert[0];
    uColor.magenta = convert[1];
    uColor.yellow = convert[2];
    uColor.black = convert[3];
  }
  return uColor;
}

function masterColorToAI(color) {
  var type = app.documents[0].documentColorSpace, result;
  if (type == DocumentColorSpace.RGB) {
    result = rgbToHex(color.red, color.green, color.blue);
  } else if (type == DocumentColorSpace.CMYK) {
    convert = app.convertSampleColor(ImageColorSpace.CMYK, [color.cyan, color.magenta, color.yellow, color.black], ImageColorSpace.RGB, ColorConvertPurpose.defaultpurpose)
    result = rgbToHex(convert[0], convert[1], convert[2]);
  }
  return result;
}

// testOnSelectedCMYK();
function testOnSelectedCMYK() {
  var results = [];
  for (var i = 0; i < app.documents[0].pageItems.length; i++) {
    var target = app.documents[0].pageItems[i];
    if ((target.selected) && (target.filled)) {
      results.push(masterColorToAI(target.fillColor))
    }
  }
  alert(results)
}


function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
