Collection=function(indexFields)
{
	this.count=0;
	this.collection=[];
	this.indexId = [];
	this.index = [];
	this.indexFields = indexFields;
	
	this.version = function() {
		return "1.0.0";
	}
	
	this.add=function(item) {
		var key = "";
		for(field in this.indexFields) {
			key += item[this.indexFields[field]];
		}
		this.index.push(key);
		this.collection.push(item);
		this.indexId.push(item.id);
		return ++this.count;
	}

	this.remove=function(item) {
		var key = "";
		for(fields in this.indexFields)
			key += item[field];
		var idx = this.index.indexOf(key);
		if (idx < 0) {
			return undefined;
		}
		this.collection.splice(idx,1);
		this.index.splice(idx,1);
		this.indexId.splice(idx,1);
		return --this.count;
	}
	
	this.find=function(key){
		var idx = this.index.indexOf(key);
		if (idx < 0) {
			return undefined;
		}
		return this.collection[idx];
	}

	this.findById=function(key){
		var idx = this.indexId.indexOf(key);
		if (idx < 0) {
			return undefined;
		}
		return this.collection[idx];
	}
	

	this.forEach=function(block) {
		for (key in this.collection) {
			block(this.collection[key]);
		}
	}
}

module.exports = Collection;