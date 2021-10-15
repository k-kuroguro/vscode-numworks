const iframe = document.querySelector('iframe');

window.addEventListener('message', event => {
   const message = event.data;
   switch (message.command) {
      case 'UpdateIframeSource':
         iframe.src = message.source;
         break;
      case 'ReloadIframe':
         iframe.src += '';
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
