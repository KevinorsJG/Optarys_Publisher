import { Browser, BrowserContext, Page, Request, Response } from "playwright";
import { CreateEC24PublicationDto, EC24PublicationResponse, OperationType, RealEstateType } from "../dtos";
import { PubCallback, Publisher, Result } from "@core/interfaces";
import { FactoryBrowser } from "@core/factorys";
import { LAUNCH_USER_AGENT } from "@core/constants";
import { Injectable } from "@nestjs/common";

interface EC24Payload {
  data: CreateEC24PublicationDto,
  files: string[] | Buffer[]
}

@Injectable()
export class EC24Service implements Publisher<EC24Payload, any> {
  private readonly proxySettings = {
    server: "http://91.124.253.246:6606",
    username: "smvvjenx",
    password: "z4oh4fro5s9f",
  };

  // Configuración de Resiliencia
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;


  //Método principal 
  async publish(
    params: EC24Payload,
    onProgress?: PubCallback
  ): Promise<Result<EC24PublicationResponse>> {

    // 5% - Inicio
    onProgress?.("🚀 Iniciando motor de navegación...", 5);

    // Usamos el wrapper de retry para toda la operación crítica
    return await this.executeWithRetry(async (attempt) => {

      const isRetry = attempt > 1;
      if (isRetry) {
        onProgress?.(`🔄 Intento ${attempt}/${this.MAX_RETRIES}: Reiniciando contexto...`, 10);
      }

      return await this.runBotLogic(params, onProgress);

    }, onProgress);
  }

  /**
   * EL NÚCLEO DEL PATRÓN RETRY
   * Ejecuta una función, si falla, espera y reintenta.
   */
  private async executeWithRetry<T>(
    operation: (attempt: number) => Promise<T>,
    onProgress?: PubCallback
  ): Promise<Result<T>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Ejecutamos la lógica principal
        const result = await operation(attempt);
        return Result.ok(result);

      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || "Error desconocido";
        console.warn(`⚠️ Intento ${attempt} falló: ${errorMessage}`);

        // Si es el último intento, no esperamos, simplemente fallamos
        if (attempt === this.MAX_RETRIES) {
          onProgress?.(`❌ Error fatal tras ${this.MAX_RETRIES} intentos: ${errorMessage}`, 0);
          throw new Error(onProgress?.arguments)
        }

        // Reportamos el reintento
        onProgress?.(`⚠️ Fallo temporal (${errorMessage}). Reintentando en ${this.RETRY_DELAY_MS / 1000}s...`, 0);

