Tags = [];
TagsLeveled = [];
TagsLeveled.listeners = [];
TagsLeveledIdIndex = [];
TagsIdIndex = [];
TagsNameIndex = [];

Tags.findByName = function(name) {
    var idx = TagsNameIndex.indexOf(name);
    if (idx>=0) {
        return Tags[idx];
    }
    else {
        console.log('Variable introuvable : ' + name);
        return undefined;
    }    
}

Tags.findById = function(id) {
    var idx = TagsIdIndex.indexOf(id);
    if (idx>=0) {
        return Tags[idx];
    }
    else {
        return undefined;
    }    
}

Tags.attach = function (varName,element,updateFunction) {
    var variable = Tags.findByName(varName);
    if (variable) {
        variable.addEventListener('valueChanged', updateFunction.bind(null,element), false);
        return variable;
    }
    return undefined;
}

Tags.attachInnerHtml = function (container,varName,element,params) {
    var variable = Tags.findByName(varName);
    if (variable) {
        var bindedFunction = Tags.updateInnerHtml.bind(null,variable,element,params);
        if (!container.bindedFunction) {
            container.bindedFunctions = [];
        }
        container.bindedFunctions.push( {variable: variable, bindedFunction: bindedFunction } );
        element.title = variable.name;
        variable.addEventListener('valueChanged', bindedFunction, false);
        Tags.updateInnerHtml(variable,element,params);
        
        return variable;
    }
    return undefined;
}

Tags.updateInnerHtml = function (variable,element,params) {
    if (variable && element) {
        if (!params) {
            element.innerHTML = variable.value;
        }
        else {
            // Suppression des classes précédentes
            var className = element.className;
            for (var idxParam = 0; idxParam < params.length; idxParam++) {
                if (params[idxParam].class) {
                    className = className.replace(new RegExp(' '+params[idxParam].class,'g'),'');
                }
            }
            // Mise à jour de l'élément
            for (var idxParam = 0; idxParam < params.length; idxParam++) {
                if (params[idxParam].value == variable.value) {
                    element.innerHTML = params[idxParam].text;
                    if (params[idxParam].class) {
                        element.className = className+' '+params[idxParam].class;
                    }
                }
            }
        }
    }
}

Tags.detach = function (container) {
    if (container.bindedFunctions) {
        container.bindedFunctions.forEach(function(element) {
            var variable = element.variable;
            var bindedFunction = element.bindedFunction;
            variable.removeEventListener('valueChanged',bindedFunction,false);
        }, this);
    }
}

Tags.attachInnerHtml2 = function (container,varName1,varName2,element,params) {
    var variable1 = Tags.findByName(varName1);
    var variable2 = Tags.findByName(varName2);
    if (variable1 && variable2) {
        var bindedFunction = Tags.updateInnerHtml2.bind(null,variable1,variable2,element,params);
        if (!container.bindedFunction) {
            container.bindedFunctions = [];
        }
        container.bindedFunctions.push( {variable: variable1, bindedFunction: bindedFunction } );
        container.bindedFunctions.push( {variable: variable2, bindedFunction: bindedFunction } );
        element.title = variable1.name + " / "+variable2.name;
        variable1.addEventListener('valueChanged', bindedFunction, false);
        variable2.addEventListener('valueChanged', bindedFunction, false);
        Tags.updateInnerHtml2(variable1, variable2, element, params);
        
    }
    else {
        console.log("Tags.attachInnerHtml2 : au moins une des deux variables n'existe pas ("+varName1+","+varName2+")");
    }

    return;
}

Tags.updateInnerHtml2 = function (variable1,variable2,element,params) {
    if (variable1 && variable2 && element) {
        if (!params) {
            element.innerHTML = variable1.value + "/"+variable2.value;
        }
        else {
            // Suppression des classes précédentes
            var className = element.className;
            for (var idxParam = 0; idxParam < params.length; idxParam++) {
                if (params[idxParam].class) {
                    className = className.replace(new RegExp(' '+params[idxParam].class,'g'),'');
                }
            }
            // Mise à jour de l'élément
            var value = variable1.value + variable2.value*2;
            for (var idxParam = 0; idxParam < params.length; idxParam++) {
                if (params[idxParam].value == value) {
                    element.innerHTML = params[idxParam].text;
                    if (params[idxParam].class) {
                        element.className = className+' '+params[idxParam].class;
                    }
                }
            }
        }
    }
}

Tags.write = function (variable,value) {
    var ajax = document.createElement('iron-ajax');
    ajax.url = '/api/tags.asmx/setValue';
    ajax.method = 'POST';
    ajax.headers = { 'Content-Type': 'application/json; charset=UTF-8', 'dataType': 'json' }
    ajax.body = "{'tagName':'" + variable.name +"', 'value':'"+ value +"'}";
    ajax.onerror = function(err) {
        console.log('erreur : '+err);
    };
    ajax.onresponse = function(req) {
        console.log('ok : '+req);
    }
    ajax.generateRequest();
    
} 