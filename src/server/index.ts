import * as express from 'express';
import * as http from 'http';
import * as path from 'path';

export class Server {

   private app = express();
   private port: number = 3000;
   private server?: http.Server;
   private distPath: string;

   constructor(extensionPath: string) {
      this.distPath = path.join(extensionPath, 'dist');

      this.app.use(express.static(this.distPath));
      this.app.get('/', (_, res) => {
         res.sendFile('./simulator.html', { root: this.distPath });
      });
   }

   open() {
      if (!this.server) this.server = this.app.listen(this.port);
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

}
