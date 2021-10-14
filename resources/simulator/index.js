const screenElement = document.querySelector('canvas');

const module = {
   arguments: ['--language', window.navigator.language.split('-')[0]],
   canvas: screenElement,
   keyboardListeningElement: screenElement
};

if (pythonOnly) {
   module.arguments.push('--code-lock-on-console');
}

const params = new URLSearchParams(window.location.search);
const scriptNames = [...params.getAll('scriptName')];
const scriptContents = [...params.getAll('scriptContent')];
if (scriptNames.length && scriptContents.length) {
   module.arguments.push('--code-wipe');
   for (let i = 0; i < Math.min(scriptNames.length, scriptContents.length); i++) {
      module.arguments.push('--code-script');
      module.arguments.push(`${scriptNames[i]}:${scriptContents[i]}`);
   }
}

Epsilon(module);

window.addEventListener('message', event => {
   const message = event.data;
   switch (message.command) {
      case 'KeyDown':
         module._IonSimulatorKeyboardKeyDown(message.key);
         break;
      case 'KeyUp':
         module._IonSimulatorKeyboardKeyUp(message.key);
         break;
      case 'PropagateKeyboardEvent':
         window.dispatchEvent(new KeyboardEvent(message.event.type, message.event));
         break;
   }
});
