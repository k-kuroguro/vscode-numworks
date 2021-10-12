const screenElement = document.querySelector('canvas');

const module = {
   arguments: ['--language', window.navigator.language.split('-')[0]],
   canvas: screenElement,
   keyboardListeningElement: screenElement
};

if (pythonOnly) {
   module.arguments.push('--code-lock-on-console');
}

Epsilon(module);

document.querySelectorAll('#keyboard span').forEach(span => {
   const eventHandler = keyHandler => {
      return function (ev) {
         const key = this.getAttribute('data-key');
         keyHandler(key);
         ev.preventDefault();
      };
   };
   ['touchstart', 'mousedown'].forEach(type => {
      span.addEventListener(type, eventHandler(module._IonSimulatorKeyboardKeyDown));
   });
   ['touchend', 'mouseup'].forEach(type => {
      span.addEventListener(type, eventHandler(module._IonSimulatorKeyboardKeyUp));
   });
});
