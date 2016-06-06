let fs

fs = require('fs-extra')

export default opts => {
  console.log('Cleaning...')
  fs.removeSync('lib')
  return console.log('Done.')
}
