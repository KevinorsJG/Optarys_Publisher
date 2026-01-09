import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import FormData from 'form-data';
import { existsSync, createReadStream } from 'fs';

@Injectable()
export class MetaMarketingService {
    private readonly baseUrl = 'https://graph.facebook.com/v18.0';

    constructor(private readonly httpService: HttpService) { }

    /**
     * Orquestador principal para crear un anuncio completo
     */
    async createFullAd(
        accessToken: string,
        adAccountId: string,
        pageId: string,
        adData: {
            name: string;
            text: string;
            imageUrl: string; // URL o Buffer de la imagen
            link: string;
        },
    ) {
        try {
            // 1. Subir Imagen (suponiendo que recibes un Buffer o Stream)
            const imageHash = await this.uploadImage(accessToken, adAccountId, adData.imageUrl);

            // 2. Crear Campaña
            const campaignId = await this.createCampaign(accessToken, adAccountId, `${adData.name} - Campaign`);

            // 3. Crear AdSet (Conjunto de anuncios)
            const adSetId = await this.createAdSet(accessToken, adAccountId, campaignId, `${adData.name} - AdSet`);

            // 4. Crear Creative (La pieza visual/texto)
            const creativeId = await this.createAdCreative(accessToken, adAccountId, pageId, imageHash, adData.text, adData.link);

            // 5. Crear el Anuncio Final
            const adId = await this.createAd(accessToken, adAccountId, adSetId, creativeId, adData.name);

            return { success: true, adId, campaignId };
        } catch (error) {
            throw new HttpException(
                error.response?.data || 'Error conectando con Meta API',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // --- MÉTODOS PRIVADOS PARA CADA PASO ---

    private async uploadImage(token: string, actId: string, imagePathOrUrl: string): Promise<string> {
        const form = new FormData();

        // If it's a remote URL, let the API fetch it (append as 'url')
        if (/^https?:\/\//i.test(imagePathOrUrl)) {
            form.append('url', imagePathOrUrl);
        } else {
            // Treat as a local file path on this server — send as stream
            if (!existsSync(imagePathOrUrl)) {
                throw new HttpException(`Imagen no encontrada: ${imagePathOrUrl}`, HttpStatus.BAD_REQUEST);
            }
            const stream = createReadStream(imagePathOrUrl);
            form.append('filename', stream);
        }

        form.append('access_token', token);

        const res = await lastValueFrom(
            this.httpService.post(`${this.baseUrl}/act_${actId}/adimages`, form, {
                headers: form.getHeaders(),
            }),
        );
        return res.data.images[Object.keys(res.data.images)[0]].hash;
    }

    private async createCampaign(token: string, actId: string, name: string): Promise<string> {
        const res = await lastValueFrom(
            this.httpService.post(`${this.baseUrl}/act_${actId}/campaigns`, {
                name,
                objective: 'OUTCOME_TRAFFIC',
                status: 'PAUSED',
                special_ad_categories: 'NONE',
                access_token: token,
            }),
        );
        return res.data.id;
    }

    private async createAdSet(token: string, actId: string, campaignId: string, name: string): Promise<string> {
        const res = await lastValueFrom(
            this.httpService.post(`${this.baseUrl}/act_${actId}/adsets`, {
                name,
                campaign_id: campaignId,
                daily_budget: 1000, // 10.00 USD aprox (depende de moneda)
                billing_event: 'IMPRESSIONS',
                optimization_goal: 'REACH',
                targeting: { geo_locations: { countries: ['NI'] } }, // Ejemplo: Nicaragua
                status: 'PAUSED',
                access_token: token,
            }),
        );
        return res.data.id;
    }

    private async createAdCreative(token: string, actId: string, pageId: string, imageHash: string, message: string, link: string): Promise<string> {
        const res = await lastValueFrom(
            this.httpService.post(`${this.baseUrl}/act_${actId}/adcreatives`, {
                name: 'Creative ' + Date.now(),
                object_story_spec: {
                    page_id: pageId,
                    link_data: {
                        image_hash: imageHash,
                        link: link,
                        message: message,
                        call_to_action: { type: 'LEARN_MORE' },
                    },
                },
                access_token: token,
            }),
        );
        return res.data.id;
    }

    private async createAd(token: string, actId: string, adSetId: string, creativeId: string, name: string): Promise<string> {
        const res = await lastValueFrom(
            this.httpService.post(`${this.baseUrl}/act_${actId}/ads`, {
                name,
                adset_id: adSetId,
                creative: { creative_id: creativeId },
                status: 'PAUSED',
                access_token: token,
            }),
        );
        return res.data.id;
    }

    /**
   * Intercambia un token de corta duración por uno de 60 días
   */
    async getLongLivedToken(shortLivedToken: string): Promise<string> {
        const appId = 'TU_APP_ID';
        const appSecret = 'TU_APP_SECRET';

        const res = await lastValueFrom(
            this.httpService.get(`${this.baseUrl}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: appId,
                    client_secret: appSecret,
                    fb_exchange_token: shortLivedToken,
                },
            }),
        );

        return res.data.access_token; // Este es el que guardas en BD
    }
}