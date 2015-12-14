var lunr = require('lunr');

module.exports = plugin;

function plugin(opts){
  return function(files, metalsmith, done){
    opts = setDefaultOptions(opts);
    
    var index = setIndexOptions(opts);
    indexDocs(index,files, opts);
    addJSONtoMetalsmith(index, files, opts.indexPath);
    
    var meta = {};
    metaDocs(meta,files, opts);
    addJSONtoMetalsmith(meta, files, opts.metaPath);

    done();
  };
};

//Creates the lunr object
function setIndexOptions(opts){
  var fields = opts.fields;
  var index =  lunr(function(){
    if (opts.pipelineFunctions) {
      this.pipeline.reset();
      opts.pipelineFunctions.forEach(function(f){
        this.pipeline.add(f);
      }, this);
    }
    for(field in fields){
      this.field(field, {boost: fields[field]});
    }
    this.ref(opts.ref);
  });
  return index;
}

//Adds docs to the lunr object if docs is flagged to be indexed
function indexDocs(index, files, opts){
  for (file in files){
    if(files[file].lunr){
      var docIndex = createDocumentIndex(opts, files[file], file);
      index.add(docIndex);
    }
  }
}

//Creates new object to add to the lunr search index
function createDocumentIndex(opts, file, path){
  var contents, index = {};
  if(opts.ref == 'filePath'){
    index.filePath = path;
  }else{
    index[opts.ref] = file[opts.ref];
  }
  for (field in opts.fields){
    if(field === 'contents'){
      if(typeof opts.preprocess === 'function'){
        contents = opts.preprocess.call(file, file.contents.toString());
        index.contents = String(contents);
      }else{
        index.contents = file.contents.toString();
      }
    }else{
      index[field] = file[field];
    }
  }
  // console.log(index);
  return index;
}



//Adds docs to the meta data if docs is flagged to be indexed
function metaDocs(meta, files, opts){
  for (path in files){
    if(files[path].lunr){
      var metaObject = createDocumentMeta(opts, files[path], path);
      meta[path] = metaObject;
    }
  }
}

//Creates new object to add to the meta data
function createDocumentMeta(opts, file, path){
  var metaObject = {};
  
  metaObject.url = path;
 
  for (i in opts.metaFields){
      metaObject[opts.metaFields[i]] = file[opts.metaFields[i]];
  }
  // console.log(metaObject);
  return metaObject;
}

//Adds the data as JSON file to Metalsmith metadata for build
function addJSONtoMetalsmith(data, files, path){
  var contents = new Buffer(JSON.stringify(data));
  files[path] = {contents: contents};
}




function setDefaultOptions(opts){
    opts = opts || {};
    opts.indexPath = opts.indexPath || 'searchIndex.json';
    opts.metaPath = opts.metaPath || 'searchMeta.json';    
    opts.fields = opts.fields || {contents: 1};
    opts.metaFields = opts.metaFields;
    opts.ref = opts.ref || 'filePath';
    opts.pipelineFunctions = opts.pipelineFunctions || [];
    return opts;
}
