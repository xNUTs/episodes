
var gDprintLevel = 1;

function dprint(level, msg) {
    if ( level > gDprintLevel )
        return;

	ddd(msg);
}


function eprint(msg) {
	ddd(msg);
}


function printObject(obj, sKey, bNoFunctions) {
    var msg = "";
    for ( var key in obj ) {
        if ( !sKey || (-1 != key.indexOf(sKey)) ) {
            if ( "function" == typeof(obj[key]) ) {
                if ( !bNoFunctions ) {
                    msg += key + " = [function]\n";
                }
            }
            else {
                msg += key + " = " + obj[key] + "\n";
            }
        }
        if ( msg.length > 400 ) {
            eprint(msg);
            msg = "";
        }
    }
    eprint(msg);
}

function ggGetPref (name) {
  const PrefService = XPCOMUtils.CC("@mozilla.org/preferences-service;1");
  const nsIPrefBranch = XPCOMUtils.CI("nsIPrefBranch");
  const nsIPrefBranch2 = XPCOMUtils.CI("nsIPrefBranch2");
  const prefs = PrefService.getService(nsIPrefBranch2);
  const prefDomain = "extensions.firebug";
  var prefName;
  if (name.indexOf("browser.") != -1) {
    prefName = name;
  }
  else {
    prefName = prefDomain + "." + name;
  }
  var type = prefs.getPrefType(prefName);
  if (type == nsIPrefBranch.PREF_STRING) {
    return prefs.getCharPref(prefName);
  }
  else if (type == nsIPrefBranch.PREF_INT) {
    return prefs.getIntPref(prefName);
  }
  else if (type == nsIPrefBranch.PREF_BOOL) {
    return prefs.getBoolPref(prefName);
  }
}
