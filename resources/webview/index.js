const vscode = acquireVsCodeApi();
const iframe = document.querySelector('iframe');
let scripts = [];
let isIframeLoaded = false;

const initializeIframe = (scripts) => {
   iframe.contentWindow.postMessage({
      command: 'Initialize',
      scripts
   }, '*');
}

const requestScripts = () => {
   vscode.postMessage({
      command: 'RequestScripts'
   }, '*');
}

iframe.onload = () => {
   isIframeLoaded = true;
   if (scripts && scripts.length) {
      initializeIframe(scripts);
   } else {
      requestScripts();
   }
}

window.addEventListener('message', event => {
   const message = event.data;
   switch (message.command) {
      case 'ReloadIframe':
         iframe.src += '';
         break;
      case 'SendScripts':
         scripts = message.scripts;
         if (isIframeLoaded) {
            initializeIframe(scripts);
         }
         break;
   }
});

document.querySelectorAll('#keyboard span').forEach(span => {
   const eventHandler = isKeyDown => {
      return function (ev) {
         const key = this.getAttribute('data-key');
         iframe.contentWindow.postMessage({
            command: isKeyDown ? 'KeyDown' : 'KeyUp',
            key
         }, '*');
         ev.preventDefault();
      };
   };
   ['touchstart', 'mousedown'].forEach(type => {
      span.addEventListener(type, eventHandler(true));
   });
   ['touchend', 'mouseup'].forEach(type => {
      span.addEventListener(type, eventHandler(false));
   });
});

['keyup', 'keydown', 'keypress'].forEach(type => {
   window.addEventListener(type, event => {
      const toSerializableObj = event => {
         const obj = {};
         for (const key in event) {
            if (['function', 'object'].includes(typeof event[key])) continue;
            obj[key] = event[key];
         }
         return obj;
      };

      iframe.contentWindow.postMessage({
         command: 'PropagateKeyboardEvent',
         event: toSerializableObj(event)
      }, '*');
   });
});
