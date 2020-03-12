// vim: set ts=2 sw=2 sts=2 expandtab :
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const sourceHead = '/src/main/java/';

module.exports = register => {
  register('generate:after', generator => {
    const asyncapi = generator.asyncapi;
    let sourcePath = generator.targetDir + sourceHead;
    const info = asyncapi.info();
    let package = generator.templateParams['javaPackage'];
    let generateMessagingClass = false;
    let gen = generator.templateParams['generateMessagingClass'];
    let extensions = info.extensions();

    if (gen === 'true') {
      generateMessagingClass = true;
    }

    if (!package && info && extensions) {
      package = extensions['x-java-package'];
    }

    if (package) {
      //console.log("package: " + package);
      const overridePath = generator.targetDir + sourceHead + package.replace(/\./g, '/') + '/';
      //console.log("Moving files from " + sourcePath + " to " + overridePath);
      let first = true;
      fs.readdirSync(sourcePath).forEach(file => {
        if (first) {
          first = false;
          console.log("Making " + overridePath);
          fs.mkdirSync(overridePath, { recursive: true });
        }

        if ((file != 'Messaging.java') || generateMessagingClass) {
          fs.copyFileSync(path.resolve(sourcePath, file), path.resolve(overridePath, file));
        }
        fs.unlinkSync(path.resolve(sourcePath, file));
      })
      sourcePath = overridePath;
    }

    // Rename the pom file if necessary, and only include Application.java when an app is requested.
    let artifactType = generator.templateParams['artifactType'];

    let mainClassName = "Application";
    let overrideClassName;
    if (extensions && extensions['x-java-class']) {
      overrideClassName = extensions['x-java-class'] + ".java";
    }

    if (artifactType === "library") {
      fs.renameSync(path.resolve(generator.targetDir, "pom.lib"), path.resolve(generator.targetDir, "pom.xml"));
      fs.unlinkSync(path.resolve(generator.targetDir, "pom.app"));
      fs.unlinkSync(path.resolve(sourcePath, "Application.java"));
      //fs.unlinkSync(path.resolve(sourcePath, "ApplicationWithMessaging.java"));
    } else {
      fs.renameSync(path.resolve(generator.targetDir, "pom.app"), path.resolve(generator.targetDir, "pom.xml"));
      fs.unlinkSync(path.resolve(generator.targetDir, "pom.lib"));

      if (overrideClassName) {
        fs.renameSync(path.resolve(sourcePath, "Application.java"), path.resolve(sourcePath, overrideClassName));
      }

      /*
      if (generateMessagingClass) {
        fs.renameSync(path.resolve(sourcePath, "ApplicationWithMessaging.java"), path.resolve(sourcePath, overrideClassName));
      } else {
        fs.unlinkSync(path.resolve(sourcePath, "ApplicationWithMessaging.java"));
      }
      */
    }

    // Rename the README file.
    fs.renameSync(path.resolve(generator.targetDir, "__README.md"), path.resolve(generator.targetDir, "README.md"));

    // Rename schema objects if necessary

    const schemas = asyncapi._json.components.schemas;
    //console.log("schemas: " + JSON.stringify(schemas));

    // this renames schema objects according to the title field. By default we won't do this, we might add this as an option.
    /*
    for (let schema in schemas) {
      let schemaObject = schemas[schema];
      let title = _.upperFirst(schemaObject.title);
      console.log("schema "  + schema + " title: " + title);
      if (title && title != schema) {
        let pathBySchema = path.resolve(sourcePath, schema + ".java");
        let pathByTitle = path.resolve(sourcePath, title + ".java");

        if (fs.existsSync(pathBySchema) && !fs.existsSync(pathByTitle)) {
          fs.renameSync(pathBySchema, pathByTitle);
        }
      }
    }
    */
  })
}

function dump(obj) {
  for (p in obj) {
    console.log(p);
  }
}