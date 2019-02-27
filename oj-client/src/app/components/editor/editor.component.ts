import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';


declare var ace: any;
@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {

  editor: any;
  language: string = 'Java';
  languages: string[] = ['Java', 'C++', 'Python'];
  sessionId: string;
  output: string = '';
  defaultContent = {
    'Java': `public class Example {
      public static void main(String[] args) { 
        // Type your code here 
      } 
}`,
    'C++': `#include <iostream>
using namespace std;

int main() {
  // Type your code here
  return 0;
}`,
    'Python': `class Solution:
  def example():
  # Type your code here`

  }
  constructor(@Inject('collaboration') private collaboration,
                private route: ActivatedRoute,
                @Inject('data') private data) { }

  ngOnInit() {

    this.route.params.subscribe((params: Params) => {
      // this.problem = this.data.getProblem(+params['id']);
      this.sessionId = params['id'];
      this.initEditor();
    })


  }

  initEditor(): void {
    this.editor = ace.edit("editor");
    this.editor.setTheme("ace/theme/eclipse");
    this.editor.setFontSize(16);

    this.editor.$blockScrolling = Infinity;

    // this.editor.session.setMode("ace/mode/java");
    // this.editor.setValue(this.defaultContent['Java']);
    this.resetEditor();
    this.collaboration.init(this.editor, this.sessionId);
    this.editor.lastAppliedChange = null;

    // registering change callback
    this.editor.on('change', (e) => {
      console.log('Editor Component: ' + JSON.stringify(e));
      if (this.editor.lastAppliedChange != e) {
        this.collaboration.change(JSON.stringify(e));
      }
    });

    // registering cursor change callback
    this.editor.getSession().getSelection().on('changeCursor', () => {
      let cursor = this.editor.getSession().getSelection().getCursor();
      console.log('CLIENT! CURSOR', JSON.stringify(cursor));
      this.collaboration.cursorMove(JSON.stringify(cursor));
    });

    this.collaboration.restoreBuffer();
  }

  resetEditor(): void {
    console.log('Resetting editor');
    this.editor.getSession().setMode(`ace/mode/${this.language.toLowerCase()}`);
    this.editor.setValue(this.defaultContent[this.language]);
    this.output = '';
  }

  setLanguage(language: string) {
    this.language = language;
    // this.editor.getSession().setMode(`ace/mode/${language.toLowerCase()}`);
    // this.editor.setValue(this.defaultContent[language]);
    this.resetEditor();
  }

  submit() {
    this.output = '';
    let userCodes = this.editor.getValue();
    // console.log('submit...' + "\n" + userCodes);
    const codes = {
      userCodes: userCodes,
      lang: this.language.toLowerCase()
    };
    this.data.buildAndRun(codes)
      .then(res => this.output = res.text);
  }

}
