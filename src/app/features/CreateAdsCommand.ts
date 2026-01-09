import { ChannelAds } from "@core/interfaces/channel-ads";
import { Command } from "@nestjs/cqrs";

export class CreateAdsCommand extends Command<void> {
    constructor(
        public channel: 'meta-facebook' | 'meta-instagram' | 'encuentra24',
        public files: string[] | Buffer[],
        public payload: ChannelAds

    ) {
        super();
    }
}