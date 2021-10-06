const screenElement = document.querySelector('canvas');

const module = {
   // arguments: ["--language", window.navigator.language.split('-')[0], "--code-script", name + ":" + code, "--code-lock-on-console"],
   arguments: ['--language', window.navigator.language.split('-')[0], '--code-lock-on-console'],
   canvas: screenElement,
   keyboardListeningElement: screenElement
};

Epsilon(module);

document.querySelectorAll('#keyboard span').forEach(function (span) {
   function eventHandler(keyHandler) {
      return function (ev) {
         var key = this.getAttribute('data-key');
         keyHandler(key);
         ev.preventDefault();
      };
   }
   ['touchstart', 'mousedown'].forEach(function (type) {
      span.addEventListener(type, eventHandler(module._IonSimulatorKeyboardKeyDown));
   });
   ['touchend', 'mouseup'].forEach(function (type) {
      span.addEventListener(type, eventHandler(module._IonSimulatorKeyboardKeyUp));
   });
});
