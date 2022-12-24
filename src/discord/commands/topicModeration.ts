import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteraction,
  TextChannel,
} from "discord.js";
import {
  Discord,
  SlashGroup,
  Guard,
  Slash,
  SlashOption,
  Guild,
} from "discordx";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";

@Discord()
@SlashGroup({
  description: "Options for Private Chat Topics",
  name: "topic",
  dmPermission: false,
  defaultMemberPermissions: ["ManageChannels", "ManageMessages"],
})
@SlashGroup("topic")
@Guard(noDms)
class topicModeration {
  @Inject()
  private guildConfigService: GuildConfigService;
  @Slash({
    description: "Lets you join your custom Topic.",
  })
  async jointopic(
    @SlashOption({
      description: "The Name of the topic you want to join",
      name: "topic",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    topic: string,
    @SlashOption({
      description: "The Password of the topic!",
      name: "password",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    password: string,
    @SlashOption({
      description: "The channel you want to set to!",
      name: "channel",
      type: ApplicationCommandOptionType.Channel,
      required: true,
      channelTypes: [ChannelType.GuildText],
    })
    channel: TextChannel,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply({ ephemeral: true });
    var foundTopic = await this.guildConfigService.getCategory(topic);
    if (!foundTopic) {
      interaction.editReply("A topic with this name doesnt exists!");
      return;
    }
    if (foundTopic.password === password) {
      var data = await this.guildConfigService.getOrCreate(
        interaction.guildId!
      );
      if (!data.channels) data.channels = {};
      data.channels[channel.id] = {
        category: foundTopic._id.toString(),
        channel: channel.id,
        guild: interaction.guildId!,
        lastMessage: Date.now(),
      };

      await this.guildConfigService.save(data);
      await interaction.editReply(
        `Successfully joined **Private Topic:** ${topic}!`
      );
      return;
    }
    await interaction.editReply(
      `Password is incorrect for **Private Topic:** ${topic}!`
    );
  }

  @Slash({
    description: "Lets you join your custom Topic.",
  })
  async leavetopic(
    @SlashOption({
      description: "The Name of the topic you want to leave",
      name: "topic",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    topic: string,
    channel: TextChannel,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply({ ephemeral: true });
    var data = await this.guildConfigService.getOrCreate(interaction.guildId!);
    if (!data.channels) data.channels = {};
    delete data.channels[channel.id];
    await this.guildConfigService.save(data);
    await interaction.editReply(
      `Successfully joined **Private Topic:** ${topic}!`
    );
    return;
  }

  @Slash({
    description:
      "Lets you create your custom Topic (for your Own Server or so ;) ).",
  })
  async createtopic(
    @SlashOption({
      description: "The Name of the topic you want to create",
      name: "topic",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    topic: string,
    @SlashOption({
      description: "The Password",
      name: "password",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    password: string,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply({ ephemeral: true });
    var foundTopic = await this.guildConfigService.getCategory(topic);
    if (foundTopic) {
      interaction.editReply("A topic with this name exists already!");
      return;
    }
    var createTopic = await this.guildConfigService.getOrCreateCategory(
      topic,
      interaction.member?.user!
    );

    createTopic.password = password;
    await this.guildConfigService.saveCategory(createTopic);

    await interaction.editReply(
      `Successfully created **Private Topic:** ${topic}!`
    );
  }

  @Slash({
    description: "To change the Topics password.",
  })
  async changepassword(
    @SlashOption({
      description: "The Name of the topic you want to edit",
      name: "topic",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    topic: string,
    @SlashOption({
      description: "The new Password",
      name: "password",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    password: string,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply({ ephemeral: true });
    var foundTopic = await this.guildConfigService.getCategory(topic);
    if (!foundTopic || foundTopic.owner != interaction.member?.user.id) {
      interaction.editReply("The topic doesnt or you dont have access to it!");
      return;
    }

    foundTopic.password = password;
    await this.guildConfigService.saveCategory(foundTopic);

    await interaction.editReply(
      `Successfully edited **Private Topic:** ${topic}!`
    );
  }

  @Slash({
    description: "Kick a guild from the topic.",
  })
  async kickguild(
    @SlashOption({
      description: "The Name of the topic you want to edit",
      name: "topic",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    topic: string,
    @SlashOption({
      description: "The Guild you want to kick",
      name: "guild",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    guild: string,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply({ ephemeral: true });
    var foundTopic = await this.guildConfigService.getCategory(topic);
    if (!foundTopic || foundTopic.owner != interaction.member?.user.id) {
      interaction.editReply("The topic doesnt or you dont have access to it!");
      return;
    }

    var foundGuildConfig = await this.guildConfigService.getOrCreate(guild);

    var found = false;
    Object.entries(foundGuildConfig.channels).forEach(([key, value]) => {
      if (foundTopic?._id.toString() === value.category) {
        delete foundGuildConfig.channels[key];
        found = true;
      }
    });
    await this.guildConfigService.save(foundGuildConfig);
    if (!found) {
      interaction.editReply(
        "The interaction was successfull but not synced up channels got deleted!"
      );
      return;
    }

    await interaction.editReply(
      `Successfully removed ${foundGuildConfig.guild} from the **Private Topic:** ${topic}!`
    );
  }
}
