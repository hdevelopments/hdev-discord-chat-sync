export default interface ChannelModel{
        guild: string;
        channel: string;
        category: string;
        configs: {[key: string]: any}
        lastMessages: {[key: string]: number | undefined};
}