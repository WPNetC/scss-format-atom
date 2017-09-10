'use babel';

import ScssLintFormat from './app';
import {
  CompositeDisposable
} from 'atom';
const find = require('find');

export default {

  config: {
    lintFilePath: {
      type: 'string',
      default: ''
    }
  },
  lintFilePath: null,
  scssLintFormat: null,
  subscriptions: null,

  activate(state) {
    // Try to get lint file path from config or search root dir for it if not set.
    if (this.lintFilePath === null || this.lintFilePath === '') {
      let path = atom.config.get('scss-format-atom.lintFilePath');
      if (!path || path.trim() === '') {
        let project = atom.project;
        let root = project.rootDirectories[0];
        path = root.realPath || root.path;
        if (path) {
          const lintFilePaths = find.fileSync(/scss([-])*lint.yml/i, path);
          if (lintFilePaths.length > 0) {
            path = lintFilePaths[0];
          } else {
            path = '';
          }
        }
        atom.config.set('scss-format-atom.lintFilePath', path);
      }

      this.lintFilePath = path;
    }

    this.scssLintFormat = new ScssLintFormat(this.lintFilePath);
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'scss-format-atom:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.scssLintFormat.destroy();
  },

  serialize() {
    return {
      scssLintFormatState: this.scssLintFormat.serialize()
    };
  },

  toggle() {
    let editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      let lang = editor.getGrammar();
      if (lang.name !== 'SCSS') {
        return;
      }
      let text = editor.getText();
      this.scssLintFormat.run(text, function(result) {
        editor.setText(result);
      });
    }
  }

};
