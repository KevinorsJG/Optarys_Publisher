
import { storage } from '@core/logger/appLogger';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {

  constructor() { }

  use(req: Request, res: Response, next: NextFunction) {
    // 1. Intentar leer de los headers o generar uno nuevo
    const headerName = 'x-correlationID';
    const correlationId = req.headers[headerName]?.toString() || randomUUID();

    // 2. Inyectar el ID en la respuesta para que el cliente lo vea
    res.setHeader(headerName, correlationId);

    // 3. Ejecutar el resto de la app dentro del contexto de AsyncLocalStorage
    const store = new Map().set('correlationID', correlationId);

    // TODO lo que pase dentro de 'run' tendrá acceso al ID vía getCorrelationID()
    storage.run(store, () => next());
  }
}
