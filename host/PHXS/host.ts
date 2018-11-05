// Compile on save successful

function scanFGBG() {
  // alert('hello')
  return 'hello';
}

function scanAllColors() {
  return "#" + app.foregroundColor.rgb.hexValue + ",#" + app.backgroundColor.rgb.hexValue;
}

function setFG(color) {
  app.foregroundColor.rgb.hexValue = color;
}

function setBG(color) {
  app.backgroundColor.rgb.hexValue = color;
}

function scanFGBG() {
  var doc = app.documents[0];
  var child = {
    fill: {
      active: true,
      color: 'white',
      hasColor: false,
    },
    stroke: {
      active: false,
      color: 'white',
      hasColor: false,
    }
  }
  try { child.fill.color = '#' + app.foregroundColor.rgb.hexValue; }
  catch (e) { child.fill.color = 'white'; }
  try { child.stroke.color = '#' + app.backgroundColor.rgb.hexValue; }
  catch (e) { child.stroke.color = 'white'; }

  if (!/white/.test(child.fill.color))
    child.fill.hasColor = true;
  if (!/white/.test(child.stroke.color))
    child.stroke.hasColor = true;
  return JSON.stringify(child);
}