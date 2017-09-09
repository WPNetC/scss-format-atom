'use babel';

import ScssLintFormat from './app';
import {
  CompositeDisposable
} from 'atom';

export default {

  scssLintFormat: null,
  subscriptions: null,

  activate(state) {
    let project = atom.project;
    let path = project.rootDirectories[0].realPath;
    this.scssLintFormat = new ScssLintFormat(path);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
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
