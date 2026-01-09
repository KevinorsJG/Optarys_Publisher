// En tu publish.controller.ts

import { CreateEC24PublicationDto } from "@app/features/encuentra24/createPost/dtos/CreateEC24PublicationDto";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePublicationEC24 extends CreateEC24PublicationDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Fotos de la propiedad (Fachada, Interior, Patio...)',
  })
  photos: any[];
}