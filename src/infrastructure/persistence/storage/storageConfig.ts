import { DynamicModule, Module, Global } from '@nestjs/common';
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@core/logger';

@Global()
@Module({})
export class StorageConfig {
    static register(): DynamicModule {
        return {
            module: StorageConfig,
            imports: [
                MulterModule.registerAsync({
                    inject: [ConfigService, LogService],
                    useFactory(configService: ConfigService, logService: LogService) {
                        logService.setContext('StorageConfig');

                        const uploadPath = configService.get<string>('UPLOAD_PATH', './uploads');

                        if (!existsSync(uploadPath)) {
                            mkdirSync(uploadPath, { recursive: true });
                            logService.log(`Directorio de subida creado en: ${uploadPath}`);
                        }

                        // return {
                        //     // CAMBIO CLAVE: Guardar en memoria RAM
                        //     storage: memoryStorage(), 
                            
                        //     fileFilter: (req, file, callback) => {
                        //         if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                        //             return callback(new Error('Solo se permiten imágenes'), false);
                        //         }
                        //         callback(null, true);
                        //     },
                        //     limits: {
                        //         // OJO: Con memoryStorage, esto consume RAM real del servidor.
                        //         fileSize: configService.get<number>('MAX_FILE_SIZE', 5 * 1024 * 1024),
                        //     }
                        // };

                        return {
                            storage: diskStorage({
                                destination: uploadPath,
                                filename: (req, file, callback) => {
                                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                                    callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
                                },
                            }),
                            fileFilter: (req, file, callback) => {
                                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                                    return callback(new Error('Solo se permiten archivos de imagen (jpg, png, gif)!'), false);
                                }
                                callback(null, true);
                            },
                            limits: {
                                fileSize: 5 * 1024 * 1024, // 5MB
                            }
                        };
                    },
                })
            ],
            exports: [MulterModule]
        };
    }
}