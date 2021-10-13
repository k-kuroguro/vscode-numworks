window.addEventListener('message', event => {
   const message = event.data;
   switch (message.command) {
      case 'UpdateIframeSource':
         const iframe = document.querySelector('iframe');
         iframe.src = message.source;
         break;
   }
});
