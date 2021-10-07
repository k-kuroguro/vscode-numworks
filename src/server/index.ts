import * as express from 'express';
import * as http from 'http';

export class Server {

   private app = express();
   private server?: http.Server;

   constructor(private distPath: string, private port: number = 3000) {
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
