function readPackage(pkg, context) {
  // Allow all build scripts
  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}