        // Espera (Backoff)
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY_MS));
      }
    }

    // Si salimos del loop, es que agotamos los intentos
    return Result.fail<T>(`Operación fallida tras ${this.MAX_RETRIES} intentos. Último error: ${lastError?.message}`);
  }

  /**
   * Lógica encapsulada del Bot (Lo que se va a reintentar)
   * IMPORTANTE: Abre y cierra su propio contexto para asegurar "Clean State"
   */
  private async runBotLogic(
    params: EC24Payload,
    onProgress?: PubCallback
  ): Promise<any> {
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // 1. Singleton Browser
      browser = await FactoryBrowser();

      // 2. Contexto Aislado
      context = await browser.newContext({
        userAgent: LAUNCH_USER_AGENT,
        proxy: this.proxySettings,
        permissions: ['geolocation'],
        geolocation: { latitude: 12.171216250962518, longitude: -86.3720340785781 },
        viewport: { width: 1280, height: 720 },
      });

      page = await context.newPage();

      // Configuración técnica
      await this.configurePage(page);

      // Lógica de negocio
      await this.performLogin(page, params, onProgress);

      // Éxito
      onProgress?.("✨ Proceso finalizado exitosamente.", 100);

      return

    } catch (err: any) {
      // Tomamos captura del error antes de que el finally cierre el contexto
      if (page && !page.isClosed()) {
        try {
          await page.screenshot({ path: `captures/error_retry_${Date.now()}.png` });
        } catch (e) { console.error("No se pudo tomar screenshot del error"); }
      }
      throw err; // Re-lanzamos para que executeWithRetry lo capture
    } finally {
      // LIMPIEZA CRÍTICA: Cerramos el contexto al terminar (sea éxito o error)
      // Esto garantiza que el siguiente reintento empiece con cookies limpias y sin basura en memoria.
      if (context) await context.close();
      console.log("♻️ Contexto liberado.");
    }
  }

  // --- MÉTODOS PRIVADOS EXISTENTES (Sin cambios mayores) ---

  private async configurePage(page: Page): Promise<void> {
    await page.route("**/*", (route) => {
      const resourceType = route.request().resourceType();
      const url = route.request().url();
      const blockedTypes = ["font"];
      const blockedDomains = [
        "quantcount.com", "onetrust.com", "cookiebot.com", "googletagmanager.com",
      ];

      if (blockedTypes.includes(resourceType) || blockedDomains.some((domain) => url.includes(domain))) {
        route.abort();
      } else {
        route.continue();
      }
    });

    this.registerPageEvents(page);

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });
  }

  private async performLogin(
    page: Page,
    payload: EC24Payload,
    onProgress?: PubCallback
  ): Promise<any> {

    try {
      onProgress?.("🌐 Contactando sitio web...", 20);
      await page.goto("https://www.encuentra24.com/", { timeout: 60000, waitUntil: "domcontentloaded" });

      await this.handleCookiesModal(page);

      onProgress?.("👤 Login...", 30);
      const loginBtn = await page.locator("a[href='/login']").first();
      await loginBtn.click({ force: true });

      onProgress?.("⌨️ Credenciales...", 40);
      const emailInput = page.locator("input#login_email");
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill(payload.data.contactName);

      const passInput = page.locator("input#login_password");
      await passInput.waitFor({ state: 'visible', timeout: 12000 })
      await passInput.fill(payload.data.contactPhone);

      await page.keyboard.press("Enter");

      onProgress?.("⏳ Verificando...", 70);

      await Promise.race([
        page.waitForURL("**/account", { waitUntil: 'commit', timeout: 30000 }),
        page.waitForSelector(".alert-danger", { state: 'visible', timeout: 30000 })
      ]).catch(() => {
        // Capturamos el timeout general para manejarlo abajo
      });

      // Verificación de resultados
      const currentUrl = page.url();

      if (currentUrl.includes('/account')) {
        onProgress?.("✅ Login exitoso. Accediendo al panel...", 60);
        await this.createPublication(page, payload, onProgress)
      } else {
        // Si no estamos en /account, buscamos el error
        const errorAlert = page.locator(".alert-danger");
        if (await errorAlert.isVisible()) {
          const msg = await errorAlert.innerText();
          throw new Error(`Login rechazado: ${msg.trim()}`);
        }

        // Si no hay /account ni error visible, algo falló (posible Captcha o Timeout)
        throw new Error("No se pudo confirmar el inicio de sesión (Posible bloqueo o Timeout)");
      }

    } catch (error) {
      onProgress?.(`❌ Error: ${error.message}`, 0);
      throw error;
    }
  }


  async createPublication(page: Page,
    payload: EC24Payload,
    onProgress?: PubCallback) {
    const postBtn = page.locator('a[href*="/publish"]').first();
    await postBtn.click({ force: true })

    onProgress?.('Iniciando proceso de publicacion', 10)

    const categoryValue = "bienes-raices";
    const subCategoryValue = (payload.data.operationType === OperationType.SALE)
      ? "bienes-raices-venta-de-propiedades"
      : "bienes-raices-alquiler-vacaciones";

    await page.locator(`li[data-value='${categoryValue}']`).click();
    await page.locator(`li[data-value='${subCategoryValue}']`).click();

    let subCategory = "";
    switch (payload.data.category) {
      case RealEstateType.HOUSE:
        subCategory = "casas";
        break;
      case RealEstateType.APARTMENT:
        subCategory = "apartamentos";
        break;
      case RealEstateType.LAND:
        subCategory = "Terrenos y Lotes";
        break;
      case RealEstateType.COMMERCIAL:
        subCategory = "Locales Comerciales";
        break;
      case RealEstateType.FARM:
        subCategory = "Fincas / Quintas";
        break;
      default:
        throw new Error(`Categoría no soportada`);
    }

    await page.locator(`li[data-value='${subCategoryValue.concat('-', subCategory)}']`).click();

    await page.locator("input[value='Continuar']").click();

    await page.locator('#map > div.my_location').click();

    await page.locator('#regionform > div > div.col-md-3.col-sm-3 > button').click();

    await page.locator('#cnad_v_title').fill(payload.data.title);

    await page.locator('#cnad_v_descr').fill(payload.data.description);

    await this.fillDetailsSection(page, payload.data);

    await this.uploadPhotos(page, payload, onProgress);

    await page.locator('body > div.container.ann-mpublish > div.row.stepscroll.step3.active > div.col-md-11.col-sm-11.step > div.step-container > div > div.col-md-4.col-sm-4 > button').click();
  }

  private async fillDetailsSection(page: Page, data: CreateEC24PublicationDto) {

    // 1. Moneda y Precio
    await page.selectOption('#cnad_v_currency', data.currency);
    await page.locator('#cnad_d_price').fill(data.price.toString());

    // 2. Recámaras (Habitaciones)
    if (data.bedrooms !== undefined) {
      // Aseguramos que si es mayor a 15, use el valor "15+"
      const roomsValue = data.bedrooms > 15 ? '15+' : data.bedrooms.toString();
      await page.selectOption('#cnad_v_255_4', roomsValue);
    }

    // 3. Baños
    if (data.bathrooms !== undefined) {
      // Encuentra24 acepta 1, 1.5, 2, 2.5...
      // Validamos que el valor exista en el select, si no, redondeamos al más cercano
      const bathValue = data.bathrooms > 20 ? '20+' : data.bathrooms.toString();
      await page.selectOption('#cnad_v_255_5', bathValue);
    }

    // 4. Estacionamientos (Parking)
    if (data.parkingSpaces !== undefined) {
      const parkingValue = data.parkingSpaces > 10 ? 'Más' : data.parkingSpaces.toString();
      await page.selectOption('#cnad_v_255_23', parkingValue);
    }

    // 5. Área Construida y su Unidad
    if (data.builtArea) {
      await page.locator('#cnad_v_255_7_value').fill(data.builtArea.toString());
      // El HTML que pasaste usa '1' para m² y '0.092903' para ft²
      // Como tu DTO usa SQUARE_METERS, seleccionamos '1'
      await page.selectOption('#cnad_v_255_7_unit', '1');
    }

    // 6. Tipo de Anunciante (Campo obligatorio en tu HTML)
    // Por defecto lo seteamos como Propietario para evitar errores de validación
    await page.selectOption('#cnad_v_255_13', 'Propietario');
  }

  private async uploadPhotos(page: Page, payload: EC24Payload, onProgress?: PubCallback) {
    const { files } = payload;
    onProgress?.("📸 Abriendo el portal de imágenes...", 80);

    try {
      // 1. Abrir el Widget haciendo clic en el slot de Encuentra24
      await page.locator('li.image-available').first().click();

      // 2. Localizar el Iframe de Cloudinary
      // Usamos el selector data-test que aparece en tu HTML
      const frameElement = page.frameLocator('iframe[data-test="uw-iframe"]');

      // 3. Inyectar archivos en el input oculto DENTRO del iframe
      // En el widget de Cloudinary, el input suele estar presente pero oculto
      const cloudinaryInput = frameElement.locator('input[type="file"]');

      // Esperamos a que el iframe cargue su contenido interno
      await cloudinaryInput.waitFor({ state: 'attached', timeout: 15000 });

      await cloudinaryInput.setInputFiles(files as string[]);

      onProgress?.("⏳ Procesando imágenes en la nube...", 85);

      // 4. Hacer clic en el botón "Enviar" (o "Upload") DENTRO del iframe
      await frameElement.locator('button[data-test="queue-done"]').dispatchEvent('click');

      // Esperamos a que el botón sea cliqueable (cuando termina la mini-pre-carga)

      onProgress?.("🚀 Sincronizando con Encuentra24...", 90);

      // 5. Salir del contexto del Iframe y esperar que Encuentra24 reciba las fotos
      // El iframe suele cerrarse solo al terminar, o puedes esperar a que
      // los slots de la página principal cambien de estado.
      await page.waitForSelector('li.image-uploaded', { timeout: 60000 });

    } catch (error) {

      throw new Error("No se pudo completar la subida de imágenes en el Widget");
    }
  }

  private async handleCookiesModal(page: Page): Promise<void> {
    // Lista de selectores probables para el botón de "Aceptar"
    const acceptSelectors = [
      'button.fc-cta-consent.fc-primary-button.',
      'button:has-text("Aceptar")',
      'button:has-text("Aceptar todo")',
      'button:has-text("Accept")',
      'button:has-text("Accept all")',
      '.fc-consent-root .fc-primary-button .fc-dialog-overlay'
    ];

    try {
      // 1. Esperamos a que aparezca cualquier elemento del contenedor del modal
      // con un timeout corto (ej. 5 segundos) para no frenar el script si no sale.
      const consentRoot = page.locator('.fc-consent-root');

      // Solo intentamos hacer clic si el modal se vuelve visible en 5s
      const isVisible = await consentRoot.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        // 2. Buscamos el primer botón que coincida de nuestra lista
        for (const selector of acceptSelectors) {
          const btn = page.locator(selector).first();
          if (await btn.isVisible()) {
            await btn.click();
            console.log(`✅ Cookies aceptadas con: ${selector}`);

            // 3. Esperamos a que el modal desaparezca del DOM antes de seguir
            await consentRoot.waitFor({ state: 'hidden', timeout: 3000 });
            return;
          }
        }
      }
    } catch (error) {
      console.log('⚠️ No se encontró modal de cookies o ya estaba cerrado.');
    }
  }



  /**
   * Registra y monitorea eventos de red, errores y logs de una página de Playwright.
   * @param page Instancia de la página a monitorear
   * @returns La misma instancia de la página con los listeners activos
   */
  private registerPageEvents(page: Page): Page {

    // 1. Monitoreo de Respuestas con Error (HTTP 400+)
    page.on('response', (response: Response) => {
      const status = response.status();
      const url = response.url();

      if (status >= 400) {
        console.error(`[Network Error] status: ${status} | url: ${url}`);
      }
    });

    page.on('request', (request: Request) => {
      const url = request.url();
      if (url.startsWith('http')) {
        console.log(`[HTTP REQ] ${request.method()} | ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
      }
    });

    return page;
  }
}