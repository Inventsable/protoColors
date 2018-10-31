var exist = app.documents.length > 0;

function scanSelection() {
  var doc = app.documents[0];
  var result = [];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if (child.selected)
      result.push(i)
  }
  // if ((result.length == 1) && (result[0] !== lastresult)) {
  //   // autoAdjustFS(result[0]);
  //   lastresult = result[0];
  // }
  return result;
}

// This doesn't work.
// function autoAdjustFS(index) {
//   var doc = app.documents[0];
//   var item = doc.pageItems[index];
//   if ((item.filled) && (!item.stroked))
//     app.isFillActive(true);
// }

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

function selectSameFill(color) {
  clearSelection();
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if ((child.filled) && (color == rgbAI(child.fillColor)))
      child.selected = true;
  }
}

function selectSameStroke(color) {
  clearSelection();
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if ((child.stroked) && (color == rgbAI(child.strokeColor)))
      child.selected = true;
  }
}

function addSameFill(color) {
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if ((child.filled) && (color == rgbAI(child.fillColor)))
      child.selected = true;
  }
}

function addSameStroke(color) {
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if ((child.stroked) && (color == rgbAI(child.strokeColor)))
      child.selected = true;
  }
}

function swapStrokes(color1, color2) {
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if ((child.stroked) && (color1 == rgbAI(child.strokeColor)))
      child.strokeColor = colorToIllustrator(color2);
    if ((child.stroked) && (color2 == rgbAI(child.strokeColor)))
      child.strokeColor = colorToIllustrator(color1);
  }
}

function swapFills(color1, color2) {
  var result = [], doc = app.documents[0];
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    if ((child.filled) && (color1 == rgbAI(child.fillColor)))
      child.fillColor = colorToIllustrator(color2);
    if ((child.filled) && (color2 == rgbAI(child.fillColor)))
      child.fillColor = colorToIllustrator(color1);
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
  for (var i = 0; i < doc.pageItems.length; i++) {
    var child = doc.pageItems[i];
    var clone = {fill: 'none', stroke: 'none', index: i}
    if (child.filled)
      clone.fill = rgbAI(child.fillColor);
    if (child.stroked)
      clone.stroke = rgbAI(child.strokeColor);
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
