import { CreateEC24PublicationDto } from '@app/features/encuentra24/createPost/dtos/CreateEC24PublicationDto';
import { LogService } from '@core/logger';
import {
    Controller,
    Post,
    Body,
    UseInterceptors,
    UploadedFiles,
    ValidationPipe,
    BadRequestException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePublicationEC24 } from './request/CreatePublicationEC24';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePostEC24Command } from '@app/features/encuentra24/createPost/CreatePostEC24Command';
import { CreateAdsCommand } from '@app/features/CreateAdsCommand';

@Controller('publish')
export class PublishController {

    constructor(
        private readonly logger: LogService,
        private readonly bus: CommandBus
    ) { }

    @Post('encuentra24')
    @UseInterceptors(FilesInterceptor('photos', 10))
    @ApiOperation({ summary: 'Crea una nueva publicación en Encuentra24' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: CreatePublicationEC24 })
    @ApiOperation({ summary: 'Publicar Casa o Terreno' })
    async createPublication(
        @Body(new ValidationPipe({ transform: true })) createPublicationDto: CreateEC24PublicationDto,
        @UploadedFiles() files: Array<Express.Multer.File>
    ) {

        // 1. Validar que vengan imágenes (Encuentra24 suele obligar al menos 1)
        if (!files || files.length === 0) {
            this.logger.error('Intento de publicación sin imágenes');
            throw new BadRequestException('Debes subir al menos una imagen para la publicación');
        }

        this.logger.log(`Creando publicación: "${createPublicationDto.title}" con ${files.length} imágenes`);

        // 2. Procesar las Rutas de los Archivos
        const filePaths = files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        }));

        this.logger.log(`Archivos subidos: ${JSON.stringify(filePaths)}`);

        // 3. AQUÍ IRÍA TU LÓGICA DE NEGOCIO
        // Ejemplo: Guardar en Base de Datos relacionando el DTO con los filePaths
        const result = await this.bus.execute(new CreatePostEC24Command(createPublicationDto, files.map((f => f.path))))


        if (result.isFailure) {
            // Logueamos el error real antes de lanzar la excepción
            this.logger.error(`Error en CommandBus: ${result.getError()}`);
            // Lanzamos la excepción con el mensaje real para que no salga {}
            throw new BadRequestException(result.getError());
        }


        // 4. Retornar respuesta
        return {
            message: 'Publicación creada exitosamente',
            data: {
                taskId: result.getValue().taskId,
                photos: filePaths.map(f => `/uploads/${f.filename}`) // URLs públicas
            }
        };
    }


    @Post('ads')
    @ApiOperation({ summary: 'Crea un anuncio en Meta (Facebook/Instagram) y Encuentra24' })
    @ApiResponse({ status: 201, description: 'Anuncio creado exitosamente.' })
    @ApiResponse({ status: 400, description: 'Solicitud inválida.' })
    @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
    @ApiConsumes('multipart/form-data')
    async createAd(
        @Body(new ValidationPipe({ transform: true })) payload: CreateEC24PublicationDto,
        @UploadedFiles() files: Array<Express.Multer.File>) {

        if (!files || files.length === 0) {
            this.logger.error('Intento de publicación sin imágenes');
            throw new BadRequestException('Debes subir al menos una imagen para la publicación');
        }

        this.logger.log(`Creando publicación: "${payload.title}" con ${files.length} imágenes`);

        // 2. Procesar las Rutas de los Archivos
        const filePaths = files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        }));

        this.logger.log(`Archivos subidos: ${JSON.stringify(filePaths)}`);

        // 3. AQUÍ IRÍA TU LÓGICA DE NEGOCIO
        // Ejemplo: Guardar en Base de Datos relacionando el DTO con los filePaths
        const result = await this.bus.execute(new CreateAdsCommand('meta-facebook', files.map((f => f.path)), payload))

        return {
            message: 'Funcionalidad de creación de anuncios en Meta aún no implementada.'
        };
    }
}