import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsEmail, MinLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export enum Currency {
  USD = 'USD',
  NIO = 'NIO',
}

export enum RealEstateType {
  HOUSE = 'HOUSE',           // Casas
  APARTMENT = 'APARTMENT',   // Apartamentos
  LAND = 'LAND',            // Terrenos / Lotes
  COMMERCIAL = 'COMMERCIAL', // Oficinas / Locales
  FARM = 'FARM'             // Fincas
}

export enum OperationType {
  SALE = 'SALE', // Venta
  RENT = 'RENT'  // Alquiler
}

export enum MeasureUnit {
  SQUARE_METERS = 'M2', // Metros cuadrados
  SQUARE_VARAS = 'V2',  // Varas cuadradas (Muy usado en Nicaragua)
  HECTARES = 'HA',      // Hectáreas
  ACRES = 'AC'          // Acres
}

export class CreateEC24PublicationDto {
  // --- INFORMACIÓN BÁSICA ---
  @ApiProperty({
    description: 'Título llamativo de la propiedad',
    example: 'Casa moderna en Carretera Sur con piscina',
    minLength: 10
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  title: string;

  @ApiProperty({
    description: 'Descripción detallada',
    example: 'Hermosa propiedad de 3 habitaciones, seguridad 24/7...',
    minLength: 20
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  description: string;

  @ApiProperty({
    description: 'Tipo de inmueble',
    enum: RealEstateType,
    example: RealEstateType.HOUSE
  })
  @IsEnum(RealEstateType)
  category: RealEstateType;

  @ApiProperty({
    description: 'Tipo de operación (Venta o Alquiler)',
    enum: OperationType,
    example: OperationType.SALE
  })
  @IsEnum(OperationType)
  operationType: OperationType;

  // --- PRECIO ---
  @ApiProperty({
    description: 'Precio de venta o renta mensual',
    example: 150000,
    type: Number
  })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Moneda',
    enum: Currency,
    example: Currency.USD
  })
  @IsEnum(Currency)
  currency: Currency;

  // --- UBICACIÓN ---
  @ApiProperty({ description: 'Código país', example: 'NI' })
  @IsString()
  @IsNotEmpty()
  countryId: string;

  @ApiProperty({ description: 'Departamento/Región', example: 'managua' })
  @IsString()
  @IsNotEmpty()
  regionId: string;

  @ApiProperty({ description: 'Ciudad/Municipio', required: false, example: 'villa-fontana' })
  @IsString()
  @IsOptional()
  cityId?: string; 

  @ApiProperty({ description: 'Dirección exacta', example: 'Club Terraza 500m al Sur' })
  @IsString()
  @IsNotEmpty()
  address: string;

  // --- CONTACTO ---
  @ApiProperty({ description: 'Nombre contacto', example: 'Maria Gonzales' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({ description: 'Teléfono', example: '8888-8888' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @ApiProperty({ description: 'Email', required: false, example: 'maria@inmobiliaria.com' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ description: 'Whatsapp', required: false, example: '8888-8888' })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  // --- DETALLES DE BIENES RAÍCES (VIVIENDAS Y TERRENOS) ---

  @ApiProperty({
    description: 'Área Construida (Solo edificaciones)',
    required: false,
    type: Number,
    example: 250
  })
  @IsOptional()
  @Type(() => Number)
  builtArea?: number; // Metros de construcción (No aplica a lotes vacíos)

  @ApiProperty({
    description: 'Área del Terreno (Total)',
    required: true,
    type: Number,
    example: 500
  })
  @IsNotEmpty() // Casi siempre obligatorio en Encuentra24
  @Type(() => Number)
  lotArea: number; 

  @ApiProperty({
    description: 'Unidad de medida del terreno',
    enum: MeasureUnit,
    example: MeasureUnit.SQUARE_VARAS
  })
  @IsEnum(MeasureUnit)
  measureUnit: MeasureUnit; // Varas o Metros

  @ApiProperty({
    description: 'Habitaciones (No aplica a Terrenos)',
    required: false,
    type: Number,
    example: 3
  })
  @IsOptional()
  @Type(() => Number)
  bedrooms?: number;

  @ApiProperty({
    description: 'Baños (No aplica a Terrenos)',
    required: false,
    type: Number,
    example: 2.5
  })
  @IsOptional()
  @Type(() => Number)
  bathrooms?: number;

  @ApiProperty({
    description: 'Espacios de estacionamiento',
    required: false,
    type: Number,
    example: 2
  })
  @IsOptional()
  @Type(() => Number)
  parkingSpaces?: number;

  @ApiProperty({
    description: 'Niveles o pisos de la casa',
    required: false,
    type: Number,
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  floors?: number;
}