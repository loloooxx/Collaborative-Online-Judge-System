import { Injectable } from '@angular/core';
import { COLORS } from '../../assets/colors';

declare var io: any;
declare var ace: any;


@Injectable()
export class CollaborationService {
  clientsInfo: Object = {};
  clientNum: number = 0;
  collaborationSocket: any;
  constructor() { }

  init(editor: any, sessionId: string): void {
    this.collaborationSocket = io(window.location.origin, 
                                    {query: 'sessionId= ' + sessionId});
    // this.collaboration_socket.on('message', (message) => {
    //   console.log('message from server: ' + message);
    // })

    // listener for change event(other users make change)
    this.collaborationSocket.on('change', (delta: string) => {
      console.log('collaboration service: editor change by ' + delta);
      delta = JSON.parse(delta);
      editor.lastAppliedChange = delta;
      // apply changes received from server to ace editor
      editor.getSession().getDocument().applyDeltas([delta]);
    });

    // listener for cursorMove events emitted from server
    this.collaborationSocket.on('cursorMove', (cursor: string) => {
      // cursor: row: xxx, column: xxx, socketId: xxx
      console.log('RECEIVED from SERVER cursor move: ' + cursor);
      cursor = JSON.parse(cursor);
      const x = cursor['row'];
      const y = cursor['column'];
      let changeClientId = cursor['socketId'];

      let session = editor.getSession();

      if (changeClientId in this.clientsInfo) {
        // if the changeClientId(socket.id) is already in the clientsInfo
        // remove the original marker
        session.removeMarker(this.clientsInfo[changeClientId]['marker']);
      } else {
        // it's a new client, assign a new color to the new client
        this.clientsInfo[changeClientId] = {};
        let css = document.createElement('style');
        css.type = 'text/css';
        css.innerHTML = '.editor_cursor_' + changeClientId
          + '{ position: absolute; background: ' + COLORS[this.clientNum] + ';'
          + 'z-index: 100; width: 3px !important; }';

        document.body.appendChild(css);
        this.clientNum++;
      }

      // draw a new marker, marker is not supported by ace, we draw a range instead
      // the range is very slim, only 3px, so it looks like a cursor
      let Range = ace.require('ace/range').Range;
      let newMarker = session.addMarker(new Range(x, y, x, y+1),
                                          'editor_cursor_' + changeClientId,
                                           true);
      this.clientsInfo[changeClientId]['marker'] = newMarker;
    });
  }

  // emit change event
  change(delta: string): void {
    this.collaborationSocket.emit('change', delta);
  }

  // emit cursor move event
  cursorMove(cursor: string): void {
    this.collaborationSocket.emit('cursorMove', cursor);
  }

  restoreBuffer(): void {
    this.collaborationSocket.emit('restoreBuffer');
  }

}
