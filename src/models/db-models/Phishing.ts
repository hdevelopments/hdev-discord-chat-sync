import { Channel } from "discord.js"

export default class phishingResponse{
    name: string
    description: string
    category: "phishing" | "safe" | "malware"
}