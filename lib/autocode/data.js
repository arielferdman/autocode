let cson, fs;

cson = require('season');

fs = require('fs');

export default opts => {
  let data, data_file, data_files, data_name, data_path, i, path, results, source;
  console.log('Syncing data...');
  source = opts._[1];
  path = opts._[2] || '.';
  data_path = `src/data/${source}/`;
  data_files = fs.readdirSync(data_path);
  data = {};
  for (i in data_files) {
    data_file = data_files[i];
    data_name = data_file.split('.')[0];
    results = cson.readFileSync(`${data_path}${data_file}`);
    data[data_name] = results;
  }
  return console.log(data);
};
