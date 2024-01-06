const initialize = (scripts) => {
   const screenElement = document.querySelector('canvas');

   const module = {
      arguments: ['--language', window.navigator.language.split('-')[0]],
      canvas: screenElement,
      keyboardListeningElement: screenElement
   };

   if (pythonOnly) {
      module.arguments.push('--open-app');
      module.arguments.push('code');
      module.arguments.push('--code-lock-on-console');
   }

   const scriptNames = scripts.map(script => script.name);
   const scriptContents = scripts.map(script => script.content);
   if (scriptNames.length && scriptContents.length) {
      module.arguments.push('--code-wipe');
      for (let i = 0; i < scripts.length; i++) {
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
};


window.addEventListener('message', event => {
   const message = event.data;
   switch (message.command) {
      case 'Initialize':
         initialize(message.scripts);
         break;
   }
});
