import * as express from 'express';
import * as http from 'http';
import * as path from 'path';

export class Server {

   private app = express();
   private server?: http.Server;

   constructor(distPath: string, private port: number = 3000) {
      const root = path.join(distPath, 'simulator');

      this.app.use(express.static(root));
      this.app.set('view engine', 'ejs');
      this.app.set('views', root);
      this.app.get('/', (_, res) => res.render('./index.ejs', { pythonOnly: false }));
      this.app.get('/python', (_, res) => res.render('./index.ejs', { pythonOnly: true }));
   }

   isOpened(): boolean {
      return !!this.server;
   }

   open(): void {
      if (!this.isOpened()) this.server = this.app.listen(this.port);
   };

   close(): Promise<void> {
      return new Promise((resolve, reject) => {
         if (this.server) {
            this.server.close(err => {
               if (err) reject(err);
               this.server = undefined;
               resolve();
            });
         }
         resolve();
      });
   };

   dispose(): void {
      this.close();
   }

}
