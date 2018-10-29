var csInterface = new CSInterface();

function extFolder(){
  var str = csInterface.getSystemPath(SystemPath.EXTENSION);
  var parent = str.substring(str.lastIndexOf('/') + 1, str.length);
  return parent;
}

function loadJSX(fileName) {
    var root = csInterface.getSystemPath(SystemPath.EXTENSION) + "/host/";
    csInterface.evalScript('$.evalFile("' + root + fileName + '")');
}

function loadUniversalJSXLibraries() {
    var libs = ["json2.jsx", "Console.jsx"];
    var root = csInterface.getSystemPath(SystemPath.EXTENSION) + "/host/universal/";
    for (var i = 0; i < libs.length; i++)
      csInterface.evalScript('$.evalFile("' + root + libs[i] + '")');
}
