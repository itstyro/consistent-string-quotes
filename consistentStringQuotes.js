var
  recursive = require('recursive-readdir'),
  path = require('path'),
  esprima = require('esprima'),
  fs = require('fs'),
  propertiesReader = require('properties-reader'),
  content,
  tokens,
  output,
  properties = propertiesReader('./properties.ini'),
  projectDirectory = properties.path().projectDirectory,
  quotesToReplace = properties.path().quotesToReplace,
  quotesToReplaceWith = properties.path().quotesToReplaceWith;

  recursive(projectDirectory, [ignoreFile], function(err, files) {
  // if a directory cannot be read - say if the directory is empty
  if(err) {
    console.log('You may have an empty directory');
    throw err;
  }

  // iterate over each file to inspect
  files.forEach(function(file, index) {
    output = file;
    console.log('-------------------------');
    console.log('Reading : ', file);
    content = fs.readFileSync(file, 'utf-8'),
    // tokenize the file
      tokens = esprima.parse(content, {
        tokens: true,
        range: true
      }).tokens;
    // iterate over each token
    tokens.forEach(function(token) {
      var str;
      if (token.type === 'String' && token.value[0] !== quotesToReplaceWith) {
        str = convert(token.value); 
        content = content.substring(0, token.range[0]) + str + content.substring(token.range[1], content.length);
      }
      fs.writeFileSync(output, content);
    });
    console.log('Finished : Inspected and rectified');
    console.log('-------------------------');
  });

});

/**
 * determine whether to ignore or include a file in the process
 * @param  {string} file  [file path]
 * @param  {object} stats [carrier file statistics]
 * @return {boolean}       [true if files needs to be ignored , false otherwise]
 */
function ignoreFile(file, stats) {
  if(!stats.isDirectory() && path.extname(file) !== '.js') {
    console.log('Ignoring: ', file);
    return true;
  } 
  return false;
}

/**
 * convert the string literal into selected representation
 * @param  {string} literal [literal to convert]
 * @return {string}         [converted string literal]
 */
function convert(literal) {
  literal = checkForNestedQuotes(literal);
  var result = literal.substring(1, literal.length - 1);
  //result = result.replace(/'/g, '\'');
  return quotesToReplaceWith + result + quotesToReplaceWith;
}

/**
 * if any substring needs to be converted e.g. "what you choose to be 'Now' ?" to 'What you choose to be "Now" ?'
 * @param  {string} literal [needs to be inspected]
 * @return {string}         [converted string]
 */
var checkForNestedQuotes = function mySelf(literal) {
  if(literal.indexOf(quotesToReplaceWith) === -1) {
    return literal;
  } else {
    return mySelf(literal.replace(quotesToReplaceWith,quotesToReplace));
  }
}


