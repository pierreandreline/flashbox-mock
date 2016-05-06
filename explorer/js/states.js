States = [];
StatesIdIndex = [];

States.findById = function(ST_SM_ID,ST_Index) {
    var completeId = ST_SM_ID.toString()+ST_Index.toString();
    var idx = StatesIdIndex.indexOf(completeId);
    if (idx>=0) {
        return States[idx];
    }
    else {
        return undefined;
    }    
}

States.add = function (state) {
    States.push(state);
    StatesIdIndex.push(state.ST_SM_ID.toString()+state.ST_Index.toString());
}