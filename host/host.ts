var exist = app.documents.length > 0;
// var hasPaths = doc.pathItems.length > 0;
// var hasItems = doc.pageItems.length > 0;

function scanSelection() {
  var doc = app.documents[0];
  var result = [];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if (child.selected)
      result.push(i)
  }
  return result;
}

function scanFillActive() {
  return app.isFillActive();
}

// function fillColorFromAI() {
//   var color = 'none', doc = app.documents[0];
//   if (exist) {
//     color = rgbToHex(doc.defaultFillColor.red, doc.defaultFillColor.green, doc.defaultFillColor.blue);
//   }
//   return color;
// }
// function strokeColorFromAI() {
//   var color = 'none', doc = app.documents[0];
//   if (exist) {
//     color = rgbToHex(doc.defaultStrokeColor.red, doc.defaultStrokeColor.green, doc.defaultStrokeColor.blue);
//   }
//   return color;
// }

function setDefaultFill(hex) {
  var doc = app.documents[0];
  doc.defaultFillColor = colorToIllustrator(hex);
}

function setDefaultStroke(hex) {
  var doc = app.documents[0];
  doc.defaultStrokeColor = colorToIllustrator(hex);
}

function colorToIllustrator(newColor){
  var nColor = new RGBColor;
  nColor.red = hexToRgb(newColor).r;
  nColor.green = hexToRgb(newColor).g;
  nColor.blue = hexToRgb(newColor).b;
  return nColor;
}

function colorFromIllustrator() {
  if (app.isFillActive())
    defaultColor = fillColorFromAI();
  else
    defaultColor = strokeColorFromAI();
  return defaultColor;
}

function rgbAI(rgb) {
  return rgbToHex(rgb.red, rgb.green, rgb.blue);
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

function scanSelectedColors(arrs) {
  var result = [];
  arrs = validateArray(arrs);
  if (arrs.length) {
    // alert('valid')
    for (var i = 0; i < arrs.length; i++) {
      var target = Number(arrs[i]);
      var child = app.documents[0].pageItems[target];
      if (child.selected) {
        var clone = {fill: 'none', stroke: 'none', index: target}
        if (child.filled) {
          clone.fill = rgbAI(child.fillColor);
        }
        if (child.stroked) {
          clone.stroke = rgbAI(child.strokeColor);
        }
      }
      result.push(clone);
    }
  }
  return JSON.stringify(result);
}

function scanAllColors() {
  var result = [], doc = app.documents[0];
  if (doc.pageItems.length) {
    for (var i = 0; i < doc.pageItems.length; i++) {
      var child = doc.pageItems[i];
      if (child.selected) {
        var clone = {fill: 'none', stroke: 'none', index: i}
        if (child.filled) {
          clone.fill = rgbAI(child.fillColor);
        }
        if (child.stroked) {
          clone.stroke = rgbAI(child.strokeColor);
        }
      }
      result.push(clone);
    }
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

  try { child.fill.color = rgbAI(doc.defaultFillColor);}
  catch(e) { child.fill.color = 'white';}
  try { child.stroke.color = rgbAI(doc.defaultStrokeColor);}
  catch(e) { child.stroke.color = 'white';}

  if (!/white/.test(child.fill.color))
    child.fill.hasColor = true;
  if (!/white/.test(child.stroke.color))
    child.stroke.hasColor = true;

  return JSON.stringify(child);
}
