import fs from "fs";
import winston from "winston";
import { AsyncLocalStorage } from 'node:async_hooks';

// Definimos qué queremos guardar (el ID de correlación)
export const storage = new AsyncLocalStorage<Map<string, string>>();

/**
 * Helper para obtener el ID actual en cualquier parte del código
 */
export const getCorrelationID = (): string | undefined => {
  return storage.getStore()?.get('correlationID');
};

if (!fs.existsSync("logs")) fs.mkdirSync("logs");

// Símbolo interno de Winston donde guarda los argumentos extras (el objeto o string original)
const SPLAT = Symbol.for('splat');

const getLogContent = (info: any) => {
  const { timestamp, level, message, context, correlationID, stack } = info;

  const id = correlationID || getCorrelationID();
  const srvText = context ? `[${context}]` : "";
  const reqText = id ? ` (CorrelationID:${id})` : "";

  // 1. Mensaje Principal
  let mainMessage = stack || message;
  if (typeof mainMessage === 'object') {
    mainMessage = JSON.stringify(mainMessage);
  }

  // 2. Metadatos (La corrección está aquí)
  // En lugar de usar "...meta", buscamos los argumentos originales en el SPLAT
  let metaString = "";
  const args = info[SPLAT] || [];

  if (args.length > 0) {
    // Si hay argumentos extra, los procesamos
    metaString = args.map((arg: any) => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg);
      }
      return arg; // Si es un string (tu JSON), lo devolvemos tal cual
    }).join(" ");

    if (metaString) metaString = " " + metaString;
  }
  // Fallback: Si no hay splat pero hay keys raras en info (evitamos el error del índice 0,1,2...)
  else {
    const { timestamp, level, message, context, correlationID, stack, ...rest } = info;
    if (Object.keys(rest).length > 0 && !rest['0']) {
      // Solo lo agregamos si NO parece un string desglosado (que tenga key "0")
      metaString = " " + JSON.stringify(rest);
    }
  }

  return {
    timestamp,
    level,
    srvText,
    reqText,
    mainMessage,
    metaString
  };
};

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, srvText, reqText, mainMessage, metaString } = getLogContent(info);
    return `${timestamp} [${level.toUpperCase()}] ${srvText}${reqText}: ${mainMessage}${metaString}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize(),
  winston.format.splat(), // Necesario para que funcione el Symbol SPLAT
  winston.format.printf((info) => {
    const { timestamp, level, srvText, reqText, mainMessage, metaString } = getLogContent(info);

    const colorSrv = `\x1b[36m${srvText}\x1b[0m`;
    const colorReq = reqText ? ` \x1b[33m${reqText}\x1b[0m` : "";

    return `${timestamp} [${level}]${colorSrv}${colorReq}: ${mainMessage}${metaString}`;
  })
);

export const loggerFactory = (contextName: string) => {
  return winston.createLogger({
    level: "info",
    defaultMeta: { context: contextName },
    transports: [
      new winston.transports.File({
        filename: "logs/errors.log",
        level: "error",
        format: fileFormat,
      }),
      new winston.transports.File({
        filename: "logs/processes.log",
        format: fileFormat
      }),
      new winston.transports.Console({
        format: consoleFormat
      }),
    ],
  });
};