import { Inject, Injectable, LoggerService, Optional, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { loggerFactory } from '../appLogger';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT }) // Transient para que cada servicio tenga su propio contextName
export class LogService implements LoggerService {
    private logger: winston.Logger;
    private context: string = 'App';

    constructor(
        @Optional() @Inject(INQUIRER) private readonly inquirer?: any
    ) {
        if (this.inquirer) {
            // Si fue inyectado en una clase (Service, Gateway, etc.)
            this.assignInquirerContext();
        }
        // Inicialización inicial
        this.logger = loggerFactory(this.context);
    }

    private assignInquirerContext() {
        if (typeof this.inquirer === 'string') {
            this.context = this.inquirer;
        } else if (this.inquirer?.constructor?.name && this.inquirer.constructor.name !== 'Object') {
            this.context = this.inquirer.constructor.name;
        }
    }

    setContext(context: string) {
        this.context = context;
        this.logger = loggerFactory(context);
    }

    log(message: any, ...optionalParams: any[]) {
        this.getLogger().info(message, ...optionalParams);
    }

    error(message: any, ...meta) {
        this.getLogger().error(message, meta);
    }

    warn(message: any, ...optionalParams: any[]) {
        this.getLogger().warn(message, ...optionalParams);
    }

    debug(message: any, ...optionalParams: any[]) {
        this.getLogger().debug(message, ...optionalParams);
    }

    private getLogger() {
        if (!this.logger) {
            this.logger = loggerFactory(this.context);
        }
        return this.logger;
    }
}