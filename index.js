'use babel';

import {existsSync, readFileSync} from 'fs';
import {join, relative, dirname, extname} from 'path';
import {exec} from 'child_process';
import {CompositeDisposable} from 'atom';
import mkdirp from 'mkdirp';

const EXEC_TIMEOUT = 60 * 1000; // 1 minute

export default {
  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      this.subscriptions.add(textEditor.onDidSave(this.handleDidSave.bind(this)));
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  handleDidSave(event) {
    let savedFile = event.path;
    const rootDir = dirname(savedFile);
    if (!rootDir) {
      return;
    }
    this.run(savedFile, rootDir);
  },

  run(savedFile, rootDir) {
    const srcFile = savedFile;
    savedFile = relative(rootDir, savedFile);
    const extension = extname(savedFile);
    if (extension !== '.js' && extension !== '.JS') console.log(extension); return;
    const destFile = savedFile.substr(0, savedFile.length - extension.length);

    mkdirp.sync(join(rootDir, dirname(destFile)));
    const command = `uglifyjs ${srcFile} -o ${destFile}.min.js --source-map`;
    const options = {cwd: rootDir, timeout: EXEC_TIMEOUT};

    exec(command, options, (err, stdout, stderr) => {
      const message = 'uglify-on-save';

      const output = stdout.trim();
      if (config.showOutput && output) {
        atom.notifications.addSuccess(message, {detail: output, dismissable: true});
      }

      const error = stderr.trim() || (err && err.message);
      if (config.showError && error) {
        atom.notifications.addError(message, {detail: error, dismissable: true});
      }
    });
  }
};
