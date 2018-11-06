var hasSelection = app.project.activeItem.selectedLayers.length > 0;
var exist = app.project.items.length > 0;

// Being run with SetInterval every 500ms, pretty light
function scanSelection() {
  if (exist) {
    var activeItem = app.project.activeItem, result = [];
    if (activeItem != null && activeItem instanceof CompItem) {
      if (activeItem.selectedLayers.length > 0) {
        for (var i = 0; i < activeItem.selectedLayers.length; i++) {
          var layer = activeItem.selectedLayers[i];
          if (layer.property("sourceText") === null) {
            result.push(layer.index);
            if (layer.selectedProperties.length > 0) {
              for (var e = 0; e < layer.selectedProperties.length; e++) {
                var prop = layer.selectedProperties[e];
                result.push(prop.propertyIndex);
              }
            }
          }
        }
      }
    }
    return result;
  }
}

function scanSelectionforColors() {
  var activeItem = app.project.activeItem, result = [];
  if (activeItem != null && activeItem instanceof CompItem) {
    if (activeItem.selectedLayers.length > 0) {
      for (var i = 0; i < activeItem.selectedLayers.length; i++) {
        var layer = activeItem.selectedLayers[i];
        if (layer.property("sourceText") === null) {          
          if (layer.selectedProperties.length > 0) {
            for (var e = 0; e < layer.selectedProperties.length; e++) {
              var prop = layer.selectedProperties[e];
              result.push(scanColor(prop, []));
            }
          } else {
            result.push(scanColor(layer, []));
          }
        }
      }
    }
  }
  return result;
}

function scanColor(propGroup, colorList) {
  var i, prop;
  for (i = 1; i <= propGroup.numProperties; i++) {
    prop = propGroup.property(i);
    if ((prop.propertyType === PropertyType.PROPERTY)
      && (/(ADBE\sVector\s(Fill|Stroke)\sColor)/i.test(prop.matchName))) {
      var temp = rgbToHex(prop.value[0] * 255, prop.value[1] * 255, prop.value[2] * 255);
      colorList.push(temp)
    } else if ((prop.propertyType === PropertyType.INDEXED_GROUP) || (prop.propertyType === PropertyType.NAMED_GROUP)) {
      scanColor(prop, colorList);
    }
  }
  return colorList;
}

function scanAllColors() {
  if (exist) {
    var activeItem = app.project.activeItem, result = [];
    if (activeItem != null && activeItem instanceof CompItem) {
      if (activeItem.layers.length > 0) {
        for (var i = 1; i <= activeItem.layers.length; i++) {
          var layer = activeItem.layers[i];
          if (layer.property("sourceText") === null) {
            if (layer.selectedProperties.length > 0) {
              for (var e = 0; e < layer.selectedProperties.length; e++) {
                var prop = layer.selectedProperties[e];
                result.push(scanColor(prop, []));
              }
            } else {
              result.push(scanColor(layer, []));
            }
          }
        }
      }
    }
    return result;
  }
}

function clearSelection() {
  // app.project.activeItem.selection = '';
  var activeItem = app.project.activeItem;
  if (activeItem != null && activeItem instanceof CompItem) {
    if (activeItem.selectedLayers.length > 0) {
      for (var i = 0; i < activeItem.selectedLayers.length; i++) {
        var layer = activeItem.selectedLayers[i];
        if (layer.property("sourceText") === null) {
          if (layer.selectedProperties.length > 0) {
            for (var e = 0; e < layer.selectedProperties.length; e++) {
              var prop = layer.selectedProperties[e];
              prop.selected = false;
            }
          }
          layer.selected = false;
        }
      }
    }
  }
  return true;
}

function startColorSelection(color, add=false) {
  if (exist) {
    if (!add) {
      clearSelection();
    }
    var activeItem = app.project.activeItem;
    if (activeItem != null && activeItem instanceof CompItem) {
      if (activeItem.layers.length > 0) {
        for (var i = 1; i <= activeItem.layers.length; i++) {
          var layer = activeItem.layers[i];
          selectColor(layer, color);
        }
      }
    }
  }
}

function selectColor(propGroup, color) {
  var i, prop;
  for (i = 1; i <= propGroup.numProperties; i++) {
    prop = propGroup.property(i);
    if ((prop.propertyType === PropertyType.PROPERTY)
      && (/(ADBE\sVector\s(Fill|Stroke)\sColor)/i.test(prop.matchName))) {
      var temp = rgbToHex(prop.value[0] * 255, prop.value[1] * 255, prop.value[2] * 255);
      if (temp == color) {
        prop.selected = true;
      }
    } else if ((prop.propertyType === PropertyType.INDEXED_GROUP) || (prop.propertyType === PropertyType.NAMED_GROUP)) {
      selectColor(prop, color);
    }
  }
  return true;
}