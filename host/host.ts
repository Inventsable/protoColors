var exist = app.documents.length > 0;


function scanSelection() {
  var doc = app.documents[0];
  var result = [];
  if (doc.pageItems.length) {
    for (var i = 0; i < doc.pageItems.length; i++) {
      var child = doc.pageItems[i];
      if (child.selected)
      result.push(i)
    }
  }
  if (doc.textFrames.length) {
    for (var i = 0; i < doc.textFrames.length; i++) {
      var child = doc.textFrames[i];
      if (child.selected)
        result.push(i)
    }
  }
  return result;
}

function scanFillActive() {
  return app.isFillActive();
}

function setDefaultFill(hex) {
  var doc = app.documents[0];
  doc.defaultFillColor = colorToIllustrator(hex);
}

function setDefaultStroke(hex) {
  var doc = app.documents[0];
  doc.defaultStrokeColor = colorToIllustrator(hex);
}

function colorToIllustrator(newColor){
  var type = app.documents[0].documentColorSpace;
  if (type == DocumentColorSpace.RGB) {
    var nColor = new RGBColor;
    nColor.red = hexToRgb(newColor).r;
    nColor.green = hexToRgb(newColor).g;
    nColor.blue = hexToRgb(newColor).b;
  } else if (type == DocumentColorSpace.CMYK) {
    var nColor = new CMYKColor;
    nColor.cyan = hexToCMYK(hex).c;
    nColor.magenta = hexToCMYK(hex).m;
    nColor.yellow = hexToCMYK(hex).y;
    nColor.black = hexToCMYK(hex).k;
  }
  return nColor;
}

function colorFromIllustrator() {
  if (app.isFillActive())
    defaultColor = fillColorFromAI();
  else
    defaultColor = strokeColorFromAI();
  return defaultColor;
}

// alert(app.activeDocument.colorProfileName)

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

function validateArray(arrs) {
  var valid = true, anno = '';
  if (!/./.test(arrs)) {
    valid = false;
  } else if (/\,/.test(arrs)) {
    arrs = arrs.split(',');
  } else {
    arrs = [arrs];
  }
  if (valid) {
    return arrs;
  } else {
    return [];
  }
  // return valid;
}

function selectSameFill(color) {
  clearSelection();
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if ((child.filled) && (color == masterColorToAI(child.fillColor)))
      child.selected = true;
  }
}

function selectSameStroke(color) {
  clearSelection();
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if ((child.stroked) && (color == masterColorToAI(child.strokeColor)))
      child.selected = true;
  }
}

function addSameFill(color) {
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if ((child.filled) && (color == masterColorToAI(child.fillColor)))
      child.selected = true;
  }
}

function addSameStroke(color) {
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if ((child.stroked) && (color == masterColorToAI(child.strokeColor)))
      child.selected = true;
  }
}

function clearSelection() {
  app.selection = '';
}

function scanSelectedColors(arrs) {
  var result = [];
  arrs = validateArray(arrs);
  if (arrs.length) {
    for (var i = 0; i < arrs.length; i++) {
      var target = Number(arrs[i]);
      var child = app.documents[0].pageItems[target];
      if (child.selected) {
        var clone = {fill: 'none', stroke: 'none', index: target}
        if (child.filled) {
          clone.fill = masterColorToAI(child.fillColor);
        }
        if (child.stroked) {
          clone.stroke = masterColorToAI(child.strokeColor);
        }
      }
      result.push(clone);
    }
  }
  return JSON.stringify(result);
}

function scanAllColors() {
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    var clone = {fill: 'none', stroke: 'none', index: i}
    if (child.filled)
      clone.fill = masterColorToAI(child.fillColor);
    if (child.stroked)
      clone.stroke = masterColorToAI(child.strokeColor);
    result.push(clone);
  }
  return JSON.stringify(result);
}

function scanFillStroke() {
  var doc = app.documents[0];
  var child = {
    fill: {
      active: false,
      color: 'white',
      hasColor: false,
    },
    stroke: {
      active: false,
      color: 'white',
      hasColor: false,
    }
  };
  if (app.isStrokeActive()) {child.stroke.active = true;}
  else {child.fill.active = true;}

  try { child.fill.color = masterColorToAI(doc.defaultFillColor);}
  catch(e) { child.fill.color = 'white';}
  try { child.stroke.color = masterColorToAI(doc.defaultStrokeColor);}
  catch(e) { child.stroke.color = 'white';}

  if (!/white/.test(child.fill.color))
    child.fill.hasColor = true;
  if (!/white/.test(child.stroke.color))
    child.stroke.hasColor = true;

  return JSON.stringify(child);
}

// function swapStrokes(color1, color2) {
//   var result = [], doc = app.documents[0];
//   for (var i = 0; i < doc.pageItems.length; i++) {
//     var child = doc.pageItems[i];
//     if ((child.stroked) && (color1 == masterColorToAI(child.strokeColor)))
//       child.strokeColor = colorToIllustrator(color2);
//     if ((child.stroked) && (color2 == masterColorToAI(child.strokeColor)))
//       child.strokeColor = colorToIllustrator(color1);
//   }
// }
//
// function swapFills(color1, color2) {
//   var result = [], doc = app.documents[0];
//   for (var i = 0; i < doc.pageItems.length; i++) {
//     var child = doc.pageItems[i];
//     if ((child.filled) && (color1 == masterColorToAI(child.fillColor)))
//       child.fillColor = colorToIllustrator(color2);
//     if ((child.filled) && (color2 == masterColorToAI(child.fillColor)))
//       child.fillColor = colorToIllustrator(color1);
//   }
// }
